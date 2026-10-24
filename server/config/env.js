// Fails fast with a readable message when server/.env is missing required values.
const REQUIRED = {
    DATABASE_URL: "Postgres connection string: Neon -> your project -> Connect",
    CLERK_PUBLISHABLE_KEY: "Clerk -> Configure -> API keys -> Publishable key",
    CLERK_SECRET_KEY: "Clerk -> Configure -> API keys -> Secret key",
};

export const checkEnv = () => {
    const missing = Object.keys(REQUIRED).filter((key) => !process.env[key]?.trim() || process.env[key].includes("---"));
    if (!missing.length) return;
    console.error("\nToolverse API can't start. Add these to server/.env (see server/.env.example):\n");
    for (const key of missing) console.error(`  ${key.padEnd(24)} ${REQUIRED[key]}`);
    console.error("");
    process.exit(1);
};

export const origins = () =>
    (process.env.ORIGINS || "http://localhost:5173").split(",").map((o) => o.trim()).filter(Boolean);

export const demoEmail = () => process.env.DEMO_EMAIL?.trim().toLowerCase() || null;
