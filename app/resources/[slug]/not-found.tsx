import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 404 for /resources/[slug] — rendered by `notFound()` when a slug is unknown,
 * unpublished, or was renamed. A proper status code is still returned.
 */
export default function ResourceNotFound() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-soft text-teal">
          <FileQuestion aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-6 font-heading text-sm font-bold tracking-widest text-gold uppercase">
          404
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-navy">
          We couldn&apos;t find that resource
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          This guide may have been renamed, unpublished, or the link was
          mistyped. Every published guide is listed in the resource library.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/resources">
              <ArrowLeft data-icon="inline-start" />
              Browse all resources
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-navy sm:w-auto">
            <Link href="/lawyers">Find a lawyer</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
