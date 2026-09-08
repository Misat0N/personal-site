export type Locale = "zh" | "en" | "ja";

export type Link = {
  label: string;
  href: string;
};

export type FocusArea = {
  index: string;
  title: string;
  description: string;
  tags: string[];
};

export type ResumeItem = {
  id: string;
  kicker: string;
  title: string;
  subtitle?: string;
  period: string;
  status?: string;
  summary: string;
  highlights: string[];
  tags: string[];
};

export type Award = {
  year: string;
  title: string;
  award: string;
  description: string;
};

export type SkillGroup = {
  title: string;
  items: string[];
};

export type SectionCopy = {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
};

export type HomeContent = {
  locale: Locale;
  draftMode: boolean;
  seo: { title: string; description: string };
  name: string;
  romanizedName: string;
  initials: string;
  eyebrow: string;
  headlineLines: string[];
  introduction: string;
  about: string;
  facts: Array<{ label: string; value: string }>;
  availability: string;
  portrait?: { src: string; alt: string; objectPosition?: string };
  focusAreas: FocusArea[];
  education: ResumeItem[];
  experience: ResumeItem[];
  projects: ResumeItem[];
  awards: Award[];
  exchange: ResumeItem;
  skills: SkillGroup[];
  contact: { heading: string; body: string; links: Link[]; note?: string };
  missingContent: string[];
  ui: {
    draftLabel: string;
    draftText: string;
    navLabel: string;
    homeLabel: string;
    nav: { about: string; focus: string; resume: string; work: string; contact: string };
    greeting: string;
    viewWork: string;
    contactCta: string;
    highlights: string;
    tagsLabel: string;
    currentStatus: string;
    backToTop: string;
    themeToLight: string;
    themeToDark: string;
    sections: {
      about: SectionCopy;
      focus: SectionCopy;
      education: SectionCopy;
      experience: SectionCopy;
      work: SectionCopy;
      awards: SectionCopy;
      skills: SectionCopy;
      exchange: SectionCopy;
      contact: SectionCopy;
      materials: SectionCopy;
    };
  };
};
