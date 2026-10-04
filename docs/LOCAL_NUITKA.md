# 原 Nuitka 打包入口（已迁移到 Rust）

本地发行包现在使用 Rust，不再编译或安装 Nuitka，也不随包交付 Python 解释器。完整构建、运行、许可证和源码交付说明见 [LOCAL_RELEASE.md](LOCAL_RELEASE.md)。

旧脚本名称保留为兼容入口，实际调用同一套 Rust 构建与验证流程：

```bash
python scripts/build_nuitka.py
python scripts/smoke_nuitka.py
```

需要 Python 3.13（仅运行标准库构建辅助脚本）及 Rust/Cargo（至少 1.98），无需额外 Python 依赖。推荐新命令 `python scripts/build_release.py` 和 `python scripts/smoke_release.py`。

- `build_nuitka.py --allow-untracked` 对应 Rust 构建器的开发包选项；正式发布仍要求源码加入 Git 跟踪。
- 旧 `--no-clean` 参数仍可传入，但会提示已弃用：发行目录始终重建，Cargo 编译缓存仍复用。
- `smoke_nuitka.py [release_dir]` 可指定发行目录；默认检查唯一的 Rust 发行包。
- Nuitka 内部入口、旧 Python 后端及启动回退已移除；历史实现保存在 Git 记录中。

产物仍位于 `build/release/Nori.Web-<system>-<architecture>/`，包含 `Nori.Web[.exe]`、`public/`、`backend/data/`、`legal/licenses/`、`source/project.zip` 和 `source/rust-vendor.zip`。分发时保留整个发行目录；素材权利限制见 [COPYRIGHT.md](../COPYRIGHT.md)。

GitHub Actions 使用 `.github/workflows/rust-local-build.yml`（**Rust Local Build**），支持手动触发及 `v*` 标签，在 Windows、Linux 和 macOS 上原生构建并验证。旧 Nuitka workflow 不再使用。
