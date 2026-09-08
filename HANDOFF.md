# 个人网站第一阶段交接

## 当前成果

个人网站三语草稿已创建：

```text
/data00/home/nietianyuan/personal-site
```

当前包含：

- 中英日三语响应式个人主页；
- 深色 / 浅色主题切换；
- 首屏、关于我、关注领域、代表性实践、联系方式；
- 有内容时才显示的文章区域；
- 草稿模式、照片位和待补素材提示；
- SEO 基础信息和 favicon；
- 集中的个人内容配置；
- 网站方案与内容资料清单。

## 网站大纲

```text
首页
├── 首屏定位与主要行动按钮
├── 关于我
├── 关注领域
├── 代表性实践
├── 文章与分享（有内容时才显示）
├── 联系方式
└── 待补素材（仅草稿模式显示）
```

完整方案见 `SITE_PLAN.md`。

## 模板与技术方案

调研后首选参考：

- `RyanFitzgerald/devportfolio`
- Astro + Tailwind CSS
- MIT License
- 适合快速定制开发者作品集

由于 GitHub Clone 在当前网络连续超时，本项目没有直接复制其代码，而是采用 Astro 静态站和作品集信息架构独立实现。

当前实际技术栈：

- Astro 7；
- TypeScript；
- 原生 CSS；
- 静态输出；
- 无 Cookie、无统计脚本、无外部字体依赖。

## 验证结果

```text
npm install：成功，0 vulnerabilities
npm run check：0 errors / 0 warnings / 0 hints
npm run build：成功，生成 dist/index.html
本地 HTTP 请求：200 OK
```

## 本地查看

在 GoLand 中打开：

```text
/data00/home/nietianyuan/personal-site
```

终端执行：

```bash
npm run dev
```

然后访问：

```text
http://localhost:4321
```

如果使用 GoLand Remote Development，可转发远端 `4321` 端口。

## 仍需提供

当前只缺个人照片和最终文案审阅。照片建议为 4:5 竖图，网站已有响应式占位。

案例只需要按以下结构提供：

```text
案例名称：
背景：
问题：
我的职责：
采用的方法：
结果：
可公开的技术关键词：
需要隐去的内容：
```

完整资料表见 `CONTENT_CHECKLIST.md`。

## 内容修改入口

三语个人资料分别位于：

```text
src/content/zh.ts
src/content/en.ts
src/content/ja.ts
```

收到正式资料后，可以直接替换占位内容，并将 `draftMode` 改为 `false` 隐藏草稿提示。

## 当前 Git 状态

项目已初始化本地 Git 仓库，但没有 commit，也没有配置或执行 push。
