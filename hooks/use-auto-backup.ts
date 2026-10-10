'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  isAutoBackupSupported,
  pickBackupFolder,
  hasBackupFolder,
  clearBackupFolder,
  writeAutoBackup,
  readLastAutoBackup,
} from '@/services/autobackup';

const INTERVAL_MS = 3 * 60 * 1000; // 3 minutos

export type AutoBackupStatus = 'unsupported' | 'off' | 'configured' | 'active';

/**
 * Auto-backup local: grava nivra-autobackup.json na pasta escolhida,
 * a cada 3 min, só quando os dados mudaram e a aba está visível.
 * Retenção dupla (atual + anterior) — nunca lota, sempre há um íntegro.
 */
export function useAutoBackup(getPayload: () => Record<string, unknown>) {
  const [status, setStatus] = useState<AutoBackupStatus>('unsupported');
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const payloadRef = useRef(getPayload);
  const lastSnapshotRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // mantém o ref atualizado sem acessá-lo durante o render
  useEffect(() => {
    payloadRef.current = getPayload;
  }, [getPayload]);

  // estado inicial: suportado? pasta já configurada?
  useEffect(() => {
    if (!isAutoBackupSupported()) return; // fica 'unsupported'
    hasBackupFolder().then((has) => setStatus(has ? 'configured' : 'off'));
  }, []);

  const runBackup = useCallback(async () => {
    if (document.visibilityState !== 'visible') return; // aba em fundo: pula
    const payload = payloadRef.current();
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSnapshotRef.current) return; // nada mudou

    const ok = await writeAutoBackup(payload as Parameters<typeof writeAutoBackup>[0]);
    if (ok) {
      lastSnapshotRef.current = snapshot;
      setLastBackupAt(new Date().toISOString());
      setStatus('active');
    }
    // se falhou (sem permissão), mantém configured e tenta de novo no próximo tick
  }, []);

  // ticker de 3 minutos
  useEffect(() => {
    if (status === 'unsupported') return;
    timerRef.current = setInterval(() => {
      runBackup();
    }, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status === 'unsupported', runBackup]);

  // última chance ao fechar a aba
  useEffect(() => {
    const onUnload = () => {
      const payload = payloadRef.current();
      const snapshot = JSON.stringify(payload);
      if (snapshot !== lastSnapshotRef.current) {
        // escrita síncrona não existe na API; ao menos tenta (best-effort)
        void writeAutoBackup(payload as Parameters<typeof writeAutoBackup>[0]);
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    const ok = await pickBackupFolder();
    if (ok) {
      setStatus('configured');
      // primeiro backup imediato
      const payload = payloadRef.current();
      await writeAutoBackup(payload as Parameters<typeof writeAutoBackup>[0]);
      lastSnapshotRef.current = JSON.stringify(payload);
      setLastBackupAt(new Date().toISOString());
      setStatus('active');
    }
    return ok;
  }, []);

  const disable = useCallback(async () => {
    await clearBackupFolder();
    setStatus('off');
    lastSnapshotRef.current = '';
    setLastBackupAt(null);
  }, []);

  const lastBackupInfo = useCallback(async () => {
    const data = await readLastAutoBackup();
    return data ? (data.exportedAt as string) : null;
  }, []);

  return { status, lastBackupAt, enable, disable, lastBackupInfo };
}
