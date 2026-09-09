import Link from "next/link";
import { JoinFlow } from "@/app/components/JoinFlow";
import { PostCard } from "@/app/components/PostCard";
import { PretextLines } from "@/app/components/PretextLines";
import { ProductIntro } from "@/app/components/ProductIntro";
import { ProductMarquee } from "@/app/components/ProductMarquee";
import { QuoteRotator } from "@/app/components/QuoteRotator";
import { Reveal } from "@/app/components/Reveal";
import type { Locale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n";
import { t } from "@/lib/messages";
import { getAllPosts } from "@/lib/posts";
import { emails } from "@/lib/channels";
import { links, liveProducts } from "@/lib/site";

export function HomeView({ locale = "en" }: { locale?: Locale }) {
  const posts = getAllPosts().slice(0, 2);
  const m = t(locale);
  const href = (path: string) => localizeHref(path, locale);
  const row = liveProducts.filter((p) =>
    ["gghere.com/hk", "gghere.com/worlds", "jubuddy.com/planet", "jubit.ai", "dseek.ai"].includes(p.path),
  );

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="page-x relative mx-auto max-w-5xl pt-20 pb-8 sm:pt-32 sm:pb-12">
          <div className="hero-enter">
            <PretextLines
              text={m.heroLine}
              as="h1"
              locale={locale}
              className="font-display text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.04] tracking-tight text-fg"
            />
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href={links.gghereHk}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary cta-pop"
              >
                {m.cta.walkACity}
              </a>
              <Link href={href("/writing")} className="btn btn-ghost">
                {m.nav.writing}
              </Link>
              <Link href={href("/career")} className="btn btn-ghost">
                {m.nav.career}
              </Link>
            </div>
            <div className="mt-8">
              <QuoteRotator />
            </div>
          </div>
        </div>
        <div className="page-x relative mx-auto max-w-6xl pb-4">
          <ProductIntro locale={locale} />
        </div>
      </section>

      <ProductMarquee />

      <section className="home-band">
        <div className="page-x mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{m.home.seeThemRun}</h2>
              <Link href={href("/products")} className="inline-flex min-h-10 items-center text-sm font-semibold text-accent hover:text-accent-hover">
                {m.cta.allProducts}
              </Link>
            </div>
            <ul className="mt-10 divide-y divide-hair border-y border-hair">
              {row.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-12 flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <span className="font-display text-2xl tracking-tight transition-colors group-hover:text-accent sm:text-3xl">
                      {item.title}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-accent">{item.path} ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="home-band">
        <div className="page-x mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{m.home.whatCanBeTold}</h2>
              <Link href={href("/writing")} className="inline-flex min-h-10 items-center text-sm font-semibold text-accent hover:text-accent-hover">
                {m.cta.allWriting}
              </Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} locale={locale} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="home-band">
        <div className="page-x mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{m.home.joinAWorld}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{m.home.joinLead}</p>
            <div className="mt-10 max-w-lg">
              <JoinFlow />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="home-band">
        <div className="page-x mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{m.home.codeAndTheRest}</h2>
            <div className="mt-8 max-w-xl space-y-5 text-[17px] leading-[1.7] text-secondary">
              <p>
                {m.home.aboutP1a}{" "}
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-accent hover:text-accent-hover"
                >
                  m1zwell
                </a>
                {m.home.aboutP1b}
              </p>
              <p>{m.home.aboutP2}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="home-band home-band-last">
        <div className="page-x mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{m.home.noList}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{m.home.notesLiveHere}</p>
            <ul className="mt-10 max-w-xl">
              {emails.map((email) => (
                <li key={email.id} className="border-t border-hair">
                  <a
                    href={email.href}
                    className="group flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span className="font-display text-xl break-all transition-colors group-hover:text-accent sm:text-2xl">
                      {email.label}
                    </span>
                    <span className="text-[11px] font-semibold tracking-wide text-accent uppercase">
                      {email.id === "primary" ? m.home.primary : m.home.gmail}
                    </span>
                  </a>
                </li>
              ))}
              <li className="border-t border-hair border-b">
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="font-mono text-2xl text-accent transition-colors group-hover:text-accent-hover sm:text-3xl">
                    m1zwell
                  </span>
                  <span className="font-mono text-[11px] text-accent">github.com/M1zwell ↗</span>
                </a>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
