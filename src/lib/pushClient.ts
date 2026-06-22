"use client";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function pushSuportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function base64ParaUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Garante a inscrição de push e a envia ao servidor.
 * Pressupõe que a permissão de notificação já foi concedida.
 */
export async function assinarPush(): Promise<boolean> {
  if (!pushSuportado() || !VAPID_PUBLIC) return false;

  const registration = await navigator.serviceWorker.ready;
  let sub = await registration.pushManager.getSubscription();

  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ParaUint8Array(VAPID_PUBLIC),
    });
  }

  const resp = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });

  return resp.ok;
}

/** Pede permissão (precisa vir de um gesto do usuário) e assina o push. */
export async function ativarNotificacoes(): Promise<NotificationPermission> {
  if (!pushSuportado()) return "denied";
  const permissao = await Notification.requestPermission();
  if (permissao === "granted") {
    await assinarPush().catch(() => {});
  }
  return permissao;
}
