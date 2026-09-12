'use client';

import { useRef, useState } from 'react';
import { COVER_PRESET_URLS } from '@/lib/cover-presets';

export type CoverSelection =
  | { kind: 'none' }
  | { kind: 'preset'; url: string }
  | { kind: 'upload'; imageB64: string; contentType: string; previewUrl: string };

const MAX_BYTES = 5 * 1024 * 1024;

export function CoverPicker({ value, onChange }: { value: CoverSelection; onChange: (v: CoverSelection) => void }) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError('Imagem muito grande. Máximo 5 MB.');
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const contentType = file.type;
      onChange({ kind: 'upload', imageB64: result.split(',')[1], contentType, previewUrl: result });
    };
    reader.onerror = () => setError('Falha ao ler a imagem.');
    reader.readAsDataURL(file);
  }

  const previewUrl = value.kind === 'preset' ? value.url : value.kind === 'upload' ? value.previewUrl : null;

  return (
    <div className="space-y-3">
      <div className="relative h-28 w-full overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {previewUrl ? (
          <img src={previewUrl} alt="Capa selecionada" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">Sem capa selecionada</div>
        )}
        {value.kind !== 'none' && (
          <button
            type="button"
            onClick={() => onChange({ kind: 'none' })}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {COVER_PRESET_URLS.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onChange({ kind: 'preset', url })}
            className={`h-10 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
              value.kind === 'preset' && value.url === url ? 'border-amber-500' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-medium text-amber-400 hover:underline"
        >
          ou enviar uma imagem própria
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
