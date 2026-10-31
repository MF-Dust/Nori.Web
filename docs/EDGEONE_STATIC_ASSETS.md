# EdgeOne 静态资源托管

主站、Rust / Workers 后端、API、WebSocket、R2 和用户存档不迁移。仅将下面的静态资源接入独立域名：

- `ARGNori_web/`、`Nori_web/`：Live2D 模型及关联文件
- `fonts/`、`fonts.css`：本地字体镜像
- `ocean/`：启动/故事场景贴图
- `cubism_sdk/`：Cubism Core

`cosmicweb.min.glb`、其他图片/音频及应用代码仍由主站提供。原始 `public/` 不删除，便于切回。

## 1. 生成直接上传包

仓库根目录运行（Python 3，无需 zip 命令或额外依赖）：

```sh
npm run assets:edgeone
```

产物：`.artifacts/edgeone/nori-eo-static.zip`。ZIP 根目录包含 `index.html`、`edgeone.json` 和资源目录，还包含 `legal/` 许可及来源说明。脚本只在包内将字体 CSS 的 `/fonts/` URL 改为 `./fonts/`，不会改动源文件。

打包前检查单文件不超过 25,000,000 字节、文件数不超过 20,000、解压总大小不超过 5,000,000,000 字节。以上按此方案的额度保守设置，不代表账户的实时配额；上传前以控制台为准，也需考虑其他项目已用容量。

## 2. 上传与绑定域名

在 EdgeOne Makers 创建直接上传项目，上传上述 ZIP，绑定自定义资源域名并启用 HTTPS。区域、备案和资源使用政策以账户及官方要求为准。不要把临时预览域名作为长期资源地址。

- [直接上传说明](https://pages.edgeone.ai/zh/document/direct-upload)
- [edgeone.json 配置](https://pages.edgeone.ai/document/edgeone-json)

包内响应头：公共资源允许 `Access-Control-Allow-Origin: *`；五个资源目录浏览器缓存一年并标记 `immutable`；`fonts.css`、入口和许可说明缓存五分钟。上传后应实际核对这些响应头是否生效。

**一年缓存要求 URL 对应的内容不变。** 如需替换模型/字体，使用新的版本化资源域名重新上传并重新构建主站；不要仅覆盖同一地址期待已有浏览器立即更新。

## 3. 构建主站接入

静态域名通过构建环境变量配置，不是运行时后端变量：

```sh
NORI_STATIC_ORIGIN=https://static.example.com npm run frontend:app:build
npm run frontend:cutover:candidate
```

Cloudflare 自动构建时，将 `NORI_STATIC_ORIGIN` 设置在其构建环境中。只接受 HTTP(S) origin，不接受路径、账号密码、查询参数或 fragment；生产部署使用 HTTPS。

配置同时作用于 HTML 中的字体预加载、字体 CSS、Cubism 脚本，以及前端模型入口、海洋贴图和首屏下载器。模型内部文件继续由引擎相对于模型目录解析。第三方字体 CSS 请求已移除；CSS 中重复的本地字体定义也已移除，统一由 `fonts.css` 提供。源码发布候选目录会保留完整字体镜像，以支持无 EO 配置的同源部署。

首屏清单 `/asset-manifest.json` 仍来自主站。下载器跨域请求不带 `x-asset-loader`，仍按流式字节数显示真实进度、重试和写入 Cache Storage。缓存记录使用完整的远程 URL，避免切换域名后复用错误来源；Service Worker 只缓存配置来源下的指定目录，跳过首屏的 `no-store` 下载。浏览器不支持/禁止 Service Worker 时仍可加载，重复访问主要依赖 HTTP 缓存。

### 切回 Cloudflare

清空/移除 `NORI_STATIC_ORIGIN` 后重新构建并部署，所有上述资源回到主站。这是配置回退，**不是 EO 故障时的自动重试回源**。

## 4. 验证

```sh
npm run test:edgeone
npm run frontend:runtime:test
npm run frontend:typecheck

curl -I -H 'Origin: https://app.example.com' https://static.example.com/ARGNori_web/ARGNori.model3.json
curl -I -H 'Origin: https://app.example.com' https://static.example.com/ARGNori_web/ARGNori.4096/texture_00.png
curl -I -H 'Origin: https://app.example.com' https://static.example.com/fonts/sarasa-fixed-sc.woff2
curl -I https://static.example.com/fonts.css
```

部署后确认 200、Content-Type、CORS 和缓存头；浏览器检查桌面与终局 Live2D、海洋场景、字体，确认模型关联纹理/动作也请求资源域名，没有 CORS 错误及第三方字体 CSS 请求。再检查二次启动缓存和实际大陆网络效果。此仓库改动不会上传到 EdgeOne，也不会设置 DNS 或证书。
