import { pageMeta } from "@/lib/page-cards";
import { getRequestLocale } from "@/lib/locale.functions";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/About";
import { OG_IMAGE, canonicalLinks, jsonLdScript } from "@/lib/social-meta";

const TITLE = "ROUT — het soevereine alternatief voor je link-in-bio";
const DESCRIPTION =
  "Eén rustige pagina met je naam, links, verificatie en donaties. Schone URL's, SecureShield™ mailrelay, 0 % data-oogst en Europese infrastructuur.";

export const Route = createFileRoute("/about")({
  loader: () => getRequestLocale().catch(() => ({ locale: "en" as const })),
  head: ({ loaderData }) => ({
    meta: pageMeta("about", loaderData?.locale),
    links: canonicalLinks("/about"),
    scripts: jsonLdScript({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ROUT",
      url: "https://rout.be",
      description: DESCRIPTION,
      logo: "https://rout.be/logo.svg",
    }),
  }),
  component: Page,
});
