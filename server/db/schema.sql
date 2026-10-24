-- Toolverse schema (Postgres / Neon). Applied by `npm run migrate`; safe to run again.

CREATE TABLE IF NOT EXISTS users (
    clerk_id    TEXT PRIMARY KEY,
    email       TEXT NOT NULL DEFAULT '',
    name        TEXT NOT NULL DEFAULT '',
    photo       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Image files (generated images, uploads and their edited versions), served through signed URLs
CREATE TABLE IF NOT EXISTS assets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner       TEXT NOT NULL REFERENCES users (clerk_id) ON DELETE CASCADE,
    mime        TEXT NOT NULL,
    width       INTEGER NOT NULL,
    height      INTEGER NOT NULL,
    bytes       BYTEA NOT NULL,
    size        INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_owner_idx ON assets (owner);

-- Everything a tool produced
CREATE TABLE IF NOT EXISTS creations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner       TEXT NOT NULL REFERENCES users (clerk_id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('article', 'blog-titles', 'image', 'background', 'object', 'resume-review')),
    title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    prompt      TEXT NOT NULL DEFAULT '',
    content     TEXT,                                   -- Markdown for the text tools
    options     JSONB NOT NULL DEFAULT '{}',            -- length, category, style, object, score ...
    asset_id    UUID REFERENCES assets (id) ON DELETE SET NULL,   -- the result image
    source_id   UUID REFERENCES assets (id) ON DELETE SET NULL,   -- the uploaded original
    provider    TEXT NOT NULL,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    published   BOOLEAN NOT NULL DEFAULT false,
    sample      BOOLEAN NOT NULL DEFAULT false,         -- seeded demo content
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Only image results can be shared in the community
    CONSTRAINT publish_images_only CHECK (NOT published OR asset_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS creations_owner_idx ON creations (owner, created_at DESC);
CREATE INDEX IF NOT EXISTS creations_published_idx ON creations (created_at DESC) WHERE published;

-- One row per like, so likes can't be lost to concurrent updates or duplicated
CREATE TABLE IF NOT EXISTS likes (
    creation_id UUID NOT NULL REFERENCES creations (id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users (clerk_id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (creation_id, user_id)
);

-- Monthly quota counters per kind of tool ('text' or 'image')
CREATE TABLE IF NOT EXISTS usage (
    user_id TEXT NOT NULL REFERENCES users (clerk_id) ON DELETE CASCADE,
    period  TEXT NOT NULL,                              -- 'YYYY-MM' (UTC)
    kind    TEXT NOT NULL CHECK (kind IN ('text', 'image')),
    count   INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    PRIMARY KEY (user_id, period, kind)
);
