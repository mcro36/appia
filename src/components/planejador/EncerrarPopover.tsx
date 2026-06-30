"use client";

// Ritual de encerramento do dia: resumo de concluídas/pendentes e ação de
// mover as tarefas em andamento não concluídas para o dia seguinte.
export function EncerrarPopover({
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
