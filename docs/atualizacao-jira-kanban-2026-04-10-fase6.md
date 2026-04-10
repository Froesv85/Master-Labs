# Atualizacao Jira e Kanban - 10/04/2026 (Fase 6: Exportação PDF)

## 1) Atualizacao Jira (pronto para aplicar)

Status recomendado por issue para a conclusao da Fase 6 (Exportacao PDF Auditavel):

| Jira | Tipo | Status sugerido | Evidencia de entrega |
|---|---|---|---|
| ML-28 | Sub-task | Done | "Job Queue" substituida no MVP por execucao em Background Promise asincrona na API `route.ts`. O status é controlado via DB `ProjectExport`. |
| ML-27 | Sub-task | Done | Template PDF rico codificado via `jsPDF` (`pdf-service.ts`), consolidando evidencias do RAG, dificuldades e footer de auditoria MakerBrain. |
| ML-19 | Story | Done | Worker de geracao ativo. Alem do disco local, integramos a biblioteca `@aws-sdk/client-s3` com o **MinIO** local, transformando-o num serviço Cloud-Ready. |
| ML-26 | Sub-task | Done | Endpoint HTTP GET `/api/projects/[id]/export` construido. Retorna lista sequencial ordenada de solicitacoes e URLs seguras com Polling. |
| ML-25 | Sub-task | Done | Painel de status e historico (`export-panel.tsx`) desenhado, rodando updates via `setInterval` para notificar sucesso/erro em tempo real ao usuario. |
| ML-18 | Story | Done | Rastreabilidade do historico completa, permitindo abrir multiplos exports e auditar se a maquina de build AWS (Minio) processou sem limitacoes temporais. |
| ML-14 | Epic | Done | O Epic de Exportacao PDF (S2-E1) foi fechado com excelência, usando S3 compatible backend via docker-compose e renderizacao agnostica server-side. |

Sugestao de comment para Epic ML-14:

"Entrega maciça do Epic S2-E1! O MakerConnect agora unifica todo o log de dificuldades com a robusta extração de hardware da IA em um formato portátil (PDF). Adotamos uma infraestrutura corporativa: implementamos um servidor S3 na nossa arquitetura via MinIO e a AWS-SDK. O frontend exibe perfeitamente a barra de progresso (buscando inteligência e vetorizando...) com download instantâneo através do Bucket `maker-assets`. Ref: lib/s3-service.ts, lib/pdf-service.ts"

## 2) Resumo da Infra AWS-Local (MinIO)

1. **Self-Healing API**: Optamos por embutir comandos da AWS SDK nativos (`HeadBucketCommand` / `CreateBucketCommand`) ao inves de scripts Bash. Isso permite que caso o ambiente Docker reinicie ou derrube o storage, ao primeiro click na tentativa de extrair o PDF o sistema reconstroi e corrige o proprio bucket imediatamente sem erro 404.
2. **Fallback Next.js Engine**: Bypass da restricao historica `EPOENT` do `pdfkit` (file system restriction Next.js) escrevendo a engine de PDFs usando matriz de fontes javascript puro da lib `jspdf`, acelerando cold starts e permitindo deploy futuro no ambiente Serverless da Vercel.
