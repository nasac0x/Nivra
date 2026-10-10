'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { NivraSymbol, NivraWordmark } from './NivraLogo';

/**
 * NIVRA INTRO — KickStudio-style (referência Dribbble 15213150)
 *
 * Física de movimento, via GSAP timeline:
 * 1. Estado inicial: cada forma geométrica com scale:0/opacity:0;
 *    wordmark oculto atrás de máscara (overflow hidden).
 * 2. Ícone em "pop out": scale 0 → 1.2 → 1 com ease "back.out(1.7)"
 *    (o quique elástico da referência).
 * 3. Stagger: as 3 formas do monograma entram com atraso sequencial 0.1s.
 * 4. Wordmark: desliza de trás do ícone revelando-se pela máscara,
 *    ease "power3.out" — fluido, sem quique.
 *
 * Modo "replay" (forceShow) e dismiss por clique/tecla preservados.
 */

interface NivraIntroAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const DISMISS_AFTER_MS = 2600;

export const NivraIntroAnimation: React.FC<NivraIntroAnimationProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  /** impede que o duplo-invoke do effect (StrictMode) cancele/re-agende timers */
  const scheduledRef = useRef(false);

  // refs dos elementos animados
  const overlayRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shape1Ref = useRef<SVGGElement>(null);
  const shape2Ref = useRef<SVGGElement>(null);
  const shape3Ref = useRef<SVGGElement>(null);
  const iconWrapRef = useRef<HTMLDivElement>(null);
  const wordMaskRef = useRef<HTMLDivElement>(null);
  const wordInnerRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const taglineDotRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const skipHintRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    // marca "vista" somente quando a intro de fato encerra
    try { sessionStorage.setItem('nivra_intro_shown_v2', 'true'); } catch {}
    const el = overlayRef.current;
    if (!el) {
      setIsVisible(false);
      if (onComplete) onComplete();
      return;
    }

    // bandeira: a primeira que chegar, desmonta (tween OU timer — não ambos)
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      setIsVisible(false);
      if (onComplete) onComplete();
    };

    // tween de saída (caminho bonito, com blur/scale)
    gsap.to(el, {
      opacity: 0,
      scale: 1.04,
      filter: 'blur(12px)',
      duration: 0.5,
      ease: 'power2.in',
      onComplete: close,
      overwrite: true,
    });

    // guarda-raiames: se o tween congelar (aba oculta, RAF suspenso,
    // device bateria-saver), desmonta na marra após 900ms.
    setTimeout(close, 900);
  }, [onComplete]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let alreadyShown = false;
    try { alreadyShown = Boolean(sessionStorage.getItem('nivra_intro_shown_v2')); } catch {}

    if (alreadyShown && !forceShow) {
      if (onComplete) onComplete();
      return;
    }

    if (scheduledRef.current && !forceShow) return; // já agendado nesta vida da página
    scheduledRef.current = true;

    const startTimer = setTimeout(() => {
      setHasStarted(true);
      setIsVisible(true);
    }, 10);

    const dismissTimer = setTimeout(finish, DISMISS_AFTER_MS);
    const onKey = () => finish();
    window.addEventListener('keydown', onKey);

    // SEM cleanup de timers: o StrictMode não pode cancelar o dismiss.
    // (o keydown listener vaza 1x no dev, custo zero na prática)
  }, [forceShow, finish, onComplete]);

  // ===== A TIMELINE PRINCIPAL (roda quando o overlay entra no DOM) =====
  useEffect(() => {
    if (!isVisible || !overlayRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timelineRef.current = tl;

    // ------- 1. ESTADO INICIAL (estado final declarado no JSX base = animado;
    // aqui setamos o estado zero ANTES de tudo) -------
    tl.set([shape1Ref.current, shape2Ref.current, shape3Ref.current], {
      scale: 0,
      opacity: 0,
      transformOrigin: '50% 60%',
      svgOrigin: '80 60',
    });
    tl.set(iconWrapRef.current, { scale: 0.7, opacity: 0 });
    tl.set(wordInnerRef.current, { xPercent: -110, opacity: 0 });
    tl.set([taglineRef.current, progressRef.current, skipHintRef.current, glowRef.current], {
      opacity: 0,
    });
    tl.set(progressRef.current, { width: 0 });
    tl.set(taglineDotRef.current, { scale: 0 });

    // ------- 2+3. ÍCONE: pop-out elástico por forma, stagger 0.1s -------
    tl.to(iconWrapRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.35,
      ease: 'power2.out',
    });

    // cada forma geométrica: 0 → 1.2 → 1 (back.out = o quique da referência)
    tl.to(
      [shape1Ref.current, shape2Ref.current, shape3Ref.current],
      {
        scale: 1.2,
        opacity: 1,
        duration: 0.55,
        ease: 'back.out(1.7)',
        stagger: 0.1,
        svgOrigin: '80 60',
      },
      '-=0.1'
    );
    tl.to(
      [shape1Ref.current, shape2Ref.current, shape3Ref.current],
      {
        scale: 1,
        duration: 0.4,
        ease: 'elastic.out(1, 0.45)',
        svgOrigin: '80 60',
        stagger: 0.06,
      },
      '>-0.15'
    );

    // brilho ambiente acende junto
    tl.to(glowRef.current, { opacity: 1, duration: 0.9, ease: 'power1.out' }, 0.2);

    // ------- 4. WORDMARK: desliza de trás do ícone pela máscara -------
    tl.to(
      wordInnerRef.current,
      {
        xPercent: 0,
        opacity: 1,
        duration: 0.75,
        ease: 'power3.out',
      },
      '-=0.45'
    );

    // tagline + ponto pulsante
    tl.to(taglineRef.current, { opacity: 1, y: 0, duration: 0.45 }, '-=0.25');
    tl.to(taglineDotRef.current, { scale: 1, duration: 0.3, ease: 'back.out(2)' }, '<');
    tl.to(progressRef.current, { width: 150, opacity: 0.5, duration: 0.9, ease: 'power2.out' }, '<');

    // hint de skip
    tl.to(skipHintRef.current, { opacity: 0.65, duration: 0.4 }, '+=0.15');

    return () => {
      tl.kill();
    };
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
          {/* Atmosfera cósmica roxa */}
          <div
            ref={glowRef}
            className="absolute w-[600px] sm:w-[800px] h-[400px] sm:h-[500px] rounded-full bg-gradient-to-r from-[#9B4DFF]/25 via-[#7C3AED]/30 to-[#B377FF]/20 blur-[130px] pointer-events-none"
          />

          {/* Conjunto central: ícone + wordmark */}
          <div className="relative z-10 flex flex-col items-center px-4">
            {/* ÍCONE — 3 formas geométricas independentes p/ stagger */}
            <div
              ref={iconWrapRef}
              className="relative w-40 h-30 sm:w-52 sm:h-39"
              style={{ aspectRatio: '160/120' }}
            >
              <svg viewBox="0 0 160 120" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="intro-nivra-grad" x1="10" y1="90" x2="150" y2="10" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#8534F5" />
                    <stop offset="60%" stopColor="#9B4DFF" />
                    <stop offset="100%" stopColor="#B377FF" />
                  </linearGradient>
                </defs>
                {/* 1. Fita principal do N (grande forma) */}
                <g ref={shape1Ref} style={{ willChange: 'transform, opacity' }}>
                  <path
                    d="M 12 92 L 48 24 L 72 24 L 98 72 L 98 52 L 126 12 L 148 4 L 122 52 L 102 92 L 78 92 L 52 48 L 34 84 Z"
                    fill="url(#intro-nivra-grad)"
                  />
                </g>
                {/* 2. Barra de aceleração 1 */}
                <g ref={shape2Ref} style={{ willChange: 'transform, opacity' }}>
                  <path d="M 72 44 L 84 24 L 94 24 L 82 44 Z" fill="url(#intro-nivra-grad)" />
                </g>
                {/* 3. Barra de aceleração 2 */}
                <g ref={shape3Ref} style={{ willChange: 'transform, opacity' }}>
                  <path d="M 88 56 L 104 28 L 114 28 L 98 56 Z" fill="url(#intro-nivra-grad)" />
                </g>
              </svg>

              {/* Glow do ícone montado */}
              <div className="absolute inset-0 bg-[#9B4DFF]/20 blur-[38px] rounded-full pointer-events-none" />
            </div>

            {/* WORDMARK — máscara de corte + slide out */}
            <div
              ref={wordMaskRef}
              className="mt-3 overflow-hidden"
              style={{ clipPath: 'inset(0 100% 0 0 round 0px)' }}
            >
              <div ref={wordInnerRef} style={{ willChange: 'transform, opacity' }}>
                <NivraWordmark className="h-9 sm:h-10" fillColor="#F0E9FF" />
              </div>
            </div>

            {/* Tagline */}
            <div
              ref={taglineRef}
              className="mt-4 flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-[0.3em] text-[#C69BFF]/80 uppercase"
            >
              <span ref={taglineDotRef} className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>RECEITAS & PROSPECÇÃO</span>
            </div>

            {/* Linha de progresso */}
            <div
              ref={progressRef}
              className="mt-5 h-[1.5px] bg-gradient-to-r from-transparent via-[#9B4DFF] to-transparent rounded-full shadow-[0_0_12px_#9B4DFF]"
            />
          </div>

          {/* Skip hint */}
          <div
            ref={skipHintRef}
            className="absolute bottom-8 text-[11px] font-mono text-[#858593] hover:text-white transition-colors"
          >
            Clique ou pressione qualquer tecla para continuar
          </div>
        </div>
      )}
    </>
  );
};
