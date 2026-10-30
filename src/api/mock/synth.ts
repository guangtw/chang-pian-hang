// 给示例歌曲现场合成一段短旋律（WAV），这样不接后端也能真的听到声音。

const RATE = 22050;
const cache = new Map<string, string>();

// 几组常见和弦进行，用半音表示（相对 C4）
const PROGRESSIONS = [
  [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]],
  [[2, 5, 9], [7, 11, 14], [0, 4, 7], [9, 12, 16]],
  [[9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]],
  [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]],
];

function seeded(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    h = (h * 1103515245 + 12345) | 0;
    return ((h >>> 16) & 0x7fff) / 0x7fff;
  };
}

export function synthesize(seed: string, durationMs: number): string {
  const hit = cache.get(seed);
  if (hit) return hit;

  const rand = seeded(seed);
  const prog = PROGRESSIONS[Math.floor(rand() * PROGRESSIONS.length)];
  const root = 220 * Math.pow(2, Math.floor(rand() * 5) / 12);
  const bpm = 72 + Math.floor(rand() * 40);
  const beat = 60 / bpm;
  const n = Math.floor((durationMs / 1000) * RATE);
  const out = new Float32Array(n);
  const freq = (semi: number) => root * Math.pow(2, semi / 12);

  // 琶音：每拍两个音
  const noteLen = beat / 2;
  for (let start = 0, k = 0; start < n / RATE; start += noteLen, k++) {
    const chord = prog[Math.floor(start / (beat * 4)) % prog.length];
    const semi = chord[(k + Math.floor(rand() * 2)) % chord.length] + (k % 8 === 7 ? 12 : 0);
    const f = freq(semi);
    const s0 = Math.floor(start * RATE);
    const len = Math.floor(noteLen * 2.2 * RATE);
    for (let i = 0; i < len && s0 + i < n; i++) {
      const t = i / RATE;
      const env = Math.min(1, t * 80) * Math.exp(-t * 3.2);
      out[s0 + i] += 0.16 * env * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t));
    }
  }
  // 低音铺底
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const chord = prog[Math.floor(t / (beat * 4)) % prog.length];
    const f = freq(chord[0] - 12);
    const bar = (t % (beat * 4)) / (beat * 4);
    out[i] += 0.1 * Math.sin(2 * Math.PI * f * t) * (1 - bar * 0.6);
  }
  // 首尾淡入淡出
  const fade = RATE * 1.5;
  for (let i = 0; i < fade && i < n; i++) {
    out[i] *= i / fade;
    out[n - 1 - i] *= i / fade;
  }

  const url = URL.createObjectURL(encodeWav(out));
  cache.set(seed, url);
  return url;
}

function encodeWav(samples: Float32Array): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}
