'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

/**
 * NIVRA INTRO v4 — coreografia decodificada (GIF por pixels + visão + spec):
 * A) Símbolo: peças nascem perto do centro, expandem sutil e assentam com
 *    micro-pulso elástico (frames 5-9 da referência).
 * B) Wordmark: NIVRA entra LETRA POR LETRA subindo da baseline com máscara,
 *    stagger 55ms, back.out(1.7) — como o texto cresce da esquerda no GIF
 *    (frames 10-13) e como o spec pede ("masked rise from the baseline").
 * C) Settle (tagline/progresso) + hold + exit com blur.
 */

interface NivraIntroAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const DISMISS_AFTER_MS = 3600;
const INTRO_KEY = 'nivra_intro_shown_v3';

// Letras do wordmark (paths da fonte geométrica Nivra) — uma por entrada
const LETTERS: { d: string; w: number }[] = [
  { d: 'M 10 50 L 10 10 L 22 10 L 46 38 L 46 10 L 58 10 L 58 50 L 46 50 L 22 22 L 22 50 Z', w: 56 },
  { d: 'M 82 10 L 94 10 L 94 50 L 82 50 Z', w: 16 },
  { d: 'M 118 10 L 132 10 L 146 42 L 160 10 L 174 10 L 153 50 L 139 50 Z', w: 62 },
  { d: 'M 196 10 L 226 10 C 238 10 246 16 246 25 C 246 33 239 38 228 39 L 246 50 L 232 50 L 216 40 L 208 40 L 208 50 L 196 50 Z M 208 20 L 208 31 L 224 31 C 230 31 234 29 234 25.5 C 234 22 230 20 224 20 Z', w: 54 },
  { d: 'M 288 10 L 302 10 L 324 50 L 310 50 L 295 22 L 280 50 L 266 50 Z', w: 62 },
];

export const NivraIntroAnimation: React.FC<NivraIntroAnimationProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const scheduledRef = useRef(false);
  const timersRef = useRef<Record<'start' | 'dismiss', ReturnType<typeof setTimeout> | undefined>>({ start: undefined, dismiss: undefined });

  /** agenda um timer por SLOT: substitui apenas o predecessor do mesmo slot */
  const safeTimeout = useCallback((slot: 'start' | 'dismiss', fn: () => void, ms: number) => {
    if (timersRef.current[slot]) clearTimeout(timersRef.current[slot]);
    const t = setTimeout(fn, ms);
    timersRef.current[slot] = t;
    return t;
  }, []);

  const overlayRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLDivElement>(null);
  const shape1Ref = useRef<SVGGElement>(null);
  const shape2Ref = useRef<SVGGElement>(null);
  const shape3Ref = useRef<SVGGElement>(null);
  const lettersWrapRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(SVGGElement | null)[]>([]);
  const taglineRef = useRef<HTMLDivElement>(null);
  const taglineDotRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const skipHintRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    try { sessionStorage.setItem(INTRO_KEY, 'true'); } catch {}
    const el = overlayRef.current;
    if (!el) {
      setIsVisible(false);
      if (onComplete) onComplete();
      return;
    }
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      setIsVisible(false);
      if (onComplete) onComplete();
    };
    gsap.to(el, {
      opacity: 0, scale: 1.04, filter: 'blur(12px)',
      duration: 0.5, ease: 'power2.in',
      onComplete: close, overwrite: true,
    });
    setTimeout(close, 900);
  }, [onComplete]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let alreadyShown = false;
    try { alreadyShown = Boolean(sessionStorage.getItem(INTRO_KEY)); } catch {}

    if (alreadyShown && !forceShow) {
      if (onComplete) onComplete();
      return;
    }
    // replay tem effect próprio — não duplicar agenda aqui
    if (forceShow) return;

    if (scheduledRef.current) return;
    scheduledRef.current = true;

    safeTimeout('start', () => {
      setHasStarted(true);
      setIsVisible(true);
    }, 10);
    safeTimeout('dismiss', finish, DISMISS_AFTER_MS);
    const onKey = () => finish();
    window.addEventListener('keydown', onKey);
  }, [forceShow, finish, onComplete, safeTimeout]);

  // ===== REPLAY =====
  useEffect(() => {
    if (!forceShow) return;
    safeTimeout('start', () => {
      setHasStarted(true);
      setIsVisible(true);
    }, 30);
    safeTimeout('dismiss', finish, DISMISS_AFTER_MS + 30);
  }, [forceShow, finish, safeTimeout]);

  // ===== TIMELINE MESTRE =====
  useEffect(() => {
    if (!isVisible || !overlayRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const letters = letterRefs.current.filter(Boolean) as SVGGElement[];

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    gsap.set(letters, { clearProps: 'all' });
    gsap.set(overlayRef.current, { clearProps: 'opacity,scale,filter' });

    // ---------- A) SÍMBOLO ----------
    tl.set([shape1Ref.current, shape2Ref.current, shape3Ref.current], {
      opacity: 0, scale: 0.35,
      x: (i: number) => (i === 0 ? -16 : i === 1 ? 12 : 18),
      y: (i: number) => (i === 0 ? 0 : i === 1 ? -9 : 11),
    });
    tl.set(symbolRef.current, { opacity: 0, scale: 0.92 });
    tl.set([taglineRef.current, progressRef.current, skipHintRef.current, glowRef.current], { opacity: 0 });
    tl.set(progressRef.current, { width: 0 });
    tl.set(taglineDotRef.current, { scale: 0 });
    tl.set(letters, { yPercent: 115, opacity: 0 });

    tl.to(symbolRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });

    tl.to([shape1Ref.current, shape2Ref.current, shape3Ref.current], {
      opacity: 1, scale: 1, x: 0, y: 0,
      duration: 0.85, ease: 'power2.out', stagger: 0.09,
    }, '-=0.05');

    tl.to(symbolRef.current, { scale: 1.04, duration: 0.16, ease: 'power2.in' }, '+=0.06');
    tl.to(symbolRef.current, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    tl.to(glowRef.current, { opacity: 1, duration: 0.8, ease: 'power1.out' }, '<');

    // ---------- B) WORDMARK: letra por letra da baseline ----------
    tl.to(letters, {
      yPercent: 0, opacity: 1,
      duration: 0.6, ease: 'back.out(1.7)', stagger: 0.055,
    }, '-=0.55');

    // ---------- C) SETTLE ----------
    tl.to(taglineRef.current, { opacity: 1, y: 0, duration: 0.45 }, '-=0.2');
    tl.to(taglineDotRef.current, { scale: 1, duration: 0.3, ease: 'back.out(2)' }, '<');
    tl.to(progressRef.current, { width: 150, opacity: 0.5, duration: 0.9, ease: 'power2.out' }, '<');
    tl.to(skipHintRef.current, { opacity: 0.65, duration: 0.4 }, '+=0.1');

    return () => { tl.kill(); };
  }, [isVisible]);

  if (!hasStarted) return null;

  return (
    <>
      {isVisible && (
        <div
          ref={overlayRef}
          onClick={finish}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#07080C] select-none cursor-pointer overflow-hidden"
          style={{ willChange: 'opacity, transform, filter' }}
        >
          <div
            ref={glowRef}
            className="absolute w-[600px] sm:w-[800px] h-[400px] sm:h-[500px] rounded-full bg-gradient-to-r from-[#9B4DFF]/25 via-[#7C3AED]/30 to-[#B377FF]/20 blur-[130px] pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center px-4">
            {/* LOCKUP horizontal: símbolo + wordmark */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* SÍMBOLO — 3 formas */}
              <div ref={symbolRef} className="relative w-24 sm:w-36" style={{ aspectRatio: '160/120' }}>
                <svg viewBox="0 0 160 120" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="intro-grad" x1="10" y1="90" x2="150" y2="10" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#8534F5" />
                      <stop offset="60%" stopColor="#9B4DFF" />
                      <stop offset="100%" stopColor="#B377FF" />
                    </linearGradient>
                  </defs>
                  <g ref={shape1Ref} style={{ willChange: 'transform, opacity' }}>
                    <path d="M 12 92 L 48 24 L 72 24 L 98 72 L 98 52 L 126 12 L 148 4 L 122 52 L 102 92 L 78 92 L 52 48 L 34 84 Z" fill="url(#intro-grad)" />
                  </g>
                  <g ref={shape2Ref} style={{ willChange: 'transform, opacity' }}>
                    <path d="M 72 44 L 84 24 L 94 24 L 82 44 Z" fill="url(#intro-grad)" />
                  </g>
                  <g ref={shape3Ref} style={{ willChange: 'transform, opacity' }}>
                    <path d="M 88 56 L 104 28 L 114 28 L 98 56 Z" fill="url(#intro-grad)" />
                  </g>
                </svg>
              </div>

              {/* WORDMARK — máscara de baseline + letras individuais */}
              <div
                ref={lettersWrapRef}
                className="overflow-hidden"
                style={{ paddingBottom: '2px' }}
              >
                <svg viewBox="0 0 340 60" className="h-9 sm:h-11 overflow-visible">
                  {LETTERS.map((L, i) => (
                    <g
                      key={i}
                      ref={(el: SVGGElement | null) => { letterRefs.current[i] = el; }}
                      style={{ willChange: 'transform, opacity' }}
                    >
                      <path d={L.d} fill="#F0E9FF" />
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Tagline */}
            <div ref={taglineRef} className="mt-6 flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-[0.3em] text-[#C69BFF]/80 uppercase">
              <span ref={taglineDotRef} className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>RECEITAS & PROSPECÇÃO</span>
            </div>

            <div ref={progressRef} className="mt-5 h-[1.5px] bg-gradient-to-r from-transparent via-[#9B4DFF] to-transparent rounded-full shadow-[0_0_12px_#9B4DFF]" />
          </div>

          <div ref={skipHintRef} className="absolute bottom-8 text-[11px] font-mono text-[#858593] hover:text-white transition-colors">
            Clique ou pressione qualquer tecla para continuar
          </div>
        </div>
      )}
    </>
  );
};
