export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="swoop-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#0F2537" />
          <stop offset="45%" stopColor="#0F2537" />
          <stop offset="70%" stopColor="#00A8B5" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <linearGradient id="arrow-grad" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#0F2537" />
          <stop offset="100%" stopColor="#00A8B5" />
        </linearGradient>
      </defs>

      {/* Checklist frame */}
      <rect
        x="14"
        y="8"
        width="26"
        height="29"
        rx="5"
        fill="white"
        stroke="#00A8B5"
        strokeWidth="2"
      />

      {/* Checkmark lines */}
      <path
        d="M19 15.5l2.5 2.5 4.5-4.5"
        stroke="#0F2537"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="28" y1="17" x2="36" y2="17" stroke="#0F2537" strokeWidth="1.5" strokeLinecap="round" />

      <path
        d="M19 22.5l2.5 2.5 4.5-4.5"
        stroke="#00A8B5"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="28" y1="24" x2="36" y2="24" stroke="#00A8B5" strokeWidth="1.5" strokeLinecap="round" />

      <path
        d="M19 29.5l2.5 2.5 4.5-4.5"
        stroke="#0F2537"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="28" y1="31" x2="36" y2="31" stroke="#0F2537" strokeWidth="1.5" strokeLinecap="round" />

      {/* Input arrow from left */}
      <path
        d="M2 24h10"
        stroke="url(#arrow-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 20l4 4-4 4"
        stroke="url(#arrow-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Growth swoop */}
      <path
        d="M12 42 Q10 48 18 48 Q32 48 42 42 Q50 36 46 16 Q44 6 42 3"
        fill="none"
        stroke="url(#swoop-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Upward arrow head */}
      <path
        d="M42 3l-3 7 4-1.5 2.5 5"
        stroke="#FF8C00"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lightbulb glow */}
      <circle cx="42" cy="3" r="3.5" fill="#FF8C00" opacity="0.2" />
      <path
        d="M40.5 2.5 A3 3 0 0 1 43.5 0.5"
        fill="#FF8C00"
      />
      <circle cx="42" cy="1.5" r="1.8" fill="#FF8C00" />

      {/* Sparkle rays */}
      <line x1="42" y1="-2" x2="42" y2="-0.5" stroke="#FF8C00" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="46" y1="0.5" x2="44.5" y2="1" stroke="#FF8C00" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="38" y1="0.5" x2="39.5" y2="1" stroke="#FF8C00" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="45" y1="4.5" x2="44" y2="3.5" stroke="#FF8C00" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="38" y1="-0.5" x2="39" y2="1" stroke="#FF8C00" strokeWidth="0.8" strokeLinecap="round" />

      {/* Small sparkle dots */}
      <circle cx="45" cy="-0.5" r="0.7" fill="#FF8C00" />
      <circle cx="39" cy="-0.5" r="0.5" fill="#FF8C00" />
    </svg>
  );
}

export function LogoWordmark({
  className,
  light,
}: {
  className?: string;
  light?: boolean;
}) {
  const dark = light ? "#FFFFFF" : "#0F2537";
  const teal = "#00A8B5";
  return (
    <div className={className}>
      <p className="text-lg font-bold leading-none tracking-[-0.01em]">
        <span style={{ color: dark }}>Assign</span>
        <span style={{ color: teal }}>Smart</span>
      </p>
      <p
        className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.15em]"
        style={{ color: light ? teal : "#0F2537" }}
      >
        SMART SOLUTIONS. EFFICIENT ASSIGNMENTS.
      </p>
    </div>
  );
}

export default function Logo({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const iconSizes: Record<string, string> = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  return (
    <div className="flex items-center gap-3">
      <LogoIcon className={iconSizes[size]} />
      <LogoWordmark />
    </div>
  );
}
