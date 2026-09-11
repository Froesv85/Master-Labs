# ml-pipeline — Fase 5 (pipeline de estruturação)

Microsserviço Python (FastAPI + scikit-learn) chamado via HTTP pelo worker BullMQ
(`lib/extraction-queue.ts`) do `maker-connect`. Implementa os 4 estágios descritos no
README principal: classificação prévia, validação/agrupamento de BOM, apoio ao RAG
especializado (filtro de domínio) e auditoria pós-geração.

Lê o mesmo MySQL do Next.js (`DATABASE_URL`) só para leitura, pra treinar/atualizar os
modelos a cada start e via `POST /retrain`. Nunca escreve no banco.

## Rodando local

```bash
cd ml-pipeline
python -m venv .venv
.venv/Scripts/activate        # Windows; source .venv/bin/activate no Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --port 8001
```

Ou via Docker (junto com o resto da infra): `docker compose up -d ml-pipeline` a partir de
`maker-connect/`.

## Testes

```bash
pip install pytest
pytest
```

Os testes usam fixtures (`app.db.CategorySample`, `app.db.BomTransaction`) e não
dependem de um MySQL real.

## Endpoints

| Rota | Uso |
|---|---|
| `GET /health` | liveness check |
| `POST /classify` | estágio 1 — categoria, dificuldade, domínios |
| `POST /validate-bom` | estágio 2 — peças possivelmente esquecidas + cluster de topologia |
| `POST /audit` | estágio 4 — score de auditoria + flags |
| `POST /retrain` | força retreino imediato (sem restart) |

## Limitações de dado conhecidas (honestas, de propósito)

- **Categoria** (`app/stage1_classify.py`): treina um `TfidfVectorizer + MultinomialNB`
  nos rótulos reais de `ProjectTag`, mas hoje só ~20 projetos reais têm `Project.content`
  preenchido (só é preenchido depois que uma extração roda) e são desbalanceados entre as
  4 categorias. Por isso existe um limiar de confiança (`LOW_CONFIDENCE_THRESHOLD = 0.6`)
  que joga pro fallback heurístico por palavra-chave sempre que o modelo não estiver
  claramente confiante — o modelo vai ganhar peso sozinho conforme mais projetos reais
  forem extraídos e taggeados.
- **Dificuldade**: não existe rótulo real no banco (`ProjectDifficulty` está vazia hoje —
  é um log de dificuldades encontradas, não uma nota de dificuldade do projeto). Fica 100%
  heurístico (contagem de sinais técnicos) até existir um rótulo supervisionado real.
- **BOM (estágio 2)**: só ~14 extrações reais concluídas existem hoje pra minerar regras
  de associação (Apriori) — poucas transações pra regras fortes, por isso complementamos
  com um conjunto curado de omissões clássicas do domínio maker/IoT
  (`CURATED_RULES` em `app/stage2_bom.py`). K-Means usa `k=min(3, n_transacoes)`.
- **Auditoria (estágio 4)**: baseada em regras (reaproveita as regras do estágio 2 +
  checagens de consistência), porque não existe ainda auditoria humana rotulada pra
  treinar um classificador supervisionado. Próximo passo natural: `IsolationForest` ou
  classificador supervisionado sobre os mesmos sinais quando esse rótulo existir.

Todos os `[EVAL]...` (projetos de holdout criados por `scripts/rag-eval.mjs`) são
excluídos das consultas de treino em `app/db.py`.
