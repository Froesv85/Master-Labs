import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db import load_category_training_data, load_real_bom_transactions
from app.schemas import (
    AuditRequest,
    AuditResponse,
    ClassifyRequest,
    ClassifyResponse,
    MissingSuggestion,
    RetrainResponse,
    ValidateBomRequest,
    ValidateBomResponse,
)
from app.stage1_classify import CategoryClassifier, predict_difficulty, predict_domains
from app.stage2_bom import BomEngine
from app.stage4_audit import audit

logger = logging.getLogger("ml-pipeline")

_classifier = CategoryClassifier()
_bom_engine = BomEngine()


def _train_all() -> RetrainResponse:
    category_samples = load_category_training_data()
    bom_transactions = load_real_bom_transactions()
    trained_category = _classifier.train(category_samples)
    trained_bom = _bom_engine.fit(bom_transactions)
    logger.info("Trained: %d category samples, %d BOM transactions", trained_category, trained_bom)
    return RetrainResponse(categorySamples=trained_category, bomTransactions=trained_bom)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        _train_all()
    except Exception:
        logger.exception("Initial training failed — stages fall back to heuristics only")
    yield


app = FastAPI(title="MakerConnect ML Pipeline — Fase 5", lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/retrain", response_model=RetrainResponse)
def retrain() -> RetrainResponse:
    return _train_all()


@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest) -> ClassifyResponse:
    text = " ".join(p for p in [req.title, req.description, req.content] if p)
    category, confidence, source = _classifier.predict(text)
    difficulty, difficulty_score = predict_difficulty(text)
    domains = predict_domains(text)
    return ClassifyResponse(
        category=category,
        categoryConfidence=confidence,
        categorySource=source,
        difficulty=difficulty,
        difficultyScore=difficulty_score,
        domains=domains,
    )


@app.post("/validate-bom", response_model=ValidateBomResponse)
def validate_bom(req: ValidateBomRequest) -> ValidateBomResponse:
    item_names = [i.item for i in req.items]
    suggestions = _bom_engine.suggest_missing(item_names)
    cluster_label = _bom_engine.cluster_label(item_names)
    return ValidateBomResponse(
        missingSuggestions=[
            MissingSuggestion(item=item, reason=reason, confidence=confidence)
            for item, reason, confidence in suggestions
        ],
        clusterLabel=cluster_label,
    )


@app.post("/audit", response_model=AuditResponse)
def audit_output(req: AuditRequest) -> AuditResponse:
    item_names = [i.item for i in req.bom]
    score, flags = audit(
        bom_items=item_names,
        technical_requirements_count=req.technicalRequirementsCount,
        confidence_score=req.confidenceScore,
        grounding_count=req.groundingCount,
        bom_engine=_bom_engine,
    )
    return AuditResponse(auditScore=score, flags=flags)
