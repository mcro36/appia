import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeEscrever } from "@/lib/contexto";
import { tarefaDaWorkspace } from "@/lib/escopo";

type Ctx = { params: Promise<{ id: string }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAtividade(a: any, usuarioId: string) {
  return {
    id: a.id,
    tipo: a.tipo,
    texto: a.texto ?? null,
    criadoEm: a.criadoEm,
    usuario: { id: a.usuario.id, nome: a.usuario.nome },
    meu: a.usuarioId === usuarioId,
  };
}

// GET /api/tarefas/:id/atividade — timeline (comentários + eventos) da tarefa.
export async function GET(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  if (!(await tarefaDaWorkspace(id, ctx.workspaceId)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });

  const itens = await prisma.atividade.findMany({
    where: { tarefaId: id },
    orderBy: { criadoEm: "asc" },
    include: { usuario: { select: { id: true, nome: true } } },
  });
  return NextResponse.json(itens.map((a) => mapAtividade(a, ctx.usuarioId)));
}

// POST /api/tarefas/:id/atividade — adiciona um comentário.
export async function POST(req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id } = await params;
  if (!(await tarefaDaWorkspace(id, ctx.workspaceId)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const texto = typeof body?.texto === "string" ? body.texto.trim() : "";
  if (!texto) return NextResponse.json({ erro: "Comentário vazio." }, { status: 400 });

  const a = await prisma.atividade.create({
    data: { workspaceId: ctx.workspaceId, usuarioId: ctx.usuarioId, tarefaId: id, tipo: "comentario", texto },
    include: { usuario: { select: { id: true, nome: true } } },
  });
  return NextResponse.json(mapAtividade(a, ctx.usuarioId), { status: 201 });
}
