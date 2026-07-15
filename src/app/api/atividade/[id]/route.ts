import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeAdministrar } from "@/lib/contexto";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/atividade/:id — remove um comentário (autor ou admin/owner).
// Eventos do sistema não são removíveis.
export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const a = await prisma.atividade.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!a) return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
  if (a.tipo !== "comentario")
    return NextResponse.json({ erro: "Só comentários podem ser removidos." }, { status: 400 });
  if (a.usuarioId !== ctx.usuarioId && !podeAdministrar(ctx.papel))
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  await prisma.atividade.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
