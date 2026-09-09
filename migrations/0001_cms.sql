PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_versions (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL CHECK (locale IN ('zh', 'en', 'ja')),
  revision INTEGER NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  body_json TEXT NOT NULL,
  body_sha256 TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  UNIQUE (locale, revision)
);

CREATE TABLE IF NOT EXISTS draft_heads (
  locale TEXT PRIMARY KEY CHECK (locale IN ('zh', 'en', 'ja')),
  version_id TEXT NOT NULL REFERENCES content_versions(id),
  revision INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL UNIQUE,
  zh_version_id TEXT NOT NULL REFERENCES content_versions(id),
  en_version_id TEXT NOT NULL REFERENCES content_versions(id),
  ja_version_id TEXT NOT NULL REFERENCES content_versions(id),
  published_at INTEGER NOT NULL,
  published_by TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS site_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_release_id TEXT REFERENCES releases(id),
  generation INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO site_state (id, current_release_id, generation)
VALUES (1, NULL, 0);

CREATE INDEX IF NOT EXISTS idx_content_versions_locale_revision
  ON content_versions(locale, revision DESC);
CREATE INDEX IF NOT EXISTS idx_releases_sequence
  ON releases(sequence DESC);
