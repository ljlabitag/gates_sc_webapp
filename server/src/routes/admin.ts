import path from "node:path";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { toCsv } from "../lib/csv";
import { UPLOADS_DIR } from "../lib/upload";
import { adminAuth } from "../middleware/adminAuth";

export const adminRouter = Router();

adminRouter.use(adminAuth);

adminRouter.get("/registrations", async (_req, res) => {
  const registrations = await prisma.registration.findMany({ orderBy: { createdAt: "desc" } });
  res.json(registrations);
});

adminRouter.get("/registrations/export", async (_req, res) => {
  const registrations = await prisma.registration.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(registrations, ["id", "name", "email", "organization", "needs", "createdAt"]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="gates-registrations.csv"');
  res.send(csv);
});

adminRouter.get("/hackathon-submissions", async (_req, res) => {
  const submissions = await prisma.hackathonSubmission.findMany({ orderBy: { createdAt: "desc" } });
  res.json(submissions);
});

adminRouter.get("/hackathon-submissions/export", async (_req, res) => {
  const submissions = await prisma.hackathonSubmission.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(submissions, [
    "id",
    "team",
    "title",
    "domain",
    "agency",
    "leaderName",
    "leaderPosition",
    "leaderEmail",
    "leaderMobile",
    "members",
    "endorsingHead",
    "fileName",
    "fileSize",
    "mimeType",
    "createdAt",
  ]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="gates-hackathon-submissions.csv"');
  res.send(csv);
});

adminRouter.get("/hackathon-submissions/:id/file", async (req, res) => {
  const submission = await prisma.hackathonSubmission.findUnique({ where: { id: req.params.id } });
  if (!submission?.filePath) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  res.download(path.join(UPLOADS_DIR, submission.filePath), submission.fileName ?? submission.filePath);
});
