// Domínio do planejador diário — regras puras, sem React nem apresentação.
// "Folha" = unidade agendável (tarefa-folha: atividade simples ou subtarefa
// sem filhos). O planejador opera sobre folhas, agrupando-as por dia/status.
import type { Nivel, Prioridade, Status, Tipo } from "@/lib/tarefas";

export type FolhaDTO = {
  id: string;
  titulo: string;
  status: Status;
  prioridade: Prioridade;
  prazo: string | null;
  prazoRigido: boolean;
  dataInicio: string | null;
  duracaoMin: number | null;
  tempoGastoMin: number | null;
  concluidaEm: string | null;
  // Projeto/atividade raiz a que a folha pertence (para agrupar no backlog).
  projeto: { id: string; titulo: string; tipo: Tipo; nivel: Nivel };
};

// Duração padrão de uma folha sem estimativa.
export const DURACAO_PADRAO_MIN = 10;
// Duração assumida para uma reunião sem duração informada (bloqueio da agenda).
export const DURACAO_REUNIAO_PADRAO_MIN = 30;

// Preferências do planejador (tempos em minutos desde a meia-noite).
export type ConfigDTO = {
  expedienteInicioMin: number;
  expedienteFimMin: number;
  almocoInicioMin: number | null;
  almocoFimMin: number | null;
  duracaoPadraoMin: number;
  bufferMin: number;
};

export const CONFIG_PADRAO: ConfigDTO = {
  expedienteInicioMin: 9 * 60,
  expedienteFimMin: 18 * 60,
  almocoInicioMin: 12 * 60,
  almocoFimMin: 13 * 60,
  duracaoPadraoMin: DURACAO_PADRAO_MIN,
  bufferMin: 0,
};

// Reunião como compromisso fixo na agenda do dia.
export type ReuniaoSlim = {
  id: string;
  titulo: string | null;
  dataHora: string;
  duracaoMin: number | null;
};

export type AgendaPayload = {
  folhas: FolhaDTO[];
  reunioes: ReuniaoSlim[];
  config: ConfigDTO;
};

export type Intervalo = { inicio: Date; fim: Date };

// ── Helpers de data (comparação por dia local) ─────────────────────

export function mesmoDia(iso: string | null, dia: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === dia.getFullYear() &&
    d.getMonth() === dia.getMonth() &&
    d.getDate() === dia.getDate()
  );
}

export function antesDoDia(iso: string | null, dia: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  return a.getTime() < b.getTime();
}

/** Constrói uma data no dia informado a partir de minutos desde a meia-noite. */
export function minutosParaData(dia: Date, minutos: number): Date {
  const d = new Date(dia);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutos);
  return d;
}

// ── Distribuição automática (Fase 2) ───────────────────────────────

/** Intervalos ocupados do dia: reuniões + blocos de tarefa já agendados. */
export function ocupadosDoDia(
  reunioes: ReuniaoSlim[],
  blocosTarefa: { dataInicio: string | null; duracaoMin: number | null }[],
  dia: Date,
  cfg: ConfigDTO,
): Intervalo[] {
  const ints: Intervalo[] = [];
  for (const r of reunioes) {
    if (!mesmoDia(r.dataHora, dia)) continue;
    const ini = new Date(r.dataHora);
    ints.push({ inicio: ini, fim: new Date(ini.getTime() + (r.duracaoMin ?? DURACAO_REUNIAO_PADRAO_MIN) * 60000) });
  }
  for (const b of blocosTarefa) {
    if (!mesmoDia(b.dataInicio, dia)) continue;
    const ini = new Date(b.dataInicio!);
    ints.push({ inicio: ini, fim: new Date(ini.getTime() + (b.duracaoMin ?? cfg.duracaoPadraoMin) * 60000) });
  }
  return ints.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

/**
 * Acha a próxima vaga livre no dia para um bloco de `duracaoMin`, encaixando
 * nos buracos entre os intervalos ocupados + almoço, dentro do expediente,
 * começando de "agora" quando o dia é hoje. Sinaliza estouro do expediente.
 */
export function proximaVaga(
  dia: Date,
  ocupados: Intervalo[],
  duracaoMin: number,
  agora: Date,
  cfg: ConfigDTO,
): { inicio: string; estouro: boolean } {
  const dayEnd = minutosParaData(dia, cfg.expedienteFimMin);
  const durMs = duracaoMin * 60000;
  const bufMs = cfg.bufferMin * 60000;

  const blocos = [...ocupados];
  if (cfg.almocoInicioMin != null && cfg.almocoFimMin != null) {
    blocos.push({ inicio: minutosParaData(dia, cfg.almocoInicioMin), fim: minutosParaData(dia, cfg.almocoFimMin) });
  }
  blocos.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  let cursor = minutosParaData(dia, cfg.expedienteInicioMin);
  if (mesmoDia(agora.toISOString(), dia) && agora.getTime() > cursor.getTime()) cursor = new Date(agora);

  const place = (c: Date) => ({ inicio: c.toISOString(), estouro: c.getTime() + durMs > dayEnd.getTime() });

  for (const b of blocos) {
    if (b.fim.getTime() <= cursor.getTime()) continue; // já passou
    if (b.inicio.getTime() - cursor.getTime() >= durMs) return place(cursor); // cabe antes deste bloco
    cursor = new Date(b.fim.getTime() + bufMs); // pula para depois do bloco (+ buffer)
  }
  return place(cursor);
}

/** Capacidade do dia: minutos planejados (blocos de tarefa) vs. livres. */
export function capacidadeDoDia(
  reunioes: ReuniaoSlim[],
  blocosTarefa: { dataInicio: string | null; duracaoMin: number | null }[],
  dia: Date,
  cfg: ConfigDTO,
): { planejadoMin: number; disponivelMin: number } {
  const expediente = cfg.expedienteFimMin - cfg.expedienteInicioMin;
  const almoco =
    cfg.almocoInicioMin != null && cfg.almocoFimMin != null ? cfg.almocoFimMin - cfg.almocoInicioMin : 0;
  let reuniaoMin = 0;
  for (const r of reunioes) if (mesmoDia(r.dataHora, dia)) reuniaoMin += r.duracaoMin ?? DURACAO_REUNIAO_PADRAO_MIN;
  const disponivelMin = Math.max(0, expediente - almoco - reuniaoMin);

  let planejadoMin = 0;
  for (const b of blocosTarefa) if (mesmoDia(b.dataInicio, dia)) planejadoMin += b.duracaoMin ?? cfg.duracaoPadraoMin;

  return { planejadoMin, disponivelMin };
}

// ── Agrupamento em colunas (a fazer / em andamento / concluído) ────

export type BucketsDia = {
  aFazer: FolhaDTO[];
  emAndamento: FolhaDTO[];
  concluido: FolhaDTO[];
  /** Folhas que vieram de dias anteriores incompletas (mostradas em "A fazer" hoje). */
  carryOverIds: Set<string>;
};

/** Visão Geral: tudo, sem recorte de data. */
export function bucketsGeral(folhas: FolhaDTO[]): BucketsDia {
  return {
    aFazer: folhas.filter((f) => f.status === "a_fazer"),
    emAndamento: folhas.filter((f) => f.status === "em_andamento"),
    concluido: folhas.filter((f) => f.status === "concluido"),
    carryOverIds: new Set(),
  };
}

/**
 * Visão de um dia específico:
 * - emAndamento/concluído recortados pelo dia;
 * - aFazer = backlog de pendentes (todas) + carry-over (em_andamento de dias
 *   anteriores ainda não concluídas, só quando o dia visto é hoje).
 */
export function bucketsDoDia(folhas: FolhaDTO[], dia: Date, hoje: Date): BucketsDia {
  const ehHoje = mesmoDia(dia.toISOString(), hoje);
  const carryIds = new Set<string>();
  const carry: FolhaDTO[] = [];

  if (ehHoje) {
    for (const f of folhas) {
      if (f.status === "em_andamento" && antesDoDia(f.dataInicio, hoje)) {
        carry.push(f);
        carryIds.add(f.id);
      }
    }
  }

  const emAndamento = folhas
    .filter((f) => f.status === "em_andamento" && mesmoDia(f.dataInicio, dia))
    .sort((a, b) => (a.dataInicio ?? "").localeCompare(b.dataInicio ?? ""));

  const concluido = folhas.filter(
    (f) => f.status === "concluido" && (mesmoDia(f.concluidaEm, dia) || mesmoDia(f.dataInicio, dia)),
  );

  const aFazer = [...carry, ...folhas.filter((f) => f.status === "a_fazer")];

  return { aFazer, emAndamento, concluido, carryOverIds: carryIds };
}

/** Agrupa folhas pelo projeto/atividade raiz, preservando a ordem de chegada. */
export function agruparPorProjeto(
  folhas: FolhaDTO[],
): { projeto: FolhaDTO["projeto"]; itens: FolhaDTO[] }[] {
  const mapa = new Map<string, { projeto: FolhaDTO["projeto"]; itens: FolhaDTO[] }>();
  for (const f of folhas) {
    const g = mapa.get(f.projeto.id) ?? { projeto: f.projeto, itens: [] };
    g.itens.push(f);
    mapa.set(f.projeto.id, g);
  }
  return [...mapa.values()];
}
