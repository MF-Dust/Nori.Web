# Nori.Web - NoriOS 本地兼容后端与离线服务

[![GitHub](https://img.shields.io/badge/GitHub-MF--Dust%2FNori.Web-blue?logo=github)](https://github.com/MF-Dust/Nori.Web)
[![Python](https://img.shields.io/badge/Python-3.11%2B-brightgreen?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> *“要我和命运交换戒指，我说：到此为止。*  
> *穿过流言喧哗与停服风沙，不管世事变化，她依然是她。*  
> *所有未知，都是下一个开始。”*

这是一个针对 `https://os.inori.ai/` 公开前端资源的**本地完整运行环境与 Arcade 协议兼容后端**。通过还原客户端实际调用的 WebSocket 与 HTTP 协议，实现离线/本地运行桌面系统、Nori Live2D 交互以及内置卡带小游戏。

---

## ✨ 核心特性

- **完整 Arcade 运行时架构**
  - **主通道 WebSocket (`/api/arcade/web/v1`)**：支持 `arcade.v1` 子协议、ticket 校验、世界生命周期管理（创建/加入/重置/挂载/卸载）、版本栅栏同步与双向事件分发。
  - **媒体流 WebSocket (`/api/arcade/web/v1/media`)**：支持 `open_media` 授权与 `chatAudio` 二进制音频帧推送。
  - **Better-Auth 兼容**：内置本地会话、访客自动登录、开发 OTP 验证及 Convex 兼容端点。
- **Cloudflare Workers 部署支持**
  - Python Workers + FastAPI ASGI 后端。
  - Workers Static Assets 托管 SPA、Live2D、音效和桌面资源。
  - Durable Objects 将同一 Arcade ticket 的主通道与媒体通道路由到同一状态所有者。
  - 签名 WebSocket ticket 可跨 Worker isolate 验证，不依赖单进程内存。
- **全套内置卡带状态机 (Cartridges)**
  - 💬 **Chat**：支持操作/分块/音频确认状态机，可无缝对接 OpenAI 兼容接口，未配置时提供本地智能回退。
  - 🍰 **Cake Duel**：支持完整基础牌组规则、回合轮替、虚张声势/质疑机制、蛋糕结算与本地 AI 对手。
  - 🌲 **Codenames**：25 格词牌、红蓝对抗、队长提示、翻牌判定、骤死结算与本地 AI 对手。
  - ♟️ **Chess**：基于 `python-chess` 引擎实现全套国际象棋规则（合法着法、将军、将杀、和棋、悔棋及本地对手）。
  - 🎨 **Pictionary**：内置画板笔迹播放、猜词判词与回合流转控制。
  - 🌐 **Manifold**：全套桌面事实（Facts）与应用解锁状态同步。
- **虚拟应用与静态资源集成**
  - 集成 Files、Browser、Mail、Messenger、Terminal 等系统虚拟应用。
  - 完整包含 Live2D 模型（Nori / ARGNori）、表情动作、音频音效（SFX/BGM）与桌面主题资源。

---

## 🚀 本地运行

### 运行环境要求
- **Python** 3.11 或更高版本（已在 Python 3.11 / 3.13 验证）
- **Node.js**（可选，仅用于执行客户端 Schema 与浏览器端端到端测试）

### 1. 安装依赖

```bash
git clone https://github.com/MF-Dust/Nori.Web.git
cd Nori.Web
python -m pip install -e ".[local]"
```

也可以使用 `uv`：

```bash
uv sync --extra local
```

### 2. 启动服务

**直接运行 Python 服务：**
```bash
python server.py
```

**Windows 用户便捷启动：**
双击运行根目录下的 `start.bat`。

启动成功后，在浏览器中打开：👉 **<http://127.0.0.1:4173>** 即可体验。

---

## ☁️ Cloudflare Workers 部署

项目根目录已经包含 `worker.py` 与 `wrangler.jsonc`，部署结构如下：

```text
Browser
  ├─ /assets, Live2D, audio ... → Workers Static Assets
  ├─ /api/*                    → FastAPI / Python Worker
  └─ Arcade WebSocket          → Durable Object per signed ticket
```

### 1. 准备 Cloudflare Python Workers 环境

需要安装 Node.js 与 `uv`，然后同步 Worker 依赖：

```bash
uv sync --group dev
```

### 2. 本地运行 Cloudflare Worker

```bash
uv run pywrangler dev
```

### 3. 配置部署 Secret

生产部署建议至少设置一个独立的 `SECRET_KEY`，用于签名 Arcade WebSocket ticket：

```bash
uv run pywrangler secret put SECRET_KEY
```

如需启用 OpenAI 兼容接口：

```bash
uv run pywrangler secret put OPENAI_API_KEY
```

`OPENAI_BASE_URL` 和 `OPENAI_MODEL` 可以继续放在 Workers Vars 中；代码会从 Cloudflare runtime bindings 动态读取这些配置。

### 4. 部署

```bash
uv run pywrangler deploy
```

Cloudflare 部署默认设置 `NORI_DISABLE_LIVE_PACK=1`，因此不会加载本地账号的 `live_world_pack.json` 内容。若是私有部署并明确希望启用归档，可修改 `wrangler.jsonc` 中对应变量。

> Cloudflare Worker 使用 Durable Object 保持一个 Arcade ticket 对应的实时世界状态。当前世界本身仍是内存状态；代码更新、Durable Object 重启或连接生命周期结束后，不保证跨实例持久化。

---

## ⚙️ 可选配置 (AI 对话)

默认情况下，聊天卡带使用本地回退回复规则。如需启用大语言模型对话，可在本地环境变量中配置 OpenAI 兼容 API：

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

Cloudflare Workers 部署请使用上一节的 Workers Secret / Vars。

---

## 📂 目录结构

```text
Nori.Web/
├── backend/                  # Python 兼容服务端核心
│   ├── api/                  # API 路由层 (Arcade WS, Better-Auth, Convex, System, Static)
│   ├── cartridges/           # 领域卡带层与注册中心 (Chat, CakeDuel, Chess, Codenames, Manifold, Pictionary)
│   ├── core/                 # 核心基础设施层 (Config, Media, Protocol)
│   ├── services/             # 领域应用服务层 (EventDispatcher, LLMService)
│   ├── session/              # 运行时会话层 (WorldSession, WorldManager)
│   ├── virtual_apps/         # 虚拟应用服务 (Browser, Files, Mail, Messenger, Terminal)
│   └── data/                 # 词库与运行时资源
├── docs/                     # 协议逆向与技术文档
│   └── VERIFIED_PROTOCOL.md  # 协议格式、消息信封与字段详解
├── public/                   # 前端静态资源 (Live2D 模型、音效、UI 资源与脚本)
├── tests/                    # 规范化测试套件
│   ├── test_cartridges.py    # 卡带状态机单元测试
│   ├── test_virtual_apps.py  # 虚拟应用与事件分发单元测试
│   ├── test_backend_integration.py # 后端协议与 WebSocket 集成测试
│   ├── test_client_schema.mjs# 前端 Zod 校验规则验证
│   └── test_browser_bootstrap.mjs # 浏览器全流程引导测试
├── server.py                 # 本地 FastAPI / Uvicorn 入口
├── worker.py                 # Cloudflare Python Worker / Durable Object 入口
├── wrangler.jsonc            # Cloudflare Workers 配置
├── pyproject.toml            # Python / Worker 依赖清单
├── package.json              # 测试与辅助脚本配置
└── start.bat                 # Windows 一键启动脚本
```

---

## 🧪 测试与验证

项目提供多层级的自动化测试套件：

```bash
# 1. 验证所有卡带状态机核心逻辑
python tests/test_cartridges.py

# 2. 验证虚拟应用与 Manifold 事件分发
python tests/test_virtual_apps.py

# 3. 验证 REST 端点、Ticket 机制、Arcade WebSocket 与媒体流
python tests/test_backend_integration.py

# 4. 使用前端 bundle 内置的 Zod parser 校验服务端消息信封
node tests/test_client_schema.mjs

# 5. 执行完整测试套件
npm test
```

---

## 🌐 线上世界归档导入 (live_world_pack)

本项目支持将 `https://os.inori.ai/` 的真实个人存档合入离线运行时：

- 数据包：`backend/data/live_world_pack.json`（由 `python scraper/import_pack.py` 从 `live_archive/` 生成）
  - 📮 生产环境邮件 artifacts（15 封）
  - 💬 Signal 线程与消息（6 会话 / 36 条）
  - 🗂️ 文件系统对象（46 个，含全文与加密元数据）
  - 🌐 内置浏览器完整站点链接图谱（354 页，`pages/*.json`）
  - 🖥️ 剧情 facts（120 条含 emittedAt/actor/source）与运行时变量、芯片状态
  - 静态资源自动合并至 `public/webAssets/**`
- 加载器：`backend/virtual_apps/live_pack.py`（mail / files / messenger / browser / manifold 全部接入）
- 关闭档案回退到内置演示数据：设置环境变量 `NORI_DISABLE_LIVE_PACK=1`

抓取工具链位于 `scraper/`：`scrape_all.py`（WS 全量抓取）、`scrape_pass2.py`（浏览器链接图谱闭包）、
`generate_report.py`（可读报告）、`import_pack.py`（生成本地数据包）。
原始通信记录与站点页面归档见 `live_archive/`（已加入 `.gitignore`）。

---

## 🧠 补全的后端剧情引擎

在档案数据之上，后端现在实现了与线上语义对齐的完整运行时逻辑：

| 能力 | 说明 |
|---|---|
| 事实记录发射 | `client.emitFact` 命令按生产格式落盘 `{id, emittedAt, actor, source}`；来源按命名空间自动推导（`mail.read` / `signal.*` / `vault.unlock` / `nas.*` …），幂等不覆盖首次时间戳，并广播 `factEmitted` 事件 |
| 变量补丁 | `patchVariables` / `system.patchVariables` 合入 variables 并广播 |
| idle 同步 | `idle.sync` 通道持久化 idle 存储快照、回传 prestige、并广播 runtime_transition |
| 芯片模拟 | 容量/热量/冷却计时器真实建模：`chip.scan` 支持 readout / unsupported / fried 三态与扫描缓存（归档中的 17 条历史扫描指纹可精确命中）；`debug_scan / debug_reset / debug_config` 可强制读取、复位与调参 |
| 赏金提交 | `manifold.bounty.submit` 对档案工件/蜜罐 URL 做真实性校验后授予对应事实（如 `arg.honeypot_access`） |
| 终端文件系统 | 由档案文件工件的 `display_path` 重建目录树（文稿/下载/RSRCH-COLD-VOL…），`ls/cat` 直接阅读全文，坏档保留原始乱码负载 |
| Ambient 调度 | `ambient.trigger` 返回安静间隔/冷却/会话预算；`ambient.debug_config` 持久化调参到 variables |
| 通用命令路由 | `manifold.command.request` 泛型 RPC：书签增删查、邮件/信号已读、vault 解锁等别名命令均走真实事实管线；未知命令宽容应答避免前端超时 |
| 事实变更推送 | 发射事实时附带广播 `manifold.facts.changed`（含 snapshot）与受影响类型的 `manifold.artifacts.invalidated` |
| 芯片事务化 | 扫描/调试操作改为 manifold.web 可提交事务，热量变化以 `chip.status.changed` 事件广播至所有连接 |
| 桌面外壳事件 | `nori_open_game/close_game/talk.request` 正确应答（talk 默认 noop），游戏启动记录进 variables；`notification.debug.push` 转播为真实 `notification.pushed` 广播 |

新增测试：`tests/test_live_backend_logic.py`（双模式自检）。

---

## ⚠️ 免责声明与已知边界

0. 本仓库现包含作者本人账号的世界存档快照（`backend/data/live_world_pack.json` 与 `public/webAssets/**` 下新抓取的站内静态资源），仅用于个人离线保存与研究，相关剧情文本与美术素材版权归原项目方所有；如需公开发布请自行裁剪。
1. 本项目为独立重构的开源本地兼容实现，**不包含、不代理、也不绕过**上游私有服务端、用户数据库、私有剧情及未公开特权。
2. 聊天卡带中的对话与角色回复依托于本地规则或用户自配的 LLM 接口，与官方云端服务无关。
3. 本地运行时世界状态按会话保存在内存中；Cloudflare 部署会用 Durable Object 隔离同一 ticket 的实时状态，但当前仍不提供跨重启持久化。
