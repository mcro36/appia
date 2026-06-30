import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { includeTarefaDetalhe, flattenFolhas } from "@/lib/mapTarefa";

// GET /api/agenda — folhas agendáveis (achatadas) para o planejador diário.
export async function GET() {
  const raizes = await prisma.tarefa.findMany({
    where: { tarefaPaiId: null },
    include: includeTarefaDetalhe,
    orderBy: { criadaEm: "asc" },
  });
  return NextResponse.json(flattenFolhas(raizes));
}
