import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LegalEase legal-information disclaimer.
 *
 * Shown on every resource detail page (and wherever else the library is
 * surfaced) so visitors always understand that these guides are general
 * information rather than advice for their specific situation.
 */
export function LegalInformationDisclaimer({
  className,
}: {
  className?: string;
}) {
  return (
    <aside
      aria-labelledby="legal-information-disclaimer-heading"
      className={cn(
        "rounded-2xl border border-gold/40 bg-gold-soft/70 p-5 sm:p-6",
        className
      )}
    >
      <h2
        id="legal-information-disclaimer-heading"
        className="flex items-center gap-2 font-heading text-sm font-bold text-navy"
      >
        <Info aria-hidden="true" className="size-4 shrink-0 text-gold" />
        Legal information, not legal advice
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        LegalEase resources explain the law in plain language for general
        information only. They are not legal advice and do not create a
        lawyer&ndash;client relationship. Laws, rules and procedures change over
        time, and every situation is different &mdash; always confirm the current
        position with a qualified lawyer before you act on anything you read
        here.
      </p>
    </aside>
  );
}
