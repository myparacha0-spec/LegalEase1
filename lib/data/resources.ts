import { createClient } from "@/lib/supabase/server";

/**
 * Data access layer for Feature 2 — Legal Resources.
 *
 * Everything here runs on the server (Server Components) and talks to the
 * `legal_resource_categories` and `legal_resources` tables through the
 * request-scoped Supabase client, so Row Level Security and the visitor's auth
 * cookies are always respected.
 *
 * Two rules are enforced in this module so the UI stays simple:
 *  1. Only rows with `published = true` are ever returned.
 *  2. Searching and filtering happen in Postgres — the library never downloads
 *     the whole table for browser-side filtering.
 */

/** A row from `legal_resource_categories`. */
export interface ResourceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

/** Card-level view of a resource: every column except the guide body. */
export interface LegalResourceSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  jurisdiction: string | null;
  lawName: string | null;
  sectionReference: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  keywords: string[];
  updatedAt: string | null;
  category: ResourceCategory | null;
}

/** Full resource record, including the guide body used by the detail route. */
export interface LegalResource extends LegalResourceSummary {
  content: string | null;
}

export interface ResourceQuery {
  /** Free-text search across title, summary, law name and keywords. */
  query?: string;
  /** `legal_resource_categories.id` — resolved from a category slug by the page. */
  categoryId?: string | null;
  jurisdiction?: string | null;
}

export interface ResourceQueryResult {
  resources: LegalResourceSummary[];
  /** Total matching rows, used for the "showing x of y" label. */
  total: number;
}

/* -------------------------------------------------------------------------- */
/* Raw database rows                                                          */
/* -------------------------------------------------------------------------- */

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

interface ResourceRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content?: string | null;
  jurisdiction: string | null;
  law_name: string | null;
  section_reference: string | null;
  source_name: string | null;
  source_url: string | null;
  keywords: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  legal_resource_categories: CategoryRow | CategoryRow[] | null;
}

/**
 * This project has no generated `Database` types, so `select()` returns a
 * permissive union. These helpers narrow the response to the rows that were
 * actually requested.
 */
function asRows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

function asRow<T>(data: unknown): T | null {
  return (data as T | null) ?? null;
}

const CATEGORY_COLUMNS = "id, slug, name, description";

/**
 * Embedded category select — PostgREST returns the many-to-one relation as a
 * nested object because `legal_resources.category_id` is a foreign key.
 */
const SUMMARY_COLUMNS = [
  "id",
  "slug",
  "title",
  "summary",
  "jurisdiction",
  "law_name",
  "section_reference",
  "source_name",
  "source_url",
  "keywords",
  "created_at",
  "updated_at",
  `legal_resource_categories ( ${CATEGORY_COLUMNS} )`,
].join(", ");

/** Same as the summary select, plus the guide body. */
const DETAIL_COLUMNS = [
  "id",
  "slug",
  "title",
  "summary",
  "content",
  "jurisdiction",
  "law_name",
  "section_reference",
  "source_name",
  "source_url",
  "keywords",
  "created_at",
  "updated_at",
  `legal_resource_categories ( ${CATEGORY_COLUMNS} )`,
].join(", ");

/* -------------------------------------------------------------------------- */
/* Row → domain mapping                                                       */
/* -------------------------------------------------------------------------- */

function toCategory(
  row: CategoryRow | CategoryRow[] | null | undefined
): ResourceCategory | null {
  const value = (Array.isArray(row) ? row[0] : row) ?? null;
  if (!value) return null;

  return {
    id: value.id,
    slug: value.slug,
    name: value.name,
    description: value.description ?? null,
  };
}

function toSummary(row: ResourceRow): LegalResourceSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? null,
    jurisdiction: row.jurisdiction ?? null,
    lawName: row.law_name ?? null,
    sectionReference: row.section_reference ?? null,
    sourceName: row.source_name ?? null,
    sourceUrl: row.source_url ?? null,
    keywords: Array.isArray(row.keywords) ? row.keywords.filter(Boolean) : [],
    updatedAt: row.updated_at ?? row.created_at ?? null,
    category: toCategory(row.legal_resource_categories),
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers shared with the UI                                                 */
/* -------------------------------------------------------------------------- */

/**
 * PostgREST parses `or=(...)` as a small logic tree, so the punctuation that
 * carries meaning inside it must never come from visitor input. Instead of
 * trying to escape it, we replace those characters with spaces — the query then
 * stays valid for any input. Letters, digits, spaces, `-` and `/` are kept so
 * searches like "489-F" or "PECA 2016" still work.
 */
const SEARCH_UNSAFE_CHARACTERS = /[,()"'\\%*:;\[\]{}~^<>+&|?!@#$=`]+/g;
const MAXIMUM_SEARCH_LENGTH = 80;

export function sanitizeSearchTerm(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .replace(SEARCH_UNSAFE_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAXIMUM_SEARCH_LENGTH);
}

const WORDS_PER_MINUTE = 200;

/** Reading time derived from the body — never stored, so it cannot go stale. */
export function estimateReadingMinutes(
  content: string | null | undefined
): number {
  if (!content) return 1;

  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Deterministic (UTC) date label, so the server and client always agree. */
export function formatResourceDate(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Guide bodies are stored as plain text; blank lines separate paragraphs. */
export function getResourceParagraphs(
  content: string | null | undefined
): string[] {
  if (!content) return [];

  return content
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Every category in the library, alphabetically. Categories are owned by the
 * database, so adding one there makes it appear in the filter bar automatically.
 */
export async function getResourceCategories(): Promise<ResourceCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("legal_resource_categories")
    .select(CATEGORY_COLUMNS)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Unable to load resource categories: ${error.message}`);
  }

  return asRows<CategoryRow>(data)
    .map((row) => toCategory(row))
    .filter((category): category is ResourceCategory => category !== null);
}

/**
 * The distinct jurisdictions actually used by published resources. PostgREST has
 * no `DISTINCT`, so a single column is fetched and de-duplicated in memory —
 * one small column rather than whole rows.
 */
export async function getResourceJurisdictions(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("legal_resources")
    .select("jurisdiction")
    .eq("published", true)
    .not("jurisdiction", "is", null);

  if (error) {
    throw new Error(`Unable to load resource jurisdictions: ${error.message}`);
  }

  const jurisdictions = new Set<string>();

  for (const row of asRows<{ jurisdiction: string | null }>(data)) {
    const value = row.jurisdiction?.trim();
    if (value) jurisdictions.add(value);
  }

  return [...jurisdictions].sort((a, b) => a.localeCompare(b));
}

/**
 * Published resources matching the active search, category and jurisdiction.
 * All three filters are applied by the database.
 */
export async function getPublishedResources(
  filters: ResourceQuery = {}
): Promise<ResourceQueryResult> {
  const supabase = await createClient();
  const search = sanitizeSearchTerm(filters.query);

  let request = supabase
    .from("legal_resources")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("published", true);

  if (search) {
    const pattern = `%${search}%`;

    request = request.or(
      [
        `title.ilike.${pattern}`,
        `summary.ilike.${pattern}`,
        `law_name.ilike.${pattern}`,
        // `keywords` is a `text[]` column: the string operators used above do
        // not exist for arrays, so match it as an array element instead.
        `keywords.cs.{${search}}`,
      ].join(",")
    );
  }

  if (filters.categoryId) {
    request = request.eq("category_id", filters.categoryId);
  }

  if (filters.jurisdiction) {
    request = request.eq("jurisdiction", filters.jurisdiction);
  }

  const { data, error, count } = await request
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Unable to load legal resources: ${error.message}`);
  }

  const rows = asRows<ResourceRow>(data);

  return { resources: rows.map(toSummary), total: count ?? rows.length };
}

/**
 * A single published resource by slug — the detail route.
 * Returns `null` for unknown or unpublished slugs so the page can render a 404.
 */
export async function getPublishedResourceBySlug(
  slug: string | null | undefined
): Promise<LegalResource | null> {
  if (!slug) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("legal_resources")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load this legal resource: ${error.message}`);
  }

  if (!data) return null;

  const row = asRow<ResourceRow>(data);
  if (!row) return null;

  return { ...toSummary(row), content: row.content ?? null };
}

/**
 * Related reading for the detail page: other published guides in the same
 * category first, topped up with the most recently updated guides elsewhere.
 */
export async function getRelatedPublishedResources(
  resource: LegalResource,
  limit = 3
): Promise<LegalResourceSummary[]> {
  if (limit <= 0) return [];

  const supabase = await createClient();
  const related: ResourceRow[] = [];
  const picked = new Set<string>([resource.id]);

  if (resource.category) {
    const { data, error } = await supabase
      .from("legal_resources")
      .select(SUMMARY_COLUMNS)
      .eq("published", true)
      .eq("category_id", resource.category.id)
      .neq("id", resource.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("title", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Unable to load related legal resources: ${error.message}`);
    }

    for (const row of asRows<ResourceRow>(data)) {
      if (related.length >= limit) break;
      if (picked.has(row.id)) continue;
      picked.add(row.id);
      related.push(row);
    }
  }

  if (related.length < limit) {
    const { data, error } = await supabase
      .from("legal_resources")
      .select(SUMMARY_COLUMNS)
      .eq("published", true)
      .neq("id", resource.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("title", { ascending: true })
      .limit(limit + related.length);

    if (error) {
      throw new Error(`Unable to load related legal resources: ${error.message}`);
    }

    for (const row of asRows<ResourceRow>(data)) {
      if (related.length >= limit) break;
      if (picked.has(row.id)) continue;
      picked.add(row.id);
      related.push(row);
    }
  }

  return related.map(toSummary);
}

