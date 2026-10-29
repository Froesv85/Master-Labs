'use client';

import { useEffect, useState } from 'react';
import { Nodo, type NodoMood } from './nodo';

export const DEFAULT_LOADING_MESSAGES = [
  'Soldando os últimos componentes…',
  'Conferindo a pinagem…',
  'Consultando datasheets…',
  'Calibrando a mesa da impressora 3D…',
  'Conectando os nós da rede…',
];

// frases por seção: o Nodo "sabe" para onde o maker está indo
const ROUTE_MESSAGES: Array<[prefix: string, messages: string[]]> = [
  ['/projects', ['Organizando a vitrine de projetos…', 'Contando os votos da comunidade…', 'Montando a BOM…']],
  ['/robots', ['Aquecendo os motores da Arena…', 'Alinhando as esteiras…', 'Recalculando o ranking ELO…']],
  ['/teams', ['Reunindo a equipe na bancada…', 'Distribuindo as ferramentas…']],
  ['/communities', ['Acendendo os pontos da rede…', 'Chamando os makers da comunidade…']],
  ['/profile', ['Polindo o perfil Maker…', 'Organizando as conquistas…']],
  ['/feed', ['Atualizando o feed…', 'Buscando novidades da bancada…']],
  ['/admin', ['Medindo a corrente das métricas…', 'Lendo os logs técnicos…']],
];

export function messagesForPath(pathname: string | null) {
  const hit = ROUTE_MESSAGES.find(([prefix]) => pathname?.startsWith(prefix));
  return hit ? [...hit[1], ...DEFAULT_LOADING_MESSAGES.slice(0, 2)] : DEFAULT_LOADING_MESSAGES;
}

const SIZES = { sm: 64, md: 96, lg: 136 } as const;

type Props = {
  size?: keyof typeof SIZES;
  mood?: NodoMood;
  /** frase fixa; sem ela o loader alterna entre `messages` */
  label?: string;
  messages?: string[];
  /** `inline` deixa o Nodo pequeno ao lado do texto, para painéis e listas */
  layout?: 'stack' | 'inline';
  className?: string;
};

export function NodoLoader({
  size = 'md',
  mood = 'thinking',
  label,
  messages = DEFAULT_LOADING_MESSAGES,
  layout = 'stack',
  className = '',
}: Props) {
  const [index, setIndex] = useState(0);
  const rotating = !label && messages.length > 1;

  useEffect(() => {
    if (!rotating) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 2400);
    return () => clearInterval(id);
  }, [rotating, messages.length]);

  const text = label ?? messages[index % messages.length];

  if (layout === 'inline') {
    return (
      <div role="status" aria-live="polite" className={`flex items-center gap-3 ${className}`}>
        <Nodo size={36} mood={mood} rolling />
        <span key={text} className="nodo-msg text-sm font-medium">{text}</span>
      </div>
    );
  }

  const px = SIZES[size];
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex flex-col items-center">
        <Nodo size={px} mood={mood} rolling />
        <CircuitTrack width={px * 2.2} />
      </div>
      <p key={text} className="nodo-msg max-w-xs text-center text-sm font-medium text-zinc-400">
        {text}
      </p>
    </div>
  );
}

// trilha de circuito que corre sob as esteiras: os traços passam e os nós acendem um a um
function CircuitTrack({ width }: { width: number }) {
  const nodes = [0.12, 0.32, 0.52, 0.72, 0.9];
  return (
    <svg width={width} height="14" viewBox="0 0 220 14" fill="none" aria-hidden className="-mt-2">
      <defs>
        <linearGradient id="nodo-track-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#FFA500" stopOpacity="0" />
          <stop offset="0.2" stopColor="#FFA500" stopOpacity="0.7" />
          <stop offset="0.8" stopColor="#FFA500" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFA500" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="nodo-ground" d="M0 7H220" stroke="url(#nodo-track-fade)" strokeWidth="2" strokeDasharray="10 6" />
      {nodes.map((x, i) => (
        <circle key={x} className="nodo-node" cx={x * 220} cy="7" r="3" fill="#00C4B4" style={{ animationDelay: `${i * 0.22}s` }} />
      ))}
    </svg>
  );
}
