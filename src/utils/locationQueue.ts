/**
 * A durable queue for position fixes.
 *
 * The tracking hook used to `fetch` each fix and, on failure, log to the
 * console and move on. On a highway that means the trail simply has holes in
 * it wherever the road is remote — which is most of where the trucks are, and
 * exactly where knowing the position mattered.
 *
 * Fixes are written here first and drained in the background, so a lost signal
 * costs nothing but latency. `localStorage` rather than IndexedDB: the payload
 * is a few hundred small objects at worst, it survives a reload and a crash,
 * and it is synchronous — which matters because the last thing a page does
 * before being unloaded has no time to await anything.
 */

const KEY = "fleetwise:location-queue";

/**
 * Enough for about ten hours of driving at one fix a minute. Past this the
 * oldest are dropped: a queue that grows without limit eventually exceeds the
 * ~5 MB localStorage budget and throws on write, which loses *everything*
 * including the fixes we already had. Dropping the oldest degrades the trail;
 * blowing the quota deletes it.
 */
const MAX_QUEUED = 600;

/** The server accepts 500 per request; stay under it with room to spare. */
export const BATCH_SIZE = 200;

export interface QueuedFix {
  latitude: number;
  longitude: number;
  timestamp: string;
  /** Set when a send failed, so a permanently bad fix can be given up on. */
  attempts?: number;
}

const read = (): QueuedFix[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    /* Corrupt or unparseable: start clean rather than throwing on every call
       for the rest of the session. */
    return [];
  }
};

const write = (fixes: QueuedFix[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(fixes));
  } catch {
    /* Quota exceeded, or storage disabled in a private window. Halve the
       queue and try once more — keeping the newest, which are the ones a
       viewer is most likely to be looking for. */
    try {
      localStorage.setItem(KEY, JSON.stringify(fixes.slice(-Math.floor(MAX_QUEUED / 2))));
    } catch {
      /* Storage is genuinely unavailable. Tracking degrades to online-only,
         which is what it was before this existed. */
    }
  }
};

export const enqueue = (fix: QueuedFix) => {
  const queue = read();
  queue.push(fix);
  write(queue.length > MAX_QUEUED ? queue.slice(-MAX_QUEUED) : queue);
};

export const peek = (count = BATCH_SIZE): QueuedFix[] => read().slice(0, count);

export const size = () => read().length;

/**
 * Drop the fixes that were accepted.
 *
 * Removes from the front by count rather than by identity: the queue is
 * append-only and drained in order, so the first `count` entries are exactly
 * the ones that were sent. Comparing by value would fail on two genuinely
 * identical fixes from a stationary truck.
 */
export const drop = (count: number) => {
  const queue = read();
  write(queue.slice(count));
};

/** Give up on the head of the queue after repeated rejections. */
export const markFailed = (count: number) => {
  const queue = read();

  for (let i = 0; i < Math.min(count, queue.length); i++) {
    queue[i].attempts = (queue[i].attempts ?? 0) + 1;
  }

  /* Three failures is a fix the server will never accept — a clock skew, a
     coordinate out of range. Holding it forever blocks everything behind it,
     because the queue drains in order. */
  write(queue.filter((f) => (f.attempts ?? 0) < 3));
};

export const clear = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Nothing to do; the queue is already inaccessible. */
  }
};
