import { useEffect, useState } from "react";
import { FiBell, FiBellOff, FiSmartphone } from "react-icons/fi";
import { Button } from "../../../components/ui/Button";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  getPushStatus,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
  type PushStatus,
} from "../../../utils/push";
import api from "../../../api/axios";

interface Device {
  _id: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
}

/**
 * Turning on background notifications.
 *
 * Push is a feature people fail to enable and then assume is broken, because
 * every failure mode is invisible: permission denied in a session they have
 * forgotten, a browser that does not support it, an iPhone that needs the app
 * added to the Home Screen first. So this panel always says which of those it
 * is, and offers a test button — a notification that actually arrives is the
 * only convincing proof that the chain works end to end.
 */

/* Turns a user agent string into something a person can recognise in a list.
   Not exhaustive parsing — just enough to tell "the phone" from "the laptop",
   which is the only distinction that matters when deciding what to remove. */
const describeDevice = (ua?: string) => {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : "Browser";
  const platform = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iPhone or iPad"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return platform ? `${browser} on ${platform}` : browser;
};

export function NotificationSettings() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const refresh = async () => {
    setStatus(await getPushStatus());
    try {
      const res = (await api.get("/api/push/devices")) as unknown as { devices: Device[] };
      setDevices(res?.devices ?? []);
    } catch {
      setDevices([]);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const run = async (action: () => Promise<PushStatus>, successText: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const next = await action();
      setStatus(next);
      /* The reason from the status is more specific than any message this
         component could invent — "you blocked notifications" beats "failed". */
      setMessage(
        next.state === "subscribed"
          ? { tone: "success", text: successText }
          : { tone: "error", text: next.reason }
      );
      await refresh();
    } catch (err: any) {
      setMessage({ tone: "error", text: err?.message ?? "Something went wrong." });
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await sendTestPush();
      setMessage({ tone: "success", text: res.message });
    } catch (err: any) {
      setMessage({ tone: "error", text: err?.message ?? "Could not send a test." });
    } finally {
      setBusy(false);
    }
  };

  const subscribed = status?.state === "subscribed";
  const blocked = status?.state === "denied";
  const unavailable = status?.state === "unsupported" || status?.state === "server-disabled";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-card border border-hairline bg-canvas-sunken p-4">
        <div className="min-w-0">
          <p className="font-semibold text-ink">Background notifications</p>
          <p className="text-sm text-ink-secondary">
            Get trip, expense and expiry alerts even when FleetWise is closed.
          </p>
        </div>
        <StatusBadge tone={subscribed ? "success" : blocked ? "danger" : "neutral"}>
          {subscribed ? "On" : blocked ? "Blocked" : "Off"}
        </StatusBadge>
      </div>

      {message && <InlineMessage tone={message.tone}>{message.text}</InlineMessage>}

      {/* The reason is shown whenever it is not simply "on" — an unexplained
          off switch is what makes people conclude the feature is broken. */}
      {status && !subscribed && !message && (
        <InlineMessage tone={blocked || unavailable ? "warning" : "info"}>
          {status.reason}
        </InlineMessage>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {subscribed ? (
          <Button
            variant="secondary"
            onClick={() => run(unsubscribeFromPush, "")}
            loading={busy}
          >
            <FiBellOff className="mr-2 h-4 w-4" />
            Turn off on this device
          </Button>
        ) : (
          <Button
            onClick={() => run(subscribeToPush, "This device will now receive alerts.")}
            loading={busy}
            disabled={unavailable || blocked}
          >
            <FiBell className="mr-2 h-4 w-4" />
            Turn on for this device
          </Button>
        )}

        {subscribed && (
          <Button variant="secondary" onClick={handleTest} loading={busy}>
            Send a test
          </Button>
        )}
      </div>

      {devices.length > 0 && (
        <div className="space-y-2">
          <p className="text-caption text-xs font-semibold uppercase text-ink-tertiary">
            Devices receiving alerts
          </p>
          <ul className="divide-y divide-hairline rounded-card border border-hairline">
            {devices.map((device) => (
              <li key={device._id} className="flex items-center gap-3 px-4 py-3">
                <FiSmartphone className="h-4 w-4 shrink-0 text-ink-quaternary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {describeDevice(device.userAgent)}
                  </p>
                  <p className="text-xs text-ink-tertiary">
                    Added {new Date(device.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-tertiary">
            A device is removed automatically once its browser stops accepting alerts.
          </p>
        </div>
      )}
    </div>
  );
}
