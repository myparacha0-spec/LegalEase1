"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for /resources and /resources/[slug].
 *
 * Catches Supabase failures (unreachable project, missing environment
 * variables, query errors) and offers a retry instead of a blank screen.
 */
export default function ResourcesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the server/client logs for debugging; never shown to visitors.
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-navy">
          We couldn&apos;t load the legal resources
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Something went wrong while fetching the resource library. This is
          usually temporary — try again, or come back in a moment.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={reset} className="w-full sm:w-auto">
            <RefreshCw data-icon="inline-start" />
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full text-navy sm:w-auto">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
