import { query } from "../config/db.js";
import { usageFor } from "../lib/quota.js";
import { describeTextProvider, ARTICLE_LENGTHS, ARTICLE_TONES, BLOG_CATEGORIES } from "../lib/ai.js";
import { ASPECTS, IMAGE_STYLES, bgProviderName, cloudinaryConfigured, imageProviderName } from "../lib/images.js";

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

// GET /api/me: profile, plan, this month's usage and creation counts for the dashboard
export const getMe = async (req, res, next) => {
    try {
        const owner = req.user.clerkId;
        const [usage, byType, likes, perDay] = await Promise.all([
            usageFor(owner, req.plan),
            query("SELECT type, count(*) AS count FROM creations WHERE owner = $1 GROUP BY type", [owner]),
            query("SELECT count(*) AS count FROM likes l JOIN creations c ON c.id = l.creation_id WHERE c.owner = $1", [owner]),
            query(
                `SELECT to_char(d, 'YYYY-MM-DD') AS day, count(c.id) AS count
                 FROM generate_series((now() AT TIME ZONE 'UTC')::date - 13, (now() AT TIME ZONE 'UTC')::date, interval '1 day') AS d
                 LEFT JOIN creations c ON c.owner = $1 AND (c.created_at AT TIME ZONE 'UTC')::date = d::date
                 GROUP BY d ORDER BY d`,
                [owner]
            ),
        ]);
        const counts = Object.fromEntries(byType.rows.map((r) => [r.type, r.count]));
        const u = req.user;
        res.json({
            user: { id: u.clerkId, name: u.name, email: u.email, photo: u.photo, createdAt: u.createdAt },
            plan: req.plan,
            demo: req.isDemo,
            usage,
            stats: {
                total: Object.values(counts).reduce((a, b) => a + b, 0),
                byType: counts,
                likesReceived: likes.rows[0].count,
                last14: perDay.rows,
            },
            tools: toolsInfo(),
        });
    } catch (error) {
        next(error);
    }
};
