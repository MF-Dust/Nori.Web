# 多人联机（Multiplayer）

四个小游戏（国际象棋、森林寻宝 Codenames、蛋糕对决 Cake Duel、你画我猜 Pictionary）支持两名真人联机：访客占据原本由 Nori（actor `"agent"`）使用的席位。功能默认关闭，在 **设置 → 多人联机 → 启用多人模式** 中开启后，游戏窗口左下角会出现“联机”按钮。

## 架构

```
访客浏览器                      房主浏览器                         房主后端 (nori-local / Worker)
GameCartridgeController   ←→   HostBridge  ── dispatch(actor="agent") ──→  World
  └ GuestArcade(WorldStore)     (WebRTC DataChannel / EasyTier)  ←── multiplayer.remote_view ──┘
```

- **房主权威**：只有房主连接后端。访客的命令经点对点链路发给房主，由房主以 `agent` 身份提交；访客永远不接触房主的后端或会话凭据。
- **席位租约**：房主发送事件 `multiplayer.remote_opponent {cartridgeId, enabled, leaseMs}`。租约有效期间（最长 2 分钟，房主每 30 秒续约）后端不调度 Nori 的回合、你画我猜的 AI 猜词和视觉识别。租约随世界快照持久化，可跨 Durable Object 休眠；房主离开或失联后租约过期，Nori 自动接管未完成的回合。
- **视角投影**：租约期间，每次提交都会额外广播 `multiplayer.remote_view`，内容是把原始状态做 player↔agent 交换后，再经过原有脱敏投影（`client_view` / `client_transition`）的结果。访客因此看到自己的手牌/密钥，看不到房主的私有信息（`rust/crates/nori-core/src/multiplayer.rs`）。
  - 国际象棋：翻转 `settings.playerSide`，结果事件 win/loss 互换。
  - Codenames：交换 `counterpartSide` / `agentSide`，事件 `by` 互换（合作模式，结果不翻转）。
  - Cake Duel：交换 `players[0/1]` 与所有座位索引，移除 Nori 的表情 tell，清除调试场景。
  - Pictionary：只交换 `drawer` / `guesser` / `by` 字段（猜词文本不变）。笔迹通过点对点链路直接同步，不经过后端。
- **访客镜像**：`GuestArcade` 实现与真实 `ArcadeClient` 相同的 `ArcadeChannel` 接口，把房主转发的快照写入独立的 `WorldStore`，现有游戏控制器与界面无需改动；游戏窗口在切换为访客时重新挂载。
- **权限**：访客只能发送对局内操作（走子、出牌、提示/猜测、认输等，见 `frontend-src/multiplayer/protocol.ts` 中的 `GUEST_COMMANDS`）。开始、重置、教程和调试场景只由房主操作；联机期间房主也不能启动依赖 Nori 的教程/调试场景。版本冲突时不转发包含房主视角的 `runtimes`，而是重新下发访客视角快照。

## 网络通道

### WebRTC（默认）：直连优先，TURN 回退

1. 房主点击“创建房间”，生成邀请码（压缩后的 SDP offer，包含已收集的 ICE 候选）。
2. 访客粘贴邀请码，生成回复码并发回房主。
3. 房主粘贴回复码，DataChannel 建立。

一次协商同时携带 host / srflx（STUN 打洞直连）与 relay（TURN）候选。ICE 会优先选中直连候选对，只有直连全部失败时才使用 TURN 中继，因此回退不需要第二轮信令。连接后面板显示实际路径（直连 / TURN 中继）与往返延迟。

- STUN 默认：`stun:stun.cloudflare.com:3478`、`stun:stun.l.google.com:19302`，可在设置中修改。
- TURN 需要自行提供（例如 coturn），在设置中填写地址、用户名与密码。未配置 TURN 时，对称 NAT 等严格网络可能无法连接。
- “仅使用 TURN 中继”会设置 `iceTransportPolicy: "relay"`，不暴露本机/公网地址（需已配置 TURN）。
- TURN 凭据保存在本机 `localStorage`（`multiplayer-settings`），不会发送给后端；邀请码只包含 SDP，不包含凭据。

### EasyTier WASM（实验性）

EasyTier 目前没有官方的浏览器数据面构建，因此本项目不内置 EasyTier。打开“实验性 EasyTier 通道”后，可以填写一个自行构建的 ES Module 地址（同源或 HTTPS），该模块需导出：

```ts
export async function createChannel(options: {
  networkName: string; networkSecret: string; peers: string[];
  room: string; role: "host" | "guest";
}): Promise<{
  send(message: string): void;
  onMessage(listener: (message: string) => void): void | (() => void);
  ready: Promise<void>;              // 与对端的可靠有序流已建立
  onClose?(listener: (reason?: string) => void): void | (() => void);
  close(): void;
}>;
```

EasyTier 邀请码包含房间号、网络名称、网络密钥与节点地址（请仅在私聊中分享），访客使用自己配置的模块地址加入，无需回复码。该通道不保证稳定，出现问题请切回 WebRTC。

## 已知限制

- 界面文案中对手仍显示为 “Nori”。
- 你画我猜的渐进提示只对房主（player 席位）生效；访客猜词时没有字母提示。
- 无回合计时与掉线判负：对方失联超过 20 秒会结束会话，未完成的回合交还 Nori。
- 房主浏览器可以在开发者工具中看到发往访客的视角数据；联机以互相信任为前提。

## 验证

```sh
npm run test:rust                      # 包含 tests/multiplayer.rs 与 multiplayer.rs 单元测试
npm run frontend:games:test            # 包含 tests/frontend/frontend-multiplayer.test.ts
npm run frontend:multiplayer:webrtc    # Chromium 中两个真实 RTCPeerConnection 经邀请/回复码直连
```
