const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.projectExtractionLog.updateMany({
  where: { status: 'queued' },
  data: { status: 'failed', error: 'Cancelado — Ollama sem memória ou callback ausente. Tente novamente.' },
})
.then(r => console.log('Logs atualizados:', r.count))
.catch(console.error)
.finally(() => p.$disconnect());
