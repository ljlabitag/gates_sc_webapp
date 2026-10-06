// The "virtual kit" email sent to an attendee when their QR code is scanned
// at the venue. Same look as the registration confirmation (shared shell in
// emailLayout.ts); the content is generic until the real materials and
// feedback forms exist — links come from data/virtualKit.ts.

import { VIRTUAL_KIT, type KitLink, type VirtualKitContent } from "../data/virtualKit";
import { EVENT, buttonHtml, escapeHtml, normalizeSiteUrl, renderEmailShell, type BuiltEmail } from "./emailLayout";

export interface VirtualKitEmailInput {
  /** Origin the email's images and links point at. */
  siteUrl: string;
  /** Full display name, e.g. "Ana D. Reyes". */
  name: string;
  /** Overridable for previews and tests; defaults to the real kit. */
  kit?: VirtualKitContent;
}

// Links come from our own config, but a typo shouldn't be able to put a
// javascript: or http: URL into an email from the official sender.
const usable = (links: KitLink[]) => links.filter((l) => /^https:\/\//i.test(l.url));

function linkListHtml(links: KitLink[]): string {
  const items = links
    .map(
      (l) =>
        `<li style="margin:0 0 8px 0;"><a href="${escapeHtml(l.url)}" style="color:#1a1aea;font-weight:bold;">${escapeHtml(l.label)}</a>${
          l.description ? ` &mdash; ${escapeHtml(l.description)}` : ""
        }</li>`,
    )
    .join("");
  return `<ul style="margin:0 0 20px 0;padding:0 0 0 22px;">${items}</ul>`;
}

const linkListText = (links: KitLink[]) =>
  links.map((l) => `  - ${l.label}: ${l.url}${l.description ? ` (${l.description})` : ""}`);

export function buildVirtualKitEmail({ siteUrl, name, kit = VIRTUAL_KIT }: VirtualKitEmailInput): BuiltEmail {
  const base = normalizeSiteUrl(siteUrl);
  const conferenceUrl = `${base}/conference`;
  const materials = usable(kit.materials);
  const feedback = usable(kit.feedback);
  const hasLinks = materials.length > 0 || feedback.length > 0;

  const kitHtml = [
    materials.length > 0
      ? `<h2 style="margin:0 0 8px 0;font-size:18px;line-height:1.3;color:#1a1aea;">Conference materials</h2>\n${linkListHtml(materials)}`
      : "",
    feedback.length > 0
      ? `<h2 style="margin:0 0 8px 0;font-size:18px;line-height:1.3;color:#1a1aea;">Share your feedback</h2>\n<p style="margin:0 0 8px 0;">Your feedback helps us shape the next phase of the GATES Program.</p>\n${linkListHtml(feedback)}`
      : "",
    hasLinks
      ? ""
      : `<p style="margin:0 0 20px 0;">We&rsquo;ll send the links to this email address as soon as they are available.</p>`,
  ]
    .filter(Boolean)
    .join("\n");

  const contentHtml = `<h1 style="margin:0 0 24px 0;font-size:24px;line-height:1.3;font-weight:bold;color:#1a1aea;">Welcome &mdash; you&rsquo;re checked in!</h1>
<p style="margin:0 0 16px 0;">Dear <em>${escapeHtml(name)}</em>,</p>
<p style="margin:0 0 16px 0;">Thank you for joining us at the <strong>${escapeHtml(EVENT.name)}</strong>. Your arrival has been recorded, and we&rsquo;re glad you&rsquo;re here.</p>
<p style="margin:0 0 20px 0;">Your virtual kit is how we share the conference materials and the feedback form with you &mdash; by email, so they stay with you after the event.</p>
${kitHtml}
${buttonHtml(conferenceUrl, "View conference details")}
<p style="margin:0 0 24px 0;">For questions, contact the secretariat at <a href="mailto:${EVENT.contact}" style="color:#1a1aea;">${EVENT.contact}</a>.</p>
<p style="margin:0;">Regards,<br>${escapeHtml(EVENT.secretariat)}</p>`;

  const html = renderEmailShell({
    siteUrl,
    title: `Your virtual kit — ${escapeHtml(EVENT.name)}`,
    contentHtml,
  });

  const text = [
    "Welcome — you're checked in!",
    "",
    `Dear ${name},`,
    "",
    `Thank you for joining us at the ${EVENT.name}. Your arrival has been recorded, and we're glad you're here.`,
    "",
    "Your virtual kit is how we share the conference materials and the feedback form with you — by email, so they stay with you after the event.",
    "",
    ...(materials.length > 0 ? ["Conference materials:", ...linkListText(materials), ""] : []),
    ...(feedback.length > 0
      ? ["Share your feedback (it helps us shape the next phase of the GATES Program):", ...linkListText(feedback), ""]
      : []),
    ...(hasLinks
      ? []
      : ["We'll send the links to this email address as soon as they are available.", ""]),
    "Conference details:",
    conferenceUrl,
    "",
    `For questions, contact the secretariat at ${EVENT.contact}.`,
    "",
    "Regards,",
    EVENT.secretariat,
    "",
    `Your information is handled under the Data Privacy Act of 2012 (RA 10173). Privacy Notice: ${base}/privacy`,
  ].join("\n");

  return {
    subject: `Welcome to the ${EVENT.name} — your virtual kit`,
    html,
    text,
  };
}
