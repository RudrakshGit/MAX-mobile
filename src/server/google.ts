import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

// Verifies a Google ID token from the app's Google sign-in. Only Google's own keys are trusted in the app;
// the test harness can swap in its own key set to test the server without a real Google account.
const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

let jwks: JWTVerifyGetKey | null = null;
let override: JWTVerifyGetKey | null = null;

export function __useJwksForTests(k: JWTVerifyGetKey | null) {
  override = k;
}

export type GoogleUser = { sub: string; email: string; name?: string };

export async function verifyGoogleIdToken(idToken: string, audience: string): Promise<GoogleUser | null> {
  if (!idToken || idToken.length > 4096) return null;
  jwks ??= createRemoteJWKSet(new URL(GOOGLE_JWKS));
  try {
    const { payload } = await jwtVerify(idToken, override ?? jwks, { issuer: ISSUERS, audience, algorithms: ["RS256"], requiredClaims: ["sub", "exp"] });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!sub || !email || payload.email_verified !== true) return null;
    const name = typeof payload.name === "string" ? payload.name.slice(0, 80) : undefined;
    return { sub, email: email.slice(0, 120), ...(name ? { name } : {}) };
  } catch {
    return null;
  }
}
