import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { isValidSlug } from './lib/slug';
import { parseIstanbulDate } from './lib/dates';

/**
 * Shared ISO date/datetime field, anchored to Europe/Istanbul when no
 * explicit offset is given (see lib/dates.ts).
 */
const istanbulDate = () =>
  z
    .union([z.string(), z.date()])
    .transform((value) => parseIstanbulDate(value))
    .pipe(z.date());

const slugField = () =>
  z.string().refine(isValidSlug, 'Slug yalnızca küçük harf, rakam ve tire (kebab-case) içerebilir.');

const safeUrl = () =>
  z
    .string()
    .url('Geçerli bir URL giriniz.')
    .refine((value) => {
      try {
        return ['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, 'Yalnızca http(s), mailto veya tel bağlantılarına izin verilir.');

/**
 * Cover images are NOT modeled with Astro's built-in content-collection
 * `image()` helper. That helper only works for files Vite can statically
 * resolve under src/ — but Pages CMS commits uploaded media directly into
 * public/media/images/ (a plain static folder, see spec §8), and the
 * build-time Sharp pipeline in scripts/optimize-images.mjs reads from that
 * same folder to produce responsive/WebP/AVIF derivatives (see
 * src/components/ui/ResponsiveImage.astro). So a cover image is just a
 * root-relative string path, validated to stay inside the one media
 * directory the optimizer and CMS both know about.
 */
const coverImagePath = () =>
  z.string().startsWith('/media/images/', 'Görsel yalnızca /media/images/ altında olabilir.');

/** Minimal structural type for a Zod superRefine ctx — avoids referencing
 * the `z` namespace for types, which this bundled Zod version does not
 * support cleanly through astro:content's re-export. */
interface RefineCtx {
  addIssue: (issue: { code: 'custom'; message: string; path?: (string | number)[] }) => void;
}

function requireAltWithCover<T extends { coverImage?: string; coverImageAlt?: string }>(
  entry: T,
  ctx: RefineCtx,
) {
  if (entry.coverImage && !entry.coverImageAlt) {
    ctx.addIssue({
      code: 'custom',
      message: 'coverImage varken coverImageAlt (Görsel Açıklaması) zorunludur.',
      path: ['coverImageAlt'],
    });
  }
}

// ---------------------------------------------------------------------------
// Duyurular / Announcements
// ---------------------------------------------------------------------------
const announcements = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/announcements' }),
  schema: z
    .object({
      title: z.string().min(1),
      slug: slugField(),
      summary: z.string().min(1).max(300),
      category: z.enum(['Duyuru', 'Takım Seçmeleri', 'Turnuva', 'Maç Sonucu', 'Belge', 'Etkinlik']),
      status: z.enum(['Taslak', 'Yayınlandı', 'Arşivlendi']),
      publishAt: istanbulDate(),
      expiresAt: istanbulDate().optional(),
      featured: z.boolean().default(false),
      priority: z.number().int().min(0).max(100).default(0),
      coverImage: coverImagePath().optional(),
      coverImageAlt: z.string().min(1).optional(),
      relatedUrl: safeUrl().optional(),
      relatedDocument: reference('documents').optional(),
      relatedMatch: reference('matches').optional(),
      relatedTournament: reference('tournaments').optional(),
    })
    .superRefine((entry, ctx) => {
      requireAltWithCover(entry, ctx);
      if (entry.expiresAt && entry.expiresAt < entry.publishAt) {
        ctx.addIssue({
          code: 'custom' as const,
          message: 'Yayından Kalkma Tarihi, Yayın Tarihinden önce olamaz.',
          path: ['expiresAt'],
        });
      }
    }),
});

// ---------------------------------------------------------------------------
// Branşlar / Sports
// ---------------------------------------------------------------------------
const sports = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/sports' }),
  schema: z.object({
    name: z.string().min(1),
    slug: slugField(),
    icon: z.string().min(1),
    description: z.string().min(1),
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
  }),
});

// ---------------------------------------------------------------------------
// Takımlar / Teams
// ---------------------------------------------------------------------------
const teams = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/teams' }),
  schema: z
    .object({
      name: z.string().min(1),
      slug: slugField(),
      sport: reference('sports'),
      season: z.string().min(1),
      ageOrClassGroup: z.string().min(1),
      summary: z.string().min(1),
      coachOrTeacher: z.string().optional(),
      coverImage: coverImagePath().optional(),
      coverImageAlt: z.string().min(1).optional(),
      active: z.boolean().default(true),
      order: z.number().int().min(0).default(0),
    })
    .superRefine(requireAltWithCover),
});

// ---------------------------------------------------------------------------
// Maçlar / Matches
// ---------------------------------------------------------------------------
const matches = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/matches' }),
  schema: z
    .object({
      title: z.string().min(1),
      slug: slugField(),
      sport: reference('sports'),
      competition: z.string().min(1),
      season: z.string().min(1),
      homeTeam: z.string().min(1),
      awayTeam: z.string().min(1),
      dateTime: istanbulDate(),
      venue: z.string().min(1),
      status: z.enum(['Planlandı', 'Canlı', 'Tamamlandı', 'Ertelendi', 'İptal Edildi']),
      homeScore: z.number().int().min(0).optional(),
      awayScore: z.number().int().min(0).optional(),
      summary: z.string().optional(),
      coverImage: coverImagePath().optional(),
      coverImageAlt: z.string().min(1).optional(),
      galleryUrl: safeUrl().optional(),
      featured: z.boolean().default(false),
      published: z.boolean().default(true),
    })
    .superRefine((entry, ctx) => {
      requireAltWithCover(entry, ctx);
      if (entry.homeTeam.trim().toLowerCase() === entry.awayTeam.trim().toLowerCase()) {
        ctx.addIssue({
          code: 'custom' as const,
          message: 'Bir takım kendisiyle eşleşemez (homeTeam === awayTeam).',
          path: ['awayTeam'],
        });
      }
      const hasHome = entry.homeScore !== undefined;
      const hasAway = entry.awayScore !== undefined;
      if (entry.status === 'Tamamlandı' && (!hasHome || !hasAway)) {
        ctx.addIssue({
          code: 'custom' as const,
          message: 'Tamamlandı durumundaki bir maçın hem homeScore hem awayScore değeri olmalıdır.',
          path: ['homeScore'],
        });
      }
    }),
});

// ---------------------------------------------------------------------------
// Turnuvalar / Tournaments
// ---------------------------------------------------------------------------
const tournaments = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/tournaments' }),
  schema: z
    .object({
      title: z.string().min(1),
      slug: slugField(),
      sport: reference('sports'),
      season: z.string().min(1),
      status: z.enum(['Yaklaşan', 'Başvurular Açık', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi']),
      // Intentionally optional (deviates from a literal "always required"
      // reading of spec §7): a real 2026-2027 tournament (Futsal All-Star)
      // has open applications with no announced start date yet at
      // migration time. Requiring a value here would force fabricating a
      // date, which spec §11/§18 explicitly forbid. See MIGRATION_REPORT.md.
      startDate: istanbulDate().optional(),
      endDate: istanbulDate().optional(),
      applicationStart: istanbulDate().optional(),
      applicationEnd: istanbulDate().optional(),
      summary: z.string().min(1),
      coverImage: coverImagePath().optional(),
      coverImageAlt: z.string().min(1).optional(),
      fixtureDocument: reference('documents').optional(),
      applicationUrl: safeUrl().optional(),
      staffApplicationUrl: safeUrl().optional(),
      resultsUrl: safeUrl().optional(),
      published: z.boolean().default(true),
    })
    .superRefine((entry, ctx) => {
      requireAltWithCover(entry, ctx);
      if (entry.startDate && entry.endDate && entry.endDate < entry.startDate) {
        ctx.addIssue({
          code: 'custom' as const,
          message: 'Bitiş tarihi başlangıç tarihinden önce olamaz.',
          path: ['endDate'],
        });
      }
      if (entry.applicationStart && entry.applicationEnd && entry.applicationEnd < entry.applicationStart) {
        ctx.addIssue({
          code: 'custom' as const,
          message: 'Başvuru bitiş tarihi başvuru başlangıç tarihinden önce olamaz.',
          path: ['applicationEnd'],
        });
      }
    }),
});

// ---------------------------------------------------------------------------
// Belgeler / Documents  (public blank templates only)
// ---------------------------------------------------------------------------
const documents = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/documents' }),
  schema: z.object({
    title: z.string().min(1),
    slug: slugField(),
    category: z.enum(['İzin Belgesi', 'Sağlık Beyanı', 'Taahhütname', 'İSG Talimatı', 'Diğer']),
    summary: z.string().min(1),
    file: z.string().min(1).startsWith('/media/documents/', 'file yalnızca /media/documents/ altında olabilir.'),
    printablePage: z.string().startsWith('/belgeler/').optional(),
    versionDate: istanbulDate(),
    schoolYear: z.string().min(1),
    status: z.enum(['Taslak', 'Aktif', 'Güncelliğini Kaybetti', 'Dosya Bekleniyor']),
    approved: z.boolean().default(false),
    order: z.number().int().min(0).default(0),
  }),
});

// ---------------------------------------------------------------------------
// Galeriler / Galleries
// ---------------------------------------------------------------------------
const galleries = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/galleries' }),
  schema: z
    .object({
      title: z.string().min(1),
      slug: slugField(),
      year: z.number().int().min(2000).max(2100),
      event: z.string().min(1),
      coverImage: coverImagePath().optional(),
      coverImageAlt: z.string().min(1).optional(),
      description: z.string().min(1),
      externalUrl: safeUrl().optional(),
      order: z.number().int().min(0).default(0),
      published: z.boolean().default(true),
    })
    .superRefine(requireAltWithCover),
});

export const collections = { announcements, sports, teams, matches, tournaments, documents, galleries };
