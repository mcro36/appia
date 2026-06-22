"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type Event,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { isAtrasada, type TarefaDTO } from "@/lib/tarefas";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: ptBR }),
  getDay,
  locales: { "pt-BR": ptBR },
});

const mensagens = {
  today: "Hoje",
  previous: "Anterior",
  next: "Próximo",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Tarefa",
  noEventsInRange: "Nenhuma tarefa com prazo neste período.",
  showMore: (n: number) => `+${n} mais`,
};

type TipoEvento = "tarefa" | "subtarefa";
type EventoTarefa = Event & { resource: TarefaDTO; tipo: TipoEvento };

export function CalendarioTarefas({
  tarefas,
  onSelecionar,
  compacto = false,
}: {
  tarefas: TarefaDTO[];
  onSelecionar?: (t: TarefaDTO) => void;
  compacto?: boolean;
}) {
  // No PWA/mobile a visão de mês fica ilegível: começa em Agenda (lista vertical).
  const [view, setView] = useState<View>(compacto ? Views.AGENDA : Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());

  const viewsDisponiveis = (compacto
    ? [Views.AGENDA, Views.DAY]
    : [Views.MONTH, Views.WEEK, Views.DAY]) as View[];

  const eventos = useMemo<EventoTarefa[]>(() => {
    const evs: EventoTarefa[] = [];

    for (const t of tarefas) {
      // Tarefa principal: usa prazo como ponto de ancoragem
      if (t.prazo) {
        const inicio = new Date(t.prazo);
        evs.push({
          title: t.titulo,
          start: inicio,
          end: new Date(inicio.getTime() + 60 * 60 * 1000),
          resource: t,
          tipo: "tarefa",
        });
      }

      // Subtarefas agendadas: usa dataInicio + duracaoMin
      for (const sub of t.tarefas) {
        if (!sub.dataInicio) continue;
        const inicio = new Date(sub.dataInicio);
        const durMs = (sub.duracaoMin ?? 60) * 60 * 1000;
        // Monta um TarefaDTO-like para o resource
        const subDTO = {
          ...t,
          id: sub.id,
          titulo: `↳ ${sub.titulo}`,
          status: sub.status,
          prazo: sub.prazo,
        };
        evs.push({
          title: `↳ ${sub.titulo}`,
          start: inicio,
          end: new Date(inicio.getTime() + durMs),
          resource: subDTO as TarefaDTO,
          tipo: "subtarefa",
        });
      }
    }

    return evs;
  }, [tarefas]);

  function corDoEvento(evento: EventoTarefa) {
    const t = evento.resource;
    if (evento.tipo === "subtarefa") {
      // Subtarefas: tom mais claro/listrado para distinguir
      let bg = "#818cf8"; // indigo claro
      if (t.status === "concluido") bg = "#6ee7b7"; // verde claro
      return { style: { backgroundColor: bg, border: "none", borderRadius: 4, opacity: 0.9 } };
    }
    let bg = "#3b82f6";
    if (t.status === "concluido") bg = "#10b981";
    else if (t.status === "a_fazer") bg = "#71717a";
    if (isAtrasada(t)) bg = "#ef4444";
    return { style: { backgroundColor: bg, border: "none", borderRadius: 6 } };
  }

  return (
    <div className={`rounded-xl border border-black/10 bg-white dark:border-white/10 ${compacto ? "p-2" : "p-4"}`}>
      <div style={{ height: compacto ? "calc(100dvh - 9rem)" : "70vh" }}>
        <Calendar
          localizer={localizer}
          culture="pt-BR"
          events={eventos}
          messages={mensagens}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={viewsDisponiveis}
          length={compacto ? 60 : 30}
          popup
          eventPropGetter={corDoEvento}
          onSelectEvent={(e) => onSelecionar?.((e as EventoTarefa).resource)}
          startAccessor="start"
          endAccessor="end"
        />
      </div>
    </div>
  );
}
