import type { Env } from "../index";

export interface MailAttachment {
  name: string;
  content: ArrayBuffer;
}

interface MailInput {
  to: string;
  subject: string;
  text: string;
  attachment?: MailAttachment;
}

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

// Brevo caps attachments at 4MB per file / 20MB per email (confirmed against
// Brevo's own docs, not assumed) — see ATTACHMENT_MAX_BYTES below, used to
// decide whether to even attempt an attachment.

// Chunked to avoid blowing the call stack on `String.fromCharCode(...bytes)`
// for large files — spreading a big typed array as arguments can exceed the
// engine's argument-count limit.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Workers has no process.env — env only exists per-request (c.env), unlike
// the old Express code where the mailer read it as a module-level global. So
// unlike the brief's "keep signatures unchanged" for the nodemailer→Brevo
// swap itself, this one platform difference does thread `env` through the
// public functions below; every other call shape is untouched.
async function sendMail(env: Env, { to, subject, text, attachment }: MailInput): Promise<void> {
  const res = await fetch(BREVO_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM, name: "GATES Program" },
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(attachment
        ? { attachment: [{ name: attachment.name, content: arrayBufferToBase64(attachment.content) }] }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // "Alert on failure" per brief §7 — for now that's a console.error tagged
    // ALERT so it's visible in `wrangler tail` and the dashboard Logs tab.
    // Wire to a real alerting channel (e.g. a Logpush sink) once one exists;
    // a mail failure must never fail or delay the submission response, so
    // this only ever runs from the fire-and-forget call sites, never awaited
    // by the request handler.
    console.error(
      `[mailer] ALERT: Brevo send failed (${res.status}) to=${to} subject="${subject}": ${body}`,
    );
    throw new Error(`Brevo send failed: ${res.status}`);
  }

  const result = await res.json<{ messageId?: string }>().catch(() => ({ messageId: undefined }));
  console.log(`[mailer] sent to=${to} subject="${subject}" messageId=${result.messageId ?? "?"}`);
}

export interface HackathonConfirmationDetails {
  id: string;
  team: string;
  title: string;
  leaderName: string;
  domain: string | null;
}

// Sent to the team leader, who is the official point of contact per Section 4 of the mechanics.
// Structured like an ordinary email (salutation, context, a scannable summary
// block, next steps, a way to reach a human) rather than a bare notification —
// this is the one message every participant is guaranteed to read closely,
// since it's their only receipt that the submission went through.
export function sendHackathonConfirmation(
  env: Env,
  to: string,
  details: HackathonConfirmationDetails,
): Promise<void> {
  return sendMail(env, {
    to,
    subject: "Your GATES GeoHack 2026 proposal was received",
    text: [
      `Dear ${details.leaderName},`,
      "",
      "Thank you for submitting a proposal to GATES GeoHack 2026. This email confirms that " +
        "your submission has been received on behalf of your team.",
      "",
      "SUBMISSION SUMMARY",
      `  Team: ${details.team}`,
      `  Project Title: ${details.title}`,
      ...(details.domain ? [`  Priority Innovation Domain: ${details.domain}`] : []),
      `  Reference ID: ${details.id}`,
      "",
      "WHAT HAPPENS NEXT",
      "  • Screening by subject matter experts and organizers will take place from " +
        "September 16 to 21.",
      "  • Up to six finalist teams and two reserve teams will be announced on September 22.",
      "  • Finalists must confirm their participation, including agency endorsement, by " +
        "September 29.",
      "",
      "Please note: should your team be selected as a finalist, you will be required to " +
        "secure your agency or office head's endorsement to confirm participation. This is " +
        "not required at this stage; however, initial preparations may begin at your " +
        "convenience, as formal endorsement will only be necessary upon the announcement of " +
        "finalists.",
      "",
      "Should you have any questions or concerns, please contact the secretariat directly " +
        "at dostgates@dost.gov.ph.",
      "",
      "Sincerely,",
      "GATES Program Secretariat",
      "Department of Science and Technology",
    ].join("\n"),
  });
}

export interface SecretariatSubmissionMetadata {
  id: string;
  team: string;
  title: string;
  domain: string | null;
  agency: string | null;
  leaderName: string;
  leaderEmail: string;
  leaderMobile: string | null;
  members: string | null;
  endorsingHead: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: number;
}

// New per brief §7: the secretariat mailbox watches submissions arrive in real
// time without needing an admin login. Links to the admin record rather than
// a signed file URL, since a bearer link in a shared inbox would bypass
// access logging. The link is relative and won't resolve until the admin
// panel exists (order-of-work item 7); that's intentional, not a placeholder
// standing in for something else.
//
// `attachment` is the actual proposal file, included when it's small enough
// for Brevo's limits (see ATTACHMENT_MAX_BYTES in hackathonSubmissions.ts) —
// an email backup of the file itself, not just a pointer to R2/D1. When it's
// omitted (file too large, or fetching it from R2 failed), the notification
// still sends with metadata only, same as before this existed.
export function sendSecretariatNotification(
  env: Env,
  s: SecretariatSubmissionMetadata,
  attachment: MailAttachment | null,
): Promise<void> {
  const to = env.SECRETARIAT_EMAIL;
  if (!to) {
    console.log("[mailer] SECRETARIAT_EMAIL not set — skipping secretariat notification");
    return Promise.resolve();
  }
  return sendMail(env, {
    to,
    subject: `New hackathon submission: ${s.team}`,
    text: [
      `Submission ID: ${s.id}`,
      `Team: ${s.team}`,
      `Title: ${s.title}`,
      `Domain: ${s.domain ?? "—"}`,
      `Agency: ${s.agency ?? "—"}`,
      `Leader: ${s.leaderName} <${s.leaderEmail}>${s.leaderMobile ? ` · ${s.leaderMobile}` : ""}`,
      `Members: ${s.members ?? "—"}`,
      `Endorsing head: ${s.endorsingHead ?? "—"}`,
      `File: ${s.fileName ?? "—"}${s.fileSize ? ` (${s.fileSize} bytes)` : ""}`,
      attachment ? "  (attached to this email)" : "  (not attached — see the admin record below)",
      `Submitted: ${new Date(s.createdAt).toISOString()}`,
      "",
      `Admin record (relative — resolves once /admin exists): /admin/hackathon-submissions/${s.id}`,
    ].join("\n"),
    attachment: attachment ?? undefined,
  });
}
