import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  ExternalLink,
  FileText,
  Landmark,
  ListChecks,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CtaSection } from "@/components/marketing/cta-section";
import { LegalInformationDisclaimer } from "@/components/marketing/legal-information-disclaimer";
import { ResourceCard } from "@/components/marketing/resource-card";
import {
  estimateReadingMinutes,
  formatResourceDate,
  getPublishedResourceBySlug,
  getRelatedPublishedResources,
  getResourceParagraphs,
} from "@/lib/data/resources";

export async function generateMetadata({
  params,
}: PageProps<"/resources/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) {
    return { title: "Resource not found" };
  }

  const description =
    resource.summary ??
    "A plain-language LegalEase guide explaining the law and what it means for you.";

  return {
    title: resource.title,
    description,
    openGraph: { type: "article", title: resource.title, description },
  };
}

/** Only http(s) links are ever rendered, so a bad row cannot inject a scheme. */
function getSafeExternalUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function ReferenceRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Builds the "Important notes" list from the resource's own metadata.
 *
 * The schema has no notes column, so the notes are derived rather than stored —
 * every statement below is backed by a field on the record.
 */
function buildImportantNotes(resource: {
  lawName: string | null;
  sectionReference: string | null;
  jurisdiction: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
}): string[] {
  const notes: string[] = [];
  const reference = [resource.lawName, resource.sectionReference]
    .filter(Boolean)
    .join(", ");

  if (reference) {
    notes.push(
      `This guide explains ${reference} in plain language. Read the official text for the exact wording that a court would apply.`
    );
  }

  if (resource.jurisdiction) {
    notes.push(
      `It is written for ${resource.jurisdiction}. Other provinces and countries may apply different rules, so always check what applies where you are.`
    );
  }

  notes.push(
    "Statutes, fees and procedures change. Confirm the current position with a qualified lawyer before you rely on anything in this guide."
  );

  if (resource.sourceName) {
    notes.push(
      `The authoritative source is ${resource.sourceName}${
        resource.sourceUrl ? ", linked in the sources panel" : ""
      }.`
    );
  }

  return notes;
}

/**
 * /resources/[slug] — full text of one published resource.
 *
 * Unknown or unpublished slugs 404 through `notFound()`, so drafts never leak.
 */
export default async function ResourceDetailPage({
  params,
}: PageProps<"/resources/[slug]">) {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) notFound();

  const related = await getRelatedPublishedResources(resource, 3);

  const updated = formatResourceDate(resource.updatedAt);
  const readingMinutes = estimateReadingMinutes(resource.content);
  const paragraphs = getResourceParagraphs(resource.content);
  const sourceUrl = getSafeExternalUrl(resource.sourceUrl);
  const notes = buildImportantNotes(resource);
  const hasLegalReference = Boolean(
    resource.lawName || resource.sectionReference || resource.jurisdiction
  );

  return (
    <>
      <section className="border-b border-border bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All legal resources
          </Link>

          <div className="mt-8 max-w-3xl">
            {resource.category && (
              <Badge className="bg-teal-soft text-teal">
                {resource.category.name}
              </Badge>
            )}

            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              {resource.title}
            </h1>

            {resource.summary && (
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {resource.summary}
              </p>
            )}

            <dl className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {resource.jurisdiction && (
                <div className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="size-4 text-teal" />
                  <dt className="sr-only">Jurisdiction</dt>
                  <dd>{resource.jurisdiction}</dd>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5">
                <BookOpen aria-hidden="true" className="size-4 text-teal" />
                <dt className="sr-only">Reading time</dt>
                <dd>{readingMinutes} min read</dd>
              </div>
              {updated && (
                <div className="inline-flex items-center gap-1.5">
                  <CalendarClock aria-hidden="true" className="size-4 text-teal" />
                  <dt className="sr-only">Last updated</dt>
                  <dd>Updated {updated}</dd>
                </div>
              )}
            </dl>

            {resource.keywords.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {resource.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-navy">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>


      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ── Guide body ─────────────────────────────────────────────── */}
          <div className="min-w-0">
            <article className="space-y-4">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="whitespace-pre-line text-base leading-relaxed text-foreground/90"
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  The full text of this guide has not been added yet.
                </p>
              )}
            </article>

            <section
              aria-labelledby="important-notes-heading"
              className="mt-10 rounded-2xl border border-border bg-white p-6"
            >
              <h2
                id="important-notes-heading"
                className="flex items-center gap-2 font-heading text-base font-bold text-navy"
              >
                <ListChecks aria-hidden="true" className="size-4 text-teal" />
                Important notes
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {notes.map((note) => (
                  <li key={note} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </section>

            <LegalInformationDisclaimer className="mt-8" />
          </div>

          {/* ── Reference sidebar ──────────────────────────────────────── */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {hasLegalReference && (
              <Card className="gap-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-heading text-sm font-bold">
                    <Landmark aria-hidden="true" className="size-4 text-teal" />
                    Legal reference
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4 text-sm">
                    <ReferenceRow label="Applicable law" value={resource.lawName} />
                    <ReferenceRow
                      label="Section / article"
                      value={resource.sectionReference}
                    />
                    <ReferenceRow
                      label="Jurisdiction"
                      value={resource.jurisdiction}
                    />
                  </dl>
                </CardContent>
              </Card>
            )}

            {(resource.sourceName || sourceUrl) && (
              <Card className="gap-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-heading text-sm font-bold">
                    <FileText aria-hidden="true" className="size-4 text-teal" />
                    Source
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {resource.sourceName && (
                    <p className="text-foreground">{resource.sourceName}</p>
                  )}
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-teal transition-colors hover:text-navy"
                    >
                      Open the source
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-navy">
            Related resources
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ResourceCard key={item.id} resource={item} />
            ))}
          </div>
        </section>
      )}

      <CtaSection />
    </>
  );
}


