import { isOpen, urgency } from "./clock";
import type { CareerBand, CareerRole, Felt } from "./types";

export const HUNT_KEY = "ichina-career-hunt";
export const WATCH_KEY = "ichina-career-watch";
export const PANE_KEY = "ichina-career-pane";

export type CareerPane = "dash" | "schedule" | "match" | "pools" | "progress" | "desk";

export const panes: CareerPane[] = ["dash", "schedule", "match", "pools", "progress", "desk"];

export type HuntStatus =
  | "pooled"
  | "matched"
  | "watching"
  | "queued"
  | "drafted"
  | "applied"
  | "interview"
  | "hold"
  | "skipped"
  | "closed";

export const huntStatuses: HuntStatus[] = [
  "pooled",
  "matched",
  "watching",
  "queued",
  "drafted",
  "applied",
  "interview",
  "hold",
  "skipped",
  "closed",
];

export type HuntEntry = {
  status: HuntStatus;
  note: string;
  updatedAt: string;
};

export type HuntBook = Record<string, HuntEntry>;

export function feltMean(role: CareerRole): number {
  const parts: Felt[] = [role.pay, role.security, role.reputation, role.balance, role.fit];
  return parts.reduce((sum, n) => sum + n, 0) / parts.length;
}

/** How the new desk rhymes with a listing. Higher is closer. */
export function matchScore(role: CareerRole): number {
  let score = feltMean(role);
  if (role.tier === "ideal") score += 0.6;
  if (role.bands.includes("cvc")) score += 0.35;
  if (role.bands.includes("capital")) score += 0.25;
  if (role.bands.includes("institutions")) score += 0.2;
  if (role.stretch) score -= 0.45;
  if (role.status === "skip") score -= 2;
  return Math.max(1, Math.min(5, Math.round(score * 10) / 10));
}

export function matchWhy(role: CareerRole, zh: boolean): string {
  const bits: string[] = [];
  if (role.tier === "ideal") {
    bits.push(zh ? "你点名的理想席" : "The seat you named as ideal.");
  }
  if (role.bands.includes("cvc")) {
    bits.push(zh ? "贴天使 / CVC / 战略投资" : "Rhymes with angel / CVC / strategic investment.");
  }
  if (role.bands.includes("capital")) {
    bits.push(zh ? "资本台 + 已上线 AI" : "Capital desk next to live AI.");
  }
  if (role.bands.includes("institutions")) {
    bits.push(zh ? "持牌运营 / 机构名声与稳" : "Licensed operator habits; institutional security.");
  }
  if (role.bands.includes("today")) {
    bits.push(zh ? "香港钟还在走" : "The Hong Kong clock is still running.");
  }
  if (role.stretch) {
    bits.push(zh ? "拉伸 — 不要声称没有的年资" : "Stretch — do not claim years you do not have.");
  }
  if (!bits.length) {
    bits.push(zh ? "形状相近，再看贴合" : "Same shape. Read the fit.");
  }
  return bits.join(" ");
}

export function defaultStatus(role: CareerRole, now: Date, watching: boolean): HuntStatus {
  if (role.status === "skip") return "skipped";
  if (role.closeAt && !isOpen(role.closeAt, now)) return "closed";
  if (watching) return "watching";
  if (role.tier === "ideal") return "matched";
  if (matchScore(role) >= 4.2) return "matched";
  return "pooled";
}

export function readHunt(): HuntBook {
  try {
    const raw = localStorage.getItem(HUNT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HuntBook;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeHunt(book: HuntBook) {
  localStorage.setItem(HUNT_KEY, JSON.stringify(book));
}

export function setHuntStatus(book: HuntBook, id: string, status: HuntStatus, note?: string): HuntBook {
  const next: HuntBook = {
    ...book,
    [id]: {
      status,
      note: note ?? book[id]?.note ?? "",
      updatedAt: new Date().toISOString(),
    },
  };
  writeHunt(next);
  return next;
}

export function resolveStatus(role: CareerRole, book: HuntBook, now: Date, watching: boolean): HuntStatus {
  const saved = book[role.id]?.status;
  if (saved) return saved;
  return defaultStatus(role, now, watching);
}

export function progressCounts(roles: CareerRole[], book: HuntBook, now: Date, watch: string[]) {
  const counts: Record<HuntStatus, number> = {
    pooled: 0,
    matched: 0,
    watching: 0,
    queued: 0,
    drafted: 0,
    applied: 0,
    interview: 0,
    hold: 0,
    skipped: 0,
    closed: 0,
  };
  for (const role of roles) {
    if (role.status === "skip") continue;
    counts[resolveStatus(role, book, now, watch.includes(role.id))] += 1;
  }
  return counts;
}

export type DayBucket = {
  key: string;
  label: string;
  roles: CareerRole[];
};

export function scheduleDays(roles: CareerRole[], now: Date, days = 14): DayBucket[] {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const label = new Intl.DateTimeFormat("en-HK", {
    timeZone: "Asia/Hong_Kong",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const buckets = new Map<string, CareerRole[]>();
  for (const role of roles) {
    if (!role.closeAt || !isOpen(role.closeAt, now)) continue;
    const key = fmt.format(new Date(role.closeAt));
    const list = buckets.get(key) ?? [];
    list.push(role);
    buckets.set(key, list);
  }
  const out: DayBucket[] = [];
  const start = new Date(now);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = fmt.format(d);
    const list = (buckets.get(key) ?? []).sort((a, b) => {
      const am = a.closeAt ? new Date(a.closeAt).getTime() : 0;
      const bm = b.closeAt ? new Date(b.closeAt).getTime() : 0;
      return am - bm;
    });
    out.push({ key, label: label.format(d), roles: list });
  }
  return out;
}

export const poolOrder: CareerBand[] = ["today", "institutions", "capital", "cvc", "stretch"];

export function inPool(role: CareerRole, band: CareerBand, now: Date): boolean {
  if (role.status === "skip") return false;
  if (band === "today") return role.bands.includes("today") && isOpen(role.closeAt, now);
  return role.bands.includes(band);
}

export function urgencyRank(role: CareerRole, now: Date): number {
  const order = { now: 0, soon: 1, week: 2, open: 3 } as const;
  return order[urgency(role.closeAt, now)];
}
