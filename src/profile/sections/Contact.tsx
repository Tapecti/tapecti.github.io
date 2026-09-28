"use client";

import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { resolveHref, shown } from "@/lib/placeholder";
import { DiscordLogo, RobloxLogo } from "../BrandIcons";
import { useProfile } from "../context";
import { reveal } from "../reveal";
import { CopyButton } from "../ui/CopyButton";
import { VerifiedBadge } from "../VerifiedBadge";
import styles from "./Contact.module.css";

/** How to reach Tapecti, about anything. No pitch; the reply depends on the message. */
export function Contact() {
  const { identity } = useProfile();
  const discord = resolveHref(profile.discordUrl);
  const roblox = resolveHref(profile.robloxProfile);

  return (
    <section id="contact" className={styles.contact} aria-labelledby="contact-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.pitch} {...reveal()}>
          <div className={styles.identity}>
            {identity.headshot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.headshot} src={identity.headshot} alt="" width={64} height={64} loading="lazy" />
            )}
            <div>
              <p className={styles.name}>
                <a href={discord} target="_blank" rel="noopener noreferrer" className={styles.nameLink}>
                  {identity.displayName}
                  <span className="visually-hidden"> on Discord (opens in a new tab)</span>
                </a>
                {identity.verified && <VerifiedBadge className={styles.verified} label="Verified Roblox account" />}
              </p>
              <p className={styles.handle}>
                <a href={roblox} target="_blank" rel="noopener noreferrer" className={styles.nameLink}>
                  @{identity.username}
                  <span className="visually-hidden"> on Roblox (opens in a new tab)</span>
                </a>
                , {site.role}
              </p>
            </div>
          </div>

          <p className={styles.eyebrow}>{identity.verified ? "Verified Roblox developer" : "Roblox developer"}</p>
          <h2 id="contact-title" className={styles.headline}>
            Get in touch
          </h2>
        </div>

        <div className={styles.connect} {...reveal(1)}>
          <p className={styles.lede}>Discord is the quickest way to reach me.</p>

          <div className={styles.buttons}>
            {discord && (
              <a href={discord} target="_blank" rel="noopener noreferrer" className={`button button-discord ${styles.discord}`}>
                <DiscordLogo className={styles.logo} />
                Message<span className="visually-hidden"> me on Discord (opens in a new tab)</span>
              </a>
            )}
            {roblox && (
              <a href={roblox} target="_blank" rel="noopener noreferrer" className={`button button-light ${styles.roblox}`}>
                <RobloxLogo className={styles.logo} />
                Roblox profile<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            )}
          </div>

          {shown(profile.discordUsername) && (
            <CopyButton value={profile.discordUsername} description="Discord username" label="Copy Discord username" className={styles.copy} />
          )}
        </div>
      </div>
    </section>
  );
}
