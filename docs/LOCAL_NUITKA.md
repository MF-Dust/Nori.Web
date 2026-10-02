# Nuitka 本地发行包

Nori.Web 可以使用 Nuitka 编译为无需目标机器预装 Python 的 standalone 本地发行目录。

## 本地构建

安装本地运行依赖与构建依赖：

```bash
uv sync --no-dev --extra local --group build
```

依赖或项目声明变更后，先执行 `npm ci && npm run legal:refresh` 并提交生成的 `public/legal/` 更新。构建前应将本次发布的源码与法律文件加入 Git 跟踪（`git add` / commit）；脚本拒绝遗漏未跟踪文件。`uv sync` 生成的 `uv.lock` 会自动收入源码归档，不要求预先提交。

构建：

```bash
uv run --no-dev --extra local --group build python scripts/build_nuitka.py
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
3. 将 `public/` 与 `backend/data/` 递归放入发行目录，并随包交付许可证与对应源码；
4. 启动编译后的程序并检查 API、网页、非官方标识和授权文件；
5. 上传 `Nori.Web-<OS>-<architecture>` artifact，保留 14 天。

CI 产物未进行 Windows 代码签名或 Apple notarization，因此操作系统可能将下载的二进制标记为未签名应用。正式公开发布时建议另行加入签名流程。

## 许可证与对应源码交付

构建前会从 PyPI 获取**当前构建环境实际安装版本**的 Python 运行依赖源码（包括 `python-chess` 与 `chess`），校验 PyPI 提供的 SHA-256；此步骤需要网络。缺少源码归档或依赖许可证时构建报错。它不安装或执行下载的源码。

发行目录包含：

```text
LICENSE / COPYRIGHT.md / THIRD_PARTY_NOTICES.md
licenses/PYTHON-LICENSE.txt
licenses/python/<package-version>/...
source/project.zip                 # 实际工作树文件，而非仅仓库链接
source/dependencies/               # 对应版本的 Python 运行依赖源码
source/dependencies.json           # 版本、来源 URL、SHA-256
source/requirements-runtime.txt    # 构建所用运行依赖的精确版本
source/README.md                   # 解包、修改和重建说明
public/legal/                     # 网页可访问的许可证与字体声明
```

`project.zip` 保留 Git 跟踪文件的当前内容（包含尚未提交的已跟踪修改），以及生成的 `uv.lock`；不收集 `.env`、未跟踪文件或 Git 历史。不要把凭据加入 Git 跟踪。请把整个发行目录一同发布，不要只发送可执行文件或删除 `source/`、`licenses/`。接收者可以按 GPL 修改并重建自有后端，无需激活码或签名密钥。

收集器支持未修改的标准 PyPI 依赖。若使用本地补丁、私有 fork 或额外原生组件，必须提供实际修改源码及其构建说明；上游同版本源码不能替代这些修改。编译工具/系统库遵循各自许可。

**尚未解决的资产权利**：当前仍会打包历史前端、原站素材及 Live2D。它们不因自有代码采用 GPL 或附带源码而获得授权。公开分发前，须确认这些内容的许可或移除/替换；本次构建不会自动删除这些内容。`NORI_DISABLE_LIVE_PACK=1` 只是运行时禁用归档加载，不是素材过滤器。

## 为什么先使用 standalone

Nori.Web 包含较多前端、Live2D 与世界数据资源。standalone 目录可以直接访问这些随包资源，启动时也无需像 onefile 那样先展开整个资源包，更适合作为当前的本地发行形式。等三平台 standalone 经过实际用户验证后，再增加 onefile 作为可选发布格式会更稳妥。
