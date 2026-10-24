import crypto from "crypto";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { query } from "../config/db.js";

export class ImageError extends Error {
    constructor(message, status = 502) {
        super(message);
        this.status = status;
    }
}

// ---------------------------------------------------------------- generation
// IMAGE_PROVIDER: pollinations (default, free, keyless; images carry a small Pollinations mark)
//                 or clipdrop (CLIPDROP_API_KEY, paid after the trial, square only)

export const IMAGE_STYLES = ["Realistic", "Cinematic", "Anime", "Ghibli-inspired", "3D render", "Watercolor", "Pixel art", "Minimal flat"];
export const ASPECTS = {
    square: { width: 1024, height: 1024 },
    landscape: { width: 1344, height: 768 },
    portrait: { width: 768, height: 1344 },
};

export const imageProviderName = () => {
    const chosen = process.env.IMAGE_PROVIDER?.trim().toLowerCase();
    if (chosen === "clipdrop" && process.env.CLIPDROP_API_KEY) return "clipdrop";
    return "pollinations";
};

export const generateImage = async ({ prompt, style, aspect }) => {
    const full = `${prompt}, ${style.toLowerCase()} style, high detail`;
    const started = Date.now();
    const provider = imageProviderName();
    let res;
    try {
        if (provider === "clipdrop") {
            const form = new FormData();
            form.append("prompt", full);
            res = await fetch("https://clipdrop-api.co/text-to-image/v1", {
                method: "POST",
                headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
                body: form,
                signal: AbortSignal.timeout(90_000),
            });
            if (res.status === 402) throw new ImageError("The ClipDrop account is out of credits", 503);
        } else {
            const { width, height } = ASPECTS[aspect];
            const seed = crypto.randomInt(1, 2 ** 31);
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
            res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
        }
    } catch (err) {
        if (err instanceof ImageError) throw err;
        throw new ImageError(err.name === "TimeoutError" ? "Image generation took too long. Try again." : "Couldn't reach the image service", 504);
    }
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) {
        throw new ImageError(res.status === 429 ? "The image service is busy. Try again in a minute." : `Image generation failed (HTTP ${res.status})`, 503);
    }
    return { buffer: Buffer.from(await res.arrayBuffer()), provider, durationMs: Date.now() - started };
};

// ---------------------------------------------------------------- background removal
// BG_PROVIDER: local (default, IMG.LY's open-source model inside this server: free, no key)
//              or cloudinary (Cloudinary's AI Background Removal add-on)

export const cloudinaryConfigured = () =>
    Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (cloudinaryConfigured()) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}

export const bgProviderName = () => (process.env.BG_PROVIDER === "cloudinary" && cloudinaryConfigured() ? "cloudinary" : "local");

// The local model is memory hungry: run two jobs at a time and queue the rest
let active = 0;
const waiting = [];
const withSlot = async (fn) => {
    if (active >= 2) {
        if (waiting.length >= 20) throw new ImageError("Toolverse is busy right now. Try again in a moment.", 503);
        await new Promise((resolve) => waiting.push(resolve));
    } else active += 1;
    try {
        return await fn();
    } finally {
        const next = waiting.shift();
        if (next) next();
        else active -= 1;
    }
};

const viaCloudinary = async (buffer, transformation) => {
    const uploaded = await new Promise((resolve, reject) =>
        cloudinary.uploader.upload_stream({ folder: "toolverse", resource_type: "image" }, (err, r) => (err ? reject(err) : resolve(r))).end(buffer)
    );
    try {
        const url = cloudinary.url(uploaded.public_id, { transformation, format: "png", secure: true });
        // Generative transformations are created on the first request and can take a few seconds
        for (let attempt = 0; attempt < 4; attempt += 1) {
            const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
            if (res.ok) return Buffer.from(await res.arrayBuffer());
            if (res.status !== 423 && res.status !== 420) {
                const reason = res.headers.get("x-cld-error") || `HTTP ${res.status}`;
                throw new ImageError(`Cloudinary couldn't edit the image: ${reason}`, 502);
            }
            await new Promise((r) => setTimeout(r, 3000));
        }
        throw new ImageError("Cloudinary is still processing the image. Try again in a moment.", 504);
    } finally {
        cloudinary.uploader.destroy(uploaded.public_id).catch(() => {});
    }
};

export const removeBackground = async (buffer) => {
    const started = Date.now();
    const provider = bgProviderName();
    const png =
        provider === "cloudinary"
            ? await viaCloudinary(buffer, [{ effect: "background_removal" }])
            : await withSlot(async () => {
                  const { removeBackground: run } = await import("@imgly/background-removal-node");
                  const blob = await run(new Blob([buffer], { type: "image/png" }), { model: "medium", output: { format: "image/png" } });
                  return Buffer.from(await blob.arrayBuffer());
              });
    return { buffer: png, provider, durationMs: Date.now() - started };
};

// Object removal is a Cloudinary generative AI feature (gen_remove); there's no free local equivalent
export const removeObject = async (buffer, object) => {
    if (!cloudinaryConfigured()) {
        throw new ImageError("Object removal needs Cloudinary. Add your Cloudinary keys to server/.env to turn it on.", 503);
    }
    const started = Date.now();
    const safe = object.replace(/[^\p{L}\p{N} -]/gu, "").trim().slice(0, 60);
    const png = await viaCloudinary(buffer, [{ effect: `gen_remove:prompt_${safe}` }]);
    return { buffer: png, provider: "cloudinary", durationMs: Date.now() - started };
};

// ---------------------------------------------------------------- storage

const MAX_SIDE = 2048;

// Decodes and validates an upload, applies EXIF rotation and caps its size
export const normalizeUpload = async (buffer) => {
    try {
        const meta = await sharp(buffer).metadata();
        if (!meta.width || meta.width * meta.height > 50_000_000) throw new Error("size");
        return await sharp(buffer).rotate().resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
    } catch {
        throw new ImageError("That file isn't an image Toolverse can read. Try a JPG, PNG or WebP.", 400);
    }
};

// Saves an image as an asset. Cutouts keep transparency as PNG; photos are stored as WebP.
export const saveAsset = async (owner, buffer, { keepAlpha = false } = {}) => {
    const img = sharp(buffer).resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true });
    const { data, info } = keepAlpha
        ? await img.png({ compressionLevel: 8 }).toBuffer({ resolveWithObject: true })
        : await img.webp({ quality: 86 }).toBuffer({ resolveWithObject: true });
    const mime = keepAlpha ? "image/png" : "image/webp";
    const { rows: [asset] } = await query(
        "INSERT INTO assets (owner, mime, width, height, bytes, size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, width, height, size",
        [owner, mime, info.width, info.height, data, data.length]
    );
    return { ...asset, mime };
};

// Signed, expiring file URLs, so <img src> works without auth headers and IDs can't be guessed
const secret = () =>
    process.env.FILE_SIGNING_SECRET || crypto.createHash("sha256").update(`toolverse-files:${process.env.CLERK_SECRET_KEY}`).digest("hex");
const HOUR = 3600;
const sign = (id, exp) => crypto.createHmac("sha256", secret()).update(`${id}:${exp}`).digest("base64url");

export const assetUrl = (id) => {
    if (!id) return null;
    const exp = (Math.ceil(Date.now() / 1000 / HOUR) + 6) * HOUR; // stable for a while, so browsers can cache
    return `/api/files/${id}?exp=${exp}&sig=${sign(id, exp)}`;
};

export const verifyAssetSignature = (id, exp, sig) => {
    const expNum = Number(exp);
    if (!Number.isFinite(expNum) || expNum * 1000 < Date.now() || typeof sig !== "string") return false;
    const expected = Buffer.from(sign(id, expNum));
    const given = Buffer.from(sig);
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
};

export const isUuid = (id) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
