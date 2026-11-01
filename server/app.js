// The Express app, shared by the local server (server.js) and the Vercel function (api/index.js)
import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { checkEnv, origins } from "./config/env.js";
import api from "./routes/api.js";
import demoRouter from "./routes/demoRoutes.js";
import webhookRouter from "./routes/webhookRoutes.js";
import { serveFile } from "./controllers/creationsController.js";
import { toolsInfo } from "./controllers/meController.js";
import { MAX_IMAGE_MB, MAX_RESUME_MB } from "./middleware/upload.js";

checkEnv();

const app = express();
app.set("trust proxy", 1);

app.use(cors({ origin: origins(), credentials: true }));
app.use("/api/webhooks", webhookRouter); // needs the raw body, so it comes before express.json
app.use(express.json({ limit: "100kb" }));
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("Toolverse API"));
app.get("/api/health", (req, res) => res.json({ ok: true, tools: toolsInfo() }));
app.get("/api/files/:id", serveFile);
app.use("/api/demo", demoRouter);
app.use("/api", api);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Expected errors carry a status and a message meant for people; anything else is logged
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    const status = tooBig ? 413 : err.status || 500;
    const limit = req.path.includes("resume") ? MAX_RESUME_MB : MAX_IMAGE_MB;
    const message = tooBig ? `That file is over ${limit} MB` : err.status ? err.message : "Something went wrong on our side";
    if (status >= 500) console.error(err);
    res.status(status).json({ error: message, ...(err.status && err.code && { code: err.code }) });
});

export default app;
