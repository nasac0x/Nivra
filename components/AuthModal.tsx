'use client';

import React, { useState } from 'react';
import { X, Cloud, Mail, Lock, UserPlus, LogIn, Loader2, CloudOff } from 'lucide-react';
import { isCloudConfigured, cloudSignIn, cloudSignUp } from '@/services/cloud';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

type Mode = 'signin' | 'signup';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const translateError = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
    if (m.includes('already registered')) return 'Este e-mail já tem conta. Faça login.';
    if (m.includes('password should be at least')) return 'A senha precisa de no mínimo 6 caracteres.';
    if (m.includes('unable to validate email')) return 'E-mail inválido.';
    if (m.includes('fetch') || m.includes('network')) return 'Sem conexão com a nuvem — verifique sua internet.';
    return 'Erro: ' + msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await cloudSignIn(email.trim(), password);
      } else {
        await cloudSignUp(email.trim(), password);
      }
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      setError(translateError(err?.message || 'erro desconhecido'));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-md text-[#F0E9FF] placeholder:text-[#858593]/60 focus:outline-none focus:border-[#9B4DFF] text-sm';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0E1017] border border-white/15 rounded-xl shadow-2xl overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#07080C]">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-[#9B4DFF]" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#F0E9FF]">
                {mode === 'signin' ? 'Entrar na Nuvem' : 'Criar Conta'}
              </h2>
              <p className="text-[11px] text-[#858593] mt-0.5">
                Sync entre PC e celular · dados fora do navegador
              </p>
            </div>
          </div>
          {!busy && (
            <button
              onClick={onClose}
              className="text-[#858593] hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!isCloudConfigured ? (
          <div className="p-6 text-center space-y-3">
            <CloudOff className="w-10 h-10 text-[#858593] mx-auto" />
            <p className="text-sm text-[#C5BEDA] leading-relaxed">
              A nuvem ainda não foi configurada neste Nivra.
            </p>
            <p className="text-[11px] text-[#858593] leading-relaxed">
              Siga o <span className="text-[#9B4DFF]">README-SUPABASE.md</span> na raiz do
              projeto (15 min) para ativar login e sincronização. Enquanto isso, o app
              continua salvando tudo localmente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#9B4DFF]" />
                <span>E-mail</span>
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A0A0B0] font-semibold mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#9B4DFF]" />
                <span>Senha</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={inputCls}
              />
            </div>

            {error && (
              <p className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#9B4DFF] hover:bg-[#8534f5] disabled:opacity-50 text-white text-sm font-semibold rounded-md shadow-lg shadow-[#9B4DFF]/20 transition-all cursor-pointer"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'signin' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{mode === 'signin' ? 'Entrar' : 'Criar conta e sincronizar'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="w-full text-center text-[11px] text-[#9B4DFF] hover:underline cursor-pointer"
            >
              {mode === 'signin'
                ? 'Não tenho conta — quero criar'
                : 'Já tenho conta — fazer login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
