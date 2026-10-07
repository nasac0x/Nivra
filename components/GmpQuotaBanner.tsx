'use client';

import React, { useEffect, useState } from 'react';

export const GmpQuotaBanner: React.FC = () => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    // Tier 1 quota listener
    if (typeof window !== 'undefined') {
      (window as any).gm_authFailure = () => {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      };

      const origError = console.error;
      console.error = (...args: unknown[]) => {
        origError.apply(console, args);
        const msg = args.map((a) => String(a)).join(' ');
        if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      };

      const handleQuotaEvent = () => {
        setQuotaExceeded(true);
      };

      window.addEventListener('gmp-quota-exceeded', handleQuotaEvent);
      return () => {
        window.removeEventListener('gmp-quota-exceeded', handleQuotaEvent);
      };
    }
  }, []);

  if (!quotaExceeded) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
    </div>
  );
};
