import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeEscrever } from "@/lib/contexto";
import { reuniaoVisivel } from "@/lib/visibilidade";
import { includeReuniao, mapReuniao } from "@/lib/mapTarefa";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/reunioes/:id
export async function PATCH(req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id } = await params;
  if (!(await reuniaoVisivel(id, ctx)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if ("titulo" in body) data.titulo = typeof body.titulo === "string" ? body.titulo.trim() || null : null;
  if ("dataHora" in body) data.dataHora = body.dataHora ? new Date(body.dataHora) : null;
  if ("duracaoMin" in body) data.duracaoMin = typeof body.duracaoMin === "number" ? Math.round(body.duracaoMin) : null;

  const reuniao = await prisma.reuniao.update({
    where: { id },
    data,
    include: includeReuniao,
  });
  return NextResponse.json(mapReuniao(reuniao));
}

// DELETE /api/reunioes/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const { id } = await params;
  if (!(await reuniaoVisivel(id, ctx)))
    return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  await prisma.reuniao.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
