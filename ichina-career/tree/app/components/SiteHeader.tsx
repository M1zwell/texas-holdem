"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthHeaderButtons, AuthRailLink } from "@/app/components/AuthCta";
import { EnterButton } from "@/app/components/JoinFlow";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { BrandMark } from "@/app/components/BrandMark";
import { LogoMark } from "@/app/components/LogoMark";
import { localizeHref, stripLocale } from "@/lib/i18n";
import { t } from "@/lib/messages";
import { links } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const { locale, path } = stripLocale(pathname);
  const m = t(locale);
  const href = (p: string) => localizeHref(p, locale);
  const nav = [
    { href: "/", label: m.nav.garden },
    { href: "/writing", label: m.nav.writing },
    { href: "/tools", label: m.nav.tools },
    { href: "/products", label: m.nav.products },
    { href: "/career", label: m.nav.career },
    { href: "/game", label: m.nav.game },
    { href: "/share", label: m.nav.share },
  ];

  return (
    <header className="glass-header sticky top-0 z-40 border-b border-hair">
      <div className="page-x mx-auto flex max-w-6xl items-center justify-between gap-2 py-2 sm:gap-3 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href={href("/")} className="shrink-0" aria-label="Yok Zhang garden home">
            <LogoMark size={32} />
          </Link>
          <div className="min-w-0 leading-tight">
            <Link href={href("/")} className="block truncate text-[12px] font-semibold tracking-wide text-fg">
              Yok Zhang
              <span className="mx-2 hidden text-accent sm:inline" aria-hidden>
                ·
              </span>
              <span className="hidden text-muted sm:inline">
                <span className="mr-1.5 text-[13px] font-medium text-accent">香港</span>
                Hong Kong
              </span>
            </Link>
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 hidden items-center gap-1.5 font-mono text-[12px] text-accent transition-colors hover:text-accent-hover sm:inline-flex"
            >
              <BrandMark brand="m1zwell" size={18} />
              m1zwell
            </a>
          </div>
        </div>
        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => {
            const writing = item.href === "/writing";
            const on =
              item.href === "/"
                ? path === "/"
                : writing
                  ? path === "/writing" ||
                    path.startsWith("/writing/") ||
                    path === "/blog" ||
                    path.startsWith("/blog/")
                  : path === item.href || path.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={href(item.href)}
                className={on ? "nav-link is-on" : "nav-link"}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={links.gghereWorlds}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            {m.nav.worlds}
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("yok:palette"))}
            className="hidden items-center gap-2 rounded-lg border border-hair px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-fg xl:inline-flex"
            aria-label="Open command palette"
          >
            <span>{m.cta.search}</span>
            <kbd className="rounded bg-tertiary px-1.5 py-0.5 text-[10px] text-secondary">⌘K</kbd>
          </button>
          <EnterButton className="btn btn-ghost hidden sm:inline-flex" />
          <AuthHeaderButtons />
        </div>
      </div>
      <nav
        aria-label="Sections"
        className="nav-rail page-x scroll-x flex flex-nowrap gap-3 border-t border-hair sm:gap-4 lg:hidden"
      >
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("yok:enter"))}
          className="shrink-0 text-[12px] font-medium text-accent"
        >
          {m.cta.enter}
        </button>
        <AuthRailLink />
        {nav.map((item) => (
          <Link
            key={item.href}
            href={href(item.href)}
            className="shrink-0 text-[12px] font-medium text-muted hover:text-fg"
          >
            {item.label}
          </Link>
        ))}
        <a
          href={links.gghereWorlds}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[12px] font-medium text-muted hover:text-fg"
        >
          {m.nav.worlds}
        </a>
      </nav>
    </header>
  );
}
