import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.nome !== "string" || !body.nome.trim())
    return NextResponse.json({ erro: "Nome é obrigatório." }, { status: 400 });

  try {
    const tag = await prisma.tag.create({
      data: { nome: body.nome.trim(), cor: body.cor ?? "#6366f1" },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Tag já existe." }, { status: 409 });
  }
}
