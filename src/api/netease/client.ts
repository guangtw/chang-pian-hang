import { getSettings } from '../../lib/settings';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  /** 加时间戳防缓存（登录相关接口需要） */
  fresh?: boolean;
  /** 不检查业务 code（例如二维码轮询会返回 800~803） */
  rawCode?: boolean;
  /** 覆盖设置里的后端地址（测试连接用） */
  base?: string;
}

/**
 * 网易云 API 风格的请求：GET + query 参数，响应体里带 code 字段。
 * 登录后的 cookie 通过 `cookie` 参数传递，这是 NeteaseCloudMusicApi 支持的方式，
 * 也可以在设置里开启 withCredentials 让浏览器自己带。
 */
export async function request<T = any>(path: string, params: Params = {}, opts: RequestOptions = {}): Promise<T> {
  const { cookie, withCredentials } = getSettings();
  const apiBase = opts.base ?? getSettings().apiBase;
  let url: URL;
  try {
    url = new URL(path, apiBase.endsWith('/') ? apiBase : apiBase + '/');
  } catch {
    throw new ApiError('后端地址格式不对，需要以 http:// 或 https:// 开头。', 0);
  }
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  if (opts.fresh) url.searchParams.set('timestamp', String(Date.now()));
  if (cookie) url.searchParams.set('cookie', cookie);

  let res: Response;
  try {
    res = await fetch(url, { credentials: withCredentials ? 'include' : 'same-origin' });
  } catch {
    throw new ApiError('连不上后端，检查一下地址和跨域设置。', 0);
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // 非 JSON 响应，下面按 HTTP 状态处理
  }

  if (!res.ok) {
    throw new ApiError(body?.message || body?.msg || `后端返回 ${res.status}`, res.status, body?.code);
  }
  if (!opts.rawCode && body && typeof body.code === 'number' && body.code !== 200) {
    throw new ApiError(body.message || body.msg || `接口返回 code ${body.code}`, res.status, body.code);
  }
  return body as T;
}
