"use client";

import { creations } from "@/data/creations";
import { experiences } from "@/data/projects";
import { isConfigured, shown, shownList } from "@/lib/placeholder";
import { CodeBlock } from "../ui/CodeBlock";
import { SectionHead } from "./SectionHead";
import styles from "./Creations.module.css";

/** Engineering work that stands on its own: systems, infrastructure, tooling. */
export function Creations() {
  const items = creations.filter((c) => shown(c.title));
  if (items.length === 0) return null;

  return (
    <section id="creations" className={styles.section} aria-labelledby="creations-title">
      <div className="container">
        <SectionHead id="creations-title" title="Creations" detail="Systems built for production" />
        <ul className={styles.list}>
          {items.map((creation) => {
            const usedIn = (creation.usedIn ?? []).map((id) => experiences.find((e) => e.id === id)?.title).filter(Boolean);
            return (
              <li key={creation.id} className={styles.creation}>
                <div className={styles.text}>
                  <h3 className={styles.title}>{creation.title}</h3>
                  {shown(creation.summary) && <p className={styles.summary}>{creation.summary}</p>}
                  <ul className={styles.details}>
                    {shownList(creation.details).map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                  {usedIn.length > 0 && <p className={styles.usedIn}>Shipped in {usedIn.join(", ")}</p>}
                </div>
                {creation.image && isConfigured(creation.image.src) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.image} src={creation.image.src} alt={creation.image.alt} loading="lazy" />
                ) : (
                  creation.code && shown(creation.code.filename) && <CodeBlock snippet={creation.code} />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
