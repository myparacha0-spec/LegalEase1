import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Scale,
  Sparkles,
  BookOpen,
  FileText,
  CalendarDays,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/citizen/dashboard-header";
import { ProfileSummaryCard } from "@/components/citizen/profile-summary-card";
import { QuickActionCard } from "@/components/citizen/quick-action-card";
import { ComingSoonDialog } from "@/components/citizen/coming-soon-dialog";

export const metadata: Metadata = {
  title: "My Dashboard",
  description:
    "Your personal LegalEase citizen dashboard — quick access to lawyers, legal resources, appointments, and the AI legal assistant.",
  robots: { index: false },
};

/**
 * /citizen/dashboard — Server Component
 *
 * Auth is already enforced by middleware (redirects to /login when
 * unauthenticated, to / when role ≠ citizen). This component performs
 * a second, authoritative check so the page never renders stale data
 * from a cached middleware response.
 */
export default async function CitizenDashboardPage() {
  const supabase = await createClient();

  // Authoritative session check (middleware already handles the redirect,
  // but we re-check here for defence-in-depth and to get the user id).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // `user` is non-null here — redirect() throws and TS doesn't narrow through
  // it automatically, so we assert. The guard above ensures this is safe.
  const userId = user!.id;

  // Fetch the citizen's full row from public.users (RLS ensures only the
  // authenticated user's own row is returned).
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone, cnic, city, area, role, filer_status")
    .eq("id", userId)
    .single();

  // Double-check role in case middleware cache was stale.
  if (profile && profile.role !== "citizen") {
    redirect("/");
  }

  // profile may be null if the row doesn't exist yet — show graceful fallback.
  const hasMissingProfile = !profile;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* ── Page shell ─────────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* ── Welcome header ──────────────────────────────────────────────── */}
        <DashboardHeader fullName={profile?.full_name ?? null} />

        <div className="mt-8 flex flex-col gap-8">

          {/* ── Missing-profile fallback ────────────────────────────────── */}
          {hasMissingProfile && (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"
              role="alert"
            >
              <strong className="font-semibold">Complete your profile.</strong>{" "}
              We couldn&apos;t find your profile record. Please contact support
              or log out and sign up again.
            </div>
          )}

          {/* ── Profile summary card ────────────────────────────────────── */}
          {!hasMissingProfile && (
            <section aria-labelledby="profile-section-heading">
              <h2
                id="profile-section-heading"
                className="mb-3 font-heading text-sm font-semibold uppercase tracking-widest"
                style={{ color: "var(--brand-teal)" }}
              >
                Your Profile
              </h2>
              <ProfileSummaryCard
                fullName={profile.full_name}
                city={profile.city}
                area={profile.area}
                phone={profile.phone}
                filerStatus={
                  profile.filer_status as
                    | "filer"
                    | "non_filer"
                    | "unverified"
                }
              />
            </section>
          )}

          {/* ── Quick actions ────────────────────────────────────────────── */}
          <section aria-labelledby="quick-actions-heading">
            <h2
              id="quick-actions-heading"
              className="mb-3 font-heading text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--brand-teal)" }}
            >
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {/* 1. Find a Lawyer — real link to existing /lawyers route */}
              <QuickActionCard
                id="quick-action-find-lawyer"
                title="Find a Lawyer"
                description="Browse verified lawyers by practice area, city, and budget."
                icon={<Scale className="size-5" />}
                accentColor="var(--brand-navy)"
                href="/lawyers"
              />

              {/* 2. Ask AI Legal Assistant — coming soon */}
              <ComingSoonDialog featureName="Ask AI Legal Assistant">
                <QuickActionCard
                  id="quick-action-ai-assistant"
                  title="Ask AI Legal Assistant"
                  description="Get plain-language answers to your legal questions instantly."
                  icon={<Sparkles className="size-5" />}
                  accentColor="var(--brand-teal)"
                />
              </ComingSoonDialog>

              {/* 3. Browse Legal Resources — coming soon */}
              <ComingSoonDialog featureName="Browse Legal Resources">
                <QuickActionCard
                  id="quick-action-resources"
                  title="Browse Legal Resources"
                  description="Guides, templates, and plain-language legal explainers."
                  icon={<BookOpen className="size-5" />}
                  accentColor="var(--brand-gold)"
                />
              </ComingSoonDialog>

              {/* 4. Generate a Document — coming soon */}
              <ComingSoonDialog featureName="Generate a Document">
                <QuickActionCard
                  id="quick-action-documents"
                  title="Generate a Document"
                  description="Create legal documents tailored to your situation."
                  icon={<FileText className="size-5" />}
                  accentColor="var(--brand-navy)"
                />
              </ComingSoonDialog>

              {/* 5. My Appointments — coming soon */}
              <ComingSoonDialog featureName="My Appointments">
                <QuickActionCard
                  id="quick-action-appointments"
                  title="My Appointments"
                  description="View and manage your upcoming lawyer consultations."
                  icon={<CalendarDays className="size-5" />}
                  accentColor="var(--brand-teal)"
                />
              </ComingSoonDialog>

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
