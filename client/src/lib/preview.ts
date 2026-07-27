/**
 * Preview-build flag.
 *
 * Review deployments are a static build of the client with no API behind them,
 * so the registration and hackathon forms have nothing to POST to. Rather than
 * let reviewers hit a network error and assume the forms are broken, set
 * `VITE_PREVIEW=true` at build time: a banner explains the situation and the
 * submit handlers stop early with a clear message.
 *
 * Leave it unset for any deployment that has the Express API behind it.
 */
export const IS_PREVIEW = import.meta.env.VITE_PREVIEW === "true";

export const PREVIEW_FORM_MESSAGE =
  "This is a preview build for review — form submissions are turned off, so nothing was sent or stored.";
