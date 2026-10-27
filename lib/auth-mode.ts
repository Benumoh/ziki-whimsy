import { cleanEnv } from "@/lib/env-clean";

/** Shown when a password-based action is called while password auth is off. */
export const PASSWORD_AUTH_DISABLED_MESSAGE =
  "Password sign-in is disabled. Continue with Google instead.";

type AuthModeEnv = {
  AUTH_PASSWORD_LOGIN?: string;
  NODE_ENV?: string;
};

/**
 * Whether email/password sign-in (and the forgot/reset password flow) is on.
 *
 * Zedu Bugs is Google-only in production. Password auth exists for local
 * development and the demo seed, so:
 * - `AUTH_PASSWORD_LOGIN=true`  → on (explicit opt-in, any environment)
 * - `AUTH_PASSWORD_LOGIN=false` → off
 * - unset → on outside production, off in production
 *
 * Edge-safe (no Prisma / bcrypt) so middleware can import it.
 */
export function isPasswordAuthEnabled(
  env: AuthModeEnv = process.env as AuthModeEnv,
): boolean {
  const flag = cleanEnv(env.AUTH_PASSWORD_LOGIN)?.toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return env.NODE_ENV !== "production";
}

/**
 * The account a public demo deploy signs every visitor into, from
 * `DEMO_AUTO_SIGNIN_EMAIL`; unset everywhere else, which keeps the login.
 */
export function demoAutoSignInEmail(
  env: { DEMO_AUTO_SIGNIN_EMAIL?: string } = process.env as { DEMO_AUTO_SIGNIN_EMAIL?: string },
): string | null {
  return cleanEnv(env.DEMO_AUTO_SIGNIN_EMAIL)?.toLowerCase() || null;
}
