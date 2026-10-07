'use client';

import React from 'react';
import { ModuleConfig, DashboardModuleId } from '@/types/finance';
import {
  SlidersHorizontal,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface EditLayoutToolbarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  modules: ModuleConfig[];
  onToggleModuleVisibility: (id: DashboardModuleId) => void;
  onResetLayout: () => void;
}

export const EditLayoutToolbar: React.FC<EditLayoutToolbarProps> = ({
  isEditMode,
  onToggleEditMode,
  modules,
  onToggleModuleVisibility,
  onResetLayout,
}) => {
  if (!isEditMode) return null;

  const hiddenModules = modules.filter((m) => !m.visible);

  return (
    <div className="glass-panel-primary rounded-xl p-4 sm:p-5 font-mono text-xs text-[#F0E9FF] mb-6 border-[#9B4DFF]/40 shadow-[0_10px_40px_rgba(157,78,255,0.15)] w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[#9B4DFF]/20 text-[#C69BFF]">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold tracking-wider uppercase text-[11px] text-[#F0E9FF]">
              MODO ARQUITETURA GLASS DO DASHBOARD
            </div>
            <p className="text-[#858593] text-[11px]">
              Reorganize a ordem dos módulos, altere larguras ou oculte elementos. As preferências são salvas localmente.
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            type="button"
            onClick={onResetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-white/[0.05] text-[#858593] hover:text-[#F0E9FF] border border-white/[0.1] rounded text-xs transition-colors min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESTAURAR PADRÃO</span>
          </button>

          <button
            type="button"
            onClick={onToggleEditMode}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] hover:brightness-110 text-white font-semibold rounded text-xs transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)] min-h-[36px]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>CONCLUIR</span>
          </button>
        </div>
      </div>

      {/* Hidden modules re-enable bar */}
      {hiddenModules.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
          <span className="text-[#858593] text-[10px] uppercase">
            Módulos inativos:
          </span>
          {hiddenModules.map((m) => (
            <button
              key={m.id}
              onClick={() => onToggleModuleVisibility(m.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 border border-white/[0.1] text-[#C69BFF] hover:text-white text-[11px] rounded transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>MOSTRAR {m.title.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ModularCardWrapperProps {
  module: ModuleConfig;
  isEditMode: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleWidth: () => void;
  onToggleVisibility: () => void;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
}

export const ModularCardWrapper: React.FC<ModularCardWrapperProps> = ({
  module,
  isEditMode,
  onMoveUp,
  onMoveDown,
  onToggleWidth,
  onToggleVisibility,
  isFirst,
  isLast,
  children,
}) => {
  const widthClass =
    module.width === 'half'
      ? 'col-span-1 md:col-span-6'
      : module.width === 'third'
      ? 'col-span-1 md:col-span-4'
      : module.width === 'two-thirds'
      ? 'col-span-1 md:col-span-8'
      : 'col-span-1 md:col-span-12';

  return (
    <div
      className={`relative transition-all ${widthClass} ${
        isEditMode ? 'border border-[#9B4DFF]/60 rounded-xl p-2 bg-[#0E0F16]/70 shadow-[0_0_30px_rgba(157,78,255,0.12)]' : ''
      }`}
    >
      {isEditMode && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-black/50 border border-white/[0.08] rounded-lg text-[10px] font-mono text-[#F0E9FF] z-20">
          <div className="flex items-center gap-2 font-semibold text-[#C69BFF]">
            <span>■</span>
            <span>{module.title.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded"
              title="Mover para cima"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded"
              title="Mover para baixo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleWidth}
              className="p-1 hover:text-white rounded"
              title={module.width === 'half' ? 'Largura Total' : 'Meia Largura'}
            >
              {module.width === 'half' ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={onToggleVisibility}
              className="p-1 text-[#858593] hover:text-[#FF5C73] rounded"
              title="Ocultar módulo"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
