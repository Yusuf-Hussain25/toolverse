// Local and long-running hosts: check the database, then listen. Vercel imports app.js directly.
import app from "./app.js";
import { checkDB } from "./config/db.js";
import { toolsInfo } from "./controllers/meController.js";

const PORT = process.env.PORT || 3000;

await checkDB();
app.listen(PORT, () => {
    const t = toolsInfo();
    console.log(`Toolverse API on http://localhost:${PORT} (text: ${t.text.name}, images: ${t.image.name}, background: ${t.background.name})`);
});
