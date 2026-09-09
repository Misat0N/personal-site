import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { HttpError, errorJson } from "../../lib/cms/http";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const hostname = new URL(context.request.url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname) || !env.LOCAL_ADMIN_TOKEN) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Local CMS Login</title><style>body{min-height:100vh;margin:0;display:grid;place-items:center;background:#f4f0e8;color:#17211e;font-family:system-ui}form{width:min(420px,calc(100% - 2rem));display:grid;gap:1rem;padding:2rem;border:1px solid #b7b4aa;background:#fffdf8}h1{margin:0;font-family:Georgia,serif}input,button{box-sizing:border-box;width:100%;padding:.8rem;font:inherit}button{background:#1d3b34;color:#fff;border:0;cursor:pointer}</style><form method="post"><h1>Local CMS Login</h1><p>仅用于 127.0.0.1 本地联调。输入 .dev.vars 中的 LOCAL_ADMIN_TOKEN。</p><label>Local token<input type="password" name="token" required autocomplete="current-password"></label><button type="submit">进入管理后台</button></form></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } },
  );
};

export const POST: APIRoute = async (context) => {
  try {
    const hostname = new URL(context.request.url).hostname;
    if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
      throw new HttpError(404, "Not found");
    }
    const configured = env.LOCAL_ADMIN_TOKEN;
    if (!configured) throw new HttpError(404, "Not found");
    const origin = context.request.headers.get("origin");
    if (origin && origin !== new URL(context.request.url).origin) {
      throw new HttpError(403, "Cross-origin login rejected");
    }
    const data = await context.request.formData();
    const token = data.get("token");
    if (typeof token !== "string" || token !== configured) {
      throw new HttpError(401, "Invalid local admin token");
    }
    context.cookies.set("local_admin_token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/admin",
      maxAge: 60 * 60 * 8,
    });
    return context.redirect("/admin/", 303);
  } catch (error) {
    return errorJson(error, error instanceof HttpError ? error.status : 500);
  }
};
