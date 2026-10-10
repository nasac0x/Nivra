'use client';

import React from 'react';
import { useNivra } from '@/components/NivraContext';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthModal } from '@/components/AuthModal';

/** Todos os modais globais num só lugar, lendo o estado do contexto. */
export function ModalsContainer() {
  const {
    ui,
    setUI,
    settings,
    activeCurrency,
    saveTransaction,
    addCategory,
    updateSettings,
    exportJSON,
    importJSON,
    clearAllData,
    resetLayout,
    autoBackup,
  } = useNivra();

  return (
    <>
      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={ui.isAddModalOpen}
        onClose={() => setUI({ isAddModalOpen: false, editingTransaction: null })}
        onSave={saveTransaction}
        initialData={ui.editingTransaction}
        activeCurrency={activeCurrency}
        categories={settings.categories}
        onAddCategory={addCategory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={ui.isSettingsOpen}
        onClose={() => setUI({ isSettingsOpen: false })}
        settings={settings}
        onSaveSettings={updateSettings}
        autoBackup={autoBackup}
        onExportJSON={exportJSON}
        onImportJSON={importJSON}
        onClearAllData={clearAllData}
        onResetLayout={resetLayout}
        onReplayIntro={() => setUI({ showIntroAnimation: true })}
      />

      {/* Cloud (Supabase) Auth Modal */}
      <AuthModal
        isOpen={ui.isAuthModalOpen}
        onClose={() => setUI({ isAuthModalOpen: false })}
        onAuthSuccess={() => {
          // no-op: o useCloudSync detecta a nova sessão sozinho
        }}
      />
    </>
  );
}
