import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeEscrever } from "@/lib/contexto";
import { tarefaDaWorkspace } from "@/lib/escopo";
import { includeReuniao, mapReuniao } from "@/lib/mapTarefa";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tarefas/:id/reunioes
export async function GET(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  if (!(await tarefaDaWorkspace(id, ctx.workspaceId)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  const reunioes = await prisma.reuniao.findMany({
    where: { tarefaId: id },
    orderBy: { criadaEm: "asc" },
    include: includeReuniao,
  });
  return NextResponse.json(reunioes.map(mapReuniao));
}

// POST /api/tarefas/:id/reunioes
export async function POST(req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id } = await params;
  if (!(await tarefaDaWorkspace(id, ctx.workspaceId)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
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
