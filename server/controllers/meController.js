import { query } from "../config/db.js";
import { usageFor } from "../lib/quota.js";
import { describeTextProvider, ARTICLE_LENGTHS, ARTICLE_TONES, BLOG_CATEGORIES } from "../lib/ai.js";
import { ASPECTS, IMAGE_STYLES, assetUrl, bgProviderName, cloudinaryConfigured, imageProviderName } from "../lib/images.js";

// Which tools can run on this server, and with what. Public, so the landing page can show it too.
export const toolsInfo = () => ({
    text: describeTextProvider(),
    image: { name: imageProviderName() },
    background: { name: bgProviderName() },
    object: { name: "cloudinary", available: cloudinaryConfigured() },
    options: {
        lengths: Object.keys(ARTICLE_LENGTHS),
        tones: ARTICLE_TONES,
        categories: BLOG_CATEGORIES,
        styles: IMAGE_STYLES,
        aspects: Object.keys(ASPECTS),
    },
});

// Words in a creation's Markdown (text tools only)
const WORDS = "coalesce(array_length(regexp_split_to_array(trim(c.content), '\\s+'), 1), 0)";
const TEXT_TYPES = "('article', 'blog-titles', 'resume-review')";
const IMAGE_TYPES = "('image', 'background', 'object')";

// GET /api/me: profile, plan, this month's usage, totals, a 30-day daily series and unread notifications
export const getMe = async (req, res, next) => {
    try {
        const owner = req.user.clerkId;
        const [usage, totals, byType, likes, daily, unread] = await Promise.all([
            usageFor(owner, req.plan),
            query(
                `SELECT count(*) AS total,
                        coalesce(sum(${WORDS}) FILTER (WHERE c.type IN ${TEXT_TYPES}), 0) AS words,
                        count(*) FILTER (WHERE c.type IN ${IMAGE_TYPES}) AS images,
                        count(*) FILTER (WHERE c.created_at >= now() - interval '7 days') AS this_week,
                        count(*) FILTER (WHERE c.created_at >= now() - interval '14 days' AND c.created_at < now() - interval '7 days') AS last_week
                 FROM creations c WHERE c.owner = $1`,
                [owner]
            ),
            query("SELECT type, count(*) AS count FROM creations WHERE owner = $1 GROUP BY type", [owner]),
            query("SELECT count(*) AS count FROM likes l JOIN creations c ON c.id = l.creation_id WHERE c.owner = $1 AND l.user_id <> $1", [owner]),
            // 30 UTC days ending today, including days with nothing made
            query(
                `SELECT to_char(d, 'YYYY-MM-DD') AS day,
                        count(c.id) AS creations,
                        coalesce(sum(${WORDS}) FILTER (WHERE c.type IN ${TEXT_TYPES}), 0) AS words,
                        count(c.id) FILTER (WHERE c.type IN ${IMAGE_TYPES}) AS images
                 FROM generate_series((now() AT TIME ZONE 'UTC')::date - 29, (now() AT TIME ZONE 'UTC')::date, interval '1 day') AS d
                 LEFT JOIN creations c ON c.owner = $1 AND (c.created_at AT TIME ZONE 'UTC')::date = d::date
                 GROUP BY d ORDER BY d`,
                [owner]
            ),
            query(
                `SELECT count(*) AS count FROM likes l JOIN creations c ON c.id = l.creation_id JOIN users u ON u.clerk_id = c.owner
                 WHERE c.owner = $1 AND l.user_id <> $1 AND l.created_at > u.notifications_seen_at`,
                [owner]
            ),
        ]);
        const t = totals.rows[0];
        const counts = Object.fromEntries(byType.rows.map((r) => [r.type, r.count]));
        const u = req.user;
        res.json({
            user: { id: u.clerkId, name: u.name, email: u.email, photo: u.photo, createdAt: u.createdAt },
            plan: req.plan,
            demo: req.isDemo,
            usage,
            stats: {
                total: t.total,
                words: t.words,
                images: t.images,
                toolUses: usage.text.used + usage.image.used,
                weekChange: t.last_week ? Math.round(((t.this_week - t.last_week) / t.last_week) * 100) : t.this_week ? 100 : 0,
                byType: counts,
                likesReceived: likes.rows[0].count,
                daily: daily.rows,
                last14: daily.rows.slice(-14).map((d) => ({ day: d.day, count: d.creations })),
            },
            unreadNotifications: unread.rows[0].count,
            tools: toolsInfo(),
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/notifications: the latest likes other people left on your shared images
export const listNotifications = async (req, res, next) => {
    try {
        const owner = req.user.clerkId;
        const { rows } = await query(
            `SELECT l.created_at, c.id AS creation_id, c.title, c.asset_id, liker.name AS liker_name, liker.photo AS liker_photo,
                    l.created_at > me.notifications_seen_at AS unread
             FROM likes l
             JOIN creations c ON c.id = l.creation_id
             JOIN users liker ON liker.clerk_id = l.user_id
             JOIN users me ON me.clerk_id = c.owner
             WHERE c.owner = $1 AND l.user_id <> $1
             ORDER BY l.created_at DESC LIMIT 20`,
            [owner]
        );
        res.json({
            notifications: rows.map((r) => ({
                id: `${r.creation_id}:${r.created_at.toISOString()}`,
                type: "like",
                creationId: r.creation_id,
                title: r.title,
                imageUrl: assetUrl(r.asset_id),
                from: { name: r.liker_name, photo: r.liker_photo },
                unread: r.unread,
                createdAt: r.created_at,
            })),
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/notifications/seen
export const markNotificationsSeen = async (req, res, next) => {
    try {
        await query("UPDATE users SET notifications_seen_at = now() WHERE clerk_id = $1", [req.user.clerkId]);
        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
};
