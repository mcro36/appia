import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto } from "@/lib/contexto";
import { includeTarefaDetalhe, flattenFolhas } from "@/lib/mapTarefa";

// GET /api/agenda — folhas agendáveis + reuniões (compromissos fixos) + config.
// Queries sequenciais de propósito: o pooler do Supabase usa connection_limit=1,
// então paralelizar (Promise.all) esgota o pool e dá timeout (P2024).
export async function GET() {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const raizes = await prisma.tarefa.findMany({
    where: { tarefaPaiId: null, workspaceId: ctx.workspaceId },
    include: includeTarefaDetalhe,
    orderBy: { criadaEm: "asc" },
  });
  const reunioes = await prisma.reuniao.findMany({
    where: { dataHora: { not: null }, tarefa: { workspaceId: ctx.workspaceId } },
    select: { id: true, titulo: true, dataHora: true, duracaoMin: true },
  });
  const config = await prisma.configuracao.upsert({
    where: { usuarioId: ctx.usuarioId },
    create: { usuarioId: ctx.usuarioId },
    update: {},
  });

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
