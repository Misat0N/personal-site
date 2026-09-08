# 个人网站首版方案

## 目标

让访问者在 30 秒内了解：

1. 聂田塬是谁；
2. 关注和擅长什么；
3. 如何思考并解决问题；
4. 如何取得联系。

首版不展示未经确认的职级、履历、项目指标或公司内部信息。

## 信息架构

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

每种语言使用单页结构，正式页面均带语言前缀：

```text
/zh/  /en/  /ja/
```

根路径负责语言检测和无 JavaScript 语言选择。满足以下条件后再扩展：

- 有 3 个以上完整公开案例：增加 `/projects` 和案例详情页；
- 有持续更新的文章：增加 `/notes`；
- 三语长文稳定更新：增加 `/[lang]/notes/[slug]/`；
- 引入联系表单或访问统计：增加 `/privacy`。

## 模板调研

首选参考：

- [RyanFitzgerald/devportfolio](https://github.com/RyanFitzgerald/devportfolio)
  - Astro + Tailwind CSS
  - MIT License
  - 优点：面向开发者作品集、内容配置集中、部署简单

备选：

- [satnaing/astro-paper](https://github.com/satnaing/astro-paper)：适合后续以技术文章为核心；
- [dodolalorc/astro-navfolio](https://github.com/dodolalorc/astro-navfolio)：适合项目、博客和短内容并重；
- [github-samples/gitfolio](https://github.com/github-samples/gitfolio)：视觉鲜明，但 Next.js 依赖和改造成本更高。

由于 GitHub Clone 在当前网络中持续超时，项目没有复制模板源码，而是采用 Astro 静态站技术方向与作品集信息架构独立实现。

## 技术选择

- Astro 静态输出；
- TypeScript 严格模式；
- 原生 CSS，无 UI 框架和客户端运行时依赖；
- 支持深浅色主题、键盘焦点、减少动画偏好；
- 单一内容配置文件 `src/content/profile.ts`；
- 无 Cookie、无统计脚本、无外部字体请求。
- 中日文字体分开使用 SC / JP 系统字形回退；
- 语言切换保持当前锚点，并以本地 `localStorage` 记忆选择；
- 草稿阶段三语页面全部 `noindex`。

## 视觉方向

- 关键词：克制、编辑感、工程感、留白；
- 米白纸张色 + 深森林绿 + 陶土橙；
- 大字号中文标题与等宽元信息形成层级；
- 不使用通用渐变英雄区、技能进度条或夸张动效。

## 内容原则

- 真实信息优先，资料不足时隐藏栏目；
- 案例采用“问题—职责—方法—结果”的统一结构；
- 内部项目只做匿名化表达，不出现 PSM、内部链接、日志、客户信息或未经许可的数据；
- 无法公开数字时使用准确的定性描述。
