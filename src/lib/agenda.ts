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
  dataInicio: string | null;
  duracaoMin: number | null;
  concluidaEm: string | null;
  // Projeto/atividade raiz a que a folha pertence (para agrupar no backlog).
  projeto: { id: string; titulo: string; tipo: Tipo; nivel: Nivel };
};

// Duração padrão de uma folha sem estimativa.
export const DURACAO_PADRAO_MIN = 10;
// Expediente padrão (configurável na Fase 2 via Configuracao).
export const EXPEDIENTE_INICIO_H = 9;
export const EXPEDIENTE_FIM_H = 18;

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

export function inicioDoDia(dia: Date, hora = EXPEDIENTE_INICIO_H): Date {
  const d = new Date(dia);
  d.setHours(hora, 0, 0, 0);
  return d;
}

// ── Distribuição (stub da Fase 1: empilha após o último bloco) ─────
// A Fase 2 substitui por proximaVaga() ciente de reuniões/almoço/buffer.

export function proximoInicioSimples(dia: Date, blocos: FolhaDTO[], agora: Date): string {
  let inicio = inicioDoDia(dia);
  if (mesmoDia(agora.toISOString(), dia) && agora > inicio) inicio = new Date(agora);
  for (const b of blocos) {
    if (!b.dataInicio) continue;
    const fim = new Date(new Date(b.dataInicio).getTime() + (b.duracaoMin ?? DURACAO_PADRAO_MIN) * 60000);
    if (fim > inicio) inicio = fim;
  }
  return inicio.toISOString();
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
