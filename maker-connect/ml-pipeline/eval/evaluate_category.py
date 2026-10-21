"""Avalia o classificador de categoria (estagio 1) no conjunto em portugues.

Uso (a partir de ml-pipeline/):  python -m eval.evaluate_category

O conjunto (eval/category_eval_pt.jsonl) tem 80 projetos escritos no formato do app
(titulo + descricao), 20 por categoria, com `labels` (todas as categorias validas),
`primary` (a principal) e `hard` (casos sem palavra-chave obvia ou com armadilha,
como "placa" x "pla"). Acerto = categoria prevista esta em `labels`.

Nao usa banco: o modelo de producao treina em ProjectTag (real) + bootstrap opcional,
e aqui so os CSVs locais de bootstrap estao disponiveis. Variantes cujo CSV nao existe
nesta maquina (data/ fica fora do git) sao puladas.
"""
import json
from collections import Counter
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import ComplementNB, MultinomialNB
from sklearn.pipeline import Pipeline

from app.db import CategorySample
from app.stage1_classify import CategoryClassifier, _normalize, heuristic_category

ROOT = Path(__file__).resolve().parent.parent
EVAL_PATH = ROOT / "eval" / "category_eval_pt.jsonl"
KAGGLE_CSV = ROOT / "data" / "bootstrap_category_training.csv"
HACKADAY_CSV = ROOT / "data" / "external" / "hackaday" / "hackaday_category_training.csv"
CLASSES = ["IoT", "Robotics", "3D_Printing", "Woodworking"]


def load_eval() -> list[dict]:
    with open(EVAL_PATH, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def project_text(item: dict) -> str:
    # mesmo formato que app/db.py monta para o modelo: titulo + descricao
    return f"{item['title']} {item['description']}"


def raw_model(nb, train: pd.DataFrame):
    pipe = Pipeline([("tfidf", TfidfVectorizer(max_features=2000, ngram_range=(1, 2))), ("nb", nb)])
    pipe.fit(train.text, train.category)
    return lambda text: str(pipe.predict([text])[0])


def production_path(train: pd.DataFrame):
    clf = CategoryClassifier()
    clf.train([CategorySample(text=t, category=c) for t, c in zip(train.text, train.category)])
    return lambda text: clf.predict(text)[0]


def score(name: str, predict, items: list[dict]) -> dict:
    preds = [predict(project_text(i)) for i in items]
    hits = [p in i["labels"] for p, i in zip(preds, items)]
    hard = [h for h, i in zip(hits, items) if i["hard"]]
    easy = [h for h, i in zip(hits, items) if not i["hard"]]
    per_class = {c: sum(h for h, i in zip(hits, items) if i["primary"] == c) for c in CLASSES}
    wrong = [(i["id"], p) for p, i, h in zip(preds, items, hits) if not h]
    return {
        "nome": name,
        "acerto": f"{sum(hits)}/{len(hits)}",
        "faceis": f"{sum(easy)}/{len(easy)}",
        "dificeis": f"{sum(hard)}/{len(hard)}",
        **{c: f"{per_class[c]}/20" for c in CLASSES},
        "previsoes": Counter(preds),
        "erros": wrong,
    }


def main() -> None:
    items = load_eval()
    variants = [("heuristica (fallback)", lambda text: heuristic_category(_normalize(text))[0])]

    if KAGGLE_CSV.exists():
        kaggle = pd.read_csv(KAGGLE_CSV)
        variants += [
            ("producao: kaggle + fallback 0.6", production_path(kaggle)),
            ("kaggle MultinomialNB", raw_model(MultinomialNB(), kaggle)),
            ("kaggle ComplementNB", raw_model(ComplementNB(), kaggle)),
        ]
        if HACKADAY_CSV.exists():
            both = pd.concat([kaggle, pd.read_csv(HACKADAY_CSV)[["text", "category"]]])
            variants.append(("kaggle+hackaday ComplementNB", raw_model(ComplementNB(), both)))

    results = [score(name, fn, items) for name, fn in variants]
    table = pd.DataFrame([{k: v for k, v in r.items() if k not in ("previsoes", "erros")} for r in results])
    print(table.to_string(index=False))
    for r in results:
        print(f"\n{r['nome']}: previu {dict(r['previsoes'])}")
        print("  erros:", ", ".join(f"{i}->{p}" for i, p in r["erros"]) or "nenhum")


if __name__ == "__main__":
    main()
