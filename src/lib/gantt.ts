// Domínio do Gantt — puro: sem React, sem Tailwind, sem rótulos (estes ficam em
// `gantt-display.ts`). Compartilhado entre client e server.
//
// DECISÃO DE MODELO: o Gantt NÃO tem campos próprios de início/fim. O intervalo
// de cada barra é DERIVADO do que já existe (`dataInicio`, `duracaoMin`,
// `prazo`, `concluidaEm`, `criadaEm`). Consequência aceita: tarefa sem data
// nenhuma não vira barra — aparece como "sem data" na coluna da esquerda, o que
// torna a visão um localizador de buraco de planejamento.
import {
  addDays, addMinutes, addMonths, differenceInMilliseconds,
  startOfDay, startOfMonth, startOfWeek,
} from "date-fns";
import type { Prioridade, Status, Tipo } from "@/lib/tarefas";

export const ESCALAS = ["dia", "semana", "mes"] as const;
export type Escala = (typeof ESCALAS)[number];

/**
 * De onde veio o intervalo. A UI usa isto para diferenciar o traço: um plano
 * explícito não deve parecer igual a um palpite derivado da data de criação.
 */
export type OrigemSpan =
  | "planejado" // dataInicio + prazo — intervalo explícito, o caso ideal
  | "realizado" // concluída — do início conhecido até concluidaEm (fato consumado)
  | "execucao" // dataInicio + duracaoMin — bloco de trabalho do planejador (intradiário)
  | "ponto" // só dataInicio — marco sem duração
  | "ate_prazo" // só prazo — janela disponível desde a criação (inferido, mais fraco)
  | "rollup"; // pai — min/max dos descendentes

export type Span = { inicio: Date; fim: Date; origem: OrigemSpan };

/** Entrada achatada vinda da API (um nó da árvore do projeto). */
export type NoGanttDTO = {
  id: string;
  titulo: string;
  tipo: Tipo;
  status: Status;
  prioridade: Prioridade;
  tarefaPaiId: string | null;
  prazo: string | null;
  dataInicio: string | null;
  duracaoMin: number | null;
  concluidaEm: string | null;
  criadaEm: string;
  editavel: boolean;
  assignee: { id: string; nome: string } | null;
};

/** Nó já hierarquizado e com intervalo resolvido. */
export type NoGantt = {
  id: string;
  titulo: string;
  tipo: Tipo;
  status: Status;
  prioridade: Prioridade;
  profundidade: number;
  editavel: boolean;
  assignee: { id: string; nome: string } | null;
  /** Compromisso — desenhado como marcador, nunca como fim da barra. */
  prazo: Date | null;
  /** `null` quando não há data nenhuma de onde derivar. */
  span: Span | null;
  filhos: NoGantt[];
};

export type Janela = { de: Date; ate: Date };

// ── Derivação do intervalo ─────────────────────────────────────────────

const data = (v: string | null): Date | null => (v ? new Date(v) : null);

/**
 * Intervalo de uma FOLHA, na ordem do sinal mais forte para o mais fraco.
 * Retorna `null` quando a tarefa não tem data alguma.
 */
export function spanDeFolha(t: NoGanttDTO): Span | null {
  const inicio = data(t.dataInicio);
  const prazo = data(t.prazo);
  const concluida = data(t.concluidaEm);

  // 1. Intervalo explícito: começa aqui, tem que acabar até ali.
  if (inicio && prazo && prazo > inicio) return { inicio, fim: prazo, origem: "planejado" };

  // 2. Concluída: o fim é fato. O começo é o conhecido, ou a criação.
  if (concluida) {
    const de = inicio ?? new Date(t.criadaEm);
    return de < concluida
      ? { inicio: de, fim: concluida, origem: "realizado" }
      : { inicio: concluida, fim: concluida, origem: "ponto" };
  }

  // 3. Bloco de execução do planejador diário (dura minutos, não dias).
  if (inicio && t.duracaoMin) return { inicio, fim: addMinutes(inicio, t.duracaoMin), origem: "execucao" };

  // 4. Só sabemos quando começa.
  if (inicio) return { inicio, fim: inicio, origem: "ponto" };

  // 5. Só sabemos o compromisso: mostra a janela disponível até ele.
  if (prazo) return { inicio: new Date(t.criadaEm), fim: prazo, origem: "ate_prazo" };

  return null;
}

/** Menor intervalo que contém todos os informados (`null` se não houver nenhum). */
export function unirSpans(spans: (Span | null)[], origem: OrigemSpan = "rollup"): Span | null {
  const validos = spans.filter((s): s is Span => s !== null);
  if (validos.length === 0) return null;
  if (validos.length === 1) return validos[0];
  let inicio = validos[0].inicio;
  let fim = validos[0].fim;
  for (const s of validos) {
    if (s.inicio < inicio) inicio = s.inicio;
    if (s.fim > fim) fim = s.fim;
  }
  return { inicio, fim, origem };
}

// ── Montagem da árvore ─────────────────────────────────────────────────

/**
 * Lista achatada → árvore, com o intervalo de cada nó resolvido de baixo para
 * cima: folha deriva dos próprios campos, pai é o rollup dos descendentes (e do
 * que ele mesmo tiver). Nós órfãos (pai fora do conjunto) viram raiz, para que
 * nada suma da tela por inconsistência de dados.
 */
export function montarArvore(linhas: NoGanttDTO[], raizId: string): NoGantt | null {
  const porPai = new Map<string | null, NoGanttDTO[]>();
  const ids = new Set(linhas.map((l) => l.id));
  for (const l of linhas) {
    // Pai ausente do conjunto → trata como filho da raiz.
    const chave = l.id === raizId ? null : l.tarefaPaiId && ids.has(l.tarefaPaiId) ? l.tarefaPaiId : raizId;
    const lista = porPai.get(chave) ?? [];
    lista.push(l);
    porPai.set(chave, lista);
  }

  const raiz = linhas.find((l) => l.id === raizId);
  if (!raiz) return null;

  const construir = (dto: NoGanttDTO, profundidade: number): NoGantt => {
    const filhos = (porPai.get(dto.id) ?? [])
      .filter((f) => f.id !== dto.id)
      .map((f) => construir(f, profundidade + 1));
    const proprio = spanDeFolha(dto);
    // Pai: o rollup manda, mas o intervalo próprio entra na união (um projeto
    // pode ter prazo mesmo que nenhuma filha tenha).
    const span = filhos.length ? unirSpans([proprio, ...filhos.map((f) => f.span)]) : proprio;
    return {
      id: dto.id,
      titulo: dto.titulo,
      tipo: dto.tipo,
      status: dto.status,
      prioridade: dto.prioridade,
      profundidade,
      editavel: dto.editavel,
      assignee: dto.assignee,
      prazo: data(dto.prazo),
      span,
      filhos,
    };
  };

  return construir(raiz, 0);
}

/** Percorre a árvore em profundidade, respeitando os nós recolhidos. */
export function achatarVisiveis(no: NoGantt, recolhidos: ReadonlySet<string>): NoGantt[] {
  const out: NoGantt[] = [no];
  if (!recolhidos.has(no.id)) for (const f of no.filhos) out.push(...achatarVisiveis(f, recolhidos));
  return out;
}

/** Quantas tarefas da árvore não têm data alguma (métrica de buraco de plano). */
export function contarSemData(no: NoGantt): number {
  return (no.span ? 0 : 1) + no.filhos.reduce((n, f) => n + contarSemData(f), 0);
}

// ── Escala e posicionamento ────────────────────────────────────────────

/** Início da coluna que contém `d`, na escala dada. */
function inicioDaColuna(d: Date, escala: Escala): Date {
  if (escala === "dia") return startOfDay(d);
  if (escala === "semana") return startOfWeek(d, { weekStartsOn: 1 });
  return startOfMonth(d);
}

/**
 * Início da coluna SEGUINTE — fronteira superior exclusiva. Precisa ser o
 * instante de início da próxima coluna (e não o último da atual) para que as
 * colunas se encostem e os percentuais não acumulem folga.
 */
function fimDaColuna(d: Date, escala: Escala): Date {
  if (escala === "dia") return addDays(startOfDay(d), 1);
  if (escala === "semana") return addDays(startOfWeek(d, { weekStartsOn: 1 }), 7);
  return addMonths(startOfMonth(d), 1);
}

/**
 * Janela de tempo que a grade cobre: o intervalo dos dados, alargado até as
 * bordas da escala e com uma coluna de folga de cada lado. Sem dados, cai numa
 * janela em volta de hoje para que a grade ainda apareça.
 */
export function janelaDe(spans: (Span | null)[], escala: Escala, hoje = new Date()): Janela {
  const total = unirSpans(spans, "rollup");
  const base: Span = total ?? { inicio: hoje, fim: hoje, origem: "ponto" };
  const passo = (d: Date, n: number) =>
    escala === "mes" ? addMonths(d, n) : addDays(d, n * (escala === "semana" ? 7 : 1));
  const de = inicioDaColuna(passo(base.inicio, -1), escala);
  const ate = fimDaColuna(passo(base.fim, 1), escala);
  // Garante largura mínima utilizável quando tudo cai no mesmo ponto.
  const minimo = escala === "dia" ? 7 : escala === "semana" ? 4 : 3;
  const colunas = contarColunas(de, ate, escala);
  return colunas >= minimo ? { de, ate } : { de, ate: fimDaColuna(passo(de, minimo - 1), escala) };
}

function contarColunas(de: Date, ate: Date, escala: Escala): number {
  let n = 0;
  let cursor = de;
  while (cursor < ate && n < 400) {
    cursor = escala === "mes" ? addMonths(cursor, 1) : addDays(cursor, escala === "semana" ? 7 : 1);
    n++;
  }
  return n;
}

/** Colunas da grade: limites em Date (os rótulos são apresentação). */
export function colunasDe(janela: Janela, escala: Escala): { inicio: Date; fim: Date }[] {
  const out: { inicio: Date; fim: Date }[] = [];
  let cursor = inicioDaColuna(janela.de, escala);
  while (cursor < janela.ate && out.length < 400) {
    const proxima = escala === "mes" ? addMonths(cursor, 1) : addDays(cursor, escala === "semana" ? 7 : 1);
    out.push({ inicio: cursor, fim: proxima });
    cursor = proxima;
  }
  return out;
}

/**
 * Posição de um instante na janela, em % da largura. Fora da janela é fixado
 * nas bordas — a barra não vaza da grade.
 */
export function percentual(instante: Date, janela: Janela): number {
  const total = differenceInMilliseconds(janela.ate, janela.de);
  if (total <= 0) return 0;
  const p = (differenceInMilliseconds(instante, janela.de) / total) * 100;
  return Math.min(100, Math.max(0, p));
}

/** Posição e largura de uma barra, em % — a largura mínima é da apresentação. */
export function posicao(span: Span, janela: Janela): { esquerdaPct: number; larguraPct: number } {
  const esquerdaPct = percentual(span.inicio, janela);
  const larguraPct = Math.max(0, percentual(span.fim, janela) - esquerdaPct);
  return { esquerdaPct, larguraPct };
}
