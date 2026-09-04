/**
 * Fleet tyre domain rules — one module, so every screen agrees.
 *
 * Before this, position was a seven-item dropdown of prose ("Rear left outer"),
 * tread was a bare number, and "is this tyre finished?" was a `> 5` written
 * inline in the truck page and a `< 3` written inline in the tyre table. Two
 * screens, two answers, neither of them the legal one.
 *
 * Everything here follows the way fleets actually talk about tyres:
 * TMC/ATA-style wheel position codes, CMVR tread limits, and cost-per-km.
 */

/* ============================================================
   Wheel positions
   ============================================================ */

export type AxleKind = "steer" | "drive" | "trailer" | "lift";

export interface AxleSpec {
  /** 1-based, counted from the front. Matches how the code reads: "2LO". */
  index: number;
  kind: AxleKind;
  /** Dual (twin) wheels each side — the outer/inner pair on a drive axle. */
  dual: boolean;
}

export interface WheelPosition {
  /** The stored value. Short, sortable, and what a tyre fitter would write. */
  code: string;
  /** What a person reads. */
  label: string;
  axle: number;
  side: "L" | "R";
  /** Only meaningful on a dual axle. */
  dual?: "O" | "I";
  kind: AxleKind;
}

export interface AxleLayout {
  id: string;
  /** How the yard names it — "10-wheeler", not "6x4". */
  label: string;
  /** The engineering name, kept as the subtitle. */
  drive: string;
  axles: AxleSpec[];
}

/**
 * The configurations that cover essentially every Indian commercial vehicle.
 * A truck picks one; the diagram and the position list both come from it, so
 * they can never disagree.
 */
export const AXLE_LAYOUTS: AxleLayout[] = [
  {
    id: "4W",
    label: "4-wheeler",
    drive: "4x2 · LCV",
    axles: [
      { index: 1, kind: "steer", dual: false },
      { index: 2, kind: "drive", dual: false },
    ],
  },
  {
    id: "6W",
    label: "6-wheeler",
    drive: "4x2 · 2 axles",
    axles: [
      { index: 1, kind: "steer", dual: false },
      { index: 2, kind: "drive", dual: true },
    ],
  },
  {
    id: "10W",
    label: "10-wheeler",
    drive: "6x2 / 6x4 · 3 axles",
    axles: [
      { index: 1, kind: "steer", dual: false },
      { index: 2, kind: "drive", dual: true },
      { index: 3, kind: "lift", dual: true },
    ],
  },
  {
    id: "12W",
    label: "12-wheeler",
    drive: "8x2 · twin-steer",
    axles: [
      { index: 1, kind: "steer", dual: false },
      { index: 2, kind: "steer", dual: false },
      { index: 3, kind: "drive", dual: true },
      { index: 4, kind: "lift", dual: true },
    ],
  },
  {
    id: "14W",
    label: "14-wheeler",
    drive: "10x2 · multi-axle",
    axles: [
      { index: 1, kind: "steer", dual: false },
      { index: 2, kind: "steer", dual: false },
      { index: 3, kind: "drive", dual: true },
      { index: 4, kind: "lift", dual: true },
      { index: 5, kind: "lift", dual: true },
    ],
  },
  {
    id: "22W",
    label: "Trailer (22)",
    drive: "Tractor + 3-axle trailer",
    axles: [
      { index: 1, kind: "steer", dual: false },
      { index: 2, kind: "drive", dual: true },
      { index: 3, kind: "drive", dual: true },
      { index: 4, kind: "trailer", dual: true },
      { index: 5, kind: "trailer", dual: true },
      { index: 6, kind: "trailer", dual: true },
    ],
  },
];

export const DEFAULT_LAYOUT_ID = "10W";

export const SPARE_POSITIONS: WheelPosition[] = [
  { code: "SP1", label: "Stepney 1", axle: 99, side: "L", kind: "trailer" },
  { code: "SP2", label: "Stepney 2", axle: 99, side: "R", kind: "trailer" },
];

const SIDE_WORD = { L: "left", R: "right" } as const;
const DUAL_WORD = { O: "outer", I: "inner" } as const;

const AXLE_WORD: Record<AxleKind, string> = {
  steer: "Steer",
  drive: "Drive",
  trailer: "Trailer",
  lift: "Tag",
};

/**
 * Positions for one axle, ordered left-outer to right-outer — the order they
 * physically sit on the vehicle, so a rendered row needs no re-sorting.
 */
export function positionsForAxle(axle: AxleSpec): WheelPosition[] {
  const name = `${AXLE_WORD[axle.kind]} axle ${axle.index}`;

  if (!axle.dual) {
    return (["L", "R"] as const).map((side) => ({
      code: `${axle.index}${side}`,
      label: `${name} · ${SIDE_WORD[side]}`,
      axle: axle.index,
      side,
      kind: axle.kind,
    }));
  }

  const order: Array<["L" | "R", "O" | "I"]> = [
    ["L", "O"],
    ["L", "I"],
    ["R", "I"],
    ["R", "O"],
  ];

  return order.map(([side, dual]) => ({
    code: `${axle.index}${side}${dual}`,
    label: `${name} · ${SIDE_WORD[side]} ${DUAL_WORD[dual]}`,
    axle: axle.index,
    side,
    dual,
    kind: axle.kind,
  }));
}

export function layoutById(id?: string | null): AxleLayout {
  return (
    AXLE_LAYOUTS.find((l) => l.id === id) ??
    AXLE_LAYOUTS.find((l) => l.id === DEFAULT_LAYOUT_ID)!
  );
}

export function positionsForLayout(layout: AxleLayout, includeSpares = true): WheelPosition[] {
  const wheels = layout.axles.flatMap(positionsForAxle);
  return includeSpares ? [...wheels, ...SPARE_POSITIONS] : wheels;
}

/**
 * How many road wheels the vehicle has — the "10" in 10-wheeler. Stepneys are
 * not counted: a spare is stock, not a hub that has to be filled.
 */
export function wheelCount(layout: AxleLayout): number {
  return layout.axles.reduce((n, axle) => n + (axle.dual ? 4 : 2), 0);
}

/** The wheel count for a stored layout id, without unwrapping the layout. */
export function wheelCountFor(id?: string | null): number {
  return wheelCount(layoutById(id));
}

/** "10-wheeler" for a stored id — what the yard calls the vehicle. */
export function layoutLabel(id?: string | null): string {
  return layoutById(id).label;
}

/** Guess the layout from how many tyres are already fitted. */
export function inferLayoutId(mountedCount: number): string {
  const best = [...AXLE_LAYOUTS]
    .map((l) => ({ l, wheels: wheelCount(l) }))
    .filter(({ wheels }) => wheels >= mountedCount)
    .sort((a, b) => a.wheels - b.wheels)[0];
  return best?.l.id ?? DEFAULT_LAYOUT_ID;
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/**
 * Read any position value ever stored, including the prose the old dropdown
 * wrote ("Rear-Left-Outer") and free text typed straight into the API.
 * Existing data has to keep rendering; a migration is not a redesign.
 */
export function parsePosition(raw?: string | null): WheelPosition | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const code = value.toUpperCase().replace(/[\s_-]/g, "");

  const spare = SPARE_POSITIONS.find((p) => p.code === code);
  if (spare) return spare;
  if (/^(STEPNEY|SPARE)$/.test(code)) return SPARE_POSITIONS[0];

  const structured = /^([1-9])([LR])([OI])?$/.exec(code);
  if (structured) {
    const [, axleNo, side, dual] = structured;
    const index = Number(axleNo);
    const kind: AxleKind = index === 1 ? "steer" : "drive";
    const s = side as "L" | "R";
    const d = dual as "O" | "I" | undefined;
    return {
      code,
      label: d
        ? `Axle ${index} · ${SIDE_WORD[s]} ${DUAL_WORD[d]}`
        : `Axle ${index} · ${SIDE_WORD[s]}`,
      axle: index,
      side: s,
      dual: d,
      kind,
    };
  }

  /* Legacy prose: "Front-Left", "Rear-Right-Inner". */
  const legacy = /^(FRONT|REAR)(LEFT|RIGHT)(OUTER|INNER)?$/.exec(code);
  if (legacy) {
    const [, row, side, dual] = legacy;
    const axle = row === "FRONT" ? 1 : 2;
    const s = side === "LEFT" ? "L" : "R";
    const d = dual === "OUTER" ? "O" : dual === "INNER" ? "I" : undefined;
    return {
      code: `${axle}${s}${d ?? ""}`,
      label: d ? `Axle ${axle} · ${SIDE_WORD[s]} ${DUAL_WORD[d]}` : `Axle ${axle} · ${SIDE_WORD[s]}`,
      axle,
      side: s,
      dual: d,
      kind: axle === 1 ? "steer" : "drive",
    };
  }

  return { code: value, label: value, axle: 0, side: "L", kind: "drive" };
}

export function positionCode(raw?: string | null): string | null {
  return parsePosition(raw)?.code ?? null;
}

export function positionLabel(raw?: string | null): string {
  return parsePosition(raw)?.label ?? "Unassigned";
}

/* ============================================================
   Tread health
   ============================================================ */

/**
 * CMVR Rule 94 sets 2.0 mm as the minimum legal tread on a transport vehicle.
 * Fleets pull well before that — at 3 mm — because a casing taken off in time
 * is worth a retread, and one run to the legal line usually is not.
 */
export const TREAD = {
  /** Below this the tyre is not road legal. */
  legalMin: 2,
  /** The fleet pull point: change it out, send the casing for retreading. */
  pullPoint: 3,
  /** Start planning a replacement. */
  watch: 5,
} as const;

export type TreadVerdict = "healthy" | "monitor" | "planReplacement" | "replaceNow" | "illegal";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export interface TreadHealth {
  verdict: TreadVerdict;
  label: string;
  /**
   * Share of the *usable* tread still left, 0–1. Not depth over new depth:
   * the last 2 mm are legally unusable, so counting them flatters the tyre.
   */
  remaining: number;
  /** Share of usable tread already worn away, 0–1. */
  worn: number;
  tone: Tone;
  /** Bar colour — a token, never a raw hex. */
  barClass: string;
  textClass: string;
}

const VERDICTS: Record<TreadVerdict, Omit<TreadHealth, "remaining" | "worn" | "verdict">> = {
  healthy: {
    label: "Healthy",
    tone: "success",
    barClass: "bg-positive",
    textClass: "text-positive-ink",
  },
  monitor: {
    label: "Monitor",
    tone: "info",
    barClass: "bg-accent",
    textClass: "text-accent-ink",
  },
  planReplacement: {
    label: "Plan replacement",
    tone: "warning",
    barClass: "bg-caution",
    textClass: "text-caution-ink",
  },
  replaceNow: {
    label: "At pull point",
    tone: "danger",
    barClass: "bg-critical",
    textClass: "text-critical-ink",
  },
  illegal: {
    label: "Below legal limit",
    tone: "danger",
    barClass: "bg-critical",
    textClass: "text-critical-ink",
  },
};

export function treadHealth(current: number, initial: number): TreadHealth {
  const depth = Number.isFinite(current) ? current : 0;
  const usable = Math.max((initial || 0) - TREAD.legalMin, 0.1);
  const remaining = clamp01((depth - TREAD.legalMin) / usable);

  const verdict: TreadVerdict =
    depth < TREAD.legalMin
      ? "illegal"
      : depth < TREAD.pullPoint
        ? "replaceNow"
        : depth < TREAD.watch
          ? "planReplacement"
          : remaining < 0.5
            ? "monitor"
            : "healthy";

  return { verdict, remaining, worn: 1 - remaining, ...VERDICTS[verdict] };
}

/** Anything a fleet manager should be looking at today. */
export function needsAttention(current: number, initial: number): boolean {
  const { verdict } = treadHealth(current, initial);
  return verdict === "replaceNow" || verdict === "illegal" || verdict === "planReplacement";
}

/* ============================================================
   Cost and wear
   ============================================================ */

/**
 * Cost per kilometre — the number a fleet actually buys tyres on. A cheap
 * tyre that dies at 40,000 km loses to a dear one that runs 90,000.
 */
export function costPerKm(purchasePrice?: number, totalKmRun?: number): number | null {
  if (!purchasePrice || !totalKmRun || totalKmRun <= 0) return null;
  return purchasePrice / totalKmRun;
}

/** Wear rate in mm per 1,000 km — the input to any life projection. */
export function wearRate(initial: number, current: number, totalKmRun?: number): number | null {
  if (!totalKmRun || totalKmRun <= 0) return null;
  const worn = initial - current;
  if (worn <= 0) return null;
  return (worn / totalKmRun) * 1000;
}

/** Kilometres left before the tyre reaches the pull point, at its own rate. */
export function projectedKmRemaining(
  initial: number,
  current: number,
  totalKmRun?: number
): number | null {
  const rate = wearRate(initial, current, totalKmRun);
  if (!rate) return null;
  const mmLeft = current - TREAD.pullPoint;
  if (mmLeft <= 0) return 0;
  return Math.round((mmLeft / rate) * 1000);
}

/* ============================================================
   Status
   ============================================================ */

export type TyreStatus = "Mounted" | "Spare" | "SentForRetreading" | "Scrapped";

/** "SentForRetreading" is a database value, not something to show a person. */
export const STATUS_LABEL: Record<TyreStatus, string> = {
  Mounted: "Fitted",
  Spare: "In stock",
  SentForRetreading: "At retreader",
  Scrapped: "Scrapped",
};

export const STATUS_TONE: Record<TyreStatus, Tone> = {
  Mounted: "info",
  Spare: "success",
  SentForRetreading: "warning",
  Scrapped: "neutral",
};

export function statusLabel(status?: string): string {
  return STATUS_LABEL[status as TyreStatus] ?? status ?? "Unknown";
}

export function statusTone(status?: string): Tone {
  return STATUS_TONE[status as TyreStatus] ?? "neutral";
}

/* ============================================================
   Dismount reasons — the enum the API already validates against
   ============================================================ */

export interface DismountReason {
  value: "Rotation" | "Puncture" | "Retread" | "Scrap" | "Spare" | "Other";
  label: string;
  description: string;
  /** Where the tyre lands afterwards. Shown before the user commits. */
  resulting: TyreStatus;
}

export const DISMOUNT_REASONS: DismountReason[] = [
  {
    value: "Spare",
    label: "Back to stock",
    description: "Serviceable. Returns to inventory, ready to fit again.",
    resulting: "Spare",
  },
  {
    value: "Rotation",
    label: "Rotation",
    description: "Coming off to even out wear, then going back on.",
    resulting: "Spare",
  },
  {
    value: "Puncture",
    label: "Puncture / repair",
    description: "Off the road for a repair, then back to stock.",
    resulting: "Spare",
  },
  {
    value: "Retread",
    label: "Send for retreading",
    description: "Casing still good. Goes to the retreader.",
    resulting: "SentForRetreading",
  },
  {
    value: "Scrap",
    label: "Scrap",
    description: "End of life. Removed from the fleet for good.",
    resulting: "Scrapped",
  },
];

/* ============================================================
   Fitment — which axle a tread pattern is built for
   ============================================================ */

export type AxleApplication = "Steer" | "Drive" | "Trailer" | "All";

export const AXLE_APPLICATIONS: Array<{ value: AxleApplication; label: string; hint: string }> = [
  { value: "All", label: "All position", hint: "Fits any axle" },
  { value: "Steer", label: "Steer", hint: "Rib pattern, front axle" },
  { value: "Drive", label: "Drive", hint: "Lug pattern, powered axle" },
  { value: "Trailer", label: "Trailer", hint: "Free-rolling axles" },
];

/**
 * A drive-pattern tyre on the steer axle is the classic fitment mistake — it
 * tramlines and wears in scallops. We warn rather than block: the yard knows
 * things the database does not, and a hard stop just teaches people to lie to
 * the form.
 */
export function fitmentWarning(
  application: AxleApplication | undefined,
  position: WheelPosition | null
): string | null {
  if (!application || application === "All" || !position) return null;
  if (position.axle === 99) return null;

  const kindWord: Record<AxleKind, AxleApplication> = {
    steer: "Steer",
    drive: "Drive",
    lift: "Trailer",
    trailer: "Trailer",
  };
  if (kindWord[position.kind] === application) return null;

  return `This is a ${application.toLowerCase()}-axle tyre going onto a ${position.kind} position. It will fit, but it will wear unevenly.`;
}

/* ============================================================
   Catalogue — so nobody types "MRF" four different ways
   ============================================================ */

/** Truck and bus radial and bias sizes common on Indian roads. */
export const COMMON_SIZES = [
  "295/80 R22.5",
  "315/80 R22.5",
  "275/70 R22.5",
  "385/65 R22.5",
  "11R22.5",
  "12R22.5",
  "10.00-20",
  "11.00-20",
  "9.00-20",
  "8.25-20",
  "10.00 R20",
  "12.00 R20",
  "235/75 R17.5",
  "215/75 R17.5",
  "7.50-16",
];

export const COMMON_BRANDS = [
  "MRF",
  "Apollo",
  "JK Tyre",
  "CEAT",
  "Birla",
  "TVS Eurogrip",
  "Bridgestone",
  "Michelin",
  "Goodyear",
  "Continental",
  "Yokohama",
  "BKT",
];

/**
 * New-tyre tread depth by size class. Pre-filling this is the difference
 * between a form somebody fills in and a form somebody guesses at — and a
 * wrong initial depth quietly corrupts every wear figure that follows.
 */
export function suggestedInitialTread(size: string): number | null {
  const s = size.replace(/\s/g, "").toUpperCase();
  if (/^(295|315|385)\/\d{2}R22\.5$/.test(s)) return 16;
  if (/^1[12]R22\.5$/.test(s) || /R22\.5$/.test(s)) return 15;
  if (/^(10\.00|11\.00|12\.00)[-R]20$/.test(s)) return 18;
  if (/^(8\.25|9\.00)[-R]20$/.test(s)) return 16;
  if (/R17\.5$/.test(s)) return 13;
  if (/^7\.50-16$/.test(s)) return 12;
  return null;
}

/* ============================================================
   Serial numbers — batch entry
   ============================================================ */

/**
 * Tyres arrive in sets, and their serials almost always run consecutively.
 * Typing six near-identical numbers by hand is where transcription errors get
 * into the inventory, so we generate the run and let the user correct it.
 */
export function serialRun(seed: string, count: number): string[] {
  const match = /^(.*?)(\d+)$/.exec(seed.trim());
  if (!match) {
    return Array.from({ length: count }, (_, i) => (i === 0 ? seed.trim() : ""));
  }

  const [, prefix, digits] = match;
  const start = Number(digits);
  const width = digits.length;

  return Array.from({ length: count }, (_, i) =>
    `${prefix}${String(start + i).padStart(width, "0")}`.toUpperCase()
  );
}

/* ============================================================
   Populated references
   ============================================================ */

/**
 * `currentTruckId` arrives populated from the list and detail endpoints and
 * as a bare id from anywhere else. Every screen was unwrapping that by hand,
 * and each one guessed differently about which shape it would get.
 */
export function refId(ref?: { _id?: string } | string | null): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  return ref._id ?? null;
}

export function refReg(
  ref?: { registrationNumber?: string } | string | null
): string | null {
  if (!ref || typeof ref === "string") return null;
  return ref.registrationNumber ?? null;
}

/* ============================================================
   Formatting
   ============================================================ */

export const formatCurrency = (n?: number | null) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;

export const formatCpk = (n?: number | null) => (n == null ? "—" : `₹${n.toFixed(2)}/km`);

export const formatKm = (n?: number | null) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("en-IN")} km`;

export const formatMm = (n?: number | null) => (n == null ? "—" : `${n} mm`);
