// Text generation. Pick a provider with TEXT_PROVIDER:
//   gemini        Google Gemini (GEMINI_API_KEY, free tier from AI Studio). Default when the key is set.
//   pollinations  Pollinations.ai's free, keyless endpoint. Default without a Gemini key, so every
//                 text tool works out of the box.
// Both speak the OpenAI chat-completions format.

export class AIError extends Error {
    constructor(message, status = 502) {
        super(message);
        this.status = status;
    }
}

const PROVIDERS = {
    gemini: {
        label: "Google Gemini",
        configured: () => Boolean(process.env.GEMINI_API_KEY),
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        headers: () => ({ Authorization: `Bearer ${process.env.GEMINI_API_KEY}` }),
        model: () => process.env.GEMINI_MODEL || "gemini-2.5-flash",
    },
    pollinations: {
        label: "Pollinations (free)",
        configured: () => true,
        url: "https://text.pollinations.ai/openai",
        headers: () => ({}),
        model: () => process.env.POLLINATIONS_TEXT_MODEL || "openai",
    },
};

export const textProviderName = () => {
    const chosen = process.env.TEXT_PROVIDER?.trim().toLowerCase();
    if (chosen && PROVIDERS[chosen]) return chosen;
    return PROVIDERS.gemini.configured() ? "gemini" : "pollinations";
};

export const describeTextProvider = () => {
    const name = textProviderName();
    return { name, label: PROVIDERS[name].label, configured: PROVIDERS[name].configured() };
};

// Pollinations' free tier answers one request per IP every ~30 seconds. Calls are queued and spaced
// out so a few people using the free provider at once wait a little instead of getting errors.
const FREE_GAP_MS = 31_000;
const MAX_FREE_WAIT_MS = 75_000;
let freeChain = Promise.resolve();
let lastFreeCall = 0;
let freeWaiting = 0;
const freeSlot = () => {
    const wait = Math.max(0, lastFreeCall + FREE_GAP_MS - Date.now()) + freeWaiting * FREE_GAP_MS;
    if (wait > MAX_FREE_WAIT_MS) {
        return Promise.reject(new AIError("The free AI provider is busy. Try again in a minute, or add a Gemini key for faster answers.", 503));
    }
    freeWaiting += 1;
    const slot = freeChain.then(async () => {
        const gap = lastFreeCall + FREE_GAP_MS - Date.now();
        if (gap > 0) await new Promise((r) => setTimeout(r, gap));
        lastFreeCall = Date.now();
        freeWaiting -= 1;
    });
    freeChain = slot.catch(() => {});
    return slot;
};

const complete = async (args) => {
    const name = textProviderName();
    if (name !== "pollinations") return request(name, args);
    await freeSlot();
    try {
        return await request(name, args);
    } catch (err) {
        // "Retry after 7s" or an empty answer: wait and try once more
        const retry = Number(err.message.match(/retry after (\d+)\s*s/i)?.[1]) || (err.empty ? 30 : 0);
        if (!retry || retry > 40) throw err;
        await new Promise((r) => setTimeout(r, (retry + 1) * 1000));
        lastFreeCall = Date.now();
        return request(name, args);
    }
};

const request = async (name, { system, user, maxTokens = 4096, temperature = 0.7 }) => {
    const p = PROVIDERS[name];
    if (!p.configured()) throw new AIError(`TEXT_PROVIDER is "${name}" but its API key is missing in server/.env`, 503);

    const started = Date.now();
    let res;
    try {
        res = await fetch(p.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...p.headers() },
            body: JSON.stringify({
                model: p.model(),
                messages: [{ role: "system", content: system }, { role: "user", content: user }],
                // The free model reasons before answering and its replies are capped at ~1,500 tokens:
                // keep its reasoning short and don't cap it further, or nothing is left for the answer
                ...(name === "pollinations" ? { reasoning_effort: "low" } : { max_tokens: maxTokens }),
                temperature,
            }),
            signal: AbortSignal.timeout(120_000),
        });
    } catch (err) {
        throw new AIError(err.name === "TimeoutError" ? "The AI took too long to answer. Try again." : "Couldn't reach the AI service", 504);
    }
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) throw new AIError("The AI service is busy right now. Try again in a minute.", 503);
    if (!res.ok) throw new AIError(`${p.label}: ${body.error?.message || body[0]?.error?.message || `HTTP ${res.status}`}`);

    const content = body.choices?.[0]?.message?.content?.trim();
    if (!content) throw Object.assign(new AIError("The AI returned an empty answer. Try again."), { empty: true });
    return { content, provider: name, durationMs: Date.now() - started };
};

// ---------------------------------------------------------------- tools

export const ARTICLE_LENGTHS = {
    short: { words: "500 to 700", tokens: 2000 },
    medium: { words: "900 to 1,200", tokens: 3200 },
    long: { words: "1,400 to 1,800", tokens: 4800 },
};
export const ARTICLE_TONES = ["Informative", "Conversational", "Professional", "Persuasive"];
export const BLOG_CATEGORIES = ["General", "Technology", "Business", "Health", "Lifestyle", "Education", "Travel", "Food"];

export const writeArticle = ({ topic, length, tone }) =>
    complete({
        system:
            "You are a senior content writer. Write in Markdown. Start with one H1 title, then a short introduction, " +
            "H2 sections with short paragraphs (use a bulleted list where it helps), and a brief conclusion. " +
            "Write only the article: no preamble, no notes about the task.",
        user: `Write a ${tone.toLowerCase()} article of about ${ARTICLE_LENGTHS[length].words} words about: ${topic}`,
        maxTokens: ARTICLE_LENGTHS[length].tokens,
    });

export const blogTitles = ({ keyword, category }) =>
    complete({
        system:
            "You suggest blog post titles. Reply with a Markdown numbered list of exactly 10 short, punchy titles " +
            "and nothing else. Mix styles: how-to, listicle, question, bold claim.",
        user: `Topic: ${keyword}\nCategory: ${category}`,
        maxTokens: 800,
        temperature: 0.9,
    });

export const reviewResume = ({ text, role }) =>
    complete({
        system:
            "You are an experienced recruiter reviewing a resume. Reply in Markdown. The very first line must be " +
            "exactly 'Score: NN/100'. Then these sections: '## Summary' (2-3 sentences), '## Strengths' (bullets), " +
            "'## What to improve' (specific, actionable bullets), '## Missing keywords' (comma-separated), " +
            "'## Suggested summary' (a rewritten 2-3 sentence profile). Be direct and specific to this resume.",
        user: `${role ? `Target role: ${role}\n\n` : ""}Resume:\n\n${text}`,
        maxTokens: 2400,
        temperature: 0.4,
    });

// "Score: 78/100" on the first line -> 78, and the rest as the review body
export const splitScore = (markdown) => {
    const match = markdown.match(/^\s*\**score:?\**\s*(\d{1,3})\s*\/\s*100\**\s*\n?/i);
    if (!match) return { score: null, body: markdown };
    return { score: Math.min(100, Number(match[1])), body: markdown.slice(match[0].length).trim() };
};

// First Markdown H1, without the '#'
export const firstHeading = (markdown) => markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "").trim() || null;
