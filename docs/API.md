# 后端接口约定

前端所有数据都经过 [`src/api/provider.ts`](../src/api/provider.ts) 里的 `MusicProvider` 接口。
默认实现 [`src/api/netease/`](../src/api/netease/) 按 **NeteaseCloudMusicApi** 的路径和字段来请求和解析，
你的后端只要兼容下面这些接口，在「设置 → 后端地址」填上地址就能用。

## 请求方式

- 全部是 `GET {后端地址}/{路径}?参数`。
- 登录后，后端返回的 cookie 会保存在浏览器本地，之后每个请求都带上 `cookie=<原样字符串>` 参数。
- 设置里开着「跨域 Cookie」时，请求会带 `credentials: include`。这时后端需要回
  `Access-Control-Allow-Origin: <前端域名>`（不能是 `*`）和 `Access-Control-Allow-Credentials: true`。
- 登录相关、个人数据相关的接口会额外带 `timestamp=<毫秒>` 防缓存。
- 响应体里有数字 `code` 且不是 200 时，前端当作错误，显示 `message` 或 `msg`。

## 接口清单

| 前端方法 | 路径 | 参数 | 前端读取的字段 |
| --- | --- | --- | --- |
| `getRecommendPlaylists` | `personalized` | `limit` | `result[].{id,name,picUrl,playCount,copywriter}` |
| `getToplists` | `toplist` | — | `list[].{id,name,coverImgUrl,description,updateFrequency}` |
| `getNewAlbums` | `album/newest` | — | `albums[]`（专辑对象） |
| `getDailyTracks` | `recommend/songs` | 需登录 | `data.dailySongs[]`（歌曲对象） |
| `getPlaylist` | `playlist/detail` | `id` | `playlist.{id,name,coverImgUrl,description,creator,trackCount,playCount,tags,tracks}` |
| 〃 | `playlist/track/all` | `id, limit=1000` | `songs[]`；失败时退回 `playlist.tracks` |
| `getAlbum` | `album` | `id` | `album`（专辑对象）, `songs[]` |
| `getArtist` | `artists` | `id` | `artist.{id,name,picUrl,briefDesc,albumSize,musicSize}`, `hotSongs[]` |
| 〃 | `artist/album` | `id, limit=24` | `hotAlbums[]` |
| `getTracks` | `song/detail` | `ids=1,2,3` | `songs[]` |
| `getSongSource` | `song/url/v1` | `id, level` | `data[0].{url,br,freeTrialInfo}`；`url` 为空则跳过这首 |
| `getLyric` | `lyric` | `id` | `lrc.lyric`, `tlyric.lyric`（LRC 文本） |
| `searchTracks` | `cloudsearch` | `keywords, type=1, limit, offset` | `result.songs[]`, `result.songCount` |
| `searchAlbums` | `cloudsearch` | `type=10` | `result.albums[]`, `result.albumCount` |
| `searchArtists` | `cloudsearch` | `type=100` | `result.artists[]`, `result.artistCount` |
| `searchPlaylists` | `cloudsearch` | `type=1000` | `result.playlists[]`, `result.playlistCount` |
| `getHotKeywords` | `search/hot/detail` | — | `data[].{searchWord,content}` |
| `createQrLogin` | `login/qr/key` → `login/qr/create` | `key, qrimg=true` | `data.unikey`；`data.{qrimg,qrurl}` |
| `checkQrLogin` | `login/qr/check` | `key` | `code`：801 等待 / 802 已扫码 / 803 成功（带 `cookie`）/ 800 过期 |
| `getCurrentUser` | `login/status` | — | `data.profile.{userId,nickname,avatarUrl,signature}` |
| `logout` | `logout` | — | — |
| `getUserPlaylists` | `user/playlist` | `uid, limit=100` | `playlist[]` |
| `getLikedIds` | `likelist` | `uid` | `ids[]` |
| `setLiked` | `like` | `id, like=true/false` | — |

**歌曲对象**：新格式 `{id,name,ar[],al{id,name,picUrl},dt,tns[],alia[],privilege.st}` 和旧格式
`{id,name,artists[],album{},duration,transNames[],alias[]}` 都能识别。`privilege.st < 0` 时标为不可播放。

**专辑对象**：`{id,name,picUrl,artist,artists[],publishTime,company,description,size}`。

**图片**：如果图片地址支持网易云的 `?param=300y300` 缩略参数会自动拼上；data URL 和已带 `param=` 的地址原样使用。

## 后端不是网易云格式怎么办

照着 `src/api/netease/index.ts` 新建一个 provider，实现 `MusicProvider` 的全部方法，把返回值转成
[`src/api/types.ts`](../src/api/types.ts) 里的类型，然后在 [`src/api/index.ts`](../src/api/index.ts) 里把它接上。
视图层不用改。
