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

## 🚀 快速开始

### 运行环境要求
- **Python** 3.11 或更高版本（已在 Python 3.11 / 3.13 验证）
- **Node.js**（可选，仅用于执行客户端 Schema 与浏览器端端到端测试）

### 1. 安装依赖

```bash
git clone https://github.com/MF-Dust/Nori.Web.git
cd Nori.Web
python -m pip install -r requirements.txt
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

## ⚙️ 可选配置 (AI 对话)

默认情况下，聊天卡带使用本地回退回复规则。如需启用大语言模型对话，可在环境变量或 `.env` 中配置 OpenAI 兼容 API：

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

---

## 📂 目录结构

```text
Nori.Web/
├── backend/                  # Python 兼容服务端核心
│   ├── api/                  # API 路由层 (Arcade WS, Better-Auth, Convex, System, Static)
│   ├── cartridges/           # 领域卡带层与注册中心 (Chat, CakeDuel, Chess, Codenames, Manifold, Pictionary)
│   ├── core/                 # 核心基础设施层 (Config, Media, Protocol)
│   ├── services/             # 领域应用服务层 (EventDispatcher, LLMService)
│   ├── session/              # 运行时会话层 (WorldSession, WorldManager, Ticket)
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
├── server.py                 # FastAPI 入口服务
├── requirements.txt          # Python 依赖清单
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

# 5. 执行完整测试套件 (需安装 Node 依赖)
npm test
```

---

## ⚠️ 免责声明与已知边界

1. 本项目为独立重构的开源本地兼容实现，**不包含、不代理、也不绕过**上游私有服务端、用户数据库、私有剧情及未公开特权。
2. 聊天卡带中的对话与角色回复依托于本地规则或用户自配的 LLM 接口，与官方云端服务无关。
3. 本地世界状态目前按会话在内存中维护，重启服务将重置本地世界状态。
