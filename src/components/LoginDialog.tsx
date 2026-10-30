import { useEffect, useState } from 'react';
import { api, type QrLogin, type QrStatus } from '../api';
import { completeLogin } from '../lib/session';
import { useStore } from '../lib/store';
import { uiStore } from '../player/ui';
import { Icon } from './Icon';

export function LoginDialog() {
  const open = useStore(uiStore, (s) => s.login);
  const [qr, setQr] = useState<QrLogin | null>(null);
  const [status, setStatus] = useState<QrStatus>({ state: 'waiting' });
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);
  const close = () => uiStore.set({ login: false });

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    setQr(null);
    setError('');
    setStatus({ state: 'waiting' });

    const poll = async (key: string) => {
      try {
        const s = await api().checkQrLogin(key);
        if (!alive) return;
        setStatus(s);
        if (s.state === 'confirmed') {
          await completeLogin(s.cookie);
          if (alive) close();
          return;
        }
        if (s.state !== 'expired') timer = setTimeout(() => poll(key), 2000);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    };

    api()
      .createQrLogin()
      .then((q) => {
        if (!alive) return;
        setQr(q);
        timer = setTimeout(() => poll(q.key), 2000);
      })
      .catch((e: Error) => alive && setError(e.message));

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, round]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const hint =
    status.state === 'scanned'
      ? `${status.nickname ?? ''} 已扫码，请在手机上确认`
      : status.state === 'confirmed'
        ? '登录成功'
        : '用网易云音乐 App 扫一扫';

  return (
    <>
      <div className="scrim" onClick={close} style={{ zIndex: 55 }} />
      <div className="dialog" role="dialog" aria-modal="true" aria-label="扫码登录">
        <button className="icon-btn close" onClick={close} aria-label="关闭">
          <Icon name="close" />
        </button>
        <div className="kicker">会员登记处</div>
        <h2>扫码登录</h2>
        <div className="qr">
          {qr?.image ? <img src={qr.image} alt="登录二维码" /> : !error && <span className="faint">生成中…</span>}
          {(status.state === 'expired' || error) && (
            <div className="qr-mask">
              <span>{error || '二维码过期了'}</span>
              <button className="btn" onClick={() => setRound((r) => r + 1)} style={{ justifySelf: 'center' }}>
                刷新
              </button>
            </div>
          )}
          {status.state === 'scanned' && <div className="qr-mask">已扫码</div>}
        </div>
        <p className="muted" style={{ fontSize: 14 }}>
          {hint}
        </p>
        {qr && !qr.image && (
          <p className="mono faint" style={{ marginTop: 8, wordBreak: 'break-all' }}>
            {qr.qrUrl}
          </p>
        )}
      </div>
    </>
  );
}
