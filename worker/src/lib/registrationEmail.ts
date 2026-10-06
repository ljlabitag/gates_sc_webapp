// Builds the registration confirmation email. Pure (no env, no I/O) so it can
// be rendered and inspected without sending anything. The banner/footer shell
// and event facts are shared with the other attendee emails (emailLayout.ts).

import { EVENT, buttonHtml, escapeHtml, normalizeSiteUrl, renderEmailShell, type BuiltEmail } from "./emailLayout";

export type { BuiltEmail };

export interface RegistrationEmailInput {
  /** Origin the email's images are served from, e.g. https://example.workers.dev */
  siteUrl: string;
  id: string;
  /** Full display name, e.g. "Ana D. Reyes". */
  name: string;
}

export function buildRegistrationConfirmation({ siteUrl, id, name }: RegistrationEmailInput): BuiltEmail {
  const base = siteUrl.replace(/\/+$/, "");
  const bannerUrl = `${base}/email/banner.png`;
  const footerUrl = `${base}/email/footer.png`;
  const conferenceUrl = `${base}/conference`;
  const privacyUrl = `${base}/privacy`;
  const qrUrl = `${base}/api/registrations/${encodeURIComponent(id)}/qr.png`;
  const safeName = escapeHtml(name);

  const detailRows: [string, string][] = [
    ["Event", EVENT.name],
    ["Date", EVENT.date],
    ["Time", EVENT.time],
    ["Venue", EVENT.venue],
  ];

  const detailItems = detailRows
    .map(
      ([label, value]) =>
        `<li style="margin:0 0 6px 0;"><strong>${label}:</strong> ${escapeHtml(value)}</li>`,
    )
    .join("");

  const contentHtml = `<h1 style="margin:0 0 24px 0;font-size:24px;line-height:1.3;font-weight:bold;color:#1a1aea;">Congratulations, you have successfully registered!</h1>
<p style="margin:0 0 16px 0;">Dear <em>${safeName}</em>,</p>
<p style="margin:0 0 16px 0;">Thank you for registering for the <strong>${escapeHtml(EVENT.name)}</strong>. We&rsquo;re excited for you to join us.</p>
<p style="margin:0 0 8px 0;">Here are the event details:</p>
<ul style="margin:0 0 20px 0;padding:0 0 0 22px;">${detailItems}</ul>
<p style="margin:0 0 16px 0;">Below is your personal QR code. It is unique to you &mdash; please keep this email and have the QR code ready on your phone, or print it, as it will be scanned for check-in at the event.</p>
<p style="margin:0 0 20px 0;text-align:center;">
<img src="${qrUrl}" width="220" height="220" alt="Your registration QR code" style="display:inline-block;width:220px;height:220px;border:0;">
</p>
<p style="margin:0 0 24px 0;font-size:12px;color:#666666;text-align:center;">Reference ID: ${escapeHtml(id)}</p>
<p style="margin:0 0 16px 0;">Venue and travel details will be sent to this email address as soon as they are confirmed. In the meantime, you can find more details about the conference and the latest updates on the conference website.</p>
${buttonHtml(conferenceUrl, "View conference details")}
<p style="margin:0 0 24px 0;">For questions, contact the secretariat at <a href="mailto:${EVENT.contact}" style="color:#1a1aea;">${EVENT.contact}</a>.</p>
<p style="margin:0;">Regards,<br>${escapeHtml(EVENT.secretariat)}</p>`;

  const html = renderEmailShell({
    siteUrl,
    title: `Registration confirmed — ${escapeHtml(EVENT.name)}`,
    contentHtml,
  });

  // Plain-text alternative for clients that don't render HTML. The QR image
  // can't appear here, so the Reference ID is the fallback identifier.
  const text = [
    "Congratulations, you have successfully registered!",
    "",
    `Dear ${name},`,
    "",
    `Thank you for registering for the ${EVENT.name}. We're excited for you to join us.`,
    "",
    "Here are the event details:",
    ...detailRows.map(([label, value]) => `  - ${label}: ${value}`),
    "",
    "Your personal QR code for check-in is shown in the HTML version of this email. " +
      "If you can't see it, you can view it here:",
    qrUrl,
    "",
    `Reference ID: ${id}`,
    "",
    "Venue and travel details will be sent to this email address as soon as they are confirmed. " +
      "In the meantime, you can find more details about the conference and the latest updates on the conference website:",
    conferenceUrl,
    "",
    `For questions, contact the secretariat at ${EVENT.contact}.`,
    "",
    "Regards,",
    EVENT.secretariat,
    "",
    `Your information is handled under the Data Privacy Act of 2012 (RA 10173). Privacy Notice: ${privacyUrl}`,
  ].join("\n");

  return {
    subject: `You're registered: ${EVENT.name}`,
    html,
    text,
  };
}
