'use client';

import { useState } from 'react';

export default function CodeViewer({ code, title = "Hardware Firmware (Arduino)" }: { code: string, title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</span>
        <button
          onClick={handleCopy}
          className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase transition-all ${
            copied ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-zinc-300 scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
        <code className="font-mono">
          {code}
        </code>
      </pre>
    </div>
  );
}
