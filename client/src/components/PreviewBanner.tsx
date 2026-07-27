import { IS_PREVIEW } from "../lib/preview";

/**
 * Sits above the nav on review deployments. Renders nothing in a normal build.
 *
 * The content on this site is still being signed off — the hackathon name is a
 * placeholder, the theme is unconfirmed and the venue is TBA — so a reviewer
 * needs to know they are not looking at a published page.
 */
export default function PreviewBanner() {
  if (!IS_PREVIEW) return null;

  return (
    <div
      role="status"
      className="relative z-[60] bg-gates-orange/12 border-b border-gates-orange/25 px-5 sm:px-8 py-2.5 text-center"
    >
      <p className="m-0 text-[12px] sm:text-[13px] leading-[1.5] text-orange-100/90">
        <span className="font-semibold">Preview build for internal review.</span> Content is not final and forms are
        turned off. Not for public distribution.
      </p>
    </div>
  );
}
