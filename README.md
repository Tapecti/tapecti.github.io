# Tapecti — Roblox profile

A portfolio built like a premium Roblox profile: Profile, Collaborators, Experiences, Studio, Groups, Creations and Contact.

Next.js 16 (App Router), TypeScript, CSS Modules. No UI or animation libraries.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## What comes from Roblox (never stored)

Read server-side on each revalidation (every 60 seconds for game stats, hourly for identity and groups), then refreshed in the browser. On a static host they are read when the site is built instead, and the page says so:

- **Profile:** display name, username, verified badge, full-body avatar and headshot (from `profile.robloxUserId`)
- **Experiences:** description, players now, visits, favorites, likes and dislikes (thumbs with a split bar), server size, genre, created and updated dates, thumbnails (from each `universeId`)
- **Groups:** name, logo, member count, verification, owner, and your rank in the group (from each `groupId`)
- **Studio:** players, visits and game count across the whole studio (from the studio's own feed, `studio.feedUrl`)

The verified badge appears only when Roblox reports the account or group as verified. When a request fails, that figure is simply absent.

## What you write

| File | Contents |
| --- | --- |
| `src/config/profile.ts` | Roblox user ID and handles, Discord |
| `src/config/site.ts` | Role line, production URL |
| `src/data/projects.ts` | Every public game: universe ID, group ID, optional description, role, peak CCU, `featured`, and `archive` for earlier games |
| `src/data/collaborators.ts` | Collaborators: Roblox user ID and Discord user ID (name, display name, verification and avatar come from Roblox) |
| `src/data/studio.ts` | The studio you primarily work with: name, page, feed, logo and one line on it (`null` removes the section) |
| `src/data/creations.ts` | Engineering work that isn't a whole game (section appears once filled) |

- **Placeholders.** Values in `[brackets]` show in development so you can see what's left, but never render in production. Anything without a value is simply left out.
- **Peak CCU.** It isn't published by Roblox, so it's the only stored figure: `peakCCU: { value: 15114 }` renders "15,114". Set `atLeast: true` for a lower bound ("8K+").

## Layout rules

- **Experiences:** the `featured` game large, then six tiles. Curated games take the tiles first and the most-visited `archive` games fill any left; everything else waits behind "Show all games".
- **Game window:** clicking a game opens a Roblox-style window over the profile (its own URL, `/experiences/:id`): images, group link, Play on Roblox, votes, the description as written on Roblox, and Roblox's stats. Dates show the day; hovering gives the local date, time and "5 days ago", like a Discord timestamp. The art flies out of whatever was clicked, and the window grows in around it.
- **Collaborators:** a Roblox-style friends row under the profile. Each person opens a card with their Discord and Roblox, and any of the site's groups they own.
- **Context:** names link to the Roblox or Discord profile that fits the spot, and verified badges, buttons and figures explain themselves in a tooltip.
- **Contact:** neutral on purpose, for anything from new collaborators to people who want to know who Tapecti is. One line and two real buttons, Discord and Roblox. No contact details are listed twice.
- **Studio:** the studio you primarily work with, as a small purple chip under the role in the profile. Its name, one line on it, and three plain panels with the studio-wide figures (players, visits, games). Its games aren't relisted: yours are already under Experiences and Groups.
- **Share cards:** links shared on Discord and elsewhere show a dark, Roblox-style card, drawn at build time from live data: the profile card has the avatar, verified mark and headline figures; each game gets its art, publisher and figures, with a factual one-line description.
- **Groups:** built from the games, so every group you have published with appears automatically, each with all of its games.
- **Theme:** follows the system, with a toggle in the nav that remembers the choice.
- **Motion:** the profile enters on first paint and sections rise in once as they scroll into view, all under 700ms and switched off for reduced motion.

## Deploying to GitHub Pages

Pages serves plain files, so the site builds to static HTML and the Roblox figures are read **at build time**. `.github/workflows/deploy.yml` therefore rebuilds on every push to `main`, every three hours, and on demand, which keeps the numbers current and the wording on the page honest ("refreshed every few hours" rather than "live").

1. Push this repository to GitHub.
2. Settings → Pages → **Source: GitHub Actions**.
3. Push to `main`, or run the workflow from the Actions tab.

The workflow works out the URL by itself: a repository named `<you>.github.io` is served at the domain root, anything else under `/<repo>`.

### Custom domain (tapecti.com)

No `CNAME` file: Pages ignores it for sites deployed by Actions. No Cloudflare needed either; Pages issues the HTTPS certificate itself.

1. **Verify the domain** (stops anyone else claiming it): GitHub → your account Settings → Pages → Add a domain → `tapecti.com`, then add the TXT record it shows at your DNS provider.
2. **DNS at Namecheap** (Domain List → Manage → Advanced DNS), replacing any parking records:
   | Type | Host | Value |
   | --- | --- | --- |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `<you>.github.io.` |
3. **Repository** Settings → Pages → Custom domain: `tapecti.com`. Wait for the DNS check, then tick **Enforce HTTPS** (the certificate can take a little while).
4. **Repository** Settings → Secrets and variables → Actions → Variables: add `CUSTOM_DOMAIN` = `tapecti.com`, then run the workflow. The build then uses the domain root and `https://tapecti.com` for canonical links and share cards.

Do step 4 after step 3: until Pages serves the domain, a root-path build would break the `github.io/<repo>` address.

To produce the same build locally:

```bash
NEXT_PUBLIC_STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/<repo> NEXT_PUBLIC_SITE_URL=https://<you>.github.io/<repo> npm run build
```

```powershell
$env:NEXT_PUBLIC_STATIC_EXPORT="1"; $env:NEXT_PUBLIC_BASE_PATH="/<repo>"; $env:NEXT_PUBLIC_SITE_URL="https://<you>.github.io/<repo>"; npm run build
```

The result lands in `out/`. Serve that folder under the same base path to check it; opening the files directly will not work, because the links are absolute.

For figures that update in the visitor's browser, deploy to a host that runs Node (Vercel, Netlify, Cloudflare) with `npm run build` and no `NEXT_PUBLIC_STATIC_EXPORT`; everything else stays the same.

## When Roblox doesn't answer

Requests that are throttled or fail are retried. If one still fails, that piece of the page falls back to `roblox-snapshot.json`, the last complete answer from Roblox, which the site rewrites whenever every request succeeds. Keep it committed: it's what a build uses if Roblox is having a bad day.

## Structure

```
src/app/[[...path]]/page.tsx   /  and  /experiences/:id  (prerendered, revalidated)
src/app/api/metrics            live experience stats for the browser
src/app/og/[id]                share images from your avatar and game art
src/lib/roblox.ts              Roblox API client (users, thumbnails, games, groups)
src/lib/profile-data.ts        assembles everything the page needs
src/profile/                   the interface: Nav, sections/, ExperienceView, VerifiedBadge
```
