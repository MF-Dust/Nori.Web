# PR #43 前端源码还原完整执行计划

制定日期：2026-09-18  
仓库：MF-Dust/Nori.Web  
执行分支：`dev/frontend-remaining-recovery`  
目标 PR：[PR #43](https://github.com/MF-Dust/Nori.Web/pull/43)  
审计基线：`94107bbf0b33911c519b50670664115c1a4efd47`  
状态：实施中。六段正式剧情已接入源码；浏览器、视觉和原版代理验收仍按下述标准逐项核实。

## 当前续作记录（源码实现批次）

在 `dev/frontend-restoration-completion` 上继续实施了共享通知、Signal artifact 到达观察、Messenger pending-focus、窗口/Browser 生命周期、订阅清理、窄 Settings、损坏 PDF 和音频焦点解锁等修复。通知与 Messenger surface 已有单元/Chromium 证据；Farewell/Ending 资源重试和隐藏页 readiness 也有 focused probe 证据。五项 cutover gate 仍按实际证据保持 `false`，本批次没有提前切换 `public/index.html`。`frontend:recover:check` 仍需在最终合并前重复，任何 shipped marker 失败都按证据修正而不是放宽检查。

## 1. 目标、范围与完成口径

目标是将当前发布客户端的前端行为恢复为 `frontend-src/` 中可维护、可构建、可验证的源码，完成视觉和交互对照，最终具备替换历史生产入口的条件。恢复依据为仓库中的 shipped bundle、静态资源、协议、源码和可复现运行证据；不声称找回开发者最初的源文件。

执行继续使用 PR #43。保留已有提交，新增可单独审阅和回退的提交，不直接修改 master，不强制覆盖分支。本文规划到切换验收及交付，合并和线上发布遵循已有授权边界，不通过计划提交触发生产切换。

本文负责执行次序、任务与验收证据；[剩余工作台账](FRONTEND_REMAINING_WORK.md)负责当前缺口摘要；[cutover-status.ts](../frontend-src/migration/cutover-status.ts)继续作为生产切换状态的唯一源码依据。三者随实施提交同步更新。

完成状态分开记录：

| 状态 | 含义 | 必要证据 |
| --- | --- | --- |
| 待审计 | 覆盖情况尚未逐项证实 | 明确核对对象 |
| 待实现 | 已确认的源码缺口 | 原版行为与源码差异 |
| 待验收 | 实现已存在 | 尚缺的测试、截图或真实联调证据 |
| 外部阻塞 | 缺少原版代理或运行条件 | 阻塞接口、所需输入和解除条件 |
| 完成 | 此项全部验收满足 | 提交、用例、截图或日志、对照结论 |

模块文件存在、字符串契约通过、测试数量增加和 Debug 预览可用，都不能单独作为整体完成依据。所有视觉结论需对应实际原版参考和截图；未取得参考的部分保持“待对照”。

## 2. 已核实基线

### 2.1 PR 和实现状态

- PR #43 为 Open、未合并，目标分支为 master，审计时 mergeable 为 true。
- 本次状态审计对应实施提交 `7de88a5`；`94107bbf0b33911c519b50670664115c1a4efd47` 保留为本计划开始时的审计基线。
- 用户提供的 `Nori.Web-PR43-scene-editor.patch` 已在此前应用；PR 记录 `4f63429875d3d8db4b423be6b531c9d07a1e30af` 已完成对应浏览器验收。后续以分支源码为准，不重复应用补丁。
- 15 项 cutover 边界中，10 项当前标为完成，5 项仍为 false。此数量只描述门禁状态，不代表项目完成百分比。
- `story-director.ts` 定义七段剧情优先级，`story-scenes.tsx` 已挂载 Cult 与六段新增正式剧情。注册和完成事实已有源码/单元证据；逐段视觉、浏览器、原版语料与私有代理验收仍分别结算。
- 场景编辑器、冷开场图形组件和腐化小游戏预览已有实现，不能由此推定对应正式剧情已完成。
- Messenger 最新已恢复 GFM 删除线、任务列表、自动链接、消息气泡配色与阴影、会话行状态和键盘焦点。这些作为保留回归项。
- 文档包含分轮历史记录，部分“仍未恢复”表述已过期。状态冲突以当前源码、当前测试和运行证据为准，先核对再修正文档。

### 2.2 最新 CI 状态

初始失败审计对象为 [Cloudflare Worker run 35285404971](https://github.com/MF-Dust/Nori.Web/actions/runs/35285404971)；该 run 的 cold-open 错误路径已由 P0 修复并在 run `35354435518` 通过。当前实施提交 `7de88a5` 的最新证据如下。

| 检查 | 审计结果 |
| --- | --- |
| [Frontend recovery surfaces 35364523143](https://github.com/MF-Dust/Nori.Web/actions/runs/35364523143)：Debug、cold-open、Boot/Corruption、Farewell/Ending | 通过 |
| 同一 surface run：Messenger | 通过 |
| 同一 surface run：Datasea games job `105663601161` | 12/12 真实鼠标/键盘操作通过，含 Sweep、Current、Lure、Ripple |
| 同一 surface run：Memory/Datasea | Relay 后波次交接等待失败；已修正为有限等待真实 transmission/phase，完整串联由后续检查验收 |
| [候选 35365741246](https://github.com/MF-Dust/Nori.Web/actions/runs/35365741246)，job `105667660666` | 物化静态入口、五组系统配对、四游戏配对、Worker dry-run 全通过 |
| [Cloudflare Worker 35364523162](https://github.com/MF-Dust/Nori.Web/actions/runs/35364523162)：validate-worker | 通过 |
| 同一 Worker run：类型检查、两种构建、runtime/story/ownership/cutover/recovery、Chromium 游戏 | 通过 |
| [Cloudflare Worker 35365741254](https://github.com/MF-Dust/Nori.Web/actions/runs/35365741254)，job `105667661060` | 通过；含真实 NoriStage/cold-open、Scene editor/Scene tools、Preview、Messenger、Chip 及最终整站 smoke |
| 先前 job `105661992194` 的回归记录 | 真实模型步骤通过，随后 Scene editor 因新 Audio tab 漏掉 `Corrupt voice` checkbox 失败；`7de88a5` 恢复真实 scene 控件后由上述 job 复验通过 |

初始失败明确位于 `frontend_cold_open_probe.mjs` 的资源错误路径：

`AssertionError: Cold open did not reach error; got ready`

调用链涉及 `verifyColdOpen`、`verifyNoriScene` 和 `smoke_frontend_app.mjs`。根因是同一浏览器会话中的已解码图片/资源状态越过失败注入边界；修复将错误与重试路径隔离到新浏览器 context，同时保留真实请求命中、error、retry、释放和迟到回调断言。后续 Debug 观察器曾因旧 harness 不提供诊断 facade 而把成功模型载入转成 error；`NoriStage` 现把该观察器作为可选附属接口，四个目标 surface 已在最新 head 复验通过。

所有后续回归继续保留失败资源路径和真实 renderer 断言，不以跳过或放宽断言换取通过。

### 2.3 原版代理验收限制

已读取 `backend/services/event_dispatcher.py`：`nori_talk.request` 返回 `{type: "noop"}`。因此本地后端能证明请求发送和部分展示行为，无法证明原版 pat、腐化和游戏代理回复及语音编排一致。

尽早核对可用的原版代理实现、兼容测试会话或授权记录，定义最小联调案例。缺少这些条件时仍推进其余源码工作，保留外部阻塞，不用自拟回复或本地模拟结果关闭该项。

## 3. 执行顺序与依赖

| 阶段 | 工作包 | 前置依赖 | 退出条件 |
| --- | --- | --- | --- |
| P0 | 基线与 CI 修复 | 当前 PR head | 失败根因有结论，整站验收恢复 |
| P1 | 全量覆盖审计、视觉参考、代理条件盘点 | P0 的环境基线 | 每个入口、场景、状态有归属与证据 |
| P2 | Messenger 剩余独立界面及共享场景/媒体契约 | P1 | 共享基础可用于正式剧情 |
| P3 | 六段正式剧情逐段还原 | P2 | 各剧情完成独立实现与验收 |
| P4 | 游戏剩余表现和叙事 | P1、P2 | 四款游戏对照与生命周期通过 |
| P5 | Debug 实验室、高级编辑与辅助界面 | P1；高级通道依赖 P3 | 支持功能对照闭合 |
| P6 | 原版代理/媒体联调 | 条件盘点尽早进行；最终依赖 P3、P4 | 真实案例通过或明确保持阻塞 |
| P7 | 整站视觉、回归、资源与维护性整理 | P3、P4、P5；原版结论依赖 P6 | 缺口台账逐项有证据 |
| P8 | 门禁关闭、入口切换与回滚验收 | 所有功能门禁证据齐备 | 源码入口可部署且可回退 |

默认按上述阶段推进。独立任务可在外部阻塞期间前移，记录原因；不得以小型样式提交持续替代六段剧情这一主线。实施不引入按天工期承诺，进度按工作包验收结算。

## 4. P0：恢复可用验收基线

- [x] P0-01 获取 PR 最新 head、base、工作区状态和仓库约束；建立对应分支工作区，保留所有已有修改。
- [x] P0-02 保存失败 run/job、浏览器状态、资源请求和截图的关联记录，固定 Node、Python、锁文件及浏览器版本。
- [x] P0-03 独立复现 cold-open 错误路径，区分首次加载、成功后重开、缓存命中、世界替换四种情况。
- [x] P0-04 检查资源拦截是否命中、失败资源是否实际被请求、ready/error 状态是否属于新实例、异步完成是否越过释放边界。
- [x] P0-05 修复经证实的根因，保留成功、失败、失败后重试、退出与迟到加载的必要回归。
- [x] P0-06 运行受影响场景与完整应用 smoke，确认修复提交的 CI 最终完成；记录 PR head 和 CI 合并引用。

主要位置：`scripts/frontend_cold_open_probe.mjs`、`scripts/frontend_nori_scene_probe.mjs`、`frontend-src/live2d/cold-open-renderer.ts`、`scene-renderer.ts`、对应测试与 workflow。

验收：故障注入进入错误状态，重试恢复，正常路径不受影响；整站 smoke 完成，失败原因有证据。此阶段不重新实现已有图形系统。

## 5. P1：建立全部覆盖清单

- [x] P1-01 从 app 注册表、路由、窗口类型、shipped chunk 导入关系和动态入口枚举前端功能，覆盖主路径与隐藏入口。
- [ ] P1-02 为每个功能建立映射：参考 chunk/符号或资源 → 源码模块 → 运行入口 → 测试 → 视觉参考 → 状态。
- [ ] P1-03 审核占位提示、临时替代、简化装饰、未绑定控制、默认 no-op 和缺失的动态分支，逐项确认影响。
- [ ] P1-04 逐项复核 10 个已完成门禁的集成边界，包括主浏览器的安装 host callback、QFR 音频 hooks；发现真实缺口时重新登记，避免被完成标记掩盖。
- [ ] P1-05 归档现有场景和编辑器实现，核对历史文档冲突；补丁中已存在的能力只做回归。
- [ ] P1-06 建立统一视觉环境：同一资源、语言、窗口尺寸、DPR、字体加载状态、确定的随机种子和时间点。
- [x] P1-07 明确六段剧情与游戏的代理请求、返回、媒体和完成事件；列出所需真实会话或可追溯记录。
- [x] P1-08 将审计中新发现的内容加入台账，指定 P2–P8 归属和验收条件，禁止仅写“后续优化”。

产物：模块覆盖矩阵、视觉基线索引、缺口台账修订、代理依赖列表。新发现的缺口纳入本计划管理，不根据旧文档预先宣称不存在其他问题。

部分状态：`FRONTEND_COVERAGE_MATRIX.md` 已覆盖 15 个注册应用，分别记录源码 owner、实现证据、源码缺口与待验收项；本台账也已把新发现归入 P2–P8。逐功能的 shipped 符号/资源索引和完整原版视觉引用仍未齐备，因此 P1-02、P1-03、P1-05、P1-06 保持未完成。

## 6. P2：Messenger 与共享运行基础

### 6.1 聊天界面

- [ ] P2-01 对照搜索、会话标题/工具区、列表过滤、空状态、选中状态、未读、时间戳、滚动保持及窗口缩放，确认并补齐差异。
- [ ] P2-02 核对全部消息类型和附件/媒体展示、加载失败、图片/头像预览、键盘退出与焦点恢复；已存在实现只修差异。
- [x] P2-03 保留最新 GFM、链接跳转、会话行状态、消息气泡配色/阴影与 focus-visible 契约，并用实际 DOM 和交互验证关键结果。
- [ ] P2-04 专项复核右下角浮动聊天区：Dock 相对位置、输入框、气泡宽度、圆角、透明度、阴影、字体、间距、堆叠、超时及短窗口布局。
- [ ] P2-05 验证 Ctrl/Cmd+K、Escape、输入法组合输入、长中英文、消息队列、失败恢复与历史消息保持静默。
- [ ] P2-06 复核芯片状态/冷却、扫描覆盖层、窗口内容上下文、模型投影、场景接管和扫描打断。

### 6.2 场景与媒体契约

- [ ] P2-07 为七段剧情核对优先级、触发事实、完成事实、输入门、语音门、UI 接管和释放顺序。
- [x] P2-08 将六段缺失剧情需要的状态通道接入已有 StoryClock、StoryAudio、scene store 和 director；复用其暂停、实例隔离与确认机制。
- [ ] P2-09 核对文字揭示、包含边界的 speech cut、迟到 PCM/编码音频、表达时序、audio acknowledgements、静音/音量和文本模式。
- [ ] P2-10 验证世界切换、同世界替换、断线重连、后台暂停和卸载不会让旧回调结束新剧情或复活已释放资源。
- [ ] P2-11 对加载失败、渲染失败与媒体不可用定义与原版证据一致的错误/重试行为；模拟门和真实语音完成门分别测试。
- [ ] P2-12 对照头部手势粒子的形状、分布、节奏和模型投影，修复表现差异；保留摩擦音、一次按压一次请求、键盘操作和场景接管清理。原版回复/媒体同步进入 P6。

主要位置：`screens/messenger-*.tsx`、`components/markdown-body.tsx`、`apps/chat-runtime.ts`、`runtime/chat-media.ts`、`speech-player.ts`、`story/`、`state/`。

验收：界面有对照截图，协议断言验证真正的呈现顺序；共享机制可支持下一阶段，各场景专属逻辑继续由对应工作包负责。

部分状态：Messenger 独立 Chromium 在 `c9fb95c4` 对应 run `35358775277` 通过，运行时用例覆盖 IME、草稿保持、滚动和历史静默。六段正式剧情已接入共享 clock/audio/scene/director 并通过 11 项剧情测试。未完成项集中在完整语料/附件矩阵、浮动区原版视觉、私有代理媒体编排及 P2-10 至 P2-12 的全部组合验收。

## 7. P3：六段正式剧情

每段按“参考拆解 → 源码时间线与渲染 → 交互/媒体接入 → 独立验收 → 正式注册 → 整站回归”执行。现有 cult-flash 作为持续回归项。共享渲染部分优先复用，场景拥有自己的生命周期。

以下触发/完成映射直接来自审计基线的 `STORY_ORDER`：

| 场景 | 触发事实 | 完成事实 |
| --- | --- | --- |
| boot | session.ready | boot.completed |
| nori-corruption-climax | corrupt.armed | virus.cleared |
| cult-flash，已注册 | cult.unpacked | arg.cult_truth |
| memory | arg.memory.start | arg.memory.shown |
| datasea | arg.finale.started | arg.finale.shown |
| farewell | arg.farewell.started | arg.farewell.shown |
| ending | arg.ending.started | arg.ending.shown |

实施次序：Boot → Corruption → Memory → Datasea → Farewell → Ending。Boot/Ending 共享冷开场组件，原版播放优先级保持由 director 管理。

### 7.1 Boot

- [ ] P3-B01 拆解原版阶段、时长、摄像机轨迹、模型形成、输入门与音轨。
- [ ] P3-B02 补齐 shatter 及其与已存在海面、反射、光束、尘埃、glyph、轮廓形变、浮游粒子、唤醒效果的衔接。
- [ ] P3-B03 接入完整冷开场时间线、唤醒交互、画面与音轨同步、桌面交还。
- [ ] P3-B04 完成真实模型关键帧、首次进入/重进、错误重试、完成确认和世界替换验收后注册。

### 7.2 Corruption climax

- [ ] P3-C01 对照原版入场、警告、恢复覆盖层和十一阶段时序，补齐专属渲染。
- [ ] P3-C02 核对六项小游戏的原始行为：进程、节点、节拍、调谐、判断和通信校准；恢复动画、扰动、锁定与轨迹反馈。
- [ ] P3-C03 对照调谐漂移、连续保持、方向扰动、重复输入、错误重试和完成过渡，保留暂停/后台门。
- [ ] P3-C04 处理预览中自拟技术问题与原版交互/回复的差异，真实文本与代理语音需要可追溯依据。
- [ ] P3-C05 将真实语音结束、六项完成、恢复与唤醒门接入生产场景；Debug 预览继续不提交剧情事实。
- [ ] P3-C06 验证所有分支、窄窗口、键盘/指针、提前退出、同世界重载与完成确认，再注册。

### 7.3 Memory

- [ ] P3-M01 拆解五个交互窗口的内容、开启顺序、读阅条件和关闭/打断规则。
- [ ] P3-M02 实现 flood/sweep、算力消耗和关联 UI/场景变化。
- [ ] P3-M03 接入打断对话、文字/语音揭示与 void 交接。
- [ ] P3-M04 验证窗口堆叠、焦点、各输入门、恢复与取消、后台暂停和完成事实，再注册。

### 7.4 Datasea

- [ ] P3-D01 拆解原版专用渲染 pass、材质、模型资源和后处理顺序。
- [ ] P3-D02 实现专用渲染、摄像机编排、镜头阶段和音轨；核对已有冷开场后处理的适用范围。
- [ ] P3-D03 接入白屏交接及后续剧情衔接，验证画质层级、resize、资源加载失败和 GPU 资源清理。
- [ ] P3-D04 检查大资源通过现有 Assets/R2 路径可用，完成关键帧、时序和正式注册验收。

### 7.5 Farewell

- [ ] P3-F01 恢复模型专属表现、表情/姿态、逐句时序和语音接续。
- [ ] P3-F02 实现 completion acknowledgement 后的重载流程；确认失败重试、媒体延迟与文本模式符合参考行为。
- [ ] P3-F03 验证无重复完成、无提前重载、旧实例回调失效及重载后状态，再注册。

### 7.6 Ending

- [ ] P3-E01 复核已有冷开场组件能覆盖的段落，补齐 void 上浮正式时间线及专属镜头。
- [ ] P3-E02 接入符号形成、唤醒输入、完整音轨与返回桌面的顺序。
- [ ] P3-E03 验证等待输入不会跳阶段、失败重试不会重复确认、同世界重载不会继承旧完成状态，再注册。
- [ ] P3-E04 对照最终画面与桌面返回后的输入、BGM、模型状态及窗口可操作性。

### 7.7 每段共同验收

- [ ] P3-X01 每段至少覆盖进入、关键画面、输入门、完成、退出/取消、失败重试和同世界替换。
- [ ] P3-X02 检查暂停/恢复、隐藏标签页、减少动态效果、语音未解锁、媒体迟到及用户画质设置。
- [ ] P3-X03 七段联合验证优先级和交接；未恢复或未满足条件的前置剧情不会被跳过或伪造完成。
- [x] P3-X04 记录正式注册证据和源码路径，剧情完成状态与真实代理验收状态独立呈现。

部分状态：六段剧情均已正式注册并各有源码时间线/渲染器，11 项剧情测试通过。最新 head `f7a7fa6683adc8c9088d416a2fa6784c94464ac1` 的 Boot/Corruption job `105663601159` 与 Farewell/Ending job `105663601075` 已通过；Memory/Datasea 仍在运行。静态 narrative placeholder、原版逐帧视觉与私有代理原文/语音仍是独立缺口，因此 B/C/M/D/F/E 和 X01–X03 的复合任务不勾选。

## 8. P4：游戏完整表现与联调

| 游戏/范围 | 待执行内容 | 完成证据 |
| --- | --- | --- |
| Codenames | 开始/结果剩余装饰及动画；完整脚本教程；叙事和 sudden-death 对话；真实代理语音 | 教程至自由模式、胜败分支、原版画面对照、事件/语音顺序 |
| Chess | 结果/覆盖层时序；代理语音编排；视觉对照 | 保留 22 半回合教程，普通对局/结果/重连/历史浏览和原版语音案例 |
| Pictionary | 封面/帮助/结果装饰及动画；模型表情；真实代理快照推理 | 双角色、多轮、skip/未完成、绘图快照与真实代理响应 |
| Cake Duel | 已还原内容的整站回归及覆盖审计发现的差异 | 开始/对局/结果、challenge/Wolfy/翻牌、语种资源与退出清理 |
| 共享生命周期 | 窗口关闭重开、cartridge retain/release、请求相关性、可见版本推进与重连 | 无重复命令、旧轮次数据失效、媒体取消和 UI 不提前揭示 |

- [ ] P4-01 为 Codenames、Chess、Pictionary 各建立独立差异表和验收场景。
- [ ] P4-02 恢复 Codenames 完整教程链路，区分本地 backend 的 free_play 现状与兼容原版脚本状态，补齐必要接口接线。
- [ ] P4-03 完成 Codenames 剩余动画/装饰和叙事，保留 reveal/visibility acknowledgement 时序。
- [ ] P4-04 完成 Chess 结果/覆盖层和语音接线，保留教程与合法走子既有行为。
- [ ] P4-05 完成 Pictionary 帮助/封面/结果动画和表达编排，保留 Pixi、笔触、PNG、提示和 SFX。
- [ ] P4-06 回归 Cake Duel 完整流程，避免为了已完成模块再次进行大规模重写。
- [ ] P4-07 通过桌面真实入口验证四款游戏的打开、关闭、重开、窗口尺寸和中英双语。
- [ ] P4-08 完成共享世界/媒体生命周期验证；真实代理部分进入 P6 验收。

涉及 `frontend-src/apps/*game*`、各游戏 runtime/controller、`screens/`、对应 cartridge 与 smoke。后端改动仅服务经证实的还原协议需求，不附带全站后端改造。

部分状态：20 项游戏测试、cartridge 测试及主游戏浏览器检查已经通过，Codenames tutorial/sudden-death、Chess 22-ply、Pictionary cover/help/results/reaction 与 Cake Duel 生产路径均有源码。整站 smoke 的 Play Again 选择器仍在修复；原版代理推理/语音、四款游戏完整桌面重开/双语和逐项视觉对照尚未关闭，因此 P4 复合任务保持未完成。

## 9. P5：Debug、高级编辑器与辅助界面

- [ ] P5-01 逐项对照 Network、Compute、Gesture、Reaction 实验面板的控制项、状态与回调。
- [ ] P5-02 补齐游戏情景注入与原版支持的调试工具，使用隔离世界验证。
- [ ] P5-03 随 P3 为各专属渲染器补齐高级通道、调参控件、范围校验与预览，不只增加外观控件。
- [x] P5-04 回归 JSON 导入导出、100 KB 限制、重复阶段 ID、零时长门、排序/删除、音轨偏移和暂停 seek。
- [x] P5-05 验证预览/调试对正式剧情的让位、关闭与切换世界清理，以及不会误提交剧情完成事实。
- [ ] P5-06 复核 Settings、About、系统提示和 Credits 的布局、交互、图标及剩余原版差异，包含 Credits 品牌图形替代情况。
- [ ] P5-07 复核 Preview 的 PDF 分页/缩放/缩略图/文字选择、训练日志与刷新、Files 锁定流程、错误和取消。
- [ ] P5-08 验证设置持久化、音量/静音/画质即时生效，重置确认及 acknowledgement 在隔离本地世界中执行。

验收：每个控制项都有实际作用和释放路径；通用编辑能力保持稳定，新增场景通道有往返和浏览器证据。

部分状态：Network fault、真实 Idle ledger、Gesture、Reaction、Codenames scenario、Shatter 与 Datasea tuner 已接实际运行时；Debug Chromium job `105644556047` 通过压缩 GLB、范围约束、持久化、失败重试、剧情接管与资源释放。对 `Debug-D6AtxpLT.js` 的注册项审计确认原版没有其他「按剧情分组」的专属 tuner。全页 Glitch 已接生产 filter；33 个 Chess 与 4 个 Cake Duel 原版 scenario ID 已进入 UI，并由 controller/backend 的真实 `debugLoadScenario` 命令执行。Live2D 使用当前挂载的生产模型执行插件、rest pose、expression 和 motion；Audio 直接修改持久化设置并同步 mixer/speech；Pat 参数直接作用于生产 recognizer、spring、输入区域和 friction synth；Reactions 覆盖生产 director 已绑定的 28 个 Pictionary/Chess/Codenames 事件；Notifications 执行真实 `notification.debug.push` 往返并观察 `notification.pushed`。Inject Talk 与 Nori Context 所需的私有 handler 不存在，因此只呈现可观测会话状态和明确阻塞，不伪造代理输出或上下文。仍缺 Live2D idle crossfade/lip-form、Audio manager 内部 suspend/seek/track/panner/effects、Pat armed/zone/model-pointer telemetry、Cake Duel/强制 variant/冷却绕过/mood/tell reaction，以及通知 shell queue/dismiss；原版布局也待对照。上述新增路径已有 106 项聚合运行时测试；Debug Chromium job `105657772066` 通过 UI 到 facade 的交互合同。Worker job `105661992194` 的 `Nori scene and cold-open lifecycle` 步骤使用真实 NoriStage 模型，通过 catalog、physics 切换/恢复和 HeadPat 参数恢复断言；该 job 随后的 Scene editor 步骤发现新 Audio Debug tab 漏掉真实 `Corrupt voice` checkbox。控件现已恢复并接回 DebugScreen 的 scene lease，保留剧情接管、世界切换及关闭 Debug 清理；现有浏览器断言未放宽，并由 Worker job `105667661060` 的 Scene tools 与完整 Scene editor 步骤复验通过。由于未暴露控制与原版布局对照仍缺，P5-01 至 P5-03 暂不关闭。P5-06 至 P5-08 的辅助应用完整矩阵未因单次候选截图而关闭。

## 10. P6：原版代理与媒体验收

- [x] P6-01 从 P1 的依赖列表确认可用的原版代理/媒体环境、版本及测试会话；明确仅具本地模拟条件的接口。
- [ ] P6-02 验证 pat 请求 → 回复 → 媒体 → 表情/嘴型 → 播放完成的顺序。
- [ ] P6-03 验证腐化交互、六段剧情的揭示/打断与语音门，以及故障/重连分支。
- [ ] P6-04 验证 Codenames 脚本教程和事件对话、Chess 语音、Pictionary 图像快照推理。
- [ ] P6-05 验证文本模式、媒体不可用、延迟分块、打断、同世界替换及音频 acknowledgements 不串实例。
- [ ] P6-06 归档脱敏后的接口版本、请求关联 ID、事件顺序和结果，不保存凭据。
- [x] P6-07 对无法运行的案例保留“外部阻塞”，写明最小所需资料和解除条件，继续完成其余独立任务。

当前结论：本地 `nori_talk.request` 明确返回 `noop`。已记录可验证的请求投递边界以及解除阻塞所需的原版代理实现、版本和授权测试会话；P6-02 至 P6-06 没有实际原版会话证据，全部保持未完成。

本地模拟可用于可重复的合同测试；原版真实表现验收仍需实际实现或足够的可追溯证据。此处无法通过时不宣称整体原版一致。

## 11. P7：整站验收与维护性

### 11.1 场景矩阵

| 维度 | 覆盖范围 |
| --- | --- |
| 入口与桌面 | 冷启动、登录/恢复、桌面、Dock/TopBar、窗口切换/缩放/关闭、持久化、退出登录 |
| 应用 | Terminal、Browser 主窗/弹窗、Signal、Mail、Files、Preview、Idle/QFR、Settings、About、Credits、Debug |
| 布局 | 原版窗口尺寸、桌面宽窗口、短高度、390 px 窄窗口；模型、扫描与浮动聊天叠层 |
| 语言/输入 | 简体中文、英文、长文本、输入法、键盘焦点、指针、现有触摸路径 |
| 状态 | 正常、加载、空、错误、失败重试、断线重连、世界替换、旧状态恢复 |
| 动态/媒体 | 减少动态效果、后台暂停、音频未解锁、静音、不同画质、音轨/语音打断 |
| 特殊恢复 | 模型/图片/音频缺失、迟到加载、WebGL 生命周期、连续打开关闭及场景切换 |

- [ ] P7-01 用相同参考条件生成原版/源码关键帧对照和差异记录，修复有证据的视觉缺口。
- [ ] P7-02 单独关闭右下角浮动区反馈，保存正常桌面、输入聚焦、消息堆叠、窄窗口的对照证据。
- [ ] P7-03 核验已完成 10 个门禁的整站回归，记录发现的新问题及修复。
- [ ] P7-04 记录脚本、字体、图片、模型、音轨和 R2 资源加载；检查缺失、CSP、worker/worklet 与运行时错误。
- [ ] P7-05 从源码 import、生成产物和浏览器网络三方面确认不执行历史应用 JS、不加载历史整站 CSS；单独记录必要 Cubism Core 等供应商资源。
- [ ] P7-06 与基线比较启动、懒加载、常见切换与资源释放；没有原始性能证据时不承诺具体帧率或性能提升。
- [ ] P7-07 清理已被取代的重复组件、样式覆盖、死代码和调试残留；先确认调用关系，按模块小步整理。
- [ ] P7-08 保留必要来源说明、许可证、测试参考及回滚资源；历史资源删除进入 P8 的独立检查。
- [ ] P7-09 合并过期文档叙述，确保实际实现、剩余台账、计划状态与 gate note 一致。

部分状态：历史资产扫描器 3 项与 Worker payload guard 通过。719b9993、c7714a42 的候选完整 job 通过，包含静态浏览器、五组系统截图和 Worker dry-run。ca657 的截图已人工审阅并修复可见差异，记录见 FRONTEND_VISUAL_REFERENCE.md；About 参考截图发现透明窗口采样问题，四游戏截图存在历史 Pictionary 标题选择器歧义，均正在修复复采。完整功能/姿态/场景矩阵未齐备，P7 复合项保持未完成。

### 11.2 验证命令与证据

沿用当前仓库脚本：

```sh
npm ci
npm run frontend:typecheck
npm run frontend:build
npm run frontend:app:build
npm run frontend:runtime:test
npm run frontend:recover:check
npm run frontend:cutover:check
npm run frontend:games:smoke
npm run frontend:app:smoke
```

`frontend:recover:check` 已包含 `frontend:games:test`，常规全量验收不再为统计数字重复执行。涉及后端的提交运行相关 cartridge/协议测试；Cloudflare dry-run 依照当前 workflow 执行。环境准备采用仓库锁文件和相应 Python/Chromium 依赖。

每个工作包只新增能识别真实风险的测试。契约检查、真实组件交互、整站联调、视觉对照相互补充。固定时间只用于确定性采样，保留必要真实媒体/生命周期检查。

证据记录包含：任务 ID、实现 commit、测试运行时间、命令或 case、参考状态、截图/日志路径、CI run 和待验收项。优先关联现有 CI artifacts，关键证据避免只依赖会过期的附件链接。

## 12. P8：门禁关闭、切换与回滚

| 门禁 | 关闭所需工作 |
| --- | --- |
| messenger | P2、P3 中聊天/揭示/打断/语音内容，P6 相关真实联调，P7 视觉与生命周期 |
| games | P4，P6 游戏代理/媒体验收，P7 整站表现 |
| live2d | P3 六段正式剧情、专用渲染、手势粒子对照，P6 相关反馈，P7 资源与视觉 |
| supporting-apps | P5，P3 对应高级通道/音频，P7 辅助应用对照 |
| production-entry | 前四项及已有门禁均验证后，源应用 staging、切换、部署验证和回滚方案 |

- [ ] P8-01 按证据关闭功能门禁；有未完成行为或外部阻塞的边界保持 false。
- [ ] P8-02 在 staging 目录生成源码入口和产物，核对路径、懒加载、字体、模型、音轨、worklet、PDF worker 及 R2 大资源。
- [ ] P8-03 接入部署阶段构建，确认生成产物不会覆盖用于对照和回滚的历史资源。
- [x] P8-04 扩展现有 cutover 校验对所有历史 chunk/间接导入的覆盖，保留明确的供应商运行时边界。
- [ ] P8-05 准备可审阅的入口切换提交，并在该提交中同步生产入口和 production-entry 状态，避免自指门禁造成无法到达的中间状态。
- [ ] P8-06 在切换候选产物上完成所有必要检查、Cloudflare dry-run 和真实浏览器入口验收。
- [ ] P8-07 在隔离环境验证回退到上一入口及资源集合，记录受影响的状态/缓存和恢复步骤。
- [ ] P8-08 仅在行为对照及回滚验证满足后评估删除历史 JS；先迁移仍需使用的验证参考，确认无动态引用、资源误删或回滚依赖。
- [ ] P8-09 汇总 PR 最终说明：恢复范围、证据、剩余限制、切换结果和回滚步骤。合并/线上部署不随文档创建自动发生。

部分状态：隔离候选可生成 symlink/materialized 两种形式，materialized 产物无 symlink，rollback manifest/hash 与静态入口 smoke 已通过；候选 Worker 配置从生产 JSONC 临时生成且不改生产配置。719b9993、c7714a42 的候选静态入口、系统配对截图、Worker dry-run 与静态资产 payload guard 均已通过；后续视觉步骤失败也不再跳过 dry-run。原版/源码视觉复验、完整资产/R2 运行检查和真实回退浏览器证据仍阻塞 P8-02、P8-06、P8-07。

现有 checker 要求存在 false 时仍保留历史入口，而所有状态为 true 后入口必须已经改变。因此正式切换须在完整候选提交中同步校验，不提前把 production-entry 标为完成。

## 13. 提交与进度管理

推荐提交批次，允许按可独立审查的场景内部继续拆分：

| 批次 | 内容 | 必带材料 |
| --- | --- | --- |
| 01 | 本计划 | 基线、任务、依赖、完成标准 |
| 02 | Cold-open CI 根因修复 | 故障复现、修复和对应回归 |
| 03 | 完整覆盖矩阵与参考基线 | 源码/参考映射、差异台账 |
| 04 | Messenger 界面与共享媒体/场景契约 | 对照、关键交互与生命周期 |
| 05–10 | Boot、Corruption、Memory、Datasea、Farewell、Ending | 每段完整功能切片与注册证据 |
| 11–13 | Codenames、Chess、Pictionary 差异闭合及 Cake Duel 回归 | 游戏和整站验收 |
| 14 | Debug labs、高级编辑器及辅助界面差异 | 控件行为、预览隔离和视觉 |
| 15 | 原版代理/媒体联调结果与必要修复 | 真实案例或明确阻塞 |
| 16 | 整站对照、资源/性能问题和维护性整理 | 缺口闭合证据 |
| 17 | 门禁和入口切换候选、回滚验证 | 构建/CI/产物与回滚记录 |

每个实现提交同步更新对应 recovery 文档和剩余台账，记录“已实现、已验收、仍阻塞”三类事实。提交前复核远端 head；如有新增提交，先整合，不能强制推送覆盖。CI 尚在运行时报告运行中；失败时记录失败步骤和根因状态。

普通实现不以每个小步骤请求确认，按已授权范围持续推进。真正无法独立消除的外部条件以具体阻塞报告，保留可继续执行的任务。

## 14. 最终交付检查

- [ ] 全量覆盖矩阵中的功能都有源码归属，审计发现的新增缺口全部结算。
- [ ] 六段正式剧情均实现并注册，已有 cult-flash 无回归。
- [ ] Messenger、游戏、模型、辅助应用和右下角聊天区具有相应对照证据。
- [ ] 原版代理/媒体相关验收有实际证据，或整体状态明确保持未完成。
- [ ] 当前 PR 提交对应的必需检查完成且通过，CI 运行结果和提交对应正确。
- [ ] 源码应用及候选生产入口均不执行历史应用 chunk。
- [ ] 门禁状态、源码、文档和实际入口一致。
- [ ] 切换与回滚可复现，必要资源和验证参考完整。
- [ ] PR #43 最终说明可据此审阅；没有把计划完成表述为实现完成。

## 15. 依据索引

- [PR #43](https://github.com/MF-Dust/Nori.Web/pull/43)
- [基线 cutover 状态](https://github.com/MF-Dust/Nori.Web/blob/94107bbf0b33911c519b50670664115c1a4efd47/frontend-src/migration/cutover-status.ts)
- [基线正式场景挂载](https://github.com/MF-Dust/Nori.Web/blob/94107bbf0b33911c519b50670664115c1a4efd47/frontend-src/story/story-scenes.tsx)
- [基线 StoryDirector](https://github.com/MF-Dust/Nori.Web/blob/94107bbf0b33911c519b50670664115c1a4efd47/frontend-src/story/story-director.ts)
- [基线代理事件处理](https://github.com/MF-Dust/Nori.Web/blob/94107bbf0b33911c519b50670664115c1a4efd47/backend/services/event_dispatcher.py)
- [剩余工作](FRONTEND_REMAINING_WORK.md)
- [场景恢复](FRONTEND_SCENE_RECOVERY.md)
- [游戏恢复](FRONTEND_GAMES_RECOVERY.md)
- [系统应用](FRONTEND_SYSTEM_RECOVERY.md)
- [媒体恢复](FRONTEND_MEDIA_RECOVERY.md)
- [场景编辑器](FRONTEND_SCENE_EDITOR.md)
- [生产切换](FRONTEND_CUTOVER.md)
## 16. 本轮执行记录

2026-09-18：在原 PR 分支继续实施。完成覆盖矩阵、六段正式剧情源码接入、Messenger 交互修复、游戏表现与 Debug 实际运行时控制、Credits SVG 与模型通道、历史 chunk 扫描扩展。各项完整验收包含的视觉/浏览器要求尚未全部满足，因此不因代码存在批量勾选。

新增检查：`frontend:stories:test`、`frontend:stories:smoke`、`frontend:ownership:test`，以及按 cold-open、Messenger、Boot/Corruption、Memory/Datasea、Farewell/Ending、Debug 隔离的 Actions 浏览器任务。当前本地运行时 106 项、剧情 11 项、游戏 20 项、扫描器 3 项通过。浏览器结果和未通过步骤按下述工作包记录，不把“有检查”写成“已验收”。

原版代理与生产切换仍有明确前置条件，五个 false 门禁保持不变。

P0 验收：修复提交 `55c79a86715c807ea8a7dfd906e09f598b78ae21` 的 [CI 35354435518](https://github.com/MF-Dust/Nori.Web/actions/runs/35354435518) 已成功，含整站 smoke。独立 browser context 消除了已解码图片缓存对失败注入的干扰，保留成功、失败、重试、释放及迟到回调断言。整合提交 `3e2808de355b1cd18a762f2e22683eb72c5f0df8` 的 cold-open 和 Boot/Corruption 浏览器任务通过，其余新矩阵失败仍在修复。

`c9fb95c4b8522c9902e9fe5b507759f0fb6b0c5c` 的独立矩阵中 cold-open、Boot/Corruption、Messenger、Debug 已通过；Debug job `105644556047` 实际加载 Meshopt 压缩 Datasea GLB，并覆盖调参、错误重试、接管与释放。此后 `f7a7fa6683adc8c9088d416a2fa6784c94464ac1` 的 surface run `35364523143` 再次通过 Debug、cold-open、Boot/Corruption、Farewell/Ending 与 Messenger；Datasea games job `105663601161` 已通过全部 12 项真实输入；完整 Memory/Datasea 交接由后续提交复验。此前 Worker job `105661992194` 的真实 NoriStage 模型步骤通过，随后 Scene editor 因新 Audio tab 遗漏 `Corrupt voice` checkbox 失败。`7de88a5` 已恢复该真实 scene 控件并保持原浏览器功能断言；Worker run `35365741254` 的 job `105667661060` 随后通过真实 NoriStage/cold-open、Scene editor/Scene tools、Preview、Messenger、Chip 与最终整站 smoke。
### 当前工作包与证据归属

| 工作包 | 源码/脚本交付 | 已取得证据 | 尚未关闭的验收 |
| --- | --- | --- | --- |
| P0 | 独立浏览器上下文错误注入 | 55c79a8 整站 CI 通过；3c73c80 独立检查通过 | 已关闭 |
| P1 | 15 应用覆盖矩阵 | 注册表与实际 source session 接线核对 | 已有配对截图；逐功能/场景参考索引仍不完整 |
| P2 | Messenger 交互、媒体失败、场景通道 | Messenger 独立 Chromium 通过；运行时测试 | 原版代理媒体、完整语料与浮动区视觉对照 |
| P3 | 六段正式剧情及专用渲染 | 11 项剧情测试；f7a7fa6 的 Boot/Corruption、Farewell/Ending 浏览器通过 | 12 小游戏独立验收通过；完整 Memory/Datasea 串联待最终检查；静态 narrative placeholder；原版视觉/语音 |
| P4 | 教程 reducer、四游戏表现、模型反应 | Python cartridge、20 项游戏测试及主游戏浏览器通过 | 完整双语/全部状态对照；原版代理推理/语音 |
| P5 | 实际网络/算力/情景控制、Shatter/Datasea 调参、生产 Glitch filter、原版游戏 scenario 命令，以及生产绑定的 Live2D/Audio/Pat/Reaction/通知诊断 | 106 项运行时测试、cartridge 隔离实例测试；Debug jobs 105644556047、105657772066、105663601223 通过；job 105661992194 的真实 NoriStage facade 步骤通过 | 未暴露的 manager/model telemetry 与原版布局；Inject Talk/Nori Context 私有服务。Audio scene 控件恢复已由 job 105667661060 复验通过 |
| P6 | 保留接口、请求和媒体生命周期 | noop 位置与真实所需输入已记录 | 原版代理实现/授权测试会话 |
| P7 | 独立矩阵、原版/源码配对截图脚本 | 资产引用检查、固定环境脚本和已有成功截图 | About及四游戏已取得可审阅配对并修差异；最新世界隔离/样式复采及完整矩阵待最终检查 |
| P8 | 隔离候选入口、静态资源/回滚哈希校验 | 本地候选、14 个回滚文件、静态入口 smoke 与 Worker dry-run 通过 | 最终修订视觉与完整资源/回退浏览器；全部功能门禁前置条件 |

状态按验收结算，不把已提交实现等同为全部还原成功。
