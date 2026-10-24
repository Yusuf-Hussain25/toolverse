import { getAuth } from "@clerk/express";
import { ensureUser } from "../lib/users.js";
import { demoEmail } from "../config/env.js";

// Requires a valid Clerk session and loads the user's record and plan.
// The original used requireAuth(), which answers API calls with a redirect, and reset the
// free-usage counter in Clerk metadata on every request from a premium user.
const requireUser = async (req, res, next) => {
    try {
        const auth = getAuth(req);
        if (!auth.userId) return res.status(401).json({ error: "Please sign in to continue" });

        req.user = await ensureUser(auth.userId);
        req.plan = auth.has?.({ plan: "premium" }) ? "premium" : "free";
        req.isDemo = Boolean(demoEmail()) && req.user.email === demoEmail();
        next();
    } catch (error) {
        next(error);
    }
};

export default requireUser;
