# 唱片行

一个「音乐杂志 / 唱片行」风格的网页音乐播放器。暖纸色版面、衬线大标题、朱红点缀，
首页按一期杂志来排：封面故事、今日推荐、编辑精选、新碟上架、排行榜。

数据层对接 **网易云 API 风格** 的后端（如自建的 NeteaseCloudMusicApi）。没配后端时用内置示例数据，
每首示例歌都是浏览器现场合成的短旋律，可以直接试听。

## 运行

```bash
npm install
npm run dev        # http://127.0.0.1:5180
npm run build      # 产物在 dist/，纯静态文件，随便放哪个静态服务器
```

后端地址两种配法：

- 页面里「设置 → 后端地址」填写，保存在浏览器本地；
- 或者构建前在 `.env` 里写 `VITE_API_BASE=http://你的地址`（参考 `.env.example`），作为默认值。

接口清单、参数和字段见 [docs/API.md](docs/API.md)。

## 功能

- 首页、歌单、专辑（按 A/B 面编号）、艺人、搜索（单曲 / 唱片 / 艺人 / 歌单，分页）
- 播放条：上一首 / 下一首、进度拖动、音量、四种播放模式（顺序、列表循环、单曲循环、随机）
- 正在播放：唱片转动 + 滚动歌词（支持翻译、点击歌词跳转）
- 播放队列抽屉：跳转、移除、清空、「下一首播放」
- 扫码登录、收藏、我的歌单（唱片架）
- 白纸 / 夜读两套主题，可跟随系统；手机宽度自适应
- 系统媒体键（Media Session）、快捷键：空格、← →、Shift + ← →、L、/
- 队列、音量、模式、设置保存在本地

## 目录

```
src/
├── api/
│   ├── provider.ts      MusicProvider 接口：前端需要的全部数据能力
│   ├── types.ts         领域模型（Track / Album / Playlist …）
│   ├── netease/         网易云 API 风格实现：请求封装 + 字段归一化
│   ├── mock/            示例数据 + 合成音频
│   └── index.ts         按设置选择 provider
├── player/              播放引擎（单个 <audio>）、浮层状态
├── lib/                 路由、设置、登录态、LRC 解析、格式化
├── components/          播放条、正在播放、队列、曲目单、卡片 …
├── views/               各个页面
└── styles/              tokens.css（颜色、字体变量）+ app.css
```

技术栈：Vite 5 + React 18 + TypeScript，无 UI 库、无状态管理库。
字体通过 `@fontsource` 本地打包（思源宋体、IBM Plex Mono），不依赖 Google Fonts。
