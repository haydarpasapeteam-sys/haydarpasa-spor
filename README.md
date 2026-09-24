# Haydarpaşa Lisesi — Beden Eğitimi ve Spor Bölümü

Production website for Haydarpaşa Lisesi's Physical Education & Sports
Department. A static [Astro](https://astro.build) site, content managed
through [Pages CMS](https://pagescms.org), hosted for free on GitHub Pages.

- **Production URL:** https://haydarpasapeteam-sys.github.io/haydarpasa-spor/
- **Repository:** https://github.com/haydarpasapeteam-sys/haydarpasa-spor
- **Turkish editor guide:** see [`EDITOR_GUIDE_TR.md`](./EDITOR_GUIDE_TR.md)
- **Migration decisions:** see [`MIGRATION_REPORT.md`](./MIGRATION_REPORT.md)

## Table of contents

1. [Project purpose](#project-purpose)
2. [Architecture](#architecture)
3. [Why Astro and Pages CMS](#why-astro-and-pages-cms)
4. [Why GitHub Pages cannot run Payload (or any server)](#why-github-pages-cannot-run-payload-or-any-server)
5. [Local setup](#local-setup)
6. [Content structure](#content-structure)
7. [Validation](#validation)
8. [Testing](#testing)
9. [Production build](#production-build)
10. [GitHub Pages configuration](#github-pages-configuration)
11. [GitHub Actions workflows](#github-actions-workflows)
12. [Pages CMS setup](#pages-cms-setup)
13. [Rollback using Git](#rollback-using-git)
14. [Scheduled publishing limitations](#scheduled-publishing-limitations)
15. [Media optimization](#media-optimization)
16. [Repository size management](#repository-size-management)
17. [Student data safety](#student-data-safety)
18. [Missing ogrenci_taahhutnamesi.pdf](#missing-ogrenci_taahhutnamesipdf)
19. [Custom domain](#custom-domain)
20. [Backup and recovery](#backup-and-recovery)

## Project purpose

The department previously ran a single 500-line `index.html` "tab
application" with no build tooling, a hard-coded Tailwind/Lucide CDN
dependency, ~19.5 MiB of unoptimized images loaded on every visit
(including images belonging to hidden tabs), a broken image reference, a
zero-byte PDF, leftover citation artifacts in two legal documents, and a
mobile navigation bug that positioned the first nav item off-screen. None
of the content — announcements, match results, team rosters — could be
edited without editing raw HTML.

This rebuild replaces that with real routes, a real content model, and a
non-technical editing workflow, while deliberately preserving the school's
visual identity (colors, typography, section names, branding) exactly as
it was.

## Architecture

```
Editor (PE teacher)
   │  signs in with GitHub account
   ▼
Pages CMS (hosted, app.pagescms.org)
   │  edits structured fields → commits directly to GitHub
   ▼
GitHub repository (source of truth, version history)
   │  push triggers
   ▼
GitHub Actions
   ├─ validate.yml            (PRs + pushes): content/link/document rules,
   │                           typecheck, lint, unit tests, build
   ├─ deploy.yml              (push to main): build + deploy
   └─ scheduled-rebuild.yml   (every 30 min + manual): re-evaluate
                               publishAt/expiresAt, rebuild, redeploy
   ▼
GitHub Pages (static hosting, the only production runtime)
```

There is no database, no server-side runtime, no custom backend, and no
authentication server anywhere in this stack. Content lives as Markdown
files with YAML frontmatter under `src/content/`, validated by Zod schemas
in `src/content.config.ts` (Astro's Content Layer API), and rendered at
build time into plain HTML/CSS with a handful of small Astro islands
(none — this site ships zero client-side JavaScript frameworks; the only
inline `<script>`s are `window.print()` and the Astro-generated
image/manifest logic, which runs at build time in Node, not in the
browser).

## Why Astro and Pages CMS

- **Astro** produces fully static HTML with zero required client-side
  JavaScript, has first-class Content Collections with a Zod-typed schema
  layer (`astro:content`), and deploys natively to GitHub Pages with
  correct project-path (`base`) handling.
- **Pages CMS** is a hosted, open-source Git-backed CMS: it edits files
  directly in this GitHub repository and turns every save into a real Git
  commit. It requires no server the school has to run, no database, and no
  custom authentication — the editor's GitHub account *is* the
  authentication, and GitHub's own repository-access controls (not a
  CMS-specific role system) decide who can save.

## Why GitHub Pages cannot run Payload (or any server)

GitHub Pages serves static files only — there is no Node.js process, no
persistent server, and no database connection available to a GitHub Pages
site. Payload CMS (and any server-rendered CMS/admin panel) requires a
long-running Node server and typically a database; neither can run on
GitHub Pages without a separate paid hosting provider, which this project
is explicitly not allowed to introduce (see the cost constraints in the
original project brief). Pages CMS avoids this entirely by editing the
Git repository itself rather than running its own backend against this
site.

## Local setup

### Requirements

- **Node.js** ≥ 20 (LTS). Developed against Node 22.
- **pnpm** ≥ 9. Enable via Corepack: `corepack enable pnpm`.

### Commands

```bash
pnpm install              # install dependencies (frozen lockfile in CI)
pnpm run dev               # local dev server at http://localhost:4321/haydarpasa-spor/
pnpm run migrate:legacy     # (re-)run the legacy content migration (idempotent, see below)
pnpm run optimize:images   # generate AVIF/WebP derivatives + manifest
pnpm run validate          # validate:content + validate:links + validate:documents
pnpm run check              # astro check (TypeScript strict mode)
pnpm run lint                # eslint .
pnpm run test                # vitest unit tests
pnpm run test:e2e            # playwright (needs `pnpm run build && pnpm run preview` running)
pnpm run build               # validate → optimize:images → astro build (production)
pnpm run preview             # serve the built dist/ locally
```

## Content structure

```
src/content/
  announcements/   # Duyurular — news feed, publishAt/expiresAt scheduling
  sports/          # Branşlar — the sport/branch taxonomy
  teams/           # Takımlar — school teams per sport/season
  matches/         # Maçlar — single matches with scores (currently empty, see MIGRATION_REPORT.md)
  tournaments/     # Turnuvalar — multi-team school tournaments
  documents/       # Belgeler — public blank PDF templates only
  galleries/       # Galeriler — SporFest year-by-year photo archive links
src/data/site.json # Site Ayarları — school name, contact info, SEO defaults
```

> **Expected benign warning:** `astro sync`/`build`/`check` print
> `[glob-loader] No files found matching ... in directory ".../src/content/matches"`.
> This is not an error (exit code 0) — it's Astro's glob content loader
> correctly reporting that the Matches collection has no entries yet (see
> above). It goes away on its own once a real match is added through
> Pages CMS; see the comment above the `matches` collection in
> `src/content.config.ts` for why this isn't worked around with a
> placeholder entry.

Every collection's schema (required fields, enums, date rules, cross-field
validation) lives in `src/content.config.ts`. Business rules — announcement
visibility, match-winner computation, slug/date validation — live in
`src/lib/*.ts`, unit-tested in `tests/unit/`.

## Validation

Three standalone Node scripts run **before every build** (`pnpm run
build` runs them automatically; they also run in CI):

| Script | Checks |
|---|---|
| `scripts/validate-content.mjs` | Required fields, slug format/uniqueness, enum values, date validity, `expiresAt >= publishAt`, match team/score rules, cover-image/alt pairing, repo-wide stray citation-marker scan, no executables/archives under `public/media/` |
| `scripts/validate-links.mjs` | Every `coverImage`/`file` path exists on disk; every cross-collection reference (`sport`, `relatedDocument`, etc.) resolves to a real entry; optional external-URL reachability check (`VALIDATE_EXTERNAL_LINKS=1`) that only ever warns, never fails a build, because an authentication-protected Google Form correctly returning 401/403 is not a broken link |
| `scripts/validate-documents.mjs` | Every published document's PDF exists, is non-zero bytes, and starts with a real `%PDF-` signature; sweeps all of `public/media/documents/` defensively; confirms the known-empty legacy PDF never leaks into `public/` |

All three exit non-zero on any violation, with a Turkish, human-readable
error list.

## Testing

- **Unit tests** (`pnpm run test`, Vitest): announcement visibility rules,
  Europe/Istanbul date parsing, match winner/score validation, slug
  validation, base-URL helpers. 44 tests, `tests/unit/`.
- **E2E + accessibility tests** (`pnpm run test:e2e`, Playwright):
  responsive/overflow checks at 320/360/390/768/1280/1440px, mobile
  header/nav reachability, document print-layout A4 checks, route-status
  checks, broken-link checks, and an axe-core accessibility scan (WCAG
  2 A/AA) on every primary route. 184 passing checks across 6 viewport
  projects, `tests/e2e/`. Requires the production build to be running
  first (`astro preview` cannot be auto-spawned by Playwright — see the
  comment in `playwright.config.ts`):
  ```bash
  pnpm run build && pnpm run preview &
  pnpm run test:e2e
  ```
- **Lighthouse audit** (`pnpm run lighthouse`, `scripts/lighthouse-check.mjs`):
  a real, reproducible Lighthouse run (mobile, simulated throttling)
  against the actual production build served under `/haydarpasa-spor/`
  (not an estimate) — same prerequisite as above (preview server running).
  Checks the homepage and one content-heavy page against spec §20's
  thresholds (Performance ≥90, Accessibility/Best Practices/SEO ≥95,
  CLS <0.1), exits non-zero if any route falls short, and writes full
  JSON reports to `lighthouse-reports/` (gitignored — regenerate anytime).
  Runs in CI on every PR/push as part of `validate.yml`, with the JSON
  reports uploaded as a workflow artifact regardless of pass/fail.

## Production build

```bash
pnpm run build   # validate → optimize:images → astro build
```

Output goes to `dist/`. `pnpm run build:unsafe` skips validation (used
internally by CI steps that already ran validation separately, or for
quick local iteration).

## GitHub Pages configuration

Required repository settings (**Settings → Pages**):

- **Source:** GitHub Actions (not "Deploy from a branch").
- No custom domain configured by default — the site serves from the
  project path `https://haydarpasapeteam-sys.github.io/haydarpasa-spor/`.
  `astro.config.mjs` sets `site` and `base` accordingly; every internal
  link and asset reference goes through `src/lib/url.ts`'s `withBase()`/
  `canonicalUrl()` helpers rather than hard-coding `/haydarpasa-spor/`
  anywhere, so switching to a custom domain later only requires changing
  `astro.config.mjs` (see [Custom domain](#custom-domain)).

## GitHub Actions workflows

- **`.github/workflows/validate.yml`** — runs on every PR and push to
  `main`, and manually. Full validate → typecheck → lint → unit tests →
  build pipeline. Least-privilege (`contents: read` only).
- **`.github/workflows/deploy.yml`** — runs on push to `main` and manually.
  Builds, then deploys via the official `actions/configure-pages` +
  `actions/upload-pages-artifact` + `actions/deploy-pages` sequence using
  GitHub's OIDC-based Pages deployment permissions (`id-token: write`,
  `pages: write`) — no long-lived deployment token is stored anywhere.
  The deploy job only runs `if: github.ref == 'refs/heads/main'`.
- **`.github/workflows/scheduled-rebuild.yml`** — runs every 30 minutes
  and manually. Re-evaluates every announcement's `publishAt`/`expiresAt`
  against the current time and redeploys, so scheduled publication and
  expiry actually take effect without a human clicking anything (see
  [Scheduled publishing limitations](#scheduled-publishing-limitations)).

All three pin every third-party action to a full, immutable 40-character
commit SHA (not a moving major-version tag like `@v4`) with a `# vX.Y.Z`
comment for human readability, and cache the pnpm store and the generated
image derivatives to keep runs fast. Each SHA was resolved and verified
against the action's own repository (dereferencing annotated tags to their
underlying commit where needed — `pnpm/action-setup@v4` is one such
annotated tag) rather than copied from a tag name. To intentionally bump
one later, resolve the new tag's commit SHA the same way (e.g.
`gh api repos/actions/checkout/git/refs/tags/v5`, dereferencing via
`git/tags/<sha>` if `object.type` is `"tag"` rather than `"commit"`) and
update both the SHA and its version comment.

## Pages CMS setup

1. **Install the Pages CMS GitHub App** on the
   `haydarpasapeteam-sys/haydarpasa-spor` repository (or the whole
   organization, then restrict access to just this repo) from
   https://app.pagescms.org/ — sign in with a GitHub account that has at
   least write access to the repository, and grant the app access to this
   repository only.
2. **Limiting repository access:** in the GitHub repository's
   **Settings → Collaborators and teams**, only add the specific GitHub
   accounts of people who should be able to publish (the PE teacher(s)).
   Pages CMS has no separate role system of its own — see
   `/yonetim/` on the live site and `EDITOR_GUIDE_TR.md` for exactly how
   this is explained to the teacher.
3. Open https://app.pagescms.org/, select this repository, and the sidebar
   defined in `.pages.yml` appears immediately — no further configuration
   is required. `.pages.yml` is the single source of truth for every field,
   label, and media rule the editor sees.

## Rollback using Git

Because every Pages CMS save is a normal Git commit, rolling back a
mistake is a normal Git operation:

```bash
git log --oneline -- src/content/announcements/   # find the bad commit
git revert <commit-sha>                            # or:
git checkout <previous-sha> -- src/content/announcements/some-file.md
git commit -m "Revert incorrect announcement edit"
git push
```

The next scheduled rebuild (or a manual `workflow_dispatch` run of
`deploy.yml`) republishes the corrected content within 30 minutes at most.

## Scheduled publishing limitations

Static sites cannot execute code at request time. `publishAt`/`expiresAt`
are only re-evaluated when a build runs — on every push, and additionally
every 30 minutes via `scheduled-rebuild.yml`. This means:

- A future-dated announcement can appear **up to 30 minutes late**.
- An expired announcement can remain visible for **up to 30 minutes**
  after its `expiresAt` time before disappearing from the active list.
- This is a documented, deliberate trade-off, not a bug — see spec-level
  reasoning in `MIGRATION_REPORT.md` and the code comments in
  `.github/workflows/scheduled-rebuild.yml` and `src/lib/dates.ts`.
- All dates are anchored to **Europe/Istanbul (UTC+03:00, no DST since
  2016)** regardless of which timezone the GitHub Actions runner itself
  is in — see `src/lib/dates.ts`'s `parseIstanbulDate()`.

## Media optimization

Pages CMS uploads land as-is in `public/media/images/` (originals, often
several MB each). `scripts/optimize-images.mjs` (run automatically before
every build) reads every original and generates 480/800/1200px-wide
AVIF + WebP derivatives plus a JSON manifest
(`public/media/images/_manifest.json`) that
`src/components/ui/ResponsiveImage.astro` consumes to render a real
`<picture>` with `srcset`, explicit `width`/`height` (no layout shift), and
`loading="lazy"` on everything except the true LCP image per page. The
homepage's total local-media weight was reduced from the legacy ~19.5 MiB
to roughly 1 MB worst-case (see `MIGRATION_REPORT.md` for the measurement).
Generated derivatives are **not committed to Git** — they're regenerated
(and cached) on every CI run; see `.gitignore` and the `actions/cache` step
in every workflow keyed on the source images' hash.

## Repository size management

- Generated image derivatives and the manifest are gitignored, not
  committed (see above) — they would otherwise bloat repository size on
  every image change.
- Byte-identical duplicate images (verified by checksum) were removed at
  migration time; see `MIGRATION_REPORT.md`'s deduplication table.
- Superseded/orphaned legacy posters were preserved under
  `public/media/legacy/` rather than deleted outright, for provenance —
  but are not referenced by any live page, so they cost nothing at
  request time.

## Student data safety

**Never store in this repository:** completed health declarations, T.C.
identity numbers, named students' birth dates or blood groups, medical
diagnoses, parent signatures, private phone numbers, or uploaded completed
permission forms. This repository is **public**, and even a `Taslak`
(Draft) status only hides content from the *rendered site* — its raw text
is still visible to anyone browsing the Git history on GitHub. The
Documents collection is schema-restricted to public **blank** templates
only (see `src/content.config.ts`); there is intentionally no content
collection for completed student forms.

The existing "Evrak Yükle" Google Form (linked from `/iletisim/`) collects
completed student/parent submissions **outside this repository**, in
Google's own infrastructure. This project did not access, download, or
migrate any of that form's responses. Its ownership was not independently
re-verified as part of this rebuild; the school should confirm (a) which
Google Workspace account owns the form, (b) who else can view responses,
(c) how long responses are retained, and (d) the deletion process — and
document the answer somewhere the department can reference, since this is
outside what a static site's source code can control or prove.

## Missing ogrenci_taahhutnamesi.pdf

The legacy `ogrenci_taahhutnamesi.pdf` was **zero bytes** — an empty file,
not a real document. It has been moved to
`pending-documents/ogrenci-taahhutnamesi-BEKLENIYOR.pdf` (outside
`public/`, so it is never served), is excluded from the Documents
collection entirely, and `/belgeler/` shows a visible "Dosya Bekleniyor"
notice explaining this. **A human dependency remains:** the school must
supply the real, approved PDF. Once available, replace the placeholder
file and either add it through Pages CMS's Belgeler collection (uploading
the real PDF to the `documents` media source) or ask a developer to add
the corresponding content entry directly — `scripts/validate-documents.mjs`
will reject it automatically if it is still empty or not a real PDF.

## Custom domain

If a custom domain is added later:

1. Add a `public/CNAME` file containing the domain (one line, no
   `https://`, e.g. `spor.haydarpasalisesi.k12.tr`).
2. Configure the domain's DNS per GitHub's custom-domain documentation
   (an `A`/`ALIAS`/`CNAME` record pointing at GitHub Pages).
3. Update `astro.config.mjs`: set `site` to the new domain and `base` to
   `'/'`.
4. No other code changes are required — every internal link/asset
   reference goes through `src/lib/url.ts`'s `withBase()`, which reads
   Astro's own `BASE_URL` at build time.

## Backup and recovery

The Git repository itself **is** the backup — every piece of content, every
edit, and full history are already in GitHub (and in every local clone).
Additional recommended practice:

- Because Pages CMS commits directly to `main`, consider periodically
  tagging a release (`git tag content-2026-10-01`) before major content
  pushes, so a specific known-good state is one command away
  (`git checkout content-2026-10-01`).
- GitHub's own repository export/download-as-zip feature is a valid
  additional offline backup if desired — no extra tooling required.
