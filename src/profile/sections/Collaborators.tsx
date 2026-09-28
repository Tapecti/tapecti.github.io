"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { formatExact } from "@/lib/format";
import type { CollaboratorProfile } from "@/lib/profile-data";
import { DiscordLogo, RobloxLogo } from "../BrandIcons";
import { useProfile } from "../context";
import { reveal } from "../reveal";
import { tipClass, TipBubble } from "../ui/Tip";
import { VerifiedBadge } from "../VerifiedBadge";
import styles from "./Collaborators.module.css";

const CARD_WIDTH_PX = 320;

const listNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/** Everyone Tapecti has built with, shown the way Roblox shows friends. A star marks who they work with now. */
export function Collaborators() {
  const { data } = useProfile();
  const people = data.collaborators;
  const [openId, setOpenId] = useState<number | null>(null);
  const [align, setAlign] = useState<"start" | "end">("start");

  useEffect(() => {
    if (openId === null) return;
    const close = () => setOpenId(null);
    // Anything outside this person's own avatar and card dismisses it.
    const onPointer = (event: PointerEvent) => {
      const person = event.target instanceof Element ? event.target.closest("[data-person]") : null;
      if (person?.getAttribute("data-person") !== String(openId)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
    };
  }, [openId]);

  if (people.length === 0) return null;

  const toggle = (person: CollaboratorProfile) => (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // Open towards whichever side has room, so the card never runs off screen.
    setAlign(rect.left + CARD_WIDTH_PX > window.innerWidth - 16 ? "end" : "start");
    setOpenId((current) => (current === person.id ? null : person.id));
  };

  return (
    <section id="collaborators" className={styles.section} aria-labelledby="collaborators-title">
      <div className="container">
        <h2 id="collaborators-title" className={styles.title} {...reveal()}>
          Collaborators <span className={styles.count}>({people.length})</span>
        </h2>

        <ul className={styles.list}>
          {people.map((person, i) => {
            const isOpen = openId === person.id;
            const owns = Object.values(data.groups)
              .filter((group) => group.ownerId === person.id)
              .map((group) => group.name);
            const robloxUrl = `https://www.roblox.com/users/${person.id}/profile`;

            return (
              <li key={person.id} data-person={person.id} className={styles.person} {...reveal(i)}>
                <button
                  type="button"
                  className={styles.trigger}
                  data-highlight={person.highlight || undefined}
                  aria-expanded={isOpen}
                  aria-controls={`collaborator-${person.id}`}
                  onClick={toggle(person)}
                >
                  <span className={styles.avatarWrap}>
                    <span className={styles.avatar}>
                      {person.headshot && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={person.headshot} alt="" width={112} height={112} loading="lazy" data-fade="" />
                      )}
                    </span>
                    {person.current && (
                      // Sits on the avatar's corner like Roblox's status icons.
                      <span className={`${styles.current} ${tipClass}`}>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M12 2.8l2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 16.83l-5.5 2.89 1.05-6.12L3.1 9.27l6.15-.9z" />
                        </svg>
                        <span className="visually-hidden">Current collaborator</span>
                        <TipBubble label="Current collaborator" />
                      </span>
                    )}
                  </span>
                  <span className={styles.nameRow}>
                    <span className={styles.name}>{person.displayName}</span>
                    {person.verified && <VerifiedBadge className={styles.verified} label="Verified Roblox account" tip />}
                  </span>
                  <span className={styles.role}>{person.role}</span>
                </button>

                {isOpen && (
                  <div
                    id={`collaborator-${person.id}`}
                    className={styles.card}
                    data-align={align}
                    data-highlight={person.highlight || undefined}
                    role="group"
                    aria-label={person.displayName}
                  >
                    <div className={styles.cardHead}>
                      {person.headshot && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.cardAvatar} src={person.headshot} alt="" width={48} height={48} />
                      )}
                      <div className={styles.cardIdentity}>
                        <p className={styles.cardName}>
                          <span>{person.displayName}</span>
                          {person.verified && <VerifiedBadge className={styles.verified} label="Verified Roblox account" tip />}
                        </p>
                        <p className={styles.cardHandle}>@{person.name}</p>
                        {person.current && <p className={styles.cardCurrent}>Current collaborator</p>}
                      </div>
                    </div>

                    <p className={styles.cardAbout}>{person.about}</p>

                    {(person.followers !== undefined || owns.length > 0) && (
                      <ul className={styles.cardFacts}>
                        {person.followers !== undefined && <li>{formatExact(person.followers)} followers on Roblox</li>}
                        {owns.length > 0 && <li>Owner of {listNames(owns)}</li>}
                      </ul>
                    )}

                    <div className={styles.cardActions}>
                      {person.discordUrl && (
                        <a href={person.discordUrl} target="_blank" rel="noopener noreferrer" className="button button-discord">
                          <DiscordLogo className={styles.logo} />
                          Discord<span className="visually-hidden"> profile of {person.displayName} (opens in a new tab)</span>
                        </a>
                      )}
                      <a href={robloxUrl} target="_blank" rel="noopener noreferrer" className="button button-secondary">
                        <RobloxLogo className={styles.logo} />
                        Roblox<span className="visually-hidden"> profile of {person.displayName} (opens in a new tab)</span>
                      </a>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
