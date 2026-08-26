# NoriOS 本地兼容后端

这是一个**本地、可运行的兼容实现**：依据 `https://os.inori.ai/` 公开页面、公开 HTTP 响应和浏览器下载的客户端 bundle，还原 NoriOS Web 客户端实际使用的 Arcade 协议。

它不是上游私有服务端源码的副本，也不会代理、抓取或绕过上游账户与私有数据。

## 已实现

- Arcade WebSocket：`/api/arcade/web/v1`
  - `arcade.v1` + `ticket.<token>` 子协议
  - web world 打开、重置、挂载、卸载、命令分发、版本确认、可见性栅栏和 ping/pong
  - 使用客户端实际校验的 `world_joined`、`runtime_transition`、`dispatch_ack` 等消息结构
- Media WebSocket：`/api/arcade/web/v1/media`
  - `open_media` 授权与已验证的 `chatAudio` 二进制帧格式
- 本地 Better-Auth 兼容端点
  - 会话、开发 OTP、退出、local Convex token
  - 默认自动创建本地访客会话；开发 OTP 默认是 `123456`
- 已根据公开客户端 reducer 实现的运行时卡带
  - `chat`：真实的操作/块/音频确认状态机，支持可选 OpenAI 兼容 API
  - `cakeduel`：基础牌组、回合、声明、质疑、蛋糕结算和本地对手
  - `codenames`：25 格棋盘、线索、翻牌、骤死和本地对手
  - `chess`：合法走子、将杀/和棋/认输/和棋提议/悔棋和本地对手
  - `pictionary`：会话、回合、猜词、跳过和本地状态机
- 静态前端仍使用原有公开资源；只对连接地址和本地 ticket 入口作最小适配。

协议依据、消息字段和证据位置见 [`docs/VERIFIED_PROTOCOL.md`](docs/VERIFIED_PROTOCOL.md)。

## 安装与启动

需要 Python 3.11+（当前项目已在 Python 3.13 测试）和 Node.js（仅用于前端测试）。

```bash
python -m pip install -r requirements.txt
python server.py
```

然后访问：<http://127.0.0.1:4173>

Windows 也可直接运行：

```bat
start.bat
```

## 可选 AI 配置

不配置密钥时，聊天使用本地回退回复。配置 OpenAI 兼容接口后会调用真实模型：

```env
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

## 验证

```bash
# 每个卡带的状态机
python test_cartridges.py

# HTTP、ticket、Arcade WebSocket 和媒体帧
python test_backend_integration.py

# 用原始前端 bundle 内置的 Zod parser 验证服务端消息信封
node test_client_schema.mjs

# Playwright 加载前端并确认 ticket、主 Arcade 和 media WebSocket 都可连接
node test_browser_bootstrap.mjs
```

## 已知边界

- 上游 LLM、真人语音、私有剧情/世界存档、邮箱投递和账号数据库不在公开 bundle 中，无法从公开链接恢复；本地服务使用独立的本地实现。
- 基础 Cake Duel 牌组已实现；公开 UI 默认运行该牌组。上游未公开的服务器端特典牌策略不会被伪装成已恢复功能。
- 本地状态目前按本地用户会话保存在内存中；重启服务会重置该运行时世界。
