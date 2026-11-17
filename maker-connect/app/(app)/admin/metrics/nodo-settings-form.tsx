'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Key = 'welcomeMs' | 'minRideMs' | 'celebrateMs' | 'pageTransitionMs';
type Settings = Record<Key, number>;
type Limits = Record<Key, { min: number; max: number }>;

const FIELDS: { key: Key; label: string; hint: string }[] = [
  { key: 'welcomeMs', label: 'Boas-vindas após login', hint: 'Tela cheia do Nodo depois de entrar ou criar conta. 0 = não mostrar.' },
  { key: 'minRideMs', label: 'Nodo na trilha (mínimo)', hint: 'Tempo mínimo que o Nodo fica pendurado na barra ao trocar de tela.' },
  { key: 'celebrateMs', label: 'Comemoração ao chegar', hint: 'Quanto tempo ele comemora antes de cair (a queda usa os últimos 0,6 s).' },
  { key: 'pageTransitionMs', label: 'Deslize entre telas', hint: 'Duração da animação do conteúdo entre uma tela e outra. 0 = sem animação.' },
];

const toSec = (ms: number) => String(Math.round(ms / 100) / 10);

export default function NodoSettingsForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, string> | null>(null);
  const [defaults, setDefaults] = useState<Settings | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings/ui')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body: { data: Settings; defaults: Settings; limits: Limits }) => {
        setValues(Object.fromEntries(FIELDS.map((f) => [f.key, toSec(body.data[f.key])])) as Record<Key, string>);
        setDefaults(body.defaults);
        setLimits(body.limits);
      })
      .catch(() => setMessage({ ok: false, text: 'Não foi possível carregar as configurações.' }));
  }, []);

  if (!values || !limits || !defaults) {
    return message ? <p className="text-sm text-rose-400">{message.text}</p> : null;
  }

  async function save(next: Record<Key, string>) {
    setSaving(true);
    setMessage(null);
    try {
      const payload = Object.fromEntries(FIELDS.map((f) => [f.key, Math.round(Number(next[f.key].replace(',', '.')) * 1000)]));
      const res = await fetch('/api/admin/settings/ui', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Erro ao salvar');
      setValues(Object.fromEntries(FIELDS.map((f) => [f.key, toSec(body.data[f.key])])) as Record<Key, string>);
      setMessage({ ok: true, text: 'Salvo. Vale para todos os usuários na próxima tela que abrirem.' });
      router.refresh(); // aplica os novos tempos nesta aba tambem
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-zinc-200">Animações do Nodo</h2>
      <form
        onSubmit={(e) => { e.preventDefault(); save(values); }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const { min, max } = limits[f.key];
            return (
              <label key={f.key} className="block">
                <span className="text-sm font-medium text-zinc-300">{f.label}</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.1}
                    min={min / 1000}
                    max={max / 1000}
                    value={values[f.key]}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    className="h-10 w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                  />
                  <span className="text-sm text-zinc-500">segundos</span>
                </div>
                <span className="mt-1 block text-xs text-zinc-500">
                  {f.hint} Faixa: {min / 1000}–{max / 1000} s · padrão {defaults[f.key] / 1000} s.
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(Object.fromEntries(FIELDS.map((f) => [f.key, toSec(defaults[f.key])])) as Record<Key, string>)}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 disabled:opacity-60"
          >
            Restaurar padrão
          </button>
          {message && (
            <span className={`text-sm ${message.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{message.text}</span>
          )}
        </div>
      </form>
    </section>
  );
}
