// Security test for the Toolverse API with real Clerk sessions.
// Creates two throwaway users, checks who can see, change, publish, like and spend what, then deletes them.
// Usage: npm run test:security   (API running on API_URL, default http://localhost:3000)
import "dotenv/config";
import sharp from "sharp";
import { createClerkClient } from "@clerk/express";
import { pool, query } from "../config/db.js";
import { LIMITS, period } from "../lib/quota.js";

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
    if (ok) passed += 1;
    else failed += 1;
    console.log(`${ok ? "  ✓" : "  ✗"} ${name}${!ok && detail ? `  (${detail})` : ""}`);
};

const makeUser = async (tag) => {
    const email = `sec-${tag}-${Date.now()}@toolverse-demo.dev`;
    const u = await clerk.users.createUser({
        emailAddress: [email], password: `Sec!${Date.now()}xYz${tag}`, firstName: "Security", lastName: tag, skipPasswordChecks: true,
    });
    const s = await clerk.sessions.createSession({ userId: u.id });
    return { id: u.id, email, token: async () => (await clerk.sessions.getToken(s.id)).jwt };
};

const call = async (user, method, url, body) => {
    const headers = {};
    if (user) headers.Authorization = `Bearer ${typeof user === "string" ? user : await user.token()}`;
    let payload = body;
    if (body && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
    }
    const res = await fetch(API + url, { method, headers, body: payload });
    return { status: res.status, body: await res.json().catch(() => ({})) };
};

// A small test picture: an orange circle on a grey background
const picture = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#9aa3b2"/><circle cx="160" cy="120" r="70" fill="#f97316"/></svg>')).jpeg().toBuffer();
const imageForm = (buffer = picture, type = "image/jpeg", name = "circle.jpg", extra = {}) => {
    const f = new FormData();
    f.append("image", new Blob([buffer], { type }), name);
    for (const [k, v] of Object.entries(extra)) f.append(k, v);
    return f;
};
const usedImages = async (userId) =>
    (await query("SELECT count FROM usage WHERE user_id = $1 AND period = $2 AND kind = 'image'", [userId, period()])).rows[0]?.count ?? 0;

const alice = await makeUser("alice");
const bob = await makeUser("bob");

try {
    console.log("\nAuthentication");
    check("GET /api/me without a token -> 401", (await call(null, "GET", "/api/me")).status === 401);
    const forged = ["eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9", Buffer.from(JSON.stringify({ sub: alice.id })).toString("base64url"), "c2ln"].join(".");
    check("forged JWT is rejected -> 401", (await call(forged, "GET", "/api/me")).status === 401);
    check("tool call without a token -> 401", (await call(null, "POST", "/api/tools/remove-background", imageForm())).status === 401);
    check("community without a token -> 401", (await call(null, "GET", "/api/community")).status === 401);
    const me = await call(alice, "GET", "/api/me");
    check("signed-in user gets their profile and usage", me.status === 200 && me.body.user.id === alice.id && me.body.usage.image.limit === LIMITS.free.image);

    console.log("\nCreations and ownership");
    const made = await call(alice, "POST", "/api/tools/remove-background", imageForm());
    check("background removal works -> 201", made.status === 201, made.body.error);
    const id = made.body.creation?.id;
    check("one image action is counted", made.body.usage?.image.used === 1);
    check("owner can read it", (await call(alice, "GET", `/api/creations/${id}`)).status === 200);
    check("another user can't read it -> 404", (await call(bob, "GET", `/api/creations/${id}`)).status === 404);
    check("another user can't publish it -> 404", (await call(bob, "PATCH", `/api/creations/${id}`, { published: true })).status === 404);
    check("another user can't delete it -> 404", (await call(bob, "DELETE", `/api/creations/${id}`)).status === 404);
    const bobList = await call(bob, "GET", "/api/creations");
    check("it isn't in another user's list", bobList.status === 200 && !bobList.body.creations.some((c) => c.id === id));

    console.log("\nSigned file URLs");
    const url = made.body.creation.imageUrl;
    const otherId = made.body.creation.sourceUrl.match(/files\/([^?]+)/)[1];
    check("signed URL works", (await fetch(API + url)).status === 200);
    check("signature for another file is refused", (await fetch(API + url.replace(/files\/[^?]+/, `files/${otherId}`))).status === 403);
    check("tampered signature is refused", (await fetch(API + url.replace(/sig=.{4}/, "sig=AAAA"))).status === 403);
    check("expired URL is refused", (await fetch(API + url.replace(/exp=\d+/, `exp=${Math.floor(Date.now() / 1000) - 60}`))).status === 403);

    console.log("\nCommunity");
    check("unpublished creation can't be liked -> 404", (await call(bob, "POST", `/api/community/${id}/like`)).status === 404);
    check("owner can publish an image", (await call(alice, "PATCH", `/api/creations/${id}`, { published: true })).body.creation?.published === true);
    const feed = await call(bob, "GET", "/api/community");
    const item = feed.body.creations?.find((c) => c.id === id);
    check("published image shows in the community", Boolean(item));
    check("community shows the author's name, not their id or email", item?.author?.name === "Security alice" && !JSON.stringify(feed.body).includes(alice.id) && !JSON.stringify(feed.body).includes(alice.email));
    const like1 = await call(bob, "POST", `/api/community/${id}/like`);
    const like2 = await call(bob, "POST", `/api/community/${id}/like`);
    check("like then unlike toggles the count", like1.body.liked === true && like1.body.likes === 1 && like2.body.liked === false && like2.body.likes === 0);
    await Promise.all([1, 2, 3, 4].map(() => call(bob, "POST", `/api/community/${id}/like`)));
    const likes = (await query("SELECT count(*) AS n FROM likes WHERE creation_id = $1", [id])).rows[0].n;
    check("concurrent likes never duplicate", likes <= 1, `likes=${likes}`);
    const { rows: [article] } = await query(
        "INSERT INTO creations (owner, type, title, content, provider) VALUES ($1, 'article', 'Test', '# Test', 'test') RETURNING id", [alice.id]
    );
    check("text creations can't be published -> 400", (await call(alice, "PATCH", `/api/creations/${article.id}`, { published: true })).status === 400);
    check("unknown creation can't be liked -> 404", (await call(bob, "POST", "/api/community/00000000-0000-4000-8000-000000000000/like")).status === 404);

    console.log("\nQuotas");
    const before = await usedImages(alice.id);
    const notImage = await call(alice, "POST", "/api/tools/remove-background", imageForm(Buffer.from("definitely not a picture"), "image/png", "fake.png"));
    check("non-image upload -> 400", notImage.status === 400);
    check("bad input doesn't use the quota", (await usedImages(alice.id)) === before);
    const shortPrompt = await call(alice, "POST", "/api/tools/image", { prompt: "x" });
    check("too-short image prompt -> 400 without using the quota", shortPrompt.status === 400 && (await usedImages(alice.id)) === before);
    const obj = await call(alice, "POST", "/api/tools/remove-object", imageForm(picture, "image/jpeg", "circle.jpg", { object: "circle" }));
    if (!process.env.CLOUDINARY_API_SECRET) {
        check("object removal without Cloudinary -> 503, quota untouched", obj.status === 503 && (await usedImages(alice.id)) === before);
    }
    const notPdf = new FormData();
    notPdf.append("resume", new Blob([picture], { type: "image/jpeg" }), "resume.jpg");
    check("resume review rejects non-PDF files -> 400", (await call(alice, "POST", "/api/tools/resume-review", notPdf)).status === 400);

    const limit = LIMITS.free.image;
    await query("UPDATE usage SET count = $3 WHERE user_id = $1 AND period = $2 AND kind = 'image'", [alice.id, period(), limit - 1]);
    const burst = await Promise.all([1, 2, 3].map(() => call(alice, "POST", "/api/tools/remove-background", imageForm())));
    const ok = burst.filter((r) => r.status === 201).length;
    check("3 parallel requests with 1 action left: exactly one succeeds", ok === 1, `${ok} succeeded`);
    check("the others get 429 QUOTA_REACHED", burst.filter((r) => r.status === 429 && r.body.code === "QUOTA_REACHED").length === 2);
    check("usage never goes over the limit", (await usedImages(alice.id)) === limit, `used=${await usedImages(alice.id)}`);

    console.log("\nOther endpoints");
    const hook = await fetch(`${API}/api/webhooks/clerk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "user.deleted", data: { id: bob.id } }) });
    check("unsigned Clerk webhook is refused", hook.status === 400 || hook.status === 404, `status ${hook.status}`);
    check("malformed creation id -> 404", (await call(alice, "GET", "/api/creations/not-an-id")).status === 404);
    check("owner can delete their creation", (await call(alice, "DELETE", `/api/creations/${id}`)).status === 200);
    const leftovers = (await query("SELECT count(*) AS n FROM assets WHERE id = $1", [otherId])).rows[0].n;
    check("deleting a creation removes its files", leftovers === 0);
} finally {
    for (const u of [alice, bob]) {
        // Creations, files, likes and usage go with the user (ON DELETE CASCADE)
        await Promise.all([clerk.users.deleteUser(u.id).catch(() => {}), query("DELETE FROM users WHERE clerk_id = $1", [u.id])]);
    }
    await pool.end();
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
