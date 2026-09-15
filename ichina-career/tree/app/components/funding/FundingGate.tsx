"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PretextLines } from "@/app/components/PretextLines";
import { FUNDING_OWNER_EMAIL, isFundingOwner } from "@/lib/funding/gate";
import { verifyFundingOwner } from "@/lib/funding/verify-owner";
import { useFamilySession } from "@/lib/family-session";
import type { Locale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n";
import {
  exchangeSsoToken,
  familySsoUrl,
  readFamilySession,
  signOutFamilySession,
  ssoTokenFromSearch,
  writeFamilySession,
} from "@/lib/jubit-sso";
import { t } from "@/lib/messages";
import "../career/career.css";

const FundingView = dynamic(() => import("./FundingView").then((mod) => ({ default: mod.FundingView })), {
  ssr: false,
});

const exchanges = new Map<string, ReturnType<typeof exchangeSsoToken>>();

function exchangeOnce(token: string) {
  const existing = exchanges.get(token);
  if (existing) return existing;
  const pending = exchangeSsoToken(token);
  exchanges.set(token, pending);
  void pending.then((result) => {
    if (!result.ok) exchanges.delete(token);
  });
  return pending;
}

type Phase = "working" | "in" | "out" | "denied";

export function FundingGate({ locale = "en" }: { locale?: Locale }) {
  const session = useFamilySession();
  const [phase, setPhase] = useState<Phase>("working");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const token = ssoTokenFromSearch(params);
      if (token) {
        const result = await exchangeOnce(token);
        if (cancelled) return;
        if (result.ok) {
          writeFamilySession(result.session);
          const url = new URL(window.location.href);
          url.searchParams.delete("sso_token");
          url.searchParams.delete("token");
          url.searchParams.delete("exchange_token");
          window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        }
      }

      const current = readFamilySession();
      if (!current) {
        if (!cancelled) setPhase("out");
        return;
      }
      if (!isFundingOwner(current.email)) {
        if (!cancelled) setPhase("denied");
        return;
      }
      const ok = await verifyFundingOwner(current);
      if (cancelled) return;
      setPhase(ok ? "in" : "denied");
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (phase === "in") return <FundingView locale={locale} />;
  return <FundingLock locale={locale} phase={phase} />;
}

export function FundingLock({ locale, phase }: { locale: Locale; phase: Phase }) {
  const pathname = usePathname() || "/funding";
  const m = t(locale);
  const c = m.fundingPage;
  const href = (path: string) => localizeHref(path, locale);
  const signInHref = familySsoUrl({ next: pathname });

  return (
    <main className="career-field">
      <section className="page-x mx-auto flex min-h-[58vh] max-w-lg items-center py-10 sm:min-h-[70vh] sm:py-16">
        <div className="card w-full p-5 sm:p-8">
          <p className="kicker">{c.gateKicker}</p>
          <PretextLines
            text={c.gateTitle}
            as="h1"
            locale={locale}
            className="mt-3 font-display text-[1.7rem] leading-[1.05] tracking-tight text-fg sm:text-4xl"
          />
          {phase === "working" ? (
            <p className="mt-5 text-sm leading-relaxed text-muted">{c.gateWorking}</p>
          ) : null}
          {phase === "out" ? (
            <>
              <p className="mt-5 text-sm leading-relaxed text-muted">{c.gateLead}</p>
              <p className="mt-3 font-mono text-[12px] text-accent">Google · {FUNDING_OWNER_EMAIL}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={signInHref} className="btn btn-primary cta-pop">
                  {c.gateSignIn}
                </a>
                <Link href={href("/")} className="btn btn-ghost">
                  {m.auth.goHome}
                </Link>
              </div>
            </>
          ) : null}
          {phase === "denied" ? (
            <>
              <p className="mt-5 text-sm leading-relaxed text-secondary">{c.gateDenied}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{c.gateDeniedHint}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary" onClick={() => void signOutFamilySession()}>
                  {m.cta.signOut}
                </button>
                <a href={signInHref} className="btn btn-ghost">
                  {c.gateSignIn}
                </a>
                <Link href={href("/")} className="btn btn-ghost">
                  {m.auth.goHome}
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
