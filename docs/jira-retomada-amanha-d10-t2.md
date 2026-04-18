# Pacote de retomada - D10-T2 (2026-04-18)

Objetivo: aplicar update de Jira/Kanban rapidamente amanha, sem fechar card antes do gate tecnico.

## Gate obrigatorio antes de atualizar Jira
Aplicar o CSV de fechamento somente se TODAS as condicoes abaixo forem verdadeiras no rerun estendido mais recente:
- total=5
- done=5
- queued=0
- failed=0
- allDone=true

Se qualquer condicao falhar, manter ML-56 em In Progress e registrar novo comentario com evidencia.

## Artefatos preparados
- CSV de fechamento condicional: docs/jira-kanban-update-d10-t2-retomada-normalizado-2026-04-18.csv
- Evidencia base atual: maker-connect/docs/d10-t2-smoke-extended-result-r5.json
- Consolidacao tecnica: docs/d10-t2-estabilidade-fluxo-2026-04-17.md

## Estado atual (atualizado)
- Snapshot mais recente: r5
- Resultado: total=5, done=0, queued=5, failed=0, allDone=false
- Acao: manter ML-56 em `In Progress` e nao aplicar CSV de fechamento.

## Execucao rapida (PowerShell)
1) Dry-run

```powershell
Set-Location "c:\Users\ViniciusFroes\OneDrive - A3C Tecnologia\Area de Trabalho\7 Semestre\PAC\Master-Labs-main"
.\scripts\update-jira-statuses.ps1 \
  -JiraBaseUrl "https://catolicasc-team-ra944io4.atlassian.net" \
  -JiraEmail "vinicius.froes@catolicasc.edu.br" \
  -JiraApiToken "<TOKEN>" \
  -ProjectKey "ML" \
  -CsvPath ".\docs\jira-kanban-update-d10-t2-retomada-normalizado-2026-04-18.csv" \
  -DryRun
```

2) Execucao real (somente com gate atendido)

```powershell
Set-Location "c:\Users\ViniciusFroes\OneDrive - A3C Tecnologia\Area de Trabalho\7 Semestre\PAC\Master-Labs-main"
.\scripts\update-jira-statuses.ps1 \
  -JiraBaseUrl "https://catolicasc-team-ra944io4.atlassian.net" \
  -JiraEmail "vinicius.froes@catolicasc.edu.br" \
  -JiraApiToken "<TOKEN>" \
  -ProjectKey "ML" \
  -CsvPath ".\docs\jira-kanban-update-d10-t2-retomada-normalizado-2026-04-18.csv"
```

## Checklist de 2 minutos
- Validar snapshot canonico novo com allDone=true.
- Atualizar comentario do CSV com nome do arquivo novo (<novo>) antes da execucao real.
- Rodar dry-run.
- Rodar execucao real.
- Confirmar id do comentario no Jira e registrar no log do dia.
