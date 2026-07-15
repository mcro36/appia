"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, AlertTriangle, LayoutGrid, Settings2, Sparkles, Sunset,
  Square, Timer, CalendarRange, CalendarDays,
} from "lucide-react";
import {
  bucketsDoDia, agruparPorProjeto, ocupadosDoDia, proximaVaga, capacidadeDoDia,
  mesmoDia, type FolhaDTO, type ReuniaoSlim, type ConfigDTO,
} from "@/lib/agenda";
import type { Status } from "@/lib/tarefas";
import { STATUS_COR, STATUS_LABEL, NIVEL_COR, NIVEL_LABEL } from "@/lib/tarefas-display";
import { formatarDuracao } from "@/lib/datas";
import type { MudancaFolha } from "@/lib/useAgenda";
import { AgendaDia } from "@/components/views/AgendaDia";
import { VisaoSemana } from "@/components/views/VisaoSemana";
import { CartaoFolha } from "@/components/planejador/CartaoFolha";
import { EncerrarPopover } from "@/components/planejador/EncerrarPopover";
import { ConfigPopover } from "@/components/planejador/ConfigPopover";
import { WorkloadDia } from "@/components/planejador/WorkloadDia";

type Props = {
  folhas: FolhaDTO[];
  reunioes: ReuniaoSlim[];
  config: ConfigDTO;
  carregando: boolean;
  onAplicar: (id: string, dados: MudancaFolha) => void;
  onSalvarConfig: (dados: Partial<ConfigDTO>) => void;
  slotGeral: ReactNode;
};

const COLUNAS: { status: Status; vazio: string }[] = [
  { status: "a_fazer", vazio: "Nada pendente" },
  { status: "em_andamento", vazio: "Arraste tarefas para cá para agendá-las no dia" },
  { status: "concluido", vazio: "Nada concluído" },
];

const FOCO_KEY = "planejador.foco";
type Foco = { id: string; titulo: string; inicioTs: number };

export function PlanejadorDia({ folhas, reunioes, config, carregando, onAplicar, onSalvarConfig, slotGeral }: Props) {
  const [modo, setModo] = useState<"geral" | "dia" | "semana">("geral");
  const [dia, setDia] = useState<Date>(() => new Date());
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<Status | null>(null);
  const [configAberta, setConfigAberta] = useState(false);
  const [encerrarAberto, setEncerrarAberto] = useState(false);
  const [foco, setFoco] = useState<Foco | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!foco) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [foco]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(FOCO_KEY);
      if (s) setFoco(JSON.parse(s) as Foco);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      if (foco) localStorage.setItem(FOCO_KEY, JSON.stringify(foco));
      else localStorage.removeItem(FOCO_KEY);
    } catch { /* ignore */ }
  }, [foco]);

  const buckets = useMemo(
    () => bucketsDoDia(folhas, dia, new Date()),
    [folhas, dia],
  );

  const capacidade = useMemo(
    () => capacidadeDoDia(reunioes, buckets.emAndamento, dia, config),
    [reunioes, buckets.emAndamento, dia, config],
  );
  const sobrecarregado = capacidade.planejadoMin > capacidade.disponivelMin;

  function soltar(coluna: Status) {
    const id = arrastando;
    setArrastando(null);
    setColunaAlvo(null);
    if (!id) return;
    const f = folhas.find((x) => x.id === id);
    if (!f || f.status === coluna) return;

    if (coluna === "em_andamento") {
      const blocos = folhas.filter((x) => x.id !== id && x.status === "em_andamento");
      const ocupados = ocupadosDoDia(reunioes, blocos, dia, config);
      const dur = f.duracaoMin ?? config.duracaoPadraoMin;
      const { inicio } = proximaVaga(dia, ocupados, dur, new Date(), config);
      onAplicar(id, { status: "em_andamento", dataInicio: inicio, duracaoMin: dur });
    } else if (coluna === "a_fazer") {
      onAplicar(id, { status: "a_fazer", dataInicio: null });
    } else {
      onAplicar(id, { status: "concluido", dataInicio: f.dataInicio ?? new Date(dia).toISOString() });
    }
  }

  function adiar(f: FolhaDTO) {
    const base = f.dataInicio ? new Date(f.dataInicio) : new Date(dia);
    onAplicar(f.id, { status: "em_andamento", dataInicio: addDays(base, 1).toISOString() });
  }

  function planejarDia() {
    const ordemPri: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
    const pendentes = buckets.aFazer
      .filter((f) => f.status === "a_fazer")
      .sort((a, b) =>
        (Number(b.prazoRigido) - Number(a.prazoRigido)) ||
        (ordemPri[a.prioridade] - ordemPri[b.prioridade]) ||
        (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999"));
    const blocos = folhas
      .filter((x) => x.status === "em_andamento" && mesmoDia(x.dataInicio, dia))
      .map((x) => ({ dataInicio: x.dataInicio, duracaoMin: x.duracaoMin }));
    for (const f of pendentes) {
      const ocupados = ocupadosDoDia(reunioes, blocos, dia, config);
      const dur = f.duracaoMin ?? config.duracaoPadraoMin;
      const { inicio, estouro } = proximaVaga(dia, ocupados, dur, new Date(), config);
      if (estouro) break;
      onAplicar(f.id, { status: "em_andamento", dataInicio: inicio, duracaoMin: dur });
      blocos.push({ dataInicio: inicio, duracaoMin: dur });
    }
  }

  function iniciarFoco(f: FolhaDTO) {
    setFoco({ id: f.id, titulo: f.titulo, inicioTs: Date.now() });
  }

  function pararFoco() {
    if (!foco) return;
    const minutos = Math.max(1, Math.round((Date.now() - foco.inicioTs) / 60000));
    const f = folhas.find((x) => x.id === foco.id);
    onAplicar(foco.id, { tempoGastoMin: (f?.tempoGastoMin ?? 0) + minutos });
    setFoco(null);
  }

  function moverPendentesAmanha() {
    for (const f of buckets.emAndamento) {
      const base = f.dataInicio ? new Date(f.dataInicio) : new Date(dia);
      onAplicar(f.id, { dataInicio: addDays(base, 1).toISOString() });
    }
    setEncerrarAberto(false);
  }

  const rotuloDia = isToday(dia) ? "Hoje" : format(dia, "EEE, dd 'de' MMM", { locale: ptBR });
  const cronometro = foco ? Date.now() - foco.inicioTs : 0;
  const fmtCron = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const btnModo = (ativo: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
      ativo
        ? "border-indigo-600 bg-indigo-600 text-white"
        : "border-black/10 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
    }`;

  return (
    <div className="flex flex-col gap-4">
      {/* Cronômetro de foco */}
      {foco && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 dark:border-indigo-800 dark:bg-indigo-950/40">
          <Timer size={18} className="shrink-0 animate-pulse text-indigo-600" />
          <span className="truncate text-sm font-medium text-indigo-900 dark:text-indigo-100">{foco.titulo}</span>
          <span className="ml-auto font-mono text-lg tabular-nums text-indigo-700 dark:text-indigo-200">{fmtCron(cronometro)}</span>
          <button
            onClick={pararFoco}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Square size={14} /> Parar
          </button>
        </div>
      )}

      {/* Barra de navegação */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Abas de modo */}
        <button onClick={() => setModo("geral")} className={btnModo(modo === "geral")}>
          <LayoutGrid size={15} /> Geral
        </button>
        <button onClick={() => setModo("dia")} className={btnModo(modo === "dia")}>
          <CalendarDays size={15} /> Dia
        </button>
        <button onClick={() => setModo("semana")} className={btnModo(modo === "semana")}>
          <CalendarRange size={15} /> Semana
        </button>

        {/* Config — só nos modos de agenda */}
        {modo !== "geral" && (
          <div className="relative">
            <button
              onClick={() => setConfigAberta((v) => !v)}
              aria-label="Configurar expediente"
              className="rounded-lg border border-black/10 p-1.5 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <Settings2 size={16} />
            </button>
            {configAberta && (
              <ConfigPopover
                config={config}
                onFechar={() => setConfigAberta(false)}
                onSalvar={(dados) => { onSalvarConfig(dados); setConfigAberta(false); }}
              />
            )}
          </div>
        )}

        {/* Controles específicos do dia */}
        {modo === "dia" && (
          <>
            <button
              onClick={planejarDia}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-sm text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
              title="Distribuir as pendentes nos horários livres do dia"
            >
              <Sparkles size={15} /> Planejar dia
            </button>

            <div className="relative">
              <button
                onClick={() => setEncerrarAberto((v) => !v)}
                aria-label="Encerrar dia"
                title="Encerrar o dia"
                className="rounded-lg border border-black/10 p-1.5 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                <Sunset size={16} />
              </button>
              {encerrarAberto && (
                <EncerrarPopover
                  concluidas={buckets.concluido.length}
                  emAndamento={buckets.emAndamento.length}
                  onFechar={() => setEncerrarAberto(false)}
                  onMoverAmanha={moverPendentesAmanha}
                />
              )}
            </div>

            <span
              className={`hidden items-center gap-1 rounded-lg px-2 py-1 text-xs sm:inline-flex ${
                sobrecarregado
                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : "bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
              }`}
              title="Tempo planejado vs. disponível no dia"
            >
              {sobrecarregado && <AlertTriangle size={12} />}
              {formatarDuracao(capacidade.planejadoMin)} / {formatarDuracao(capacidade.disponivelMin)} livre
            </span>
          </>
        )}

        {/* Navegação de data — só para Dia e Semana */}
        {modo !== "geral" && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setDia((d) => addDays(d, modo === "semana" ? -7 : -1))}
              aria-label="Anterior"
              className="rounded-lg border border-black/10 p-1.5 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setDia(new Date())}
              className="rounded-lg border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              {modo === "semana" ? "Esta semana" : rotuloDia}
            </button>
            <button
              onClick={() => setDia((d) => addDays(d, modo === "semana" ? 7 : 1))}
              aria-label="Próximo"
              className="rounded-lg border border-black/10 p-1.5 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      {modo === "geral" ? (
        slotGeral
      ) : carregando ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : modo === "semana" ? (
        <VisaoSemana
          dia={dia}
          folhas={folhas}
          reunioes={reunioes}
          config={config}
          onSelecionarDia={(d) => { setModo("dia"); setDia(d); }}
        />
      ) : (
        <>
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
                                <CartaoFolha
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
                          <CartaoFolha
                            key={f.id}
                            folha={f}
                            carryOver={false}
                            onDragStart={() => setArrastando(f.id)}
                            onAdiar={status === "em_andamento" ? () => adiar(f) : undefined}
                            onFoco={status === "em_andamento" ? () => iniciarFoco(f) : undefined}
                            focando={foco?.id === f.id}
                          />
                        ))}
                  </div>
                </div>
              );
            })}
          </div>

          <WorkloadDia folhas={folhas} dia={dia} />

          <AgendaDia
            dia={dia}
            reunioes={reunioes}
            blocosTarefa={buckets.emAndamento}
            config={config}
            onReagendar={(id, iso) => onAplicar(id, { dataInicio: iso })}
          />
        </>
      )}
    </div>
  );
}
