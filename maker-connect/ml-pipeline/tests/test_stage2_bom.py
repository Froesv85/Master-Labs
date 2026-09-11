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
