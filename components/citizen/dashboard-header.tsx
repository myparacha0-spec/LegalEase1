"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Scale } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface DashboardHeaderProps {
  fullName: string | null;
}

/** Derives up-to-2-character initials from a name. */
function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardHeader({ fullName }: DashboardHeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const displayName = fullName ?? "Welcome";
  const initials = getInitials(fullName);
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: greeting + avatar */}
      <div className="flex items-center gap-4">
        <Avatar
          size="lg"
          className="size-14 border-2 text-base"
          style={{ borderColor: "var(--brand-gold)" }}
        >
          <AvatarFallback
            className="font-heading font-bold"
            style={{
              background: "var(--brand-navy)",
              color: "#fff",
            }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div>
          <p className="text-sm font-medium" style={{ color: "var(--brand-teal)" }}>
            {greeting}
          </p>
          <h1
            className="font-heading text-2xl font-bold leading-tight sm:text-3xl"
            style={{ color: "var(--brand-navy)" }}
          >
            {displayName}
          </h1>
        </div>
      </div>

      {/* Right: sign-out */}
      <Button
        id="citizen-sign-out-btn"
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full gap-2 sm:w-auto"
      >
        <LogOut className="size-4" />
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

/** Decorative scale icon used in the page hero section. */
export function HeroIcon() {
  return (
    <span
      className="inline-grid size-10 shrink-0 place-items-center rounded-full"
      style={{ background: "var(--brand-navy)", color: "var(--brand-gold)" }}
      aria-hidden
    >
      <Scale className="size-5" />
    </span>
  );
}
