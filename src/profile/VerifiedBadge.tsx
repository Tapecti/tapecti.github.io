import { tipClass, TipBubble } from "./ui/Tip";

/**
 * Roblox's verified badge: a blue square turned 15 degrees with a white
 * check. Rendered only when Roblox reports the account or group as verified.
 */

type Props = {
  /** Accessible description, e.g. "Verified group". */
  label?: string;
  className?: string;
  /** Show "Verified" on hover. Used only in the Collaborators row. */
  tip?: boolean;
};

export function VerifiedBadge({ label = "Verified on Roblox", className = "", tip = false }: Props) {
  const badge = (
    <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" aria-label={label} className={tip ? undefined : className}>
      <rect x="2.2" y="2.2" width="19.6" height="19.6" fill="#0066FF" transform="rotate(15 12 12)" />
      <path d="M7.2 12.1 10.1 15 16.8 8.3" fill="none" stroke="#FFFFFF" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (!tip) return badge;
  return (
    <span className={`${tipClass} ${className}`}>
      {badge}
      <TipBubble label="Verified" />
    </span>
  );
}
