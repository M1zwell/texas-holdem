import { isOpen, urgency } from "../career/clock";
import type { Felt, FundingKind, FundingProgram } from "./types";

export const HUNT_KEY = "ichina-funding-hunt";
export const WATCH_KEY = "ichina-funding-watch";
export const PANE_KEY = "ichina-funding-pane";

export type FundingPane = "dash" | "schedule" | "match" | "pools" | "progress" | "desk";

export const panes: FundingPane[] = ["dash", "schedule", "match", "pools", "progress", "desk"];

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

export function feltMean(program: FundingProgram): number {
  const parts: Felt[] = [program.leverage, program.halo, program.fit, program.burden];
  return parts.reduce((sum, n) => sum + n, 0) / parts.length;
}

/** Higher = less burden, more halo / leverage, closer to the ichina.co raise. */
export function matchScore(program: FundingProgram): number {
  let score = feltMean(program);
  if (program.kind === "grant") score += 0.35;
  if (program.kind === "incubation") score += 0.2;
  if (program.kind === "angel") score += 0.1;
  if (program.status === "skip") score -= 2;
  return Math.max(1, Math.min(5, Math.round(score * 10) / 10));
}

export function matchWhy(program: FundingProgram, zh: boolean): string {
  const bits: string[] = [];
  if (program.kind === "grant") {
    bits.push(zh ? "低负担资助，少控制。" : "Light grant. Little control.");
  }
  if (program.kind === "incubation") {
    bits.push(zh ? "孵化带渠道与投资人对接。" : "Incubation that also matches GTM and investors.");
  }
  if (program.kind === "angel") {
    bits.push(zh ? "股权天使，光环在，负担更高。" : "Equity angel. Halo yes, burden higher.");
  }
  if (program.kind === "cvc") {
    bits.push(zh ? "产业资本。先有计划与 [TO FILL] 再走。" : "CVC. Need a plan and a [TO FILL] ask first.");
  }
  if (program.kind === "platform") {
    bits.push(zh ? "门户撮合。先有估值与数字。" : "Portal matchmaking. Needs a number first.");
  }
  if (!bits.length) {
    bits.push(zh ? "形状相近，再看贴合。" : "Same shape. Read the fit.");
  }
  return bits.join(" ");
}

export function defaultStatus(program: FundingProgram, now: Date, watching: boolean): HuntStatus {
  if (program.status === "skip") return "skipped";
  if (program.closeAt && !isOpen(program.closeAt, now)) return "closed";
  if (watching) return "watching";
  if (program.status === "live" && matchScore(program) >= 4.2) return "matched";
  if (program.status === "watch") return "hold";
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

export function resolveStatus(program: FundingProgram, book: HuntBook, now: Date, watching: boolean): HuntStatus {
  const saved = book[program.id]?.status;
  if (saved) return saved;
  return defaultStatus(program, now, watching);
}

export function progressCounts(programs: FundingProgram[], book: HuntBook, now: Date, watch: string[]) {
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
  for (const program of programs) {
    if (program.status === "skip") continue;
    counts[resolveStatus(program, book, now, watch.includes(program.id))] += 1;
  }
  return counts;
}

export type DayBucket = {
  key: string;
  label: string;
  programs: FundingProgram[];
};

export function scheduleDays(programs: FundingProgram[], now: Date, days = 14): DayBucket[] {
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
  const buckets = new Map<string, FundingProgram[]>();
  for (const program of programs) {
    if (!program.closeAt || !isOpen(program.closeAt, now)) continue;
    const key = fmt.format(new Date(program.closeAt));
    const list = buckets.get(key) ?? [];
    list.push(program);
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
    out.push({ key, label: label.format(d), programs: list });
  }
  return out;
}

export const poolOrder: FundingKind[] = ["grant", "incubation", "angel", "cvc", "platform"];

export function inPool(program: FundingProgram, kind: FundingKind): boolean {
  if (program.status === "skip") return false;
  return program.kind === kind;
}

export function urgencyRank(program: FundingProgram, now: Date): number {
  const order = { now: 0, soon: 1, week: 2, open: 3 } as const;
  return order[urgency(program.closeAt, now)];
}
