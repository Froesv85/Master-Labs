import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin';
import { getAzureCost } from '@/lib/azure-cost';

type SchemaSizeRow = { schemaName: string; sizeMb: number | null; tableCount: bigint };
type TableSizeRow = { tableName: string; sizeMb: number | null; rowsEstimate: bigint | null };

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
  }

  try {
    const [users, projects, robots, competitions, teams, schemaSizes, tableSizes, azure] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.robot.count(),
      prisma.robotEvent.count({ where: { category: 'competition' } }),
      prisma.team.count(),
      prisma.$queryRaw<SchemaSizeRow[]>`
        SELECT table_schema AS schemaName,
               ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS sizeMb,
               COUNT(*) AS tableCount
        FROM information_schema.tables
        WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
        GROUP BY table_schema
        ORDER BY sizeMb DESC
      `,
      prisma.$queryRaw<TableSizeRow[]>`
        SELECT table_name AS tableName,
               ROUND((data_length + index_length) / 1024 / 1024, 2) AS sizeMb,
               table_rows AS rowsEstimate
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        ORDER BY sizeMb DESC
        LIMIT 12
      `,
      getAzureCost(),
    ]);

    return NextResponse.json({
      counts: { users, projects, robots, competitions, teams },
      databases: schemaSizes.map((s) => ({
        schema: s.schemaName,
        sizeMb: s.sizeMb ?? 0,
        tables: Number(s.tableCount),
      })),
      topTables: tableSizes.map((t) => ({
        table: t.tableName,
        sizeMb: t.sizeMb ?? 0,
        rowsEstimate: t.rowsEstimate !== null ? Number(t.rowsEstimate) : null,
      })),
      azure,
    });
  } catch (error) {
    console.error('Falha ao carregar overview administrativo:', error);
    return NextResponse.json({ error: 'Erro ao consolidar métricas administrativas' }, { status: 500 });
  }
}
