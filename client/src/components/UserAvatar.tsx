import { UserCircle } from "lucide-react";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  /** Tailwind size utility — e.g. "h-8 w-8" or "h-10 w-10". */
  sizeClass?: string;
  /** Extra className for the wrapper. */
  className?: string;
  /** Whether to render a subtle ring around the avatar. Default true. */
  ring?: boolean;
}

/**
 * Reusable avatar: shows the user's uploaded photo if present, otherwise
 * a gradient circle with their initials. Falls back to a plain icon only
 * if we have no identifying data at all.
 */
export default function UserAvatar({
  name,
  email,
  avatarUrl,
  sizeClass = "h-8 w-8",
  className = "",
  ring = true,
}: UserAvatarProps) {
  const ringClass = ring ? "ring-2 ring-accent/30" : "";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || email || "avatar"}
        className={`${sizeClass} rounded-full object-cover ${ringClass} ${className}`}
        loading="lazy"
      />
    );
  }

  const label = (name || email || "").trim();
  if (!label) {
    return <UserCircle className={`${sizeClass} text-foreground/50 ${className}`} />;
  }

  // Use the first two initials when there's a multi-word name, otherwise
  // just the leading letter.
  const parts = label.split(/\s+/).filter(Boolean);
  const initials = (
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0][0]
  ).toUpperCase();

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-accent to-fuchsia-500 text-white font-bold flex items-center justify-center shadow-inner ${ringClass} ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="text-[0.7em] leading-none tracking-tight">{initials}</span>
    </div>
  );
}
