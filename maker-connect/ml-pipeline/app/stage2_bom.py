"""Estagio 2 - Validacao & Agrupamento.

K-Means agrupa BOMs por similaridade de texto (topologia parecida). Apriori
minera regras de associacao ("quem tem X costuma ter Y") sobre as BOMs reais
para sinalizar peca provavelmente esquecida. Com poucas transacoes reais hoje
(ver ml-pipeline/README.md) as regras minadas tendem a ser poucas/fracas, por
isso complementamos com um conjunto curado de omissoes classicas - o mesmo
padrao "heuristico agora, aprende sozinho conforme mais dado real chega".
"""
import json
from dataclasses import dataclass
from pathlib import Path

import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

from app.components import canonical_items, display_name
from app.db import BomTransaction

MIN_TRANSACTIONS_FOR_RULES = 5
EXTERNAL_RULES_PATH = Path(__file__).resolve().parent / "external_bom_rules.json"
MIN_SUPPORT_FLOOR = 0.15

# Omissoes classicas conhecidas do dominio maker/IoT, usadas enquanto o dado real
# nao e suficiente para minerar regras de associacao confiaveis sozinhas.
CURATED_RULES: list[tuple[list[str], str, str]] = [
    (["esp32"], "regulador de tensao / bateria", "ESP32 sem fonte de energia dedicada listada na BOM"),
    (["esp8266"], "regulador de tensao / bateria", "ESP8266 sem fonte de energia dedicada listada na BOM"),
    (["rele"], "diodo de protecao (flyback)", "Rele sem diodo de protecao contra pico de tensao indutivo"),
    (["motor"], "driver de motor (ponte h)", "Motor listado sem driver/ponte H para controle de corrente"),
    (["sensor"], "resistor pull-up", "Sensor digital sem resistor pull-up mencionado (comum em 1-wire/I2C)"),
]


@dataclass
class MinedRule:
    antecedent: frozenset
    consequent: str
    confidence: float


@dataclass
class ExternalRule:
    """Co-ocorrencia minerada fora do produto (artigos da Hackaday), em nomes canonicos
    de app/components.py. Gerada por ml-pipeline/data/external/hackaday/build_derived.py.
    Artigo nao e BOM completa, entao a confianca bruta e baixa; a regra so existe porque
    o lift e alto e o consequente e uma peca de apoio do antecedente.
    """
    antecedent: str
    consequent: str
    posts: int
    confidence: float
    lift: float


def load_external_rules(path: Path = EXTERNAL_RULES_PATH) -> list[ExternalRule]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return [ExternalRule(**rule) for rule in data.get("rules", [])]


class BomEngine:
    def __init__(self, external_rules: list[ExternalRule] | None = None):
        self._external_rules = load_external_rules() if external_rules is None else external_rules
        self._rules: list[MinedRule] = []
        self._vectorizer: TfidfVectorizer | None = None
        self._kmeans: KMeans | None = None
        self._cluster_labels: dict[int, str] = {}
        self._trained_transactions = 0

    def fit(self, transactions: list[BomTransaction]) -> int:
        self._trained_transactions = len(transactions)
        self._fit_rules(transactions)
        self._fit_clusters(transactions)
        return self._trained_transactions

    def _fit_rules(self, transactions: list[BomTransaction]) -> None:
        self._rules = []
        if len(transactions) < MIN_TRANSACTIONS_FOR_RULES:
            return

        baskets = [t.items for t in transactions]
        encoder = TransactionEncoder()
        encoded = encoder.fit(baskets).transform(baskets)
        df = pd.DataFrame(encoded, columns=encoder.columns_)

        min_support = max(MIN_SUPPORT_FLOOR, 2 / len(transactions))
        frequent = apriori(df, min_support=min_support, use_colnames=True)
        if frequent.empty:
            return

        rules = association_rules(frequent, metric="confidence", min_threshold=0.5, num_itemsets=len(frequent))
        for _, row in rules.iterrows():
            consequents = list(row["consequents"])
            if len(consequents) != 1:
                continue
            self._rules.append(MinedRule(
                antecedent=frozenset(row["antecedents"]),
                consequent=consequents[0],
                confidence=float(row["confidence"]),
            ))

    def _fit_clusters(self, transactions: list[BomTransaction]) -> None:
        self._vectorizer = None
        self._kmeans = None
        if not transactions:
            return

        docs = [" ".join(t.items) for t in transactions]
        k = min(3, len(transactions))
        if k < 1:
            return

        vectorizer = TfidfVectorizer(max_features=500)
        matrix = vectorizer.fit_transform(docs)
        kmeans = KMeans(n_clusters=k, n_init=10, random_state=42)
        assignments = kmeans.fit_predict(matrix)

        terms = vectorizer.get_feature_names_out()
        for cluster_id in range(k):
            centroid = kmeans.cluster_centers_[cluster_id]
            top_terms = [terms[i] for i in centroid.argsort()[::-1][:3] if centroid[i] > 0]
            self._cluster_labels[cluster_id] = "-".join(top_terms) if top_terms else f"cluster-{cluster_id}"

        self._vectorizer = vectorizer
        self._kmeans = kmeans
        _ = assignments  # only needed centroids/labels above

    def cluster_label(self, items: list[str]) -> str | None:
        if not self._vectorizer or not self._kmeans or not items:
            return None
        vector = self._vectorizer.transform([" ".join(items)])
        cluster_id = int(self._kmeans.predict(vector)[0])
        return self._cluster_labels.get(cluster_id)

    def suggest_missing(self, items: list[str]) -> list[tuple[str, str, float]]:
        items_norm = {i.strip().lower() for i in items if i.strip()}
        suggestions: dict[str, tuple[str, float]] = {}

        for rule in self._rules:
            if rule.antecedent.issubset(items_norm) and rule.consequent not in items_norm:
                existing = suggestions.get(rule.consequent)
                if not existing or rule.confidence > existing[1]:
                    suggestions[rule.consequent] = ("Regra de associacao aprendida dos dados reais", rule.confidence)

        present = canonical_items(items)
        for antecedent_keywords, missing_item, reason in CURATED_RULES:
            has_antecedent = any(
                any(kw in item for item in items_norm) for kw in antecedent_keywords
            )
            # "Ponte H TB6612FNG" ja satisfaz "driver de motor": compara pelo nome canonico tambem
            already_present = any(missing_item.split(" ")[0] in item for item in items_norm) or bool(
                canonical_items([missing_item]) & present
            )
            if has_antecedent and not already_present and missing_item not in suggestions:
                suggestions[missing_item] = (reason, 0.6)

        already_suggested = canonical_items(list(suggestions))
        for rule in self._external_rules:
            if rule.antecedent not in present or rule.consequent in present | already_suggested:
                continue
            name = display_name(rule.consequent)
            if name in suggestions and suggestions[name][1] >= rule.confidence:
                continue
            reason = (
                f"Em {rule.posts} projetos publicados com {display_name(rule.antecedent)}, "
                f"{name} aparece {rule.lift:.0f}x mais que o esperado"
            )
            suggestions[name] = (reason, rule.confidence)

        ranked = sorted(suggestions.items(), key=lambda kv: kv[1][1], reverse=True)[:5]
        return [(item, reason, confidence) for item, (reason, confidence) in ranked]
