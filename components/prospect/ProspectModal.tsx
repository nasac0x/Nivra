'use client';

import React, { useState, useRef } from 'react';
import { X, Check, Building2, Tag, Phone, Globe, User, MapPin, AlignLeft, Mail, GripHorizontal } from 'lucide-react';
import { Prospect, ProspectStatus, PROSPECT_CATEGORIES, PROSPECT_STATUSES } from '@/types/prospect';
import { normalizePhoneOnSave } from '@/lib/phone';
import Draggable from 'react-draggable';

interface ProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospectData: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => void;
  editingProspect?: Prospect | null;
}

interface ProspectFormProps {
  initialProspect?: Prospect | null;
  onClose: () => void;
  onSave: (prospectData: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => void;
}

const ProspectForm: React.FC<ProspectFormProps> = ({ initialProspect, onClose, onSave }) => {
  const [name, setName] = useState(initialProspect?.name || '');
  const [category, setCategory] = useState<string>(initialProspect?.category || 'Restaurante');
  const [status, setStatus] = useState<ProspectStatus>(initialProspect?.status || 'NA LISTA');
  const [contactName, setContactName] = useState(initialProspect?.contactName || '');
  const [phone, setPhone] = useState(initialProspect?.phone || '');
  const [email, setEmail] = useState(initialProspect?.email || '');
  const [website, setWebsite] = useState(initialProspect?.website || '');
  const [city, setCity] = useState(initialProspect?.city || '');
  const [neighborhood, setNeighborhood] = useState(initialProspect?.neighborhood || '');
  const [address, setAddress] = useState(initialProspect?.address || '');
  const [notes, setNotes] = useState(initialProspect?.notes || '');
  const [nextAction, setNextAction] = useState(initialProspect?.nextAction || '');
  const [showAdvancedFields, setShowAdvancedFields] = useState(
    Boolean(initialProspect?.email || initialProspect?.address || initialProspect?.nextAction)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category: category.trim() || 'Outros',
      status,
      contactName: contactName.trim() || undefined,
      phone: normalizePhoneOnSave(phone) || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      city: city.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      nextAction: nextAction.trim() || undefined,
    });
    onClose();
  };

  return (
    <>
      {/* Header - Funciona como área de arrasto */}
      <div className="drag-handle flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#07080C] cursor-move select-none rounded-t-xl group">
        <div className="flex items-center gap-3">
          <GripHorizontal className="w-5 h-5 text-[#858593] group-hover:text-white transition-colors" />
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#F0E9FF]">
              {initialProspect ? 'Editar Prospect' : 'Novo Prospect'}
            </h2>
            <p className="text-[11px] font-mono text-[#858593] mt-0.5">
              Arraste por esta barra
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#858593] hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 font-mono text-xs cursor-default">
        {/* Nome do negócio (Obrigatório) */}
        <div>
          <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#9B4DFF]" />
            <span>Nome do Negócio *</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Bistrô Icaraí, Café Grão Real, Clínica Odonto..."
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF] focus:ring-1 focus:ring-[#9B4DFF] transition-all"
          />
        </div>

        {/* Categoria + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#9B4DFF]" />
              <span>Categoria *</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#07080C] border border-white/10 rounded-md text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF] transition-all cursor-pointer"
            >
              {PROSPECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
              <span>Status Inicial</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProspectStatus)}
              className="w-full px-3 py-2 bg-[#07080C] border border-white/10 rounded-md text-[#F0E9FF] focus:outline-none focus:border-[#9B4DFF] transition-all cursor-pointer"
            >
              {PROSPECT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contato + Telefone / WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#858593]" />
              <span>Contato (Pessoa / Cargo)</span>
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: Carlos (Gerente), Dra. Vanessa"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#858593]" />
              <span>Telefone / WhatsApp</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={(e) => {
                // Sugere o formato internacional ao sair do campo
                const normalized = normalizePhoneOnSave(e.target.value);
                if (normalized && normalized !== e.target.value) setPhone(normalized);
              }}
              placeholder="+55 21 98844-1234 ou +351 912 345 678"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF]"
            />
            {phone && !phone.trim().startsWith('+') && (
              <p className="text-[10px] text-amber-400/90 mt-1 leading-snug">
                Dica: salve com o código do país (+55, +351...) para o WhatsApp
                funcionar em prospecção internacional.
              </p>
            )}
          </div>
        </div>

        {/* Site + Cidade / Bairro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#858593]" />
              <span>Site ou Rede Social</span>
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Ex: restauranteicarai.com.br"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#858593]" />
              <span>Cidade / Bairro</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Niterói - Icaraí"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF]"
            />
          </div>
        </div>

        {/* Observação rápida */}
        <div>
          <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-[#858593]" />
            <span>Observações / Perfil</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informações relevantes anotadas visualmente no mapa..."
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF] resize-none"
          />
        </div>

        {/* Advanced Fields Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedFields(!showAdvancedFields)}
            className="text-[11px] text-[#9B4DFF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showAdvancedFields ? '- Ocultar campos adicionais' : '+ Adicionar E-mail, Endereço e Próxima Ação'}</span>
          </button>
        </div>

        {showAdvancedFields && (
          <div className="space-y-3 pt-2 border-t border-white/[0.06] animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#858593]" />
                <span>E-mail</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#858593]" />
                <span>Endereço Completo</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rua Moreira César, 240 - Icaraí, Niterói"
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1 flex items-center gap-1.5">
                <span>Próxima Ação Planejada</span>
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Ex: Ligar na quarta-feira para falar com o proprietário"
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF]"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-[#858593] hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-[#9B4DFF] hover:bg-[#8534f5] disabled:opacity-50 text-white text-xs font-mono font-semibold rounded-md shadow-lg shadow-[#9B4DFF]/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Prospect</span>
          </button>
        </div>
      </form>
    </>
  );
};

export const ProspectModal: React.FC<ProspectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProspect,
}) => {
  // Criamos a referência para a biblioteca saber onde a janela está
  const nodeRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
      {/* Passamos o nodeRef para o Draggable */}
      <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds="parent">
        <div
          ref={nodeRef} // E conectamos o nodeRef na div principal
          className="w-full max-w-lg bg-[#0E1017]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <ProspectForm
            key={editingProspect?.id || 'new'}
            initialProspect={editingProspect}
            onClose={onClose}
            onSave={onSave}
          />
        </div>
      </Draggable>
    </div>
  );
};

