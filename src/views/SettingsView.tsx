import { useState, useSyncExternalStore } from 'react';
import { request } from '../api/netease/client';
import type { Quality } from '../api';
import { getSettings, subscribeSettings, updateSettings, type Theme } from '../lib/settings';
import { toast } from '../lib/toast';
import { clearQueue } from '../player/player';

const QUALITIES: { key: Quality; label: string }[] = [
  { key: 'standard', label: '标准' },
  { key: 'higher', label: '较高' },
  { key: 'exhigh', label: '极高' },
  { key: 'lossless', label: '无损' },
  { key: 'hires', label: 'Hi-Res' },
];

const THEMES: { key: Theme; label: string }[] = [
  { key: 'auto', label: '跟随系统' },
  { key: 'paper', label: '白纸' },
  { key: 'night', label: '夜读' },
];

type Probe = { state: 'idle' | 'testing' } | { state: 'ok'; detail: string } | { state: 'bad'; detail: string };

export function SettingsView() {
  const settings = useSyncExternalStore(subscribeSettings, getSettings);
  const [base, setBase] = useState(settings.apiBase);
  const [probe, setProbe] = useState<Probe>({ state: 'idle' });

  const saveBase = () => {
    const next = base.trim().replace(/\/+$/, '');
    if (next === settings.apiBase) return;
    // 换数据源后旧队列里的歌 id 不再有效
    clearQueue();
    updateSettings({ apiBase: next, cookie: '' });
    toast(next ? '已切换到你的后端。' : '已切回示例数据。');
  };

  const test = async () => {
    const target = base.trim().replace(/\/+$/, '');
    if (!target) return setProbe({ state: 'bad', detail: '先填一个地址。' });
    setProbe({ state: 'testing' });
    try {
      const res = await request('search/hot/detail', {}, { base: target });
      setProbe({ state: 'ok', detail: `连上了，热搜返回 ${res.data?.length ?? 0} 条。` });
    } catch (e) {
      setProbe({ state: 'bad', detail: (e as Error).message });
    }
  };

  return (
    <div className="page">
      <div className="issue-bar mono">
        <span>设置</span>
        <span>{settings.apiBase ? '网易云 API' : '示例数据'}</span>
      </div>
      <h1 className="feature-title" style={{ fontSize: 40, margin: '24px 0 8px' }}>
        编辑部设置
      </h1>

      <div className="form">
        <div className="field">
          <label htmlFor="api-base">后端地址</label>
          <div>
            <input
              id="api-base"
              className="input mono"
              style={{ fontSize: 14 }}
              value={base}
              onChange={(e) => setBase(e.target.value)}
              onBlur={saveBase}
              onKeyDown={(e) => e.key === 'Enter' && saveBase()}
              placeholder="http://127.0.0.1:3000"
            />
            <p className="help">
              填网易云 API 风格的服务地址（比如自建的 <code>NeteaseCloudMusicApi</code>）。留空则使用内置示例数据，每首歌是程序合成的短旋律。
            </p>
            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn" onClick={test} disabled={probe.state === 'testing'}>
                {probe.state === 'testing' ? '测试中…' : '测试连接'}
              </button>
              {(probe.state === 'ok' || probe.state === 'bad') && (
                <span style={{ fontSize: 13 }}>
                  <span className={`status-dot ${probe.state}`} />
                  {probe.detail}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="field">
          <span className="label">音质</span>
          <div>
            <div className="seg" role="radiogroup" aria-label="音质">
              {QUALITIES.map((q) => (
                <button
                  key={q.key}
                  role="radio"
                  aria-checked={settings.quality === q.key}
                  className={settings.quality === q.key ? 'on' : ''}
                  onClick={() => updateSettings({ quality: q.key })}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <p className="help">
              对应 <code>song/url/v1</code> 的 <code>level</code> 参数，下一首开始生效。高音质需要后端账号有对应权限。
            </p>
          </div>
        </div>

        <div className="field">
          <span className="label">版面</span>
          <div className="seg" role="radiogroup" aria-label="主题">
            {THEMES.map((t) => (
              <button
                key={t.key}
                role="radio"
                aria-checked={settings.theme === t.key}
                className={settings.theme === t.key ? 'on' : ''}
                onClick={() => updateSettings({ theme: t.key })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">跨域 Cookie</span>
          <div>
            <label className="check">
              <input
                type="checkbox"
                checked={settings.withCredentials}
                onChange={(e) => updateSettings({ withCredentials: e.target.checked })}
              />
              请求时带上浏览器 Cookie（credentials: include）
            </label>
            <p className="help">
              登录后的 cookie 也会以 <code>cookie</code> 参数附在请求上。后端开启 CORS 时需要允许当前域名并设置
              <code>Access-Control-Allow-Credentials: true</code>，否则关掉这一项。
            </p>
          </div>
        </div>

        <div className="field">
          <span className="label">登录凭证</span>
          <div>
            <p className="muted" style={{ fontSize: 14, paddingTop: 8 }}>
              {settings.cookie ? `已保存（${settings.cookie.length} 个字符）` : '未登录'}
            </p>
            {settings.cookie && (
              <button className="btn" style={{ marginTop: 10 }} onClick={() => updateSettings({ cookie: '' })}>
                清除凭证
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>快捷键</h2>
        </div>
        <div className="mono muted" style={{ lineHeight: 2.2, fontSize: 13 }}>
          <div>空格 · 播放 / 暂停</div>
          <div>← / → · 后退 / 前进 5 秒</div>
          <div>Shift + ← / → · 上一首 / 下一首</div>
          <div>L · 打开歌词 · / · 搜索</div>
        </div>
      </section>
    </div>
  );
}
