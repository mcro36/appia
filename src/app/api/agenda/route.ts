import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { includeTarefaDetalhe, flattenFolhas } from "@/lib/mapTarefa";

// GET /api/agenda — folhas agendáveis + reuniões (compromissos fixos) + config.
export async function GET() {
  const [raizes, reunioes, config] = await Promise.all([
    prisma.tarefa.findMany({
      where: { tarefaPaiId: null },
      include: includeTarefaDetalhe,
      orderBy: { criadaEm: "asc" },
    }),
    prisma.reuniao.findMany({
      where: { dataHora: { not: null } },
      select: { id: true, titulo: true, dataHora: true, duracaoMin: true },
    }),
    prisma.configuracao.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
  ]);

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
