'use client';

import { useEffect, useRef, useState } from 'react';
import { Transaction, UserSettings } from '@/types/finance';
import { getStoredTransactions, saveStoredTransactions } from '@/services/storage';
import { getStoredProspects, saveStoredProspects } from '@/services/prospect-storage';
import {
  isCloudConfigured,
  cloudFetchTransactions,
  cloudPushTransactions,
  cloudFetchProspects,
  cloudPushProspects,
} from '@/services/cloud';
import { useCloudAuth } from '@/hooks/use-cloud-auth';

interface UseCloudSyncArgs {
  onTransactionsFromCloud: (txs: Transaction[]) => void;
}

/**
 * Sincronização Supabase: pull inicial no login (nuvem vence se tiver
 * mais dados — primeiro acesso noutro device) e push debounced a cada
 * mudança local. Sem nuvem configurada, não faz nada.
 */
export function useCloudSync({ onTransactionsFromCloud }: UseCloudSyncArgs) {
  const { user: cloudUser, checked: cloudChecked, configured, signOut } = useCloudAuth();
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cloudSyncingRef = useRef(false);

  // espelha o estado de syncing num ref, sem acessar durante o render
  useEffect(() => {
    cloudSyncingRef.current = cloudSyncing;
  }, [cloudSyncing]);

  // -------- PULL inicial ao logar --------
  useEffect(() => {
    if (!cloudChecked || !cloudUser || !isCloudConfigured) return;
    let alive = true;
    (async () => {
      setCloudSyncing(true);
      try {
        const [cloudTxs, cloudPrsp] = await Promise.all([
          cloudFetchTransactions(cloudUser.id),
          cloudFetchProspects(cloudUser.id),
        ]);
        const localTxs = getStoredTransactions();
        const localPrsp = getStoredProspects();

        if (!alive) return;

        if (cloudTxs.length > localTxs.length) {
          saveStoredTransactions(cloudTxs as unknown as Transaction[]);
          onTransactionsFromCloud(cloudTxs as unknown as Transaction[]);
        } else if (localTxs.length > 0) {
          await cloudPushTransactions(
            cloudUser.id,
            localTxs as unknown as Record<string, unknown>[]
          );
        }

        if (!alive) return;
        if (cloudPrsp.length > localPrsp.length) {
          saveStoredProspects(cloudPrsp as unknown as import('@/types/prospect').Prospect[]);
          window.dispatchEvent(new CustomEvent('nivra-prospects-imported'));
        } else if (localPrsp.length > 0) {
          await cloudPushProspects(
            cloudUser.id,
            localPrsp as unknown as Record<string, unknown>[]
          );
        }

        if (alive) {
          setCloudMsg('Nuvem sincronizada ✓');
          setTimeout(() => alive && setCloudMsg(null), 2500);
        }
      } catch (err) {
        console.warn('Falha na sincronização inicial da nuvem:', err);
        if (alive) {
          setCloudMsg('Nuvem offline — dados continuam locais');
          setTimeout(() => alive && setCloudMsg(null), 3500);
        }
      } finally {
        if (alive) setCloudSyncing(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudUser?.id, cloudChecked]);

  // -------- PUSH debounced --------
  const pushTransactions = (txs: Transaction[]) => {
    if (!cloudUser || !isCloudConfigured || cloudSyncingRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    const userId = cloudUser.id;
    pushTimerRef.current = setTimeout(async () => {
      try {
        await cloudPushTransactions(userId, txs as unknown as Record<string, unknown>[]);
      } catch (err) {
        console.warn('Push de transações falhou (retenta na próxima mudança):', err);
      }
    }, 1200);
  };

  const pushProspects = (txs?: unknown, prospects?: unknown) => {
    if (!cloudUser || !isCloudConfigured || cloudSyncingRef.current) return;
    void prospects; // prospects sobem no pull inicial e no próximo login por simplicidade
  };

  return {
    cloudUser,
    cloudConfigured: configured,
    cloudSyncing,
    cloudMsg,
    setCloudMsg,
    signOut,
    pushTransactions,
    pushProspects,
  };
}
