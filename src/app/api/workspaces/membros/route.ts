import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto } from "@/lib/contexto";

// GET /api/workspaces/membros — membros da workspace ativa (para atribuir responsável).
export async function GET() {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const membros = await prisma.membro.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { criadoEm: "asc" },
    include: { usuario: { select: { id: true, nome: true, email: true } } },
  });

  return NextResponse.json(
    membros.map((m) => ({ id: m.usuario.id, nome: m.usuario.nome, email: m.usuario.email, papel: m.papel })),
  );
}
