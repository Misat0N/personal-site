import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/cms/auth";
import { staticFallback } from "../../../../../lib/cms/fallback";
import { assertSameOrigin, errorJson, HttpError, json, readJsonBody } from "../../../../../lib/cms/http";
import { CmsConflictError, getDraft, saveDraft } from "../../../../../lib/cms/repository";
import { getCmsDb } from "../../../../../lib/cms/runtime";
import { localeSchema, saveDraftRequestSchema } from "../../../../../lib/cms/schema";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const identity = await requireAdmin(context);
    const locale = localeSchema.parse(context.params.locale);
    const db = getCmsDb();
    if (!db) return json({ content: staticFallback(locale), revision: 0, source: "static", identity });
    const draft = await getDraft(db, locale);
    return json({
      id: draft?.id ?? null,
      content: draft?.content ?? staticFallback(locale),
      revision: draft?.revision ?? 0,
      source: draft ? "d1" : "static",
      identity,
    });
  } catch (error) {
    return errorJson(error, error instanceof HttpError ? error.status : 500);
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    assertSameOrigin(context);
    const identity = await requireAdmin(context);
    const locale = localeSchema.parse(context.params.locale);
    const db = getCmsDb();
    if (!db) throw new HttpError(503, "CMS_DB binding is not configured");
    const body = saveDraftRequestSchema.parse(await readJsonBody(context));
    if (body.content.locale !== locale) throw new HttpError(400, "Locale mismatch");
    const saved = await saveDraft(db, locale, body.content, identity.email, body.expectedRevision);
    return json({ id: saved.id, content: saved.content, revision: saved.revision, hash: saved.hash });
  } catch (error) {
    if (error instanceof CmsConflictError) return json({ error: "conflict", currentRevision: error.currentRevision }, 409);
    return errorJson(error, error instanceof HttpError ? error.status : 500);
  }
};
