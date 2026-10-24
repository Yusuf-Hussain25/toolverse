import { assetUrl } from "./images.js";

export const TOOL_KIND = {
    article: "text",
    "blog-titles": "text",
    "resume-review": "text",
    image: "image",
    background: "image",
    object: "image",
};

// Everything except heavy joins; asset dimensions come along for layout
export const CREATION_SELECT = `
    c.id, c.owner, c.type, c.title, c.prompt, c.content, c.options, c.asset_id, c.source_id, c.provider,
    c.duration_ms, c.published, c.sample, c.created_at, a.width AS asset_width, a.height AS asset_height`;
export const CREATION_FROM = "creations c LEFT JOIN assets a ON a.id = c.asset_id";

export const serializeCreation = (row, extra = {}) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    prompt: row.prompt,
    content: row.content,
    options: row.options || {},
    imageUrl: assetUrl(row.asset_id),
    sourceUrl: assetUrl(row.source_id),
    width: row.asset_width ?? null,
    height: row.asset_height ?? null,
    provider: row.provider,
    durationMs: row.duration_ms,
    published: row.published,
    sample: row.sample,
    createdAt: row.created_at,
    ...extra,
});
