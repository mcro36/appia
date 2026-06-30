"use client";

import { useState } from "react";
import { minutosParaHHMM, hhmmParaMinutos } from "@/lib/datas";
import type { ConfigDTO } from "@/lib/agenda";

// Editor das preferências do planejador: expediente, almoço, duração padrão
// e buffer entre blocos.
export function ConfigPopover({
  config,
  onFechar,
  onSalvar,
}: {
  config: ConfigDTO;
  onFechar: () => void;
  onSalvar: (dados: Partial<ConfigDTO>) => void;
}) {
  const [expIni, setExpIni] = useState(minutosParaHHMM(config.expedienteInicioMin));
  const [expFim, setExpFim] = useState(minutosParaHHMM(config.expedienteFimMin));
  const [almoco, setAlmoco] = useState(config.almocoInicioMin != null && config.almocoFimMin != null);
  const [almIni, setAlmIni] = useState(minutosParaHHMM(config.almocoInicioMin ?? 12 * 60));
  const [almFim, setAlmFim] = useState(minutosParaHHMM(config.almocoFimMin ?? 13 * 60));
  const [dur, setDur] = useState(String(config.duracaoPadraoMin));
  const [buffer, setBuffer] = useState(String(config.bufferMin));

  function salvar() {
    onSalvar({
      expedienteInicioMin: hhmmParaMinutos(expIni) ?? config.expedienteInicioMin,
      expedienteFimMin: hhmmParaMinutos(expFim) ?? config.expedienteFimMin,
      almocoInicioMin: almoco ? hhmmParaMinutos(almIni) : null,
      almocoFimMin: almoco ? hhmmParaMinutos(almFim) : null,
      duracaoPadraoMin: parseInt(dur, 10) || config.duracaoPadraoMin,
      bufferMin: parseInt(buffer, 10) || 0,
    });
  }

  const campo = "w-full rounded-md bg-zinc-50 px-2 py-1 text-xs ring-1 ring-black/10 outline-none focus:ring-indigo-400 dark:bg-zinc-800 dark:ring-white/10";
  const rotulo = "mb-0.5 block text-[11px] font-medium text-zinc-500";

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onFechar} />
      <div className="absolute left-0 z-30 mt-1 w-64 rounded-xl border border-black/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-900">
        <p className="mb-2 text-xs font-semibold">Expediente</p>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <div>
            <label className={rotulo}>Início</label>
            <input type="time" value={expIni} onChange={(e) => setExpIni(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Fim</label>
            <input type="time" value={expFim} onChange={(e) => setExpFim(e.target.value)} className={campo} />
          </div>
        </div>

        <label className="mb-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <input type="checkbox" checked={almoco} onChange={(e) => setAlmoco(e.target.checked)} />
          Reservar almoço
        </label>
        {almoco && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div>
              <label className={rotulo}>Almoço início</label>
              <input type="time" value={almIni} onChange={(e) => setAlmIni(e.target.value)} className={campo} />
            </div>
            <div>
              <label className={rotulo}>Almoço fim</label>
              <input type="time" value={almFim} onChange={(e) => setAlmFim(e.target.value)} className={campo} />
            </div>
          </div>
        )}

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label className={rotulo}>Duração padrão (min)</label>
            <input type="number" min={5} step={5} value={dur} onChange={(e) => setDur(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Buffer (min)</label>
            <input type="number" min={0} step={5} value={buffer} onChange={(e) => setBuffer(e.target.value)} className={campo} />
          </div>
        </div>

        <button
          onClick={salvar}
          className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          Salvar
        </button>
      </div>
    </>
  );
}
