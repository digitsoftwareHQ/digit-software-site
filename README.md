# digit.software

The public website for Digit Software. Static site built with [Astro](https://astro.build), published to GitHub Pages.

## Develop

Requires Node 22.12 or newer.

```sh
npm install
npm run dev        # http://127.0.0.1:4321 with live reload
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
npm run check      # verify dist/: links, anchors, assets, metadata, no third-party loads, no editor traces
npm test           # content files are valid; Owner Editing Mode saves safely and stays development-only
```

Astro telemetry is disabled in every script.

## Structure

```
src/
  content/             all public marketing copy, one JSON file per page (+ global.json), with typed modules
                       (home.ts, ...) and the field schema (schema.ts) and formatting steps (format.json)
  pages/               index (home), company, platform, businesses, technology, privacy, terms, 404
  layouts/             BaseLayout (head, metadata, header, footer), LegalLayout
  components/          Header, Footer
  components/home/     homepage sections
  components/shared/   pieces used on more than one page (page hero, platform stack, Mission Control screen,
                       Cerebro explorer, cycle diagram, business emblems, closing band, contact section)
  scripts/universe.ts  knowledge-universe renderer (home hero, Cerebro explorer)
  scripts/site.ts      header state, mobile navigation, scroll reveals
  data/site.ts         site name, page titles and descriptions, navigation destinations
  data/businesses.ts   the five business areas: ids (anchors) and colours, in order
  data/cerebro-example.ts  the illustrative Cerebro records and the order of the knowledge kinds
  styles/global.css    design tokens and shared primitives
public/                favicons, brand mark, social card, CNAME
tools/og/              source for the social card (public/assets/digit-social-v5.png)
integrations/owner-edit/  Owner Editing Mode (development only, see below)
scripts/check-site.mjs post-build checks
scripts/test-owner-edit.mjs  content and Owner Editing Mode tests
```

## Content rules

- Public copy lives in `src/content/*.json`. Components hold structure and presentation, not prose. Legal pages
  (`src/pages/privacy.astro`, `src/pages/terms.astro`) keep their text in the page and are not part of the editor.
- Nothing on the site is live company data. The Mission Control screen, the Cerebro explorer and the platform
  model are illustrative and say so.
- No status language (coming soon, beta, in development), no invented metrics, customers or partners, no em dashes.
- No analytics, cookies, embeds or third-party scripts. Fonts (Mona Sans, JetBrains Mono, both OFL-1.1) are
  self-hosted. `npm run check` fails the build if anything loads from another origin. If that ever changes,
  update the privacy policy in the same change.

## Owner Editing Mode

A local, development-only way to change the site's words on the real rendered pages.

1. `npm run dev`, then open any page with `?edit` added, for example `http://127.0.0.1:4321/?edit`.
2. Text you can edit gets a dashed outline when you point at it. Click it to open the editor.
3. Change the text. For paragraphs, leave a blank line between paragraphs; for lists, one item per line.
4. Optional formatting, only where the element supports it: Size, Width, Spacing above, Spacing below, and on the
   closing and contact bands, Alignment. Steps preview live on the page. Choices are fixed steps (format.json), never
   free CSS.
5. Save (or Enter for one-line text, Cmd/Ctrl+Enter for paragraphs). The file in `src/content/` is updated and the
   page reloads with the real result. Cancel (or Esc) discards the edit. Revert restores what the field had when
   the session began.
6. The toolbar (bottom left) shows how many changes this session made; open it to review them. Exit leaves editing
   mode. Alt/Option-click follows a link while editing.

Link destinations, accessible names, ids and anchors are set in code and shown read-only. The editor only writes
existing values in the six content files, never commits, pushes or publishes, and is not part of the production
build: `astro build` includes no editor script, styles, attributes or endpoint, and `npm run check` fails if any
trace of it reaches `dist/`.

After an editing session, review `git diff src/content`, fold repeated formatting choices into the shared design
where that is the real intent, then run `npm test`, `npm run build`, `npm run check` and commit.

## Deploying

GitHub Pages publishes this site from GitHub Actions (**Settings -> Pages -> Build and deployment -> Source:
GitHub Actions**). Every push to `main` runs `.github/workflows/deploy.yml`: `npm ci`, `npm test`, `npm run build`,
`npm run check`, then publishes `dist/`. If any step fails, nothing is published and the previous deployment stays
live. Keep the Pages source on GitHub Actions: the repository root has no `index.html`, so switching back to
"Deploy from a branch" would break the live site.

The custom domain is `digit.software` (`public/CNAME`, plus the domain set in the Pages settings), with HTTPS
enforced.

## Regenerating the social card

Serve the repository root (`python3 -m http.server 4400`), open `/tools/og/og-card.html` in a 1200x630
viewport at device scale 1, capture a PNG, and save it as `public/assets/digit-social-vN.png`, then update
`ogImage` in `src/data/site.ts`.
