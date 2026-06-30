import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { includeReuniao, mapReuniao } from "@/lib/mapTarefa";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tarefas/:id/reunioes
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const reunioes = await prisma.reuniao.findMany({
    where: { tarefaId: id },
    orderBy: { criadaEm: "asc" },
    include: includeReuniao,
  });
  return NextResponse.json(reunioes.map(mapReuniao));
}

// POST /api/tarefas/:id/reunioes
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const reuniao = await prisma.reuniao.create({
    data: {
      tarefaId: id,
      titulo: typeof body.titulo === "string" ? body.titulo.trim() || null : null,
      dataHora: body.dataHora ? new Date(body.dataHora) : null,
      duracaoMin: typeof body.duracaoMin === "number" ? Math.round(body.duracaoMin) : null,
    },
    include: includeReuniao,
  });
  return NextResponse.json(mapReuniao(reuniao), { status: 201 });
}
