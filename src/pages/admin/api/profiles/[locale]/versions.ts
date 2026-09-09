import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/cms/auth";
import { errorJson, HttpError, json } from "../../../../../lib/cms/http";
import { listVersions } from "../../../../../lib/cms/repository";
import { getCmsDb } from "../../../../../lib/cms/runtime";
import { localeSchema } from "../../../../../lib/cms/schema";

export const prerender = false;
export const GET: APIRoute = async (context) => {
  try {
    await requireAdmin(context);
    const locale = localeSchema.parse(context.params.locale);
    const db = getCmsDb();
    if (!db) throw new HttpError(503, "CMS_DB binding is not configured");
    const versions = await listVersions(db, locale);
    return json({ versions: versions.map(({ content: _content, ...version }) => version) });
  } catch (error) {
    return errorJson(error, error instanceof HttpError ? error.status : 500);
  }
};
