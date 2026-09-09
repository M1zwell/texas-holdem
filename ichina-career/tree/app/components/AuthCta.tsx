"use client";

import { usePathname } from "next/navigation";
import { useFamilySession } from "@/lib/family-session";
import { stripLocale } from "@/lib/i18n";
import { familySsoUrl, signOutFamilySession } from "@/lib/jubit-sso";
import { t } from "@/lib/messages";

export function AuthHeaderButtons() {
  const pathname = usePathname() || "/";
  const { locale } = stripLocale(pathname);
  const m = t(locale);
  const session = useFamilySession();
  const signInHref = familySsoUrl({ next: pathname });
  const registerHref = familySsoUrl({ next: pathname, mode: "register" });

  if (session) {
    return (
      <>
        <span
          className="hidden max-w-[10rem] truncate font-mono text-[11px] text-muted lg:inline"
          title={session.email || m.cta.signedIn}
        >
          {session.email || m.cta.signedIn}
        </span>
        <button type="button" className="btn btn-ghost" onClick={() => void signOutFamilySession()}>
          {m.cta.signOut}
        </button>
      </>
    );
  }

  return (
    <>
      <a href={signInHref} className="btn btn-ghost hidden lg:inline-flex">
        {m.cta.signIn}
      </a>
      <a href={registerHref} className="btn btn-primary cta-pop">
        {m.cta.register}
      </a>
    </>
  );
}

export function AuthRailLink() {
  const pathname = usePathname() || "/";
  const { locale } = stripLocale(pathname);
  const m = t(locale);
  const session = useFamilySession();
  const signInHref = familySsoUrl({ next: pathname });

  if (session) {
    return (
      <button
        type="button"
        onClick={() => void signOutFamilySession()}
        className="shrink-0 text-[12px] font-medium text-accent lg:hidden"
      >
        {m.cta.signOut}
      </button>
    );
  }

  return (
    <a href={signInHref} className="shrink-0 text-[12px] font-medium text-accent lg:hidden">
      {m.cta.signIn}
    </a>
  );
}

export function AuthRegisterLink({ className }: { className?: string }) {
  const pathname = usePathname() || "/";
  const { locale } = stripLocale(pathname);
  const m = t(locale);
  const session = useFamilySession();
  const registerHref = familySsoUrl({ next: pathname, mode: "register" });

  if (session) return null;

  return (
    <a href={registerHref} className={className}>
      {m.cta.register}
    </a>
  );
}
