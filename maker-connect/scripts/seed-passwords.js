const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync('maker123', 10);
  const result = await prisma.user.updateMany({ data: { password: hash } });
  console.log('Usuarios atualizados:', result.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
