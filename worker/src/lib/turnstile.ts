import type { Env } from "../index";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Is the bot check switched on for this deployment? */
export function turnstileEnabled(env: Env): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY);
}

// Cloudflare Turnstile (free) bot check on the public registration form.
// Off until TURNSTILE_SECRET_KEY is set — which lets local development and
// not-yet-configured environments work — so production must have both the
// secret and TURNSTILE_SITE_KEY set for the protection to exist at all.
//
// Fails closed once enabled: if Cloudflare can't be reached, the check counts
// as failed, since the alternative is silently waving every bot through
// whenever verification hiccups.
export async function verifyTurnstile(env: Env, token: string, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  try {
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET_KEY);
    form.append("response", token);
    if (ip !== "unknown") form.append("remoteip", ip);
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    if (!res.ok) return false;
    const result = await res.json<{ success?: boolean }>();
    return result.success === true;
  } catch (err) {
    console.error("Turnstile verification request failed:", err);
    return false;
  }
}
