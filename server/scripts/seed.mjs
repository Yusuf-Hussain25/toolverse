// Fills Toolverse with realistic demo data through the real API (same auth, validation, AI providers
// and quotas). The database is touched only to backdate timestamps, mark samples and reset the
// demo account's monthly usage afterwards, so visitors get the full allowance.
//
//   npm run seed                          demo account + 3 creators with community posts
//   npm run seed -- --with you@email.com  also add a few creations to your own account
//
// Needs the API running (npm run dev) and CLERK_SECRET_KEY, DEMO_EMAIL, DEMO_PASSWORD and
// SEED_PASSWORD in server/.env. Safe to re-run: accounts and creations are reused, never duplicated.
// With the free text provider, text creations are spaced ~30 s apart, so a full run takes a while.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClerkClient } from "@clerk/express";
import { pool, query } from "../config/db.js";
import { period } from "../lib/quota.js";

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
const SAMPLES = path.join(path.dirname(fileURLToPath(import.meta.url)), "samples");
const DAY = 24 * 60 * 60 * 1000;

const missing = ["DATABASE_URL", "CLERK_SECRET_KEY", "DEMO_EMAIL", "DEMO_PASSWORD", "SEED_PASSWORD"].filter((k) => !process.env[k]);
if (missing.length) {
    console.error(`Add ${missing.join(", ")} to server/.env first (see .env.example).`);
    process.exit(1);
}
const withIndex = process.argv.indexOf("--with");
const withEmail = withIndex > -1 ? process.argv[withIndex + 1]?.toLowerCase() : null;
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Each item: [tool, input, daysAgo, { publish, title }]. `title` is how the seeder recognises it on re-runs.
const DEMO = [
    ["image", { prompt: "a red fox standing in a snowy pine forest, morning light", style: "Realistic", aspect: "landscape" }, 12.4, { publish: true }],
    ["article", { topic: "How to build a morning routine that actually sticks", length: "medium", tone: "Conversational" }, 11.6],
    ["blog-titles", { keyword: "home espresso", category: "Food" }, 10.2],
    ["background", { file: "white-sneaker.jpg" }, 9.1],
    ["image", { prompt: "a lighthouse on a cliff above crashing waves at sunset", style: "Cinematic", aspect: "landscape" }, 8.3, { publish: true }],
    ["article", { topic: "A beginner's guide to composting at home", length: "short", tone: "Informative" }, 7.2],
    ["resume-review", { file: "resume-jordan-ellis.pdf", role: "Senior Frontend Engineer" }, 6.5],
    ["image", { prompt: "a cozy ramen shop on a rainy Tokyo street at night, glowing lanterns", style: "Anime", aspect: "portrait" }, 5.4, { publish: true }],
    ["blog-titles", { keyword: "remote work habits", category: "Business" }, 4.1],
    ["background", { file: "studio-headphones.jpg" }, 3.3],
    ["image", { prompt: "an astronaut floating among glowing jellyfish in deep space", style: "Watercolor", aspect: "portrait" }, 2.2, { publish: true }],
    ["article", { topic: "Why small businesses should invest in email marketing", length: "short", tone: "Persuasive" }, 1.4],
    ["image", { prompt: "a minimalist desk with a laptop, a ceramic mug and a monstera plant", style: "3D render", aspect: "square" }, 0.6],
    ["blog-titles", { keyword: "budget travel in Japan", category: "Travel" }, 0.15],
];

const PEOPLE = [
    { email: process.env.DEMO_EMAIL.toLowerCase(), password: process.env.DEMO_PASSWORD, first: "Maya", last: "Collins", portrait: "women/44", items: DEMO, demo: true },
    {
        email: "arjun.mehta@toolverse-demo.dev", first: "Arjun", last: "Mehta", portrait: "men/32",
        items: [
            ["image", { prompt: "a cyberpunk street market with neon signs in the rain", style: "Cinematic", aspect: "landscape" }, 9.5, { publish: true }],
            ["image", { prompt: "a tiny cottage on a mossy hill under a giant moon", style: "Ghibli-inspired", aspect: "square" }, 3.8, { publish: true }],
        ],
    },
    {
        email: "sofia.alvarez@toolverse-demo.dev", first: "Sofia", last: "Alvarez", portrait: "women/68",
        items: [
            ["image", { prompt: "a steaming bowl of ramen, top-down food photography on a wooden table", style: "Realistic", aspect: "square" }, 7.7, { publish: true }],
            ["image", { prompt: "flowing abstract waves of violet and teal", style: "Minimal flat", aspect: "portrait" }, 1.9, { publish: true }],
        ],
    },
    {
        email: "liam.oconnor@toolverse-demo.dev", first: "Liam", last: "O'Connor", portrait: "men/75",
        items: [
            ["image", { prompt: "a friendly robot watering plants in a sunny greenhouse", style: "Pixel art", aspect: "square" }, 6.2, { publish: true }],
            ["image", { prompt: "a mountain lake at dawn with mist over the water", style: "Watercolor", aspect: "landscape" }, 0.9, { publish: true }],
        ],
    },
];

const ENDPOINT = {
    article: "article", "blog-titles": "blog-titles", image: "image", background: "remove-background", "resume-review": "resume-review",
};

const log = (...a) => console.log(" ", ...a);
const at = (daysAgo) => {
    const d = new Date(Date.now() - daysAgo * DAY);
    if (daysAgo >= 1) d.setHours(9 + Math.floor((daysAgo * 7) % 11), Math.floor((daysAgo * 97) % 60));
    return d;
};

const ensureClerkUser = async (p) => {
    const { data } = await clerk.users.getUserList({ emailAddress: [p.email] });
    let user = data[0];
    if (!user) {
        user = await clerk.users.createUser({
            emailAddress: [p.email], password: p.password || process.env.SEED_PASSWORD, firstName: p.first, lastName: p.last, skipPasswordChecks: true,
        });
        log(`created ${p.email}`);
    }
    if (!user.hasImage && p.portrait) {
        const res = await fetch(`https://randomuser.me/api/portraits/${p.portrait}.jpg`);
        if (res.ok) user = await clerk.users.updateUserProfileImage(user.id, { file: new Blob([await res.arrayBuffer()], { type: "image/jpeg" }) });
    }
    return user;
};

const tokenFor = async (userId) => {
    const session = await clerk.sessions.createSession({ userId });
    return async () => (await clerk.sessions.getToken(session.id)).jwt;
};

const api = async (token, method, url, body) => {
    const headers = { Authorization: `Bearer ${await token()}` };
    let payload = body;
    if (body && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
    }
    const res = await fetch(API + url, { method, headers, body: payload });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${json.error || ""}`);
    return json;
};

// The prompt (or file) identifies an item, so re-runs skip what already exists
const keyFor = (tool, input) => input.prompt || input.topic || input.keyword || (tool === "background" ? "Remove the background" : input.role);

const makeOne = async (token, tool, input, publish) => {
    if (tool === "background" || tool === "resume-review") {
        const form = new FormData();
        const mime = input.file.endsWith(".pdf") ? "application/pdf" : "image/jpeg";
        form.append(tool === "background" ? "image" : "resume", new Blob([fs.readFileSync(path.join(SAMPLES, input.file))], { type: mime }), input.file);
        if (input.role) form.append("role", input.role);
        return (await api(token, "POST", `/api/tools/${ENDPOINT[tool]}`, form)).creation;
    }
    return (await api(token, "POST", `/api/tools/${ENDPOINT[tool]}`, { ...input, publish: Boolean(publish) })).creation;
};

const seedPerson = async (person, { sample = true } = {}) => {
    const user = await ensureClerkUser(person);
    const token = await tokenFor(user.id);
    await api(token, "GET", "/api/me"); // creates the Toolverse record the normal way
    await query("UPDATE users SET photo = $2, created_at = $3 WHERE clerk_id = $1", [user.id, user.imageUrl, at(person.demo ? 24 : 18)]);

    let added = 0;
    let skipped = 0;
    for (const [tool, input, daysAgo, extra = {}] of person.items) {
        const key = keyFor(tool, input);
        const filter = tool === "background" ? "title = $3" : "prompt = $3";
        const value = tool === "background" ? input.file.replace(/\.[a-z]+$/, "") : tool === "resume-review" ? `Target role: ${input.role}` : key;
        const { rows } = await query(`SELECT id FROM creations WHERE owner = $1 AND type = $2 AND ${filter}`, [user.id, tool, value]);
        if (rows.length) {
            skipped += 1;
            continue;
        }
        try {
            const c = await makeOne(token, tool, input, extra.publish);
            await query("UPDATE creations SET created_at = $2, updated_at = $2, sample = $3 WHERE id = $1", [c.id, at(daysAgo), sample]);
            added += 1;
            log(`${person.first}: ${tool} "${c.title.slice(0, 50)}"`);
        } catch (err) {
            log(`${person.first}: ${tool} failed (${err.message}); run the seeder again later to fill it in`);
        }
    }
    log(`${person.email}: ${added} new, ${skipped} already there`);
    return user;
};

const main = async () => {
    try {
        await fetch(`${API}/api/health`);
    } catch {
        console.error(`Can't reach the API at ${API}. Start it with "npm run dev" first.`);
        process.exit(1);
    }
    console.log(`Seeding Toolverse through ${API}\n`);

    const users = [];
    for (const person of PEOPLE) users.push(await seedPerson(person));

    // Community likes: everyone likes a few of the others' published images
    const { rows: published } = await query("SELECT id, owner FROM creations WHERE published AND sample ORDER BY created_at");
    for (const [i, u] of users.entries()) {
        const token = await tokenFor(u.id);
        for (const [j, c] of published.entries()) {
            if (c.owner === u.id || (i + j) % 3 === 0) continue;
            const { rows } = await query("SELECT 1 FROM likes WHERE creation_id = $1 AND user_id = $2", [c.id, u.id]);
            if (!rows.length) await api(token, "POST", `/api/community/${c.id}/like`);
        }
    }
    log(`likes: ${(await query("SELECT count(*) AS n FROM likes")).rows[0].n} in total`);

    if (withEmail) {
        const { data } = await clerk.users.getUserList({ emailAddress: [withEmail] });
        if (!data.length) console.error(`\nNo Toolverse account for ${withEmail}. Sign up in the app first, then run this again.`);
        else {
            const p = { email: withEmail, first: data[0].firstName || "You", items: DEMO.slice(0, 4) };
            await seedPerson(p, { sample: false });
        }
    }

    // Seeding used the API like a person would; give the seeded accounts their full monthly allowance back
    await query("DELETE FROM usage WHERE period = $1 AND user_id = ANY($2)", [period(), users.map((u) => u.id)]);

    console.log(`\nDone. Sign in with "Explore with a demo account" or ${process.env.DEMO_EMAIL} / DEMO_PASSWORD.`);
    await pool.end();
};

main().catch(async (err) => {
    console.error("\nSeeding failed:", err.message);
    await pool.end();
    process.exit(1);
});
