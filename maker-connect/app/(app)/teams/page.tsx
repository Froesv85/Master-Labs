'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Modal, Field, FormActions, inputCls } from '@/components/modal';

type Member = { id: number; role: string; user: { id: number; name: string | null } };
type Team = { id: number; name: string; description: string | null; ownerId: number; owner: { id: number; name: string | null }; members: Member[]; createdAt: string };

function Avatar({ name, size = 'sm' }: { name: string | null; size?: 'sm' | 'md' }) {
  const initials = name ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : '?';
  const cls = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-black text-black`}>
      {initials}
    </div>
  );
}

function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Team) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isPublic }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao criar'); }
      const team = await res.json();
      onCreated(team);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipe');
      setSaving(false);
    }
  }

  return (
    <Modal title="Criar Equipe" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome da Equipe">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Robótica UFSC" className={inputCls} />
        </Field>
        <Field label="Descrição" hint="(opcional)">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Missão, foco tecnológico, competições..." className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Visibilidade">
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => setIsPublic((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${isPublic ? 'bg-amber-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-zinc-300">{isPublic ? 'Pública — aparece na listagem' : 'Privada — só por convite'}</span>
          </label>
        </Field>
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
        <FormActions onClose={onClose} saving={saving} label="Criar Equipe" />
      </form>
    </Modal>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data) => { setTeams(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
    {showCreate && (
      <CreateTeamModal
        onClose={() => setShowCreate(false)}
        onCreated={(team) => { setTeams((prev) => [team, ...prev]); setShowCreate(false); }}
      />
    )}
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            EQUIPES <span className="text-amber-400">MAKER</span>
          </h1>
          <p className="text-sm text-zinc-400">Times de criação, competição e inovação</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400"
        >
          + Criar Equipe
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-5 transition-all hover:border-amber-500/30 hover:bg-slate-800/80 hover:shadow-[0_0_16px_rgba(245,158,11,0.1)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-xl">
                  👥
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-zinc-100 group-hover:text-amber-300 truncate">{team.name}</h3>
                  <p className="text-xs text-zinc-500">por {team.owner.name}</p>
                </div>
              </div>

              {team.description && (
                <p className="text-xs leading-relaxed text-zinc-400 line-clamp-2">{team.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {team.members.slice(0, 5).map((m) => (
                    <Avatar key={m.id} name={m.user.name} size="sm" />
                  ))}
                  {team.members.length > 5 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-zinc-300">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{team.members.length} membros</span>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-zinc-500">
                <span>Criada em {new Date(team.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                <span className="font-semibold text-amber-400 group-hover:text-amber-300">Ver equipe →</span>
              </div>
            </Link>
          ))}
          {teams.length === 0 && (
            <p className="col-span-full py-12 text-center text-zinc-500">Nenhuma equipe cadastrada.</p>
          )}
        </div>
      )}
    </div>
    </>
  );
}
