import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeEscrever } from "@/lib/contexto";
import { topicoDaWorkspace } from "@/lib/escopo";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/topicos/:id
export async function PATCH(req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id } = await params;
  if (!(await topicoDaWorkspace(id, ctx.workspaceId)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.titulo === "string" && body.titulo.trim()) data.titulo = body.titulo.trim();
  if (typeof body.concluido === "boolean") data.concluido = body.concluido;

  const topico = await prisma.topico.update({ where: { id }, data });
  return NextResponse.json({ id: topico.id, titulo: topico.titulo, concluido: topico.concluido });
}

// DELETE /api/topicos/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id } = await params;
  if (!(await topicoDaWorkspace(id, ctx.workspaceId)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  await prisma.topico.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
