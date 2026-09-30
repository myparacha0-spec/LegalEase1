"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  /** Card title */
  title: string;
  /** Short description shown below the title */
  description: string;
  /** Lucide icon element */
  icon: React.ReactNode;
  /** Accent colour for the icon container background (CSS colour value) */
  accentColor?: string;
  /** If provided, the card renders as a Next.js Link to this href */
  href?: string;
  /** onClick handler — used when the card is a button (no href) */
  onClick?: () => void;
  /** Extra class names */
  className?: string;
  /** id for browser testing */
  id?: string;
}

/**
 * A single quick-action card for the citizen dashboard grid.
 *
 * - When `href` is supplied it renders as a Next.js `<Link>`.
 * - When `onClick` is supplied it renders as a `<button>`.
 * - Both variants look identical; neither is ever "disabled" or greyed out.
 */
export function QuickActionCard({
  title,
  description,
  icon,
  accentColor = "var(--brand-navy)",
  href,
  onClick,
  className,
  id,
}: QuickActionCardProps) {
  const inner = (
    <Card
      id={id}
      className={cn(
        "group/qac h-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-2",
        className
      )}
      style={
        {
          "--hover-ring-color": accentColor,
        } as React.CSSProperties
      }
      // Tailwind can't use CSS vars in hover:ring — use inline style on the wrapper
    >
      <CardContent className="flex flex-col gap-4 py-5">
        {/* Icon bubble */}
        <span
          className="inline-grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover/qac:scale-110"
          style={{ background: accentColor, color: "#fff" }}
          aria-hidden
        >
          {icon}
        </span>

        {/* Text */}
        <div className="flex flex-1 flex-col gap-1">
          <p
            className="font-heading text-sm font-semibold leading-snug"
            style={{ color: "var(--brand-navy)" }}
          >
            {title}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Arrow */}
        <ArrowRight
          className="size-4 self-end opacity-0 transition-opacity duration-200 group-hover/qac:opacity-100"
          style={{ color: accentColor }}
          aria-hidden
        />
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus:outline-none">
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block h-full w-full text-left focus:outline-none"
    >
      {inner}
    </button>
  );
}
