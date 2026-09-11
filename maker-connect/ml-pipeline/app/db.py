"""Read-only access to the MakerConnect MySQL database (managed by Prisma on the Node
side). This service never writes to these tables — it only pulls training data for the
Fase 5 stages and reuses the same DATABASE_URL as the Next.js app.
"""
import json
import os
from dataclasses import dataclass, field

from sqlalchemy import create_engine, text

EVAL_PREFIX = "[EVAL]%"


def _sqlalchemy_url() -> str:
    raw = os.environ.get("DATABASE_URL", "mysql://root:root@localhost:3307/maker")
    # Prisma uses the bare "mysql://" scheme; SQLAlchemy needs a driver name.
    if raw.startswith("mysql://"):
        return "mysql+pymysql://" + raw[len("mysql://"):]
    return raw


_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(_sqlalchemy_url(), pool_pre_ping=True)
    return _engine


@dataclass
class CategorySample:
    text: str
    category: str


def load_category_training_data() -> list[CategorySample]:
    """Real (title + description + content) -> Category label pairs, from ProjectTag.
    Excludes throwaway [EVAL] projects created by scripts/rag-eval.mjs holdout runs.
    """
    query = text(
        """
        SELECT p.title AS title, p.description AS description, p.content AS content,
               pt.tag AS category
        FROM Project p
        INNER JOIN ProjectTag pt ON pt.projectId = p.id
        WHERE p.title NOT LIKE :eval_prefix
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(query, {"eval_prefix": EVAL_PREFIX}).mappings().all()

    samples = []
    for row in rows:
        parts = [row["title"] or "", row["description"] or "", row["content"] or ""]
        text_blob = " ".join(p for p in parts if p).strip()
        if text_blob and row["category"]:
            samples.append(CategorySample(text=text_blob, category=row["category"]))
    return samples


@dataclass
class BomTransaction:
    log_id: int
    items: list[str] = field(default_factory=list)


def load_real_bom_transactions() -> list[BomTransaction]:
    """suggestedBOM item names from real (non-[EVAL]) completed extraction logs, treated
    as "transactions" for Apriori/K-Means. Small on purpose — see ml-pipeline/README.md.
    """
    query = text(
        """
        SELECT l.id AS id, l.output AS output
        FROM ProjectExtractionLog l
        INNER JOIN Project p ON p.id = l.projectId
        WHERE l.status = 'done'
          AND l.output IS NOT NULL
          AND p.title NOT LIKE :eval_prefix
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(query, {"eval_prefix": EVAL_PREFIX}).mappings().all()

    transactions = []
    for row in rows:
        try:
            output = json.loads(row["output"])
        except (TypeError, ValueError):
            continue
        bom = output.get("suggestedBOM") if isinstance(output, dict) else None
        if not isinstance(bom, list):
            continue
        items = [
            str(item.get("item", "")).strip().lower()
            for item in bom
            if isinstance(item, dict) and str(item.get("item", "")).strip()
        ]
        if items:
            transactions.append(BomTransaction(log_id=row["id"], items=items))
    return transactions
