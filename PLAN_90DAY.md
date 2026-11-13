# quadletgen.com 90 天增长执行计划（v1.1 准产正式版）

> 本文件实例化自 `../../40_shared/content-site-playbook/TEMPLATE_90DAY_PLAN.md`（薄模板 v0.1）。
> 核心价值在执行纪律与可证伪止损，不在未经验证的增长配方。各节严格保留来源属性标注。

---

## 文档头部约定 【已验证】

| 字段 | 填写 |
|---|---|
| 版本 | v1.1（2026-11-12 迁入 `30_products/compose-to-quadlet/` 并锁定正式域名 `https://quadletgen.com`） |
| 有效期 | 2026-11-12 -> 2027-02-10（90 天试验期） |
| 读者 | **执行 AI**（Kimi Code / Claude Code / Codex）。人类站长 dake 只做标了 `[人工]` 的事 |
| 主增长假设（全站只锁一条） | 围绕主词 `docker compose to quadlet converter` 及 5 个高意图细分场景页（podman quadlet generator、docker run to quadlet converter、rootless selinux volume generator、immich/nextcloud/vaultwarden 模板、podlet online multi-container packager），配合 `/about/`、`/privacy/`、`/terms/` 完整 E-E-A-T 工程信任背书，提供 100% 浏览器本地零上传、自动合成共享 `.network` 单元修复跨容器 DNS（`podlet#190`）、SELinux `:Z` 标签自动推导与一键 ZIP 打包的纯静态工具矩阵，可在上线 90 天内（至 2027-02-10）从 Google 与 Bing 获得近 28 天 >= 300 次非品牌自然搜索点击，且站内 Quadlet 单元导出率（`quadlet_export` 复制或 ZIP 下载事件 / 工具页会话）>= 25%。 |
| 主关键词 | `docker compose to quadlet converter` |
| 变现方式 | Linux VPS 联盟推荐变现（Hetzner Cloud / DigitalOcean / Vultr），在 systemd 运行指引与部署区提供带 `rel="sponsored noopener"` 的合规 VPS 推荐链接；所有联盟申请以已上线的 `/about/`、`/privacy/`、`/terms/` 为合规前置，获批后接入真实推广链接 |
| 止损指标 | 2027-02-10 到期二选一：满足第 7 节任一继续投入量化指标则进入下一周期，全部未达则转挂机维护 |

### Session 开始必读 【已验证】

每个新 session 开始时，按顺序读完再动手：

1. 本计划文件 `PLAN_90DAY.md`（当前版本 v1.1）
2. `NOW.md`（当前状态、实测证据与等待人工清单）
3. `AGENTS.md`（项目工程红线、9 路由契约与共享统计约定）
4. `LAUNCH_CHECKLIST.md`（涉及上线、域名、IndexNow 或 VPS 联盟配置时必读）

读完后才改代码或内容。

### 任务状态流转 【已验证】

每完成一个任务：

1. 把任务表状态从 `待办` 改为 `已完成（YYYY-MM-DD）`
2. 在 `NOW.md` 的「行动记录」段追加一行记录（做了什么、验证命令与证据位置）
3. 重大方向分歧（假设被证伪、要改主增长假设）：**停下来问站长**，不要自行改计划方向

---

## 如何使用本文档（执行 AI 必读） 【已验证】

### 1. 任务表格式

所有可执行工作必须进表，字段固定：

| ID | 任务 | Owner | 状态 |
|---|---|---|---|
| P0-1 | 完成正式版 9 路由静态站、SEO 预检门禁、GA4 脱敏埋点与 6 条 Playwright E2E 闭环 | `[AI]` | `待办` / `已完成（日期）` / `阻塞（原因）` |

- **ID**：阶段前缀 + 序号（如 P0-1、P1-3）。跨文档引用只认 ID。
- **Owner**：
  - `[人工]`：只有站长 dake 能做（`quadletgen.com` 域名注册、Cloudflare 生产部署、GSC/Bing/GA4 建站授权、IndexNow 密钥发布、VPS 联盟账号申请与社区实名发帖）
  - `[AI]`：执行 AI 可独立完成（解析器、页面、信任页、单测、SEO 预检、E2E 测试、数据拉取分析）
  - `[协作]`：AI 起草 + 人工实测/确认，再 AI 收尾
- **状态**：只用 `待办`、`已完成（YYYY-MM-DD）`、`阻塞（原因）` 三种格式，完成必须带日期。

### 2. `[人工]` 依赖处理规则

遇到标 `[人工]` 的前置任务未完成时：

1. **跳过**所有依赖它的任务
2. 先做不依赖人工的任务
3. 在当次回复里明确列出 **「等待站长完成的清单」**（ID + 一句话 + 预估耗时）

禁止：假装人工已完成、用假数据顶替、把 `[人工]` 改成 AI 代做。

### 3. 完成定义

内容或代码改动，**同时满足**才算完成：

1. `npm test` 通过
2. `npm run build && npm run seo:check && npm run test:e2e`（即 `npm run verify:all`）通过
3. `PLAN_90DAY.md` 任务表状态已更新，`NOW.md` 行动记录已追加

未跑通测试与构建即视为未完成，即使代码 diff 已写好。

### 4. 证据与「实测日期」

- 凡声称「已验证 / 实测 / 亲测」的内容，必须写明 **实测日期** 与运行环境（例如本地 Node + Chromium 版本，或线上生产 URL）
- 没有人工线上实测的外部表现，只能标「基于公开资料整理，实测更新中」或「本地构建核验通过，待部署上线」，**禁止**把未上线状态写成线上已验证
- 日期性事实（Podman 4.4+/5.x 版本、Quadlet 规范、systemd 单元字段）变更后优先修正，并更新实测日期
- 不提交密钥、凭据、联盟或广告后台密码；人工只交付「名称 -> 公开站点 ID / 链接配置」清单

### 5. 合规红线（硬约束） 【已验证：必须有本章；条文按站填写】

以下为本站硬约束，违反任一条即立即返工或下线：

1. **100% 浏览器本地零上传保证（Zero-Upload Guarantee）**：全部 Compose YAML 与 `docker run` / `podman run` 命令解析、Quadlet 单元转换、环境变量分离与 ZIP 打包必须在用户浏览器本地内存中执行；严禁把用户粘贴或上传的配置文本、私有镜像名、数据库凭据、内部密钥发送到任何服务端、Cloudflare Worker 接口或第三方统计载荷。
2. **净室 MIT 开源与商标非关联声明合规**：全仓源码、测试夹具、内置模板与页面说明文案均为净室原创实现，统一采用 MIT License；`/about/`、`/terms/` 与页脚必须保留独立第三方工具非官方关联声明（不隶属于 Red Hat、Podman 或 Docker Inc.）。
3. **零人为功能付费墙与真实能力边界**：严禁设置容器数量付费墙、导出文件数量拦截或虚假排队弹窗；工具必须完整支持多容器 Compose 转换为独立 `.container` 与共享 `.network` 单元并本地一键下载 ZIP。
4. **商业推广披露与外链属性合规（Linux VPS 联盟变现）**：接入 Hetzner Cloud、DigitalOcean、Vultr 等 Linux VPS 联盟推荐链接时，页面必须在紧邻位置展示显式推广披露文案（并与 `/terms/` 披露一致），且所有出站商业链接必须声明 `rel="sponsored noopener"`；联盟账号获批前禁止写入伪造推广 ID。
5. **统计凭据隔离与本地零外网请求**：严禁将 `40_shared/googlecount.json` 或 `40_shared/bing-webmaster.key` 拷贝进本仓库；`127.0.0.1` / `localhost` 环境下不得加载外网统计脚本，确保本地测试与隐私校验零外部请求。

### 6. 人工时间预算与断供收缩 【已验证】

| 项 | 填写 |
|---|---|
| 每周人工上限 | <= 1.5 小时（常规周控制在 20 至 40 分钟以内） |
| 连续断供阈值 | 连续 2 周无有效人工投入 |

**断供时 AI 必须主动收缩**：

- 停止新内容、新功能、新分发准备
- 只做：已有 9 个路由保鲜、Podman 新版本 Quadlet 语法兼容修复、安全/合规修复、`NOW.md` 日志更新
- 在 `NOW.md` 中记一行：「进入断供收缩模式，日期=YYYY-MM-DD」

### 7. 止损线与 90 天到期决策 【已验证】

到期日：`2027-02-10`。提前写死，避免情绪化续命。

**继续投入**（2027-02-10 当周核查，满足其一即可）：

- **止损指标 A**：GSC + Bing 近 28 天非品牌自然搜索点击 >= 300 次，且站内 Quadlet 导出动作（`quadlet_export` 复制或 ZIP 下载）>= 100 次/月
- **或 止损指标 B**：任一细分工具页（如 `/docker-run-to-quadlet-converter/` 或 `/immich-nextcloud-vaultwarden-quadlet-templates/`）进入 Google 自然排名前 10 位，且单页近 28 天自然点击 >= 120 次
- **或 止损指标 C**：Linux VPS 联盟推荐（Hetzner / DigitalOcean / Vultr）产生 >= 3 笔真实引流转化或有效注册

**全部未达** -> 转挂机：

- 停止新页面、新功能与外部增长投入
- 只保留 Cloudflare 静态托管、域名续费（若站长决定保留）与必要安全修复
- 把 90 天完整搜索曝光、点击、导出率结论写入 `NOW.md`，正式关闭本试验期

**双周简报 [AI]**（每两周写入 `NOW.md` 最新进展段，缺数据就写「盲」）：

- 核心流量指标：GSC 与 Bing 曝光、非品牌点击、CTR、平均排名（未注册完成前记「盲」，列入等待清单）
- 工具交互与变现事件：模板加载、文件上传、`quadlet_export`（`copy` / `zip`）次数、VPS 联盟点击（无则记 0）
- 9 个路由（重点为 6 个转换工具页）的收录与排名分布 -> 决定下一轮只修标题摘要还是补真实查询词场景页
- 阻塞项与人工断供状态

---

## Phase 骨架 【已验证：阶段节奏；具体题材属各站假设】

阶段节奏固定为：地基 -> 主假设验证 ->（条件触发）变现管道 ->（条件触发）加深护城河 -> 度量与止损。

### Phase 0：准产升级 + 正式上线地基（第 1 周：2026-11-12 至 2026-11-18）

| ID | 任务 | Owner | 状态 |
|---|---|---|---|
| P0-1 | 迁入 `30_products/compose-to-quadlet/`，锁定 `https://quadletgen.com`，补齐 `/about/`、`/privacy/`、`/terms/` 信任合规页、`_headers` / `og-image.svg` / `site.webmanifest` / `indexnow-key.txt`、隐私安全 GA4 `dataLayer` 埋点、9 路由 `seo-preflight.mjs` 门禁及 6 条 Playwright E2E（含移动端 `375x812` 与零外网请求验证），编写 `LAUNCH_CHECKLIST.md` | `[AI]` | `已完成（2026-11-12）` |
| P0-2 | 按 `LAUNCH_CHECKLIST.md` 注册 `quadletgen.com`，配置 `hello@quadletgen.com` 与 `privacy@quadletgen.com` 邮件路由，关闭 `workers_dev` 子域并运行 `npm run cf:deploy` 完成线上 HTTPS 部署 | `[协作]` | `已完成（2026-11-12）` |
| P0-3 | 配置 Google Search Console（`sc-domain:quadletgen.com`）、Bing Webmaster Tools 与 GA4 站点属性（`564011383` / `G-PK7MR29S6E` + 自定义维度/指标），提交 `sitemap-index.xml`，推送全部 9 个 URL 至 IndexNow，并登记至 `../../40_shared/analytics-sites.yaml` | `[协作]` | `已完成（2026-11-12）` |
| P0-4 | 基于 `P0-3` 提供的公开统计配置，跑通 `npm run ga4:report`、`npm run gsc:report`、`npm run bing:report` 首轮连通性检查并记录新站零基线（依赖 P0-2、P0-3） | `[AI]` | `已完成（2026-11-12）` |
| P0-5 | 复核 6 个工具路由与 3 个信任路由的 `<title>`、`<meta name="description">` 与 `<h1>` 关键词覆盖，上线后锁定 28 天观察窗口（至 2026-12-10 前不重复改标题） | `[AI]` | `已完成（2026-11-12）` |
| P0-6 | 在 `NOW.md` 记录进入 90 天正式产品试验模式、准产资产清单与首周等待人工清单 | `[AI]` | `已完成（2026-11-12）` |

**Phase 0 验收**：本地 `npm run verify:all` 全绿；主假设一句话锁死；`LAUNCH_CHECKLIST.md` 可直接照表执行；线上部署与搜索控制台提交完成（或未完成项已明确列在等待人工清单中）。

### Phase 1：主假设验证（第 2 至 6 周：2026-11-19 至 2026-12-23）

| ID | 任务 | Owner | 状态 |
|---|---|---|---|
| P1-1 | 上线第 14 天拉取 GSC 与 Bing 收录状态，核查全部 9 个路由（6 个核心转换器路由 + `/about/`、`/privacy/`、`/terms/`）是否全部入库（依赖 P0-4） | `[AI]` | `待办` |
| P1-2 | 基于前 28 天真实搜索词报告，识别高曝光低点击查询词，针对性补充对应 Podman 4.4+/5.x 选项（如 `--cap-add`、`--security-opt`、Quadlet `AutoUpdate=registry`、`.pod` 单元对照）排查 FAQ 与命令对照表（每次改动 <= 2 页，遵守 28 天标题冻结期；依赖 P1-1） | `[AI]` | `待办` |
| P1-3 | 根据 GSC 真实浮现的自托管应用 Quadlet 查询（仅限有真实曝光证据的场景，如 Jellyfin、Home Assistant、Traefik 等），新增 1 至 2 个高意图模板子路由并通过 `verify:all`（依赖 P1-1） | `[协作]` | `待办` |
| P1-5 | 按站长明确要求新增 5 个长尾工具页（healthcheck depends、boot linger、Pi-hole、Jellyfin、Quadlet vs Compose），并在转换器中为 `condition: service_healthy` 写出 `Notify=healthy`。此条不是 P1-3 的 GSC 证据触发，不改主增长假设 | `[AI]` | `已完成（2026-11-13）` |
| P1-D1 | 若站长选择启用技术社区发布：AI 起草面向 Podman / Fedora / 自托管开发者的纯技术帖草稿（聚焦浏览器本地零上传、自动共享 `.network` 解决 `podlet#190` 跨容器 DNS、SELinux `:Z` 推导），站长用自有账号实名发布并回复评论，7 日后 AI 汇总引流与 `quadlet_export` 导出数据 | `[协作]` | `待办` |

**Phase 1 验收（第 6 周末：2026-12-23）**：

- 已上线且被搜索引擎正式收录的工具页面 >= 6 个（全站收录 >= 8 个）
- 近 28 天非品牌自然搜索曝光 >= 1,500 次、自然点击 >= 80 次，且 `quadlet_export` 导出动作可观测
- 未达标 -> 不启动 Phase 3，先根据真实收录与查询词数据复盘主假设

### Phase 2：变现管道（以线上信任页合规为前提，第 2 至 8 周：2026-11-19 至 2027-01-06）

| ID | 任务 | Owner | 状态 |
|---|---|---|---|
| P2-1 | 站点上线后凭 `/about/`、`/privacy/`、`/terms/` 页面申请 Hetzner Cloud、DigitalOcean、Vultr 联盟/推荐链接（只把公开推广目标链接交给 AI，不交后台密码；预估耗时 20 分钟；详见 `LAUNCH_CHECKLIST.md`） | `[人工]` | `待办` |
| P2-2 | 在 Quadlet 部署指引区接入获批的真实推广链接，核验显式推广披露文案、`rel="sponsored noopener"` 属性与脱敏出站点击事件，确保零遮挡主转换操作（依赖 P2-1） | `[AI]` | `待办` |
| P2-3 | 起草针对 Fedora / RHEL / Debian / Ubuntu Rootless Podman 容器运行的最佳 VPS 规格对照说明（内存、SELinux / AppArmor 默认策略），经站长确认后上线观测点击率（依赖 P2-2） | `[协作]` | `待办` |

**Phase 2 验收**：主转换与 ZIP 下载路径零受阻；推广披露清晰可见且与 `/terms/` 一致；VPS 联盟链接出站点击可统计。

### Phase 3：加深护城河（第 6 至 10 周：2026-12-24 至 2027-01-27，**有触发条件**）

**触发条件**：Phase 1 验收全部达标才启动；否则继续优化现有 6 个工具路由搜索匹配或提前进入止损复盘。

| ID | 任务 | Owner | 状态 |
|---|---|---|---|
| P3-1 | 新增浏览器本地多服务 systemd 依赖链路图与 `.pod` / `.timer` 单元可选生成能力（全程内存处理、零服务端上传） | `[AI]` | `待办` |
| P3-2 | 新增 Ansible / Ignition（Fedora CoreOS）一键部署 Quadlet 单元脚本生成预设与测试覆盖 | `[AI]` | `待办` |

### Phase 4：度量、保鲜、止损（持续至 2027-02-10）

- **内容与语法保鲜 `[AI]`**：每季度（及 Podman 大版本发布当周）核查 Podman Quadlet 最新单元字段与弃用语法；若有变更当天更新转换引擎单测与页面实测日期。
- **标题实验纪律 `[AI]`**：任何路由 `<title>` 与 `<meta name="description">` 修改后，28 天内禁止连续改第二次。
- **到期止损裁决 `[协作]`**：`2027-02-10` 对照第 7 节止损指标 A/B/C 做二选一裁决，不拖延。

---

## 可选策略工具箱 【未验证假设】

> **不是推荐做法，不是默认流程。**
> 下列条目仅为可选策略储备，在本站尚未被线上真实数据证明有效。
> 选用前必须确认服务于唯一主增长假设、满足适用条件并由站长接受对应风险；一旦进入任务表，仍严格执行上文 `[人工]` / `[AI]` 分工、完成定义与止损纪律。

| 工具 | 一句话说明 | 适用条件 | 主要风险 |
|---|---|---|---|
| 页面类型矩阵（枢纽 / 语法专页 / 热门模板 / FAQ） | 按「输入源 x 目标场景」规划工具子路由 | GSC 或关键词调研已有真实搜索量证据，且每页有独立默认预设、真实差异化样本与专属说明 | **严禁无搜索需求证据的程序化批量铺页**；同质化薄页会拖累整站收录与域名权重 |
| 社区分发（Reddit `r/podman`、`r/selfhosted`、HN Show、X） | 上线初期向容器与自托管开发者社区介绍免装 CLI 的本地转换工具 | 站长拥有真实活跃账号、遵守版规并亲自回复技术提问 | 严禁机械群发或伪装路人自推；无人工互动预算时不做 |
| Linux VPS 联盟变现漏斗 | 本地生成 Quadlet 单元 -> 在 systemd 部署指引区轻量推荐高性价比 Linux VPS | 联盟账号已获批、披露合规、推荐主机确有良好 SELinux / Podman 体验 | 广告过多易损伤技术工具信任度；未获批前严禁放假链接 |
| 可交互工具对冲 AI Overview 零点击 | 首屏直接提供 YAML / Docker run 粘贴、SELinux 选项实时切换与即时 ZIP 下载，解决纯文本回答无法一键打包落地的问题 | 转换器保持零登录、毫秒级响应且支持复杂多容器网络 | 不能假定「有工具就必有自然排名」，仍需持续跟踪实际收录与点击转化 |
| 团队基础设施迁移 / 咨询入口 | 面向需要将 Docker Compose 批量迁移至 Podman Quadlet 的团队提供企业咨询入口 | 站长确有交付时间与明确 SLA、免责声明完备 | 早期流量低时询盘极少，过早建设复杂表单沉没成本高 |
| GEO / 机器可读增强（`Organization`、`BreadcrumbList`、`WebApplication`、`FAQPage`、`llms.txt`） | 帮助搜索引擎与大模型准确识别 QuadletGen 支持的转换语法与本地隐私特性 | 页面本身已有扎实可运行的转换工具与清晰文档 | AI 引用流量难以精确归因，仅作结构化辅助，不可替代主假设验证 |

---

## 风险清单 【结构已验证；条目按站改】

1. **Podman 语法大版本变更导致生成的 Quadlet 单元指令过时** -> 缓解：`src/lib/` 解析与生成层对齐 Podman 4.4+/5.x `podman-systemd.unit(5)` 规范，内置核心单元单测，每季度复核官方发布说明。
2. **新域名 `quadletgen.com` 沙盒期长，前 4 周 Google 收录缓慢** -> 缓解：上线当天同步提交 GSC `sitemap-index.xml`、Bing Webmaster 与 IndexNow 9 路由即时推送，保持全静态零阻塞渲染与完整内链互通。
3. **官方 `podlet` CLI 或 Podman Desktop 原生功能分流开发者需求** -> 缓解：突出免装 Rust 环境或桌面应用、即开即用、自动生成共享 `.network` 解决 `podlet#190` 跨容器 DNS、一键切换 SELinux `:Z` 卷标签、分离 `.env` 密钥与一键打包 ZIP 的组合便利度。
4. **站长时间断供** -> 缓解：严格执行每周 <= 1.5 小时上限与第 6 节「连续 2 周无人工投入自动进入断供收缩模式」。
5. **主增长假设在 90 天窗口内证伪** -> 缓解：`2027-02-10` 严格按第 7 节止损指标执行转挂机，若需更换主假设必须经站长批准新建 v2.0 计划，禁止静默篡改指标。

---

## 事实审计（FACT_AUDIT）与来源属性纪律 【已验证】

### 1. 准产事实审计（2026-11-12）

- **站点定位与目标线上 URL**：`https://quadletgen.com`（正式产品目录 `/Users/dake/Projects/aiapp/30_products/compose-to-quadlet/`），定位为 100% 浏览器本地运行的 Docker Compose / Docker Run 转 Podman Quadlet 转换器与 systemd 单元打包工作台。
- **近 28 天流量 / 收入 / 转化基线**：**盲**（截至 `2026-11-12` 本地准产构建、E-E-A-T 信任页、移动端响应式与隐私安全埋点已就绪，待站长完成 `quadletgen.com` 注册、Cloudflare 生产部署及 GSC/Bing/IndexNow/GA4 接入）。
- **已有内容与技术资产**：Astro 5 静态架构（`output: 'static'`、`trailingSlash: 'always'`），Cloudflare Workers Static Assets 部署配置（`wrangler.jsonc`），覆盖 6 个高意图工具路由 + 3 个信任合规页（`/about/`、`/privacy/`、`/terms/`）、8 个附属静态文件（`404.html`、`sitemap-index.xml`、`robots.txt`、`llms.txt`、`_headers`、`og-image.svg`、`site.webmanifest`、`indexnow-key.txt`）、`scripts/seo-preflight.mjs` 构建后预检与 6 条 Playwright Chromium E2E 测试套件。
- **核心差异化与红线锚点**：许多开发者在向 Podman 迁移时受阻于编写 systemd Quadlet 语法、隐式网络跨容器 DNS 失效（`podlet#190`）及 SELinux 卷权限问题；QuadletGen 提供零服务端上传、无需安装 CLI、自动合成共享 `.network` 单元、一键推导 SELinux 卷标签并直接打包 ZIP 的纯静态工具，坚持 100% 本地内存运算与净室 MIT 开源实现。

### 2. 来源属性纪律

| 标记 | 含义 | 本计划中的执行规则 |
|---|---|---|
| 【已验证】 | 执行契约层：任务表、人工依赖跳过规则、自动化测试完成定义、实测日期规范、合规红线、<=1.5h/周人工预算、断供收缩、90 天止损线 | 作为强制默认流程执行，不跳过任何一步 |
| 【未验证假设】 | 增长策略、扩展页型、社区分发、商业化漏斗与 GEO 引用 | 仅保存在「可选策略工具箱」中按条件启用，不得在无数据支撑时当成必做默认配方 |
