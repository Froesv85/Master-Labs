from app.stage2_bom import BomEngine
from app.stage4_audit import audit


def test_audit_penalizes_empty_bom_and_missing_requirements():
    engine = BomEngine()
    engine.fit([])

    score, flags = audit(
        bom_items=[],
        technical_requirements_count=0,
        confidence_score=0,
        grounding_count=0,
        bom_engine=engine,
    )

    assert score < 100
    assert any("BOM vazia" in f for f in flags)
    assert any("requisito" in f.lower() for f in flags)


def test_audit_scores_well_formed_output_highly():
    engine = BomEngine()
    engine.fit([])

    score, flags = audit(
        bom_items=["ESP32", "Bateria LiPo", "Regulador de tensao", "Sensor DHT22"],
        technical_requirements_count=4,
        confidence_score=90,
        grounding_count=3,
        bom_engine=engine,
    )

    assert score >= 80
    assert not any("BOM vazia" in f or "requisito" in f.lower() for f in flags)


def test_audit_flags_low_confidence_and_no_grounding():
    engine = BomEngine()
    engine.fit([])

    score, flags = audit(
        bom_items=["ESP32"],
        technical_requirements_count=1,
        confidence_score=10,
        grounding_count=0,
        bom_engine=engine,
    )

    assert any("confianca" in f.lower() for f in flags)
    assert any("alucinacao" in f.lower() for f in flags)
    assert score < 100


def test_audit_surfaces_missing_component_flag_from_curated_rule():
    engine = BomEngine()
    engine.fit([])

    score, flags = audit(
        bom_items=["ESP32"],
        technical_requirements_count=1,
        confidence_score=90,
        grounding_count=2,
        bom_engine=engine,
    )

    assert any("peca esquecida" in f.lower() for f in flags)
