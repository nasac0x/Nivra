'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { useNivra } from '@/components/NivraContext';

/** Header ligado ao contexto — nenhum prop manual. */
export function HeaderContainer() {
  const {
    ui,
    setUI,
    currentPeriod,
    setCurrentPeriod,
    customRange,
    setCustomRange,
    activeCurrency,
    setActiveCurrency,
    exportCurrentPeriodXLSX,
    exportAllXLSX,
    exportCurrentPeriodPDF,
    exportAllPDF,
    exportJSON,
    cloud,
    openAddModal,
  } = useNivra();

  return (
    <Header
      activeWorkspace={ui.activeWorkspace}
      onSelectWorkspace={(ws) => setUI({ activeWorkspace: ws })}
      currentPeriod={currentPeriod}
      onSelectPeriod={setCurrentPeriod}
      customRange={customRange}
      onUpdateCustomRange={setCustomRange}
      activeCurrency={activeCurrency}
      onSelectCurrency={setActiveCurrency}
      onOpenAddModal={() => openAddModal(null)}
      onExportCurrentPeriodXLSX={exportCurrentPeriodXLSX}
      onExportAllXLSX={exportAllXLSX}
      onExportCurrentPeriodPDF={exportCurrentPeriodPDF}
      onExportAllPDF={exportAllPDF}
      onExportJSON={exportJSON}
      isEditMode={ui.isEditMode}
      onToggleEditMode={() => setUI({ isEditMode: !ui.isEditMode })}
      onOpenSettings={() => setUI({ isSettingsOpen: true })}
      cloudUser={cloud.user}
      cloudConfigured={cloud.configured}
      cloudSyncing={cloud.syncing}
      onOpenCloud={cloud.openAuth}
      onSignOutCloud={cloud.signOut}
      onReplayIntro={() => setUI({ showIntroAnimation: true })}
    />
  );
}
