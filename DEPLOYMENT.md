# 域名与部署方案

## 推荐决定

- 正式域名：`tianyuannie.com`
- 托管平台：Cloudflare Pages
- 域名注册商：Cloudflare Registrar（也可使用其他注册商后把 DNS 托管到 Cloudflare）

选择理由：

- 域名与英文名 `Tianyuan Nie` 一致；
- 对中文、英文、日文访客都容易输入和理解；
- `.com` 比带连字符或地区性后缀更长期、通用；
- Cloudflare Pages 适合 Astro 静态输出，免费起步，提供全球 CDN、自动 HTTPS、自定义域名和预览部署；
- 网站无服务端、数据库或 Cookie，不需要更复杂的平台。

2026-09-08 查询 Verisign RDAP 时，`tianyuannie.com` 返回 404（未找到注册记录）。域名状态可能随时变化，必须以注册商结算页为准。

备选域名：

1. `nietianyuan.com`
2. `tianyuan-nie.com`
3. `tianyuannie.me`
4. `tianyuannie.dev`

## Cloudflare Pages 配置

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Node version: 22
Environment variable:
  SITE_URL=https://tianyuannie.com
```

推荐把代码放入个人 GitHub 仓库，再连接 Cloudflare Pages。每次推送自动生成预览和正式部署。

## 照片接入

页面已经预留 4:5 竖向照片位。收到照片后：

1. 去除 EXIF 定位信息；
2. 裁切为 4:5；
3. 输出 WebP / AVIF，建议宽度 1200px 以内；
4. 放到 `public/images/portrait.webp`；
5. 在三语 profile 中添加：

```ts
portrait: {
  src: "/images/portrait.webp",
  alt: "Tianyuan Nie",
  objectPosition: "50% 35%",
},
```

## 正式发布前

- 把三个 profile 的 `draftMode` 改为 `false`；
- 将 `public/robots.txt` 的 `Disallow: /` 改为 `Allow: /`；
- 用真实 `SITE_URL` 构建，确认 canonical、hreflang 和 `og:url`；
- 最终检查中英日文案、邮箱、GitHub 与照片；
- 购买域名并在 Pages 添加自定义域名。
