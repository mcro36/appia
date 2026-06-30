// Domínio de métricas e priorização do planejador — funções puras sobre folhas.
import { isAtrasada } from "@/lib/tarefas";
import type { FolhaDTO } from "@/lib/agenda";

export type Resumo = {
  total: number;
  concluidas: number;
  emAndamento: number;
  aFazer: number;
  pctConcluido: number;
  estimadoMin: number;
  realMin: number;
};

export function resumo(folhas: FolhaDTO[]): Resumo {
  const total = folhas.length;
  const concluidas = folhas.filter((f) => f.status === "concluido").length;
  const emAndamento = folhas.filter((f) => f.status === "em_andamento").length;
  const aFazer = folhas.filter((f) => f.status === "a_fazer").length;
  const estimadoMin = folhas.reduce((s, f) => s + (f.duracaoMin ?? 0), 0);
  const realMin = folhas.reduce((s, f) => s + (f.tempoGastoMin ?? 0), 0);
  return {
    total,
    concluidas,
    emAndamento,
    aFazer,
    pctConcluido: total ? Math.round((concluidas / total) * 100) : 0,
    estimadoMin,
    realMin,
  };
}

export type LinhaProjeto = {
  projeto: FolhaDTO["projeto"];
  total: number;
  concluidas: number;
  realMin: number;
};

export function porProjeto(folhas: FolhaDTO[]): LinhaProjeto[] {
  const mapa = new Map<string, LinhaProjeto>();
  for (const f of folhas) {
    const l = mapa.get(f.projeto.id) ?? { projeto: f.projeto, total: 0, concluidas: 0, realMin: 0 };
    l.total += 1;
    if (f.status === "concluido") l.concluidas += 1;
    l.realMin += f.tempoGastoMin ?? 0;
    mapa.set(f.projeto.id, l);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}

// ── Matriz de Eisenhower ────────────────────────────────────────────
// Importante = prioridade média/alta. Urgente = atrasada ou prazo ≤ 48h.
export type Quadrante = "fazer" | "agendar" | "delegar" | "eliminar";

const URGENTE_MS = 48 * 60 * 60 * 1000;

function urgente(f: FolhaDTO): boolean {
  if (isAtrasada({ prazo: f.prazo, status: f.status })) return true;
  if (!f.prazo) return false;
  // Prazo rígido encurta a janela de urgência (deadline "duro").
  const janela = f.prazoRigido ? URGENTE_MS * 2 : URGENTE_MS;
  return new Date(f.prazo).getTime() - Date.now() <= janela;
}

function importante(f: FolhaDTO): boolean {
  return f.prioridade !== "baixa";
}

export function eisenhower(folhas: FolhaDTO[]): Record<Quadrante, FolhaDTO[]> {
  const out: Record<Quadrante, FolhaDTO[]> = { fazer: [], agendar: [], delegar: [], eliminar: [] };
  for (const f of folhas) {
    if (f.status === "concluido") continue;
    const u = urgente(f);
    const i = importante(f);
    if (u && i) out.fazer.push(f);
    else if (!u && i) out.agendar.push(f);
    else if (u && !i) out.delegar.push(f);
    else out.eliminar.push(f);
  }
  return out;
}
