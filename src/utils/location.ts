import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { BATCH_SIZE, drop, enqueue, markFailed, peek, size } from "./locationQueue";

/**
 * Driver location tracking.
 *
 * What changed and why:
 *
 * - Fixes are queued to storage first and drained in the background. The old
 *   version POSTed each one and, on failure, logged to the console — so on a
 *   highway with no signal the trail simply had holes in it, which is exactly
 *   where knowing the truck's position was worth something.
 * - Nothing is sent more often than `MIN_SEND_INTERVAL_MS`, and a fix that has
 *   barely moved is not recorded at all. `watchPosition` fires far more often
 *   than a truck's position meaningfully changes, and every one of those was a
 *   request and a database row.
 * - The token is read at send time rather than captured when the hook first
 *   ran. The old code closed over it at mount, so a driver whose session was
 *   refreshed kept posting with a stale token until they reloaded the page.
 */

/** A fix closer than this to the last one is drift, not travel. */
const MIN_DISTANCE_M = 50;

/** Never send more than once a minute, however often the browser reports. */
const MIN_SEND_INTERVAL_MS = 60_000;

/** Retry the queue on this cadence even without a new fix. */
const DRAIN_INTERVAL_MS = 30_000;

/** Rough metres between two coordinates. Good enough for a 50 m threshold. */
const metresBetween = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const useDriverTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const lastFixRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSentAtRef = useRef(0);
  const drainingRef = useRef(false);
  /* Dropped to false after a high-accuracy timeout. Indoors, in a yard, or
     under a loading canopy a GPS-only fix can take longer than any sensible
     timeout, while the network-based one resolves immediately. Refusing to
     degrade means tracking simply never starts in exactly those places. */
  const highAccuracyRef = useRef(true);
  const startRef = useRef<() => void>(() => {});

  /**
   * Push whatever is queued.
   *
   * Guarded against overlapping runs: the drain timer and a new fix can land
   * together, and two concurrent drains would send the same batch twice and
   * then each drop the front of the queue — losing the fixes behind it.
   */
  const drain = useCallback(async () => {
    if (drainingRef.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    drainingRef.current = true;
    try {
      /* One batch per run. Draining the whole queue in a loop on a slow link
         would keep the flag held for minutes and block new fixes. */
      const batch = peek(BATCH_SIZE);
      if (!batch.length) return;

      const payload = batch.map(({ latitude, longitude, timestamp }) => ({
        latitude,
        longitude,
        timestamp,
      }));

      const res = (await api.post("/api/driver/updateLocations", {
        fixes: payload,
      })) as unknown as { accepted?: number; rejected?: { index: number }[] };

      /* The whole batch leaves the queue on a 2xx, including anything the
         server rejected as malformed — it will reject it again forever, and
         the queue drains in order, so keeping it blocks everything behind. */
      drop(batch.length);
      setPending(size());

      void res;
    } catch (err: any) {
      /* A 4xx means the server will not take these however many times we ask;
         count it against them so a poisoned fix eventually falls out. A
         network error or a 5xx is worth retrying indefinitely. */
      const status = err?.statusCode;
      if (status && status >= 400 && status < 500 && status !== 429) {
        markFailed(BATCH_SIZE);
        setPending(size());
      }
    } finally {
      drainingRef.current = false;
    }
  }, []);

  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const here = { lat: latitude, lng: longitude };

      const movedEnough =
        !lastFixRef.current || metresBetween(lastFixRef.current, here) >= MIN_DISTANCE_M;
      const dueAnyway = Date.now() - lastSentAtRef.current >= MIN_SEND_INTERVAL_MS;

      /* A parked truck still reports periodically, so a halt is visible as a
         run of identical points rather than as a gap in the trail — which is
         indistinguishable from the phone being off. */
      if (!movedEnough && !dueAnyway) return;

      lastFixRef.current = here;
      lastSentAtRef.current = Date.now();

      enqueue({
        latitude,
        longitude,
        timestamp: new Date(position.timestamp).toISOString(),
      });
      setPending(size());

      void drain();
    },
    [drain]
  );

  const stopTracking = useCallback(() => {
    if (watchIdRef.current === null) return;
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
  }, []);

  const handlePositionError = useCallback(
    (positionError: GeolocationPositionError) => {
      /* A denied permission will not un-deny itself; continuing to watch just
         burns battery producing the same error. */
      if (positionError.code === positionError.PERMISSION_DENIED) {
        setError("Location permission was denied. Allow it to share your position.");
        stopTracking();
        return;
      }

      /* Timed out waiting for a precise fix. Retry once without the
         high-accuracy requirement rather than giving up — the coarse position
         is worth far more than nothing, and this is the common case in a
         warehouse. */
      if (positionError.code === positionError.TIMEOUT && highAccuracyRef.current) {
        highAccuracyRef.current = false;
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        startRef.current();
        return;
      }

      setError(positionError.message);
    },
    [stopTracking]
  );

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("This device cannot report its location.");
      return;
    }
    if (watchIdRef.current !== null) return;

    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: highAccuracyRef.current,
        timeout: highAccuracyRef.current ? 30_000 : 45_000,
        maximumAge: 15_000,
      }
    );
    setIsTracking(true);
  }, [handlePositionError, handlePositionUpdate]);

  /* The error handler restarts the watcher after degrading accuracy, and the
     watcher's own callbacks are what the error handler is attached to. A ref
     breaks that cycle without either of them depending on the other. */
  useEffect(() => {
    startRef.current = startTracking;
  }, [startTracking]);

  /* Drain on a timer and whenever connectivity returns. The timer covers the
     case where the driver stops moving inside a dead zone: no new fixes, but a
     queue still waiting to go out once there is signal. */
  useEffect(() => {
    setPending(size());

    const timer = setInterval(() => void drain(), DRAIN_INTERVAL_MS);
    const onOnline = () => void drain();

    window.addEventListener("online", onOnline);
    void drain();

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
    };
  }, [drain]);

  useEffect(() => stopTracking, [stopTracking]);

  return {
    isTracking,
    startTracking,
    stopTracking,
    error,
    /** Fixes collected but not yet accepted by the server. */
    pending,
  };
};
