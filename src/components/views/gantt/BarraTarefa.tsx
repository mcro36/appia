"use client";

// Barra de uma tarefa na grade do Gantt, posicionada em % dentro da janela.
// Só renderização — a derivação do intervalo é do domínio (`gantt.ts`).
import { percentual, posicao, type Janela, type NoGantt } from "@/lib/gantt";
import { formatarIntervalo, ORIGEM_ESTILO } from "@/lib/gantt-display";

// Largura mínima em px: garante que um marco (início sem duração) ou um bloco
// de 30min continuem clicáveis numa escala de meses.
const LARGURA_MINIMA_PX = 8;

export function BarraTarefa({
  no,
  janela,
  onAbrir,
}: {
  no: NoGantt;
  janela: Janela;
  onAbrir?: (id: string) => void;
}) {
  if (!no.span) return null;

  const { esquerdaPct, larguraPct } = posicao(no.span, janela);
  const estilo = ORIGEM_ESTILO[no.span.origem];
  const ehPai = no.filhos.length > 0;

  // O prazo é COMPROMISSO, desenhado à parte da barra: assim dá para ver quando
  // o período planejado passa do que foi prometido.
  const prazoDentro =
    no.prazo && no.prazo >= janela.de && no.prazo <= janela.ate ? percentual(no.prazo, janela) : null;
  const estourou = no.prazo && no.span.fim > no.prazo && no.status !== "concluido";

  const titulo = [
    no.titulo,
    formatarIntervalo(no.span.inicio, no.span.fim),
    estilo.rotulo,
    no.prazo ? `Prazo: ${formatarIntervalo(no.prazo, no.prazo)}` : null,
    estourou ? "⚠ o período passa do prazo" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div
        role={onAbrir ? "button" : undefined}
        tabIndex={onAbrir ? 0 : undefined}
        onClick={onAbrir ? () => onAbrir(no.id) : undefined}
        onKeyDown={
          onAbrir
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onAbrir(no.id);
                }
              }
            : undefined
        }
        title={titulo}
        className={`absolute top-1/2 -translate-y-1/2 rounded-[3px] ${estilo.barra} ${
          ehPai ? "h-2" : "h-4"
        } ${onAbrir ? "cursor-pointer hover:brightness-110" : ""} ${
          estourou ? "ring-1 ring-red-500 dark:ring-red-400" : ""
        }`}
        style={{
          left: `${esquerdaPct}%`,
          width: `${larguraPct}%`,
          minWidth: LARGURA_MINIMA_PX,
        }}
      >
        {/* Rótulo dentro da barra só quando há espaço real para ele. */}
        {larguraPct > 12 && !ehPai && (
          <span className="pointer-events-none absolute inset-0 flex items-center truncate px-1.5 text-[10px] font-medium text-white/95">
            {no.titulo}
          </span>
        )}
      </div>

      {/* Marcador de prazo — losango, independente da barra. */}
      {prazoDentro !== null && (
        <div
          title={`Prazo: ${formatarIntervalo(no.prazo!, no.prazo!)}`}
          className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 ${
            estourou ? "bg-red-500 dark:bg-red-400" : "bg-zinc-500 dark:bg-zinc-300"
          }`}
          style={{ left: `${prazoDentro}%` }}
        />
      )}
    </>
  );
}
