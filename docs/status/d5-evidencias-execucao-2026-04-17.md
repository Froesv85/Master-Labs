# Evidencias D5 - Execucao 2026-04-17

## Escopo executado
- D5-T1: Validar fluxo E2E completo
- D5-T2: Validar falha controlada e observabilidade

## Ambiente
- API: http://localhost:3000
- Projeto usado no teste: id 7 (Servo Motor Tester)
- Observacao: o script `maker-connect/docs/n8n-e2e-tests.ps1` estava fixo com `PROJECT_ID = 1`, mas o projeto 1 nao existe no seed atual.

## Resultado D5-T1 (E2E)
- logId: 61
- webhookId: webhook_1776477470252_96085d61
- status imediato: queued
- status final: done
- latency final: 312 ms
- output persistido: true

Resumo de aceite D5-T1:
- Fluxo extract -> callback -> status final validado com sucesso.
- Evidencia de callback e logs por etapa disponivel no retorno da API.

## Resultado D5-T2 (falha controlada)
- Input curto: HTTP 400 (Bad Request)
- Projeto inexistente: HTTP 404 (Not Found)

Resumo de aceite D5-T2:
- Erros controlados reproduzidos conforme esperado.
- Observabilidade basica validada por codigos de status e mensagens de erro na API.

## Proximo passo recomendado
- Ajustar o script `maker-connect/docs/n8n-e2e-tests.ps1` para aceitar `PROJECT_ID` por parametro e evitar falha por ID fixo.

## Atualizacao aplicada no script de teste (mesma data)
- `maker-connect/docs/n8n-e2e-tests.ps1` atualizado para receber parametros `ApiUrl` e `ProjectId`.
- Health check corrigido para usar `GET /api/projects`.

Reteste automatizado com script:
- Comando: `./n8n-e2e-tests.ps1 -ProjectId 7`
- Resultado: suite concluida com sucesso.
- Evidencias chave: `logId 62`, `status queued -> done`, `latency 245ms`, erros esperados `400` e `404` validados.

## Resultado D5-T4 (LGPD/PII)
- Entrada de teste enviada com PII explicita (email + telefone + CPF).
- Resultado de mascaramento no endpoint de extracao:
	- `logId`: 63
	- `webhookId`: `webhook_1776477833255_0a3f7b58`
	- `piiRedactions`: 3
	- status inicial: `queued`
- Conteudo persistido no projeto com tokens de anonimização:
	- `[EMAIL_REDACTED]`
	- `[PHONE_REDACTED]`
	- `[CPF_REDACTED]`

Resumo de aceite D5-T4:
- Mascaramento de PII validado em runtime antes do disparo para o pipeline.
- Contador de redacoes persistido no log (`piiRedactions`) com valor consistente.

Rastreabilidade no codigo:
- Função de anonimização no endpoint: `maker-connect/app/api/projects/[id]/extract/route.ts`.
- Persistência do conteúdo sanitizado: update de `project.content` no mesmo endpoint.
- Envio ao n8n usando `input: sanitized` no payload do webhook.
