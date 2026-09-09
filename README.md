# Tianyuan Nie — Personal Site

一个使用 Astro 与 Cloudflare Workers 构建的中、英、日三语个人网站。公开页面由 D1 中的已发布内容服务端渲染；管理后台支持结构化编辑、草稿预览、三语原子发布和历史回滚。D1 不可用或尚未初始化时，公开页面会回退到仓库内置内容。

## 页面与接口

```text
/                         语言检测与选择
/zh/ /en/ /ja/           三语公开主页
/admin/                   内容管理后台
/admin/preview/:locale/   草稿或指定版本预览
/api/content/:locale/     当前已发布内容（只读）
```

管理路由应由 Cloudflare Access 保护。Worker 还会验证 Access JWT，并只允许 `ADMIN_EMAIL` 指定的邮箱。

## 本地开发

要求 Node.js 22.12 或更新版本。

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev:worker
```

访问：

- 公开站点：`http://localhost:8788/zh/`
- 管理后台：`http://localhost:8788/admin/`

`.dev.vars` 和 `.wrangler/` 已被 Git 忽略。本地 API 调试使用 `LOCAL_ADMIN_TOKEN`；开发服务只监听 `127.0.0.1`，该变量不能配置到生产环境。浏览器首次进入后台前，打开 `http://127.0.0.1:8788/admin/local-login/` 并输入同一个 token，以建立仅 localhost 可用的 HttpOnly 会话。正式环境始终使用 Cloudflare Access。

```bash
curl -i -c /tmp/personal-site.cookies \
  -X POST http://127.0.0.1:8788/admin/local-login/ \
  --data-urlencode "token=<your LOCAL_ADMIN_TOKEN>"
```

普通的 `npm run dev` 适合看页面样式；涉及 D1、管理 API 或发布流程时，应使用上面的 Wrangler 命令。

## 内容来源

首次部署或 D1 尚无发布版本时，三语内容从以下文件读取：

```text
src/content/zh.ts
src/content/en.ts
src/content/ja.ts
```

进入管理后台后，分别保存三种语言的草稿，再统一发布。发布后，公开页面自动读取 D1 当前版本，不需要重新构建。

## 检查与构建

```bash
npm run check
SITE_URL=https://personal-site.1269410637.workers.dev npm run build
```

详细的首次上线步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 照片

当前上线版本不展示照片。内容模型保留了可选 `portrait` 字段；没有配置时页面不会显示空占位。未来可先把处理后的图片放在 `public/images/`，随后在管理后台填写图片路径与替代文本。

## 设计参考与许可

模板调研参考了 [RyanFitzgerald/devportfolio](https://github.com/RyanFitzgerald/devportfolio) 的内容组织思路。当前页面代码为独立实现，并未复制该模板代码。项目自身许可将在开源策略确认后补充。
