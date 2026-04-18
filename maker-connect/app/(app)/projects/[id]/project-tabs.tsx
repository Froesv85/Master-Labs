'use client';

import { useState } from 'react';
import DifficultiesPanel from './difficulties-panel';
import ExtractPanel from './extract-panel';
import ExportPanel from './export-panel';

type ProjectTabsProps = {
  projectId: number;
  initialInput: string;
  currentEmbeddingId: string | null;
  difficulties: any[];
};

export default function ProjectTabs({
  projectId,
  initialInput,
  currentEmbeddingId,
  difficulties,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'docs' | 'gov'>('ai');

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="flex space-x-1 rounded-xl bg-zinc-900/10 p-1 mb-6">
        <button
          onClick={() => setActiveTab('ai')}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'ai' 
              ? 'bg-white text-zinc-900 shadow ring-1 ring-zinc-200' 
              : 'text-zinc-600 hover:bg-white/[0.12] hover:text-zinc-800'}`}
        >
          🤖 Engenharia IA
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'docs' 
              ? 'bg-white text-zinc-900 shadow ring-1 ring-zinc-200' 
              : 'text-zinc-600 hover:bg-white/[0.12] hover:text-zinc-800'}`}
        >
          📄 Dossiê Técnico
        </button>
        <button
          onClick={() => setActiveTab('gov')}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'gov' 
              ? 'bg-white text-zinc-900 shadow ring-1 ring-zinc-200' 
              : 'text-zinc-600 hover:bg-white/[0.12] hover:text-zinc-800'}`}
        >
          🛡️ Governança & Auditoria
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-2">
        <div className={activeTab === 'ai' ? 'block' : 'hidden'}>
          <ExtractPanel
            projectId={projectId}
            initialInput={initialInput}
            currentEmbeddingId={currentEmbeddingId}
          />
        </div>

        <div className={activeTab === 'docs' ? 'block' : 'hidden'}>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-900 mb-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Dossiê Vivo
            </h3>
            <p className="mt-2 text-sm opacity-90">
              O dossiê consolida silenciosamente os resultados da Extração IA. 
              Para gerar a versão imprimível/PDF com todos os dados da plataforma preenchidos, acesse a aba Governança.
            </p>
          </div>
          {/* We reuse ExtractPanel here if we just want them to see it without duplicating state, 
              but since state is encapsulated in ExtractPanel, keeping it in 'ai' tab is better. 
              We'll leave a placeholder telling them the Dossiê generates from the IA tab. */}
        </div>

        <div className={activeTab === 'gov' ? 'block' : 'hidden'}>
          <DifficultiesPanel projectId={projectId} initialDifficulties={difficulties} />
          <ExportPanel projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
