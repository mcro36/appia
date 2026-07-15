import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeEscrever } from "@/lib/contexto";

export async function GET() {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const tags = await prisma.tag.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeEscrever(ctx.papel)) return NextResponse.json({ erro: "Somente leitura neste espaço." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.nome !== "string" || !body.nome.trim())
    return NextResponse.json({ erro: "Nome é obrigatório." }, { status: 400 });

  try {
    const tag = await prisma.tag.create({
      data: { nome: body.nome.trim(), cor: body.cor ?? "#6366f1", workspaceId: ctx.workspaceId },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Tag já existe." }, { status: 409 });
  }
}
