import { forwardRef, useState } from 'react';
import { image } from '../config/site';

/** 网易云图床支持 ?param=WxH 缩略；可在配置里关掉 */
export function sized(url: string | undefined, px: number) {
  if (!url || !image.resizeParam || url.startsWith('data:') || url.includes('param=') || !/music\.126\.net/.test(url))
    return url;
  return `${url}${url.includes('?') ? '&' : '?'}param=${px}y${px}`;
}

interface Props {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** 封面：图片加载完淡入，失败或没有图时画一张空唱片 */
export const Cover = forwardRef<HTMLDivElement, Props>(function Cover({ src, alt, size = 300, className = '', style }, ref) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const url = sized(src, size);
  const missing = !url || state === 'failed';
  return (
    <div ref={ref} className={`cover ${missing ? 'missing' : ''} ${state === 'ready' ? 'ready' : ''} ${className}`} style={style}>
      {url && state !== 'failed' && (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
          ref={(img) => {
            // 缓存命中时 onLoad 可能早于挂载
            if (img?.complete && img.naturalWidth && state === 'loading') setState('ready');
          }}
        />
      )}
    </div>
  );
});
