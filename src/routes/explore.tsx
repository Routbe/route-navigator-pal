import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExploreGallery } from "@/components/explore/ExploreGallery";
import { listShowcaseCards } from "@/lib/showcase.functions";
import { useTranslation } from "react-i18next";
import { pageMeta } from "@/lib/page-cards";
import { getRequestLocale } from "@/lib/locale.functions";


export const Route = createFileRoute("/explore")({
  loader: async () => {
    const [cards, { locale }] = await Promise.all([
      listShowcaseCards(),
      getRequestLocale().catch(() => ({ locale: "en" as const })),
    ]);
    return { cards, locale };
  },
  head: ({ loaderData }) => ({ meta: pageMeta("explore", loaderData?.locale) }),
  component: ExplorePage,
});

function ExplorePage() {
  const { cards } = Route.useLoaderData();
  const { t } = useTranslation();
  return (
    <AppLayout crumbs={[{ label: t("explore.crumb") }]}>
      <div className="mx-auto max-w-6xl px-4 py-12 pb-28 sm:px-6 sm:py-20">
        <span className="eyebrow">{t("explore.eyebrow")}</span>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          {t("explore.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("explore.body")}</p>
        <div className="mt-12">
          <ExploreGallery cards={cards} filters />
        </div>
        <div className="mt-14 text-center">
          <Link to="/tour" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-foreground px-8 font-semibold text-background transition-opacity hover:opacity-90">
            {t("explore.cta")} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
