import Anthropic from "@anthropic-ai/sdk";

// Claude via the official SDK. The client reads ANTHROPIC_API_KEY from the environment.
let client = null;
const getClient = () => (client ??= new Anthropic({ maxRetries: 2 }));

export const claudeConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);
export const claudeModel = () => process.env.CLAUDE_MODEL || "claude-opus-5-5";

/**
 * One request, one answer. Thinking is adaptive (always on for this model); `effort` sets how much
 * it thinks: "low" for quick lists, "medium" for articles, "high" for resume reviews.
 * A server-side fallback re-runs the request on Anthropic's recommended model if it's declined.
 * @returns {Promise<{ text: string, stopReason: string }>}
 */
export const claudeComplete = async ({ system, user, effort = "medium", maxTokens = 16000 }) => {
    const response = await getClient().beta.messages.create({
        model: claudeModel(),
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
        output_config: { effort },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
    });
    const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();
    return { text, stopReason: response.stop_reason };
};

// Maps SDK errors to messages people can act on (status codes from the typed error classes)
export const describeClaudeError = (err) => {
    if (err instanceof Anthropic.AuthenticationError) return { message: "The Anthropic API key in server/.env was rejected", status: 503 };
    if (err instanceof Anthropic.RateLimitError) return { message: "Claude is busy right now. Try again in a minute.", status: 503 };
    if (err instanceof Anthropic.BadRequestError) return { message: `Claude couldn't run this request: ${err.message}`, status: 502 };
    if (err instanceof Anthropic.APIConnectionError) return { message: "Couldn't reach Claude. Check your connection.", status: 504 };
    if (err instanceof Anthropic.APIError) return { message: `Claude: ${err.message}`, status: 502 };
    return null;
};
