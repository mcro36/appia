import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerContexto, podeAdministrar } from "@/lib/contexto";

type Ctx = { params: Promise<{ usuarioId: string }> };
const PAPEIS = new Set(["owner", "admin", "membro", "leitor"]);

// PATCH /api/workspaces/membros/:usuarioId — muda o papel de um membro.
export async function PATCH(req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeAdministrar(ctx.papel)) return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const { usuarioId } = await params;
  const body = await req.json().catch(() => null);
  const papel = typeof body?.papel === "string" && PAPEIS.has(body.papel) ? body.papel : null;
  if (!papel) return NextResponse.json({ erro: "Papel inválido." }, { status: 400 });

  const alvo = await prisma.membro.findUnique({
    where: { usuarioId_workspaceId: { usuarioId, workspaceId: ctx.workspaceId } },
  });
  if (!alvo) return NextResponse.json({ erro: "Membro não encontrado." }, { status: 404 });

  // Só um owner pode conceder ou revogar o papel de owner.
  if ((papel === "owner" || alvo.papel === "owner") && ctx.papel !== "owner")
    return NextResponse.json({ erro: "Apenas um dono pode gerir donos." }, { status: 403 });

  // Nunca deixar o espaço sem dono.
  if (alvo.papel === "owner" && papel !== "owner") {
    const donos = await prisma.membro.count({ where: { workspaceId: ctx.workspaceId, papel: "owner" } });
    if (donos <= 1) return NextResponse.json({ erro: "O espaço precisa de ao menos um dono." }, { status: 400 });
  }

  await prisma.membro.update({
    where: { usuarioId_workspaceId: { usuarioId, workspaceId: ctx.workspaceId } },
    data: { papel },
  });
  return NextResponse.json({ ok: true, papel });
}

// DELETE /api/workspaces/membros/:usuarioId — remove um membro do espaço.
export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await lerContexto();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!podeAdministrar(ctx.papel)) return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const { usuarioId } = await params;
  const alvo = await prisma.membro.findUnique({
    where: { usuarioId_workspaceId: { usuarioId, workspaceId: ctx.workspaceId } },
  });
  if (!alvo) return NextResponse.json({ erro: "Membro não encontrado." }, { status: 404 });

  if (alvo.papel === "owner") {
    if (ctx.papel !== "owner")
      return NextResponse.json({ erro: "Apenas um dono pode remover um dono." }, { status: 403 });
    const donos = await prisma.membro.count({ where: { workspaceId: ctx.workspaceId, papel: "owner" } });
    if (donos <= 1) return NextResponse.json({ erro: "O espaço precisa de ao menos um dono." }, { status: 400 });
  }

  // Sequencial (pooler): zera as atribuições do removido neste espaço e tira a membership.
  await prisma.tarefa.updateMany({
    where: { workspaceId: ctx.workspaceId, assigneeId: usuarioId },
    data: { assigneeId: null },
  });
  await prisma.membro.delete({
    where: { usuarioId_workspaceId: { usuarioId, workspaceId: ctx.workspaceId } },
  });
  return NextResponse.json({ ok: true });
}
