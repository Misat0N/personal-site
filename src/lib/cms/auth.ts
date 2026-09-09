import type { APIContext } from "astro";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "cloudflare:workers";
import { HttpError } from "./http";

export type AdminIdentity = { email: string; source: "access" | "local-token" };

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function requireAdmin(context: APIContext): Promise<AdminIdentity> {
  const hostname = new URL(context.request.url).hostname;
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  const localSecret = env.LOCAL_ADMIN_TOKEN;
  if (isLocalhost && localSecret) {
    const token = context.request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
      ?? context.cookies.get("local_admin_token")?.value;
    if (token && timingSafeEqual(token, localSecret)) {
      return { email: "local-admin", source: "local-token" };
    }
  }

  const teamDomain = env.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const audience = env.ACCESS_AUD;
  const token = context.request.headers.get("Cf-Access-Jwt-Assertion");
  if (!teamDomain || !audience || !token) throw new HttpError(401, "Cloudflare Access authentication is required");

  let jwks = jwksCache.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, jwks);
  }
  const issuer = `https://${teamDomain}`;
  const { payload } = await jwtVerify(token, jwks, { issuer, audience });
  if (!env.ADMIN_EMAIL) throw new HttpError(503, "ADMIN_EMAIL is not configured");
  if (typeof payload.email !== "string" || !payload.email) {
    throw new HttpError(401, "Cloudflare Access identity has no email claim");
  }
  const email = payload.email;
  if (email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
    throw new HttpError(403, "This identity is not allowed to administer the site");
  }
  return { email, source: "access" };
}

function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  if (leftBytes.byteLength !== rightBytes.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < leftBytes.byteLength; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}
