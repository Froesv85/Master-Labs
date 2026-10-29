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

## Dados de treino

| Variável | Efeito |
|---|---|
| `DATABASE_URL` | lê `ProjectTag` (categoria) e as BOMs das extrações concluídas, sempre sem os projetos `[EVAL]` |
| `USE_BOOTSTRAP_TRAINING=1` | soma ao treino de categoria os 11.362 títulos do Instructables em `data/bootstrap_category_training.csv` (origem e licença em `data/README.md`). Sem o arquivo, a flag não tem efeito |

O `data/` fica fora do git e da imagem Docker. Em produção ele entra por volume
(`./data/ml-pipeline:/srv/data` no compose), que é o caminho que `app/db.py` procura.

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
  Uma terceira fonte são as **regras externas** (`app/external_bom_rules.json`):
  co-ocorrência de componentes em 54.599 artigos da Hackaday, só como estatística
  agregada (contagem, confiança, lift — nenhum texto). Artigo não é BOM completa, então
  a confiança bruta é baixa (0,07–0,56); a regra existe porque o lift é alto (>= 4) e o
  consequente é uma peça de apoio do antecedente (ESC para brushless, carregador para
  18650…). Elas entram com a própria confiança, abaixo das curadas (0,6). Geradas por
  `data/external/hackaday/build_derived.py` (local-only, ver o README de lá).
  `app/components.py` leva os itens da BOM (PT, texto livre) e as regras (EN) para o
  mesmo nome canônico — "Ponte H TB6612FNG" e "motor driver" viram a mesma coisa.
- **Auditoria (estágio 4)**: baseada em regras (reaproveita as regras do estágio 2 +
  checagens de consistência), porque não existe ainda auditoria humana rotulada pra
  treinar um classificador supervisionado. Próximo passo natural: `IsolationForest` ou
  classificador supervisionado sobre os mesmos sinais quando esse rótulo existir.

Todos os `[EVAL]...` (projetos de holdout criados por `scripts/rag-eval.mjs`) são
excluídos das consultas de treino em `app/db.py`.

## Avaliação de categoria em português

```bash
python -m eval.evaluate_category
```

`eval/category_eval_pt.jsonl`: 80 projetos no formato do app (título + descrição), 20 por
categoria, com 13 casos difíceis marcados (`hard`) — sem palavra-chave óbvia ou com
armadilha ("placa" x "pla", "resina epóxi" em marcenaria). Escritos para este fim, não
vêm de usuários reais: servem para comparar mudanças, não como número absoluto.
Substituir/ampliar com projetos reais rotulados conforme aparecerem.

Resultado em 21/10/2026 (acerto = categoria prevista está entre as válidas):

| Variante | Acerto | Difíceis |
|---|---|---|
| produção antes da correção de acento/palavra inteira | 43/80 | 5/13 |
| **produção atual** (Kaggle + fallback 0,6) | **50/80** | 7/13 |
| só Kaggle, sem fallback | 34/80 | 6/13 |
| Kaggle + Hackaday (ComplementNB), sem fallback | 37/80 | 5/13 |

Validação cruzada no próprio dataset de treino (Kaggle, 11.362 títulos,
`StratifiedKFold(5, shuffle=True, random_state=42)`, mesmo pipeline TF-IDF + MultinomialNB
de produção), em 27/10/2026:

| Classe | Precisão | Revocação | F1 |
|---|---|---|---|
| IoT | 0,745 | 0,746 | 0,745 |
| Robotics | 0,778 | 0,699 | 0,737 |
| 3D_Printing | 0,720 | 0,731 | 0,726 |
| Woodworking | 0,784 | 0,832 | 0,807 |
| **Macro** | 0,757 | 0,752 | **0,754** (acurácia 0,755) |

A diferença para os 34/80 do modelo isolado em português mede a mudança de domínio
(títulos curtos em inglês x descrições em português), não um defeito do modelo.

Em produção o modelo só decide 8 dos 80 casos (nos outros não passa de 0,6 e cai no
fallback), porque foi treinado em inglês. Os pontos fracos são Robotics (11/20) e
3D_Printing (9/20): o fallback desempata a favor de IoT.
