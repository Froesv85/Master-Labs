'use client';

import { useState, useEffect, type ReactNode } from 'react';

type MetricData = {
  ai: {
    totalExtractions: number;
    avgLatencySec: string;
    totalPiiRedactions: number;
  };
  pdf: {
    total: number;
    done: number;
    failed: number;
    processing: number;
  };
  recent: Array<{
    id: number;
    project: string;
    status: string;
    latency: string | null;
    date: string;
  }>;
};

type PipelineMetrics = {
  p50: number;
  p95: number;
  avgLatencyMs: number;
  avgAnonymizeMs: number | null;
  avgN8nTriggerMs: number | null;
  totalRuns: number;
  sampleSize: number;
  lastRunAt: string | null;
};

type Overview = {
  counts: { users: number; projects: number; robots: number; competitions: number; teams: number };
  databases: Array<{ schema: string; sizeMb: number; tables: number }>;
  topTables: Array<{ table: string; sizeMb: number; rowsEstimate: number | null }>;
  azure: { configured: boolean; monthToDateCost?: number; currency?: string; asOf?: string; error?: string };
  redis: { configured: boolean; usedMemoryMb?: number; keys?: number; error?: string };
  minio: { configured: boolean; bucket?: string; objects?: number; sizeMb?: number; error?: string };
  pinecone: { configured: boolean; index?: string; vectors?: number; dimension?: number | null; error?: string };
};

export default function AdminMetricsPage() {
  const [data, setData] = useState<MetricData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineMetrics | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMetrics() {
    try {
      const [resGeneral, resPipeline, resOverview] = await Promise.allSettled([
        fetch('/api/metrics'),
        fetch('/api/admin/metrics'),
        fetch('/api/admin/overview'),
      ]);

      if (resGeneral.status === 'fulfilled' && resGeneral.value.ok) {
        const payload = await resGeneral.value.json();
        setData(payload.data);
      }

      if (resPipeline.status === 'fulfilled' && resPipeline.value.ok) {
        const pipelinePayload = await resPipeline.value.json();
        setPipeline(pipelinePayload);
      }

      if (resOverview.status === 'fulfilled' && resOverview.value.ok) {
        const overviewPayload = await resOverview.value.json();
        setOverview(overviewPayload);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Polling cada 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Executive IA Dashboard
        </h1>
        <p className="mt-2 text-zinc-400">MakerBrain Intelligence & Compliance Analytics (Demo Day)</p>
      </header>

      {/* PLATFORM OVERVIEW */}
      {overview && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Visão Geral da Plataforma</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <KPICard title="Usuários" value={overview.counts.users.toString()} subtitle="Makers cadastrados" color="emerald" />
            <KPICard title="Projetos" value={overview.counts.projects.toString()} subtitle="Publicados na plataforma" color="cyan" />
            <KPICard title="Robôs" value={overview.counts.robots.toString()} subtitle="Cadastrados na arena" color="blue" />
            <KPICard title="Competições" value={overview.counts.competitions.toString()} subtitle="Eventos de competição" color="rose" />
            <KPICard title="Equipes" value={overview.counts.teams.toString()} subtitle="Equipes formadas" color="emerald" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* AZURE COST */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Consumo Azure (mês atual)</h3>
              {!overview.azure.configured ? (
                <div className="text-sm text-zinc-500">
                  <p className="text-zinc-400">Integração não configurada.</p>
                  <p className="mt-2 text-xs leading-relaxed">
                    Defina <code className="text-amber-400">AZURE_TENANT_ID</code>, <code className="text-amber-400">AZURE_CLIENT_ID</code>,{' '}
                    <code className="text-amber-400">AZURE_CLIENT_SECRET</code> e <code className="text-amber-400">AZURE_SUBSCRIPTION_ID</code>{' '}
                    no ambiente (App Registration com papel &quot;Cost Management Reader&quot; na subscription).
                  </p>
                </div>
              ) : overview.azure.error ? (
                <p className="text-sm text-rose-400">{overview.azure.error}</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-amber-400">
                    {overview.azure.monthToDateCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <span className="text-lg text-zinc-500">{overview.azure.currency}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Atualizado em {overview.azure.asOf ? new Date(overview.azure.asOf).toLocaleString('pt-BR') : '--'}
                  </p>
                </>
              )}
            </div>

            {/* DB SIZE BY SCHEMA */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Tamanho BD MySql</h3>
              <div className="space-y-3">
                {overview.databases.map((db) => (
                  <div key={db.schema} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-300">{db.schema}</span>
                    <span className="text-zinc-500">{db.tables} tabelas · <span className="font-semibold text-cyan-400">{db.sizeMb} MB</span></span>
                  </div>
                ))}
                {overview.databases.length === 0 && <p className="text-sm text-zinc-600">Sem dados disponíveis.</p>}
              </div>
            </div>

            {/* TOP TABLES */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Maiores Tabelas</h3>
              <div className="space-y-2">
                {overview.topTables.slice(0, 6).map((t) => (
                  <div key={t.table} className="flex items-center justify-between text-xs">
                    <span className="truncate text-zinc-400">{t.table}</span>
                    <span className="ml-2 flex-shrink-0 font-semibold text-zinc-300">{t.sizeMb} MB</span>
                  </div>
                ))}
                {overview.topTables.length === 0 && <p className="text-sm text-zinc-600">Sem dados disponíveis.</p>}
              </div>
            </div>
          </div>

          <h3 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wider text-zinc-400">Bancos documentais</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <InfraCard
              title="Redis (cache/filas)"
              envHint="REDIS_URL"
              stats={overview.redis}
              render={(s) => (
                <>
                  <p className="text-3xl font-bold text-amber-400">{s.usedMemoryMb} <span className="text-lg text-zinc-500">MB</span></p>
                  <p className="mt-1 text-xs text-zinc-500">{s.keys} chaves armazenadas</p>
                </>
              )}
            />
            <InfraCard
              title="MinIO (arquivos/S3)"
              envHint="S3_ENDPOINT"
              stats={overview.minio}
              render={(s) => (
                <>
                  <p className="text-3xl font-bold text-amber-400">{s.sizeMb} <span className="text-lg text-zinc-500">MB</span></p>
                  <p className="mt-1 text-xs text-zinc-500">{s.objects} arquivos no bucket &quot;{s.bucket}&quot;</p>
                </>
              )}
            />
            <InfraCard
              title="Pinecone (vetores)"
              envHint="PINECONE_API_KEY"
              stats={overview.pinecone}
              render={(s) => (
                <>
                  <p className="text-3xl font-bold text-amber-400">{s.vectors} <span className="text-lg text-zinc-500">vetores</span></p>
                  <p className="mt-1 text-xs text-zinc-500">
                    índice &quot;{s.index}&quot;{s.dimension ? ` · dimensão ${s.dimension}` : ''}
                  </p>
                </>
              )}
            />
          </div>
        </section>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total de Questões IA"
          value={data.ai.totalExtractions.toString()} 
          subtitle="Extrações RAG processadas"
          color="emerald"
        />
        <KPICard 
          title="Latência Média" 
          value={`${data.ai.avgLatencySec}s`} 
          subtitle="Tempo médio de resposta"
          color="cyan"
        />
        <KPICard 
          title="Segurança LGPD" 
          value={data.ai.totalPiiRedactions.toString()} 
          subtitle="PII/Dados sensíveis interceptados"
          color="rose"
        />
        <KPICard 
          title="Automação PDF" 
          value={data.pdf.total.toString()} 
          subtitle={`Sucesso: ${data.pdf.done} | Falhas: ${data.pdf.failed}`}
          color="blue"
        />
      </div>

      {/* PIPELINE LATENCY */}
      {pipeline && (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Latência do Pipeline (S1.3)</h2>
            <span className="text-xs text-zinc-500">
              {pipeline.sampleSize} amostras
              {pipeline.lastRunAt && ` · última em ${new Date(pipeline.lastRunAt).toLocaleString('pt-BR')}`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <LatencyCard label="p50" value={pipeline.p50} goal={15000} />
            <LatencyCard label="p95" value={pipeline.p95} goal={15000} />
            <LatencyCard label="Anonymize (avg)" value={pipeline.avgAnonymizeMs} />
            <LatencyCard label="n8n Trigger (avg)" value={pipeline.avgN8nTriggerMs} />
          </div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LOG TABLE */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-sm">
          <h2 className="mb-6 text-lg font-semibold">Live Feed: MakerBrain Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-xs">
                  <th className="pb-3 pt-2">Projeto</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">Latência</th>
                  <th className="pb-3 pt-2 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.recent.map((log) => (
                  <tr key={log.id} className="group hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 font-medium text-zinc-200">{log.project}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        log.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' : 
                        log.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.status === 'done' ? 'Sucesso' : log.status === 'failed' ? 'Falha' : 'Processando'}
                      </span>
                    </td>
                    <td className="py-4 text-zinc-400">{log.latency ? `${log.latency}s` : '--'}</td>
                    <td className="py-4 text-right text-zinc-500">{new Date(log.date).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-300">Resumo de Eficiência</h2>
            <div className="mt-6 space-y-4">
              <EfficiencyItem 
                label="Reprodutibilidade" 
                percent={85} 
                desc="Projetos com BOM completa"
                color="bg-emerald-500"
              />
              <EfficiencyItem 
                label="Redução de Esforço" 
                percent={92} 
                desc="Tempo economizado vs manual"
                color="bg-cyan-500"
              />
              <EfficiencyItem 
                label="Conformidade LGPD" 
                percent={100} 
                desc="Processamento Seguro"
                color="bg-purple-500"
              />
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 italic leading-relaxed">
              "A automação via MakerBrain RAG reduziu o tempo de documentação técnica em média de 4 horas para 15 segundos por projeto."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, color }: { title: string, value: string, subtitle: string, color: 'emerald' | 'cyan' | 'rose' | 'blue' }) {
  const colorMap = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colorMap[color]} p-6 shadow-lg`}>
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
      </div>
      <p className="mt-1 text-xs opacity-60">{subtitle}</p>
    </div>
  );
}

function LatencyCard({ label, value, goal }: { label: string; value: number | null; goal?: number }) {
  const ms = value ?? null;
  const overGoal = goal !== undefined && ms !== null && ms > goal;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      {ms === null ? (
        <p className="mt-2 text-xl font-semibold text-zinc-600">—</p>
      ) : (
        <>
          <p className={`mt-2 text-xl font-semibold ${overGoal ? 'text-rose-400' : 'text-emerald-400'}`}>
            {ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
          </p>
          {goal && (
            <p className="mt-1 text-[10px] text-zinc-500">meta &lt; {goal >= 1000 ? `${goal / 1000}s` : `${goal}ms`}</p>
          )}
        </>
      )}
    </div>
  );
}

function EfficiencyItem({ label, percent, desc, color }: { label: string, percent: number, desc: string, color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className="text-sm font-bold">{percent}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
      </div>
      <p className="mt-1 text-[10px] text-zinc-500">{desc}</p>
    </div>
  );
}

function InfraCard<T extends { configured: boolean; error?: string }>({
  title,
  envHint,
  stats,
  render,
}: {
  title: string;
  envHint: string;
  stats: T;
  render: (stats: T) => ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h3>
      {!stats.configured ? (
        <div className="text-sm text-zinc-500">
          <p className="text-zinc-400">Integração não configurada.</p>
          <p className="mt-2 text-xs leading-relaxed">
            Defina <code className="text-amber-400">{envHint}</code> no ambiente.
          </p>
        </div>
      ) : stats.error ? (
        <p className="text-sm text-rose-400">{stats.error}</p>
      ) : (
        render(stats)
      )}
    </div>
  );
}
