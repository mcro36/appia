"use client";

import { useEffect, useState } from "react";

/**
 * Detecta se a aplicação está rodando como PWA instalado (standalone).
 * Cobre Android/Chrome (display-mode: standalone) e iOS/Safari (navigator.standalone).
 * Retorna `false` no SSR e na primeira renderização; só vira `true` após montar.
 */
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    const iosStandalone =
      "standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true;

    const avaliar = () => setIsPWA(mql.matches || iosStandalone);
    avaliar();

    mql.addEventListener("change", avaliar);
    return () => mql.removeEventListener("change", avaliar);
  }, []);

  return isPWA;
}
