"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ComingSoonDialogProps {
  /** The feature name shown as the dialog title. */
  featureName: string;
  /**
   * The trigger element. ComingSoonDialog clones this child and injects
   * an `onClick` prop that opens the dialog.
   */
  children: React.ReactElement<{ onClick?: () => void }>;
}

/**
 * Reusable "coming soon" dialog for dashboard quick-action cards
 * whose features are not yet built.
 *
 * Usage:
 *   <ComingSoonDialog featureName="Ask AI Legal Assistant">
 *     <QuickActionCard ... />
 *   </ComingSoonDialog>
 *
 * The child receives an injected onClick that opens the dialog.
 * The card stays visually active/clickable — it is never greyed out.
 */
export function ComingSoonDialog({
  featureName,
  children,
}: ComingSoonDialogProps) {
  const [open, setOpen] = useState(false);
  const dialogId = `coming-soon-dialog-${featureName
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  // Clone the child and inject our open handler as onClick.
  // This avoids relying on Radix Slot / asChild forwarding through
  // custom components that don't forward props.
  const trigger = (() => {
    const child = children as React.ReactElement<{ onClick?: () => void }>;
    return {
      ...child,
      props: {
        ...child.props,
        onClick: () => setOpen(true),
      },
    };
  })();

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent id={dialogId} className="max-w-sm">
          <DialogHeader>
            <DialogTitle
              className="font-heading text-lg font-bold"
              style={{ color: "var(--brand-navy)" }}
            >
              {featureName}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              This feature is currently in development and will be connected
              soon. We&apos;re working hard to bring it to you — check back
              shortly!
            </DialogDescription>
          </DialogHeader>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
