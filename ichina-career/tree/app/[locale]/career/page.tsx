import { CareerView } from "@/app/components/career/CareerView";
import { isPrefixedLocale } from "@/lib/i18n";
import { t } from "@/lib/messages";
import { seo } from "@/lib/seo";
import { notFound } from "next/navigation";

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  const m = t(locale);
  return seo({
    title: m.nav.career,
    description: m.careerPage.lead,
    path: "/career",
    locale,
  });
}

export default async function LocaleCareer({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <CareerView locale={locale} />;
}
