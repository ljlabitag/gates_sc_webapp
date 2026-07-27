import { Router } from "express";
import { prisma } from "../lib/prisma";
import { proposalUpload } from "../lib/upload";
import { sendHackathonConfirmation } from "../lib/mailer";

export const hackathonRouter = Router();

/** The six GATES priority innovation domains, per Section 2 of the mechanics. */
const DOMAINS = [
  "Health, Nutrition, Education, and Social Services",
  "Disaster Risk Reduction and Management",
  "Environmental Monitoring",
  "Project and Knowledge Management",
  "Geospatial Infrastructure Development",
  "Natural Resources Assessment",
];

/** Trim a multipart text field, returning null when absent or blank. */
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;

hackathonRouter.post("/", (req, res) => {
  proposalUpload.single("proposal")(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Could not upload the proposal file." });
      return;
    }

    const body = req.body ?? {};
    const team = text(body.team);
    const title = text(body.title);
    const leaderName = text(body.leaderName);
    const leaderEmail = text(body.leaderEmail);
    const domain = text(body.domain);

    if (!team || !title) {
      res.status(400).json({ error: "Please enter a team name and project title." });
      return;
    }
    if (!leaderName || !leaderEmail) {
      res.status(400).json({ error: "Please enter the team leader's name and email address." });
      return;
    }
    if (!EMAIL_RE.test(leaderEmail)) {
      res.status(400).json({ error: "Please enter a valid team leader email address." });
      return;
    }
    if (domain && !DOMAINS.includes(domain)) {
      res.status(400).json({ error: "Please choose one of the six priority innovation domains." });
      return;
    }

    const file = req.file;
    const submission = await prisma.hackathonSubmission.create({
      data: {
        team,
        title,
        domain,
        leaderName,
        leaderPosition: text(body.leaderPosition),
        leaderEmail,
        leaderMobile: text(body.leaderMobile),
        agency: text(body.agency),
        members: text(body.members),
        endorsingHead: text(body.endorsingHead),
        fileName: file?.originalname ?? null,
        filePath: file?.filename ?? null,
        fileSize: file?.size ?? null,
        mimeType: file?.mimetype ?? null,
      },
    });

    sendHackathonConfirmation(leaderEmail, submission.team, submission.title).catch((mailErr) =>
      console.error("Failed to send hackathon confirmation email:", mailErr),
    );

    res.status(201).json({ id: submission.id });
  });
});
