import sharp from "sharp";
import { PDFParse } from "pdf-parse";


const TEXT_EXTENSIONS = new Set([
    ".txt", ".md", ".mdx", ".js", ".jsx", ".ts", ".tsx", ".json", ".py", ".java",
    ".go", ".rb", ".css", ".scss", ".html", ".yml", ".yaml", ".sql", ".c", ".h",
    ".cpp", ".cc", ".cxx", ".hpp", ".rs", ".php", ".cs", ".sh", ".csv", ".log",
]);

const MAX_TEXT_CHARS = 20000;
const MAX_IMAGE_DIMENSION = 1600; // downscale anything larger than this on the long edge

function getExtension(filename) {
    const dot = filename.lastIndexOf(".");
    return dot > -1 ? filename.slice(dot).toLowerCase() : "";
}

async function processImage(file) {
    try {
        const resized = await sharp(file.buffer)
            .resize({
                width: MAX_IMAGE_DIMENSION,
                height: MAX_IMAGE_DIMENSION,
                fit: "inside",
                withoutEnlargement: true,
            })
            .jpeg({ quality: 82 })
            .toBuffer();

        return {
            name: file.originalname,
            mimetype: "image/jpeg",
            size: resized.length,
            kind: "image",
            previewUrl: `data:image/jpeg;base64,${resized.toString("base64")}`,
        };
    } catch (error) {
        console.error("Image processing failed, falling back to original:", error.message);
        return {
            name: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            kind: "image",
            previewUrl: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        };
    }
}

async function processPdf(file) {
    let parser;
    try {
        parser = new PDFParse({ data: file.buffer });
        const result = await parser.getText();
        const text = result.text || "";
        const truncated = text.length > MAX_TEXT_CHARS;
        return {
            name: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            kind: "text",
            content: truncated ? text.slice(0, MAX_TEXT_CHARS) : text,
            truncated,
        };
    } catch (error) {
        console.error("PDF parsing failed:", error.message);
        return {
            name: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            kind: "unsupported",
        };
    } finally {
        if (parser) await parser.destroy();
    }
}

export async function uploadAttachments(req, res) {
    try {
        const files = req.files || [];
        if (files.length === 0) {
            return res.status(400).json({ error: "No files were uploaded" });
        }

        const attachments = await Promise.all(
            files.map(async (file) => {
                const ext = getExtension(file.originalname);
                const isImage = file.mimetype.startsWith("image/");
                const isPdf = file.mimetype === "application/pdf" || ext === ".pdf";

                if (isImage) return processImage(file);
                if (isPdf) return processPdf(file);

                if (TEXT_EXTENSIONS.has(ext)) {
                    const text = file.buffer.toString("utf-8");
                    const truncated = text.length > MAX_TEXT_CHARS;
                    return {
                        name: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        kind: "text",
                        content: truncated ? text.slice(0, MAX_TEXT_CHARS) : text,
                        truncated,
                    };
                }

                return {
                    name: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    kind: "unsupported",
                };
            })
        );

        res.status(200).json({ attachments });
    } catch (error) {
        console.error("Error processing attachments:", error);
        res.status(500).json({ error: "Failed to process attachments" });
    }
}