import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/cms/auth";
import { assertSameOrigin, errorJson, HttpError, json, readJsonBody } from "../../../../lib/cms/http";
import { CmsConflictError, getReleaseDashboard, publishDrafts } from "../../../../lib/cms/repository";
import { getCmsDb } from "../../../../lib/cms/runtime";
import { publishRequestSchema } from "../../../../lib/cms/schema";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    await requireAdmin(context);
    const db = getCmsDb();
    if (!db) throw new HttpError(503, "CMS_DB binding is not configured");
    return json(await getReleaseDashboard(db));
  } catch (error) {
    return errorJson(error, error instanceof HttpError ? error.status : 500);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context);
    const identity = await requireAdmin(context);
    const db = getCmsDb();
    if (!db) throw new HttpError(503, "CMS_DB binding is not configured");
    const body = publishRequestSchema.parse(await readJsonBody(context));
    try {
      return json({
        release: await publishDrafts(
          db,
          identity.email,
          body.note,
          body.expectedGeneration,
          body.expectedDrafts,
        ),
      }, 201);
    } catch (error) {
      if (error instanceof Error && error.message === "All three locale drafts are required before publishing") {
        throw new HttpError(422, error.message);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof CmsConflictError) return json({ error: "conflict", currentGeneration: error.currentRevision }, 409);
    return errorJson(error, error instanceof HttpError ? error.status : 500);
  }
};
