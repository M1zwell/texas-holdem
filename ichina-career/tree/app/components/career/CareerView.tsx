"use client";

/** Owner-only field. Mount only behind CareerGate. */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/app/components/Reveal";
import "./career.css";
import { PretextLines } from "@/app/components/PretextLines";
import type { Locale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n";
import { signOutFamilySession } from "@/lib/jubit-sso";
import { t } from "@/lib/messages";
import { links } from "@/lib/site";
import { countdown, formatHk, formatHkDate, isOpen, urgency } from "@/lib/career/clock";
import {
  type CareerPane,
  type HuntBook,
  type HuntStatus,
  PANE_KEY,
  WATCH_KEY,
  huntStatuses,
  inPool,
  matchScore,
  matchWhy,
  panes,
  poolOrder,
  progressCounts,
  readHunt,
  resolveStatus,
  scheduleDays,
  setHuntStatus,
} from "@/lib/career/hunt";
import { careerOwner, priorSeats, seats } from "@/lib/career/profile";
import { proofs } from "@/lib/career/proof";
import { inField, nextMoves, roles, snapshot, sortField, type FieldFilter } from "@/lib/career/roles";
import type { CareerRole, Felt } from "@/lib/career/types";

const DESK_KEY = "ichina-career-desk";

const filters: FieldFilter[] = ["all", "today", "institutions", "capital", "cvc", "stretch"];

function FeltRow({ value, label }: { value: Felt; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] tracking-[0.14em] text-muted uppercase">{label}</span>
      <span className="flex gap-1" aria-hidden>
        {([1, 2, 3, 4, 5] as Felt[]).map((n) => (
          <i
            key={n}
            className={
              n <= value
                ? "h-1.5 w-1.5 rounded-full bg-accent"
                : "h-1.5 w-1.5 rounded-full bg-line"
            }
          />
        ))}
      </span>
      <span className="sr-only">
        {label} {value} of 5
      </span>
    </div>
  );
}

function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

function paneFromLocation(): CareerPane {
  try {
    const q = new URLSearchParams(window.location.search).get("pane");
    const hash = window.location.hash.replace("#", "");
    const stored = localStorage.getItem(PANE_KEY);
    const candidate = (q || hash || stored || "dash") as CareerPane;
    if (panes.includes(candidate)) return candidate;
  } catch {
    /* private mode */
  }
  return "dash";
}

export function CareerView({ locale = "en" }: { locale?: Locale }) {
  const m = t(locale);
  const c = m.careerPage;
  const zh = locale === "zh-Hans" || locale === "zh-Hant";
  const now = useNow();
  const [pane, setPane] = useState<CareerPane>("dash");
  const [filter, setFilter] = useState<FieldFilter>("all");
  const [watch, setWatch] = useState<string[]>([]);
  const [book, setBook] = useState<HuntBook>({});
  const href = (path: string) => localizeHref(path, locale);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCH_KEY);
      if (raw) setWatch(JSON.parse(raw) as string[]);
      setBook(readHunt());
      setPane(paneFromLocation());
    } catch {
      /* ignore */
    }
  }, []);

  const persistPane = (next: CareerPane) => {
    setPane(next);
    try {
      localStorage.setItem(PANE_KEY, next);
      const url = new URL(window.location.href);
      url.searchParams.set("pane", next);
      url.hash = next;
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* ignore */
    }
  };

  const persistWatch = (ids: string[]) => {
    setWatch(ids);
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(ids));
      localStorage.setItem(DESK_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const live = useMemo(
    () => roles.filter((r) => r.status === "live" || r.status === "watch"),
    [],
  );

  const field = useMemo(() => {
    const list = live.filter((r) => inField(r, filter, now));
    return sortField(list, now).sort((a, b) => {
      if (pane !== "match") return 0;
      return matchScore(b) - matchScore(a);
    });
  }, [filter, now, pane, live]);

  const moves = useMemo(() => nextMoves(now), [now]);
  const closing = live.filter((r) => r.closeAt && isOpen(r.closeAt, now) && urgency(r.closeAt, now) === "now");
  const week = useMemo(() => scheduleDays(live, now, 10), [now, live]);
  const counts = useMemo(() => progressCounts(live, book, now, watch), [book, now, watch, live]);
  const ranked = useMemo(
    () => [...live].filter((r) => isOpen(r.closeAt, now)).sort((a, b) => matchScore(b) - matchScore(a)),
    [now, live],
  );

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    for (const id of watch) {
      const role = roles.find((r) => r.id === id);
      if (!role?.closeAt || urgency(role.closeAt, now) !== "now") continue;
      const key = `ichina-career-ping-${role.id}-${role.closeAt}`;
      try {
        if (sessionStorage.getItem(key)) continue;
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
      new Notification(`${role.org} · ${countdown(role.closeAt, now)}`, {
        body: role.title,
      });
    }
  }, [now, watch]);

  const askNotify = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    await Notification.requestPermission();
  };

  const paneLabel: Record<CareerPane, string> = {
    dash: c.paneDash,
    schedule: c.paneSchedule,
    match: c.paneMatch,
    pools: c.panePools,
    progress: c.paneProgress,
    desk: c.paneDesk,
  };

  const statusLabel: Record<HuntStatus, string> = {
    pooled: c.statusPooled,
    matched: c.statusMatched,
    watching: c.statusWatching,
    queued: c.statusQueued,
    drafted: c.statusDrafted,
    applied: c.statusApplied,
    interview: c.statusInterview,
    hold: c.statusHold,
    skipped: c.statusSkipped,
    closed: c.statusClosed,
  };

  return (
    <main className="career-field">
      <div className="career-clock glass-header sticky top-[5.75rem] z-30 border-b border-hair sm:top-[3.6rem] lg:top-[3.35rem]">
        <div className="page-x mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 py-2">
          <p className="font-mono text-[11px] tracking-wide text-muted">
            <span className="mr-1.5 text-accent">香港</span>
            {c.clockLabel} · {formatHk(now)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {closing.slice(0, 3).map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => persistPane("schedule")}
                className="career-chip career-chip-now"
              >
                {role.org}
                <span className="font-mono text-[10px]">{countdown(role.closeAt!, now)}</span>
              </button>
            ))}
            <span className="hidden font-mono text-[10px] text-muted sm:inline">{c.signedInAs}</span>
            <button type="button" className="career-chip" onClick={() => void signOutFamilySession()}>
              {m.cta.signOut}
            </button>
          </div>
        </div>
        <div className="page-x mx-auto flex max-w-6xl flex-wrap gap-1 pb-2" role="tablist" aria-label={c.paneDash}>
          {panes.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={pane === id}
              onClick={() => persistPane(id)}
              className={pane === id ? "career-chip is-on" : "career-chip"}
            >
              {paneLabel[id]}
            </button>
          ))}
        </div>
      </div>

      {pane === "dash" ? (
        <Dashboard
          locale={locale}
          zh={zh}
          now={now}
          counts={counts}
          moves={moves}
          week={week}
          ranked={ranked}
          copy={c}
          onOpen={persistPane}
        />
      ) : null}

      {pane === "schedule" ? (
        <section className="page-x mx-auto max-w-6xl py-10 pb-20">
          <p className="kicker">{c.scheduleKicker}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">{c.scheduleTitle}</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {week.map((day) => (
              <li key={day.key} className="career-day rounded-[16px] border border-hair bg-surface/70 p-4">
                <p className="font-mono text-[11px] text-accent">{day.label}</p>
                {day.roles.length === 0 ? (
                  <p className="mt-3 text-[12px] text-muted">{c.scheduleEmpty}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {day.roles.map((role) => (
                      <li key={role.id}>
                        <a href={`#role-${role.id}`} onClick={() => persistPane("match")} className="text-[13px] text-fg hover:text-accent">
                          {role.org}
                        </a>
                        <p className="font-mono text-[10px] text-muted">
                          {role.closeAt ? countdown(role.closeAt, now) : c.noClose}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {pane === "match" || pane === "desk" ? (
        <section className="page-x mx-auto max-w-6xl pb-20 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">{c.matchKicker}</p>
              <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">{c.matchTitle}</h2>
              <p className="mt-3 max-w-xl text-sm text-muted">{c.matchLead}</p>
            </div>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={c.fieldTitle}>
              {filters.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                  className={filter === id ? "career-chip is-on" : "career-chip"}
                >
                  {c[id]}
                </button>
              ))}
            </div>
          </div>

          {field.length === 0 ? (
            <p className="mt-10 text-sm text-muted">{c.filterEmpty}</p>
          ) : (
            <ul className="mt-8 space-y-4">
              {field.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  now={now}
                  desk={pane === "desk"}
                  zh={zh}
                  copy={c}
                  status={resolveStatus(role, book, now, watch.includes(role.id))}
                  statusLabel={statusLabel}
                  watching={watch.includes(role.id)}
                  onWatch={() => {
                    const next = watch.includes(role.id) ? watch.filter((id) => id !== role.id) : [...watch, role.id];
                    persistWatch(next);
                    void askNotify();
                  }}
                  onStatus={(status) => setBook(setHuntStatus(book, role.id, status))}
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {pane === "pools" ? (
        <section className="page-x mx-auto max-w-6xl py-10 pb-20">
          <p className="kicker">{c.poolKicker}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">{c.poolTitle}</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            {poolOrder.map((band) => {
              const list = sortField(
                live.filter((r) => inPool(r, band, now)),
                now,
              );
              return (
                <article key={band} className="rounded-[16px] border border-hair bg-surface/70 p-4">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{c[band]}</p>
                  <p className="mt-2 font-display text-3xl">{list.length}</p>
                  <ul className="mt-4 space-y-2">
                    {list.slice(0, 5).map((role) => (
                      <li key={role.id}>
                        <button type="button" className="text-left text-[13px] hover:text-accent" onClick={() => persistPane("match")}>
                          {role.org}
                        </button>
                        <p className="font-mono text-[10px] text-muted">{matchScore(role).toFixed(1)}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {pane === "progress" ? (
        <section className="page-x mx-auto max-w-6xl py-10 pb-20">
          <p className="kicker">{c.progressKicker}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">{c.progressTitle}</h2>
          <p className="mt-3 max-w-xl text-sm text-muted">{c.progressLead}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {huntStatuses.map((status) => (
              <span key={status} className="career-chip">
                {statusLabel[status]}
                <span className="font-mono text-[10px]">{counts[status]}</span>
              </span>
            ))}
          </div>
          <div className="mt-8 overflow-x-auto">
            <table className="career-table w-full text-left text-[13px]">
              <thead>
                <tr className="text-[11px] tracking-[0.12em] text-muted uppercase">
                  <th className="pb-3">{c.fieldTitle}</th>
                  <th>{c.paneProgress}</th>
                  <th>{c.fit}</th>
                  <th>{c.clockLabel}</th>
                </tr>
              </thead>
              <tbody>
                {sortField(live, now).map((role) => {
                  const status = resolveStatus(role, book, now, watch.includes(role.id));
                  return (
                    <tr key={role.id} className="border-t border-hair">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{role.org}</p>
                        <p className="text-muted">{zh && role.titleZh ? role.titleZh : role.title}</p>
                      </td>
                      <td className="pr-4">
                        <select
                          className="career-select"
                          value={status}
                          onChange={(e) => setBook(setHuntStatus(book, role.id, e.target.value as HuntStatus))}
                          aria-label={c.setStatus}
                        >
                          {huntStatuses.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusLabel[statusOption]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="pr-4 font-mono text-[12px] text-accent">{matchScore(role).toFixed(1)}</td>
                      <td className="font-mono text-[12px] text-muted">
                        {role.closeAt ? countdown(role.closeAt, now) : c.noClose}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {pane === "dash" ? null : (
        <section className="page-x mx-auto max-w-5xl pb-16">
          <p className="text-[12px] text-muted">
            {c.deskHint} {c.publicNote}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={askNotify} className="btn btn-ghost">
              {c.notifyAsk}
            </button>
            <Link href={href("/products")} className="btn btn-ghost">
              {m.cta.allProducts}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

function Dashboard({
  locale,
  zh,
  now,
  counts,
  moves,
  week,
  ranked,
  copy,
  onOpen,
}: {
  locale: Locale;
  zh: boolean;
  now: Date;
  counts: ReturnType<typeof progressCounts>;
  moves: CareerRole[];
  week: ReturnType<typeof scheduleDays>;
  ranked: CareerRole[];
  copy: ReturnType<typeof t>["careerPage"];
  onOpen: (pane: CareerPane) => void;
}) {
  const m = t(locale);
  const href = (path: string) => localizeHref(path, locale);
  const stats = [
    { label: copy.statLive, value: roles.filter((r) => r.status === "live").length },
    { label: copy.statClosing, value: week.reduce((n, d) => n + d.roles.length, 0) },
    { label: copy.statWatching, value: counts.watching },
    { label: copy.statDrafted, value: counts.drafted },
    { label: copy.statApplied, value: counts.applied },
  ];

  return (
    <>
      <section className="page-x mx-auto max-w-5xl pt-12 pb-10 sm:pt-16">
        <p className="kicker">{copy.kicker}</p>
        <PretextLines
          text={copy.title}
          as="h1"
          locale={locale}
          className="mt-4 font-display text-[clamp(2.3rem,6.6vw,4.3rem)] leading-[0.98] tracking-tight"
        />
        <p className="mt-5 font-mono text-[12px] text-accent">{careerOwner.email}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary">
          {zh ? snapshot.thesisZh : snapshot.thesis}
        </p>
        <p className="mt-3 text-[12px] text-muted">{zh ? careerOwner.cityuZh : careerOwner.cityu}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={links.emailGmail} className="btn btn-primary cta-pop">
            {copy.writeYok}
          </a>
          <Link href={href("/products")} className="btn btn-ghost">
            {m.cta.allProducts}
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => onOpen("schedule")}>
            {copy.paneSchedule}
          </button>
        </div>
        <p className="mt-5 font-mono text-[11px] text-muted">
          {copy.updated} · {formatHk(new Date(snapshot.updatedAt))}
        </p>
      </section>

      <section className="page-x mx-auto max-w-6xl pb-12">
        <p className="kicker">{copy.profileKicker}</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight">{copy.profileTitle}</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {seats.map((seat) => (
            <li key={seat.id} className="rounded-[16px] border border-accent/25 bg-deep/50 p-4">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                {zh ? seat.titleZh : seat.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{zh ? seat.orgZh : seat.org}</p>
              {seat.since ? <p className="mt-2 font-mono text-[11px] text-accent">since {seat.since}</p> : null}
              {seat.confidential ? <p className="mt-2 text-[11px] text-muted">{copy.confidential}</p> : null}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-muted">
          {copy.priorNote}{" "}
          {priorSeats.map((seat) => (zh ? `${seat.titleZh} · ${seat.orgZh}` : `${seat.title} · ${seat.org}`)).join(" · ")}
        </p>
      </section>

      <section className="page-x mx-auto max-w-6xl pb-12">
        <div className="grid gap-3 sm:grid-cols-5">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => onOpen("progress")}
              className="rounded-[16px] border border-hair bg-surface/70 p-4 text-left"
            >
              <p className="text-[11px] tracking-[0.12em] text-muted uppercase">{stat.label}</p>
              <p className="mt-2 font-display text-3xl">{stat.value}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="page-x mx-auto max-w-6xl pb-12">
        <Reveal>
          <p className="kicker">{copy.proofKicker}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">{copy.proofTitle}</h2>
          <p className="mt-3 max-w-xl text-sm text-muted">{copy.proofLead}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {proofs.map((p) => (
              <li key={p.id}>
                <a
                  href={p.href}
                  target={p.href.startsWith("http") ? "_blank" : undefined}
                  rel={p.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="career-proof group block h-full rounded-[16px] border border-hair bg-surface/70 p-4 transition-colors hover:border-accent/40"
                >
                  <p className="font-display text-xl tracking-tight group-hover:text-accent">{p.title}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{zh ? p.tacitZh : p.tacit}</p>
                  <p className="mt-3 font-mono text-[10px] text-accent">{p.path}</p>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="page-x mx-auto max-w-5xl pb-12">
        <Reveal>
          <p className="kicker">{copy.suggestKicker}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">{copy.suggestTitle}</h2>
          <ol className="mt-6 space-y-3">
            {moves.map((role, i) => (
              <li key={role.id} className="flex gap-4 border-t border-hair pt-3">
                <span className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <button type="button" onClick={() => onOpen("match")} className="font-medium text-fg hover:text-accent">
                    {role.org} · {zh && role.titleZh ? role.titleZh : role.title}
                  </button>
                  <p className="mt-1 text-[13px] text-muted">
                    {role.closeAt ? `${countdown(role.closeAt, now)} · ${formatHkDate(role.closeAt)}` : copy.noClose}
                    {role.confirmSeat ? ` · ${copy.confirmSeat}` : ""}
                    {role.stretch ? ` · ${copy.stretchNote}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className="page-x mx-auto max-w-6xl pb-20">
        <p className="kicker">{copy.matchKicker}</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight">{copy.matchTitle}</h2>
        <ul className="mt-6 space-y-3">
          {ranked.slice(0, 6).map((role) => (
            <li key={role.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-hair pt-3">
              <button type="button" className="text-left" onClick={() => onOpen("match")}>
                <span className="font-medium">{role.org}</span>
                <span className="ml-2 text-muted">{zh && role.titleZh ? role.titleZh : role.title}</span>
              </button>
              <span className="font-mono text-[12px] text-accent">{matchScore(role).toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function RoleCard({
  role,
  now,
  desk,
  zh,
  copy,
  status,
  statusLabel,
  watching,
  onWatch,
  onStatus,
}: {
  role: CareerRole;
  now: Date;
  desk: boolean;
  zh: boolean;
  copy: ReturnType<typeof t>["careerPage"];
  status: HuntStatus;
  statusLabel: Record<HuntStatus, string>;
  watching: boolean;
  onWatch: () => void;
  onStatus: (status: HuntStatus) => void;
}) {
  const open = isOpen(role.closeAt, now);
  const u = urgency(role.closeAt, now);
  const title = zh && role.titleZh ? role.titleZh : role.title;
  const rhyme = zh ? role.rhymeZh : role.rhyme;

  return (
    <li id={`role-${role.id}`}>
      <article
        className={
          role.tier === "ideal"
            ? "rounded-[20px] border border-accent/35 bg-deep/70 p-5 sm:p-7"
            : "rounded-[20px] border border-hair bg-surface/60 p-5 sm:p-7"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              <span>{role.tier === "ideal" ? copy.ideal : role.org}</span>
              {role.tier === "ideal" ? <span className="text-accent">{role.org}</span> : null}
              {u === "now" && open ? <span className="career-chip career-chip-now">{copy.today}</span> : null}
              {!open && role.closeAt ? <span className="career-chip">{copy.closed}</span> : null}
              {role.stretch ? <span className="career-chip">{copy.stretch}</span> : null}
              <span className="career-chip is-on">{statusLabel[status]}</span>
            </p>
            <h3 className="mt-2 font-display text-[1.55rem] leading-[1.05] tracking-tight sm:text-3xl">{title}</h3>
            <p className="mt-1 text-sm text-secondary">
              {role.org} · {role.location}
            </p>
          </div>
          <p className="font-mono text-[11px] text-accent">
            {copy.whyMatch} {matchScore(role).toFixed(1)}
            {role.closeAt ? ` · ${countdown(role.closeAt, now)}` : ` · ${copy.noClose}`}
          </p>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary">{rhyme}</p>
        <p className="mt-2 max-w-2xl text-[13px] text-muted">{matchWhy(role, zh)}</p>
        {role.closeNote ? <p className="mt-2 text-[12px] text-muted">{role.closeNote}</p> : null}
        {role.confirmSeat ? <p className="mt-2 text-[12px] text-accent">{copy.confirmSeat}</p> : null}

        <div className="mt-5 grid max-w-md gap-2">
          <FeltRow value={role.pay} label={copy.pay} />
          <FeltRow value={role.security} label={copy.security} />
          <FeltRow value={role.reputation} label={copy.reputation} />
          <FeltRow value={role.balance} label={copy.balance} />
          <FeltRow value={role.fit} label={copy.fit} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a href={role.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {copy.openRole}
          </a>
          <button type="button" onClick={onWatch} className={watching ? "btn btn-ghost text-accent" : "btn btn-ghost"}>
            {watching ? copy.reminded : copy.reminder}
          </button>
          <select
            className="career-select"
            value={status}
            onChange={(e) => onStatus(e.target.value as HuntStatus)}
            aria-label={copy.setStatus}
          >
            {huntStatuses.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusLabel[statusOption]}
              </option>
            ))}
          </select>
        </div>

        {desk && role.desk ? (
          <div className="mt-5 rounded-xl border border-hair bg-bg/40 p-4 font-mono text-[12px] leading-relaxed text-secondary">
            <p>{role.desk.apply}</p>
            {role.desk.draft ? <p className="mt-2 text-accent">draft {role.desk.draft}</p> : null}
            {role.desk.addendum ? <p className="mt-1">addendum {role.desk.addendum}</p> : null}
            {role.desk.caution ? <p className="mt-2 text-muted">{role.desk.caution}</p> : null}
            {role.portalOnly ? <p className="mt-2">{copy.portalOnly}</p> : null}
          </div>
        ) : null}
      </article>
    </li>
  );
}
