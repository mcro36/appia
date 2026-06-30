import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { includeTarefaDetalhe, flattenFolhas } from "@/lib/mapTarefa";

// GET /api/agenda — folhas agendáveis + reuniões (compromissos fixos) + config.
// Queries sequenciais de propósito: o pooler do Supabase usa connection_limit=1,
// então paralelizar (Promise.all) esgota o pool e dá timeout (P2024).
export async function GET() {
  const raizes = await prisma.tarefa.findMany({
    where: { tarefaPaiId: null },
    include: includeTarefaDetalhe,
    orderBy: { criadaEm: "asc" },
  });
  const reunioes = await prisma.reuniao.findMany({
    where: { dataHora: { not: null } },
    select: { id: true, titulo: true, dataHora: true, duracaoMin: true },
  });
  const config = await prisma.configuracao.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

  return NextResponse.json({
    folhas: flattenFolhas(raizes),
    reunioes,
    config: {
      expedienteInicioMin: config.expedienteInicioMin,
      expedienteFimMin: config.expedienteFimMin,
      almocoInicioMin: config.almocoInicioMin,
      almocoFimMin: config.almocoFimMin,
      duracaoPadraoMin: config.duracaoPadraoMin,
      bufferMin: config.bufferMin,
    },
  });
}
