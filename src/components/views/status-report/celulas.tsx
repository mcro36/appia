"use client";

import { useEffect, useRef, useState } from "react";
import { COR_LABEL, CORES, type Cor } from "@/lib/statusReport";

// Selo de leitura: "nenhum" = texto simples; senão pill colorido.
export function Celula({ texto, cor }: { texto: string; cor: Cor }) {
  if (!texto) return null;
  return cor === "nenhum"
    ? <span className="texto-simples">{texto}</span>
    : <span className={`selo ${cor}`}>{texto}</span>;
}

// Seletor de cor compacto: um botão (mostra a cor atual) que abre uma caixinha
// com as opções; ao escolher, aplica e fecha. "nenhum" = sem preenchimento (padrão).
export function CorPicker({ cor, onCor, aria }: { cor: Cor; onCor: (c: Cor) => void; aria: string }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  return (
    <div className="cor-picker" ref={ref}>
      <button
        type="button"
        className={`swatch ${cor}`}
        title={`Cor: ${COR_LABEL[cor]}`}
        aria-label={`Cor de ${aria}: ${COR_LABEL[cor]}`}
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      />
      {aberto && (
        <div className="cor-pop" role="listbox" aria-label={`Cor de ${aria}`}>
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${c}${cor === c ? " sel" : ""}`}
              title={COR_LABEL[c]}
              aria-label={COR_LABEL[c]}
              aria-selected={cor === c}
              onClick={() => { onCor(c); setAberto(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
