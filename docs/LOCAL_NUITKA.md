# Nuitka 本地发行包

Nori.Web 可以使用 Nuitka 编译为无需目标机器预装 Python 的 standalone 本地发行目录。

## 本地构建

安装本地运行依赖与构建依赖：

```bash
uv sync --extra local --group build
```

构建：

```bash
uv run python scripts/build_nuitka.py
```

产物位于：

```text
build/release/Nori.Web-<system>-<architecture>/
```

启动目录中的 `Nori.Web`（Windows 为 `Nori.Web.exe`），然后访问：

```text
http://127.0.0.1:4173/
```

本地环境变量与直接运行 `python server.py` 时相同，例如 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`、`HOST`、`PORT` 与 `NORI_DISABLE_LIVE_PACK`。

## GitHub Actions 手动构建

仓库提供 `.github/workflows/nuitka-local-build.yml`，仅支持手动触发，不会在普通 push 或 pull request 时自动消耗三平台编译时间。

在 GitHub 仓库中打开 **Actions → Nuitka Local Build → Run workflow**。一次运行会分别在 Windows、Linux 与 macOS 的 GitHub-hosted runner 上进行原生编译。

每个平台都会：

1. 使用 Python 3.13 与 Nuitka 4.2；
2. 以 standalone 模式编译本地服务；
3. 将 `public/` 与 `backend/data/` 递归放入发行目录；
4. 启动编译后的程序并检查 `/api/entry-status` 与 `/`；
5. 上传 `Nori.Web-<OS>-<architecture>` artifact，保留 14 天。

CI 产物未进行 Windows 代码签名或 Apple notarization，因此操作系统可能将下载的二进制标记为未签名应用。正式公开发布时建议另行加入签名流程。

## 为什么先使用 standalone

Nori.Web 包含较多前端、Live2D 与世界数据资源。standalone 目录可以直接访问这些随包资源，启动时也无需像 onefile 那样先展开整个资源包，更适合作为当前的本地发行形式。等三平台 standalone 经过实际用户验证后，再增加 onefile 作为可选发布格式会更稳妥。
