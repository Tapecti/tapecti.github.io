import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/*
 * Share cards, drawn for where the link is actually seen: a Discord embed,
 * shown at roughly a third of this size on a dark background. So the text is
 * large, the figures few, and the colours are the site's dark theme.
 */
const C = {
  bg: "#0e1013",
  stage: "#1b1e24",
  avatarStage: "#30343c",
  ink: "#eef0f3",
  ink2: "#a2a7af",
  line: "rgba(238, 240, 243, 0.12)",
};

export type Figure = { value: string; label: string };

type ProfileCard = {
  kind: "profile";
  name: string;
  handle: string;
  role: string;
  verified: boolean;
  avatar?: string;
  figures: Figure[];
};

type ExperienceCard = {
  kind: "experience";
  title: string;
  image?: string;
  owner: { name: string; verified: boolean; headshot?: string };
  role?: string;
  publisher?: string;
  figures: Figure[];
};

const Seal = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="2.2" y="2.2" width="19.6" height="19.6" fill="#0066FF" transform="rotate(15 12 12)" />
    <path d="M7.2 12.1 10.1 15 16.8 8.3" fill="none" stroke="#fff" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The site's typeface in the two weights the cards use. Falls back to the default font if it can't be fetched. */
async function loadFonts() {
  const weights = [500, 700] as const;
  try {
    // An older user agent makes Google Fonts answer with WOFF, which the renderer reads (it can't read WOFF2).
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Figtree:wght@${weights.join(";")}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Safari/534.30" },
    }).then((r) => (r.ok ? r.text() : ""));

    // Each weight comes split by alphabet; the Latin block is the one covering basic ASCII.
    const blocks = css.split("@font-face").slice(1);
    const urlFor = (weight: number) =>
      blocks
        .filter((b) => b.includes(`font-weight: ${weight};`) && /unicode-range:[^;]*U\+0000-00FF/.test(b))
        .map((b) => /src: url\(([^)]+)\)/.exec(b)?.[1])
        .find(Boolean);

    const urls = weights.map(urlFor);
    if (urls.some((u) => !u)) return undefined;
    const data = await Promise.all(urls.map((u) => fetch(u!).then((r) => r.arrayBuffer())));
    return weights.map((weight, i) => ({ name: "Figtree", data: data[i]!, weight, style: "normal" as const }));
  } catch {
    return undefined;
  }
}

function FigureRow({ figures, size }: { figures: Figure[]; size: number }) {
  return (
    <div style={{ display: "flex", gap: 56 }}>
      {figures.map((f) => (
        <div key={f.label} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: size, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>{f.value}</div>
          <div style={{ fontSize: 26, color: C.ink2, marginTop: 10 }}>{f.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Share cards: a Roblox-style profile card, or a game card with its art. */
export async function renderOgImage(card: ProfileCard | ExperienceCard) {
  const fonts = await loadFonts();
  const options = { ...ogSize, ...(fonts ? { fonts } : {}) };
  const font = fonts ? "Figtree" : "sans-serif";

  if (card.kind === "profile") {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", padding: 40, gap: 56, background: C.bg, color: C.ink, fontFamily: font }}>
          <div style={{ width: 420, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 28, background: C.avatarStage }}>
            {card.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar} alt="" width={440} height={440} />
            )}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
              {card.name}
              {card.verified && <Seal size={50} />}
            </div>
            <div style={{ fontSize: 34, color: C.ink2, marginTop: 16 }}>{`@${card.handle} · ${card.role}`}</div>
            <div style={{ display: "flex", marginTop: 56, paddingTop: 40, borderTop: `2px solid ${C.line}` }}>
              <FigureRow figures={card.figures} size={64} />
            </div>
          </div>
        </div>
      ),
      options,
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.ink, fontFamily: font }}>
        <div style={{ display: "flex", height: 360, background: C.stage, overflow: "hidden" }}>
          {card.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.image} alt="" width={1200} height={675} style={{ width: 1200, height: 675, objectFit: "cover", marginTop: -157 }} />
          )}
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 56px", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: C.ink2 }}>
              {card.owner.headshot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.owner.headshot} alt="" width={40} height={40} style={{ borderRadius: 20, background: C.stage }} />
              )}
              <span style={{ color: C.ink, fontWeight: 700 }}>{card.owner.name}</span>
              {card.owner.verified && <Seal size={24} />}
              {card.role && <span>{`· ${card.role}`}</span>}
            </div>
            <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.05, marginTop: 14 }}>{card.title}</div>
            {card.publisher && <div style={{ fontSize: 26, color: C.ink2, marginTop: 10 }}>{`By ${card.publisher}`}</div>}
          </div>
          <FigureRow figures={card.figures} size={52} />
        </div>
      </div>
    ),
    options,
  );
}
