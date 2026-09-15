"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isFundingOwner } from "@/lib/funding/gate";
import { useFamilySession } from "@/lib/family-session";
import type { Locale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n";
import { t } from "@/lib/messages";

export function FundingNavLink({
  locale,
  variant = "header",
}: {
  locale: Locale;
  variant?: "header" | "rail" | "footer" | "home";
}) {
  const session = useFamilySession();
  const pathname = usePathname() || "/";
  if (!isFundingOwner(session?.email)) return null;

  const m = t(locale);
  const href = localizeHref("/funding", locale);
  const on = pathname === href || pathname.endsWith("/funding");

  if (variant === "home") {
    return (
      <Link href={href} className="btn btn-ghost">
        {m.nav.funding}
      </Link>
    );
  }

  if (variant === "footer") {
    return (
      <Link href={href} className="text-accent hover:text-accent-hover">
        {m.nav.funding}
      </Link>
    );
  }

  if (variant === "rail") {
    return (
      <Link href={href} className="shrink-0 text-[12px] font-medium text-muted hover:text-fg">
        {m.nav.funding}
      </Link>
    );
  }

  return (
    <Link href={href} className={on ? "nav-link is-on" : "nav-link"}>
      {m.nav.funding}
    </Link>
  );
}
