// 示例数据：没有配置后端时使用。艺人、专辑、歌词都是虚构的。
import type { Album, Artist, Playlist, Toplist, Track } from '../types';

const INKS = ['#b4381e', '#1f3a5f', '#2f5d50', '#c08a2e', '#5b3a5e', '#1f1c18', '#8a4b2a', '#3f6e8c', '#7a7d3a', '#a3473f'];
const PAPERS = ['#efe6d4', '#e8dcc6', '#f3eee4', '#dfe3dc', '#ecd9c6'];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** 生成一张「版画风」封面 SVG */
export function makeCover(seed: string, title: string): string {
  const h = hash(seed);
  const ink = INKS[h % INKS.length];
  const ink2 = INKS[(h >>> 4) % INKS.length];
  const paper = PAPERS[(h >>> 8) % PAPERS.length];
  const kind = (h >>> 12) % 5;
  let art = '';
  if (kind === 0) art = `<circle cx="150" cy="128" r="84" fill="${ink}"/><rect x="0" y="210" width="300" height="90" fill="${ink2}"/>`;
  else if (kind === 1)
    art = Array.from({ length: 9 }, (_, i) => `<rect x="${20 + i * 30}" y="30" width="14" height="210" fill="${i % 3 === 0 ? ink2 : ink}"/>`).join('');
  else if (kind === 2) art = `<path d="M0 300 L0 150 A150 150 0 0 1 300 150 L300 300Z" fill="${ink}"/><circle cx="210" cy="80" r="26" fill="${ink2}"/>`;
  else if (kind === 3)
    art = Array.from({ length: 36 }, (_, i) => `<circle cx="${45 + (i % 6) * 42}" cy="${40 + Math.floor(i / 6) * 38}" r="${(((h >>> (i % 20)) & 7) + 4)}" fill="${ink}"/>`).join('');
  else art = `<rect x="34" y="34" width="232" height="232" fill="none" stroke="${ink}" stroke-width="10"/><text x="150" y="196" text-anchor="middle" font-size="150" font-family="serif" fill="${ink2}">${esc(title.slice(0, 1))}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="${paper}"/>${art}<text x="18" y="288" font-size="13" font-family="monospace" fill="${kind === 0 || kind === 2 ? paper : ink}" letter-spacing="1">${esc(title.slice(0, 14))}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const artists: Artist[] = [
  { id: 'a1', name: '林间信号', description: '来自海边小城的三人乐队，擅长把合成器和木吉他放在一起。第一张专辑在仓库里录了整整一个冬天。' },
  { id: 'a2', name: '白日梦旅馆', description: '独立创作人，作品多写城市夜晚与搬家。现场只带一把电吉他和一台旧采样器。' },
  { id: 'a3', name: '周末有雨', description: '城市民谣二人组。歌名大多取自天气预报，歌词写的却是天气之外的事。' },
  { id: 'a4', name: '北岸', description: '器乐后摇乐队，曲子很长，名字很短。' },
  { id: 'a5', name: '纸飞机合唱团', description: '由一群中学老师组成的业余合唱团，偶尔也唱流行。' },
  { id: 'a6', name: '赤道以南', description: '电子制作人，常年在旅途中用手机录环境声当素材。' },
].map((a) => ({ ...a, avatar: makeCover('artist' + a.id, a.name) }));

const artistById = Object.fromEntries(artists.map((a) => [a.id, a]));

const albumSpecs: { id: string; name: string; artist: string; year: number; company: string; desc: string; tracks: string[] }[] = [
  { id: 'al1', name: '潮汐表', artist: 'a1', year: 2025, company: '浅滩唱片', desc: '七首关于等待的歌，按涨潮和退潮的顺序排列。', tracks: ['涨潮', '灯塔看守人', '咸的风', '第七个浪', '退潮以后', '沙上的字', '夜航'] },
  { id: 'al2', name: '搬家记', artist: 'a2', year: 2024, company: '自主发行', desc: '五年搬了六次家，每次都留下一首歌。', tracks: ['纸箱', '新钥匙', '楼下的猫', '没拆的行李', '墙上的钉子', '最后一盏灯'] },
  { id: 'al3', name: '晴转多云', artist: 'a3', year: 2025, company: '慢车音乐', desc: '用一年的天气预报写成的日记。', tracks: ['晴转多云', '傍晚有风', '湿度百分之九十', '降温', '明日小雨', '雨后'] },
  { id: 'al4', name: '远处', artist: 'a4', year: 2023, company: '回声工厂', desc: '只有四首曲子，每首都在十分钟左右。', tracks: ['起', '承', '转', '合'] },
  { id: 'al5', name: '放学路上', artist: 'a5', year: 2024, company: '纸飞机', desc: '在学校礼堂里录的现场。', tracks: ['铃声', '操场', '小卖部', '回家的路'] },
  { id: 'al6', name: '经纬度', artist: 'a6', year: 2025, company: '低频站', desc: '每首歌的名字都是一个坐标。', tracks: ['北纬三十度', '东经一百二十一度', '赤道', '回归线', '时差'] },
  { id: 'al7', name: '短波', artist: 'a1', year: 2023, company: '浅滩唱片', desc: '乐队的第一张 EP，全部在仓库里录制。', tracks: ['调频', '杂音', '收到请回答'] },
  { id: 'al8', name: '凌晨两点', artist: 'a2', year: 2025, company: '自主发行', desc: '失眠时写的歌，适合失眠时听。', tracks: ['便利店', '空车', '凌晨两点', '天快亮了'] },
];

export const albums: Album[] = albumSpecs.map((a) => ({
  id: a.id,
  name: a.name,
  cover: makeCover('album' + a.id, a.name),
  artists: [{ id: a.artist, name: artistById[a.artist].name }],
  publishTime: new Date(a.year, (hash(a.id) % 12), 1 + (hash(a.id) % 27)).getTime(),
  company: a.company,
  description: a.desc,
  trackCount: a.tracks.length,
}));

export const tracks: Track[] = albumSpecs.flatMap((a, ai) =>
  a.tracks.map((name, i) => ({
    id: `t${ai + 1}-${i + 1}`,
    name,
    artists: [{ id: a.artist, name: artistById[a.artist].name }],
    album: { id: a.id, name: a.name, cover: albums[ai].cover },
    duration: (28 + (hash(a.id + name) % 20)) * 1000,
    playable: true,
  })),
);

const pick = (seed: string, n: number) =>
  [...tracks].sort((x, y) => hash(seed + x.id) - hash(seed + y.id)).slice(0, n);

const playlistSpecs = [
  { id: 'p1', name: '雨天适合听的唱片', desc: '窗外下雨的时候，把音量调小一点。这一期我们挑了一些适合在雨天反复听的歌，从清晨的毛毛雨一直到深夜的暴雨。', tags: ['民谣', '安静'] },
  { id: 'p2', name: '通勤路上的半小时', desc: '地铁两站之间刚好够听完一首。', tags: ['流行', '通勤'] },
  { id: 'p3', name: '深夜电台', desc: '睡不着的时候，有人陪你醒着。', tags: ['夜晚', '电子'] },
  { id: 'p4', name: '周日早晨', desc: '咖啡、阳光和不着急的旋律。', tags: ['轻松'] },
  { id: 'p5', name: '写作时的背景音', desc: '没有人声或很少人声，适合专注。', tags: ['器乐', '专注'] },
  { id: 'p6', name: '海边公路', desc: '摇下车窗，跟着唱。', tags: ['旅行'] },
  { id: 'p7', name: '独立乐队新声', desc: '这个月值得一听的新乐队。', tags: ['独立'] },
  { id: 'p8', name: '老唱片店的角落', desc: '店主私藏，不常摆上货架。', tags: ['怀旧'] },
];

export const playlists: (Playlist & { trackIds: string[] })[] = playlistSpecs.map((p, i) => {
  const list = pick(p.id, 8 + (hash(p.id) % 8));
  return {
    id: p.id,
    name: p.name,
    cover: makeCover('pl' + p.id, p.name),
    description: p.desc,
    creator: { id: 'u0', name: '唱片行编辑部' },
    trackCount: list.length,
    playCount: 12000 + hash(p.id) % 900000,
    tags: p.tags,
    updatedAt: Date.now() - i * 86400000 * 3,
    trackIds: list.map((t) => String(t.id)),
  };
});

export const toplists: (Toplist & { trackIds: string[] })[] = [
  ['tl1', '飙升榜', '每天更新'],
  ['tl2', '新歌榜', '每天更新'],
  ['tl3', '原创榜', '每周四更新'],
  ['tl4', '热歌榜', '每周四更新'],
].map(([id, name, freq]) => {
  const list = pick(id, 20);
  return {
    id,
    name,
    cover: makeCover('tl' + id, name),
    updateFrequency: freq,
    trackCount: list.length,
    trackIds: list.map((t) => String(t.id)),
  };
});

const LYRIC_POOL = [
  '窗外的路灯又亮了一盏',
  '我把昨天折成纸飞机',
  '风从很远的地方赶来',
  '你说潮水总会回来',
  '旧唱片转了一圈又一圈',
  '我们在站台上数着车厢',
  '天气预报说明天有雨',
  '钥匙还挂在门后面',
  '有些话写在信封背面',
  '城市在凌晨安静下来',
  '收音机里传来熟悉的歌',
  '把灯关掉也能看见你',
  '海面上漂着一封没寄出的信',
  '我们沿着铁轨走了很久',
  '日落之前要赶回家',
  '这首歌唱到一半就停了',
];

export function makeLrc(id: string, durationMs: number): string {
  const h = hash(id);
  const lines: string[] = ['[00:00.00]（前奏）'];
  const step = 3500;
  for (let t = 3000, i = 0; t < durationMs - 2000; t += step, i++) {
    const m = Math.floor(t / 60000);
    const s = ((t % 60000) / 1000).toFixed(2).padStart(5, '0');
    lines.push(`[${String(m).padStart(2, '0')}:${s}]${LYRIC_POOL[(h + i * 7) % LYRIC_POOL.length]}`);
  }
  return lines.join('\n');
}

export const trackById = new Map(tracks.map((t) => [String(t.id), t]));
