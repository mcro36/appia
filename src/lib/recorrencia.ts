import { proximaOcorrencia } from "@/lib/datas";

type EstadoRecorrencia = {
  recorrencia: string;
  prazo: Date | null;
  recorrenciaAte: Date | null;
};

type DadosConclusao = {
  status: string;
  concluidaEm: Date | null;
  prazo?: Date;
  dataInicio?: null;
};

/**
 * Campos a aplicar quando uma tarefa é concluída. Se ela for recorrente
 * (e ainda dentro de `recorrenciaAte`), em vez de encerrar, rola para a próxima
 * ocorrência: volta a "a fazer" com o prazo avançado e sem horário (hábito).
 * Caso contrário, conclui de fato carimbando `concluidaEm`.
 *
 * Centraliza a regra usada pela rota PATCH e pelas ações do chat (Gemini).
 */
export function dadosAoConcluir(atual: EstadoRecorrencia): DadosConclusao {
  if (atual.recorrencia && atual.recorrencia !== "none") {
    const agora = new Date();
    const base = atual.prazo && atual.prazo > agora ? atual.prazo : agora;
    const prox = proximaOcorrencia(base, atual.recorrencia);
    if (!atual.recorrenciaAte || prox <= atual.recorrenciaAte) {
      return { status: "a_fazer", concluidaEm: null, prazo: prox, dataInicio: null };
    }
  }
  return { status: "concluido", concluidaEm: new Date() };
}
