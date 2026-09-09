import { env } from "cloudflare:workers";

export function getCmsDb(): D1Database | undefined {
  return env.CMS_DB;
}

export function hasCmsDb(): boolean {
  return Boolean(getCmsDb());
}
