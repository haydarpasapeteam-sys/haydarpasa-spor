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

## Addendum: reconciling 24 live hand-edits to legacy `index.html` (2026-09-24)

While this rebuild was in progress, `main` received 24 more commits (all
2026-09-24, 16:03–19:47 +03:00) directly hand-editing the legacy
`index.html` on GitHub's web UI — the exact workflow this project
replaces. These were merged into `feat/astro-rebuild` via a normal
`git merge` (not a rebase), and every meaningful change was individually
classified below. Full diff inspected: `git diff acbac31 origin/main`
(3 files: `index.html`, `pickleball.png`, `Pickleballseçmeler.png`).

### Migrated (legitimate new content)

- **Pickleball Takım Seçimi** (new tryout announcement). Verified from
  the poster image itself (not guessed): **30 Eylül 2026 Çarşamba, saat
  12.00, Tenis Kortu**. Real Google Form URL preserved. Poster moved from
  the repo root into `public/media/images/duyurular/pickleball-takim-secimi.png`
  (clean ASCII kebab-case, optimized by `scripts/optimize-images.mjs`
  like every other announcement image — not left in a legacy directory).
  New content file: `src/content/announcements/pickleball-takim-secimi.md`.
- **Erkek Voleybol seçme sonuçları**. The tryout announcement
  (`erkek-voleybol-takimi-secmeleri.md`) no longer presents the tryout as
  merely upcoming — historical tryout info (date, venue, original
  application/veli-izni links) is preserved verbatim, and a real Canva
  results-board URL (`https://www.canva.com/design/DAHWHPOy3CI/r7ocJt5lkWaa1WS59RNB2Q/view`)
  was added. This didn't fit any existing field cleanly, so the smallest
  generic schema addition was made: a new optional `resultsUrl` field on
  the **Announcements** collection (mirroring the field of the same name
  and purpose that already existed on Tournaments) — added to
  `content.config.ts`, `.pages.yml` ("Sonuçlar Bağlantısı"),
  `validate-content.mjs`, and rendered as a "Sonuç Listesini Gör" button
  on the announcement detail page. Fully editable through Pages CMS.
  `expiresAt` was extended (a results notice has a longer useful shelf
  life than a same-day tryout reminder).

### Rejected (known-bad changes — not migrated)

- **Erkek Voleybol "Veli İzni" → `ogrenci_taahhutnamesi.pdf`.** The live
  hand-edit repointed this button at the zero-byte legacy PDF. Not
  adopted — the original working Google Form URL was kept. The empty PDF
  remains at `pending-documents/ogrenci-taahhutnamesi-BEKLENIYOR.pdf`,
  outside `public/`, and the "Dosya Bekleniyor" notice on `/belgeler/` is
  unchanged.
- **Futsal "Fikstür" → `fiksturler.png`.** The live hand-edit repointed
  the fixture link at the empty title-slide placeholder documented
  earlier in this report as having zero real fixture data. Not adopted.
  This project's `/turnuvalar/` page does not present any fixture as
  real until a genuine one is supplied — the honest not-yet-published
  state is retained.
- **Basketbol "İzin Belgesi" → `https://forms.gle/vRLhL45pMhG55e1W8`.**
  Investigated per instruction, without submitting any data: this URL
  returns **HTTP 404** — it does not resolve to a real form at all. Not
  adopted. The existing, working link (`ders-disi-egzersiz-izin-belgesi`,
  referenced via `relatedDocument`) was kept. **Action needed from the
  teacher:** if a Google Form was actually intended to replace the local
  PDF for this permission, please supply the correct, working URL — the
  one currently on the live legacy page does not work.
- **Futsal "Takım Kayıt" → `https://forms.gle/QXvR7VJhbEYzdGJv9`.** This
  differs from the existing recorded URL
  (`https://forms.gle/QxvR7VJhBeYzdGJv9`) only in the case of two
  letters. Checked both, without submitting anything: the new one also
  returns **HTTP 404** (almost certainly a typo introduced while
  hand-retyping the HTML). Not adopted — the existing URL was kept.

### Self-correction found during this same investigation

Checking the existing, *working* futsal URL
(`https://forms.gle/QxvR7VJhBeYzdGJv9`) turned up a labeling mistake from
the **original** migration (not something `main`'s edits introduced):
that URL's real Google Form title is **"Futsal Turnuvası Görevli Başvuru
Formu"** — a staff/volunteer sign-up form, not a team-captain
registration form, even though the legacy button was labeled "Takım
Kayıt". Corrected: the Futsal All-Star tournament's `applicationUrl` was
moved to `staffApplicationUrl` (already an existing Tournaments field,
now also rendered in `TournamentCard.astro` as "Görevli Başvurusu",
which it previously was not), and both the tournament's and the related
announcement's body text now describe the link accurately. No verified
team-captain registration link exists, so `applicationUrl` is left
unset rather than guessing — **the teacher should confirm whether a
separate team-registration form exists and, if so, supply its URL.**

### Duplicate / already represented / obsolete (no action needed)

- `Pickleballseçmeler.png` — byte-identical duplicate of `pickleball.png`
  (verified: same git blob hash). Not migrated separately.
- The entire carousel/scroll-arrow/layout restructuring of the legacy
  `index.html` announcement strip, the "SEKME" comment-prefix renames,
  and the resized/recentred Canva embed — all presentational changes to
  the single-page app this project replaces entirely with real routes
  and components. No content to extract; `index.html` itself was not
  restored (per instruction).
- Minor copy trims across the Basketbol/Erkek Voleybol/Kız Voleybol/
  Futsal cards (e.g. "25 Eylül Cuma • 12.00" → "25 Eyl • 12.00", dropping
  the day-of-week) — purely cosmetic; this project's own copy already
  independently states full dates, so nothing was changed to match.
