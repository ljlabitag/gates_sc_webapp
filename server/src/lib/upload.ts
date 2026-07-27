import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

export const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "hackathon");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const proposalUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error("Only .pdf, .doc, or .docx files are accepted."));
      return;
    }
    cb(null, true);
  },
});
