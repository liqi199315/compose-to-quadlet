# NOW.md

## 当前阶段（2026-11-15）

- **代码版本（2026-11-15 上线）**：`main` 已 rebase 到远端 `8f9b5cb`（GA4 `quadlet_converted` 事件）之上，本地提交为 `e56f446` 发布清单、`6a8ba28` depends_on 映射、`a28274c` 站点图标与 favicon/manifest 接线。三个提交均已 push 到 `origin/main`。
- **线上版本（2026-11-15）**：`npx wrangler deploy` 成功，线上 `/release.json` 的 commit 与部署时 `git rev-parse HEAD` 一致，`npm run release:check` 输出 `match`；14 条路由全部 HTTP 200，页面含 `G-PK7MR29S6E`。Worker Version ID 以 `npx wrangler deployments list` 为准，不在文档里固定。
- **GA4 注入事故与修复（2026-11-15）**：本轮第一次部署漏了 `PUBLIC_GA4_MEASUREMENT_ID`，线上页面落成 `G-PENDING000` 占位符，而 `release:check` 仍报匹配（清单读的是注册表，不是构建产物）。已用 `PUBLIC_SITE_URL=https://quadletgen.com PUBLIC_GA4_MEASUREMENT_ID=G-PK7MR29S6E` 重建并重新部署；共享清单脚本新增“每个构建 HTML 必须含注册表 measurement ID”的强制校验，测试 10/10。今后构建必须显式带环境变量，`npm run cf:deploy` 单独跑会把占位符发上线。
- **线上内容（2026-11-15）**：`https://quadletgen.com/sitemap-0.xml` 为 14 条 URL，与本地 `dist/sitemap-0.xml` 完全一致。五个长尾页均为 HTTP `200`：`/quadlet-depends-on-healthcheck/`、`/quadlet-not-starting-on-boot/`、`/podman-pihole-quadlet/`、`/jellyfin-podman-quadlet/`、`/quadlet-vs-docker-compose/`。仓库内的“五页尚未部署”已过时；2026-11-13 记录仍保留当时状态。
- **本轮验证（2026-11-15，rebase 后）**：`npm run verify:all` 退出码 `0`（Vitest 52/52、Playwright 8/8，14 路由与 12 附属产物）。共享 release 测试 10/10。
- **GitHub 可见性（2026-11-15）**：`gh repo view` 读到 `visibility: PUBLIC`，`isPrivate: false`，仓库 `https://github.com/liqi199315/compose-to-quadlet`。下文 2026-11-12 “仍为私有”是当时记录，不是当前状态。
- **项目路径**：`/Users/dake/Projects/aiapp/30_products/compose-to-quadlet/`（已晋升至 `30_products/` 正式产品目录）
- **品牌与生产域名**：`QuadletGen` / `https://quadletgen.com`（联系邮箱 `hello@quadletgen.com`；2026-11-12 已部署到 Cloudflare Workers 自定义域名，Worker `compose-to-quadlet`，Version ID `5d9f6d3a-eb30-4899-b80c-e671203e5d13`，`https://compose-to-quadlet.liqi199315.workers.dev`）
- **90 天试验窗口**：`2026-11-12` 至 `2027-02-10`（详见 `PLAN_90DAY.md`）
- **主关键词**：`docker compose to quadlet converter`
- **当前流量与转化基线**：2026-11-14 实拉 GA4 为 56 会话、7 互动、0 `quadlet_export`（两天小样本）。GSC / Bing 查询未形成。不再记为「盲」。
- **GA4（2026-11-12）**：Property `564011383`（`properties/564011383`，显示名 `quadletgen.com`，时区 `Asia/Shanghai`，货币 `USD`），Web Data Stream `16325768198`，Measurement ID `G-PK7MR29S6E`，默认 URI `https://quadletgen.com`。事件保留 `FOURTEEN_MONTHS` 且 `resetUserDataOnNewActivity=true`。增强衡量已关闭 `siteSearchEnabled` 与 `formInteractionsEnabled`（读回时 proto3 省略 false 字段；先写 true 再写 false 后字段消失）。Key Event `quadlet_export`（`properties/564011383/keyEvents/16325186130`，`ONCE_PER_EVENT`）。
- **Search Console（2026-11-12）**：Site Verification `DNS_TXT` 通过，资源 ID `dns://quadletgen.com`。已验证所有者为 `build-android@charged-sector-382503.iam.gserviceaccount.com` 与 `liqi199315@gmail.com`。域名资源 `sc-domain:quadletgen.com` 注册成功（PUT 204，GET 200，`permissionLevel=siteOwner`）。Sitemap `https://quadletgen.com/sitemap-index.xml` 已提交（PUT 204，GET 200，`lastSubmitted=2026-11-12T07:54:30.598Z`，提交时 `isPending=true`，warnings `0`，errors `0`）。
- **IndexNow（2026-11-12）**：`https://api.indexnow.org/indexnow` 返回 HTTP `202`，host `quadletgen.com`，keyLocation `https://quadletgen.com/indexnow-key.txt`，提交 9 条 URL。
- **边缘冒烟（2026-11-12）**：`https://quadletgen.com/` 对 Googlebot、AdsBot-Google、Bingbot、OAI-SearchBot、ChatGPT-User、PerplexityBot 均为 HTTP `200`。`https://www.quadletgen.com/` 返回 HTTP `301`，Location `https://quadletgen.com/`。线上 HTML 的 `ga4Id` 为 `G-PK7MR29S6E`，并加载 `googletagmanager.com/gtag/js`。
- **Cloudflare Zone 与邮件路由（2026-11-12）**：Zone `8abf0febaad1c30746ddce02a50a660f`（`quadletgen.com`）状态 `active`。Email Routing `enabled: true`，`status: ready`。`hello@quadletgen.com` 与 `privacy@quadletgen.com` 均转发到 `liqi199315@gmail.com`。MX、SPF、DKIM 已锁定，并有 `_dmarc` TXT。
- **共享统计登记（2026-11-12）**：`../../40_shared/analytics-sites.yaml` 的 `composetoquadlet` 已登记。`ga4_property_id: "564011383"`，Measurement ID `G-PK7MR29S6E`，`gsc_site: "sc-domain:quadletgen.com"`，`bing_site_url: https://quadletgen.com/`，`site_url: https://quadletgen.com/`。
- **Bing Webmaster（2026-11-12）**：`IsVerified: true`（Cloudflare 未代理的 `verify.bing.com` CNAME）。Sitemap `https://quadletgen.com/sitemap-index.xml` 已通过 `SubmitFeed` 提交。
- **报表脚本（2026-11-12）**：`ga4-report.mjs`、`gsc-report.mjs`、`bing-report.mjs`、`analytics-registry.test.mjs` 均退出码 `0`。GitHub 仓库当时仍为私有：`https://github.com/liqi199315/compose-to-quadlet`。这是 2026-11-12 的历史，不是当前状态。

## 已就绪准产资产清单

- **多模式转换引擎与类型契约（`src/lib/`）**：支持 `compose-yaml` 与 `docker-run` / `podman-run` 输入解析，`rootless` / `rootful` 安装目录切换，`none` / `shared-z` / `private-Z` SELinux 卷重打标，自动合成共享 `.network` 单元解决容器间 DNS 解析（`podlet#190`），敏感环境变量分离至 `.env`，以及纯前端 PKZIP 归档打包。
- **`depends_on.condition` 映射与跳过清单（2026-11-15）**：数组形式与 `service_started` 只生成启动顺序（`After=` + `Requires=`，`required: false` 时为 `Wants=`）。`service_healthy` 仅在依赖项有可用 `healthcheck.test` 时给依赖单元加 `Notify=healthy`；没有健康检查、`service_completed_successfully`、未知或非法 condition、缺失依赖目标、非法 `depends_on` 形态都会带稳定 `code` 与 `impact: skipped/degraded`。这些条目同时显示在工作台 `dependency-skip-list`，并写入 ZIP 内 `README.txt`。同一依赖被 `service_started` 与 `service_healthy` 混用时按 degraded 提示 `Notify=healthy` 更严格。
- **21 个静态内容路由（18 个工具页 + 3 个 E-E-A-T 信任与合规页）**：
  1. `/`（Docker Compose to Quadlet 主工作台）
  2. `/podman-quadlet-generator/`（Podman Quadlet 生成器与 AutoUpdate 预设）
  3. `/docker-run-to-quadlet-converter/`（Docker Run / Podman Run 转 Quadlet 转换器）
  4. `/rootless-quadlet-selinux-volume-generator/`（Rootless Quadlet SELinux `:z` / `:Z` 卷生成器）
  5. `/immich-nextcloud-vaultwarden-quadlet-templates/`（Immich / Nextcloud / Vaultwarden 多容器模板）
  6. `/podlet-online-multi-container-network-packager/`（免装 Rust CLI 的在线多容器网络与 ZIP 打包器）
  7. `/quadlet-depends-on-healthcheck/`（`depends_on` `service_healthy` 到 `Notify=healthy`）
  8. `/quadlet-not-starting-on-boot/`（rootless `WantedBy=default.target` 与 linger）
  9. `/podman-pihole-quadlet/`（rootless Pi-hole，端口 53）
  10. `/jellyfin-podman-quadlet/`（既有 Jellyfin docker run 模板，`/dev/dri`）
  11. `/quadlet-vs-docker-compose/`（同一栈对照并链到以上四页）
  12. `/podman-quadlet-secrets-management/`（Podman Quadlet Secret 凭据与加密管理）
  13. `/debug-podman-quadlet-systemd-errors/`（Quadlet 5 级排障诊断决策树与 dryrun 日志排查）
  14. `/traefik-podman-quadlet-reverse-proxy/`（Traefik v3 配合 Rootless Podman Socket 与自动 SSL）
  15. `/rootless-podman-quadlet-permissions-keep-id/`（Rootless 卷权限、UserNS=keep-id 与 subuid 映射）
  16. `/systemd-quadlet-resource-limits-hardening/`（cgroup v2 资源限额 MemoryMax/CPUQuota 与服务安全沙箱）
  17. `/docker-compose-to-podman-quadlet-migration-guide/`（生产迁移白皮书、卷 tar 流式迁移与 Ansible 自动化）
  18. `/docker-compose-volumes-to-quadlet/`（Compose volumes 短语法与长语法到 Volume= 和 .volume）
  19. `/about/`（Podman 4.4+/5.x `podman-system-generator` 规范对齐说明、共享 `.network` 解决 `podlet#190` 跨容器 DNS 原理、100% 本地内存运行架构、非官方声明与 `hello@quadletgen.com` 联系入口）
  20. `/privacy/`（`docker-compose.yml` 与密钥零上传承诺、匿名化 GA4 事件策略、GDPR 与 CCPA/CPRA 权利说明）
  21. `/terms/`（MIT 开源使用条款、上线前测试环境审查 systemd 单元与 SELinux 标签的操作员责任、Linux VPS `rel="sponsored"` 联盟披露规范）
- **全套技术 SEO 与安全静态产物**：站点图标（`favicon.svg`、`favicon-32.png`、`icon-192.png`、`icon-512.png`、`apple-touch-icon.png`，PWA manifest 与结构化数据 logo 已引用）、`404.html`、`sitemap-index.xml`、`robots.txt`、`llms.txt`、`_headers`（含 `workers.dev` 与 `pages.dev` 预览域名 `X-Robots-Tag: noindex` 防串台头）、`og-image.svg`、`og-image.png`（1200x630 栅格化社交浏览卡片）、`github-social-preview.png`（1280x640 GitHub 社交预览卡片）、`site.webmanifest`、`indexnow-key.txt` 以及 `c9d2e4f73a814b629d4c35e8f2a16c53.txt` 双重 IndexNow 探测校验文件。
- **独立 Node ESM CLI 与完整测试套件（`bin/compose-to-quadlet.mjs`、`tests/cli.test.ts`）**：通过 esbuild 独立打包 `src/cli.ts`，支持 `--input`、`--run`、`--stack`、`--scope`、`--selinux`、`--out-dir`、`--stdout`、`--zip` 与 `--help`（指向 `https://quadletgen.com`），并通过 Vitest 11 项端到端 CLI 测试覆盖。
- **全套发布工具包（`LAUNCH_KIT.md`）与 GitHub 准产 `README.md`**：包含 X 25 秒视频分镜与发帖话术、3 条布尔痛点搜索词与价值优先回复模板、Hacker News Show HN 事实备忘、Reddit（r/podman、r/selfhosted、r/linuxadmin）发帖模板、Console.dev 投稿草案及 upstream podlet#190 技术规避评论模版。
- **隐私安全 GA4 漏斗埋点（`BaseLayout.astro`、`src/lib/analytics.ts`）**：基于 `window.dataLayer` 本地队列记录 `config` 与脱敏导出事件（`quadlet_export`），过滤 YAML/凭据参数；在 `127.0.0.1` / `localhost` 下零外网脚本请求。
- **升级版构建后 SEO 门禁（`scripts/seo-preflight.mjs`）**：默认源站 `https://quadletgen.com`，校验全部 20 个内容路由与 12 个静态附属文件（含 `release.json`）、`og-image.png`（>5KB 且校验 PNG 魔数）、`github-social-preview.png`、双重 IndexNow 密钥文件、`og:image` 指向 `/og-image.png`、`_headers` 中的 `noindex` 防护、唯一 `<title>` / `<meta name="description">`、`<link rel="canonical">`、JSON-LD（全部 20 页含 `Organization` + `BreadcrumbList`，17 个工具页含 `WebApplication` + `FAQPage`）、全站内链可达性，以及零残留占位符与零长破折号。
- **Playwright 9 用例端到端套件（`tests/e2e/quadlet.spec.ts`）**：保留原有 8 条，新增工作台 `250ms` 输入防抖与导出/选项切换立即同步 `flush` 一致性核验。
- **GitHub Actions CI 门禁（`.github/workflows/ci.yml`）与独立发布清单兜底（`scripts/release-manifest.mjs`）**：在 `main` 分支 push 与 `pull_request` 上运行 `npm ci`、`npm test`、`npm run build` 与 `npm run seo:check`（带 `concurrency` 取消组）；主工作区保留 `../../40_shared/scripts/indie-release-manifest.mjs` 强校验，独立仓库或外盘 worktree 走仓内 `scripts/release-manifest.mjs` 生成 `dist/release.json`。
- **上线执行手册（`LAUNCH_CHECKLIST.md`）**：涵盖 `quadletgen.com` 注册、Cloudflare Workers 部署、GA4 / GSC / Bing 接入、IndexNow 密钥替换与路由推送，以及 Hetzner / DigitalOcean / Vultr 联盟账号申请与合规接入步骤。当前冻结与构建说明按 14 个索引路由；2026-11-12 的 IndexNow 提交仍是当时的 9 条 URL。
- **发布清单（`release.json`）**：`npm run build` 在 `astro build` 之后执行 `npm run release:manifest`，写入 `dist/release.json`（`project`、`siteUrl`、`routeCount`、`routes` 必须与 `sitemap-0.xml` 一致）。`npm run release:check` 对照线上 sitemap；线上尚无该文件时状态为 `pending_live_manifest`，不能当作线上 commit 已证明。

## 等待站长完成的清单（`[人工]`）

1. **社区首发（预估 40 分钟）**：按 `LAUNCH_KIT.md` 手动发布 Show HN、r/podman、X、Product Hunt。GitHub 仓库当前为公开（`gh repo view`，2026-11-15，`visibility: PUBLIC`）：`https://github.com/liqi199315/compose-to-quadlet`。
2. **P2-1（联盟账号准备，预估 20 分钟）**：站点已可访问。凭 `/about/`、`/privacy/`、`/terms/` 申请 DigitalOcean 与 Vultr 推广链接；Hetzner Cloud 自助推荐计划已停，保持无联盟链接。

## 下一步第一动作

- `[人工]`：从 `LAUNCH_KIT.md` 发社区首发帖（Show HN、r/podman、X、Product Hunt），并开始 DigitalOcean / Vultr 联盟入驻。邮件路由、Bing Webmaster、共享统计登记与四条报表脚本均已在 2026-11-12 核验通过。2026-11-15 已把全部 14 条 URL 重新提交到 IndexNow（HTTP `200`），线上 `/release.json` 与部署 commit `a28274c3ed5f` 匹配。

## 行动记录

- `2026-11-12` `[AI]`：完成孵化期 MVP 6 路由转换器、Vitest 单测与初始 Playwright 4 条 E2E 闭环。
- `2026-11-12` `[AI]`：正式迁入 `30_products/compose-to-quadlet/` 并对齐目标域名 `https://quadletgen.com`；新增 `/about/`、`/privacy/`、`/terms/` 三个 E-E-A-T 信任合规页，升级 `scripts/seo-preflight.mjs`（9 路由 + 8 静态产物 + `og:image` + 全量 JSON-LD 门禁）与 `tests/e2e/quadlet.spec.ts`（扩展至 6 条 E2E，覆盖本地 GA4 `dataLayer` 队列零外网泄漏与 `375x812` 移动端响应式体验），并交付 `LAUNCH_CHECKLIST.md`。
- `2026-11-12` `[AI]`：完成 Slice 3 站点硬化：使用 Playwright 渲染生成 1200x630 `og-image.png` 与 1280x640 `github-social-preview.png`，更新 `BaseLayout.astro` 元标签；更新 `.gitignore` 补充秘密文件防护；在 `public/_headers` 增加 `workers.dev` 与 `pages.dev` 预览域名 `noindex`；创建双重 IndexNow key 文件 `c9d2e4f73a814b629d4c35e8f2a16c53.txt`；使用 esbuild 打包独立 Node ESM CLI `bin/compose-to-quadlet.mjs` 并编写 10 项 Vitest 测试覆盖；升级 `README.md` 与交付 `LAUNCH_KIT.md`；升级 `scripts/seo-preflight.mjs` 断言 PNG 魔数、双重 key 与 headers 防护，并通过 `npm run verify:all` 全量验收。
- `2026-11-12` `[AI]`：生产上线 `https://quadletgen.com`。GA4 Property `564011383`，Stream `16325768198`，Measurement ID `G-PK7MR29S6E`，Key Event `quadlet_export`。Site Verification DNS_TXT 与 GSC `sc-domain:quadletgen.com` 完成，sitemap PUT 204。IndexNow HTTP 202（9 URL）。构建时 `launch-preflight` 与 `seo:check` 均为 `ok: true`。Wrangler 部署 Version ID `5d9f6d3a-eb30-4899-b80c-e671203e5d13`。六种机器人 UA 对首页均为 HTTP 200，`www` 为 301。
- `2026-11-12` `[AI]`：核验邮件路由、Bing Webmaster 与共享统计登记。Zone `8abf0febaad1c30746ddce02a50a660f` 为 `active`；Email Routing `enabled: true, status: ready`，`hello@` 与 `privacy@` 转发到 `liqi199315@gmail.com`，MX/SPF/DKIM 锁定且有 `_dmarc` TXT。`composetoquadlet` 已写入 `../../40_shared/analytics-sites.yaml`（`564011383` / `G-PK7MR29S6E` / `sc-domain:quadletgen.com` / `https://quadletgen.com/`）。Bing `IsVerified: true`（未代理 `verify.bing.com` CNAME），sitemap 经 `SubmitFeed` 提交。`ga4-report.mjs`、`gsc-report.mjs`、`bing-report.mjs`、`analytics-registry.test.mjs` 退出码均为 `0`。剩余 `[人工]`：`LAUNCH_KIT.md` 社区首发与 DigitalOcean / Vultr 入驻。
- `2026-11-12` `[AI]`：上线后最佳实践巡检收口：`wrangler.jsonc` 关闭 `workers_dev` 与 `preview_urls` 并重部署（Version `33147d26-6f16-42e6-a72e-c90d3881c412`，真网验证 `compose-to-quadlet.liqi199315.workers.dev` 已返回 HTTP `404`）；清理 `public/_headers` 无效域名行并对齐 `seo-preflight.mjs` 门禁；通过 GA4 Admin API 注册 `action`、`template` 自定义维度与 `unit_count` 自定义指标；通过 `gh repo edit` 补齐 GitHub 仓库主页、简介与 10 个 Topics，并同步 `PLAN_90DAY.md` 状态。
- `2026-11-13` `[AI]`：新增 5 个长尾工具页（`/quadlet-depends-on-healthcheck/`、`/quadlet-not-starting-on-boot/`、`/podman-pihole-quadlet/`、`/jellyfin-podman-quadlet/`、`/quadlet-vs-docker-compose/`），写入 sitemap 源与站内导航。转换器在 `depends_on.condition: service_healthy` 且依赖项有 healthcheck 时输出 `Notify=healthy`；Jellyfin 既有 docker run 模板补充 `--userns keep-id` 与 `--group-add keep-groups`。Podman 5.8.10 `quadlet -dryrun -user` 已核验生成单元。未部署，未向 IndexNow 重提 URL。容器未实际启动，主机未重启。
- `2026-11-13` `[AI]`：接入 512px 站点图标：新增 `public/icon-512.png`、`icon-192.png`、`apple-touch-icon.png`、`favicon-32.png`，`site.webmanifest` 增加 192/512 PNG 图标，`BaseLayout.astro` 增加 PNG favicon 与 apple-touch-icon 引用，结构化数据 `Organization.logo` 改为 `/icon-512.png`；`npm run verify:all` 退出码 `0`（9 路由 SEO 门禁 `ok: true`，6 条 Playwright E2E 全过）。
- `2026-11-15` `[AI]`：收口 `depends_on.condition` 映射缺口（C06）：`service_healthy` 有可用健康检查时继续输出 `Notify=healthy`；无健康检查、`service_completed_successfully`、未知或非法 condition、缺失目标、非法 `depends_on` 形态改为稳定 `code` + `impact` 警告。工作台新增 `dependency-skip-list`，ZIP（浏览器与 CLI `--zip`）在存在跳过/降级项时写入 `README.txt` 跳过清单。新增 `tests/fixtures/depends-on-conditions.yaml`、`depends-on-invalid.yaml`、`tests/depends-on-conditions.test.ts` 与 Playwright 下载核验。本地 WIP commit `c6ef95f`；`npm run verify:all` 退出码 `0`（Vitest 46 项、14 路由 SEO 门禁 `ok: true`、Playwright 8 项）；`npm run release:check` 状态 `pending_live_manifest`，本地 14 / 线上 14 路由匹配，线上 `release.json` 缺失，commit 未证明。未 push，未部署。
- `2026-11-15` `[AI]`：独立核验前文档收口。主会话最终 `npm run verify:all` 退出码 `0`（46/46、8/8）；共享 release 测试 9/9。发布核对的本地 commit 记为 `c6ef95f`，不是 `82de93d`。线上 `release.json` 缺失，任何本地 commit 未证明已上线。当前流量改为 2026-11-14 实拉 GA4：56 会话、7 互动、0 `quadlet_export`（两天小样本；GSC / Bing 查询未形成）。2026-11-12 私有仓库句标为当时历史。SEO 附属产物改为 12，含 `release.json`。未改代码与测试，未 commit，未 push，未部署。
- `2026-11-17` `[AI]`：完成存量 6 个核心页增厚与 6 个高意图长尾子页面扩充。在 `src/lib/route-presets.ts` 为 `/` 及前 5 个核心预设页补齐 800+ 词深度 `guideSections` 与静态输入/输出样例；在 `src/lib/longtail-presets.ts` 与 `src/lib/sample-templates.ts` 新增 6 个深度子页面（`/podman-quadlet-secrets-management/`、`/debug-podman-quadlet-systemd-errors/`、`/traefik-podman-quadlet-reverse-proxy/`、`/rootless-podman-quadlet-permissions-keep-id/`、`/systemd-quadlet-resource-limits-hardening/`、`/docker-compose-to-podman-quadlet-migration-guide/`）；`src/pages/index.astro` 同步支持预渲染样例与深度指南；`tests/e2e/quadlet.spec.ts` 覆盖全部 11 个长尾路由及移动端 375 视口；全站静态路由扩充至 20 条；`npm run verify:all` 退出码 `0`（Vitest 52/52、20 路由 SEO 门禁 `ok: true`、Playwright 8/8 全过）。未 push，未部署。
- `2026-11-17` `[AI]`：解决 Issue #3 工作台输入零防抖卡顿并补齐 GitHub Actions CI 门禁：新增 `src/lib/debounce.ts` 并在 `src/components/QuadletWorkbench.astro` 为 `compose-input` 与 `stack-name-input` 的 `input` 事件接入 `250ms` 防抖，在下拉/复选框 `change`、模板加载、本地文件上传、切换单元标签页、复制输出/命令与下载 `.zip` 按钮处立即同步 `flush` 待执行转换；新增 `.github/workflows/ci.yml`、独立仓兼容脚本 `scripts/release-manifest.mjs` 及 `scripts/build-cli.mjs` 软链保真配置；补充 `tests/debounce.test.ts` 与 Playwright 防抖刷新端到端用例；本地 Node 22 + Chromium 实测 `npm test`（Vitest 56/56）、`npm run build`、`npm run seo:check`（20 路由 `ok: true`）与 `CI=1 npm run test:e2e`（Playwright 9/9）全部通过。
