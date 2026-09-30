import { Suspense } from "react";
import Link from "next/link";
import { Compass, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceCard } from "@/components/marketing/resource-card";
import { ResourceFilters } from "@/components/marketing/resource-filters";
import {
  getPublishedResources,
  type ResourceCategory,
} from "@/lib/data/resources";

/**
 * The searchable legal resource library.
 *
 * Filter values arrive as props (already parsed from the URL by the page), so
 * this module never touches `searchParams` itself. The filter controls stay
 * outside the Suspense boundary — only the results are suspended, which keeps
 * the search box responsive while the database responds.
 */

interface ResourceLibraryProps {
  categories: ResourceCategory[];
  jurisdictions: string[];
  query: string;
  categorySlug: string;
  categoryId: string | null;
  jurisdiction: string;
}

interface ResourceResultsProps {
  query: string;
  categoryId: string | null;
  jurisdiction: string;
}

const SKELETON_CARD_COUNT = 6;

export function ResourceLibrary({
  categories,
  jurisdictions,
  query,
  categorySlug,
  categoryId,
  jurisdiction,
}: ResourceLibraryProps) {
  return (
    <div className="flex flex-col gap-8">
      <ResourceFilters
        categories={categories}
        jurisdictions={jurisdictions}
        query={query}
        categorySlug={categorySlug}
        jurisdiction={jurisdiction}
      />

      {/* A new boundary per filter combination so the skeleton is shown on
          every change instead of the previous results staying on screen. */}
      <Suspense
        key={`${query}|${categorySlug}|${jurisdiction}`}
        fallback={<ResourceResultsSkeleton />}
      >
        <ResourceResults
          query={query}
          categoryId={categoryId}
          jurisdiction={jurisdiction}
        />
      </Suspense>
    </div>
  );
}

async function ResourceResults({
  query,
  categoryId,
  jurisdiction,
}: ResourceResultsProps) {
  const { resources, total } = await getPublishedResources({
    query,
    categoryId,
    jurisdiction,
  });

  if (resources.length === 0) {
    return (
      <ResourceEmptyState
        hasFilters={Boolean(query || categoryId || jurisdiction)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        Showing{" "}
        <span className="font-medium text-foreground">{resources.length}</span>{" "}
        of {total} published {total === 1 ? "resource" : "resources"}
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
}

/** Empty state — distinguishes "nothing matched" from "nothing published yet". */
function ResourceEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-soft text-teal">
        {hasFilters ? (
          <SearchX aria-hidden="true" className="size-6" />
        ) : (
          <Compass aria-hidden="true" className="size-6" />
        )}
      </span>
      <p className="mt-5 font-heading text-lg font-bold text-navy">
        {hasFilters
          ? "No resources match your search"
          : "Published guides are on the way"}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {hasFilters
          ? "Try a different keyword or a broader filter. Clearing the filters shows every published guide in the library."
          : "No legal resources have been published yet. Plain-language guides appear here the moment our team publishes them."}
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {hasFilters && (
          <Button asChild variant="outline" className="w-full text-navy sm:w-auto">
            <Link href="/resources">Clear filters</Link>
          </Button>
        )}
        <Button asChild className="w-full sm:w-auto">
          <Link href="/lawyers">Find a lawyer instead</Link>
        </Button>
      </div>
    </div>
  );
}

/** Loading state: mirrors the real grid so the layout does not jump. */
export function ResourceResultsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span role="status" className="sr-only">
        Loading legal resources…
      </span>
      <Skeleton className="h-4 w-44" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <Card key={index} className="gap-4">
            <CardContent className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="mt-auto space-y-2 border-t border-border pt-4">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Full library skeleton (filter bar + results) used while the page resolves the
 * category and jurisdiction lists.
 */
export function ResourceLibrarySkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <span role="status" className="sr-only">
        Loading the legal resource library…
      </span>

      <Card className="p-4 lg:p-5">
        <CardContent className="grid gap-4 px-0 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-8 sm:col-span-2" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </CardContent>
      </Card>

      <ResourceResultsSkeleton />
    </div>
  );
}

