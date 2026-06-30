// Utilitários de data/duração — formatação para inputs e exibição.
// Centralizados aqui para evitar duplicação entre componentes.

/**
 * Converte um ISO (ou null) para o formato aceito por <input type="datetime-local">,
 * usando o horário LOCAL do navegador. Retorna "" quando não há data.
 */
export function dataParaInputLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Formata uma duração em minutos de forma legível: 45min, 1h, 1h30min. */
export function formatarDuracao(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}min` : `${h}h`;
}

/** Minutos desde a meia-noite → "HH:mm" (para inputs type="time"). */
export function minutosParaHHMM(min: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/** "HH:mm" → minutos desde a meia-noite (null se inválido). */
export function hhmmParaMinutos(valor: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(valor);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Próxima ocorrência de uma recorrência a partir de uma data base. */
export function proximaOcorrencia(base: Date, recorrencia: string): Date {
  const d = new Date(base);
  if (recorrencia === "diaria") d.setDate(d.getDate() + 1);
  else if (recorrencia === "semanal") d.setDate(d.getDate() + 7);
  else if (recorrencia === "mensal") d.setMonth(d.getMonth() + 1);
  return d;
}
