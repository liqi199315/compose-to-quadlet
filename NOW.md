# NOW.md

## 当前阶段（2026-11-12）

- **项目路径**：`/Users/dake/Projects/aiapp/30_products/compose-to-quadlet/`（已晋升至 `30_products/` 正式产品目录）
- **品牌与生产域名**：`QuadletGen` / `https://quadletgen.com`（联系邮箱 `hello@quadletgen.com`；2026-11-12 已部署到 Cloudflare Workers 自定义域名，Worker `compose-to-quadlet`，Version ID `5d9f6d3a-eb30-4899-b80c-e671203e5d13`，`https://compose-to-quadlet.liqi199315.workers.dev`）
- **90 天试验窗口**：`2026-11-12` 至 `2027-02-10`（详见 `PLAN_90DAY.md`）
- **主关键词**：`docker compose to quadlet converter`
- **当前流量与转化基线**：`盲`（生产已上线，采集刚接通，尚无可用流量样本）
- **GA4（2026-11-12）**：Property `564011383`（`properties/564011383`，显示名 `quadletgen.com`，时区 `Asia/Shanghai`，货币 `USD`），Web Data Stream `16325768198`，Measurement ID `G-PK7MR29S6E`，默认 URI `https://quadletgen.com`。事件保留 `FOURTEEN_MONTHS` 且 `resetUserDataOnNewActivity=true`。增强衡量已关闭 `siteSearchEnabled` 与 `formInteractionsEnabled`（读回时 proto3 省略 false 字段；先写 true 再写 false 后字段消失）。Key Event `quadlet_export`（`properties/564011383/keyEvents/16325186130`，`ONCE_PER_EVENT`）。
- **Search Console（2026-11-12）**：Site Verification `DNS_TXT` 通过，资源 ID `dns://quadletgen.com`。已验证所有者为 `build-android@charged-sector-382503.iam.gserviceaccount.com` 与 `liqi199315@gmail.com`。域名资源 `sc-domain:quadletgen.com` 注册成功（PUT 204，GET 200，`permissionLevel=siteOwner`）。Sitemap `https://quadletgen.com/sitemap-index.xml` 已提交（PUT 204，GET 200，`lastSubmitted=2026-11-12T07:54:30.598Z`，提交时 `isPending=true`，warnings `0`，errors `0`）。
- **IndexNow（2026-11-12）**：`https://api.indexnow.org/indexnow` 返回 HTTP `202`，host `quadletgen.com`，keyLocation `https://quadletgen.com/indexnow-key.txt`，提交 9 条 URL。
- **边缘冒烟（2026-11-12）**：`https://quadletgen.com/` 对 Googlebot、AdsBot-Google、Bingbot、OAI-SearchBot、ChatGPT-User、PerplexityBot 均为 HTTP `200`。`https://www.quadletgen.com/` 返回 HTTP `301`，Location `https://quadletgen.com/`。线上 HTML 的 `ga4Id` 为 `G-PK7MR29S6E`，并加载 `googletagmanager.com/gtag/js`。
- **Cloudflare Zone 与邮件路由（2026-11-12）**：Zone `8abf0febaad1c30746ddce02a50a660f`（`quadletgen.com`）状态 `active`。Email Routing `enabled: true`，`status: ready`。`hello@quadletgen.com` 与 `privacy@quadletgen.com` 均转发到 `liqi199315@gmail.com`。MX、SPF、DKIM 已锁定，并有 `_dmarc` TXT。
- **共享统计登记（2026-11-12）**：`../../40_shared/analytics-sites.yaml` 的 `composetoquadlet` 已登记。`ga4_property_id: "564011383"`，Measurement ID `G-PK7MR29S6E`，`gsc_site: "sc-domain:quadletgen.com"`，`bing_site_url: https://quadletgen.com/`，`site_url: https://quadletgen.com/`。
- **Bing Webmaster（2026-11-12）**：`IsVerified: true`（Cloudflare 未代理的 `verify.bing.com` CNAME）。Sitemap `https://quadletgen.com/sitemap-index.xml` 已通过 `SubmitFeed` 提交。
- **报表脚本（2026-11-12）**：`ga4-report.mjs`、`gsc-report.mjs`、`bing-report.mjs`、`analytics-registry.test.mjs` 均退出码 `0`。GitHub 仓库仍为私有：`https://github.com/liqi199315/compose-to-quadlet`。

## 已就绪准产资产清单

- **多模式转换引擎与类型契约（`src/lib/`）**：支持 `compose-yaml` 与 `docker-run` / `podman-run` 输入解析，`rootless` / `rootful` 安装目录切换，`none` / `shared-z` / `private-Z` SELinux 卷重打标，自动合成共享 `.network` 单元解决容器间 DNS 解析（`podlet#190`），敏感环境变量分离至 `.env`，以及纯前端 PKZIP 归档打包。
- **9 个静态内容路由（6 个工具页 + 3 个 E-E-A-T 信任与合规页）**：
  1. `/`（Docker Compose to Quadlet 主工作台）
  2. `/podman-quadlet-generator/`（Podman Quadlet 生成器与 AutoUpdate 预设）
  3. `/docker-run-to-quadlet-converter/`（Docker Run / Podman Run 转 Quadlet 转换器）
  4. `/rootless-quadlet-selinux-volume-generator/`（Rootless Quadlet SELinux `:z` / `:Z` 卷生成器）
  5. `/immich-nextcloud-vaultwarden-quadlet-templates/`（Immich / Nextcloud / Vaultwarden 多容器模板）
  6. `/podlet-online-multi-container-network-packager/`（免装 Rust CLI 的在线多容器网络与 ZIP 打包器）
  7. `/about/`（Podman 4.4+/5.x `podman-system-generator` 规范对齐说明、共享 `.network` 解决 `podlet#190` 跨容器 DNS 原理、100% 本地内存运行架构、非官方声明与 `hello@quadletgen.com` 联系入口）
  8. `/privacy/`（`docker-compose.yml` 与密钥零上传承诺、匿名化 GA4 事件策略、GDPR 与 CCPA/CPRA 权利说明）
  9. `/terms/`（MIT 开源使用条款、上线前测试环境审查 systemd 单元与 SELinux 标签的操作员责任、Linux VPS `rel="sponsored"` 联盟披露规范）
- **全套技术 SEO 与安全静态产物**：`404.html`、`sitemap-index.xml`、`robots.txt`、`llms.txt`、`_headers`（含 `workers.dev` 与 `pages.dev` 预览域名 `X-Robots-Tag: noindex` 防串台头）、`og-image.svg`、`og-image.png`（1200x630 栅格化社交流览卡片）、`github-social-preview.png`（1280x640 GitHub 社交预览卡片）、`site.webmanifest`、`indexnow-key.txt` 以及 `c9d2e4f73a814b629d4c35e8f2a16c53.txt` 双重 IndexNow 探测校验文件。
- **独立 Node ESM CLI 与完整测试套件（`bin/compose-to-quadlet.mjs`、`tests/cli.test.ts`）**：通过 esbuild 独立打包 `src/cli.ts`，支持 `--input`、`--run`、`--stack`、`--scope`、`--selinux`、`--out-dir`、`--stdout`、`--zip` 与 `--help`（指向 `https://quadletgen.com`），并通过 Vitest 10 项端到端 CLI 测试覆盖。
- **全套发布工具包（`LAUNCH_KIT.md`）与 GitHub 准产 `README.md`**：包含 X 25 秒视频分镜与发帖话术、3 条布尔痛点搜索词与价值优先回复模板、Hacker News Show HN 事实备忘、Reddit（r/podman、r/selfhosted、r/linuxadmin）发帖模板、Console.dev 投稿草案及 upstream podlet#190 技术规避评论模版。
- **隐私安全 GA4 漏斗埋点（`BaseLayout.astro`、`src/lib/analytics.ts`）**：基于 `window.dataLayer` 本地队列记录 `config` 与脱敏导出事件（`quadlet_export`），过滤 YAML/凭据参数；在 `127.0.0.1` / `localhost` 下零外网脚本请求。
- **升级版构建后 SEO 门禁（`scripts/seo-preflight.mjs`）**：默认源站 `https://quadletgen.com`，校验全部 9 个内容路由与 11 个静态附属文件、`og-image.png`（>5KB 且校验 PNG 魔数）、`github-social-preview.png`、双重 IndexNow 密钥文件、`og:image` 指向 `/og-image.png`、`_headers` 中的 `noindex` 防护、唯一 `<title>` / `<meta name="description">`、`<link rel="canonical">`、JSON-LD（全部 9 页含 `Organization` + `BreadcrumbList`，6 个工具页含 `WebApplication` + `FAQPage`）、全站内链可达性，以及零残留占位符与零长破折号。
- **Playwright 6 用例端到端套件（`tests/e2e/quadlet.spec.ts`）**：保留原有 4 条核心转换/下载/容错测试，新增用例 5（GA4 `window.dataLayer` `config` + `quadlet_export` 队列校验且 `127.0.0.1` 以外请求数为 `0`）与用例 6（`375x812` 移动视口 `scrollWidth <= 375` 零横向溢出 + 页脚跳转 `/privacy/` 与 `/about/` HTTP 200 及 `<h1>` 可见性校验）。
- **上线执行手册（`LAUNCH_CHECKLIST.md`）**：涵盖 `quadletgen.com` 注册、Cloudflare Workers 部署、GA4 / GSC / Bing 接入、IndexNow 密钥替换与 9 路由推送，以及 Hetzner / DigitalOcean / Vultr 联盟账号申请与合规接入步骤。

## 等待站长完成的清单（`[人工]`）

1. **社区首发（预估 40 分钟）**：按 `LAUNCH_KIT.md` 手动发布 Show HN、r/podman、X、Product Hunt。GitHub 仓库仍为私有：`https://github.com/liqi199315/compose-to-quadlet`。
2. **P2-1（联盟账号准备，预估 20 分钟）**：站点已可访问。凭 `/about/`、`/privacy/`、`/terms/` 申请 DigitalOcean 与 Vultr 推广链接；Hetzner Cloud 自助推荐计划已停，保持无联盟链接。

## 下一步第一动作

- `[人工]`：从 `LAUNCH_KIT.md` 发社区首发帖（Show HN、r/podman、X、Product Hunt），并开始 DigitalOcean / Vultr 联盟入驻。邮件路由、Bing Webmaster、共享统计登记与四条报表脚本均已在 2026-11-12 核验通过。

## 行动记录

- `2026-11-12` `[AI]`：完成孵化期 MVP 6 路由转换器、Vitest 单测与初始 Playwright 4 条 E2E 闭环。
- `2026-11-12` `[AI]`：正式迁入 `30_products/compose-to-quadlet/` 并对齐目标域名 `https://quadletgen.com`；新增 `/about/`、`/privacy/`、`/terms/` 三个 E-E-A-T 信任合规页，升级 `scripts/seo-preflight.mjs`（9 路由 + 8 静态产物 + `og:image` + 全量 JSON-LD 门禁）与 `tests/e2e/quadlet.spec.ts`（扩展至 6 条 E2E，覆盖本地 GA4 `dataLayer` 队列零外网泄漏与 `375x812` 移动端响应式体验），并交付 `LAUNCH_CHECKLIST.md`。
- `2026-11-12` `[AI]`：完成 Slice 3 站点硬化：使用 Playwright 渲染生成 1200x630 `og-image.png` 与 1280x640 `github-social-preview.png`，更新 `BaseLayout.astro` 元标签；更新 `.gitignore` 补充秘密文件防护；在 `public/_headers` 增加 `workers.dev` 与 `pages.dev` 预览域名 `noindex`；创建双重 IndexNow key 文件 `c9d2e4f73a814b629d4c35e8f2a16c53.txt`；使用 esbuild 打包独立 Node ESM CLI `bin/compose-to-quadlet.mjs` 并编写 10 项 Vitest 测试覆盖；升级 `README.md` 与交付 `LAUNCH_KIT.md`；升级 `scripts/seo-preflight.mjs` 断言 PNG 魔数、双重 key 与 headers 防护，并通过 `npm run verify:all` 全量验收。
- `2026-11-12` `[AI]`：生产上线 `https://quadletgen.com`。GA4 Property `564011383`，Stream `16325768198`，Measurement ID `G-PK7MR29S6E`，Key Event `quadlet_export`。Site Verification DNS_TXT 与 GSC `sc-domain:quadletgen.com` 完成，sitemap PUT 204。IndexNow HTTP 202（9 URL）。构建时 `launch-preflight` 与 `seo:check` 均为 `ok: true`。Wrangler 部署 Version ID `5d9f6d3a-eb30-4899-b80c-e671203e5d13`。六种机器人 UA 对首页均为 HTTP 200，`www` 为 301。
- `2026-11-12` `[AI]`：核验邮件路由、Bing Webmaster 与共享统计登记。Zone `8abf0febaad1c30746ddce02a50a660f` 为 `active`；Email Routing `enabled: true, status: ready`，`hello@` 与 `privacy@` 转发到 `liqi199315@gmail.com`，MX/SPF/DKIM 锁定且有 `_dmarc` TXT。`composetoquadlet` 已写入 `../../40_shared/analytics-sites.yaml`（`564011383` / `G-PK7MR29S6E` / `sc-domain:quadletgen.com` / `https://quadletgen.com/`）。Bing `IsVerified: true`（未代理 `verify.bing.com` CNAME），sitemap 经 `SubmitFeed` 提交。`ga4-report.mjs`、`gsc-report.mjs`、`bing-report.mjs`、`analytics-registry.test.mjs` 退出码均为 `0`。剩余 `[人工]`：`LAUNCH_KIT.md` 社区首发与 DigitalOcean / Vultr 入驻。
- `2026-11-12` `[AI]`：上线后最佳实践巡检收口：`wrangler.jsonc` 关闭 `workers_dev` 与 `preview_urls` 并重部署（Version `33147d26-6f16-42e6-a72e-c90d3881c412`，真网验证 `compose-to-quadlet.liqi199315.workers.dev` 已返回 HTTP `404`）；清理 `public/_headers` 无效域名行并对齐 `seo-preflight.mjs` 门禁；通过 GA4 Admin API 注册 `action`、`template` 自定义维度与 `unit_count` 自定义指标；通过 `gh repo edit` 补齐 GitHub 仓库主页、简介与 10 个 Topics，并同步 `PLAN_90DAY.md` 状态。
