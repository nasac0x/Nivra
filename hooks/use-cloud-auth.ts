'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  isCloudConfigured,
  cloudGetCurrentUser,
  onCloudAuthChange,
  CloudUser,
} from '@/services/cloud';

/**
 * Sessão de nuvem do Nivra.
 * - user: null = deslogado (ou nuvem desativada)
 * - configura o refresh do token sozinho via onAuthStateChange
 */
export function useCloudAuth() {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [checked, setChecked] = useState(false); // terminou o primeiro getSession?

  useEffect(() => {
    if (!isCloudConfigured) {
      // fora do fluxo síncrono do effect — evita cascata de renders
      const micro = setTimeout(() => setChecked(true), 0);
      return () => clearTimeout(micro);
    }
    let alive = true;
    cloudGetCurrentUser().then((u) => {
      if (!alive) return;
      setUser(u);
      setChecked(true);
    });
    const unsub = onCloudAuthChange((u) => {
      setUser(u);
      setChecked(true);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { cloudSignOut } = await import('@/services/cloud');
    await cloudSignOut();
    setUser(null);
  }, []);

  return { user, checked, configured: isCloudConfigured, signOut };
}
