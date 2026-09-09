import { z } from "zod";

const text = z.string().trim().max(12_000);
const shortText = z.string().trim().max(500);
const url = z
  .string()
  .trim()
  .max(2_000)
  .refine((value) => {
    if (value.startsWith("mailto:") || (value.startsWith("/") && !value.startsWith("//"))) return true;
    try {
      return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Only http(s), mailto, and site-relative URLs are allowed");
const objectPosition = z
  .string()
  .trim()
  .max(50)
  .regex(
    /^(?:left|center|right|top|bottom|(?:100|[0-9]{1,2})(?:\.[0-9]+)?%)(?:\s+(?:left|center|right|top|bottom|(?:100|[0-9]{1,2})(?:\.[0-9]+)?%))?$/,
    "Use one or two position keywords or percentages, for example 50% 35%",
  );

const linkSchema = z.object({ label: shortText, href: url });
const tagsSchema = z.array(shortText).max(64);
const sectionCopySchema = z.object({
  index: shortText,
  eyebrow: shortText,
  title: shortText,
  description: text.optional(),
});
const resumeMediaSchema = z.object({
  src: url,
  alt: shortText,
  caption: text,
  source: linkSchema,
  license: linkSchema.optional(),
});
const resumeItemSchema = z.object({
  id: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  kicker: shortText,
  title: shortText,
  subtitle: shortText.optional(),
  period: shortText,
  status: shortText.optional(),
  summary: text,
  highlights: z.array(text).max(32),
  tags: tagsSchema,
  media: resumeMediaSchema.optional(),
  links: z.array(linkSchema).max(16).optional(),
});

export const localeSchema = z.enum(["zh", "en", "ja"]);

export const homeContentSchema = z.object({
  locale: localeSchema,
  draftMode: z.boolean(),
  seo: z.object({ title: shortText, description: text }),
  name: shortText,
  romanizedName: shortText,
  initials: z.string().trim().min(1).max(10),
  eyebrow: shortText,
  headlineLines: z.array(shortText).min(1).max(5),
  introduction: text,
  about: text,
  facts: z.array(z.object({ label: shortText, value: text })).max(20),
  availability: shortText,
  portrait: z
    .object({ src: url, alt: shortText, objectPosition: objectPosition.optional() })
    .optional(),
  focusAreas: z
    .array(
      z.object({
        index: shortText,
        title: shortText,
        description: text,
        tags: tagsSchema,
      }),
    )
    .max(16),
  education: z.array(resumeItemSchema).max(24),
  experience: z.array(resumeItemSchema).max(32),
  projects: z.array(resumeItemSchema).max(64),
  awards: z
    .array(
      z.object({
        year: shortText,
        title: shortText,
        award: shortText,
        description: text,
      }),
    )
    .max(64),
  exchange: resumeItemSchema,
  skills: z
    .array(z.object({ title: shortText, items: z.array(shortText).max(64) }))
    .max(32),
  contact: z.object({
    heading: text,
    body: text,
    links: z.array(linkSchema).max(16),
    note: text.optional(),
  }),
  missingContent: z.array(text).max(32),
  ui: z.object({
    draftLabel: shortText,
    draftText: text,
    navLabel: shortText,
    homeLabel: shortText,
    nav: z.object({
      about: shortText,
      focus: shortText,
      resume: shortText,
      work: shortText,
      contact: shortText,
    }),
    greeting: shortText,
    viewWork: shortText,
    contactCta: shortText,
    highlights: shortText,
    tagsLabel: shortText,
    currentStatus: shortText,
    backToTop: shortText,
    themeToLight: shortText,
    themeToDark: shortText,
    sections: z.object({
      about: sectionCopySchema,
      focus: sectionCopySchema,
      education: sectionCopySchema,
      experience: sectionCopySchema,
      work: sectionCopySchema,
      awards: sectionCopySchema,
      skills: sectionCopySchema,
      exchange: sectionCopySchema,
      contact: sectionCopySchema,
      materials: sectionCopySchema,
    }),
  }),
});

export const saveDraftRequestSchema = z.object({
  content: homeContentSchema,
  expectedRevision: z.number().int().nonnegative(),
});

export const publishRequestSchema = z.object({
  note: z.string().trim().max(500).optional().default(""),
  expectedGeneration: z.number().int().nonnegative(),
  expectedDrafts: z.object({
    zh: z.string().min(1).max(200),
    en: z.string().min(1).max(200),
    ja: z.string().min(1).max(200),
  }),
});

export const restoreRequestSchema = z.object({
  expectedGeneration: z.number().int().nonnegative(),
});

export type ValidatedHomeContent = z.infer<typeof homeContentSchema>;
