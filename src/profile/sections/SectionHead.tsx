import { reveal } from "../reveal";
import styles from "./SectionHead.module.css";

export function SectionHead({ id, title, detail }: { id: string; title: string; detail?: string }) {
  return (
    <header className={styles.head} {...reveal()}>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {detail && <p className={styles.detail}>{detail}</p>}
    </header>
  );
}
