import type { APIContext } from "astro";
import type { ZodError } from "zod";

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function errorJson(error: unknown, status = 500): Response {
  if (isZodError(error)) {
    return json({ error: "validation_failed", issues: error.issues }, 400);
  }
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error("Unhandled CMS request error", error);
  return json({ error: "Internal server error" }, status);
}

function isZodError(error: unknown): error is ZodError {
  return Boolean(error && typeof error === "object" && "issues" in error);
}

export async function readJsonBody(context: APIContext, maxBytes = 512_000): Promise<unknown> {
  const type = context.request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "application/json is required");
  }
  const length = Number(context.request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > maxBytes) throw new HttpError(413, "Request body is too large");
  const text = await context.request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new HttpError(413, "Request body is too large");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body must contain valid JSON");
  }
}

export function assertSameOrigin(context: APIContext): void {
  const origin = context.request.headers.get("origin");
  if (!origin) throw new HttpError(403, "Origin header is required for write requests");
  if (origin !== new URL(context.request.url).origin) throw new HttpError(403, "Cross-origin write rejected");
}

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}
