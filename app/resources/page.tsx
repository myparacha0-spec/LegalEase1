import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ResourceLibrary,
  ResourceLibrarySkeleton,
} from "@/components/marketing/resource-library";
import { CtaSection } from "@/components/marketing/cta-section";
import {
  getResourceCategories,
  getResourceJurisdictions,
  sanitizeSearchTerm,
} from "@/lib/data/resources";

export const metadata: Metadata = {
  title: "Legal resources",
  description:
    "Plain-language guides on your rights, templates you can adapt, and resources to help you prepare before consulting a lawyer.",
};

type ResourceSearchParams = Record<string, string | string[] | undefined>;

/** Query values can repeat in the URL (`?q=a&q=b`); the first one wins. */
function readParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? "";
}

/**
 * /resources — the legal resource library.
 *
 * Filters live in the URL and are applied by Supabase, so every result set is
 * shareable and the browser never receives the whole table.
 *
 * The hero renders immediately; everything that touches the database sits behind
 * the Suspense boundary below, so the page streams a useful shell instead of
 * waiting for Supabase. The boundary is deliberately scoped to this route rather
 * than using `loading.tsx`, which would also cover `/resources/[slug]` and stop
 * that route from returning a real 404 status.
 */
export default function ResourcesPage({
  searchParams,
}: PageProps<"/resources">) {
  return (
    <>
      <section className="border-b border-border bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <Badge className="border-teal/30 bg-teal-soft text-teal">
              Legal resources
            </Badge>
            <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Know your rights, before you sign anything.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Plain-language guides and adaptable templates across the situations
              people face most — so you arrive at every conversation prepared.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <Suspense fallback={<ResourceLibrarySkeleton />}>
          <ResourceLibraryLoader searchParams={searchParams} />
        </Suspense>
      </section>

      <CtaSection />
    </>
  );
}

async function ResourceLibraryLoader({
  searchParams,
}: {
  searchParams: Promise<ResourceSearchParams>;
}) {
  const params = await searchParams;

  const query = sanitizeSearchTerm(readParam(params.q));
  const categorySlug = readParam(params.category).trim();
  const jurisdictionParam = readParam(params.jurisdiction).trim();

  const [categories, jurisdictions] = await Promise.all([
    getResourceCategories(),
    getResourceJurisdictions(),
  ]);

  // Only values that exist in the database become filters, so a hand-edited URL
  // can never produce a filter the UI is unable to show.
  const activeCategory = categorySlug
    ? (categories.find((category) => category.slug === categorySlug) ?? null)
    : null;
  const jurisdiction = jurisdictions.includes(jurisdictionParam)
    ? jurisdictionParam
    : "";

  return (
    <ResourceLibrary
      categories={categories}
      jurisdictions={jurisdictions}
      query={query}
      categorySlug={activeCategory?.slug ?? ""}
      categoryId={activeCategory?.id ?? null}
      jurisdiction={jurisdiction}
    />
  );
}

