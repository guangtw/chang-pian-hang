# 唱片行

miningqwqmusic 的新前端。版式像音乐杂志，交互围绕一台唱机：
每张卡片是一只唱片封套，悬停时黑胶滑出；「正在播放」是一台俯视的唱机，
唱臂的位置就是播放进度，可以拖动唱臂跳转。全站强调色取自当前播放的封面，换歌时平滑过渡。

数据全部来自 [guangtw/miningqwqmusic](https://github.com/guangtw/miningqwqmusic) 的 BFF（`/api/music/*`、`/api/account/*`），
前端不内置任何示例数据，首页区块、标题、顺序都按后端返回渲染。

## 运行

```bash
cp .env.example .env.local   # 把 BFF_TARGET 改成 BFF 的地址
npm install
npm run dev                  # http://127.0.0.1:5180，/api 会代理到 BFF_TARGET
npm run build                # 产物在 dist/，纯静态文件
```

本地没有真实音乐源时，可以让 BFF 用它自带的 mock：在 miningqwqmusic 里设置
`MUSIC_SOURCE_MOCK_ENABLED=true` 后 `npm run dev`，再把这里的 `BFF_TARGET` 指过去。

**部署**：推荐把 `dist/` 和 BFF 放在同一个域名下（例如由 Next.js 的 `public/` 或 Nginx 提供静态文件），
这样登录用的 httpOnly cookie 不用跨域。分开部署时设置 `VITE_API_BASE`，BFF 需要允许跨域并带凭证。

## 配置都在哪

| 想改什么 | 改哪里 |
| --- | --- |
| 站名、刊号、导航、首页区块用什么版式、音质选项、接口路径 | [src/config/site.ts](src/config/site.ts) |
| 构建时注入的地址、站名、默认音质 | `.env.local`（参考 [.env.example](.env.example)） |
| 颜色、字体、圆角、阴影 | [src/styles/tokens.css](src/styles/tokens.css) |
| 动效（页面过渡、入场、浮层进出） | [src/styles/motion.css](src/styles/motion.css) |
| BFF 返回的数据结构 | [src/api/types.ts](src/api/types.ts)（与 BFF 的 `src/types/*.ts` 对齐） |

对接细节见 [docs/BACKEND.md](docs/BACKEND.md)。

## 功能

- 首页：按后端推荐区块动态排版（横幅条、封套网格、横向唱片架、榜单列表），封面故事自动选取
- 歌单、榜单、专辑（A/B 面编号）、艺人、榜单总览、搜索（单曲 / 艺人 / 歌单，联想、分页）
- 播放：顺序 / 列表循环 / 单曲循环 / 随机；队列抽屉；「下一首播放」；系统媒体键
- 播放地址短时效：暂停过久或播放出错时自动续签，并从原位置继续
- 唱片架：收藏、最近播放。未登录存在本机；登录后与账户服务同步，本机独有的收藏会补传
- 登录 / 注册（邮箱 + 密码），access token 只在内存，刷新靠 BFF 下发的 cookie；BFF 没开账户服务时自动隐藏登录入口
- 日间 / 夜间 / 跟随系统；动画可在设置里精简，也遵循系统「减少动态效果」

## 动效怎么做的

- 页面切换用 View Transitions API：封面从卡片「飞」到详情页头图，返回时飞回去；不支持的浏览器退化为入场动画
- 打开唱机时，播放台上的小唱片飞到唱盘上
- 唱片转速、唱臂位置用弹簧模型逐帧计算：开始播放时慢慢转起来，暂停时带惯性停下
- 进度条、歌词每帧直接读 `audio.currentTime` 改 DOM，不触发 React 渲染
- 强调色用 `@property` 注册，换歌时色相平滑过渡
- 只动画 transform / opacity / filter

## 目录

```
src/
├── config/site.ts      所有可配置项
├── api/                BFF 客户端：http.ts（统一外壳、错误）、music.ts、types.ts
├── lib/
│   ├── account.ts      登录态、token 刷新、唱片架同步
│   ├── motion.ts       视图过渡、共享封面、弹簧、帧循环、退场动画
│   ├── palette.ts      封面取色
│   └── …               路由、设置、歌词、格式化
├── player/             播放引擎（单个 <audio>）、浮层状态
├── components/         唱机、黑胶、封套卡片、播放台、歌词页、队列、登录框 …
├── views/              各页面
└── styles/             tokens.css / app.css / motion.css
```

技术栈：Vite 5 + React 18 + TypeScript，没有 UI 库和状态管理库。
字体：Space Grotesk（拉丁与数字）+ 系统中文黑体，等宽用 IBM Plex Mono，都本地打包。
