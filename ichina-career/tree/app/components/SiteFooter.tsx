"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthRegisterLink } from "@/app/components/AuthCta";
import { CareerNavLink } from "@/app/components/career/CareerNavLink";
import { EnterButton } from "@/app/components/JoinFlow";
import { localizeHref, stripLocale } from "@/lib/i18n";
import { t } from "@/lib/messages";
import { channels, emails } from "@/lib/channels";
import { feedPath } from "@/lib/feed-meta";
import { links } from "@/lib/site";

export function SiteFooter() {
  const pathname = usePathname() || "/";
  const { locale } = stripLocale(pathname);
  const m = t(locale);

  return (
    <footer className="site-footer border-t border-hair bg-surface/80">
      <div className="page-x mx-auto max-w-6xl py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-lg tracking-tight text-fg">{m.footer.worldsLive}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{m.footer.peer}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <EnterButton className="btn btn-primary cta-pop" />
            <a href={links.gghereHk} className="btn btn-ghost">
              {m.footer.openGghere}
            </a>
            <a href={links.gghereWorlds} className="btn btn-ghost">
              {m.footer.openPlanet}
            </a>
            <a href={links.dseekHome} className="btn btn-ghost">
              {m.footer.openDseek}
            </a>
            <AuthRegisterLink className="btn btn-ghost" />
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-hair pt-6 text-[13px]">
          <p className="text-muted">© 2026 Yok Zhang</p>
          <a href={links.github} className="font-mono text-accent hover:text-accent-hover">
            m1zwell
          </a>
          {channels.map((channel) => (
            <a
              key={channel.id}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-fg"
            >
              {m.channels[channel.id]}
            </a>
          ))}
          {emails.map((email) => (
            <a key={email.id} href={email.href} className="text-muted hover:text-fg">
              {email.label}
            </a>
          ))}
          <CareerNavLink locale={locale} variant="footer" />
          <Link href={localizeHref("/share", locale)} className="text-accent hover:text-accent-hover">
            {m.nav.share}
          </Link>
          <a href={links.jubitTerminal} className="text-muted hover:text-fg">
            {m.studio.deskTitle}
          </a>
          <a href={links.gghereHk} className="text-muted hover:text-fg">
            gghere.com/hk
          </a>
          <a href={links.gghereWorlds} className="text-muted hover:text-fg">
            gghere.com/worlds
          </a>
          <a href={links.jubuddyPlanet} className="text-muted hover:text-fg">
            jubuddy.com/planet
          </a>
          <a href={feedPath} className="font-mono text-[11px] tracking-wide text-muted hover:text-accent">
            {m.footer.rss}
          </a>
          <span className="text-muted">
            <span className="mr-1 text-accent">香港</span>
            Hong Kong
          </span>
        </div>
      </div>
    </footer>
  );
}
