/**
 * Push handlers, imported into the generated service worker.
 *
 * This lives as a static file rather than inside a custom service worker
 * because the app builds its worker with vite-plugin-pwa's `generateSW`
 * strategy, which owns the whole file — switching to `injectManifest` to add
 * two event listeners would mean taking over precaching, navigation fallback
 * and update handling by hand. `workbox.importScripts` pulls this in instead,
 * so the generated worker keeps doing its job and this only adds to it.
 *
 * Everything here runs with no page open and no application state. There is no
 * React, no router, no auth context — only what the push payload carries.
 */

self.addEventListener("push", (event) => {
  /* A push with no data is a "something changed" ping. The spec allows it and
     some services send one when a payload fails to decrypt, so it must not
     throw — but there is nothing useful to show, so it is dropped rather than
     surfaced as an empty notification. */
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "FleetWise", body: event.data.text() };
  }

  const title = payload.title || "FleetWise";

  const options = {
    body: payload.body || "",
    icon: "/icon/android-chrome-192x192.png",
    /* The small monochrome glyph in the Android status bar. Falls back to the
       icon where a platform does not support it. */
    badge: "/icon/favicon-32x32.png",
    /* Notifications about the same thing replace each other rather than
       stacking — five warnings about one lapsing permit is one warning. */
    tag: payload.tag || "fleetwise",
    renotify: Boolean(payload.tag),
    data: {
      url: payload.url || "/",
      type: payload.type,
      entityId: payload.entityId,
    },
    /* Critical alerts stay on screen until acknowledged. An expired permit or
       an overdue brake service is not something to let scroll past while the
       phone is in a pocket. */
    requireInteraction: payload.severity === "critical",
    timestamp: Date.now(),
  };

  /* `waitUntil` keeps the worker alive until the notification is shown. Without
     it the browser is entitled to kill the worker first, and — because the
     push was already accepted — some platforms then display their own generic
     "site updated in the background" notice instead. */
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      /* Reuse an open tab rather than opening a second one. Someone who
         already has the app open and taps a notification expects to be taken
         to the page, not handed a duplicate window. */
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          /* Navigating a focused client is not universally supported, so the
             message is the fallback the app listens for. */
          if ("navigate" in client) {
            try {
              await client.navigate(target);
              return;
            } catch {
              /* fall through to postMessage */
            }
          }
          client.postMessage({ type: "notification-click", url: target });
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(target);
      }
    })()
  );
});
