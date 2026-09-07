import type { Context, Next } from "hono";
import { getSignedCookie } from "hono/cookie";
import type { AppEnv } from "../index";

export const SESSION_COOKIE = "gates_admin_session";

// Fails closed by construction: getSignedCookie returns undefined (no
// cookie) or false (signature invalid/tampered) for anything that isn't a
// genuinely valid session, and both are rejected below. There's no branch
// that can be tricked into treating "unset" as "authenticated" the way the
// old Express middleware's `process.env.ADMIN_USER || ""` default could.
export async function adminAuth(c: Context<AppEnv>, next: Next) {
  const session = await getSignedCookie(c, c.env.SESSION_SECRET, SESSION_COOKIE);
  if (!session) {
    return c.json({ error: "Authentication required." }, 401);
  }
  c.set("actor", session);
  await next();
}
