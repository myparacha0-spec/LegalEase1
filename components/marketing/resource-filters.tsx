"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Search + filter controls for the resource library.
 *
 * The controls own no data: they only translate user intent into URL query
 * parameters (`?q=&category=&jurisdiction=`). The server component then queries
 * Supabase with those parameters, which keeps filtering in the database, makes
 * every result set shareable, and keeps the browser bundle small.
 */

export interface ResourceFiltersProps {
  categories: { id: string; slug: string; name: string }[];
  jurisdictions: string[];
  query: string;
  categorySlug: string;
  jurisdiction: string;
}

interface FilterState {
  q: string;
  category: string;
  jurisdiction: string;
}

/** Sentinel for "no filter" — impossible to collide with a real slug. */
const ALL_VALUE = "__all__";
const SEARCH_DEBOUNCE_MS = 400;

function buildHref(pathname: string, filters: FilterState): string {
  const params = new URLSearchParams();
  const search = filters.q.trim();

  if (search) params.set("q", search);
  if (filters.category) params.set("category", filters.category);
  if (filters.jurisdiction) params.set("jurisdiction", filters.jurisdiction);

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function ResourceFilters({
  categories,
  jurisdictions,
  query,
  categorySlug,
  jurisdiction,
}: ResourceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(query);

  // The search term that was last written to the URL. Comparing against it
  // stops the debounce effect from pushing the same term twice (for example
  // straight after the server echoes the value back) and lets browser
  // back/forward navigation update the input.
  const appliedQuery = useRef(query);

  const filters = useMemo<FilterState>(
    () => ({ q: query, category: categorySlug, jurisdiction }),
    [query, categorySlug, jurisdiction]
  );

  const navigate = useCallback(
    (next: FilterState) => {
      startTransition(() => {
        router.push(buildHref(pathname, next), { scroll: false });
      });
    },
    [pathname, router]
  );

  useEffect(() => {
    if (query === appliedQuery.current) return;

    appliedQuery.current = query;
    setSearch(query);
  }, [query]);

  // Debounced search: typing stays responsive and only the settled term is sent
  // to the server.
  useEffect(() => {
    if (search === appliedQuery.current) return;

    const timer = setTimeout(() => {
      appliedQuery.current = search;
      navigate({ ...filters, q: search });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, filters, navigate]);

  const hasActiveFilters = Boolean(query || categorySlug || jurisdiction);

  // Radix only renders a SelectItem's text once it has been mounted, so the
  // label is derived from the URL instead of relying on item registration.
  const activeCategoryName =
    categories.find((category) => category.slug === categorySlug)?.name ?? "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    appliedQuery.current = search;
    navigate({ ...filters, q: search });
  }

  function handleClear() {
    appliedQuery.current = "";
    setSearch("");
    navigate({ q: "", category: "", jurisdiction: "" });
  }

  return (
    <section
      aria-labelledby="resource-filters-heading"
      className="rounded-2xl border border-border bg-white p-4 lg:p-5"
    >
      <h2 id="resource-filters-heading" className="sr-only">
        Search and filter legal resources
      </h2>

      <form
        role="search"
        onSubmit={handleSubmit}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="sm:col-span-2">
          <Label htmlFor="resource-search" className="sr-only">
            Search legal resources
          </Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="resource-search"
              name="q"
              type="search"
              placeholder="Search by title, summary, law or keyword…"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {isPending && (
              <Loader2
                aria-hidden="true"
                className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              />
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="resource-category" className="sr-only">
            Category
          </Label>
          <Select
            value={categorySlug || ALL_VALUE}
            onValueChange={(value) =>
              navigate({
                ...filters,
                category: value === ALL_VALUE ? "" : value,
              })
            }
          >
            <SelectTrigger id="resource-category" className="w-full">
              <SelectValue placeholder="All categories">
                {activeCategoryName || "All categories"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="resource-jurisdiction" className="sr-only">
            Jurisdiction
          </Label>
          <Select
            value={jurisdiction || ALL_VALUE}
            disabled={jurisdictions.length === 0}
            onValueChange={(value) =>
              navigate({
                ...filters,
                jurisdiction: value === ALL_VALUE ? "" : value,
              })
            }
          >
            <SelectTrigger id="resource-jurisdiction" className="w-full">
              <SelectValue placeholder="All jurisdictions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All jurisdictions</SelectItem>
              {jurisdictions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm">
            Search
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-navy"
              onClick={handleClear}
            >
              <RotateCcw data-icon="inline-start" />
              Clear filters
            </Button>
          )}
          <span
            role="status"
            aria-live="polite"
            className="text-sm text-muted-foreground sm:ml-auto"
          >
            {isPending ? "Updating results…" : ""}
          </span>
        </div>
      </form>
    </section>
  );
}
