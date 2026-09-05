import api from "../api/axios";

/**
 * Web Push subscription, from the browser's side.
 *
 * The chain here has a lot of links and every one of them can fail silently:
 * the browser may not support push, the page may not be secure, the service
 * worker may not be controlling the page yet, the user may have denied
 * permission in a previous session, the server may have no VAPID keys. So this
 * module reports a *reason* rather than a boolean — "not supported on iOS
 * unless installed to the home screen" and "you blocked notifications" need
 * very different things said to the user, and a bare `false` says neither.
 */

export type PushState =
  | "unsupported"
  | "server-disabled"
  | "denied"
  | "unsubscribed"
  | "subscribed";

export interface PushStatus {
  state: PushState;
  /** Something short and true to show the user. */
  reason: string;
}

/**
 * The VAPID key arrives as base64url text and the subscribe call wants raw
 * bytes. `atob` needs standard base64, hence the padding and the two
 * character swaps.
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
};

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

/** Where things currently stand, without asking for anything. */
export const getPushStatus = async (): Promise<PushStatus> => {
  if (!isPushSupported()) {
    return {
      state: "unsupported",
      /* Worth naming: on iOS this is the single most common cause, and the
         fix — Share, then Add to Home Screen — is not discoverable. */
      reason:
        "This browser cannot receive background notifications. On iPhone, add FleetWise to your Home Screen first.",
    };
  }

  if (Notification.permission === "denied") {
    return {
      state: "denied",
      reason:
        "Notifications are blocked for this site. Allow them in your browser's site settings to turn them back on.",
    };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    return existing
      ? { state: "subscribed", reason: "This device will receive alerts." }
      : { state: "unsubscribed", reason: "This device is not receiving alerts yet." };
  } catch {
    return { state: "unsubscribed", reason: "This device is not receiving alerts yet." };
  }
};

/**
 * Subscribe this browser.
 *
 * Registers with the browser's push service first and only then tells our
 * server, so a row is never stored for a subscription that does not exist.
 * `userVisibleOnly` is required by every implementation: it is the promise
 * that a push always results in something the user can see, and it is why
 * push cannot be used for silent tracking.
 */
export const subscribeToPush = async (): Promise<PushStatus> => {
  if (!isPushSupported()) return getPushStatus();

  const config = (await api.get("/api/push/config")) as unknown as {
    enabled: boolean;
    publicKey: string | null;
  };

  if (!config?.enabled || !config.publicKey) {
    return {
      state: "server-disabled",
      reason: "Background notifications are not switched on for this server yet.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      state: permission === "denied" ? "denied" : "unsubscribed",
      reason:
        permission === "denied"
          ? "Notifications are blocked for this site. Allow them in your browser's site settings."
          : "Notifications were not enabled.",
    };
  }

  const registration = await navigator.serviceWorker.ready;

  /* Reuse an existing subscription rather than creating a second one. A
     browser only ever has one per registration, and calling `subscribe` again
     with a different key throws instead of replacing it. */
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    });
  }

  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  await api.post("/api/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
    userAgent: navigator.userAgent.slice(0, 200),
  });

  return { state: "subscribed", reason: "This device will receive alerts." };
};

/**
 * Stop this browser receiving alerts.
 *
 * The server row goes first. If the order were reversed and the second call
 * failed, the browser would be unsubscribed while the server still believed
 * it was reachable — every future push would then be sent into the void and
 * counted as a delivery.
 */
export const unsubscribeFromPush = async (): Promise<PushStatus> => {
  if (!isPushSupported()) return getPushStatus();

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return { state: "unsubscribed", reason: "This device is not receiving alerts." };
  }

  const json = subscription.toJSON() as { endpoint?: string };

  try {
    await api.post("/api/push/unsubscribe", { endpoint: json.endpoint });
  } catch {
    /* Best effort. A server that cannot be reached will prune the endpoint
       itself the first time a push to it comes back 410. */
  }

  await subscription.unsubscribe();

  return { state: "unsubscribed", reason: "This device will no longer receive alerts." };
};

/** Ask the server to buzz this account's devices, so the chain can be proved. */
export const sendTestPush = () =>
  api.post("/api/push/test", {}) as unknown as Promise<{
    message: string;
    sent: number;
  }>;

/**
 * The service worker tells the page when a notification is clicked, for the
 * cases where it could not navigate the client itself. Returns a detach
 * function so a component can clean up.
 */
export const onNotificationClick = (handler: (url: string) => void) => {
  if (!("serviceWorker" in navigator)) return () => undefined;

  const listener = (event: MessageEvent) => {
    if (event.data?.type === "notification-click" && event.data.url) {
      handler(event.data.url as string);
    }
  };

  navigator.serviceWorker.addEventListener("message", listener);
  return () => navigator.serviceWorker.removeEventListener("message", listener);
};
