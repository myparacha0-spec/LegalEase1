import Link from "next/link";
import { Landmark, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatResourceDate,
  type LegalResourceSummary,
} from "@/lib/data/resources";

/**
 * Card for one entry in the legal resource library.
 *
 * The footer link is stretched over the whole card (`after:absolute after:inset-0`)
 * so the card is clickable while still exposing a single, properly labelled link
 * to assistive technology.
 */
export function ResourceCard({
  resource,
}: {
  resource: LegalResourceSummary;
}) {
  const updated = formatResourceDate(resource.updatedAt);
  const legalReference = [resource.lawName, resource.sectionReference]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="relative gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/5 focus-within:ring-2 focus-within:ring-navy/40">
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {resource.category ? (
            <Badge className="bg-teal-soft text-teal">
              {resource.category.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-navy">
              Legal resource
            </Badge>
          )}
          {updated && (
            <span className="text-xs text-muted-foreground">
              Updated {updated}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="font-heading text-lg leading-snug font-bold text-navy">
            {resource.title}
          </h3>
          {resource.summary && (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {resource.summary}
            </p>
          )}
        </div>

        {(legalReference || resource.jurisdiction) && (
          <dl className="space-y-1.5 text-xs text-muted-foreground">
            {legalReference && (
              <div className="flex items-start gap-1.5">
                <Landmark
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-teal"
                />
                <dt className="sr-only">Applicable law</dt>
                <dd>{legalReference}</dd>
              </div>
            )}
            {resource.jurisdiction && (
              <div className="flex items-start gap-1.5">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-teal"
                />
                <dt className="sr-only">Jurisdiction</dt>
                <dd>{resource.jurisdiction}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-auto border-t border-border pt-4 text-sm font-medium text-teal">
          <Link
            href={`/resources/${resource.slug}`}
            className="after:absolute after:inset-0 hover:text-navy focus:outline-none"
          >
            Read guide
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
