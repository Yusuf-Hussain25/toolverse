import express from "express";
import requireUser from "../middleware/auth.js";
import { imageUpload, resumeUpload } from "../middleware/upload.js";
import * as tools from "../controllers/toolsController.js";
import { deleteCreation, getCreation, listCreations, updateCreation } from "../controllers/creationsController.js";
import { listCommunity, toggleLike } from "../controllers/communityController.js";
import { getMe } from "../controllers/meController.js";

const api = express.Router();

// Every route needs a signed-in user; auth runs before multer so anonymous uploads aren't read
api.use(requireUser);

api.get("/me", getMe);

api.post("/tools/article", tools.article);
api.post("/tools/blog-titles", tools.titles);
api.post("/tools/image", tools.image);
api.post("/tools/remove-background", imageUpload.single("image"), tools.background);
api.post("/tools/remove-object", imageUpload.single("image"), tools.object);
api.post("/tools/resume-review", resumeUpload.single("resume"), tools.resume);

api.get("/creations", listCreations);
api.get("/creations/:id", getCreation);
api.patch("/creations/:id", updateCreation);
api.delete("/creations/:id", deleteCreation);

api.get("/community", listCommunity);
api.post("/community/:id/like", toggleLike);

export default api;
