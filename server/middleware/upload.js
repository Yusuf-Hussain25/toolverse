import multer from "multer";

export const MAX_IMAGE_MB = Number(process.env.MAX_UPLOAD_MB || 10);
// Uploads go through the API; keep them under the 4.5 MB request limit of serverless hosts
export const MAX_RESUME_MB = Number(process.env.MAX_RESUME_MB || 4);

const reject = (message) => {
    const err = new Error(message);
    err.status = 400;
    return err;
};

// Kept in memory: the original wrote temp files to disk and never deleted them.
export const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) =>
        /^image\/(jpeg|png|webp|avif)$/.test(file.mimetype) ? cb(null, true) : cb(reject("Upload a JPG, PNG, WebP or AVIF image")),
});

// The size limit is enforced while uploading; the original checked it after saving the whole file.
export const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RESUME_MB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => (file.mimetype === "application/pdf" ? cb(null, true) : cb(reject("Upload your resume as a PDF"))),
});
