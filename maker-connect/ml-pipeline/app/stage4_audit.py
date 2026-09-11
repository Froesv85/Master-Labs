"""Estagio 4 - Auditoria Pos-Geracao.

Ainda nao existe auditoria humana rotulada no banco para treinar um
classificador supervisionado, entao esse estagio comeca como um classificador
baseado em regras (reaproveitando as regras de associacao do estagio 2) que
audita a saida gerada contra a BOM e os requisitos. Proximo passo natural
quando houver rotulo real: IsolationForest / classificador supervisionado
sobre os mesmos sinais (ver ml-pipeline/README.md).
"""
from app.stage2_bom import BomEngine

MAX_MISSING_DEDUCTION = 20


def audit(
    bom_items: list[str],
    technical_requirements_count: int,
    confidence_score: float,
    grounding_count: int,
    bom_engine: BomEngine,
) -> tuple[int, list[str]]:
    score = 100
    flags: list[str] = []

    if not bom_items:
        score -= 30
        flags.append("BOM vazia ou nao gerada")

    if technical_requirements_count == 0:
        score -= 20
        flags.append("Nenhum requisito tecnico gerado")

    if bom_items and technical_requirements_count and abs(len(bom_items) - technical_requirements_count) > 3:
        score -= 10
        flags.append("Descompasso entre quantidade de itens da BOM e de requisitos tecnicos")

    if confidence_score < 50:
        score -= 15
        flags.append(f"Confianca baixa do modelo generativo ({confidence_score:.0f})")

    if grounding_count == 0:
        score -= 20
        flags.append("Nenhuma evidencia RAG recuperada — risco de alucinacao tecnica")

    missing = bom_engine.suggest_missing(bom_items)
    if missing:
        deduction_per_item = MAX_MISSING_DEDUCTION / max(len(missing), 1)
        for item, reason, confidence in missing:
            score -= round(deduction_per_item * confidence)
            flags.append(f"Possivel peca esquecida: {item} ({reason})")

    return max(0, min(100, score)), flags
