import { clerkClient } from "@clerk/express";
import { query } from "../config/db.js";

export const toUser = (row) =>
    row && { clerkId: row.clerk_id, email: row.email, name: row.name, photo: row.photo, createdAt: row.created_at };

export const findUser = async (clerkId) => toUser((await query("SELECT * FROM users WHERE clerk_id = $1", [clerkId])).rows[0]);

const profileFromClerk = (u) => ({
    email: (u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress || "").toLowerCase(),
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Creator",
    photo: u.imageUrl || "",
});

// Returns the user's record, creating it from their Clerk profile on the first request.
// Names and photos are stored so the community can show authors without calling Clerk per item.
export const ensureUser = async (clerkId) => {
    const existing = await findUser(clerkId);
    if (existing) return existing;
    const p = profileFromClerk(await clerkClient.users.getUser(clerkId));
    await query(
        "INSERT INTO users (clerk_id, email, name, photo) VALUES ($1, $2, $3, $4) ON CONFLICT (clerk_id) DO NOTHING",
        [clerkId, p.email, p.name, p.photo]
    );
    return findUser(clerkId);
};

export const syncUserProfile = async (clerkUser) => {
    const p = profileFromClerk(clerkUser);
    await query("UPDATE users SET email = $2, name = $3, photo = $4, updated_at = now() WHERE clerk_id = $1", [clerkUser.id, p.email, p.name, p.photo]);
};
