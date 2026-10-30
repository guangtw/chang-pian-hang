import { useState } from 'react';

/** 网易云图片支持 ?param=WxH 缩略，示例数据（data URL）原样使用 */
export function sized(url: string | undefined, px: number) {
  if (!url || url.startsWith('data:') || url.includes('param=')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}param=${px}y${px}`;
}

export function Cover({ src, alt, size = 300, className = '' }: { src?: string; alt: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const url = sized(src, size);
  return (
    <div className={`cover ${!url || failed ? 'missing' : ''} ${className}`}>
      {url && !failed && <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} />}
    </div>
  );
}
