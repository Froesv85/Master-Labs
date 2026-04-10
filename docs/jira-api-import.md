# Importacao Jira via API (VS Code)

Este guia usa o script PowerShell [scripts/import-jira-from-csv.ps1](../scripts/import-jira-from-csv.ps1) para criar Epic, Story e Sub-task no Jira Cloud a partir do CSV.

## Pre-requisitos

- Jira Cloud com API Token ativo.
- Permissao para criar issues no projeto alvo.
- PowerShell 5.1+ no Windows.

## Arquivos usados

- CSV de entrada: [.github/templates/jira-import.template.csv](../.github/templates/jira-import.template.csv)
- Script: [scripts/import-jira-from-csv.ps1](../scripts/import-jira-from-csv.ps1)
- Saida de mapeamento: [docs/jira-import-result.json](jira-import-result.json)

## Dry-run (sem criar no Jira)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-jira-from-csv.ps1 \
  -JiraBaseUrl "https://SEU_DOMINIO.atlassian.net" \
  -ProjectKey "MKR" \
  -JiraEmail "voce@empresa.com" \
  -JiraApiToken "SEU_TOKEN" \
  -CsvPath ".github/templates/jira-import.template.csv" \
  -DryRun
```

## Execucao real

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-jira-from-csv.ps1 \
  -JiraBaseUrl "https://SEU_DOMINIO.atlassian.net" \
  -ProjectKey "MKR" \
  -JiraEmail "voce@empresa.com" \
  -JiraApiToken "SEU_TOKEN" \
  -CsvPath ".github/templates/jira-import.template.csv"
```

## Campos customizados (quando necessario)

Em alguns projetos Jira, os IDs de campos variam:

- Epic Name: `customfield_10011`
- Epic Link: `customfield_10014`
- Story Points: varia por instancia

Exemplo com override:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-jira-from-csv.ps1 \
  -JiraBaseUrl "https://SEU_DOMINIO.atlassian.net" \
  -ProjectKey "MKR" \
  -JiraEmail "voce@empresa.com" \
  -JiraApiToken "SEU_TOKEN" \
  -CsvPath ".github/templates/jira-import.template.csv" \
  -EpicNameField "customfield_10011" \
  -EpicLinkField "customfield_10014" \
  -StoryPointsField "customfield_10016"
```

## Observacoes

- O script respeita a hierarquia `Parent` do CSV para criar itens na ordem correta.
- Para Story, o vinculo com Epic usa `Epic Link` (custom field configuravel).
- Para Sub-task, o vinculo usa `parent` no payload Jira.
- O arquivo de resultado mapeia `Work Item ID` para chave real do Jira.
