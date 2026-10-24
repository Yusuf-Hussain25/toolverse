import { query } from "../config/db.js";
import { CREATION_FROM, CREATION_SELECT, serializeCreation } from "../lib/creations.js";
import { isUuid } from "../lib/images.js";

const PAGE_SIZE = 24;

// GET /api/community?sort=new|top&page=N
// Published images with their author's public name and photo (never their user id or email).
export const listCommunity = async (req, res, next) => {
    try {
        const page = Math.max(0, Math.min(50, Number.parseInt(req.query.page, 10) || 0));
        const order = req.query.sort === "top" ? "likes DESC, c.created_at DESC" : "c.created_at DESC";
        const { rows } = await query(
            `SELECT ${CREATION_SELECT}, u.name AS author_name, u.photo AS author_photo,
                    (SELECT count(*) FROM likes l WHERE l.creation_id = c.id) AS likes,
                    EXISTS (SELECT 1 FROM likes l WHERE l.creation_id = c.id AND l.user_id = $1) AS liked
             FROM ${CREATION_FROM} JOIN users u ON u.clerk_id = c.owner
             WHERE c.published
             ORDER BY ${order}, c.id DESC
             LIMIT $2 OFFSET $3`,
            [req.user.clerkId, PAGE_SIZE + 1, page * PAGE_SIZE]
        );
        res.json({
            creations: rows.slice(0, PAGE_SIZE).map((r) => {
                const { content, ...rest } = serializeCreation(r, {
                    likes: r.likes,
                    liked: r.liked,
                    mine: r.owner === req.user.clerkId,
                    author: { name: r.author_name, photo: r.author_photo },
                });
                return rest;
            }),
            nextPage: rows.length > PAGE_SIZE ? page + 1 : null,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/community/:id/like  -> { liked, likes }
// Only published creations can be liked. The original toggled likes on any creation id,
// including private ones, by rewriting a text[] column (lost updates under concurrency).
export const toggleLike = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) return res.status(404).json({ error: "Not found" });
        const { rows: [c] } = await query("SELECT id FROM creations WHERE id = $1 AND published", [id]);
        if (!c) return res.status(404).json({ error: "Not found" });

        const removed = await query("DELETE FROM likes WHERE creation_id = $1 AND user_id = $2", [id, req.user.clerkId]);
        if (!removed.rowCount) {
            await query("INSERT INTO likes (creation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, req.user.clerkId]);
        }
        const { rows: [{ likes }] } = await query("SELECT count(*) AS likes FROM likes WHERE creation_id = $1", [id]);
        res.json({ liked: !removed.rowCount, likes });
    } catch (error) {
        next(error);
    }
};
