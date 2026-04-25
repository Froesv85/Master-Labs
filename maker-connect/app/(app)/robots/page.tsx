'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Modal, Field, FormActions, inputCls, selectCls } from '@/components/modal';

function CreateRobotModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: Robot) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('sumo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/robots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao cadastrar'); }
      const robot = await res.json();
      onCreated(robot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar robô');
      setSaving(false);
    }
  }

  return (
    <Modal title="Cadastrar Robô" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome do Robô">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: ThunderBot MK4" className={inputCls} />
        </Field>
        <Field label="Descrição" hint="(opcional)">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Especificações, construção, diferenciais..." className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Categoria">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            <option value="sumo">🥊 Sumo</option>
            <option value="combat">⚔️ Combate</option>
            <option value="line_follower">➰ Line Follower</option>
            <option value="autonomous">🧠 Autônomo</option>
            <option value="educational">🎓 Educacional</option>
            <option value="competition">🏁 Competição</option>
          </select>
        </Field>
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
        <FormActions onClose={onClose} saving={saving} label="Cadastrar Robô" />
      </form>
    </Modal>
  );
}

type Award = { id: number; title: string; placement: number | null; year: number };
type Robot = {
  id: number;
  name: string;
  category: string;
  status: string;
  wins: number;
  losses: number;
  draws: number;
  eloScore: number;
  owner: { id: number; name: string | null };
  awards: Award[];
  _count: { matches: number };
};

const CATEGORY_OPTIONS = [
  { value: 'sumo', label: 'Sumo', emoji: '🥊', color: 'bg-red-900/40 text-red-300 border-red-500/30' },
  { value: 'combat', label: 'Combate', emoji: '⚔️', color: 'bg-orange-900/40 text-orange-300 border-orange-500/30' },
  { value: 'line_follower', label: 'Line Follower', emoji: '➰', color: 'bg-blue-900/40 text-blue-300 border-blue-500/30' },
  { value: 'autonomous', label: 'Autônomo', emoji: '🧠', color: 'bg-violet-900/40 text-violet-300 border-violet-500/30' },
  { value: 'educational', label: 'Educacional', emoji: '🎓', color: 'bg-teal-900/40 text-teal-300 border-teal-500/30' },
  { value: 'competition', label: 'Competição', emoji: '🏁', color: 'bg-amber-900/40 text-amber-300 border-amber-500/30' },
];

function categoryConfig(cat: string) {
  return CATEGORY_OPTIONS.find((c) => c.value === cat) ?? { label: cat, emoji: '🤖', color: 'bg-slate-800 text-zinc-300 border-white/10' };
}

function WinRate({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws;
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const bar = Math.min(100, rate);
  const color = rate >= 70 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{wins}V · {losses}D · {draws}E</span>
        <span style={{ color }} className="font-bold">{rate}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${bar}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function RobotsPage() {
  const router = useRouter();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = category ? `/api/robots?category=${category}` : '/api/robots';
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setRobots(data.robots ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  const top3 = [...robots].sort((a, b) => b.eloScore - a.eloScore).slice(0, 3);

  return (
    <>
    {showCreate && (
      <CreateRobotModal
        onClose={() => setShowCreate(false)}
        onCreated={(robot) => { setRobots((prev) => [robot, ...prev]); setShowCreate(false); }}
      />
    )}
    <div className="space-y-6">
      {/* Header — RoboCore bold style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            ARENA DE <span className="text-amber-400">ROBÔS</span>
          </h1>
          <p className="text-sm text-zinc-400">Ranking, histórico de partidas e premiações</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400"
        >
          + Cadastrar Robô
        </button>
      </div>

      {/* Podium — top 3 */}
      {!category && top3.length >= 3 && (
        <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-[#0f1829]">
          <div className="border-b border-amber-500/20 px-5 py-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">🏆 TOP RANKING ELO</span>
          </div>
          <div className="flex items-end justify-center gap-4 p-6 pb-8">
            {/* 2nd */}
            <div className="flex flex-col items-center gap-2 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-400 bg-zinc-700 text-2xl font-black text-zinc-200">
                2
              </div>
              <Link href={`/robots/${top3[1].id}`} className="text-center text-xs font-bold text-zinc-200 hover:text-amber-300">
                {top3[1].name}
              </Link>
              <span className="font-mono text-xs text-zinc-400">ELO {top3[1].eloScore}</span>
            </div>
            {/* 1st */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">👑</span>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-900/40 text-2xl font-black text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                1
              </div>
              <Link href={`/robots/${top3[0].id}`} className="text-center text-sm font-black text-amber-300 hover:text-amber-200">
                {top3[0].name}
              </Link>
              <span className="font-mono text-xs text-amber-400">ELO {top3[0].eloScore}</span>
            </div>
            {/* 3rd */}
            <div className="flex flex-col items-center gap-2 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-700 bg-amber-900/30 text-2xl font-black text-amber-600">
                3
              </div>
              <Link href={`/robots/${top3[2].id}`} className="text-center text-xs font-bold text-zinc-200 hover:text-amber-300">
                {top3[2].name}
              </Link>
              <span className="font-mono text-xs text-zinc-400">ELO {top3[2].eloScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
            !category ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'
          }`}
        >
          Todos
        </button>
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCategory(opt.value)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
              category === opt.value
                ? 'border-amber-500 bg-amber-500 text-black'
                : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'
            }`}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {robots.map((robot, idx) => {
            const cat = categoryConfig(robot.category);
            return (
              <div
                key={robot.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/robots/${robot.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/robots/${robot.id}`)}
                className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-5 transition-all hover:border-amber-500/30 hover:bg-slate-800/80 hover:shadow-[0_0_16px_rgba(245,158,11,0.1)]"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xl">
                      {cat.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {idx < 3 && !category && (
                          <span className="text-xs font-black text-amber-400">#{idx + 1}</span>
                        )}
                        <h3 className="font-bold text-zinc-100 group-hover:text-amber-300">{robot.name}</h3>
                      </div>
                      <Link
                        href={`/profile/${robot.owner.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-zinc-500 hover:text-amber-400"
                      >
                        {robot.owner.name}
                      </Link>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${cat.color}`}>
                    {cat.label}
                  </span>
                </div>

                {/* Win rate */}
                <WinRate wins={robot.wins} losses={robot.losses} draws={robot.draws} />

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-400">ELO {robot.eloScore}</span>
                  <span className="text-zinc-500">{robot._count.matches} partidas</span>
                  {robot.awards.length > 0 && (
                    <span className="text-yellow-400">🏆 {robot.awards.length}</span>
                  )}
                </div>
              </div>
            );
          })}
          {robots.length === 0 && (
            <p className="col-span-full py-12 text-center text-zinc-500">Nenhum robô encontrado.</p>
          )}
        </div>
      )}
    </div>
    </>
  );
}
