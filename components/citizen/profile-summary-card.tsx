import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { MapPin, Phone, User } from "lucide-react";

interface ProfileSummaryCardProps {
  fullName: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  filerStatus: "filer" | "non_filer" | "unverified";
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

/** Maps filer_status values to human-readable labels. */
const FILER_STATUS_LABELS: Record<string, string> = {
  filer: "Tax Filer",
  non_filer: "Non-Filer",
  unverified: "Unverified",
};

export function ProfileSummaryCard({
  fullName,
  city,
  area,
  phone,
  filerStatus,
}: ProfileSummaryCardProps) {
  const initials = getInitials(fullName);
  const isUnverified = filerStatus === "unverified";

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4 pb-2">
        {/* Avatar */}
        <Avatar
          size="lg"
          className="size-14 shrink-0 border-2"
          style={{ borderColor: "var(--brand-gold)" }}
        >
          <AvatarFallback
            className="font-heading text-base font-bold"
            style={{
              background: "var(--brand-navy)",
              color: "#fff",
            }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-1.5">
          <CardTitle className="text-base font-bold" style={{ color: "var(--brand-navy)" }}>
            {fullName ?? "Your Profile"}
          </CardTitle>

          {/* Filer status badge */}
          {isUnverified ? (
            <Badge
              id="citizen-filer-status-badge"
              className="w-fit border-amber-400/60 bg-amber-50 text-amber-700"
            >
              ⚠ {FILER_STATUS_LABELS[filerStatus]}
            </Badge>
          ) : (
            <Badge
              id="citizen-filer-status-badge"
              className={
                filerStatus === "filer"
                  ? "w-fit border-emerald-400/60 bg-emerald-50 text-emerald-700"
                  : "w-fit border-slate-300 bg-slate-100 text-slate-600"
              }
            >
              {FILER_STATUS_LABELS[filerStatus]}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <dl className="mt-1 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField
            icon={<MapPin className="size-3.5" />}
            label="City"
            value={city}
          />
          <ProfileField
            icon={<MapPin className="size-3.5" />}
            label="Area"
            value={area}
          />
          <ProfileField
            icon={<Phone className="size-3.5" />}
            label="Phone"
            value={phone}
          />
        </dl>

        {isUnverified && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <strong>Action required:</strong> Your filer status hasn&apos;t been
            verified yet. Please complete your profile to unlock all features.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-0.5 shrink-0 opacity-60"
        style={{ color: "var(--brand-navy)" }}
        aria-hidden
      >
        {icon}
      </span>
      <div>
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium" style={{ color: "var(--brand-navy)" }}>
          {value ?? (
            <span className="italic text-muted-foreground">Not set</span>
          )}
        </dd>
      </div>
    </div>
  );
}
