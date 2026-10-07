'use client';

import React from 'react';

interface NivraLogoProps {
  variant?: 'symbol' | 'horizontal' | 'wordmark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  colorVariant?: 'purple' | 'monochrome' | 'white';
  subtitle?: string;
  className?: string;
  glow?: boolean;
}

/**
 * NivraSymbol: Vector geometry of the official NIVRA monogram.
 * Features the dynamic ascending "N" with the chart growth vector and parallel acceleration bars.
 */
export const NivraSymbol: React.FC<{
  className?: string;
  fillColor?: string;
  glow?: boolean;
}> = ({ className = 'w-8 h-8', fillColor = '#9B4DFF', glow = false }) => {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_16px_rgba(155,77,255,0.7)]' : ''}`}
    >
      <defs>
        <linearGradient id="nivra-symbol-grad" x1="10" y1="90" x2="150" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8534F5" />
          <stop offset="60%" stopColor="#9B4DFF" />
          <stop offset="100%" stopColor="#B377FF" />
        </linearGradient>
      </defs>

      {/* Main geometric N ribbon */}
      {/* 1. Left ascending leg and central valley */}
      <path
        d="M 12 92 L 48 24 L 72 24 L 98 72 L 98 52 L 126 12 L 148 4 L 122 52 L 102 92 L 78 92 L 52 48 L 34 84 Z"
        fill={fillColor === 'gradient' ? 'url(#nivra-symbol-grad)' : fillColor}
      />

      {/* 2. Acceleration bar 1 (inner chart growth stripe) */}
      <path
        d="M 72 44 L 84 24 L 94 24 L 82 44 Z"
        fill={fillColor === 'gradient' ? 'url(#nivra-symbol-grad)' : fillColor}
      />

      {/* 3. Acceleration bar 2 (middle chart growth stripe) */}
      <path
        d="M 88 56 L 104 28 L 114 28 L 98 56 Z"
        fill={fillColor === 'gradient' ? 'url(#nivra-symbol-grad)' : fillColor}
      />
    </svg>
  );
};

/**
 * NivraWordmark: Custom geometric typographic wordmark with open inverted-V 'A' (N I V R Ʌ).
 */
export const NivraWordmark: React.FC<{
  className?: string;
  fillColor?: string;
}> = ({ className = 'h-6', fillColor = '#FFFFFF' }) => {
  return (
    <svg
      viewBox="0 0 320 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 'N' */}
      <path
        d="M 10 50 L 10 10 L 22 10 L 46 38 L 46 10 L 58 10 L 58 50 L 46 50 L 22 22 L 22 50 Z"
        fill={fillColor}
      />

      {/* 'I' */}
      <path
        d="M 82 10 L 94 10 L 94 50 L 82 50 Z"
        fill={fillColor}
      />

      {/* 'V' */}
      <path
        d="M 118 10 L 132 10 L 146 42 L 160 10 L 174 10 L 153 50 L 139 50 Z"
        fill={fillColor}
      />

      {/* 'R' */}
      <path
        d="M 196 10 L 226 10 C 238 10 246 16 246 25 C 246 33 239 38 228 39 L 246 50 L 232 50 L 216 40 L 208 40 L 208 50 L 196 50 Z M 208 20 L 208 31 L 224 31 C 230 31 234 29 234 25.5 C 234 22 230 20 224 20 Z"
        fill={fillColor}
      />

      {/* 'Ʌ' (Custom geometric open apex, no crossbar) */}
      <path
        d="M 288 10 L 302 10 L 324 50 L 310 50 L 295 22 L 280 50 L 266 50 Z"
        fill={fillColor}
      />
    </svg>
  );
};

export const NivraLogo: React.FC<NivraLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  colorVariant = 'purple',
  subtitle,
  className = '',
  glow = false,
}) => {
  // Sizing definitions
  const sizeMap = {
    xs: { symbol: 'w-5 h-5', wordmark: 'h-3.5', text: 'text-[8px]', gap: 'gap-1.5' },
    sm: { symbol: 'w-6 h-6', wordmark: 'h-4', text: 'text-[9px]', gap: 'gap-2' },
    md: { symbol: 'w-8 h-8', wordmark: 'h-5', text: 'text-[10px]', gap: 'gap-2.5' },
    lg: { symbol: 'w-10 h-10', wordmark: 'h-6', text: 'text-xs', gap: 'gap-3' },
    xl: { symbol: 'w-14 h-14', wordmark: 'h-8', text: 'text-sm', gap: 'gap-3.5' },
    hero: { symbol: 'w-24 h-24 sm:w-28 sm:h-28', wordmark: 'h-10 sm:h-12', text: 'text-base', gap: 'gap-5' },
  };

  const currentSize = sizeMap[size];

  // Color mapping
  const symbolFill =
    colorVariant === 'monochrome'
      ? '#E5E0F0'
      : colorVariant === 'white'
      ? '#FFFFFF'
      : 'gradient';

  const wordmarkFill =
    colorVariant === 'purple'
      ? '#FFFFFF'
      : colorVariant === 'monochrome'
      ? '#E5E0F0'
      : '#FFFFFF';

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <NivraSymbol
          className={currentSize.symbol}
          fillColor={symbolFill}
          glow={glow}
        />
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <NivraWordmark className={currentSize.wordmark} fillColor={wordmarkFill} />
        {subtitle && (
          <span className={`font-mono ${currentSize.text} tracking-[0.25em] text-[#858593] uppercase mt-0.5`}>
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  // Horizontal Lockup (Symbol + Wordmark + optional Subtitle)
  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      <NivraSymbol
        className={currentSize.symbol}
        fillColor={symbolFill}
        glow={glow}
      />
      <div className="flex flex-col justify-center leading-none">
        <NivraWordmark className={currentSize.wordmark} fillColor={wordmarkFill} />
        {subtitle && (
          <span className={`font-mono ${currentSize.text} tracking-[0.25em] text-[#858593] uppercase mt-1`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
