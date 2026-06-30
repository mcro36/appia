"use client";

import { useMemo, useState } from "react";
import { format, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, ChevronsRight, Clock, AlertTriangle, LayoutGrid, Settings2, Sparkles, Sunset,
} from "lucide-react";
import {
  bucketsDoDia, bucketsGeral, agruparPorProjeto, ocupadosDoDia, proximaVaga, capacidadeDoDia,
  mesmoDia, DURACAO_PADRAO_MIN, type FolhaDTO, type ReuniaoSlim, type ConfigDTO,
} from "@/lib/agenda";
import type { Status } from "@/lib/tarefas";
import {
  STATUS_COR, STATUS_LABEL, PRIORIDADE_COR, PRIORIDADE_LABEL, NIVEL_COR, NIVEL_LABEL,
} from "@/lib/tarefas-display";
import { formatarDuracao, minutosParaHHMM, hhmmParaMinutos } from "@/lib/datas";
import type { MudancaFolha } from "@/lib/useAgenda";
import { AgendaDia } from "@/components/views/AgendaDia";

type Props = {
  folhas: FolhaDTO[];
  reunioes: ReuniaoSlim[];
  config: ConfigDTO;
  carregando: boolean;
  onAplicar: (id: string, dados: MudancaFolha) => void;
  onSalvarConfig: (dados: Partial<ConfigDTO>) => void;
};

const COLUNAS: { status: Status; vazio: string }[] = [
  { status: "a_fazer", vazio: "Nada pendente" },
  { status: "em_andamento", vazio: "Arraste tarefas para cá para agendá-las no dia" },
  { status: "concluido", vazio: "Nada concluído" },
];

export function PlanejadorDia({ folhas, reunioes, config, carregando, onAplicar, onSalvarConfig }: Props) {
  const [modo, setModo] = useState<"geral" | "dia">("dia");
  const [dia, setDia] = useState<Date>(() => new Date());
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<Status | null>(null);
  const [configAberta, setConfigAberta] = useState(false);
  const [encerrarAberto, setEncerrarAberto] = useState(false);

  const buckets = useMemo(
    () => (modo === "geral" ? bucketsGeral(folhas) : bucketsDoDia(folhas, dia, new Date())),
    [folhas, modo, dia],
  );

  const diaAlvo = modo === "dia" ? dia : new Date();

  const capacidade = useMemo(
    () => capacidadeDoDia(reunioes, buckets.emAndamento, diaAlvo, config),
    [reunioes, buckets.emAndamento, diaAlvo, config],
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
      const ocupados = ocupadosDoDia(reunioes, blocos, diaAlvo, config);
      const dur = f.duracaoMin ?? config.duracaoPadraoMin ?? DURACAO_PADRAO_MIN;
      const { inicio } = proximaVaga(diaAlvo, ocupados, dur, new Date(), config);
      onAplicar(id, { status: "em_andamento", dataInicio: inicio, duracaoMin: dur });
    } else if (coluna === "a_fazer") {
      onAplicar(id, { status: "a_fazer", dataInicio: null });
    } else {
      onAplicar(id, { status: "concluido", dataInicio: f.dataInicio ?? new Date(diaAlvo).toISOString() });
    }
  }

  function adiar(f: FolhaDTO) {
    const base = f.dataInicio ? new Date(f.dataInicio) : new Date(diaAlvo);
    onAplicar(f.id, { status: "em_andamento", dataInicio: addDays(base, 1).toISOString() });
  }

  // Distribui as pendentes nos horários livres do dia até encher o expediente.
  function planejarDia() {
    const ordemPri: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
    const pendentes = buckets.aFazer
      .filter((f) => f.status === "a_fazer")
      .sort((a, b) =>
        (ordemPri[a.prioridade] - ordemPri[b.prioridade]) ||
        (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999"));
    const blocos = folhas
      .filter((x) => x.status === "em_andamento" && mesmoDia(x.dataInicio, diaAlvo))
      .map((x) => ({ dataInicio: x.dataInicio, duracaoMin: x.duracaoMin }));
    for (const f of pendentes) {
      const ocupados = ocupadosDoDia(reunioes, blocos, diaAlvo, config);
      const dur = f.duracaoMin ?? config.duracaoPadraoMin ?? DURACAO_PADRAO_MIN;
      const { inicio, estouro } = proximaVaga(diaAlvo, ocupados, dur, new Date(), config);
      if (estouro) break;
      onAplicar(f.id, { status: "em_andamento", dataInicio: inicio, duracaoMin: dur });
      blocos.push({ dataInicio: inicio, duracaoMin: dur });
    }
  }

  // Encerramento: leva as tarefas em andamento não concluídas para amanhã.
  function moverPendentesAmanha() {
    for (const f of buckets.emAndamento) {
      const base = f.dataInicio ? new Date(f.dataInicio) : new Date(diaAlvo);
      onAplicar(f.id, { dataInicio: addDays(base, 1).toISOString() });
    }
    setEncerrarAberto(false);
  }

  const rotuloDia = isToday(dia) ? "Hoje" : format(dia, "EEE, dd 'de' MMM", { locale: ptBR });

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

      {!carregando && modo === "dia" && (
        <AgendaDia
          dia={dia}
          reunioes={reunioes}
          blocosTarefa={buckets.emAndamento}
          config={config}
          onReagendar={(id, iso) => onAplicar(id, { dataInicio: iso })}
        />
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

function EncerrarPopover({
  concluidas,
  emAndamento,
  onFechar,
  onMoverAmanha,
}: {
  concluidas: number;
  emAndamento: number;
  onFechar: () => void;
  onMoverAmanha: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onFechar} />
      <div className="absolute left-0 z-30 mt-1 w-60 rounded-xl border border-black/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-900">
        <p className="mb-2 text-xs font-semibold">Encerrar o dia</p>
        <div className="mb-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
          <p className="flex items-center justify-between">
            <span>Concluídas hoje</span>
            <span className="font-semibold text-emerald-600">{concluidas}</span>
          </p>
          <p className="flex items-center justify-between">
            <span>Em andamento (não concluídas)</span>
            <span className="font-semibold text-amber-600">{emAndamento}</span>
          </p>
        </div>
        <button
          onClick={onMoverAmanha}
          disabled={emAndamento === 0}
          className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
        >
          Mover {emAndamento} para amanhã
        </button>
      </div>
    </>
  );
}

function ConfigPopover({
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
    const dados: Partial<ConfigDTO> = {
      expedienteInicioMin: hhmmParaMinutos(expIni) ?? config.expedienteInicioMin,
      expedienteFimMin: hhmmParaMinutos(expFim) ?? config.expedienteFimMin,
      almocoInicioMin: almoco ? hhmmParaMinutos(almIni) : null,
      almocoFimMin: almoco ? hhmmParaMinutos(almFim) : null,
      duracaoPadraoMin: parseInt(dur, 10) || config.duracaoPadraoMin,
      bufferMin: parseInt(buffer, 10) || 0,
    };
    onSalvar(dados);
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
