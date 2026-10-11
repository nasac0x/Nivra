import * as React from "react"

const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const coarse = window.matchMedia('(pointer: coarse)')
  let raf = 0
  const onResize = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(callback)
  }
  mql.addEventListener("change", callback)
  coarse.addEventListener("change", callback)
  window.addEventListener("resize", onResize, { passive: true })
  return () => {
    mql.removeEventListener("change", callback)
    coarse.removeEventListener("change", callback)
    window.removeEventListener("resize", onResize)
    cancelAnimationFrame(raf)
  }
}

function getSnapshot() {
  // DESKTOP (mouse/teclado) nunca vira mobile por janela estreita:
  // layout mobile é exclusivo de pointer coarse (celular/tablet touch).
  // Janela desktop < 60% da tela congela via --min-app-width (AppShell).
  if (!window.matchMedia('(pointer: coarse)').matches) return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
