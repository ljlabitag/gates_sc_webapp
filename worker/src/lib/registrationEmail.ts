// Builds the registration confirmation email. Pure (no env, no I/O) so it can
// be rendered and inspected without sending anything.
//
// Event facts mirror client/src/data/conference.ts — the packages don't share
// code, so update both if the date, time or venue change. The time and venue
// are deliberately worded as provisional: the site itself still calls the
// programme provisional and the venue "to be announced".

const EVENT = {
  name: "2nd GATES Program Stakeholder Conference",
  date: "Tuesday, November 10, 2026",
  time: "8:00 AM – 4:00 PM (tentative)",
  venue: "Metro Manila — exact venue to be announced",
  contact: "dostgates@dost.gov.ph",
  secretariat: "GATES Program Secretariat",
};

export interface RegistrationEmailInput {
  /** Origin the email's images are served from, e.g. https://example.workers.dev */
  siteUrl: string;
  id: string;
  /** Full display name, e.g. "Ana D. Reyes". */
  name: string;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

// The name (and anything else a registrant typed) lands in HTML, so it must be
// escaped — otherwise a registrant could inject markup or links into an email
// that arrives from the official GATES sender.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  // Table layout with inline styles throughout: many email clients strip <style>
  // blocks and ignore modern CSS, so the one <style> rule (a shorter footer on
  // phones, where the header image scales down) is a progressive enhancement.
  // Width is capped at 600px, the usual safe size.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Registration confirmed — ${escapeHtml(EVENT.name)}</title>
<style>@media only screen and (max-width:620px){.ft{height:80px !important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#f1f3f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f3f7;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;">
<tr><td style="padding:0;line-height:0;font-size:0;">
<img src="${bannerUrl}" width="600" alt="DOST GATES Program" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
</td></tr>
<tr><td style="padding:32px 32px 36px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#222222;">
<h1 style="margin:0 0 24px 0;font-size:24px;line-height:1.3;font-weight:bold;color:#1a1aea;">Congratulations, you have successfully registered!</h1>
<p style="margin:0 0 16px 0;">Dear <em>${safeName}</em>,</p>
<p style="margin:0 0 16px 0;">Thank you for registering for the <strong>${escapeHtml(EVENT.name)}</strong>. We&rsquo;re excited for you to join us.</p>
<p style="margin:0 0 8px 0;">Here are the event details:</p>
<ul style="margin:0 0 20px 0;padding:0 0 0 22px;">${detailItems}</ul>
<p style="margin:0 0 16px 0;">Below is your personal QR code. It is unique to you &mdash; please keep this email and have the QR code ready on your phone, or print it, as it will be scanned for check-in at the event.</p>
<p style="margin:0 0 20px 0;text-align:center;">
<img src="${qrUrl}" width="220" height="220" alt="Your registration QR code" style="display:inline-block;width:220px;height:220px;border:0;">
</p>
<p style="margin:0 0 24px 0;font-size:12px;color:#666666;text-align:center;">Reference ID: ${escapeHtml(id)}</p>
<p style="margin:0 0 16px 0;">Venue and travel details will be sent to this email address as soon as they are confirmed. In the meantime, you can find the programme and the latest updates on the conference website.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 24px auto;">
<tr><td align="center" bgcolor="#1a1aea" style="background-color:#1a1aea;border-radius:6px;">
<a href="${conferenceUrl}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">View conference details</a>
</td></tr>
</table>
<p style="margin:0 0 24px 0;">For questions, contact the secretariat at <a href="mailto:${EVENT.contact}" style="color:#1a1aea;">${EVENT.contact}</a>.</p>
<p style="margin:0;">Regards,<br>${escapeHtml(EVENT.secretariat)}</p>
</td></tr>
<tr><td class="ft" align="center" valign="middle" height="106" bgcolor="#000000" background="${footerUrl}" style="height:106px;padding:0 24px;background-color:#000000;background-image:url('${footerUrl}');background-size:cover;background-position:center;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0;font-size:11px;line-height:16px;color:#b4b7d1;text-shadow:0 1px 2px #000000;">Your information is handled under the Data Privacy Act of 2012 (RA 10173).<br><a href="${privacyUrl}" style="color:#d3d6ee;text-decoration:underline;">Privacy Notice</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

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
      "In the meantime, you can find the programme and the latest updates on the conference website:",
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
