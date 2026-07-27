import nodemailer from "nodemailer";

interface MailInput {
  to: string;
  subject: string;
  text: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

// Stubbed: logs to console until SMTP_HOST is configured in .env — no code change needed to go live.
export async function sendMail({ to, subject, text }: MailInput): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer:stub] would send email to=${to} subject="${subject}"\n${text}`);
    return;
  }
  await t.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}

export function sendRegistrationConfirmation(to: string, name: string): Promise<void> {
  return sendMail({
    to,
    subject: "You're registered for the GATES Stakeholder Conference",
    text: `Hi ${name},\n\nYou're registered for the GATES Stakeholder Conference on Oct 16, 2026. We'll follow up with venue and schedule details as they're confirmed.\n\n— GATES Program`,
  });
}

// Sent to the team leader, who is the official point of contact per Section 4 of the mechanics.
export function sendHackathonConfirmation(to: string, team: string, title: string): Promise<void> {
  return sendMail({
    to,
    subject: "Your GATES Hackathon 2026 proposal was received",
    text: [
      `Hi team ${team},`,
      "",
      `We've received your proposal "${title}" for GATES Hackathon 2026.`,
      "",
      "What happens next:",
      "  • Screening by subject matter experts and organizers runs August 19-24.",
      "  • Up to 6 finalist teams and 2 reserve teams are announced on August 25.",
      "  • Finalists confirm participation, including agency endorsement, by September 1.",
      "",
      "Make sure your agency or office endorsement is in progress — finalists need it to confirm.",
      "",
      "— GATES Program",
    ].join("\n"),
  });
}
