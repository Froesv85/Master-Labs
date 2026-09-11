"""Estagio 1 - Classificacao Previa.

Categoria: Naive Bayes treinado nos rotulos reais (ProjectTag), com fallback
heuristico por palavra-chave quando a confianca do modelo for baixa ou nao
houver dado de treino suficiente ainda ("comeca heuristico/regra e evolui pra
modelos treinados conforme dados reais se acumulam" - README).

Dificuldade e dominio: nao existe rotulo real no banco hoje (ProjectDifficulty
esta vazia), entao ficam heuristicos ate existir dado supervisionado.
"""
import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

from app.db import CategorySample

MIN_TRAINING_SAMPLES = 8
# O dataset real de treino e pequeno e desbalanceado (~20 amostras reais hoje,
# 4 classes, uma delas com so 2 exemplos) - nesse regime o NB frequentemente
# fica "confiante" (>0.4) num palpite errado pra classe minoritaria. Threshold
# alto de proposito: so confia no modelo quando ele realmente se destaca: o
# heuristico por palavra-chave e mais confiavel enquanto o dataset for tao raso.
LOW_CONFIDENCE_THRESHOLD = 0.6

# Mesma taxonomia do enum Category do Prisma (o valor "3D_Printing" e o que o
# MySQL guarda de fato para o membro "Printing3D" por causa do @map no schema).
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "IoT": ["esp32", "esp8266", "wifi", "mqtt", "sensor", "iot", "lora", "ble", "bluetooth", "nuvem", "telegram"],
    "Robotics": ["robo", "servo", "motor dc", "encoder", "ponte h", "l298n", "garra", "braco robotico", "chassi"],
    "3D_Printing": ["impressora 3d", "impressao 3d", "filamento", "pla", "abs", "extrusora", "bico", "fatiador"],
    "Woodworking": ["madeira", "marcenaria", "serra", "torno", "verniz", "compensado", "mdf"],
}

# Mesma taxonomia usada nos metadados do KB no Pinecone (scripts/seed-pinecone.mjs),
# usada pelo estagio 3 como filtro de busca vetorial.
DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "MCU": ["esp32", "esp8266", "arduino", "raspberry", "microcontrolador", "stm32"],
    "Sensor": ["sensor", "dht22", "dht11", "mpu6050", "scd30", "pms5003", "sgp30", "hc-sr04", "ultrassonico",
               "sct-013", "ds18b20", "mq-2", "ph orp"],
    "Protocol": ["mqtt", "modbus", "rs485", "http", "websocket", "lorawan", "lora", "ttn", "json", "rest"],
    "Actuator": ["servo", "rele", "motor", "bomba", "aquecedor", "ventilador", "sirene", "buzzer", "atuador"],
    "PowerMgmt": ["bateria", "lipo", "solar", "sleep", "energia", "supercapacitor", "carregamento", "nimh"],
    "Display": ["display", "lcd", "e-ink", "led rgb", "oled", "tela"],
    "Storage": ["cartao sd", "flash", "memoria", "armazenamento local"],
}

DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced", "expert"]


def _normalize(text: str) -> str:
    return text.lower()


def _keyword_score(text_norm: str, keywords: dict[str, list[str]]) -> dict[str, int]:
    return {label: sum(1 for kw in kws if kw in text_norm) for label, kws in keywords.items()}


def heuristic_category(text_norm: str) -> tuple[str, float]:
    scores = _keyword_score(text_norm, CATEGORY_KEYWORDS)
    best_label = max(scores, key=scores.get)
    best_score = scores[best_label]
    if best_score == 0:
        return "IoT", 0.0  # categoria mais comum no dataset real como fallback final
    total_hits = sum(scores.values()) or 1
    return best_label, round(best_score / total_hits, 2)


class CategoryClassifier:
    def __init__(self):
        self._pipeline: Pipeline | None = None
        self._trained_samples = 0

    def train(self, samples: list[CategorySample]) -> int:
        self._trained_samples = len(samples)
        if len(samples) < MIN_TRAINING_SAMPLES:
            self._pipeline = None
            return self._trained_samples

        texts = [s.text for s in samples]
        labels = [s.category for s in samples]
        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(max_features=2000, ngram_range=(1, 2))),
            ("nb", MultinomialNB()),
        ])
        pipeline.fit(texts, labels)
        self._pipeline = pipeline
        return self._trained_samples

    def predict(self, text: str) -> tuple[str, float, str]:
        text_norm = _normalize(text)
        if self._pipeline is None:
            label, score = heuristic_category(text_norm)
            return label, score, "heuristic"

        proba = self._pipeline.predict_proba([text])[0]
        classes = self._pipeline.classes_
        best_idx = proba.argmax()
        confidence = float(proba[best_idx])
        if confidence < LOW_CONFIDENCE_THRESHOLD:
            label, score = heuristic_category(text_norm)
            return label, score, "heuristic"
        return str(classes[best_idx]), round(confidence, 2), "model"


def predict_domains(text: str) -> list[str]:
    text_norm = _normalize(text)
    scores = _keyword_score(text_norm, DOMAIN_KEYWORDS)
    return sorted([label for label, hits in scores.items() if hits > 0])


_SPLIT_RE = re.compile(r"[,.;\n]")


def predict_difficulty(text: str) -> tuple[str, float]:
    """Heuristico: conta sinais tecnicos distintos (componentes/protocolos/dominios
    citados) e o tamanho do texto. Sem rotulo real no banco ainda para treinar
    supervisionado (ProjectDifficulty esta vazia hoje) - ver ml-pipeline/README.md.
    """
    text_norm = _normalize(text)
    domain_hits = predict_domains(text)
    distinct_signals = len(domain_hits)
    clause_count = len([c for c in _SPLIT_RE.split(text_norm) if c.strip()])

    raw_score = distinct_signals * 1.5 + min(clause_count, 12) * 0.3
    normalized = min(raw_score / 10, 1.0)

    if normalized < 0.25:
        level = "beginner"
    elif normalized < 0.5:
        level = "intermediate"
    elif normalized < 0.75:
        level = "advanced"
    else:
        level = "expert"
    return level, round(normalized, 2)
