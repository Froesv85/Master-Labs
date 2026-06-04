interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 40, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="MakerConnect logo"
      >
        {/* Outer glow ring */}
        <circle cx="20" cy="20" r="18" stroke="#F59E0B" strokeWidth="0.5" strokeOpacity="0.3" />

        {/* Main background square with rounded corners */}
        <rect x="4" y="4" width="32" height="32" rx="7" fill="#111827" />
        <rect x="4" y="4" width="32" height="32" rx="7" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.6" />

        {/* Circuit trace — horizontal top */}
        <line x1="4" y1="13" x2="11" y2="13" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.5" />
        {/* Circuit trace — horizontal bottom */}
        <line x1="29" y1="27" x2="36" y2="27" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.5" />
        {/* Circuit trace — vertical left */}
        <line x1="13" y1="4" x2="13" y2="11" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.5" />
        {/* Circuit trace — vertical right */}
        <line x1="27" y1="29" x2="27" y2="36" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.5" />

        {/* Corner pads */}
        <circle cx="4" cy="13" r="1.5" fill="#F59E0B" fillOpacity="0.7" />
        <circle cx="36" cy="27" r="1.5" fill="#F59E0B" fillOpacity="0.7" />
        <circle cx="13" cy="4" r="1.5" fill="#F59E0B" fillOpacity="0.7" />
        <circle cx="27" cy="36" r="1.5" fill="#F59E0B" fillOpacity="0.7" />

        {/* Center M letter — bold circuit style */}
        <path
          d="M11 27V13L20 22L29 13V27"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Node dots on the M path */}
        <circle cx="11" cy="13" r="1.8" fill="#FFA500" />
        <circle cx="20" cy="22" r="1.8" fill="#FFA500" />
        <circle cx="29" cy="13" r="1.8" fill="#FFA500" />
        <circle cx="11" cy="27" r="1.5" fill="#F59E0B" fillOpacity="0.8" />
        <circle cx="29" cy="27" r="1.5" fill="#F59E0B" fillOpacity="0.8" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-base font-black tracking-tight text-white">
            MAKER<span className="text-amber-400">CONNECT</span>
          </span>
          <span className="text-[9px] font-semibold tracking-[0.2em] text-amber-500/60 uppercase">
            Circuit Community
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return <Logo size={size} showText={false} className={className} />;
}
