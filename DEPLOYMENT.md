# Cloudflare Workers + D1 部署手册

## 当前状态

- GitHub：`https://github.com/Misat0N/personal-site`
- 生产分支：`main`
- 当前 Workers 地址：`https://personal-site.1269410637.workers.dev`
- D1 binding：`CMS_DB`
- D1 database name：`personal-site-cms`
- 管理员邮箱：`tianyuannie@hust.edu.cn`

CMS 版本不能在 `wrangler.jsonc` 的 D1 与 Access 占位值未替换时上线。

## 1. 登录并创建 D1

```bash
npx wrangler login
npx wrangler whoami
npx wrangler d1 create personal-site-cms
```

复制命令返回的 `database_id`，替换 `wrangler.jsonc` 中的 `REPLACE_WITH_D1_DATABASE_ID`，然后执行远端 migration：

```bash
npx wrangler d1 migrations apply personal-site-cms --remote
```

这一步只创建 CMS 表和站点状态，不会覆盖当前静态内容。上线后，在管理后台依次打开中文、英文和日文，分别保存一次草稿，再执行一次三语发布。发布前公开页仍会使用仓库中的内置内容。

## 2. 配置 Cloudflare Access

在 Cloudflare Zero Trust 中创建 Self-hosted application：

1. 保护域名设为当前 Workers 域名（或最终自定义域名）。
2. Path 设为 `admin/*`，使后台、预览和所有写 API 一并受保护。
3. Allow policy 只允许 `tianyuannie@hust.edu.cn`。
4. 从 Access application 复制 Application Audience（AUD）。
5. 从 Zero Trust 设置确认 team domain，格式类似 `your-team.cloudflareaccess.com`。
6. 将 team domain 与 AUD 分别填入 `wrangler.jsonc` 的 `ACCESS_TEAM_DOMAIN` 和 `ACCESS_AUD`。
7. Session duration 建议设为 1 小时，策略中不要添加 Bypass。
8. 如果以后改用自定义域名，应禁用 `workers.dev` / Preview URL，或确保所有备用入口也受同一 Access 策略保护。

Worker 会再次验证 JWT 的 issuer、audience 和邮箱。因此即便 Access 路由误配，管理 API 也不会因为页面脚本公开而直接开放。生产环境不要设置 `LOCAL_ADMIN_TOKEN`。

## 3. 构建和部署

```bash
npm ci
npm run check
SITE_URL=https://personal-site.1269410637.workers.dev npm run build
npx wrangler deploy
```

如果使用 Cloudflare 的 Git 自动部署：

- Build command：`npm run build`
- Deploy command：`npx wrangler deploy`
- Node.js：22.12 或更新版本
- 环境变量：`SITE_URL=https://personal-site.1269410637.workers.dev`

当前项目是 Workers SSR + Static Assets，不应再按纯静态 Pages 项目配置。

## 4. 首次内容发布

1. 登录 `/admin/`。
2. 分别切换中文、English、日本語。
3. 检查并保存每种语言的草稿。
4. 用“预览草稿”检查三个版本。
5. 填写发布说明，点击“发布三语内容”。
6. 检查 `/zh/`、`/en/`、`/ja/`。

每次保存都会生成不可变草稿版本。历史回滚会创建一个新的 release，不会删除旧版本。

## 5. 上线验收

- 未登录访问 `/admin/` 会进入 Access 登录流程。
- 非管理员邮箱不能访问管理 API。
- `/admin/preview/*` 返回 `noindex` 与 `no-store`。
- 三语草稿未齐全时无法发布。
- 发布后，三语公开页一起切换到同一个 release。
- 回滚后公开页恢复历史内容。
- `/sitemap-0.xml` 只包含公开页面，不包含 `/admin/*` 或 `/api/*`。
- 页面在桌面和手机上均可正常编辑与浏览。
- 为公开动态页面配置 Cloudflare WAF/Rate Limiting，避免恶意请求消耗 Workers 与 D1 免费额度；管理写接口应采用更严格阈值。

## 6. 自定义域名

域名不是上线管理后台的前置条件，可以先继续使用免费的 `workers.dev` 地址。以后购买 `.com`、`.cn` 或其他域名后：

1. 在 Workers 中添加 Custom Domain。
2. 把 `SITE_URL` 改成新域名。
3. 更新 `public/robots.txt` 中的 sitemap 地址。
4. 将 Access application 切换或扩展到新域名。
5. 重新构建并部署。

域名注册本身通常收费；个人站低流量下，Workers、D1 和单人 Access 通常可以在 Cloudflare 免费额度内运行，实际以 Cloudflare 账户当时显示的套餐与用量为准。未经明确确认，不购买域名或启用付费计划。

## 7. 照片接入

当前先上线无照片版本。以后添加照片时：

1. 去除 EXIF 定位等元数据。
2. 裁切为 4:5，输出 WebP/AVIF，建议宽度不超过 1200 px。
3. 小规模使用可放到 `public/images/portrait.webp`。
4. 在管理后台填写 `/images/portrait.webp`、替代文本和受控的图片位置。

如果以后需要直接在后台上传图片，再单独增加私有 R2 bucket；本期不需要 R2，也不会产生这部分配置负担。
