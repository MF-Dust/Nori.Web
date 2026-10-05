# Third-party notices / 第三方声明

本文件及 `public/legal/` 随网页和桌面包交付。它们记录许可证及来源，不是对整个分发包的权利清除证明。自有代码的 GPL 范围见 [COPYRIGHT.md](COPYRIGHT.md)。

## Rust 桌面运行时

- 本地可执行文件由 `nori-local` 构建，不包含 Python 解释器或 Python 运行依赖。实际链接的主机目标 normal 依赖见 `source/dependencies.json`，记录 crate 名称、精确版本、SPDX 表达式、仓库和校验值。
- **shakmaty** — Niklas Fiekas and contributors，GPL-3.0-or-later；上游 https://github.com/niklasf/shakmaty 。Rust 棋类卡带使用该库；包内许可证摘要记录对应版本及许可证文本补充说明。
- `source/rust-vendor.zip` 提供链接依赖的精确 vendor 源码；`legal/licenses/<crate>-<version>/` 保留许可证及 NOTICE 文件，`RUST-LICENSE-SUMMARY.txt` 记录许可检查结果。
- `source/project.zip` 提供本次构建使用的工作树源码和构建脚本；`public/` 与 `backend/data/` 直接复用发行根目录中的同名目录，不在 ZIP 内重复存储。三者共同提供完整源码，分发时保留整个发行目录；还原和重建方法见包内 `source/README.md` 和 [docs/LOCAL_RELEASE.md](docs/LOCAL_RELEASE.md)。
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
| `web/plus-jakarta-sans/*.woff2` | Plus Jakarta Sans 2.071 | Copyright 2020 The Plus Jakarta Sans Project Authors |
| `web/noto-sans-sc/*.woff2`、`web/noto-sans-jp/*.woff2` | Noto Sans SC / JP 2.004 | (c) 2014-2021 Adobe；Reserved Font Name 'Source' |
| `web/bodoni-moda/*.woff2` | Bodoni Moda 2.005 | Copyright 2020 The Bodoni Moda Project Authors |
| `web/newsreader/*.woff2` | Newsreader 1.003 | Copyright 2020 The Newsreader Project Authors |
| `web/ibm-plex-mono/*.woff2` | IBM Plex Mono 2.3 | Copyright 2017 IBM Corp.；Reserved Font Name "Plex" |
| `web/fredoka/*.woff2` | Fredoka 2.001 | Copyright 2016 The Fredoka Project Authors |
| `web/crimson-pro/*.woff2` | Crimson Pro 1.003 | Copyright 2018 The Crimson Pro Project Authors |
| `web/quicksand/*.woff2` | Quicksand 3.006 | Copyright 2019 The Quicksand Project Authors；Reserved Font Name "Quicksand" |
| `web/nunito/*.woff2` | Nunito 3.602 | Copyright 2014 The Nunito Project Authors |
| `web/lilita-one/*.woff2` | Lilita One 1.002 | Copyright (c) 2011 Juan Montoreano；Reserved Font Name "Lilita One" |
| `web/lxgw-wenkai/*.woff2` | LXGW WenKai GB 1.250（lxgw-wenkai-webfont 1.7.0） | Copyright 2021-2023 LXGW；Copyright 2020 The Klee Project Authors |

`public/fonts/web/` 由 `node scripts/fonts/sync_web_fonts.mjs` 从 Google Fonts 和 jsDelivr 镜像，对应原站引用的同名字体；文件为上游 Web 交付格式（WOFF2，按 unicode-range 分片），本仓库未再修改。该脚本同时重新生成 `public/fonts.css`。

字体继续按 OFL 授权，不改为 GPL。修改、转换或子集化字体时需另行遵循 OFL 条件及保留字体名要求。

## 更新与发行

- `LICENSE`、`COPYRIGHT.md`、本文件和 `public/legal/` 均应随发行包保留。
- Rust 构建脚本交付实际链接 crate 的许可证及源码；若源码收集或许可证检查失败，构建报错，不把缺文件的目录标记为成功发行包。
- 收集脚本只处理标准上游依赖。若修改了依赖、加入了额外原生库或替换了资源，应交付对应修改源码并更新声明，不能只复用上游原版源码。
- 增加这些文件并不意味着原站素材、历史前端及 Live2D 的许可问题已解决。
