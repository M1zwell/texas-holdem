"use client";

/** Owner-only field. Mount only behind CareerGate. */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/app/components/Reveal";
import "./career.css";
import { PretextLines } from "@/app/components/PretextLines";
import type { Locale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n";
import { t } from "@/lib/messages";
import { links } from "@/lib/site";
import { countdown, formatHk, formatHkDate, isOpen, urgency } from "@/lib/career/clock";
import { proofs } from "@/lib/career/proof";
import { inField, nextMoves, roles, snapshot, sortField, type FieldFilter } from "@/lib/career/roles";
import type { CareerRole, Felt } from "@/lib/career/types";

const DESK_KEY = "ichina-career-desk";
const WATCH_KEY = "ichina-career-watch";

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

function useDesk() {
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("desk");
      const hash = window.location.hash.replace("#", "");
      const stored = localStorage.getItem(DESK_KEY) === "1";
      setDesk(q === "1" || hash === "desk" || stored);
    } catch {
      /* private mode */
    }
  }, []);
  const toggle = () => {
    setDesk((v) => {
      const next = !v;
      try {
        localStorage.setItem(DESK_KEY, next ? "1" : "0");
        const url = new URL(window.location.href);
        if (next) url.searchParams.set("desk", "1");
        else url.searchParams.delete("desk");
        window.history.replaceState(null, "", url.toString());
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return { desk, toggle };
}

export function CareerView({ locale = "en" }: { locale?: Locale }) {
  const m = t(locale);
  const c = m.careerPage;
  const zh = locale === "zh-Hans" || locale === "zh-Hant";
  const now = useNow();
  const { desk, toggle } = useDesk();
  const [filter, setFilter] = useState<FieldFilter>("all");
  const [watch, setWatch] = useState<string[]>([]);
  const href = (path: string) => localizeHref(path, locale);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCH_KEY);
      if (raw) setWatch(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persistWatch = (ids: string[]) => {
    setWatch(ids);
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  };

  const field = useMemo(() => {
    const list = roles.filter((r) => inField(r, filter, now) && (r.status === "live" || r.status === "watch"));
    return sortField(list, now);
  }, [filter, now]);

  const moves = useMemo(() => nextMoves(now), [now]);
  const closing = roles.filter((r) => r.closeAt && isOpen(r.closeAt, now) && urgency(r.closeAt, now) === "now");

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
              <a
                key={role.id}
                href={`#role-${role.id}`}
                className="career-chip career-chip-now"
              >
                {role.org}
                <span className="font-mono text-[10px]">{countdown(role.closeAt!, now)}</span>
              </a>
            ))}
            <button type="button" onClick={toggle} className={desk ? "career-chip is-on" : "career-chip"}>
              {desk ? c.deskOpen : c.desk}
            </button>
          </div>
        </div>
      </div>

      <section className="page-x mx-auto max-w-5xl pt-12 pb-10 sm:pt-20 sm:pb-14">
        <p className="kicker">{c.kicker}</p>
        <PretextLines
          text={c.title}
          as="h1"
          locale={locale}
          className="mt-4 font-display text-[clamp(2.3rem,6.6vw,4.3rem)] leading-[0.98] tracking-tight"
        />
        <PretextLines
          text={c.lead}
          locale={locale}
          className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted"
        />
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-secondary">
          {zh ? snapshot.thesisZh : snapshot.thesis}
        </p>
        <p className="mt-3 text-[12px] text-muted">{c.cityu}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={links.emailGmail} className="btn btn-primary cta-pop">
            {c.writeYok}
          </a>
          <Link href={href("/products")} className="btn btn-ghost">
            {m.cta.allProducts}
          </Link>
          <a href={links.gghereHk} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
            {m.cta.walkACity}
          </a>
        </div>
        <p className="mt-5 font-mono text-[11px] text-muted">
          {c.updated} · {formatHk(new Date(snapshot.updatedAt))}
        </p>
      </section>

      <section className="page-x mx-auto max-w-6xl pb-16">
        <Reveal>
          <p className="kicker">{c.proofKicker}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">{c.proofTitle}</h2>
          <p className="mt-3 max-w-xl text-sm text-muted">{c.proofLead}</p>
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

      <section className="page-x mx-auto max-w-5xl pb-14">
        <Reveal>
          <p className="kicker">{c.suggestKicker}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">{c.suggestTitle}</h2>
          <ol className="mt-6 space-y-3">
            {moves.map((role, i) => (
              <li key={role.id} className="flex gap-4 border-t border-hair pt-3">
                <span className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <a href={`#role-${role.id}`} className="font-medium text-fg hover:text-accent">
                    {role.org} · {zh && role.titleZh ? role.titleZh : role.title}
                  </a>
                  <p className="mt-1 text-[13px] text-muted">
                    {role.closeAt ? `${countdown(role.closeAt, now)} · ${formatHkDate(role.closeAt)}` : c.noClose}
                    {role.confirmSeat ? ` · ${c.confirmSeat}` : ""}
                    {role.stretch ? ` · ${c.stretchNote}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className="page-x mx-auto max-w-6xl pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">{c.fieldKicker}</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">{c.fieldTitle}</h2>
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
                desk={desk}
                zh={zh}
                copy={c}
                watching={watch.includes(role.id)}
                onWatch={() => {
                  const next = watch.includes(role.id) ? watch.filter((id) => id !== role.id) : [...watch, role.id];
                  persistWatch(next);
                  void askNotify();
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {desk ? (
        <section className="page-x mx-auto max-w-5xl pb-24">
          <div className="rounded-[20px] border border-accent/25 bg-deep/50 p-5 sm:p-8">
            <p className="kicker">{c.deskOpen}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{c.deskHint}</p>
            <p className="mt-4 text-sm text-secondary">{c.publicNote}</p>
            <button type="button" onClick={askNotify} className="btn btn-ghost mt-6">
              {c.notifyAsk}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function RoleCard({
  role,
  now,
  desk,
  zh,
  copy,
  watching,
  onWatch,
}: {
  role: CareerRole;
  now: Date;
  desk: boolean;
  zh: boolean;
  copy: ReturnType<typeof t>["careerPage"];
  watching: boolean;
  onWatch: () => void;
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
            </p>
            <h3 className="mt-2 font-display text-[1.55rem] leading-[1.05] tracking-tight sm:text-3xl">{title}</h3>
            <p className="mt-1 text-sm text-secondary">
              {role.org} · {role.location}
            </p>
          </div>
          <p className="font-mono text-[11px] text-accent">
            {role.closeAt ? countdown(role.closeAt, now) : copy.noClose}
          </p>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary">{rhyme}</p>
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
          <a
            href={role.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            {copy.openRole}
          </a>
          <button type="button" onClick={onWatch} className={watching ? "btn btn-ghost text-accent" : "btn btn-ghost"}>
            {watching ? copy.reminded : copy.reminder}
          </button>
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
