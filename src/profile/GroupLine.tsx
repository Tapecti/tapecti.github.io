"use client";

import { useProfile } from "./context";
import { VerifiedBadge } from "./VerifiedBadge";
import styles from "./GroupLine.module.css";

/** Publishing group, shown the way Roblox credits a creator: logo, name, verification. */
export function GroupLine({ groupId, className = "" }: { groupId?: number; className?: string }) {
  const { group } = useProfile();
  const info = group(groupId);
  if (!info) return null;

  return (
    <p className={`${styles.line} ${className}`}>
      {info.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.icon} src={info.icon} alt="" width={24} height={24} loading="lazy" />
      )}
      <span className={styles.name}>{info.name}</span>
      {info.verified && <VerifiedBadge className={styles.verified} label="Verified group" />}
    </p>
  );
}
