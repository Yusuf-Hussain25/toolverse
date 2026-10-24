import { query } from "../config/db.js";

// Monthly allowances per plan. "text" covers articles, titles and resume reviews;
// "image" covers generation, background and object removal.
export const LIMITS = {
    free: { text: Number(process.env.FREE_TEXT_LIMIT || 30), image: Number(process.env.FREE_IMAGE_LIMIT || 15) },
    premium: { text: 500, image: 200 },
};

export const period = (d = new Date()) => d.toISOString().slice(0, 7); // 'YYYY-MM' in UTC

export class QuotaError extends Error {
    constructor(kind, limit) {
        super(`You've used all ${limit} ${kind === "text" ? "writing" : "image"} actions for this month.`);
        this.status = 429;
        this.code = "QUOTA_REACHED";
    }
}

// Takes one unit atomically: the counter only moves while it's under the limit, so parallel
// requests can't overshoot. The original read a counter from Clerk metadata, then wrote count + 1.
export const consume = async (userId, plan, kind) => {
    const limit = LIMITS[plan][kind];
    const { rows } = await query(
        `INSERT INTO usage (user_id, period, kind, count) VALUES ($1, $2, $3, 1)
         ON CONFLICT (user_id, period, kind) DO UPDATE SET count = usage.count + 1
         WHERE usage.count < $4
         RETURNING count`,
        [userId, period(), kind, limit]
    );
    if (!rows.length || rows[0].count > limit) throw new QuotaError(kind, limit);
    return { used: rows[0].count, limit };
};

// Gives a unit back when the tool fails, so errors don't cost anything
export const refund = (userId, kind) =>
    query("UPDATE usage SET count = count - 1 WHERE user_id = $1 AND period = $2 AND kind = $3 AND count > 0", [userId, period(), kind]).catch(() => {});

export const usageFor = async (userId, plan) => {
    const { rows } = await query("SELECT kind, count FROM usage WHERE user_id = $1 AND period = $2", [userId, period()]);
    const used = Object.fromEntries(rows.map((r) => [r.kind, r.count]));
    const now = new Date();
    const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
    return {
        text: { used: used.text || 0, limit: LIMITS[plan].text },
        image: { used: used.image || 0, limit: LIMITS[plan].image },
        resetsAt,
    };
};
