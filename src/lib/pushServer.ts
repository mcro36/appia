import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:exemplo@appia.app";

let configurado = false;

/** Configura as credenciais VAPID uma única vez. Lança se as chaves faltarem. */
export function configurarWebPush() {
  if (configurado) return;
  if (!publicKey || !privateKey) {
    throw new Error("Chaves VAPID ausentes (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configurado = true;
}

export { webpush };
