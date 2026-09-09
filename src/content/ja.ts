import type { HomeContent } from "./types";

export const profileJa = {
  locale: "ja",
  draftMode: false,
  seo: { title: "聂田塬（Nie Tianyuan）｜プロジェクト、研究、ノート", description: "これまでのプロジェクト、現在進行中の研究、そして日々の記録。" },
  name: "聂田塬", romanizedName: "Nie Tianyuan", initials: "NTY", eyebrow: "Selected Work · 2023—Now",
  headlineLines: ["プロジェクト、研究、", "そしてノート。"],
  introduction: "これまでのプロジェクト、現在進行中の研究、そして日々の記録をまとめています。",
  about: "複雑な要件を検証可能な判断へ分解し、研究のアイデアを動くプロトタイプへ落とし込むことが好きです。実務では明確なサービス境界、安定したデータフロー、可観測性を重視し、研究では暗号技術・人工知能・パッシブIoTの交差領域を探究しています。",
  facts: [{ label: "Location", value: "中国 · UTC+8" }, { label: "Education", value: "華中科技大学 · 暗号科学・技術" }, { label: "Principle", value: "Evidence over assumptions" }],
  availability: "三言語版をレビュー中",
  focusAreas: [
    { index: "01", title: "バックエンド・システム", description: "複雑なプロダクトを支える、明確なAPI、保守しやすいサービス、信頼できるデータフローを設計します。", tags: ["Go", "API Design", "Service Engineering"] },
    { index: "02", title: "信頼できるAIとプライバシー", description: "MPC、ゼロ知識証明、プライバシー保護機械学習による安全な学習と推論を研究しています。", tags: ["MPC", "Zero-Knowledge", "Privacy ML"] },
    { index: "03", title: "ソフトウェアセキュリティ", description: "プログラム解析、コードスライシング、Fuzzingを用いて脆弱性を理解し、実用的な安全性ツールを構築します。", tags: ["Static Analysis", "Code Security", "Fuzzing"] },
    { index: "04", title: "インテリジェント・エッジ", description: "信号処理、機械学習、FPGA実装を組み合わせ、低消費電力のセンシングと通信を検討します。", tags: ["Backscatter", "Signal Processing", "FPGA"] },
  ],
  education: [{ id: "hust", kicker: "学士課程", title: "華中科技大学", subtitle: "ネットワーク空間安全学院 · 暗号科学・技術専攻", period: "2023.09 — 現在", summary: "暗号理論、暗号のソフトウェア／ハードウェア実装、数学的基礎、AI実践を学んでいます。加重平均は90.45 / 100、専攻内総合評価は45名中1位です。", highlights: ["加重平均：90.45 / 100、専攻内総合評価：1位 / 45名", "暗号学原理、暗号ハードウェア工学、暗号ソフトウェア実践を履修", "暗号学の数学的基礎とPythonによるAI実践を学習"], tags: ["Cryptography", "Cybersecurity", "Artificial Intelligence"] }],
  experience: [{ id: "bytedance", kicker: "エンジニアリング", title: "ByteDance", subtitle: "中国コマース・広告部門 · バックエンド開発インターン", period: "2026.04 — 現在", summary: "生活サービス領域で、事業者とクリエイターの協業を支えるバックエンド開発に携わっています。", highlights: ["要件整理と設計からバックエンド実装、リリースまでを担当", "MySQL、Redis、Kafkaを用いた開発とサービスの性能・安定性改善", "複雑なフローの理解と障害調査を支える知識基盤・可観測性の整備に参加"], tags: ["Backend Engineering", "Go", "MySQL", "Redis", "Kafka"] }],
  projects: [
    { id: "privacy-ai", kicker: "研究中", title: "プライバシー保護AIとトラステッド・コンピューティング", subtitle: "研究メンバー", period: "2025.11 — 現在", status: "Ongoing", summary: "大規模言語モデルと現代暗号を組み合わせ、プライバシーを保護した学習と安全な推論を研究しています。", highlights: ["MPCによる保護されたモデル学習・ファインチューニングを検討", "AIエージェントの処理経路に対する透かしとゼロ知識証明による検証可能なAIを研究"], tags: ["LLM", "MPC", "Zero-Knowledge", "Trusted AI"] },
    { id: "llm-supply-chain", kicker: "論文 · ソフトウェア工学", title: "大規模言語モデルのサプライチェーン・セキュリティ", subtitle: "第三著者", period: "2025.03 — 2025.05", status: "Internetware 2026", summary: "13,486件のオープンソースパッケージと180件の脆弱性を対象に、LLMサプライチェーンの構造、機能領域、リスク伝播を実証的に分析しました。", highlights: ["28,704本の依存関係を含むグラフを構築し、中核依存と代表的なトポロジーを分析", "依存層を通じた脆弱性の連鎖的影響を定量化し、Internetware 2026に採択"], tags: ["AI Security", "Software Supply Chain", "Empirical Study"], media: { src: "/images/research/llm-supply-chain-paper-page.webp", alt: "LLMサプライチェーン論文の1ページ目。題名、著者、概要、本文冒頭を表示", caption: "論文1ページ目 · arXiv:2504.20763v2。元PDFから等比縮小し、切り抜きや文字の重ね合わせは行っていません。", source: { label: "arXiv · PDF", href: "https://arxiv.org/pdf/2504.20763v2" } }, links: [{ label: "概要", href: "https://arxiv.org/abs/2504.20763" }, { label: "HTML", href: "https://arxiv.org/html/2504.20763v2" }, { label: "PDF", href: "https://arxiv.org/pdf/2504.20763v2" }] },
    { id: "secure-backscatter", kicker: "研究プロジェクト", title: "カオス系列を用いた後方散乱通信のセキュア伝送", subtitle: "プロジェクト責任者", period: "2025.03 — 2026.03", status: "Completed", summary: "パッシブIoT向けの軽量なセキュア符号化方式を設計・実装しました。", highlights: ["カオス系列の差分変調を用いた方式を提案", "スループットを維持しながら端末側のエネルギー効率と中間者攻撃への耐性を改善", "省レベルの大学生イノベーション・起業訓練プロジェクトに推薦"], tags: ["Backscatter", "Secure Communication", "Passive IoT"] },
    { id: "signal-recognition", kicker: "学術論文 · インテリジェント・ハードウェア", title: "パッシブIoT信号のインテリジェント識別", subtitle: "第一著者", period: "2025.03 — 2026.03", status: "Published · 2026", summary: "単一周波数のメタマテリアル・パッシブIoTセンシングと、反射パラメータおよび環境物理量を推定するモデル駆動型深層ネットワークを提案しました。", highlights: ["チャネル推定・信号識別アルゴリズム、数値評価、組込みFPGA検証を担当", "Complex & Intelligent Systemsに掲載、DOI: 10.1007/s40747-026-02240-4"], tags: ["Signal Recognition", "Deep Learning", "Metamaterial", "Passive IoT"], media: { src: "/images/research/signal-recognition-paper-page.webp", alt: "パッシブIoT信号識別論文の1ページ目。学術誌、題名、著者、概要、キーワードを表示", caption: "論文1ページ目 · Complex & Intelligent Systems 12:126 (2026)。オープンアクセスPDFから等比縮小し、切り抜きや文字の重ね合わせは行っていません。", source: { label: "Springer · Article", href: "https://link.springer.com/article/10.1007/s40747-026-02240-4" }, license: { label: "CC BY-NC-ND 4.0", href: "https://creativecommons.org/licenses/by-nc-nd/4.0/" } }, links: [{ label: "DOI", href: "https://doi.org/10.1007/s40747-026-02240-4" }, { label: "オープン本文", href: "https://link.springer.com/article/10.1007/s40747-026-02240-4" }, { label: "PDF", href: "https://link.springer.com/content/pdf/10.1007/s40747-026-02240-4.pdf" }] },
  ],
  awards: [
    { year: "2025", title: "全国暗号技術コンテスト", award: "全国大会 二等賞", description: "チームリーダーとして、LLMを活用した暗号API誤用検出プロトタイプを開発しました。" },
    { year: "2025", title: "全国大学生組込みチップ・システム設計コンテスト", award: "全国大会 三等賞", description: "パッシブIoT監視システムのアルゴリズム設計とFPGA実装を担当しました。" },
    { year: "2025", title: "中国ソフトウェアカップ", award: "全国大会 三等賞", description: "AI面接支援アプリの機能設計とフロントエンド開発に参加しました。" },
    { year: "2024–2025", title: "数学・数理モデリング競技", award: "湖北省 一等賞 × 2", description: "全国大学生数学競技および数理モデリング競技の湖北地区で一等賞を受賞しました。" },
  ],
  exchange: { id: "hokudai", kicker: "海外交流", title: "北海道大学", subtitle: "Hokudai Summer Institute", period: "2024.08", summary: "サステナブル・ツーリズムと経済学に関する英語開講科目を履修し、最終発表まで修了しました。", highlights: ["成績：A−"], tags: ["Hokkaido University", "Summer Institute", "English-taught Program"] },
  skills: [
    { title: "プログラミング・バックエンド", items: ["Go", "C / C++", "Python", "TypeScript", "JavaScript", "MySQL", "Redis", "Kafka"] },
    { title: "フロントエンド", items: ["React", "Vue 3", "Redux", "Vite", "Webpack", "Tailwind CSS"] },
    { title: "セキュリティ・コード解析", items: ["Web Security", "Tree-sitter", "AST", "CFG / DFG", "Fuzzing", "Wireshark"] },
    { title: "AI・プライバシー", items: ["PyTorch", "scikit-learn", "LangChain", "LLM Agents", "MPC", "Zero-Knowledge", "CrypTen"] },
    { title: "通信・ハードウェア", items: ["MIMO / OFDM", "Backscatter", "Signal Processing", "MATLAB / Simulink", "FPGA / Verilog"] },
    { title: "開発環境と言語", items: ["Git / GitHub", "Linux", "Docker", "GitHub Actions", "中国語", "英語（CET-4 / CET-6）"] },
  ],
  contact: { heading: "エンジニアリング、研究、そして長く価値のあることについて。", body: "バックエンド、AIセキュリティ、プライバシー保護計算、インテリジェント・システムについての交流を歓迎します。", links: [{ label: "Email", href: "mailto:tianyuannie@hust.edu.cn" }, { label: "GitHub", href: "https://github.com/Misat0N" }] },
  missingContent: ["ホームページ用のポートレート写真を追加", "中国語・英語・日本語の文章を最終確認", "正式ドメインと公開後の表示を確認"],
  ui: { draftLabel: "Draft 02", draftText: "三言語版の草稿です。公開範囲と翻訳は本人確認前です。", navLabel: "メインナビゲーション", homeLabel: "ホーム", nav: { about: "プロフィール", focus: "関心領域", resume: "経歴", work: "プロジェクト", contact: "連絡先" }, greeting: "はじめまして、", viewWork: "プロジェクトを見る", contactCta: "連絡する", highlights: "要点", tagsLabel: "技術タグ", currentStatus: "現在", backToTop: "ページ上部へ", themeToLight: "ライトテーマに切り替える", themeToDark: "ダークテーマに切り替える", sections: {
    about: { index: "01", eyebrow: "About", title: "理解してから、設計する。", description: "エンジニアリングも研究も、前提を明確にするところから始まります。" }, focus: { index: "02", eyebrow: "Focus", title: "関心のあること。", description: "バックエンドから信頼できるAIまで、一つひとつの層を明確に。" }, education: { index: "03", eyebrow: "Education", title: "学びと基礎。" }, experience: { index: "04", eyebrow: "Experience", title: "エンジニアリング実務。" }, work: { index: "05", eyebrow: "Research & Projects", title: "研究とプロジェクト。" }, awards: { index: "06", eyebrow: "Awards", title: "コンテストと受賞。" }, skills: { index: "07", eyebrow: "Skills", title: "技術とツール。" }, exchange: { index: "08", eyebrow: "International", title: "海外交流。" }, contact: { index: "09", eyebrow: "Contact", title: "ご連絡ください。" }, materials: { index: "10", eyebrow: "Review", title: "公開前の確認事項。", description: "確認が終わるまで、これらの情報は公開しません。" },
  } },
} satisfies HomeContent;
