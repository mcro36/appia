import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/push/subscribe — registra (ou atualiza) uma inscrição de push do navegador
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const endpoint: unknown = body?.endpoint;
  const p256dh: unknown = body?.keys?.p256dh;
  const auth: unknown = body?.keys?.auth;

  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
    return NextResponse.json({ erro: "Inscrição inválida." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth },
    update: { p256dh, auth },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// DELETE /api/push/subscribe — remove a inscrição (ao desativar notificações)
export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  const endpoint: unknown = body?.endpoint;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ erro: "endpoint obrigatório." }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
