from app.db import CategorySample
from app.stage1_classify import (
    DIFFICULTY_LEVELS,
    CategoryClassifier,
    heuristic_category,
    predict_difficulty,
    predict_domains,
)


def test_heuristic_category_matches_obvious_keywords():
    label, score = heuristic_category("impressora 3d com filamento pla e bico de latao")
    assert label == "3D_Printing"
    assert score > 0


def test_heuristic_category_defaults_to_iot_when_no_signal():
    label, score = heuristic_category("um texto qualquer sem termos tecnicos")
    assert label == "IoT"
    assert score == 0.0


def test_classifier_falls_back_to_heuristic_below_min_samples():
    clf = CategoryClassifier()
    clf.train([CategorySample(text="robo com servo motor", category="Robotics")])

    label, score, source = clf.predict("robo com garra e servo motor")
    assert source == "heuristic"
    assert label == "Robotics"


def test_classifier_trains_and_predicts_with_enough_samples():
    samples = [
        CategorySample(text="estacao meteorologica esp32 wifi sensor dht22 mqtt", category="IoT"),
        CategorySample(text="rastreador lora gps esp32 bateria mqtt nuvem", category="IoT"),
        CategorySample(text="monitor ar sensor co2 ble esp32 iot", category="IoT"),
        CategorySample(text="gateway modbus mqtt esp32 iot industrial", category="IoT"),
        CategorySample(text="robo seguidor de linha servo motor dc encoder chassi", category="Robotics"),
        CategorySample(text="braco robotico garra servo motor ponte h l298n", category="Robotics"),
        CategorySample(text="impressora 3d filamento pla extrusora bico fatiador", category="3D_Printing"),
        CategorySample(text="mesa de marcenaria madeira serra torno verniz", category="Woodworking"),
    ]
    clf = CategoryClassifier()
    trained = clf.train(samples)
    assert trained == len(samples)

    label, confidence, source = clf.predict("robo com servo motor dc e encoder e chassi impresso")
    assert label in {"IoT", "Robotics", "3D_Printing", "Woodworking"}
    assert 0 <= confidence <= 1
    assert source in {"model", "heuristic"}


def test_predict_domains_detects_known_keywords():
    domains = predict_domains("ESP32 com sensor DHT22 publicando via MQTT com rele e bateria LiPo")
    assert "MCU" in domains
    assert "Sensor" in domains
    assert "Protocol" in domains
    assert "Actuator" in domains
    assert "PowerMgmt" in domains


def test_predict_difficulty_returns_known_level():
    level, score = predict_difficulty("projeto simples com um sensor")
    assert level in DIFFICULTY_LEVELS
    assert 0 <= score <= 1


def test_low_confidence_model_prediction_falls_back_to_heuristic():
    # Regressao: com poucas amostras reais e classes desbalanceadas, o NB pode ficar
    # "confiante o suficiente" (ex.: 0.44) numa classe errada pra um caso obvio.
    # LOW_CONFIDENCE_THRESHOLD alto o bastante deve forcar o heuristico a decidir aqui.
    samples = [
        CategorySample(text=f"robo seguidor de linha servo motor encoder {i}", category="Robotics")
        for i in range(9)
    ] + [
        CategorySample(text=f"estacao iot esp32 wifi mqtt sensor {i}", category="IoT")
        for i in range(5)
    ] + [
        CategorySample(text="mesa marcenaria madeira serra torno verniz", category="Woodworking"),
        CategorySample(text="banco madeira compensado verniz marcenaria", category="Woodworking"),
        CategorySample(text="armario mdf madeira serra acabamento", category="Woodworking"),
        CategorySample(text="prateleira madeira torno verniz marcenaria", category="Woodworking"),
    ]
    clf = CategoryClassifier()
    clf.train(samples)

    label, _, _ = clf.predict(
        "Projeto de mesa em madeira maciça usando serra circular, torno e verniz de acabamento."
    )
    assert label == "Woodworking"


def test_predict_difficulty_increases_with_more_technical_signals():
    _, simple_score = predict_difficulty("sensor de temperatura basico")
    _, complex_score = predict_difficulty(
        "gateway modbus rs485 com esp32, mqtt, display e-ink, cartao sd, bateria lipo, "
        "rele, sensor de corrente e watchdog de hardware para reinicio automatico"
    )
    assert complex_score >= simple_score
