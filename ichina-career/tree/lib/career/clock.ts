const HK = "Asia/Hong_Kong";

export function hkNow(now = new Date()): Date {
  return now;
}

export function formatHk(now = new Date(), opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HK,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...opts,
  }).format(now);
}

export function formatHkDate(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HK,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function msUntil(iso: string, now = new Date()): number {
  return new Date(iso).getTime() - now.getTime();
}

export function isOpen(iso: string | undefined, now = new Date()): boolean {
  if (!iso) return true;
  return new Date(iso).getTime() > now.getTime();
}

export function urgency(iso: string | undefined, now = new Date()): "now" | "soon" | "week" | "open" {
  if (!iso) return "open";
  const ms = msUntil(iso, now);
  if (ms <= 0) return "now";
  if (ms <= 36 * 3600 * 1000) return "now";
  if (ms <= 4 * 24 * 3600 * 1000) return "soon";
  if (ms <= 10 * 24 * 3600 * 1000) return "week";
  return "open";
}

export function countdown(iso: string, now = new Date()): string {
  const ms = msUntil(iso, now);
  if (ms <= 0) return "closed";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 1) return `${d}d ${h}h`;
  if (d === 1) return `1d ${h}h`;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}
