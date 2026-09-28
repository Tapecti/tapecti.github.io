import type { CodeSnippet } from "@/data/types";
import { highlightLines } from "@/lib/luau";
import { CopyButton } from "./CopyButton";
import styles from "./CodeBlock.module.css";

/** A short source excerpt presented as an engineering artifact. */
export function CodeBlock({ snippet }: { snippet: CodeSnippet }) {
  const lines = highlightLines(snippet.source.replace(/\s+$/, ""));

  return (
    <figure className={styles.figure}>
      <div className={styles.bar}>
        <span className={styles.filename}>{snippet.filename}</span>
        <CopyButton value={snippet.source} description={`${snippet.filename} source`} className={styles.copy} />
      </div>
      <pre className={styles.pre} tabIndex={0} aria-label={`${snippet.filename}, ${lines.length} lines`}>
        <code>
          {lines.map((tokens, i) => (
            <span key={i} className={styles.line}>
              {tokens.map((token, j) =>
                token.kind === "plain" ? (
                  token.text
                ) : (
                  <span key={j} className={styles[token.kind]}>
                    {token.text}
                  </span>
                ),
              )}
            </span>
          ))}
        </code>
      </pre>
      {snippet.caption && <figcaption className={styles.caption}>{snippet.caption}</figcaption>}
    </figure>
  );
}
