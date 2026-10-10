'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,

  ExternalLink,
  MessageCircle,
  Phone,
  Edit2,
  Trash2,
  Eye,
  Building2,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import {
  Prospect,
  ProspectStatus,
  PROSPECT_STATUSES,
  PROSPECT_CATEGORIES,
} from '@/types/prospect';
import { analyzePhone } from '@/lib/phone';

interface ProspectListProps {
  prospects: Prospect[];
  onOpenAddModal: () => void;
  onOpenDetailsModal: (prospect: Prospect) => void;
  onOpenEditModal: (prospect: Prospect) => void;
  onDeleteProspect: (id: string) => void;
  onSelectProspectForMap: (prospect: Prospect) => void;
}

export const ProspectList: React.FC<ProspectListProps> = ({
  prospects,
  onOpenAddModal,
  onOpenDetailsModal,
  onOpenEditModal,
  onDeleteProspect,
  onSelectProspectForMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('TODOS');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('TODAS');
  const [prospectToDelete, setProspectToDelete] = useState<Prospect | null>(null);

  // Filtered prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCity = (p.city || '').toLowerCase().includes(query);
        const matchesContact = (p.contactName || '').toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesContact && !matchesCategory) {
          return false;
        }
      }

      // Status filter
      if (selectedStatusFilter !== 'TODOS') {
        if (selectedStatusFilter === 'FOLLOW-UP') {
          if (p.status !== 'FOLLOW-UP PENDENTE') return false;
        } else if (selectedStatusFilter === 'CONVERTIDOS') {
          if (p.status !== 'CONVERTIDO EM CLIENTE') return false;
        } else if (selectedStatusFilter === 'NÃO INTERESSADOS') {
          if (p.status !== 'NÃO INTERESSADO') return false;
        } else {
          if (p.status !== selectedStatusFilter) return false;
        }
      }

      // Category filter
      if (selectedCategoryFilter !== 'TODAS') {
        if (p.category !== selectedCategoryFilter) return false;
      }

      return true;
    });
  }, [prospects, searchQuery, selectedStatusFilter, selectedCategoryFilter]);

  // Status counts for badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODOS: prospects.length,
      'NA LISTA': 0,
      'CONTATO A FAZER': 0,
      'CONTATO FEITO': 0,
      'AGUARDANDO RESPOSTA': 0,
      'FOLLOW-UP': 0,
      NEGOCIAÇÃO: 0,
      CONVERTIDOS: 0,
      'NÃO INTERESSADOS': 0,
    };

    prospects.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status]++;
      if (p.status === 'FOLLOW-UP PENDENTE') counts['FOLLOW-UP']++;
      if (p.status === 'CONVERTIDO EM CLIENTE') counts['CONVERTIDOS']++;
      if (p.status === 'NÃO INTERESSADO') counts['NÃO INTERESSADOS']++;
    });

    return counts;
  }, [prospects]);

  const quickFilterTabs = [
    'TODOS',
    'NA LISTA',
    'CONTATO A FAZER',
    'CONTATO FEITO',
    'AGUARDANDO RESPOSTA',
    'FOLLOW-UP',
    'NEGOCIAÇÃO',
    'CONVERTIDOS',
    'NÃO INTERESSADOS',
  ];

  const getStatusBadgeStyle = (status: ProspectStatus) => {
    switch (status) {
      case 'CONVERTIDO EM CLIENTE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'NEGOCIAÇÃO':
        return 'bg-[#9B4DFF]/25 text-[#DDB5FF] border-[#9B4DFF]/40';
      case 'FOLLOW-UP PENDENTE':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'AGUARDANDO RESPOSTA':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'CONTATO FEITO':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'CONTATO A FAZER':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'NÃO INTERESSADO':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-white/10 text-white/80 border-white/15';
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0A0B10] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header & Search Bar */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#07080C]/80 backdrop-blur-md space-y-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-[#9B4DFF]" />
            <h2 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#F0E9FF]">
              Lista de Prospecção
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#C69BFF]">
              {filteredProspects.length} {filteredProspects.length === 1 ? 'negócio' : 'negócios'}
            </span>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#9B4DFF] hover:bg-[#8534f5] text-white text-xs font-mono font-semibold rounded-lg shadow-md shadow-[#9B4DFF]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Novo Prospect</span>
          </button>
        </div>

        {/* Search Input & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 font-mono text-xs">
          <div className="sm:col-span-8 relative">
            <Search className="w-3.5 h-3.5 text-[#858593] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, cidade ou contato..."
              className="w-full pl-8 pr-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593] focus:outline-none focus:border-[#9B4DFF]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#07080C] border border-white/10 rounded-md text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF] cursor-pointer"
            >
              <option value="TODAS">Todas Categorias</option>
              {PROSPECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-[11px]">
          {quickFilterTabs.map((tab) => {
            const isActive = selectedStatusFilter === tab;
            const count = statusCounts[tab] || 0;
            return (
              <button
                key={tab}
                onClick={() => setSelectedStatusFilter(tab)}
                className={`px-2.5 py-1 rounded whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#9B4DFF]/25 text-[#F0E9FF] border border-[#9B4DFF]/50 font-semibold'
                    : 'bg-white/[0.02] text-[#858593] hover:text-white border border-white/[0.05]'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[9.5px] px-1 rounded ${
                    isActive ? 'bg-[#9B4DFF]/40 text-white' : 'bg-white/5 text-[#858593]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {filteredProspects.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs text-[#858593] flex flex-col items-center justify-center">
            <Building2 className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-white/80 font-medium mb-1">Nenhum prospect encontrado</p>
            <p className="text-[11px] max-w-sm text-[#858593] mb-4">
              Explore negócios no mapa acima e clique em &quot;+ Adicionar à Prospecção&quot; ou cadastre um novo manualmente.
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 bg-[#9B4DFF] hover:bg-[#8534f5] text-white rounded text-xs transition-colors cursor-pointer"
            >
              + Cadastrar Manualmente
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Full-Width Data Table (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-mono text-xs divide-y divide-white/[0.06]">
                <thead className="bg-[#07080C]/90 text-[10.5px] uppercase text-[#858593] tracking-wider select-none sticky top-0">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Negócio</th>
                    <th className="py-3 px-4 font-semibold">Categoria</th>
                    <th className="py-3 px-4 font-semibold">Cidade / Bairro</th>
                    <th className="py-3 px-4 font-semibold">Contato</th>
                    <th className="py-3 px-4 font-semibold">Telefone / WhatsApp</th>
                    <th className="py-3 px-4 font-semibold">Site</th>
                    <th className="py-3 px-4 font-semibold">Última Ação</th>
                    <th className="py-3 px-4 font-semibold">Próxima Ação</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredProspects.map((prospect) => {
                    const phoneInfo = analyzePhone(prospect.phone || '');
                    const whatsappUrl = phoneInfo.whatsappUrl;
                    const lastInteraction =
                      prospect.interactions && prospect.interactions.length > 0
                        ? prospect.interactions[prospect.interactions.length - 1]
                        : null;

                    return (
                      <tr
                        key={prospect.id}
                        onClick={() => onSelectProspectForMap(prospect)}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium ${getStatusBadgeStyle(
                              prospect.status
                            )}`}
                          >
                            {prospect.status}
                          </span>
                        </td>

                        {/* Negócio */}
                        <td className="py-3 px-4 font-semibold text-[#F0E9FF] group-hover:text-[#C69BFF] transition-colors whitespace-nowrap max-w-[200px] truncate">
                          {prospect.name}
                        </td>

                        {/* Categoria */}
                        <td className="py-3 px-4 text-[#A0A0B0] whitespace-nowrap">
                          <span className="bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] text-[11px]">
                            {prospect.category}
                          </span>
                        </td>

                        {/* Cidade / Bairro */}
                        <td className="py-3 px-4 text-[#858593] whitespace-nowrap max-w-[160px] truncate">
                          {prospect.city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#9B4DFF] shrink-0" />
                              <span className="truncate">
                                {prospect.city}
                                {prospect.neighborhood ? ` · ${prospect.neighborhood}` : ''}
                              </span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Contato */}
                        <td className="py-3 px-4 text-[#D0C9DF] whitespace-nowrap max-w-[140px] truncate">
                          {prospect.contactName || '—'}
                        </td>

                        {/* Telefone / WhatsApp */}
                        <td className="py-3 px-4 text-[#D0C9DF] whitespace-nowrap">
                          {prospect.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span>{prospect.phone}</span>
                              {!phoneInfo.hadCountryCode && whatsappUrl && (
                                <span
                                  className="text-amber-400"
                                  title={`Número salvo sem código do país — assumido +${phoneInfo.country}. Recomendado: edite e salve com o DDI (ex: +55 / +351).`}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                </span>
                              )}
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-400 hover:text-emerald-300 p-0.5"
                                  title="Abrir WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Site */}
                        <td className="py-3 px-4 whitespace-nowrap max-w-[130px] truncate">
                          {prospect.website ? (
                            <a
                              href={
                                prospect.website.startsWith('http')
                                  ? prospect.website
                                  : `https://${prospect.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#9B4DFF] hover:underline flex items-center gap-1 truncate"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{prospect.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Última Interação */}
                        <td className="py-3 px-4 text-[#858593] whitespace-nowrap max-w-[140px] truncate">
                          {lastInteraction ? (
                            <span title={lastInteraction.notes}>
                              {lastInteraction.type} ({lastInteraction.date})
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Próxima Ação */}
                        <td className="py-3 px-4 text-[#C69BFF] whitespace-nowrap max-w-[160px] truncate">
                          {prospect.nextAction ? (
                            <span title={prospect.nextAction} className="truncate">
                              {prospect.nextAction}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Ações */}
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenDetailsModal(prospect)}
                              className="p-1.5 text-[#858593] hover:text-[#F0E9FF] hover:bg-white/5 rounded transition-colors cursor-pointer"
                              title="Abrir Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}

                            <button
                              onClick={() => onOpenEditModal(prospect)}
                              className="p-1.5 text-[#858593] hover:text-[#C69BFF] hover:bg-white/5 rounded transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setProspectToDelete(prospect)}
                              className="p-1.5 text-[#858593] hover:text-red-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (Visible only on mobile screens) */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {filteredProspects.map((prospect) => {
                const phoneInfo = analyzePhone(prospect.phone || '');
                const whatsappUrl = phoneInfo.whatsappUrl;
                const lastInteraction =
                  prospect.interactions && prospect.interactions.length > 0
                    ? prospect.interactions[prospect.interactions.length - 1]
                    : null;

                return (
                  <div
                    key={prospect.id}
                    onClick={() => onSelectProspectForMap(prospect)}
                    className="p-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${getStatusBadgeStyle(
                              prospect.status
                            )}`}
                          >
                            {prospect.status}
                          </span>

                          <span className="text-[10.5px] font-mono text-[#858593] bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">
                            {prospect.category}
                          </span>

                          {prospect.city && (
                            <span className="text-[10.5px] font-mono text-[#858593] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#9B4DFF]" />
                              <span>{prospect.city}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-[#F0E9FF] truncate">
                          {prospect.name}
                        </h3>

                        <div className="flex items-center gap-3 text-xs font-mono text-[#858593] mt-1 flex-wrap">
                          {prospect.contactName && <span>Contato: {prospect.contactName}</span>}
                          {prospect.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{prospect.phone}</span>
                            </span>
                          )}
                        </div>

                        {(lastInteraction || prospect.nextAction) && (
                          <div className="mt-2 text-[11px] font-mono flex items-center gap-3 text-[#858593] border-t border-white/[0.03] pt-1.5">
                            {lastInteraction && (
                              <span className="truncate">
                                Ação: {lastInteraction.type} ({lastInteraction.date})
                              </span>
                            )}
                            {prospect.nextAction && (
                              <span className="truncate text-[#C69BFF]">
                                Próx: {prospect.nextAction}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0 self-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onOpenDetailsModal(prospect)}
                          className="p-1.5 text-[#858593] hover:text-[#F0E9FF] hover:bg-white/5 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => onOpenEditModal(prospect)}
                          className="p-1.5 text-[#858593] hover:text-[#C69BFF] hover:bg-white/5 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProspectToDelete(prospect)}
                          className="p-1.5 text-[#858593] hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* In-App Delete Confirmation Modal (Rendered via Portal to body to prevent any overflow/stacking issues) */}
      {prospectToDelete && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setProspectToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0E1017] border border-rose-500/40 rounded-xl p-5 shadow-2xl font-mono text-xs animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400 mb-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-bold text-sm uppercase">Excluir Prospect?</span>
            </div>
            <p className="text-[#C5BEDA] text-xs leading-relaxed mb-4">
              Tem certeza de que deseja remover <strong className="text-white">{prospectToDelete.name}</strong> da lista de prospecção?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProspectToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-[#858593] hover:text-white bg-white/5 rounded cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProspect(prospectToDelete.id);
                  setProspectToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer shadow-lg shadow-rose-600/30 transition-all"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
