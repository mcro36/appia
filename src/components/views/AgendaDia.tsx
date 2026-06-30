"use client";

import { useRef, useState } from "react";
import { Users } from "lucide-react";
import { mesmoDia, type ConfigDTO, type FolhaDTO, type ReuniaoSlim, DURACAO_REUNIAO_PADRAO_MIN, minutosParaData } from "@/lib/agenda";

const PX_POR_MIN = 1.1;
const SNAP_MIN = 5;

type Bloco = { id: string; titulo: string; inicioMin: number; duracaoMin: number; reuniao: boolean };

function minutosDoDia(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function snap(min: number, passo = SNAP_MIN): number {
  return Math.round(min / passo) * passo;
}

export function AgendaDia({
  dia,
  reunioes,
  blocosTarefa,
  config,
  onReagendar,
}: {
  dia: Date;
  reunioes: ReuniaoSlim[];
  blocosTarefa: FolhaDTO[];
  config: ConfigDTO;
  onReagendar: (id: string, novoInicioISO: string) => void;
}) {
  const [drag, setDrag] = useState<{ id: string; deltaMin: number } | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const blocos: Bloco[] = [
    ...reunioes
      .filter((r) => mesmoDia(r.dataHora, dia))
      .map((r) => ({
        id: r.id,
        titulo: r.titulo || "Reunião",
        inicioMin: minutosDoDia(r.dataHora),
        duracaoMin: r.duracaoMin ?? DURACAO_REUNIAO_PADRAO_MIN,
        reuniao: true,
      })),
    ...blocosTarefa
      .filter((f) => mesmoDia(f.dataInicio, dia))
      .map((f) => ({
        id: f.id,
        titulo: f.titulo,
        inicioMin: minutosDoDia(f.dataInicio!),
        duracaoMin: f.duracaoMin ?? config.duracaoPadraoMin,
        reuniao: false,
      })),
  ];

  // Janela visível: expediente, esticada para conter qualquer bloco fora dele.
  const inicios = blocos.map((b) => b.inicioMin);
  const fins = blocos.map((b) => b.inicioMin + b.duracaoMin);
  const minView = Math.min(config.expedienteInicioMin, ...inicios.length ? inicios : [config.expedienteInicioMin]);
  const maxView = Math.max(config.expedienteFimMin, ...fins.length ? fins : [config.expedienteFimMin]);
  const altura = (maxView - minView) * PX_POR_MIN;

  const horas: number[] = [];
  for (let h = Math.ceil(minView / 60); h <= Math.floor(maxView / 60); h++) horas.push(h);

  function iniciarArraste(e: React.PointerEvent, bloco: Bloco) {
    e.preventDefault();
    const startY = e.clientY;
    const mover = (ev: PointerEvent) => setDrag({ id: bloco.id, deltaMin: snap((ev.clientY - startY) / PX_POR_MIN) });
    const soltar = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      setDrag(null);
      const delta = snap((ev.clientY - startY) / PX_POR_MIN);
      if (delta === 0) return;
      const novoMin = Math.max(0, Math.min(24 * 60 - bloco.duracaoMin, bloco.inicioMin + delta));
      onReagendar(bloco.id, minutosParaData(dia, novoMin).toISOString());
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  const almocoVisivel = config.almocoInicioMin != null && config.almocoFimMin != null;

  return (
    <div className="rounded-xl border border-black/5 bg-white p-3 dark:border-white/5 dark:bg-zinc-900/40">
      <p className="mb-2 px-1 text-xs font-semibold text-zinc-500">Agenda do dia</p>
      <div ref={areaRef} className="relative ml-12" style={{ height: altura }}>
        {/* Almoço */}
        {almocoVisivel && (
          <div
            className="absolute inset-x-0 bg-amber-50 dark:bg-amber-950/20"
            style={{
              top: (config.almocoInicioMin! - minView) * PX_POR_MIN,
              height: (config.almocoFimMin! - config.almocoInicioMin!) * PX_POR_MIN,
            }}
          >
            <span className="absolute left-1 top-0.5 text-[10px] text-amber-700/70 dark:text-amber-500/70">almoço</span>
          </div>
        )}

        {/* Linhas de hora */}
        {horas.map((h) => {
          const top = (h * 60 - minView) * PX_POR_MIN;
          return (
            <div key={h} className="absolute inset-x-0 border-t border-black/5 dark:border-white/5" style={{ top }}>
              <span className="absolute -left-12 -top-2 w-10 text-right text-[10px] tabular-nums text-zinc-400">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          );
        })}

        {/* Blocos */}
        {blocos.map((b) => {
          const deslocado = drag?.id === b.id ? drag.deltaMin : 0;
          const top = (b.inicioMin - minView + deslocado) * PX_POR_MIN;
          const height = Math.max(14, b.duracaoMin * PX_POR_MIN - 2);
          return (
            <div
              key={b.id}
              onPointerDown={b.reuniao ? undefined : (e) => iniciarArraste(e, b)}
              title={b.reuniao ? "Reunião (fixa)" : "Arraste para reagendar"}
              className={`absolute right-0 left-1 overflow-hidden rounded-md px-2 py-0.5 text-[11px] shadow-sm ${
                b.reuniao
                  ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
                  : "cursor-ns-resize bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300/50 dark:bg-indigo-900/40 dark:text-indigo-100"
              }`}
              style={{ top, height }}
            >
              <span className="flex items-center gap-1 font-medium">
                {b.reuniao && <Users size={10} className="shrink-0" />}
                <span className="truncate">{b.titulo}</span>
              </span>
              <span className="opacity-70">{fmtMin(b.inicioMin + deslocado)}–{fmtMin(b.inicioMin + deslocado + b.duracaoMin)}</span>
            </div>
          );
        })}

        {blocos.length === 0 && (
          <p className="absolute inset-x-0 top-4 text-center text-xs text-zinc-400">
            Nada agendado — arraste tarefas para “Em andamento”.
          </p>
        )}
      </div>
    </div>
  );
}
