import multer from "multer";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB per file
const MAX_FILES = 5;

export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});