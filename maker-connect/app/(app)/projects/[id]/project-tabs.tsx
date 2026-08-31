'use client';

import { useState } from 'react';
import DifficultiesPanel from './difficulties-panel';
import ExtractPanel from './extract-panel';
import ExportPanel from './export-panel';
import CommentsPanel from './comments-panel';

type Difficulty = {
  id: number;
  description: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type Comment = {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: { id: number; name: string | null };
};

type ProjectTabsProps = {
  projectId: number;
  initialInput: string;
  currentEmbeddingId: string | null;
  difficulties: Difficulty[];
  comments: Comment[];
  isOwner: boolean;
};

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
        ${active
          ? 'bg-white text-zinc-900 shadow ring-1 ring-zinc-200'
          : 'text-zinc-600 hover:bg-white/[0.12] hover:text-zinc-800'}`}
    >
      {children}
    </button>
  );
}

export default function ProjectTabs({
  projectId,
  initialInput,
  currentEmbeddingId,
  difficulties,
  comments,
  isOwner,
}: ProjectTabsProps) {
  const [ownerTab, setOwnerTab] = useState<'ai' | 'docs' | 'gov'>('ai');
  const [guestTab, setGuestTab] = useState<'docs' | 'comments'>('docs');

  if (!isOwner) {
    return (
      <div className="mt-8">
        <div className="flex space-x-1 rounded-xl bg-zinc-900/10 p-1 mb-6">
          <TabButton active={guestTab === 'docs'} onClick={() => setGuestTab('docs')}>Documentação</TabButton>
          <TabButton active={guestTab === 'comments'} onClick={() => setGuestTab('comments')}>
            Comentários ({comments.length})
          </TabButton>
        </div>

        <div className={guestTab === 'docs' ? 'block' : 'hidden'}>
          <ExportPanel projectId={projectId} canGenerate={false} />
        </div>
        <div className={guestTab === 'comments' ? 'block' : 'hidden'}>
          <CommentsPanel projectId={projectId} initialComments={comments} />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="flex space-x-1 rounded-xl bg-zinc-900/10 p-1 mb-6">
        <TabButton active={ownerTab === 'ai'} onClick={() => setOwnerTab('ai')}>Engenharia IA</TabButton>
        <TabButton active={ownerTab === 'docs'} onClick={() => setOwnerTab('docs')}>Dossiê Técnico</TabButton>
        <TabButton active={ownerTab === 'gov'} onClick={() => setOwnerTab('gov')}>Governança e Auditoria</TabButton>
      </div>

      {/* Tab Content */}
      <div className="mt-2">
        <div className={ownerTab === 'ai' ? 'block' : 'hidden'}>
          <ExtractPanel
            projectId={projectId}
            initialInput={initialInput}
            currentEmbeddingId={currentEmbeddingId}
          />
        </div>

        <div className={ownerTab === 'docs' ? 'block' : 'hidden'}>
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
        </div>

        <div className={ownerTab === 'gov' ? 'block' : 'hidden'}>
          <DifficultiesPanel projectId={projectId} initialDifficulties={difficulties} />
          <ExportPanel projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
