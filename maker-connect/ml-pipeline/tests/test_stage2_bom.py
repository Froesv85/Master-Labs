from app.db import BomTransaction
from app.stage2_bom import BomEngine


def test_curated_rule_fires_without_any_trained_transactions():
    engine = BomEngine()
    engine.fit([])  # sem dado real ainda -> so as regras curadas valem

    suggestions = engine.suggest_missing(["ESP32", "DHT22"])
    items = [s[0] for s in suggestions]
    assert "regulador de tensao / bateria" in items


def test_curated_rule_does_not_fire_when_item_already_present():
    engine = BomEngine()
    engine.fit([])

    suggestions = engine.suggest_missing(["ESP32", "Bateria LiPo 3.7V", "Regulador de tensao"])
    items = [s[0] for s in suggestions]
    assert "regulador de tensao / bateria" not in items


def test_cluster_label_is_none_without_training_data():
    engine = BomEngine()
    engine.fit([])
    assert engine.cluster_label(["ESP32", "DHT22"]) is None


def test_cluster_label_returns_string_when_trained():
    transactions = [
        BomTransaction(log_id=1, items=["esp32", "dht22", "mqtt broker"]),
        BomTransaction(log_id=2, items=["esp32", "lora sx1276", "gps neo-6m"]),
        BomTransaction(log_id=3, items=["servo motor", "ponte h l298n", "encoder"]),
    ]
    engine = BomEngine()
    engine.fit(transactions)

    label = engine.cluster_label(["esp32", "dht22", "mqtt broker"])
    assert isinstance(label, str)
    assert label != ""


def test_mined_rule_from_repeated_real_cooccurrence():
    # esp32 + rele aparecem juntos em quase toda transacao -> regra deveria surgir
    transactions = [
        BomTransaction(log_id=i, items=["esp32", "rele", "sensor de corrente"])
        for i in range(6)
    ]
    engine = BomEngine()
    engine.fit(transactions)

    suggestions = engine.suggest_missing(["esp32", "rele"])
    # sensor de corrente deveria ser sugerido como consequente aprendido da regra
    items = [s[0] for s in suggestions]
    assert "sensor de corrente" in items


def test_external_rule_fires_for_portuguese_bom():
    engine = BomEngine()
    engine.fit([])

    suggestions = engine.suggest_missing(["Motor brushless 2212 1000KV", "Bateria LiPo 3S"])
    items = [s[0] for s in suggestions]
    assert "ESC (controlador de velocidade)" in items


def test_external_rule_skipped_when_consequent_present_under_another_name():
    engine = BomEngine()
    engine.fit([])

    suggestions = engine.suggest_missing(["Motor brushless 2212", "Controlador de velocidade 30A"])
    items = [s[0] for s in suggestions]
    assert "ESC (controlador de velocidade)" not in items


def test_external_rule_does_not_duplicate_curated_suggestion():
    # "motor" dispara a regra curada de driver; a regra externa dc motor -> motor driver
    # nao pode criar uma segunda sugestao do mesmo componente com outro nome
    engine = BomEngine()
    engine.fit([])

    suggestions = engine.suggest_missing(["Motor DC N20 6V"])
    items = [s[0] for s in suggestions]
    assert items.count("driver de motor (ponte h)") == 1
    assert "driver de motor (ponte H)" not in items


def test_external_rules_ranked_below_curated_and_capped():
    from app.stage2_bom import ExternalRule

    rules = [ExternalRule(antecedent="hall sensor", consequent="magnet", posts=139, confidence=0.56, lift=22.2)]
    engine = BomEngine(external_rules=rules)
    engine.fit([])

    suggestions = engine.suggest_missing(["Sensor Hall A3144", "ESP32"])
    # curadas (0.6) primeiro; a externa entra depois com a confianca bruta da regra
    assert [s[0] for s in suggestions] == ["regulador de tensao / bateria", "resistor pull-up", "ima"]
    assert suggestions[2][2] == 0.56


def test_engine_works_without_external_rules_file(tmp_path):
    from app.stage2_bom import load_external_rules

    assert load_external_rules(tmp_path / "nao-existe.json") == []


def test_curated_rule_recognizes_synonym_already_in_bom():
    # antes so comparava a 1a palavra ("driver"), entao "Ponte H" na BOM ainda gerava a sugestao
    engine = BomEngine(external_rules=[])
    engine.fit([])

    suggestions = engine.suggest_missing(["Motor DC N20", "Ponte H TB6612FNG", "ESP32", "Fonte 5V 2A"])
    items = [s[0] for s in suggestions]
    assert "driver de motor (ponte h)" not in items
    assert "regulador de tensao / bateria" not in items
