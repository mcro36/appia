// Lógica de lembretes/alertas derivada do prazo das tarefas (browser-only no MVP)
import type { TarefaDTO } from "@/lib/tarefas";

export type NivelAlerta = "atrasada" | "vencendo";

const DIA_MS = 24 * 60 * 60 * 1000;
export const JANELA_VENCENDO_MS = DIA_MS; // "vence em breve" = próximas 24h
export const JANELA_NOTIFICAR_MS = 60 * 60 * 1000; // notifica push quando faltam ≤ 60min

/** Classifica uma tarefa quanto ao prazo. Retorna null se não há alerta. */
export function nivelAlerta(
  t: Pick<TarefaDTO, "prazo" | "status">,
  agora: number = Date.now(),
): NivelAlerta | null {
  if (!t.prazo || t.status === "concluido") return null;
  const prazo = new Date(t.prazo).getTime();
  if (prazo < agora) return "atrasada";
  if (prazo - agora <= JANELA_VENCENDO_MS) return "vencendo";
  return null;
}

export type Alerta = { tarefa: TarefaDTO; nivel: NivelAlerta };

/** Lista de alertas atuais, atrasadas primeiro e depois por prazo mais próximo. */
export function alertasAtuais(tarefas: TarefaDTO[], agora: number = Date.now()): Alerta[] {
  return tarefas
    .map((tarefa) => ({ tarefa, nivel: nivelAlerta(tarefa, agora) }))
    .filter((a): a is Alerta => a.nivel !== null)
    .sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel === "atrasada" ? -1 : 1;
      const pa = new Date(a.tarefa.prazo as string).getTime();
      const pb = new Date(b.tarefa.prazo as string).getTime();
      return pa - pb;
    });
}
