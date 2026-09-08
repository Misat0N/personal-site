# 聂田塬的个人网站

一个使用 Astro 构建的中英日三语静态个人主页。当前处于内容草稿模式，未确认的履历、公开边界和联系方式均有明确提示。

## 本地开发

```bash
npm install
npm run dev
```

默认访问 `http://localhost:4321`。根路径会按本地语言偏好进入 `/zh/`、`/en/` 或 `/ja/`，也保留无 JavaScript 的语言选择页。

## 修改内容

三语内容分别位于：

```text
src/content/zh.ts
src/content/en.ts
src/content/ja.ts
```

资料确认后，把 `draftMode` 改为 `false` 即可隐藏草稿提示与素材清单。

## 页面结构

```text
/                 语言检测与选择
/zh/              简体中文
/en/              English
/ja/              日本語
```

## 构建

```bash
npm run check
npm run build
```

构建产物位于 `dist/`，可部署到任意静态托管服务。

正式部署时设置：

```bash
SITE_URL=https://your-domain.example npm run build
```

这样会生成正确的 canonical、hreflang 和 Open Graph URL。草稿模式默认输出 `noindex`。

## 设计参考与许可

模板调研参考了 [RyanFitzgerald/devportfolio](https://github.com/RyanFitzgerald/devportfolio) 的内容组织思路。由于拉取时 GitHub 网络持续超时，当前页面代码为独立实现，并未复制该模板代码。项目自身许可在上线/开源策略确认后补充。
