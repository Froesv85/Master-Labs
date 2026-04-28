const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.projectExtractionLog.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  select: {
    id: true,
    projectId: true,
    status: true,
    webhookId: true,
    error: true,
    createdAt: true,
    updatedAt: true,
  },
})
.then(logs => {
  console.log(JSON.stringify(logs, null, 2));
})
.catch(console.error)
.finally(() => p.$disconnect());
