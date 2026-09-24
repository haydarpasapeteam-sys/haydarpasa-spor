# Migration Report

This document records what was migrated from the legacy flat-HTML repository
into the Astro content collections, why each judgment call was made, and
what was deliberately left out to avoid fabricating content. It is the
companion reference for `scripts/migrate-legacy-content.mjs`.

## Source material inspected

- `index.html` (the single-page "tab" application), all linked PNG/JPG
  posters, all 9 HTML/PDF document pairs, `manifest.json`, and the three
  Python utility scripts (`duzelt.py`, `fix_site.py`, `make_pdfs.py`).
- Every poster image was opened and read visually — several contained real,
  previously-undiscoverable content that never appeared in `index.html`
  itself (see "Content recovered from posters" below).
- Git history: the entire legacy repository was created between
  2026-09-21 and 2026-09-23 — there is no multi-year history to mine for
  dates; almost every date used below is either an explicit date printed on
  a poster, or (where noted) a conservative proxy.

## Content recovered from posters (not previously visible on the live site)

These posters existed in the repository but were **not linked from any tab**
in `index.html`, so their content was effectively invisible to visitors.
Reading them surfaced real, useful information:

| Poster | Recovered content | Where it went |
|---|---|---|
| `basarilarimiz.png` | Futsal team = Türkiye ikincisi (2nd nationally); girls' table tennis = İstanbul 5.si; boys' volleyball = Üsküdar 3.sü | `announcements/basarilarimiz-2025-2026.md`, `kurumsal/index.astro` |
| `takimlarimiz.png` | The 5 real 2025-2026 school teams and their branches | `teams/*.md` |
| `duyurular.png` | Two dated historical announcements (13/14 Nisan 2026) | `announcements/voleybol-turnuvamiz-basliyor.md`, `.../yakantop-turnuvamiz-basliyor.md` |
| `okul_ici.png` | All-Star Voleybol Turnuvası (11. sınıf champion) and Sınıflararası Yakantop Turnuvası (Yeşilay Kulübü) results | `tournaments/all-star-voleybol-turnuvasi-2025-2026.md`, `.../siniflarasi-yakantop-turnuvasi-2025-2026.md` |
| `sporfest.png` | Full SporFest history 2018-2026 with exact dates, guest-school lists, and organizing-committee context | `galleries/sporfest-*.md`, `sporfest/index.astro` |
| `vizyonumuz.png`, `degerlerimiz.png` | Full Vizyon / Değerler / Hedefler text | `kurumsal/index.astro` |
| `hareket_bilimi.png`, `brans_rehberimiz.png` | Full branch list and fitness-test list | `sports/*.md`, `egitim-ve-rehber/index.astro` |
| `anasayfa.png` | Homepage tagline and "Eğitim Yaklaşımı" pillars | `index.astro` hero text |

## Dating policy

1. Where a poster or the live site printed an explicit real-world date
   (an event date, a SporFest year's exact dates), that exact date was used
   verbatim.
2. Where **no** date existed anywhere in the source material for a piece of
   content that is genuinely being announced now (e.g. the "Başarılarımız"
   achievement recap), the file's first git-upload timestamp
   (2026-09-18 through 2026-09-21) was used as `publishAt` — this is not a
   fabrication, since it is factually when the item was first made public.
3. Where a schema field is normally required but the underlying real fact
   is genuinely unknown (see "Schema deviation" below), the field was made
   optional rather than inventing a value.

## Schema deviation: optional `startDate`/`endDate` on Tournaments

Spec §7 lists `startDate`/`endDate` as tournament fields without marking
them optional. At migration time, the one active 2026-2027 tournament
(*Futsal All-Star Turnuvası*) has open registration but **no announced
start date anywhere in the source material**. Requiring a date would have
forced fabricating one. `content.config.ts` makes both fields `.optional()`
with an inline comment explaining this; the historical 2025-2026
tournaments (All-Star Voleybol, Sınıflararası Yakantop) do have real dates
and use them.

## Editorial merges (documented inference, not asserted certainty)

Two pairs of source items were merged into one tournament record each,
because they are almost certainly the same real-world event described at
two different points in time, not two different events:

- `duyurular.png`'s "13 Nisan 2026 — Voleybol Turnuvamız Başlayacaktır" +
  `okul_ici.png`'s "All-Star Voleybol Turnuvası, 11. sınıf şampiyon" →
  one `tournaments/all-star-voleybol-turnuvasi-2025-2026.md` record.
- `duyurular.png`'s "14 Nisan 2026 — Yakantop Turnuvamız Başlayacaktır" +
  `okul_ici.png`'s "Sınıflararası Yakantop Turnuvası, Yeşilay Kulübü" →
  one `tournaments/siniflarasi-yakantop-turnuvasi-2025-2026.md` record.

The school only ran one voleybol and one yakantop turnuvası in that window,
so this is a reasonable match — but it is a judgment call, flagged here for
a human editor to confirm or split apart later if it turns out to be wrong.

## Deliberately NOT migrated (to avoid fabrication)

- **Matches collection is empty.** The legacy site contains tournament
  *placements* (2nd place, 5th place, 3rd place) and one *open-registration*
  tournament, but zero single-match "Team A vs Team B, final score N-N"
  records anywhere. Rather than invent an opponent and a score, the
  Matches collection, its schema, CMS form, validation rules, and the
  `/maclar/` listing page were all built and are fully working — they are
  simply empty until the PE teacher enters a real result. The `/maclar/`
  page shows an honest empty-state message instead of fake data.
- **`ogrenci_taahhutnamesi.pdf`** — the legacy file is 0 bytes. Moved to
  `pending-documents/ogrenci-taahhutnamesi-BEKLENIYOR.pdf` (outside
  `public/`, so it can never be served), excluded entirely from the
  Documents collection, and surfaced as a visible "Dosya Bekleniyor" notice
  on `/belgeler/`. See README.md's "Missing ogrenci_taahhutnamesi.pdf"
  section for how the teacher should supply the real file.
- **`fiksturler.png`** — turned out to be an empty title-slide placeholder
  ("2026-2027 FİKSTÜR") with zero fixture data on it. Preserved under
  `public/media/legacy/` but not linked from the new site.
- **`kizfutsal.png`** — an unlabeled candid photo with no confirmed team,
  date, or event context, and no matching entry on the official 5-team
  roster poster (`takimlarimiz.png`). Preserved under `public/media/legacy/`
  rather than invented into a "Kız Futsal Takımı" team record.
- **Portfolyo 1/2 PDFs** (`portfolyo1.pdf`, `portfolyo2.pdf`) — superseded;
  the live site's E-Portfolyo cards already link to Google Drive-hosted
  versions of the same templates. The local PDFs were preserved under
  `public/media/legacy/` for provenance, not re-published as Documents.
- **`erkekvoleybol.png`** — an earlier draft tryout poster with a
  **conflicting** date (1 Ekim) versus the live, currently-referenced
  poster `erkekvoleybol2.png` (24 Eylül). Treated as superseded/stale and
  moved to `public/media/legacy/`; the live date (24 Eylül) was used.

## Deduplication (byte-identical files, verified by checksum)

| Canonical file kept | Duplicates removed |
|---|---|
| `public/media/images/branding/spor-kulubu-logosu.jpg` | `logo.jpg`, `spor kulübü logo.jpg` |
| `public/media/images/branding/sporfest-2026-logosu.jpg` | `sporfest2026_logo.jpg`, `sporfest_logo.jpg`, `2026 sporfest logo.jpg` |
| `public/media/images/kurumsal/degerlerimiz-ve-hedeflerimiz.png` | `degerlerimiz.png`, `Degerlerimiz ve Hedeflerimiz.png`, `degerlerimiz_ve_hedeflerimiz.png` |

All three groups were confirmed byte-identical via MD5 before removal.

## The two "ghost" Unicode-normalization files

`spor kulübü logo.jpg` and `sporfest2025ve öncesi.jpg` appeared as
**untracked** in `git status` immediately after a fresh `git clone` — a
sign that they were uploaded through GitHub's web UI with a filename
normalization mismatch (NFD-decomposed Turkish characters) between what
got committed to the Git index and what macOS's filesystem produced on
checkout. Both were re-added under clean ASCII kebab-case names:
`spor-kulubu-logosu.jpg` (confirmed byte-identical to `logo.jpg`, so simply
dropped as a duplicate) and `sporfest-2025-ve-oncesi-logosu.jpg` (a real,
distinct, valid image — see next section).

## SportFest 404 fix

`sporfest_ucuncu_logo.jpg` was referenced in `index.html` but did not exist
anywhere in the repository (404 in production). The task description's
hint — that the intended file is `sporfest2025ve öncesi.jpg` — was verified
visually: it is a valid, distinct SporFest-era phoenix emblem on a maroon
background. Renamed to `sporfest-2025-ve-oncesi-logosu.jpg`, referenced from
the new `/sporfest/` gallery entry, and confirmed to return HTTP 200 in the
Playwright E2E suite (`tests/e2e/responsive.spec.ts`).

## Sports list

The legacy `brans_rehberimiz.png` top-line summary graphic lists 9 branches
across 3 categories, but its own detailed sub-guide pages (further down the
same poster) include two more — **Masa Tenisi** and **Flag Futbol** — that
the summary graphic itself omits. Combined with **Futbol** (distinct from
Futsal), which appears on `anasayfa.png`'s branch icons and in
`sporfest.png`'s "Misafir Okullarımız" guest-school lists under separate
"Erkek Futbol"/"Kız Futbol" categories, the final `sports` collection has
12 entries rather than the summary graphic's 9. This is a faithful, not an
inflated, reading of the actual source material.
