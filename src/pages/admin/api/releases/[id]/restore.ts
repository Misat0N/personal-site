import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../../lib/cms/auth";
import { assertSameOrigin, errorJson, HttpError, json, readJsonBody } from "../../../../../lib/cms/http";
import { CmsConflictError, restoreRelease } from "../../../../../lib/cms/repository";
import { getCmsDb } from "../../../../../lib/cms/runtime";
import { restoreRequestSchema } from "../../../../../lib/cms/schema";

export const prerender = false;
export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context);
    const identity = await requireAdmin(context);
    const db = getCmsDb();
    if (!db) throw new HttpError(503, "CMS_DB binding is not configured");
    if (!context.params.id) throw new HttpError(400, "Release id is required");
    const body = restoreRequestSchema.parse(await readJsonBody(context));
    try {
      return json(
        {
          release: await restoreRelease(
            db,
            context.params.id,
            identity.email,
            body.expectedGeneration,
          ),
        },
        201,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "Release not found") {
        throw new HttpError(404, error.message);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof CmsConflictError) {
      return json({ error: "conflict", currentGeneration: error.currentRevision }, 409);
    }
    return errorJson(error, error instanceof HttpError ? error.status : 500);
  }
};
