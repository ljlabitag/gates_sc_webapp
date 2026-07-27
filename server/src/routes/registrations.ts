import { Router } from "express";
import { prisma } from "../lib/prisma";
import { sendRegistrationConfirmation } from "../lib/mailer";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const registrationsRouter = Router();

registrationsRouter.post("/", async (req, res) => {
  const { name, email, org, needs } = req.body ?? {};

  if (typeof name !== "string" || typeof email !== "string" || !name.trim() || !email.trim() || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: "Please enter your name and a valid email." });
    return;
  }

  const registration = await prisma.registration.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      organization: typeof org === "string" && org.trim() ? org.trim() : null,
      needs: typeof needs === "string" && needs.trim() ? needs.trim() : null,
    },
  });

  sendRegistrationConfirmation(registration.email, registration.name).catch((err) =>
    console.error("Failed to send registration confirmation email:", err),
  );

  res.status(201).json({ id: registration.id });
});
