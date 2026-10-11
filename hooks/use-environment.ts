'use client';

import * as React from 'react';

/**
 * DETECÇÃO DE AMBIENTE — 3 mundos:
 *  A) 'mobile'   → celular (instalado ou navegador): pointer coarse + viewport
 *  B) 'desktop'  → desktop com app instalado (PWA standalone)
 *  C) 'desktop'  → desktop como aba normal do navegador
 *
 * Layout é decidido por mobile/desktop (B e C compartilham o layout desktop).
 * A régua de 60% (--min-app-width) é CSS puro, aplicada no AppShell.
 */

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)');
  const iOS = (window.navigator as any).standalone === true;
  return mq.matches || iOS;
}

function detectIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  // celular: toque + viewport estreita. Tablet grande com teclado/mouse
  // continua desktop-ish; tablet só-toque entra como mobile.
  return coarsePointer && window.innerWidth < 1024;
}

function subscribe(cb: () => void) {
  const mqlPointer = window.matchMedia('(pointer: coarse)');
  const mqlStandalone = window.matchMedia('(display-mode: standalone)');
  let raf = 0;
  const onResize = () => {
    // throttle via rAF: resize não dispara lógica pesada
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(cb);
  };
  mqlPointer.addEventListener('change', cb);
  mqlStandalone.addEventListener('change', cb);
  window.addEventListener('resize', onResize, { passive: true });
  return () => {
    mqlPointer.removeEventListener('change', cb);
    mqlStandalone.removeEventListener('change', cb);
    window.removeEventListener('resize', onResize);
    cancelAnimationFrame(raf);
  };
}

function getSnapshot(): Environment {
  return detectIsMobile() ? 'mobile' : 'desktop';
}

function getServerSnapshot(): Environment {
  return 'desktop';
}

export type Environment = 'mobile' | 'desktop';

/** 'mobile' = layout mobile; 'desktop' = layout desktop (instalado ou aba). */
export function useEnvironment(): Environment {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** true se o app roda como PWA instalada (janela própria). */
export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = React.useState(false);
  React.useEffect(() => {
    const check = () => setStandalone(isStandalone());
    check();
    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener('change', check);
    return () => mql.removeEventListener('change', check);
  }, []);
  return standalone;
}
