import { query } from "../config/db.js";
import { CREATION_FROM, CREATION_SELECT, TOOL_KIND, serializeCreation } from "../lib/creations.js";
import { isUuid, verifyAssetSignature } from "../lib/images.js";

const PAGE_SIZE = 24;
const DEMO_UPLOAD_TTL = "24 hours";

const encodeCursor = (row) => Buffer.from(`${row.cursor_ts}|${row.id}`).toString("base64url");
const decodeCursor = (cursor) => {
    try {
        const [ts, id] = Buffer.from(String(cursor), "base64url").toString().split("|");
        return /^\d{4}-\d{2}-\d{2} [\d:.]+[+-]\d{2}(:\d{2})?$/.test(ts || "") && isUuid(id) ? { ts, id } : null;
    } catch {
        return null;
    }
};

const findOwned = async (req) => {
    if (!isUuid(req.params.id)) return null;
    const { rows } = await query(`SELECT ${CREATION_SELECT} FROM ${CREATION_FROM} WHERE c.id = $1 AND c.owner = $2`, [req.params.id, req.user.clerkId]);
    return rows[0] || null;
};

// GET /api/creations?type=&q=&cursor=
export const listCreations = async (req, res, next) => {
    try {
        const owner = req.user.clerkId;
        // Visitors share the demo account: their own creations are cleared after a day, samples stay
        if (req.isDemo) {
            await query(
                `WITH gone AS (DELETE FROM creations WHERE owner = $1 AND NOT sample AND created_at < now() - interval '${DEMO_UPLOAD_TTL}' RETURNING asset_id, source_id)
                 DELETE FROM assets WHERE owner = $1 AND id IN (SELECT asset_id FROM gone UNION SELECT source_id FROM gone)`,
                [owner]
            );
        }

        const where = ["c.owner = $1"];
        const params = [owner];
        if (TOOL_KIND[req.query.type]) {
            params.push(req.query.type);
            where.push(`c.type = $${params.length}`);
        }
        const q = String(req.query.q || "").trim().slice(0, 60);
        if (q) {
            params.push(`%${q.replace(/[\\%_]/g, "\\$&")}%`);
            where.push(`(c.title ILIKE $${params.length} OR c.prompt ILIKE $${params.length})`);
        }
        const { rows: [{ total }] } = await query(`SELECT count(*) AS total FROM creations c WHERE ${where.join(" AND ")}`, params);

        const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;
        if (cursor) {
            params.push(cursor.ts, cursor.id);
            where.push(`(c.created_at, c.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
        }
        params.push(PAGE_SIZE + 1);
        const { rows } = await query(
            `SELECT ${CREATION_SELECT}, c.created_at::text AS cursor_ts,
                    (SELECT count(*) FROM likes l WHERE l.creation_id = c.id) AS likes
             FROM ${CREATION_FROM} WHERE ${where.join(" AND ")}
             ORDER BY c.created_at DESC, c.id DESC LIMIT $${params.length}`,
            params
        );
        const page = rows.slice(0, PAGE_SIZE);
        res.json({
            creations: page.map((r) => serializeCreation(r, { likes: r.likes })),
            total,
            nextCursor: rows.length > PAGE_SIZE ? encodeCursor(page.at(-1)) : null,
        });
    } catch (error) {
        next(error);
    }
};

export const getCreation = async (req, res, next) => {
    try {
        const row = await findOwned(req);
        if (!row) return res.status(404).json({ error: "Not found" });
        const { rows: [{ likes }] } = await query("SELECT count(*) AS likes FROM likes WHERE creation_id = $1", [row.id]);
        res.json({ creation: serializeCreation(row, { likes }) });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/creations/:id  { published }
export const updateCreation = async (req, res, next) => {
    try {
        const row = await findOwned(req);
        if (!row) return res.status(404).json({ error: "Not found" });
        if (typeof req.body?.published !== "boolean") return res.status(400).json({ error: "Nothing to update" });
        if (req.body.published && !row.asset_id) return res.status(400).json({ error: "Only images can be shared with the community" });
        await query("UPDATE creations SET published = $3, updated_at = now() WHERE id = $1 AND owner = $2", [row.id, req.user.clerkId, req.body.published]);
        res.json({ creation: serializeCreation({ ...row, published: req.body.published }) });
    } catch (error) {
        next(error);
    }
};

export const deleteCreation = async (req, res, next) => {
    try {
        const row = await findOwned(req);
        if (!row) return res.status(404).json({ error: "Not found" });
        if (req.isDemo && row.sample) {
            return res.status(403).json({ error: "Samples in the demo account can't be deleted. Try it with something you create." });
        }
        // The creation's images go too; likes are removed by the foreign key
        await query(
            `WITH gone AS (DELETE FROM creations WHERE id = $1 AND owner = $2 RETURNING asset_id, source_id)
             DELETE FROM assets WHERE owner = $2 AND id IN (SELECT asset_id FROM gone UNION SELECT source_id FROM gone)`,
            [row.id, req.user.clerkId]
        );
        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
};

// GET /api/files/:id?exp&sig[&download=name]  (signed URL, no session needed)
export const serveFile = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isUuid(id) || !verifyAssetSignature(id, req.query.exp, req.query.sig)) {
            return res.status(403).json({ error: "This link has expired" });
        }
        const { rows: [asset] } = await query("SELECT mime, bytes FROM assets WHERE id = $1", [id]);
        if (!asset) return res.status(404).json({ error: "Not found" });
        res.set("Content-Type", asset.mime);
        res.set("Cache-Control", `private, max-age=${Math.max(0, Number(req.query.exp) - Math.floor(Date.now() / 1000))}`);
        if (req.query.download) {
            const name = `${String(req.query.download).replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 80) || "toolverse"}.${asset.mime.split("/")[1]}`;
            res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`);
        }
        res.send(asset.bytes);
    } catch (error) {
        next(error);
    }
};
