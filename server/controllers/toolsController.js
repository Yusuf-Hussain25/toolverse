import { extractText, getDocumentProxy } from "unpdf";
import { query } from "../config/db.js";
import { consume, refund, usageFor } from "../lib/quota.js";
import {
    ARTICLE_LENGTHS, ARTICLE_TONES, BLOG_CATEGORIES, blogTitles, firstHeading, reviewResume, splitScore, writeArticle,
} from "../lib/ai.js";
import { ASPECTS, IMAGE_STYLES, ImageError, cloudinaryConfigured, generateImage, normalizeUpload, removeBackground, removeObject, saveAsset } from "../lib/images.js";
import { CREATION_FROM, CREATION_SELECT, TOOL_KIND, serializeCreation } from "../lib/creations.js";

class InputError extends Error {
    constructor(message) {
        super(message);
        this.status = 400;
    }
}

const text = (value, { name, min = 1, max }) => {
    const v = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
    if (v.length < min) throw new InputError(`Add ${name}`);
    if (v.length > max) throw new InputError(`Keep ${name} under ${max} characters`);
    return v;
};
const oneOf = (value, list, fallback) => (list.includes(value) ? value : fallback);
const fileBase = (name = "") => name.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80) || "Untitled";

const insertCreation = async (owner, c) => {
    const { rows: [row] } = await query(
        `INSERT INTO creations (owner, type, title, prompt, content, options, asset_id, source_id, provider, duration_ms, published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [owner, c.type, c.title.slice(0, 200), c.prompt || "", c.content ?? null, c.options || {}, c.assetId || null, c.sourceId || null,
            c.provider, c.durationMs || 0, Boolean(c.published)]
    );
    const { rows: [full] } = await query(`SELECT ${CREATION_SELECT} FROM ${CREATION_FROM} WHERE c.id = $1`, [row.id]);
    return full;
};

// Validates input, takes one unit of the monthly quota, runs the tool and refunds the unit if it fails
const tool = (type, prepare, run) => async (req, res, next) => {
    const kind = TOOL_KIND[type];
    let consumed = false;
    try {
        const input = await prepare(req);
        await consume(req.user.clerkId, req.plan, kind);
        consumed = true;
        const row = await insertCreation(req.user.clerkId, { type, ...(await run(input, req)) });
        res.status(201).json({ creation: serializeCreation(row), usage: await usageFor(req.user.clerkId, req.plan) });
    } catch (error) {
        if (consumed) await refund(req.user.clerkId, kind);
        next(error);
    }
};

export const article = tool(
    "article",
    (req) => ({
        topic: text(req.body?.topic, { name: "a topic", min: 3, max: 200 }),
        length: oneOf(req.body?.length, Object.keys(ARTICLE_LENGTHS), "short"),
        tone: oneOf(req.body?.tone, ARTICLE_TONES, "Informative"),
    }),
    async (input) => {
        const { content, provider, durationMs } = await writeArticle(input);
        return { title: firstHeading(content) || input.topic, prompt: input.topic, content, options: { length: input.length, tone: input.tone }, provider, durationMs };
    }
);

export const titles = tool(
    "blog-titles",
    (req) => ({
        keyword: text(req.body?.keyword, { name: "a topic", min: 2, max: 120 }),
        category: oneOf(req.body?.category, BLOG_CATEGORIES, "General"),
    }),
    async (input) => {
        const { content, provider, durationMs } = await blogTitles(input);
        return { title: `Titles: ${input.keyword}`, prompt: input.keyword, content, options: { category: input.category }, provider, durationMs };
    }
);

export const image = tool(
    "image",
    (req) => ({
        prompt: text(req.body?.prompt, { name: "a description", min: 3, max: 400 }),
        style: oneOf(req.body?.style, IMAGE_STYLES, "Realistic"),
        aspect: oneOf(req.body?.aspect, Object.keys(ASPECTS), "square"),
        publish: req.body?.publish === true,
    }),
    async (input, req) => {
        const { buffer, provider, durationMs } = await generateImage(input);
        const asset = await saveAsset(req.user.clerkId, buffer);
        return {
            title: input.prompt.slice(0, 120), prompt: input.prompt, options: { style: input.style, aspect: input.aspect },
            assetId: asset.id, provider, durationMs, published: input.publish,
        };
    }
);

const requireFile = (req, what = "an image") => {
    if (!req.file) throw new InputError(`Choose ${what} to upload`);
    return req.file;
};

export const background = tool(
    "background",
    async (req) => {
        const file = requireFile(req);
        return { name: fileBase(file.originalname), buffer: await normalizeUpload(file.buffer) };
    },
    async (input, req) => {
        const { buffer, provider, durationMs } = await removeBackground(input.buffer);
        const source = await saveAsset(req.user.clerkId, input.buffer);
        const asset = await saveAsset(req.user.clerkId, buffer, { keepAlpha: true });
        return { title: input.name, prompt: "Remove the background", assetId: asset.id, sourceId: source.id, provider, durationMs };
    }
);

export const object = tool(
    "object",
    async (req) => {
        // Checked before the quota is touched, so a disabled tool never costs anything
        if (!cloudinaryConfigured()) throw new ImageError("Object removal needs Cloudinary. Add your Cloudinary keys to server/.env to turn it on.", 503);
        const file = requireFile(req);
        const target = text(req.body?.object, { name: "the object to remove", min: 2, max: 60 });
        return { name: fileBase(file.originalname), target, buffer: await normalizeUpload(file.buffer) };
    },
    async (input, req) => {
        const { buffer, provider, durationMs } = await removeObject(input.buffer, input.target);
        const source = await saveAsset(req.user.clerkId, input.buffer);
        const asset = await saveAsset(req.user.clerkId, buffer);
        return {
            title: `${input.name}, without ${input.target}`, prompt: `Remove ${input.target}`, options: { object: input.target },
            assetId: asset.id, sourceId: source.id, provider, durationMs,
        };
    }
);

export const resume = tool(
    "resume-review",
    async (req) => {
        const file = requireFile(req, "a PDF resume");
        const role = req.body?.role ? text(req.body.role, { name: "the target role", max: 80 }) : "";
        let pdfText = "";
        try {
            const pdf = await getDocumentProxy(new Uint8Array(file.buffer));
            pdfText = (await extractText(pdf, { mergePages: true })).text;
        } catch {
            throw new InputError("That PDF couldn't be opened. Try exporting it again.");
        }
        pdfText = pdfText.replace(/\s+\n/g, "\n").trim();
        if (pdfText.length < 150) throw new InputError("There's almost no text in that PDF. Scanned resumes need to be exported with selectable text.");
        return { name: fileBase(file.originalname), role, text: pdfText.slice(0, 14000) };
    },
    async (input) => {
        const { content, provider, durationMs } = await reviewResume(input);
        const { score, body } = splitScore(content);
        return {
            title: `Resume review: ${input.name}`, prompt: input.role ? `Target role: ${input.role}` : "Resume review",
            content: body, options: { score, role: input.role || null, file: input.name }, provider, durationMs,
        };
    }
);
