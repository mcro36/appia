/* eslint-disable */
// Worker customizado injetado no service worker gerado pelo next-pwa.
// Responsável por exibir notificações push e tratar o clique nelas.

self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch (_e) {
    dados = { title: "APPIA", body: event.data ? event.data.text() : "" };
  }

  const titulo = dados.title || "APPIA";
  const opcoes = {
    body: dados.body || "",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: dados.tag,
    data: { url: dados.url || "/" },
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ("focus" in cliente) return cliente.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
