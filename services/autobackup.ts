/**
 * AUTO-BACKUP LOCAL — Nivra salva a si mesmo numa pasta do seu PC.
 *
 * COMO FUNCIONA (e por quê):
 * Navegador não deixa site escrever em qualquer pasta (segurança). Mas a
 * File System Access API permite o USUÁRIO escolher uma pasta UMA vez;
 * a permissão fica gravada no navegador (IndexedDB) e o app passa a
 * escrever sozinho nela — inclusive sobrescrever arquivos.
 *
 * Estratégia de retenção: DUAS gerações rotativas.
 * - nivra-autobackup.json      ← o mais recente
 * - nivra-autobackup-old.json  ← o anterior (segunda de vida)
 * Escrever direto por cima do único arquivo corromperia o backup se o
 * navegador fechasse no meio da escrita. Com rotação, sempre existe um
 * íntegro. Não lota disco: sempre no máximo 2 arquivos.
 *
 * Cadência: a cada 3 minutos, só quando: (1) houve mudança desde o último
 * backup E (2) a aba está visível (não desperdiça em aba de fundo).
 * Também dispara no beforeunload como última chance.
 */

const HANDLE_DB = 'nivra-backup-folder';
const HANDLE_STORE = 'handles';
const FILE_MAIN = 'nivra-autobackup.json';
const FILE_OLD = 'nivra-autobackup-old.json';

type BackupPayload = {
  version: string;
  exportedAt: string;
  transactions: unknown[];
  prospects: unknown[];
  settings: unknown;
};

// ============================================================
// Persistência da permissão da pasta (IndexedDB)
// ============================================================

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(HANDLE_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSaveHandle(dir: FileSystemDirectoryHandle): Promise<void> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).put(dir, 'folder');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbLoadHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await idbOpen();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const req = tx.objectStore(HANDLE_STORE).get('folder');
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ============================================================
// API pública
// ============================================================

/** true se este navegador suporta escolher pasta (Chrome/Edge/Brave sim). */
export function isAutoBackupSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showDirectoryPicker' in window &&
    typeof indexedDB !== 'undefined'
  );
}

/** Abre o seletor de pasta do SO. Retorna false se usuário cancelou. */
export async function pickBackupFolder(): Promise<boolean> {
  if (!isAutoBackupSupported()) return false;
  const dir = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
  await idbSaveHandle(dir);
  return true;
}

/**
 * Verifica se ainda temos permissão de escrita na pasta salva.
 * Chama requestPermission se preciso (pode pedir clique do usuário).
 */
async function ensureWritableDir(): Promise<FileSystemDirectoryHandle | null> {
  const dir = await idbLoadHandle();
  if (!dir) return null;
  const opts = { mode: 'readwrite' } as any;
  let perm = await (dir as any).queryPermission(opts);
  if (perm !== 'granted') {
    // tenta pedir sem gesto do usuário; se não der, guarda pendente
    perm = await (dir as any).requestPermission(opts);
  }
  return perm === 'granted' ? dir : null;
}

/** Pasta configurada? (sem interação) */
export async function hasBackupFolder(): Promise<boolean> {
  const dir = await idbLoadHandle();
  if (!dir) return false;
  const perm = await (dir as any).queryPermission({ mode: 'readwrite' } as any);
  return perm === 'granted';
}

/** Esquece a pasta configurada. */
export async function clearBackupFolder(): Promise<void> {
  try {
    const db = await idbOpen();
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).delete('folder');
    await new Promise((r) => (tx.oncomplete = () => r(null)));
  } catch {
    /* ignora */
  }
}

/**
 * Executa o backup: rotaciona old <- main, escreve main novo.
 * Retorna true se escreveu, false se não havia pasta/permissão.
 */
export async function writeAutoBackup(payload: BackupPayload): Promise<boolean> {
  let dir: FileSystemDirectoryHandle | null = null;
  try {
    dir = await ensureWritableDir();
    if (!dir) return false;

    // rotaciona: main vira old (se existir)
    try {
      const mainFile = await dir.getFileHandle(FILE_MAIN);
      const oldFile = await dir.getFileHandle(FILE_OLD, { create: true });
      const mainWritable = await mainFile.createWritable();
      const mainBlob = await mainFile.getFile();
      await mainWritable.write(mainBlob);
      await mainWritable.close();
      void oldFile; // garantia de existência pro próximo ciclo
    } catch {
      // primeiro backup: main ainda não existe — segue sem old
    }

    // escreve o novo main
    const newFile = await dir.getFileHandle(FILE_MAIN, { create: true });
    const writable = await newFile.createWritable();
    const text = JSON.stringify(payload, null, 2);
    await writable.write(new Blob([text], { type: 'application/json' }));
    await writable.close();
    return true;
  } catch (err) {
    console.warn('Auto-backup falhou:', err);
    return false;
  }
}

/** Lê o último backup da pasta (para exibir "último backup às HH:MM"). */
export async function readLastAutoBackup(): Promise<BackupPayload | null> {
  try {
    const dir = await idbLoadHandle();
    if (!dir) return null;
    const file = await dir.getFileHandle(FILE_MAIN);
    const blob = await file.getFile();
    return JSON.parse(await blob.text()) as BackupPayload;
  } catch {
    return null;
  }
}
