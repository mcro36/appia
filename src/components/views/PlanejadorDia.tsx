"use client";

import { useMemo, useState } from "react";
import { format, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, ChevronsRight, Clock, AlertTriangle, LayoutGrid,
} from "lucide-react";
import {
  bucketsDoDia, bucketsGeral, agruparPorProjeto, proximoInicioSimples,
  mesmoDia, DURACAO_PADRAO_MIN, type FolhaDTO,
} from "@/lib/agenda";
import type { Status } from "@/lib/tarefas";
import {
  STATUS_COR, STATUS_LABEL, PRIORIDADE_COR, PRIORIDADE_LABEL, NIVEL_COR, NIVEL_LABEL,
} from "@/lib/tarefas-display";
import { formatarDuracao } from "@/lib/datas";
import type { MudancaFolha } from "@/lib/useAgenda";

type Props = {
  folhas: FolhaDTO[];
  carregando: boolean;
  onAplicar: (id: string, dados: MudancaFolha) => void;
};

const COLUNAS: { status: Status; vazio: string }[] = [
  { status: "a_fazer", vazio: "Nada pendente" },
  { status: "em_andamento", vazio: "Arraste tarefas para cá para agendá-las no dia" },
  { status: "concluido", vazio: "Nada concluído" },
];

export function PlanejadorDia({ folhas, carregando, onAplicar }: Props) {
  const [modo, setModo] = useState<"geral" | "dia">("dia");
  const [dia, setDia] = useState<Date>(() => new Date());
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<Status | null>(null);

  const buckets = useMemo(
    () => (modo === "geral" ? bucketsGeral(folhas) : bucketsDoDia(folhas, dia, new Date())),
    [folhas, modo, dia],
  );

  // Dia em que as tarefas soltas em "em andamento" serão agendadas.
  const diaAlvo = modo === "dia" ? dia : new Date();

  function soltar(coluna: Status) {
    const id = arrastando;
    setArrastando(null);
    setColunaAlvo(null);
    if (!id) return;
    const f = folhas.find((x) => x.id === id);
    if (!f || f.status === coluna) return;

    if (coluna === "em_andamento") {
      const blocos = folhas.filter((x) => x.status === "em_andamento" && mesmoDia(x.dataInicio, diaAlvo));
      onAplicar(id, {
        status: "em_andamento",
        dataInicio: proximoInicioSimples(diaAlvo, blocos, new Date()),
        duracaoMin: f.duracaoMin ?? DURACAO_PADRAO_MIN,
      });
    } else if (coluna === "a_fazer") {
      onAplicar(id, { status: "a_fazer", dataInicio: null });
    } else {
      // concluído: garante que apareça no dia mesmo sem horário prévio
      const inicio = new Date(diaAlvo);
      onAplicar(id, { status: "concluido", dataInicio: f.dataInicio ?? inicio.toISOString() });
    }
  }

  function adiar(f: FolhaDTO) {
    const base = f.dataInicio ? new Date(f.dataInicio) : new Date(diaAlvo);
    onAplicar(f.id, { status: "em_andamento", dataInicio: addDays(base, 1).toISOString() });
  }

  const rotuloDia = isToday(dia)
    ? "Hoje"
    : format(dia, "EEE, dd 'de' MMM", { locale: ptBR });

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de navegação do dia */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setModo("geral")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            modo === "geral"
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-black/10 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          }`}
        >
          <LayoutGrid size={15} /> Geral
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => { setModo("dia"); setDia((d) => addDays(d, -1)); }}
            aria-label="Dia anterior"
            className="rounded-lg border border-black/10 p-1.5 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { setModo("dia"); setDia(new Date()); }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              modo === "dia"
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-black/10 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            }`}
          >
            {modo === "dia" ? rotuloDia : "Hoje"}
          </button>
          <button
            onClick={() => { setModo("dia"); setDia((d) => addDays(d, 1)); }}
            aria-label="Próximo dia"
            className="rounded-lg border border-black/10 p-1.5 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {carregando ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUNAS.map(({ status, vazio }) => {
            const itens =
              status === "a_fazer" ? buckets.aFazer
              : status === "em_andamento" ? buckets.emAndamento
              : buckets.concluido;
            const realce = colunaAlvo === status;

            return (
              <div
                key={status}
                onDragOver={(e) => { e.preventDefault(); setColunaAlvo(status); }}
                onDragLeave={() => setColunaAlvo((c) => (c === status ? null : c))}
                onDrop={() => soltar(status)}
                className={`flex min-h-40 flex-col rounded-xl border p-3 transition-colors ${
                  realce
                    ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30"
                    : "border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]"
                }`}
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COR[status].ponto}`} />
                  <span className="text-sm font-semibold">{STATUS_LABEL[status]}</span>
                  <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/10">
                    {itens.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {itens.length === 0 && (
                    <p className="rounded-lg border border-dashed border-black/10 px-3 py-6 text-center text-xs text-zinc-400 dark:border-white/10">
                      {vazio}
                    </p>
                  )}

                  {status === "a_fazer"
                    ? agruparPorProjeto(itens).map((grupo) => (
                        <div key={grupo.projeto.id} className="mb-1">
                          <div className="mb-1 flex items-center gap-1.5 px-1">
                            <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                              {grupo.projeto.titulo}
                            </span>
                            <span className={`rounded px-1 py-px text-[9px] font-semibold ${NIVEL_COR[grupo.projeto.nivel]}`}>
                              {NIVEL_LABEL[grupo.projeto.nivel]}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {grupo.itens.map((f) => (
                              <Cartao
                                key={f.id}
                                folha={f}
                                carryOver={buckets.carryOverIds.has(f.id)}
                                onDragStart={() => setArrastando(f.id)}
                                onAdiar={f.dataInicio ? () => adiar(f) : undefined}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    : itens.map((f) => (
                        <Cartao
                          key={f.id}
                          folha={f}
                          carryOver={false}
                          onDragStart={() => setArrastando(f.id)}
                          onAdiar={status === "em_andamento" ? () => adiar(f) : undefined}
                        />
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Cartao({
  folha,
  carryOver,
  onDragStart,
  onAdiar,
}: {
  folha: FolhaDTO;
  carryOver: boolean;
  onDragStart: () => void;
  onAdiar?: () => void;
}) {
  const concluida = folha.status === "concluido";
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group cursor-grab rounded-lg border border-black/10 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="flex items-start gap-2">
        <p className={`flex-1 text-sm leading-snug ${concluida ? "text-zinc-400 line-through" : "font-medium"}`}>
          {folha.titulo}
        </p>
        {onAdiar && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdiar(); }}
            title="Adiar para amanhã"
            className="shrink-0 rounded p-0.5 text-zinc-300 opacity-0 transition hover:text-indigo-600 group-hover:opacity-100"
          >
            <ChevronsRight size={15} />
          </button>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORIDADE_COR[folha.prioridade]}`}>
          {PRIORIDADE_LABEL[folha.prioridade]}
        </span>
        {folha.dataInicio && (
          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600">
            <Clock size={10} />
            {format(new Date(folha.dataInicio), "HH:mm")}
            {folha.duracaoMin ? ` · ${formatarDuracao(folha.duracaoMin)}` : ""}
          </span>
        )}
        {carryOver && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600">
            <AlertTriangle size={10} /> atrasada
          </span>
        )}
      </div>
    </div>
  );
}
