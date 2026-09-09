import type { APIRoute } from "astro";
import { localeSchema } from "../../../lib/cms/schema";
import { getCmsDb } from "../../../lib/cms/runtime";
import { getPublished } from "../../../lib/cms/repository";
import { staticFallback } from "../../../lib/cms/fallback";
import { json } from "../../../lib/cms/http";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const locale = localeSchema.safeParse(params.locale);
  if (!locale.success) return json({ error: "unsupported_locale" }, 404);

  const db = getCmsDb();
  if (db) {
    try {
      const published = await getPublished(db, locale.data);
      if (published) {
        return json(
          { content: published.content, revision: published.revision, source: "d1" },
          200,
          { "cache-control": "public, max-age=60, stale-while-revalidate=300", etag: `"${published.hash}"` },
        );
      }
    } catch (error) {
      console.error("CMS published content lookup failed", error);
    }
  }

  return json(
    { content: staticFallback(locale.data), revision: 0, source: "static" },
    200,
    { "cache-control": "public, max-age=60, stale-while-revalidate=300" },
  );
};
