'use client';

import React, { useState, useEffect } from 'react';
import { ProspectMap } from './ProspectMap';
import { ProspectList } from './ProspectList';
import { ProspectModal } from './ProspectModal';
import { ProspectDetailsModal } from './ProspectDetailsModal';
import { Prospect, ProspectStatus, ProspectInteraction } from '@/types/prospect';
import {
  getStoredProspects,
  saveStoredProspects,
  deleteStoredProspect,
  INITIAL_SAMPLE_PROSPECTS,
} from '@/services/prospect-storage';
import { Map, Users, CheckCircle2, TrendingUp, Compass, Plus, RotateCcw, X, Undo2 } from 'lucide-react';

interface ProspectWorkspaceProps {
  apiKey?: string;
}

const emptySubscribe = () => () => {};

export const ProspectWorkspace: React.FC<ProspectWorkspaceProps> = ({ apiKey }) => {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [prospects, setProspects] = useState<Prospect[]>(() => getStoredProspects());
  const [activeMobileTab, setActiveMobileTab] = useState<'map' | 'list'>('map');
  const [mapSize, setMapSize] = useState<'compact' | 'normal' | 'expanded' | 'collapsed'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nivra_prospect_map_size_v1');
      if (saved === 'compact' || saved === 'normal' || saved === 'expanded' || saved === 'collapsed') {
        return saved;
      }
    }
    return 'normal';
  });
const handleMapSizeChange = (newSize: 'compact' | 'normal' | 'expanded' | 'collapsed') => {
    setMapSize(newSize);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nivra_prospect_map_size_v1', newSize);
    }
  };
  // Deletion feedback & Undo
  const [lastDeletedProspect, setLastDeletedProspect] = useState<Prospect | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Ouvinte para preencher automaticamente o modal quando clicar em adicionar um lugar do mapa
  useEffect(() => {
    const handleAddPlace = (e: any) => {
      const place = e.detail;
      if (place) {
        // Mapeia os dados do Google Places para a estrutura do Prospect
        setEditingProspect({
          id: '',
          name: place.name || '',
          category: place.category || 'Comércio Local',
          status: 'NA LISTA',
          phone: place.phone || '',
          website: place.website || '',
          address: place.address || '',
          city: place.address ? place.address.split(',').slice(-2, -1)[0]?.trim() || '' : '',
          lat: place.lat,
          lng: place.lng,
          interactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any);
        setIsAddModalOpen(true);
      }
    };

    window.addEventListener('nivra-add-place-to-prospect', handleAddPlace);
    return () => window.removeEventListener('nivra-add-place-to-prospect', handleAddPlace);
  }, []);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [selectedDetailsProspect, setSelectedDetailsProspect] = useState<Prospect | null>(null);

  // Map center sync
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  const updateProspects = (updaterOrList: Prospect[] | ((prev: Prospect[]) => Prospect[])) => {
    setProspects((prev) => {
      const next = typeof updaterOrList === 'function' ? updaterOrList(prev) : updaterOrList;
      saveStoredProspects(next);
      return next;
    });
  };

// Handler: Save (Create or Update)
  const handleSaveProspect = (
    prospectData: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>
  ) => {
    // Se tem editingProspect E ele tem um ID real (não vazio), é edição. Senão, é novo!
    if (editingProspect && editingProspect.id) {
      updateProspects((prev) =>
        prev.map((p) => {
          if (p.id === editingProspect.id) {
            return {
              ...p,
              ...prospectData,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        })
      );
      setEditingProspect(null);
    } else {
      const newProspect: Prospect = {
        ...prospectData,
        id: 'pr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
        interactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updateProspects((prev) => [newProspect, ...prev]);
      setEditingProspect(null);
    }
  };

  // Handler: Delete with Undo capability
  const handleDeleteProspect = (id: string) => {
    setProspects((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        setLastDeletedProspect(target);
        setShowUndoToast(true);
      }
      const next = prev.filter((p) => p.id !== id);
      saveStoredProspects(next);
      return next;
    });

    if (selectedDetailsProspect?.id === id) {
      setSelectedDetailsProspect(null);
    }
  };

  const handleUndoDelete = () => {
    if (!lastDeletedProspect) return;
    setProspects((prev) => {
      const next = [lastDeletedProspect, ...prev.filter((p) => p.id !== lastDeletedProspect.id)];
      saveStoredProspects(next);
      return next;
    });
    setShowUndoToast(false);
    setLastDeletedProspect(null);
  };

  // Handler: Update status
  const handleUpdateStatus = (id: string, newStatus: ProspectStatus) => {
    updateProspects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    // Keep details modal in sync
    if (selectedDetailsProspect?.id === id) {
      setSelectedDetailsProspect((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Handler: Add interaction
  const handleAddInteraction = (
    prospectId: string,
    interaction: Omit<ProspectInteraction, 'id'>
  ) => {
    const newInt: ProspectInteraction = {
      ...interaction,
      id: 'int_' + Date.now().toString(36),
    };

    updateProspects((prev) =>
      prev.map((p) => {
        if (p.id === prospectId) {
          return {
            ...p,
            interactions: [...(p.interactions || []), newInt],
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    if (selectedDetailsProspect?.id === prospectId) {
      setSelectedDetailsProspect((prev) =>
        prev
          ? {
              ...prev,
              interactions: [...(prev.interactions || []), newInt],
            }
          : null
      );
    }
  };

  // Handler: Center on map when prospect is clicked
  const handleSelectProspectForMap = (prospect: Prospect) => {
    if (prospect.lat && prospect.lng) {
      setMapCenter({ lat: prospect.lat, lng: prospect.lng });
    }
    // On mobile, automatically show map when selecting
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setActiveMobileTab('map');
    }
  };

  // Reset sample data
  const handleResetSampleProspects = () => {
    if (confirm('Deseja recarregar os exemplos iniciais de prospecção?')) {
      updateProspects(INITIAL_SAMPLE_PROSPECTS);
    }
  };

  // Funnel KPIs
  const totalCount = prospects.length;
  const inListCount = prospects.filter((p) => p.status === 'NA LISTA' || p.status === 'CONTATO A FAZER').length;
  const inProgressCount = prospects.filter((p) =>
    ['CONTATO FEITO', 'AGUARDANDO RESPOSTA', 'FOLLOW-UP PENDENTE', 'NEGOCIAÇÃO'].includes(p.status)
  ).length;
  const convertedCount = prospects.filter((p) => p.status === 'CONVERTIDO EM CLIENTE').length;

  if (!isMounted) return null;

  return (
    <div className="space-y-4">
      {/* Top Prospect Funnel Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10.5px] text-[#858593] uppercase tracking-wider block">
              Total Prospects
            </span>
            <span className="text-xl font-bold text-[#F0E9FF] mt-0.5 block">
              {totalCount}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#9B4DFF]/15 border border-[#9B4DFF]/30 flex items-center justify-center text-[#C69BFF]">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10.5px] text-[#858593] uppercase tracking-wider block">
              Na Lista / A Fazer
            </span>
            <span className="text-xl font-bold text-amber-300 mt-0.5 block">
              {inListCount}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Compass className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10.5px] text-[#858593] uppercase tracking-wider block">
              Em Contato / Negociação
            </span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 block">
              {inProgressCount}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10.5px] text-[#858593] uppercase tracking-wider block">
              Convertidos
            </span>
            <span className="text-xl font-bold text-emerald-300 mt-0.5 block">
              {convertedCount}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher: [ MAPA ] [ PROSPECTS ] (Hidden on md and up) */}
      <div className="flex md:hidden items-center justify-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-lg font-mono text-xs">
        <button
          onClick={() => setActiveMobileTab('map')}
          className={`flex-1 py-2 text-center rounded-md font-semibold transition-all cursor-pointer ${
            activeMobileTab === 'map'
              ? 'bg-[#9B4DFF] text-white shadow-md'
              : 'text-[#858593] hover:text-white'
          }`}
        >
          MAPA
        </button>
        <button
          onClick={() => setActiveMobileTab('list')}
          className={`flex-1 py-2 text-center rounded-md font-semibold transition-all cursor-pointer ${
            activeMobileTab === 'list'
              ? 'bg-[#9B4DFF] text-white shadow-md'
              : 'text-[#858593] hover:text-white'
          }`}
        >
          PROSPECTS ({prospects.length})
        </button>
      </div>

      {/* Stacked Layout: Map on top (with size controls), Wide Prospect List on bottom */}
      <div className="flex flex-col gap-5 w-full">
        {/* Top Block: Google Maps Exploration (Full-width, customizable height) */}
        <div className={`w-full ${activeMobileTab === 'map' ? 'block' : 'hidden md:block'}`}>
          <ProspectMap
            apiKey={apiKey}
            mapSize={mapSize}
            onMapSizeChange={handleMapSizeChange}
            onOpenManualAddModal={() => {
              setEditingProspect(null);
              setIsAddModalOpen(true);
            }}
            selectedCenter={mapCenter}
            activeProspects={prospects}
            onSelectProspect={(p) => setSelectedDetailsProspect(p)}
          />
        </div>

        {/* Bottom Block: Prospecting List & CRM (Full-Width Desktop Table, positioned UNDER the map) */}
        <div className={`w-full ${activeMobileTab === 'list' ? 'block' : 'hidden md:block'}`}>
          <ProspectList
            prospects={prospects}
            onOpenAddModal={() => {
              setEditingProspect(null);
              setIsAddModalOpen(true);
            }}
            onOpenDetailsModal={(p) => setSelectedDetailsProspect(p)}
            onOpenEditModal={(p) => {
              setEditingProspect(p);
              setIsAddModalOpen(true);
            }}
            onDeleteProspect={handleDeleteProspect}
            onSelectProspectForMap={handleSelectProspectForMap}
          />
        </div>
      </div>

      {/* Floating Undo Deletion Toast */}
      {showUndoToast && lastDeletedProspect && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-[#0E1017] border border-rose-500/40 text-[#F0E9FF] px-4 py-3 rounded-xl shadow-2xl font-mono text-xs animate-in slide-in-from-bottom duration-200">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span>
            Prospect <strong className="text-white">{lastDeletedProspect.name}</strong> removido.
          </span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="flex items-center gap-1 px-3 py-1 bg-[#9B4DFF] hover:bg-[#8534f5] text-white font-bold rounded cursor-pointer transition-colors shadow-md shadow-[#9B4DFF]/30"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Desfazer</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUndoToast(false)}
            className="text-[#858593] hover:text-white p-1 ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}


      {/* Manual Add / Edit Modal */}
      <ProspectModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProspect(null);
        }}
        onSave={handleSaveProspect}
        editingProspect={editingProspect}
      />

      {/* Prospect Details & Interactions Modal */}
      <ProspectDetailsModal
        isOpen={Boolean(selectedDetailsProspect)}
        prospect={selectedDetailsProspect}
        onClose={() => setSelectedDetailsProspect(null)}
        onEdit={(p) => {
          setSelectedDetailsProspect(null);
          setEditingProspect(p);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteProspect}
        onUpdateStatus={handleUpdateStatus}
        onAddInteraction={handleAddInteraction}
        onCenterOnMap={(lat, lng) => {
          if (lat && lng) {
            setMapCenter({ lat, lng });
          }
        }}
      />
    </div>
  );
};
