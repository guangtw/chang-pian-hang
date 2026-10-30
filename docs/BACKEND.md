# 对接 miningqwqmusic BFF

前端只和 BFF 说话，不直连私有音乐源。路径都在 [src/config/site.ts](../src/config/site.ts) 的 `api.paths` 里，
BFF 改了路由只需改那里。

## 响应外壳

与 BFF 的 `src/lib/api-response.ts` 一致：

- 成功：`{ code: 0, data, message, traceId }` → 前端取 `data`
- 失败：`{ code, message, traceId, retryable }` → 抛 `ApiError`。界面优先显示 `api.errorText` 里该 code 的中文说明；
  没配的 code，后端给中文就原样显示，否则显示 `api.errorFallback`

## 用到的音乐接口

| 用途 | 路径 | 参数 |
| --- | --- | --- |
| 首页推荐区块 + 搜索提示 | `GET /api/music/discover/home` | — |
| 搜索联想 / 热搜 | `GET /api/music/discover/search-assist` | `q` |
| 搜单曲 / 艺人 / 歌单 | `GET /api/music/search`、`/search/artists`、`/search/playlists` | `q, page（从 1 起）, pageSize` |
| 单曲详情 | `GET /api/music/track/:id` | — |
| 播放地址 | `GET /api/music/track/:id/play-url` | `level`；有登录时带 `Authorization: Bearer` |
| 歌词 | `GET /api/music/track/:id/lyric` | — |
| 歌单 / 榜单详情 | `GET /api/music/playlist/:id`、`/toplist/:id` | — |
| 榜单总览（含前三名） | `GET /api/music/toplist` | — |
| 专辑 / 艺人 | `GET /api/music/album/:id`、`/artist/:id` | — |

播放地址里的 `expiresAt` / `ttlSeconds` 用来判断过期：恢复播放前若快过期（提前 `api.playUrlRenewLeadSeconds` 秒）就重新取，
`<audio>` 报错时也会续签一次再从原位置继续。`preview: true` 时会提示只有试听片段。

## 榜单封面替换

前端在拿到数据后，把榜单类条目的 `coverUrl` 换成本地生成的 SVG（[src/lib/covers.ts](../src/lib/covers.ts)）：
`discover/home` 里 `type: 'toplist'` 的条目、`toplist`、`toplist/:id`，以及 id 属于官方榜单的 `playlist/:id` 和歌单搜索结果
（第一次需要时会拉一次 `toplist` 记下榜单 id）。后端不需要做任何改动。

## 首页区块怎么排

`discover/home` 返回的每个区块按 `homeLayout` 规则选版式：先看区块 id 有没有在 `byBlockId` 里指定，
没有就看区块里多数条目的 `type`（`byItemType`）。后端新增区块不需要改前端，会自动套用对应版式。
条目点开后的去向与 BFF 的 `discover-action.ts` 语义一致：歌单 / 榜单 / 专辑 / 艺人进详情页，
单曲直接播放，带网页链接（http/https）的横幅新窗口打开；`orpheus://` 这类 App 内链接不可点。
上游给不出真实 id 时会填 `"0"`，这类艺人 / 专辑不会做成链接。

## 账户接口（可选）

BFF 配了 `ACCOUNT_SERVICE_BASE_URL` 才会启用；没配时 `auth/refresh` 返回 code `5401`，前端隐藏登录入口，收藏只存本机。

| 用途 | 路径 |
| --- | --- |
| 登录 / 注册 | `POST /api/account/auth/login`、`/auth/register`，body `{ email, password, nickname? }` |
| 刷新 access token | `POST /api/account/auth/refresh`（靠 httpOnly cookie） |
| 当前用户 | `GET /api/account/auth/me` |
| 退出 | `POST /api/account/auth/logout` |
| 唱片架快照 | `GET /api/account/library/snapshot` |
| 收藏 / 取消收藏 | `POST /api/account/library/favorites` body `{ track }`；`DELETE /api/account/library/favorites/:id` |
| 记一条最近播放 | `POST /api/account/library/recent` body `{ track }` |

任何带登录态的请求遇到 401 会先刷新一次 token 再重试；刷新返回 `5203` / `5204` 视为会话失效，回到游客状态。
刚登录时会拉一次快照，并把本机有、云端没有的收藏补传上去。
