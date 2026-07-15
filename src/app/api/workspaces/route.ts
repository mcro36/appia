import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto } from "@/lib/contexto";

// GET /api/workspaces — lista as workspaces do usuário + qual está ativa.
export async function GET() {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const membros = await prisma.membro.findMany({
    where: { usuarioId: ctx.usuarioId },
    orderBy: { criadoEm: "asc" },
    include: { workspace: { select: { id: true, nome: true } } },
  });

  return NextResponse.json({
    ativa: ctx.workspaceId,
    workspaces: membros.map((m) => ({ id: m.workspaceId, nome: m.workspace.nome, papel: m.papel })),
  });
}
