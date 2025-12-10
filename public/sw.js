/* eslint-disable no-restricted-globals */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.title || "Nova obavestavanje";
  const options = {
    body: payload.body || "",
    data: payload.data || {},
    tag: payload.tag || undefined
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) || client.url === self.location.origin + url) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
