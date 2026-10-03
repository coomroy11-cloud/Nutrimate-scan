import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Navy/Blue Teal Gradient for Letter N */}
        <linearGradient id="nTealGrad" x1="20" y1="20" x2="60" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C5E7D" />
          <stop offset="100%" stopColor="#257A9E" />
        </linearGradient>

        {/* Organic Fresh Green Gradient for Leaf */}
        <linearGradient id="leafGrad" x1="40" y1="35" x2="68" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#48C774" />
          <stop offset="60%" stopColor="#2CA860" />
          <stop offset="100%" stopColor="#1E8A4C" />
        </linearGradient>

        {/* Aqua Teal Gradient for Right Curve */}
        <linearGradient id="rightCurveGrad" x1="55" y1="45" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2ABBA7" />
          <stop offset="100%" stopColor="#329E8E" />
        </linearGradient>

        {/* Soft Drop Shadow for Icon Depth */}
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F384C" floodOpacity="0.12" />
        </filter>
      </defs>

      <g filter="url(#logoShadow)">
        {/* 1. Left Vertical Stem of 'N' */}
        <rect
          x="20"
          y="28"
          width="13"
          height="54"
          rx="6.5"
          fill="url(#nTealGrad)"
        />

        {/* 2. Top Arch of 'N' curving down */}
        <path
          d="M 26.5 28 C 30 18, 52 18, 60 36 C 63 43, 63 56, 56 66 C 50 74, 42 75, 36 72"
          fill="none"
          stroke="url(#nTealGrad)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3. The Natural Leaf (Nestled inside N, pointing diagonally) */}
        <path
          d="M 40 40 C 58 35, 68 52, 65 72 C 45 74, 34 60, 40 40 Z"
          fill="url(#leafGrad)"
        />

        {/* Leaf Center Vein */}
        <path
          d="M 43 45 C 48 55, 54 62, 63 68"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* 4. Right Upward Curve (forming the U / M flow) */}
        <path
          d="M 52 74 C 64 77, 79 72, 79 56 L 79 38"
          fill="none"
          stroke="url(#rightCurveGrad)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* 5. Floating Particle 1: Small Green Pill / Dot */}
        <circle cx="68" cy="28" r="4.5" fill="#38B2AC" />
        <circle cx="68" cy="28" r="2" fill="#E6FFFA" opacity="0.6" />

        {/* 6. Floating Particle 2: Glowing Sun / Cross Sparkle */}
        <g transform="translate(80, 16)">
          {/* Outer Sun Rays */}
          <circle cx="0" cy="0" r="6" fill="#84CC16" opacity="0.9" />
          <circle cx="0" cy="0" r="3.5" fill="#FEF08A" />
          <path
            d="M 0 -7.5 L 0 7.5 M -7.5 0 L 7.5 0"
            stroke="#65A30D"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
};

interface AppIconBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withShadow?: boolean;
  className?: string;
}

export const AppIconBadge: React.FC<AppIconBadgeProps> = ({
  size = 'md',
  withShadow = true,
  className = '',
}) => {
  const sizeMap = {
    xs: 'w-8 h-8 rounded-xl p-1',
    sm: 'w-10 h-10 rounded-2xl p-1.5',
    md: 'w-14 h-14 rounded-2xl p-2',
    lg: 'w-20 h-20 rounded-3xl p-3',
    xl: 'w-28 h-28 rounded-[2rem] p-4',
  };

  const shadowClass = withShadow
    ? 'shadow-md shadow-emerald-950/10 border border-slate-100 ring-1 ring-black/5'
    : 'border border-slate-100';

  return (
    <div
      className={`bg-white flex items-center justify-center shrink-0 transition-transform ${sizeMap[size]} ${shadowClass} ${className}`}
    >
      <AppLogo className="w-full h-full object-contain" />
    </div>
  );
};
