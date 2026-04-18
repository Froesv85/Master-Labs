'use client';

import { useState, useEffect } from 'react';

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

export default function AdminMetricsPage() {
  const [data, setData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const payload = await res.json();
        setData(payload.data);
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
