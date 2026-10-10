'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { Prospect, ProspectStatus, ProspectInteraction, PROSPECT_STATUSES } from '@/types/prospect';
import { analyzePhone } from '@/lib/phone';

interface ProspectDetailsModalProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: ProspectStatus) => void;
  onAddInteraction: (prospectId: string, interaction: Omit<ProspectInteraction, 'id'>) => void;
  onCenterOnMap?: (lat?: number, lng?: number, address?: string) => void;
}

export const ProspectDetailsModal: React.FC<ProspectDetailsModalProps> = ({
  prospect,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onAddInteraction,
  onCenterOnMap,
}) => {
  const [newInteractionType, setNewInteractionType] = useState<ProspectInteraction['type']>('whatsapp');
  const [newInteractionNotes, setNewInteractionNotes] = useState('');
  const [newInteractionDate, setNewInteractionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !prospect) return null;

  const handleSaveInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteractionNotes.trim()) return;

    onAddInteraction(prospect.id, {
      date: newInteractionDate,
      type: newInteractionType,
      notes: newInteractionNotes.trim(),
    });

    setNewInteractionNotes('');
    setIsAddingInteraction(false);
  };

  // WhatsApp formatted link — normalizado com suporte internacional
  const phoneInfo = analyzePhone(prospect.phone || '');
  const whatsappUrl = phoneInfo.whatsappUrl;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#0E1017] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.08] bg-[#07080C]/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9B4DFF] bg-[#9B4DFF]/10 px-2 py-0.5 rounded border border-[#9B4DFF]/20">
                {prospect.category}
              </span>
              <span className="text-[10px] font-mono text-[#858593]">
                ID: {prospect.id}
              </span>
            </div>
            <h2 className="text-lg font-mono font-bold text-[#F0E9FF]">
              {prospect.name}
            </h2>
            {prospect.city && (
              <p className="text-xs font-mono text-[#858593] flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#9B4DFF]" />
                <span>{prospect.city} {prospect.neighborhood ? `· ${prospect.neighborhood}` : ''}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(prospect)}
              className="p-1.5 text-[#858593] hover:text-[#C69BFF] hover:bg-white/5 rounded transition-colors cursor-pointer"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-[#858593] hover:text-red-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#858593] hover:text-white hover:bg-white/5 rounded transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && (
          <div className="bg-rose-950/80 border-b border-rose-500/30 px-6 py-3 flex items-center justify-between gap-3 text-xs font-mono animate-in fade-in duration-150">
            <span className="text-rose-200">
              Tem certeza de que deseja excluir <strong>{prospect.name}</strong>?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-white/70 hover:text-white bg-white/5 rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(prospect.id);
                  onClose();
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer shadow"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs flex-1">
          {/* Status Pipeline Selector */}
          <div>
            <span className="text-[11px] text-[#858593] block mb-2 uppercase font-semibold">
              Status da Prospecção
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PROSPECT_STATUSES.map((st) => {
                const isActive = prospect.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(prospect.id, st)}
                    className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer font-medium ${
                      isActive
                        ? st === 'CONVERTIDO EM CLIENTE'
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                          : st === 'NÃO INTERESSADO'
                          ? 'bg-rose-900/30 text-rose-300 border border-rose-500/40'
                          : 'bg-[#9B4DFF]/30 text-[#F0E9FF] border border-[#9B4DFF]/60 shadow-[0_0_8px_rgba(155,77,255,0.25)]'
                        : 'bg-white/[0.03] text-[#858593] hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 rounded-lg transition-all text-center"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold">WhatsApp</span>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 p-2.5 bg-white/[0.02] border border-white/[0.05] text-[#858593] rounded-lg opacity-40">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="text-[11px]">Sem WhatsApp</span>
              </div>
            )}

            {prospect.phone ? (
              <a
                href={`tel:${prospect.phone}`}
                className="flex items-center justify-center gap-2 p-2.5 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 rounded-lg transition-all text-center"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold">Ligar</span>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 p-2.5 bg-white/[0.02] border border-white/[0.05] text-[#858593] rounded-lg opacity-40">
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-[11px]">Sem Telefone</span>
              </div>
            )}

            {prospect.email ? (
              <a
                href={`mailto:${prospect.email}`}
                className="flex items-center justify-center gap-2 p-2.5 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 rounded-lg transition-all text-center"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold">E-mail</span>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 p-2.5 bg-white/[0.02] border border-white/[0.05] text-[#858593] rounded-lg opacity-40">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-[11px]">Sem E-mail</span>
              </div>
            )}

            <button
              onClick={() => {
                if (onCenterOnMap) {
                  onCenterOnMap(prospect.lat, prospect.lng, prospect.address || prospect.city);
                  onClose();
                }
              }}
              className="flex items-center justify-center gap-2 p-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white rounded-lg transition-all text-center cursor-pointer"
            >
              <Navigation className="w-4 h-4 shrink-0 text-[#9B4DFF]" />
              <span className="text-[11px] font-semibold">Ver no Mapa</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl">
            <div>
              <span className="text-[10px] text-[#858593] block">Contato Principal</span>
              <span className="text-white font-medium text-xs">
                {prospect.contactName || '—'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#858593] block">Telefone</span>
              <span className="text-white font-medium text-xs flex items-center gap-1.5">
                {prospect.phone || '—'}
                {!phoneInfo.hadCountryCode && whatsappUrl && (
                  <span
                    className="text-amber-400"
                    title={`Número sem código do país — assumido +${phoneInfo.country} no link do WhatsApp. Edite e salve com o DDI (ex: +55 / +351) para ficar confiável.`}
                  >
                    <AlertCircle className="w-3 h-3" />
                  </span>
                )}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#858593] block">Website</span>
              {prospect.website ? (
                <a
                  href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#9B4DFF] hover:underline text-xs flex items-center gap-1 line-clamp-1"
                >
                  <span>{prospect.website.replace(/^https?:\/\//, '')}</span>
                  <Globe className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-[#858593]">—</span>
              )}
            </div>

            <div>
              <span className="text-[10px] text-[#858593] block">E-mail</span>
              <span className="text-white font-medium text-xs line-clamp-1">
                {prospect.email || '—'}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] text-[#858593] block">Endereço</span>
              <span className="text-white font-medium text-xs">
                {prospect.address || `${prospect.neighborhood ? `${prospect.neighborhood}, ` : ''}${prospect.city || '—'}`}
              </span>
            </div>

            {prospect.notes && (
              <div className="sm:col-span-2 pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] text-[#858593] block mb-0.5">Observações</span>
                <p className="text-[#D0C9DF] text-xs leading-relaxed">
                  {prospect.notes}
                </p>
              </div>
            )}
          </div>

          {/* Próxima Ação */}
          {prospect.nextAction && (
            <div className="p-3.5 bg-[#9B4DFF]/10 border border-[#9B4DFF]/30 rounded-xl flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#9B4DFF] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C69BFF]">
                  Próxima Ação Planejada
                </span>
                <p className="text-xs text-[#F0E9FF] font-medium mt-0.5">
                  {prospect.nextAction}
                </p>
                {prospect.nextActionDate && (
                  <span className="text-[10px] text-[#858593] block mt-1">
                    Prazo: {prospect.nextActionDate}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Histórico de Interações */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-[#F0E9FF] flex items-center gap-2">
                <span>Histórico de Interações</span>
                <span className="text-[10px] font-mono px-2 py-0.2 bg-white/[0.05] rounded-full text-[#858593]">
                  {prospect.interactions?.length || 0}
                </span>
              </h3>

              {!isAddingInteraction && (
                <button
                  onClick={() => setIsAddingInteraction(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#9B4DFF]/20 hover:bg-[#9B4DFF]/30 border border-[#9B4DFF]/40 text-[#C69BFF] hover:text-white rounded-md transition-all text-[11px] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Registrar Contato</span>
                </button>
              )}
            </div>

            {/* Nova Interação Form */}
            {isAddingInteraction && (
              <form onSubmit={handleSaveInteraction} className="p-4 bg-[#07080C] border border-[#9B4DFF]/30 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#C69BFF]">Novo Registro de Interação</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingInteraction(false)}
                    className="text-[#858593] hover:text-white text-xs"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#858593] mb-1">Tipo de Interação</label>
                    <select
                      value={newInteractionType}
                      onChange={(e) => setNewInteractionType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-[#0E1017] border border-white/10 rounded text-xs text-white"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="call">Ligação Telefônica</option>
                      <option value="email">E-mail</option>
                      <option value="meeting">Reunião / Visita</option>
                      <option value="proposal">Envio de Proposta</option>
                      <option value="note">Anotação Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#858593] mb-1">Data</label>
                    <input
                      type="date"
                      value={newInteractionDate}
                      onChange={(e) => setNewInteractionDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0E1017] border border-white/10 rounded text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#858593] mb-1">Resumo da Conversa / Resultado *</label>
                  <textarea
                    rows={2}
                    required
                    value={newInteractionNotes}
                    onChange={(e) => setNewInteractionNotes(e.target.value)}
                    placeholder="Ex: Conversou com o gerente. Mostrou interesse na proposta..."
                    className="w-full px-2.5 py-1.5 bg-[#0E1017] border border-white/10 rounded text-xs text-white placeholder:text-[#858593]/50 focus:outline-none focus:border-[#9B4DFF] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#9B4DFF] hover:bg-[#8534f5] text-white rounded font-semibold text-xs cursor-pointer"
                  >
                    Salvar Interação
                  </button>
                </div>
              </form>
            )}

            {/* Linha do tempo das interações */}
            {(!prospect.interactions || prospect.interactions.length === 0) ? (
              <div className="p-4 text-center border border-white/[0.04] rounded-lg text-[#858593]">
                Nenhuma interação registrada ainda. Clique em &quot;+ Registrar Contato&quot; após realizar a primeira abordagem.
              </div>
            ) : (
              <div className="space-y-2.5">
                {[...prospect.interactions].reverse().map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#9B4DFF]/15 border border-[#9B4DFF]/30 flex items-center justify-center shrink-0 mt-0.5 text-[#C69BFF]">
                      {item.type === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5" />}
                      {item.type === 'call' && <Phone className="w-3.5 h-3.5" />}
                      {item.type === 'email' && <Mail className="w-3.5 h-3.5" />}
                      {item.type === 'meeting' && <Calendar className="w-3.5 h-3.5" />}
                      {item.type === 'proposal' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {item.type === 'note' && <Clock className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[11px] font-bold text-[#F0E9FF] uppercase tracking-wide">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-[#858593]">
                          {item.date}
                        </span>
                      </div>
                      <p className="text-xs text-[#C5BEDA] leading-relaxed">
                        {item.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
