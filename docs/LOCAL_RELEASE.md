# Rust 本地发行包

本地服务由 `rust/crates/nori-local` 编译为独立可执行文件。发布目录包含 `Nori.Web`（Windows 为 `Nori.Web.exe`）、网页和数据文件，以及许可证和对应源码。

## 本地构建、运行与验证

需安装 Python 3.13、Rust stable（至少 1.98）和 Cargo；Python 仅运行标准库构建/测试辅助脚本，无需安装额外包。所有将进入正式发行包的源码（尤其是 `rust/` 和 `rust/Cargo.lock`）必须先提交或加入 Git 跟踪。默认构建会拒绝未跟踪源码，只允许未跟踪的 `uv.lock` 和 `rust/Cargo.lock`。

```bash
python -m unittest tests.test_release_legal
cargo test --locked -p nori-core -p nori-local --manifest-path rust/Cargo.toml
python scripts/build_release.py
python scripts/smoke_release.py
```

本机开发时，如果 Rust 源码尚未提交，可显式运行：

```bash
python scripts/build_release.py --allow-untracked
python scripts/smoke_release.py
```

该选项会把 Git 未跟踪的非忽略文件也放入 `source/project.zip`，并在 `BUILD_INFO.txt` 中标为 **DEVELOPMENT ONLY**。不要用它生成正式发行物；检查归档内容并提交所有发布源码后，再用默认命令构建。

产物位于 `build/release/Nori.Web-<system>-<architecture>/`。启动目录中的 `Nori.Web` / `Nori.Web.exe`，然后访问 `http://127.0.0.1:4173/`。服务支持 `HOST`、`PORT`、`NORI_DISABLE_LIVE_PACK`、`NORI_PUBLIC_DIR` 和 `NORI_DATA_DIR` 环境变量。构建后 `smoke_release.py` 会用空闲端口启动程序，检查 API、网页、非官方提示、法律页面、源码/许可证文件和 Arcade WebSocket 启动行，并在完成后停止服务。

## 旧打包命令兼容

`scripts/build_nuitka.py` 和 `scripts/smoke_nuitka.py` 现在分别调用上述 Rust 构建器和 smoke test，不再使用 Nuitka。旧构建命令支持 `--allow-untracked`；`--no-clean` 仅保留兼容并提示弃用，发行目录始终重建，Cargo 编译缓存仍复用。旧 smoke 命令同样支持指定发行目录。`scripts/nuitka_entry.py` 与旧 Python 后端、测试及启动回退已移除；历史实现可从 Git 记录恢复。

## 发行目录和依赖解析

```text
Nori.Web[.exe]
public/
backend/data/
README.md
BUILD_INFO.txt
LICENSE / COPYRIGHT.md / THIRD_PARTY_NOTICES.md
RUST-LICENSE-SUMMARY.txt
legal/licenses/<crate>-<version>/...
source/project.zip
source/rust-vendor.zip
source/dependencies.json
source/README.md
```

依赖集合由 `cargo metadata --format-version 1 --locked --filter-platform <host-triple>` 的 resolve 图筛选，并以 `cargo tree -e normal --target <host-triple>` 校验。仅收录 `nori-local` 在当前主机目标上的 normal 依赖闭包；不收录仅用于测试或构建的 crate。`cargo vendor --locked` 提供对应的精确 crate 源码，发行归档只包含所选依赖的 vendor 源码。`dependencies.json` 记录 crate 名称、版本、SPDX license expression、仓库和校验值。

构建器要求每个链接 crate 提供 SPDX 表达式、许可证/NOTICE 文件，且表达式必须至少有一个与 GPL-3.0-or-later 兼容的分支；`AND` 中的每个分支都必须兼容，`OR` 中至少一个分支兼容。未知表达式或缺失许可材料会使构建失败，并列出问题 crate。根目录许可证会复制到发行包；`LICENSE`、`COPYRIGHT.md`、`THIRD_PARTY_NOTICES.md` 必须与 `public/legal/` 中对应文件逐字节一致。

`source/project.zip` 收录跟踪文件的实际工作树内容（包括已跟踪修改），不包含 Git 历史或被忽略的文件。不要将凭据加入 Git 跟踪。发送发行物时保留整个目录，而不只是可执行文件。

## GitHub Actions

`.github/workflows/rust-local-build.yml` 支持手动触发和 `v*` 标签。Windows、Linux、macOS runner 会运行授权测试、Rust 核心/本地服务测试、发行构建与 smoke test，并将每个平台的发行目录作为保留 14 天的 artifact 上传。

构建不会签署 Windows 二进制或 notarize macOS 应用。另请注意：随包发布的历史前端、原站素材和 Live2D 资产仍有单独的授权问题；打包许可证或源代码不会授予这些内容的新权利。公开分发前应按 `COPYRIGHT.md` 核实、取得许可或移除相关资产。
