// Nodo — mascote oficial da MakerConnect, desenhado em SVG puro para ser
// animado só com CSS (classes `nodo-*` em app/globals.css). As cores seguem a
// paleta oficial do mascote.

export const NODO_COLORS = {
  body: '#1A3A4D',
  orange: '#FFA500',
  amber: '#FFB84D',
  teal: '#00C4B4',
  screen: '#0F172A',
} as const;

export type NodoMood = 'happy' | 'idea' | 'celebrate' | 'docs' | 'thinking' | 'error';
export type NodoPose = 'wave' | 'down' | 'up' | 'clipboard';

const DEFAULT_POSE: Record<NodoMood, NodoPose> = {
  happy: 'wave',
  idea: 'down',
  celebrate: 'up',
  docs: 'clipboard',
  thinking: 'down',
  error: 'down',
};

type NodoProps = {
  size?: number;
  mood?: NodoMood;
  pose?: NodoPose;
  /** gira as rodas e move a esteira, como se estivesse andando */
  rolling?: boolean;
  /** false congela o mascote (ícones, impressão) */
  animated?: boolean;
  /** para onde o rosto olha, de -1 a 1 em cada eixo (ex.: seguir o cursor) */
  look?: { x: number; y: number };
  title?: string;
  className?: string;
};

const { body, orange, amber, teal, screen } = NODO_COLORS;

export function Nodo({
  size = 120,
  mood = 'happy',
  pose,
  rolling = false,
  animated = true,
  look,
  title,
  className = '',
}: NodoProps) {
  const p = pose ?? DEFAULT_POSE[mood];
  const glowColor = mood === 'idea' ? '#FFE08A' : mood === 'error' ? '#F87171' : orange;

  return (
    <svg
      width={size}
      height={(size * 260) / 240}
      viewBox="0 0 240 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`nodo nodo-mood-${mood} ${animated ? '' : 'nodo-static'} ${rolling ? 'nodo-rolling' : ''} ${className}`}
      overflow="visible"
    >
      {/* sombra no chão */}
      <ellipse className="nodo-shadow" cx="120" cy="248" rx="58" ry="6" fill="#000" fillOpacity="0.35" />

      {mood === 'celebrate' && <Confetti />}

      <g className={mood === 'celebrate' ? 'nodo-hop' : 'nodo-bob'}>
        {/* antena-circuito: trilha em L que termina num nó que irradia */}
        <g className={mood === 'error' ? 'nodo-flicker' : undefined}>
          <circle className="nodo-glow" cx="128" cy="24" r="17" fill={glowColor} fillOpacity="0.3" />
          <path d="M100 64V44H128V30" stroke={orange} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="100" cy="44" r="5" fill={orange} />
          <g className="nodo-rays" stroke={amber} strokeWidth="3" strokeLinecap="round">
            <path d="M122 18L114 8" />
            <path d="M134 18L142 8" />
            <path d="M136 26L148 29" />
          </g>
          <g className="nodo-rays" fill={amber}>
            <circle cx="113" cy="7" r="3.5" />
            <circle cx="143" cy="7" r="3.5" />
            <circle cx="150" cy="29" r="3.5" />
          </g>
          <circle cx="128" cy="24" r="8" fill={mood === 'idea' ? '#FFD166' : orange} />
        </g>

        <Arms pose={p} />

        {/* corpo quadrado arredondado (formato do chaveiro NFC) */}
        <rect x="108" y="196" width="24" height="12" fill={body} />
        <rect x="56" y="64" width="128" height="136" rx="28" fill={body} stroke={orange} strokeWidth="5" />

        {/* rosto em tela */}
        <rect x="72" y="80" width="96" height="58" rx="14" fill={screen} />
        <g
          className="nodo-face"
          style={look ? { transform: `translate(${look.x * 9}px, ${look.y * 6}px)` } : undefined}
        >
          <g className={mood === 'error' ? 'nodo-glitch' : undefined}>
            <Face mood={mood} />
          </g>
        </g>
        {mood === 'thinking' && (
          <rect className="nodo-scanline" x="74" y="82" width="92" height="3" rx="1.5" fill={teal} fillOpacity="0.35" />
        )}

        {/* painel do peito: trilha + equalizador */}
        <rect x="80" y="150" width="80" height="34" rx="8" fill="#12303F" />
        <path d="M89 174H103V162H117" stroke={amber} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="89" cy="174" r="3" fill={amber} />
        <circle cx="117" cy="162" r="3" fill={amber} />
        <g fill={mood === 'celebrate' ? orange : mood === 'error' ? '#F87171' : teal}>
          <rect className="nodo-bar" x="128" y="160" width="5" height="18" rx="2.5" />
          <rect className="nodo-bar" x="137" y="164" width="5" height="14" rx="2.5" style={{ animationDelay: '-0.35s' }} />
          <rect className="nodo-bar" x="146" y="168" width="5" height="10" rx="2.5" style={{ animationDelay: '-0.7s' }} />
        </g>

        {p === 'clipboard' && <Clipboard />}
      </g>

      {/* esteiras prontas para a Arena de Robôs */}
      <rect x="66" y="204" width="108" height="30" rx="15" fill="#0E2230" stroke={amber} strokeWidth="4" />
      <rect className="nodo-track" x="73" y="211" width="94" height="16" rx="8" stroke={amber} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 6" />
      {[92, 120, 148].map((cx) => (
        <g key={cx} className="nodo-wheel">
          <circle cx={cx} cy="219" r="8" fill="#12303F" stroke={amber} strokeWidth="3" />
          <path d={`M${cx - 4} 219H${cx + 4}`} stroke={amber} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function Arms({ pose }: { pose: NodoPose }) {
  const arm = { stroke: amber, strokeWidth: 7, strokeLinecap: 'round' as const };
  const leftUp = pose === 'up';
  const rightUp = pose === 'up' || pose === 'wave';

  return (
    <>
      <g className={leftUp ? 'nodo-cheer-l' : undefined}>
        {leftUp ? <path d="M58 140C36 132 32 114 38 98" {...arm} /> : <path d="M58 150C34 156 30 176 40 188" {...arm} />}
        <circle cx={leftUp ? 38 : 40} cy={leftUp ? 94 : 191} r="10" fill={orange} />
      </g>
      <g className={pose === 'wave' ? 'nodo-wave' : rightUp ? 'nodo-cheer-r' : undefined}>
        {rightUp ? (
          <path d="M182 140C204 132 208 114 202 98" {...arm} />
        ) : pose === 'clipboard' ? (
          <path d="M182 150C198 154 204 166 198 178" {...arm} />
        ) : (
          <path d="M182 150C206 156 210 176 200 188" {...arm} />
        )}
        {pose !== 'clipboard' && <circle cx={rightUp ? 202 : 200} cy={rightUp ? 94 : 191} r="10" fill={orange} />}
      </g>
      <circle cx="58" cy="146" r="7" fill={orange} />
      <circle cx="182" cy="146" r="7" fill={orange} />
    </>
  );
}

function Face({ mood }: { mood: NodoMood }) {
  const line = { stroke: teal, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (mood) {
    case 'idea':
      return (
        <>
          <g className="nodo-blink">
            <circle cx="98" cy="104" r="9" fill={teal} />
            <circle cx="142" cy="104" r="9" fill={teal} />
            <circle cx="101" cy="101" r="3" fill={screen} />
            <circle cx="145" cy="101" r="3" fill={screen} />
          </g>
          <circle cx="120" cy="125" r="4.5" stroke={teal} strokeWidth="3" />
        </>
      );
    case 'celebrate':
      return (
        <>
          <path d="M88 108L98 98L108 108" {...line} />
          <path d="M132 108L142 98L152 108" {...line} />
          <path d="M106 116H134C134 125 128 131 120 131C112 131 106 125 106 116Z" fill={teal} />
        </>
      );
    case 'docs':
      return (
        <>
          <path d="M88 99L106 103M88 108H106" {...line} strokeWidth={4} />
          <path d="M152 99L134 103M152 108H134" {...line} strokeWidth={4} />
          <path d="M114 123H126" {...line} strokeWidth={4} />
        </>
      );
    case 'thinking':
      return (
        <>
          <g className="nodo-scan">
            <g className="nodo-blink">
              <rect x="90" y="97" width="15" height="15" rx="7.5" fill={teal} />
              <rect x="135" y="97" width="15" height="15" rx="7.5" fill={teal} />
            </g>
          </g>
          <path d="M111 124Q120 119 129 124" {...line} strokeWidth={4} />
        </>
      );
    case 'error':
      return (
        <>
          <path d="M90 98L104 112M104 98L90 112" {...line} stroke="#F87171" strokeWidth={5} />
          <path d="M136 98L150 112M150 98L136 112" {...line} stroke="#F87171" strokeWidth={5} />
          <path d="M104 126Q110 120 116 126T128 126T140 126" {...line} stroke="#F87171" strokeWidth={4} />
        </>
      );
    default:
      return (
        <>
          <g className="nodo-blink">
            <path d="M88 107Q98 94 108 107" {...line} />
            <path d="M132 107Q142 94 152 107" {...line} />
          </g>
          <path d="M107 119Q120 129 133 119" {...line} strokeWidth={5} />
          <circle cx="83" cy="121" r="4.5" fill={orange} fillOpacity="0.85" />
          <circle cx="157" cy="121" r="4.5" fill={orange} fillOpacity="0.85" />
        </>
      );
  }
}

function Clipboard() {
  return (
    <g transform="rotate(10 196 174)">
      <rect x="176" y="146" width="42" height="54" rx="5" fill="#FFF7E6" stroke={orange} strokeWidth="3" />
      <rect x="188" y="141" width="18" height="9" rx="3" fill={orange} />
      {[160, 170, 180, 190].map((y, i) => (
        <path
          key={y}
          className="nodo-write"
          d={`M184 ${y}H${i === 3 ? 200 : 210}`}
          stroke={body}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}
      <circle cx="200" cy="191" r="10" fill={orange} />
    </g>
  );
}

function Confetti() {
  const bits = [
    { x: 26, y: 40, c: orange, d: '0s' },
    { x: 206, y: 30, c: teal, d: '-0.6s' },
    { x: 48, y: 14, c: amber, d: '-1.1s' },
    { x: 190, y: 64, c: orange, d: '-0.3s' },
    { x: 14, y: 76, c: teal, d: '-0.9s' },
    { x: 224, y: 86, c: amber, d: '-1.4s' },
  ];
  return (
    <g>
      {bits.map((b) => (
        <rect key={`${b.x}-${b.y}`} className="nodo-confetti" x={b.x} y={b.y} width="7" height="7" rx="1.5" fill={b.c} style={{ animationDelay: b.d }} />
      ))}
    </g>
  );
}
