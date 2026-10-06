// The look shared by every email we send to attendees: the DOST/GATES banner
// on top, a content area, and the privacy-notice footer over the net-grid
// artwork. Keeping it in one place is what makes the confirmation email and
// the virtual-kit email read as one family, and means a restyle is one edit.
//
// Pure (no env, no I/O), so emails can be rendered and inspected without
// sending anything.
//
// Event facts mirror client/src/data/conference.ts — the packages don't share
// code, so update both if the date, time or venue change. The time and venue
// are deliberately worded as provisional: the site itself still calls the
// agenda provisional and the venue "to be announced".

export const EVENT = {
  name: "2nd GATES Program Stakeholder Conference",
  date: "Tuesday, November 10, 2026",
  time: "8:00 AM – 4:00 PM (tentative)",
  venue: "Metro Manila — exact venue to be announced",
  contact: "dostgates@dost.gov.ph",
  secretariat: "GATES Program Secretariat",
};

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

// The name (and anything else a registrant typed) lands in HTML, so it must be
// escaped — otherwise a registrant could inject markup or links into an email
// that arrives from the official GATES sender.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Origin without a trailing slash; emails can't use relative URLs. */
export function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

/** A "bulletproof" call-to-action button (works without CSS support). */
export function buttonHtml(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 24px auto;">
<tr><td align="center" bgcolor="#1a1aea" style="background-color:#1a1aea;border-radius:6px;">
<a href="${href}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">${label}</a>
</td></tr>
</table>`;
}

/**
 * Wraps `contentHtml` (the inside of the white content cell) in the shared
 * banner + footer shell.
 *
 * Table layout with inline styles throughout: many email clients strip <style>
 * blocks and ignore modern CSS, so the one <style> rule (a shorter footer on
 * phones, where the header image scales down) is a progressive enhancement.
 * Width is capped at 600px, the usual safe size.
 */
export function renderEmailShell({
  siteUrl,
  title,
  contentHtml,
}: {
  siteUrl: string;
  title: string;
  contentHtml: string;
}): string {
  const base = normalizeSiteUrl(siteUrl);
  const bannerUrl = `${base}/email/banner.png`;
  const footerUrl = `${base}/email/footer.png`;
  const privacyUrl = `${base}/privacy`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
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
${contentHtml}
</td></tr>
<tr><td class="ft" align="center" valign="middle" height="106" bgcolor="#000000" background="${footerUrl}" style="height:106px;padding:0 24px;background-color:#000000;background-image:url('${footerUrl}');background-size:cover;background-position:center;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0;font-size:11px;line-height:16px;color:#b4b7d1;text-shadow:0 1px 2px #000000;">Your information is handled under the Data Privacy Act of 2012 (RA 10173).<br><a href="${privacyUrl}" style="color:#d3d6ee;text-decoration:underline;">Privacy Notice</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
