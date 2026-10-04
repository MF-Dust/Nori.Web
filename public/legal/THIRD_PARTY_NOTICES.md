# Third-party notices / 第三方声明

本文件及 `public/legal/` 随网页和桌面包交付。它们记录许可证及来源，不是对整个分发包的权利清除证明。自有代码的 GPL 范围见 [COPYRIGHT.md](COPYRIGHT.md)。

## Rust 桌面运行时

- 本地可执行文件由 `nori-local` 构建，不包含 Python 解释器或 Python 运行依赖。实际链接的主机目标 normal 依赖见 `source/dependencies.json`，记录 crate 名称、精确版本、SPDX 表达式、仓库和校验值。
- **shakmaty** — Niklas Fiekas and contributors，GPL-3.0-or-later；上游 https://github.com/niklasf/shakmaty 。Rust 棋类卡带使用该库；包内许可证摘要记录对应版本及许可证文本补充说明。
- `source/rust-vendor.zip` 提供链接依赖的精确 vendor 源码；`legal/licenses/<crate>-<version>/` 保留许可证及 NOTICE 文件，`RUST-LICENSE-SUMMARY.txt` 记录许可检查结果。
- `source/project.zip` 包含本次构建使用的仓库工作树文件（不是只指向仓库首页），包括构建脚本；重建方法见包内 `source/README.md` 和 [docs/LOCAL_RELEASE.md](docs/LOCAL_RELEASE.md)。
- 分发包含 GPL 组件的编译后端时，应保留相应 GPL 许可证及对应源码交付。单纯通过网络运行 GPL 服务不等同于分发二进制；发送桌面包则涉及分发义务。

## JavaScript / WebAssembly

`public/legal/npm-NOTICES.txt` 收录当前 `package-lock.json` 对应的、已安装生产依赖中的许可文本及版权声明，包括 React、React DOM、PixiJS、Three.js、chess.js、Zod、Zustand、Lucide、xterm、PDF.js 等。运行 `npm ci && npm run legal:refresh` 可更新该文件；依赖升级后应一并提交更新。

**历史前端与源码构建必须区分**：当前 `public/assets/` 是原站历史 bundle，内含组件版本不一定等于本仓库 npm 锁文件（例如历史 React 可见版本为 19.2.5）。上述清单是当前源码依赖的许可交付，不声称已经穷尽、精确识别历史 bundle 内全部依赖，也不授予原站应用代码许可。公开再分发前仍需补齐历史代码来源及授权。

`public/legal/vendor/` 保留 Basis Universal / KTX 的上游许可说明。`public/vendor/pixi/` 中历史 WASM 的精确构建版本及其内嵌组件尚未确认；KTX 的说明还指向其他组件许可，当前文件不是该 WASM 的完整许可清单。公开再分发前应按实际构建补齐。Live2D Core 继续适用其原有专有许可：
https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html

Core 文件中的 Live2D 版权及链接应保留；本声明不提供 SDK、模型或原站内容的再授权。Cubism Framework 与 Core 是不同组件，不能用一个组件的许可替代另一个。

## 字体（SIL Open Font License 1.1）

全文及来源记录见 `public/legal/fonts/`。已核对本地 WOFF2 的 name 表，未修改字体文件：

| 本地文件 | 字体/版本 | 版权声明来源 |
| --- | --- | --- |
| `sarasa-fixed-sc*.woff2` | Sarasa Fixed SC 1.0.40 | Renzhi Li；Inter Project Authors；Adobe；Google，详见 METADATA.txt |
| `fusion-pixel-12px-*.woff2` | Fusion Pixel，2026.07.01 | Copyright (c) 2022, TakWolf |
| `press-start-2p-latin.woff2` | Press Start 2P 3.000 | Copyright 2012 The Press Start 2P Project Authors；保留字体名 Press Start 2P |
| `silkscreen*-latin.woff2` | Silkscreen 1.001 | Copyright 2001 The Silkscreen Project Authors |
| `vt323-latin.woff2` | VT323 2.000 | Copyright 2011, The VT323 Project Authors |
| 源码前端生成的 `nunito-*.woff2` | @fontsource/nunito 5.2.7 | Nunito Project Authors；来自已安装包的 LICENSE |

字体继续按 OFL 授权，不改为 GPL。修改、转换或子集化字体时需另行遵循 OFL 条件及保留字体名要求。

## 更新与发行

- `LICENSE`、`COPYRIGHT.md`、本文件和 `public/legal/` 均应随发行包保留。
- Rust 构建脚本交付实际链接 crate 的许可证及源码；若源码收集或许可证检查失败，构建报错，不把缺文件的目录标记为成功发行包。旧 Nuitka 命令名称只转发到 Rust 流程。
- 收集脚本只处理标准上游依赖。若修改了依赖、加入了额外原生库或替换了资源，应交付对应修改源码并更新声明，不能只复用上游原版源码。
- 增加这些文件并不意味着原站素材、历史前端及 Live2D 的许可问题已解决。
