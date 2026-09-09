import type { HomeContent, Locale } from "../../content/types";
import { homeContentSchema } from "./schema";

export const CMS_SCHEMA_VERSION = 1;

export type StoredVersion = {
  id: string;
  locale: Locale;
  revision: number;
  schemaVersion: number;
  content: HomeContent;
  hash: string;
  createdAt: number;
  createdBy: string;
};

export type ReleaseSummary = {
  id: string;
  sequence: number;
  publishedAt: number;
  publishedBy: string;
  note: string;
  versions: Record<Locale, string>;
};

export type DraftHeadSummary = { versionId: string; revision: number };

type VersionRow = {
  id: string;
  locale: Locale;
  revision: number;
  schema_version: number;
  body_json: string;
  body_sha256: string;
  created_at: number;
  created_by: string;
};

type ReleaseRow = {
  id: string;
  sequence: number;
  zh_version_id: string;
  en_version_id: string;
  ja_version_id: string;
  published_at: number;
  published_by: string;
  note: string;
};

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function contentHash(content: HomeContent): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(content)));
  return base64Url(new Uint8Array(digest));
}

function parseVersion(row: VersionRow | null): StoredVersion | null {
  if (!row) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(row.body_json);
  } catch (error) {
    console.error(`CMS version ${row.id} contains invalid JSON`, error);
    return null;
  }
  const parsed = homeContentSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    id: row.id,
    locale: row.locale,
    revision: row.revision,
    schemaVersion: row.schema_version,
    content: parsed.data as HomeContent,
    hash: row.body_sha256,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export async function getDraft(db: D1Database, locale: Locale): Promise<StoredVersion | null> {
  const row = await db
    .prepare(
      `SELECT v.* FROM draft_heads d
       JOIN content_versions v ON v.id = d.version_id
       WHERE d.locale = ?1`,
    )
    .bind(locale)
    .first<VersionRow>();
  return parseVersion(row);
}

export async function getPublished(db: D1Database, locale: Locale): Promise<StoredVersion | null> {
  const column = `${locale}_version_id`;
  const row = await db
    .prepare(
      `SELECT v.* FROM site_state s
       JOIN releases r ON r.id = s.current_release_id
       JOIN content_versions v ON v.id = r.${column}
       WHERE s.id = 1`,
    )
    .first<VersionRow>();
  return parseVersion(row);
}

export async function getVersion(db: D1Database, id: string): Promise<StoredVersion | null> {
  return parseVersion(
    await db.prepare(`SELECT * FROM content_versions WHERE id = ?1`).bind(id).first<VersionRow>(),
  );
}

export async function saveDraft(
  db: D1Database,
  locale: Locale,
  rawContent: unknown,
  actor: string,
  expectedRevision?: number,
): Promise<StoredVersion> {
  const content = homeContentSchema.parse(rawContent) as HomeContent;
  if (content.locale !== locale) throw new Error("Locale mismatch");

  const head = await db
    .prepare(`SELECT revision FROM draft_heads WHERE locale = ?1`)
    .bind(locale)
    .first<{ revision: number }>();
  const currentRevision = head?.revision ?? 0;
  if (expectedRevision !== undefined && expectedRevision !== currentRevision) {
    throw new CmsConflictError(currentRevision);
  }

  const revision = currentRevision + 1;
  const hash = await contentHash(content);
  const id = `${locale}-${revision}-${crypto.randomUUID()}`;
  const now = Date.now();
  const body = JSON.stringify(content);

  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO content_versions
         (id, locale, revision, schema_version, body_json, body_sha256, created_at, created_by)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8
         WHERE COALESCE((SELECT revision FROM draft_heads WHERE locale = ?2), 0) = ?9`,
      )
      .bind(id, locale, revision, CMS_SCHEMA_VERSION, body, hash, now, actor, currentRevision),
    db
      .prepare(
        `INSERT INTO draft_heads (locale, version_id, revision, updated_at)
         SELECT ?1, ?2, ?3, ?4
         WHERE EXISTS (SELECT 1 FROM content_versions WHERE id = ?2)
         ON CONFLICT(locale) DO UPDATE SET
           version_id = excluded.version_id,
           revision = excluded.revision,
           updated_at = excluded.updated_at
         WHERE draft_heads.revision = ?5`,
      )
      .bind(locale, id, revision, now, currentRevision),
  ]);
  if (!results[0].meta.changes || !results[1].meta.changes) {
    const latest = await db
      .prepare(`SELECT revision FROM draft_heads WHERE locale = ?1`)
      .bind(locale)
      .first<{ revision: number }>();
    throw new CmsConflictError(latest?.revision ?? currentRevision);
  }

  return {
    id,
    locale,
    revision,
    schemaVersion: CMS_SCHEMA_VERSION,
    content,
    hash,
    createdAt: now,
    createdBy: actor,
  };
}

export async function listVersions(db: D1Database, locale: Locale, limit = 30): Promise<StoredVersion[]> {
  const result = await db
    .prepare(`SELECT * FROM content_versions WHERE locale = ?1 ORDER BY revision DESC LIMIT ?2`)
    .bind(locale, Math.min(Math.max(limit, 1), 100))
    .all<VersionRow>();
  return result.results.map(parseVersion).filter((item): item is StoredVersion => Boolean(item));
}

export async function publishDrafts(
  db: D1Database,
  actor: string,
  note: string,
  expectedGeneration: number,
  expectedDrafts: Record<Locale, string>,
): Promise<ReleaseSummary> {
  const state = await db
    .prepare(`SELECT generation FROM site_state WHERE id = 1`)
    .first<{ generation: number }>();
  const currentGeneration = state?.generation ?? 0;
  if (expectedGeneration !== currentGeneration) {
    throw new CmsConflictError(currentGeneration);
  }

  const heads = await db
    .prepare(`SELECT locale, version_id FROM draft_heads WHERE locale IN ('zh', 'en', 'ja')`)
    .all<{ locale: Locale; version_id: string }>();
  const versions = Object.fromEntries(heads.results.map((head) => [head.locale, head.version_id])) as Partial<Record<Locale, string>>;
  if (!versions.zh || !versions.en || !versions.ja) throw new Error("All three locale drafts are required before publishing");
  if (
    versions.zh !== expectedDrafts.zh
    || versions.en !== expectedDrafts.en
    || versions.ja !== expectedDrafts.ja
  ) {
    throw new CmsConflictError(currentGeneration);
  }

  const max = await db.prepare(`SELECT COALESCE(MAX(sequence), 0) AS value FROM releases`).first<{ value: number }>();
  const sequence = (max?.value ?? 0) + 1;
  const id = `release-${sequence}-${crypto.randomUUID()}`;
  const now = Date.now();

  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO releases
         (id, sequence, zh_version_id, en_version_id, ja_version_id, published_at, published_by, note)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8
         WHERE (SELECT generation FROM site_state WHERE id = 1) = ?9
           AND (SELECT version_id FROM draft_heads WHERE locale = 'zh') = ?10
           AND (SELECT version_id FROM draft_heads WHERE locale = 'en') = ?11
           AND (SELECT version_id FROM draft_heads WHERE locale = 'ja') = ?12`,
      )
      .bind(
        id,
        sequence,
        versions.zh,
        versions.en,
        versions.ja,
        now,
        actor,
        note.slice(0, 500),
        currentGeneration,
        expectedDrafts.zh,
        expectedDrafts.en,
        expectedDrafts.ja,
      ),
    db
      .prepare(
        `UPDATE site_state SET current_release_id = ?1, generation = generation + 1
         WHERE id = 1 AND generation = ?2
           AND (SELECT version_id FROM draft_heads WHERE locale = 'zh') = ?3
           AND (SELECT version_id FROM draft_heads WHERE locale = 'en') = ?4
           AND (SELECT version_id FROM draft_heads WHERE locale = 'ja') = ?5`,
      )
      .bind(id, currentGeneration, expectedDrafts.zh, expectedDrafts.en, expectedDrafts.ja),
  ]);
  if (!results[0].meta.changes || !results[1].meta.changes) {
    const latest = await getGeneration(db);
    throw new CmsConflictError(latest);
  }

  return { id, sequence, publishedAt: now, publishedBy: actor, note, versions: versions as Record<Locale, string> };
}

export async function listReleases(db: D1Database, limit = 30): Promise<ReleaseSummary[]> {
  const result = await db
    .prepare(`SELECT * FROM releases ORDER BY sequence DESC LIMIT ?1`)
    .bind(Math.min(Math.max(limit, 1), 100))
    .all<ReleaseRow>();
  return result.results.map((row) => ({
    id: row.id,
    sequence: row.sequence,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
    note: row.note,
    versions: { zh: row.zh_version_id, en: row.en_version_id, ja: row.ja_version_id },
  }));
}

export async function getReleaseDashboard(
  db: D1Database,
  limit = 30,
): Promise<{
  generation: number;
  releases: ReleaseSummary[];
  draftHeads: Partial<Record<Locale, DraftHeadSummary>>;
}> {
  const results = await db.batch([
    db.prepare(`SELECT generation FROM site_state WHERE id = 1`),
    db
      .prepare(`SELECT * FROM releases ORDER BY sequence DESC LIMIT ?1`)
      .bind(Math.min(Math.max(limit, 1), 100)),
    db.prepare(`SELECT locale, version_id, revision FROM draft_heads WHERE locale IN ('zh', 'en', 'ja')`),
  ]);
  const state = results[0].results[0] as { generation?: number } | undefined;
  const rows = results[1].results as unknown as ReleaseRow[];
  const heads = results[2].results as unknown as Array<{ locale: Locale; version_id: string; revision: number }>;
  return {
    generation: state?.generation ?? 0,
    releases: rows.map((row) => ({
      id: row.id,
      sequence: row.sequence,
      publishedAt: row.published_at,
      publishedBy: row.published_by,
      note: row.note,
      versions: { zh: row.zh_version_id, en: row.en_version_id, ja: row.ja_version_id },
    })),
    draftHeads: Object.fromEntries(
      heads.map((head) => [head.locale, { versionId: head.version_id, revision: head.revision }]),
    ) as Partial<Record<Locale, DraftHeadSummary>>,
  };
}

export async function restoreRelease(
  db: D1Database,
  releaseId: string,
  actor: string,
  expectedGeneration?: number,
): Promise<ReleaseSummary> {
  const source = await db
    .prepare(`SELECT * FROM releases WHERE id = ?1`)
    .bind(releaseId)
    .first<ReleaseRow>();
  if (!source) throw new Error("Release not found");

  const state = await db
    .prepare(`SELECT generation FROM site_state WHERE id = 1`)
    .first<{ generation: number }>();
  const currentGeneration = state?.generation ?? 0;
  if (expectedGeneration !== undefined && expectedGeneration !== currentGeneration) {
    throw new CmsConflictError(currentGeneration);
  }

  const max = await db.prepare(`SELECT COALESCE(MAX(sequence), 0) AS value FROM releases`).first<{ value: number }>();
  const sequence = (max?.value ?? 0) + 1;
  const id = `release-${sequence}-${crypto.randomUUID()}`;
  const now = Date.now();
  const note = `Restore release #${source.sequence}`;

  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO releases
         (id, sequence, zh_version_id, en_version_id, ja_version_id, published_at, published_by, note)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8
         WHERE (SELECT generation FROM site_state WHERE id = 1) = ?9`,
      )
      .bind(
        id,
        sequence,
        source.zh_version_id,
        source.en_version_id,
        source.ja_version_id,
        now,
        actor,
        note,
        currentGeneration,
      ),
    db
      .prepare(
        `UPDATE site_state SET current_release_id = ?1, generation = generation + 1
         WHERE id = 1 AND generation = ?2`,
      )
      .bind(id, currentGeneration),
  ]);
  if (!results[0].meta.changes || !results[1].meta.changes) {
    const latest = await getGeneration(db);
    throw new CmsConflictError(latest);
  }
  return {
    id, sequence, publishedAt: now, publishedBy: actor, note,
    versions: { zh: source.zh_version_id, en: source.en_version_id, ja: source.ja_version_id },
  };
}

export async function getGeneration(db: D1Database): Promise<number> {
  const row = await db.prepare(`SELECT generation FROM site_state WHERE id = 1`).first<{ generation: number }>();
  return row?.generation ?? 0;
}

export class CmsConflictError extends Error {
  constructor(public readonly currentRevision: number) {
    super("Content was updated by another session");
  }
}
