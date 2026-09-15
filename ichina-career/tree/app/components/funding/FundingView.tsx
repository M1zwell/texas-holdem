"use client";

/** Owner-only field. Mount only behind FundingGate. Independent of /career. */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/app/components/Reveal";
import "../career/career.css";
import { PretextLines } from "@/app/components/PretextLines";
import type { Locale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n";
import { signOutFamilySession } from "@/lib/jubit-sso";
import { t } from "@/lib/messages";
import { links } from "@/lib/site";
import { countdown, formatHk, formatHkDate, isOpen, urgency } from "@/lib/career/clock";
import { fundingDesk } from "@/lib/funding/desk";
import {
  type FundingPane,
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
} from "@/lib/funding/hunt";
import {
  fundingNeed,
  inField,
  nextMoves,
  programs,
  snapshot,
  sortField,
  type FieldFilter,
} from "@/lib/funding/programs";
import type { Felt, FundingProgram } from "@/lib/funding/types";

const DESK_KEY = "ichina-funding-desk";

const filters: FieldFilter[] = ["all", "grant", "incubation", "angel", "cvc", "platform"];

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

function paneFromLocation(): FundingPane {
  try {
    const q = new URLSearchParams(window.location.search).get("pane");
    const hash = window.location.hash.replace("#", "");
    const stored = localStorage.getItem(PANE_KEY);
    const candidate = (q || hash || stored || "dash") as FundingPane;
    if (panes.includes(candidate)) return candidate;
  } catch {
    /* private mode */
  }
  return "dash";
}

export function FundingView({ locale = "en" }: { locale?: Locale }) {
  const m = t(locale);
  const c = m.fundingPage;
  const zh = locale === "zh-Hans" || locale === "zh-Hant";
  const now = useNow();
  const [pane, setPane] = useState<FundingPane>("dash");
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

  const persistPane = (next: FundingPane) => {
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
    () => programs.filter((p) => p.status === "live" || p.status === "watch"),
    [],
  );

  const field = useMemo(() => {
    const list = live.filter((p) => inField(p, filter));
    return sortField(list, now).sort((a, b) => {
      if (pane !== "match") return 0;
      return matchScore(b) - matchScore(a);
    });
  }, [filter, now, pane, live]);

  const moves = useMemo(() => nextMoves(now), [now]);
  const closing = live.filter((p) => p.closeAt && isOpen(p.closeAt, now) && urgency(p.closeAt, now) === "now");
  const week = useMemo(() => scheduleDays(live, now, 10), [now, live]);
  const counts = useMemo(() => progressCounts(live, book, now, watch), [book, now, watch, live]);
  const ranked = useMemo(
    () => [...live].filter((p) => isOpen(p.closeAt, now)).sort((a, b) => matchScore(b) - matchScore(a)),
    [now, live],
  );

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    for (const id of watch) {
      const program = programs.find((p) => p.id === id);
      if (!program?.closeAt || urgency(program.closeAt, now) !== "now") continue;
      const key = `ichina-funding-ping-${program.id}-${program.closeAt}`;
      try {
        if (sessionStorage.getItem(key)) continue;
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
      new Notification(`${program.org} · ${countdown(program.closeAt, now)}`, {
        body: program.title,
      });
    }
  }, [now, watch]);

  const askNotify = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    await Notification.requestPermission();
  };

  const paneLabel: Record<FundingPane, string> = {
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

  const kindLabel: Record<FieldFilter, string> = {
    all: c.all,
    grant: c.grant,
    incubation: c.incubation,
    angel: c.angel,
    cvc: c.cvc,
    platform: c.platform,
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
            {closing.slice(0, 3).map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => persistPane("schedule")}
                className="career-chip career-chip-now"
              >
                {program.org}
                <span className="font-mono text-[10px]">{countdown(program.closeAt!, now)}</span>
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
                {day.programs.length === 0 ? (
                  <p className="mt-3 text-[12px] text-muted">{c.scheduleEmpty}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {day.programs.map((program) => (
                      <li key={program.id}>
                        <a href={`#program-${program.id}`} onClick={() => persistPane("match")} className="text-[13px] text-fg hover:text-accent">
                          {program.org}
                        </a>
                        <p className="font-mono text-[10px] text-muted">
                          {program.closeAt ? countdown(program.closeAt, now) : c.noClose}
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
                  {kindLabel[id]}
                </button>
              ))}
            </div>
          </div>

          {field.length === 0 ? (
            <p className="mt-10 text-sm text-muted">{c.filterEmpty}</p>
          ) : (
            <ul className="mt-8 space-y-4">
              {field.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  now={now}
                  desk={pane === "desk"}
                  zh={zh}
                  copy={c}
                  status={resolveStatus(program, book, now, watch.includes(program.id))}
                  statusLabel={statusLabel}
                  watching={watch.includes(program.id)}
                  onWatch={() => {
                    const next = watch.includes(program.id) ? watch.filter((id) => id !== program.id) : [...watch, program.id];
                    persistWatch(next);
                    void askNotify();
                  }}
                  onStatus={(status) => setBook(setHuntStatus(book, program.id, status))}
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
            {poolOrder.map((kind) => {
              const list = sortField(live.filter((p) => inPool(p, kind)), now);
              return (
                <article key={kind} className="rounded-[16px] border border-hair bg-surface/70 p-4">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{c[kind]}</p>
                  <p className="mt-2 font-display text-3xl">{list.length}</p>
                  <ul className="mt-4 space-y-2">
                    {list.slice(0, 5).map((program) => (
                      <li key={program.id}>
                        <button type="button" className="text-left text-[13px] hover:text-accent" onClick={() => persistPane("match")}>
                          {program.org}
                        </button>
                        <p className="font-mono text-[10px] text-muted">{matchScore(program).toFixed(1)}</p>
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
                {sortField(live, now).map((program) => {
                  const status = resolveStatus(program, book, now, watch.includes(program.id));
                  return (
                    <tr key={program.id} className="border-t border-hair">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{program.org}</p>
                        <p className="text-muted">{zh ? program.titleZh : program.title}</p>
                      </td>
                      <td className="pr-4">
                        <select
                          className="career-select"
                          value={status}
                          onChange={(e) => setBook(setHuntStatus(book, program.id, e.target.value as HuntStatus))}
                          aria-label={c.setStatus}
                        >
                          {huntStatuses.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusLabel[statusOption]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="pr-4 font-mono text-[12px] text-accent">{matchScore(program).toFixed(1)}</td>
                      <td className="font-mono text-[12px] text-muted">
                        {program.closeAt ? countdown(program.closeAt, now) : c.noClose}
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
            <Link href={href("/career")} className="btn btn-ghost">
              {m.nav.career}
            </Link>
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
  moves: FundingProgram[];
  week: ReturnType<typeof scheduleDays>;
  ranked: FundingProgram[];
  copy: ReturnType<typeof t>["fundingPage"];
  onOpen: (pane: FundingPane) => void;
}) {
  const m = t(locale);
  const href = (path: string) => localizeHref(path, locale);
  const stats = [
    { label: copy.statLive, value: programs.filter((p) => p.status === "live").length },
    { label: copy.statClosing, value: week.reduce((n, d) => n + d.programs.length, 0) },
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
        <p className="mt-5 font-mono text-[12px] text-accent">{fundingDesk.ownerEmail}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary">
          {zh ? snapshot.thesisZh : snapshot.thesis}
        </p>
        <p className="mt-3 text-[12px] text-muted">{zh ? fundingDesk.dualTrack.zh : fundingDesk.dualTrack.en}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={links.emailGmail} className="btn btn-primary cta-pop">
            {copy.writeYok}
          </a>
          <Link href={href("/career")} className="btn btn-ghost">
            {m.nav.career}
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
        <p className="kicker">{copy.needKicker}</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight">{copy.needTitle}</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {fundingNeed.map((item) => (
            <li key={item} className="rounded-[16px] border border-accent/25 bg-deep/50 p-4">
              <p className="text-sm leading-relaxed text-secondary">{item}</p>
            </li>
          ))}
        </ul>
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

      <section className="page-x mx-auto max-w-5xl pb-12">
        <Reveal>
          <p className="kicker">{copy.suggestKicker}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">{copy.suggestTitle}</h2>
          <ol className="mt-6 space-y-3">
            {moves.map((program, i) => (
              <li key={program.id} className="flex gap-4 border-t border-hair pt-3">
                <span className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <button type="button" onClick={() => onOpen("match")} className="font-medium text-fg hover:text-accent">
                    {program.org} · {zh ? program.titleZh : program.title}
                  </button>
                  <p className="mt-1 text-[13px] text-muted">
                    {program.closeAt ? `${countdown(program.closeAt, now)} · ${formatHkDate(program.closeAt)}` : copy.noClose}
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
          {ranked.slice(0, 6).map((program) => (
            <li key={program.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-hair pt-3">
              <button type="button" className="text-left" onClick={() => onOpen("match")}>
                <span className="font-medium">{program.org}</span>
                <span className="ml-2 text-muted">{zh ? program.titleZh : program.title}</span>
              </button>
              <span className="font-mono text-[12px] text-accent">{matchScore(program).toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function ProgramCard({
  program,
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
  program: FundingProgram;
  now: Date;
  desk: boolean;
  zh: boolean;
  copy: ReturnType<typeof t>["fundingPage"];
  status: HuntStatus;
  statusLabel: Record<HuntStatus, string>;
  watching: boolean;
  onWatch: () => void;
  onStatus: (status: HuntStatus) => void;
}) {
  const open = isOpen(program.closeAt, now);
  const u = urgency(program.closeAt, now);
  const title = zh ? program.titleZh : program.title;

  return (
    <li id={`program-${program.id}`}>
      <article className="rounded-[20px] border border-hair bg-surface/60 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              <span>{program.org}</span>
              <span className="career-chip">{copy[program.kind]}</span>
              {u === "now" && open ? <span className="career-chip career-chip-now">{copy.today}</span> : null}
              {!open && program.closeAt ? <span className="career-chip">{copy.closed}</span> : null}
              {program.status === "watch" ? <span className="career-chip">{copy.watch}</span> : null}
              <span className="career-chip is-on">{statusLabel[status]}</span>
            </p>
            <h3 className="mt-2 font-display text-[1.55rem] leading-[1.05] tracking-tight sm:text-3xl">{title}</h3>
          </div>
          <p className="font-mono text-[11px] text-accent">
            {copy.whyMatch} {matchScore(program).toFixed(1)}
            {program.closeAt ? ` · ${countdown(program.closeAt, now)}` : ` · ${copy.noClose}`}
          </p>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary">{program.closeNote}</p>
        <p className="mt-2 max-w-2xl text-[13px] text-muted">{matchWhy(program, zh)}</p>
        {program.skipWhy ? <p className="mt-2 text-[12px] text-muted">{program.skipWhy}</p> : null}

        <div className="mt-5 grid max-w-md gap-2">
          <FeltRow value={program.burden} label={copy.burden} />
          <FeltRow value={program.leverage} label={copy.leverage} />
          <FeltRow value={program.halo} label={copy.halo} />
          <FeltRow value={program.fit} label={copy.fit} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a href={program.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {copy.openProgram}
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

        {desk ? (
          <div className="mt-5 rounded-xl border border-hair bg-bg/40 p-4 font-mono text-[12px] leading-relaxed text-secondary">
            <p>{program.apply}</p>
            {program.officialMail ? <p className="mt-2">{program.officialMail}</p> : null}
            {program.draft ? <p className="mt-2 text-accent">draft {program.draft}</p> : null}
            <p className="mt-2 text-muted">{program.caution}</p>
          </div>
        ) : null}
      </article>
    </li>
  );
}
