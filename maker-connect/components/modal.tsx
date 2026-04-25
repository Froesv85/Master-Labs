'use client';

import { useEffect } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/20 bg-[#0d1424] shadow-[0_0_60px_rgba(0,0,0,0.8)]`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d1424] px-6 py-4">
          <h2 className="text-base font-black text-white">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {label}
        {hint && <span className="ml-1 font-normal normal-case text-zinc-600">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30';

export const selectCls =
  'w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30';

interface FormActionsProps {
  onClose: () => void;
  saving: boolean;
  label?: string;
}

export function FormActions({ onClose, saving, label = 'Cadastrar' }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/5"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_16px_rgba(245,158,11,0.3)] transition hover:bg-amber-400 disabled:opacity-60"
      >
        {saving ? 'Salvando…' : label}
      </button>
    </div>
  );
}
