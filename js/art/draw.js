// Code-drawn art. Everything is drawn in a 360x640 logical space.
export const W = 360, H = 640;
const TAU = Math.PI * 2;

export function rng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

export function glow(ctx, x, y, r, rgb, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ---------------------------------------------------------------- sky
export function sky(ctx, t, o = {}) {
  const { top = '#05030a', mid = '#170b22', bottom = '#3b1c3c', moon = { x: 268, y: 112, r: 30 }, h = H, stars = true, clouds = true } = o;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, h);
  if (stars) {
    const st = cached('stars', () => { const r = rng(7); return Array.from({ length: 80 }, () => ({ x: r() * W, y: r() * H * 0.6, s: r() * 1.3 + 0.3, p: r() * 6 })); });
    ctx.fillStyle = '#ece4ff';
    for (const s of st) {
      if (s.y > h) continue;
      ctx.globalAlpha = 0.3 + 0.35 * Math.sin(t * 1.5 + s.p);
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }
  if (moon) drawMoon(ctx, moon.x, moon.y, moon.r);
  if (clouds) drawClouds(ctx, t, h);
}

export function drawMoon(ctx, x, y, r, tint = '220,215,255') {
  glow(ctx, x, y, r * 4.5, tint, 0.28);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#fdfaf0'); g.addColorStop(1, '#cbc3da');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(110,100,135,.2)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.3], [-0.1, 0.42, 0.15], [0.35, -0.38, 0.12]]) {
    ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU); ctx.fill();
  }
}

function drawClouds(ctx, t, h) {
  const cl = cached('clouds', () => { const r = rng(3); return Array.from({ length: 6 }, () => ({ x: r() * W * 1.5, y: 30 + r() * 200, w: 120 + r() * 160, hh: 8 + r() * 14, v: 3 + r() * 6 })); });
  ctx.fillStyle = 'rgba(18,8,28,.6)';
  for (const c of cl) {
    if (c.y > h - 10) continue;
    const x = ((c.x + t * c.v) % (W + c.w * 2)) - c.w;
    ctx.beginPath(); ctx.ellipse(x, c.y, c.w / 2, c.hh, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + c.w * 0.18, c.y - c.hh * 0.6, c.w / 3, c.hh * 0.8, 0, 0, TAU); ctx.fill();
  }
}

// ---------------------------------------------------------------- landscape
export function ridge(ctx, seed, baseY, amp, color, { jag = 12, bottom = H } = {}) {
  const pts = cached(`ridge${seed}_${baseY}_${amp}_${jag}`, () => {
    const r = rng(seed); const a = [];
    for (let x = -20; x <= W + 20 + 0.1; x += (W + 40) / jag) a.push([x, baseY - r() * amp]);
    return a;
  });
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-20, bottom);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(W + 20, bottom); ctx.closePath(); ctx.fill();
}

export function pine(ctx, x, y, h, color) {
  ctx.fillStyle = color;
  const w = h * 0.42;
  for (let i = 0; i < 3; i++) {
    const ty = y - h + i * h * 0.25, by = y - h * 0.35 + i * h * 0.22;
    const ww = w * (0.5 + i * 0.28);
    ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - ww, by); ctx.lineTo(x + ww, by); ctx.closePath(); ctx.fill();
  }
  ctx.fillRect(x - 1, y - h * 0.2, 2, h * 0.2);
}

export function forest(ctx, seed, baseY, color, { n = 36, hmin = 14, hmax = 34, spread = 14 } = {}) {
  const trees = cached(`forest${seed}_${baseY}_${n}`, () => {
    const r = rng(seed);
    return Array.from({ length: n }, () => ({ x: r() * (W + 20) - 10, y: baseY + r() * spread, h: hmin + r() * (hmax - hmin) })).sort((a, b) => a.y - b.y);
  });
  for (const tr of trees) pine(ctx, tr.x, tr.y, tr.h, color);
  ctx.fillStyle = color;
  ctx.fillRect(0, baseY + spread - 2, W, H);
}

export function castle(ctx, x, y, s, t, { color = '#07040b', lit = true } = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = color;
  poly(ctx, [[-95, 70], [-80, 30], [-62, 14], [-48, 2], [52, 2], [68, 18], [82, 34], [100, 70]]);
  ctx.fill();
  ctx.fillRect(-48, -34, 100, 38);
  for (let cx = -48; cx < 52; cx += 10) ctx.fillRect(cx, -40, 6, 8);
  const tower = (tx, top, w, roof) => {
    ctx.fillRect(tx - w / 2, top, w, 40 - top);
    if (roof) { ctx.beginPath(); ctx.moveTo(tx - w / 2 - 3, top); ctx.lineTo(tx, top - w * 1.4); ctx.lineTo(tx + w / 2 + 3, top); ctx.fill(); }
    else for (let cx = tx - w / 2; cx < tx + w / 2; cx += 6) ctx.fillRect(cx, top - 6, 4, 6);
  };
  tower(-46, -86, 18, true);
  tower(-12, -116, 24, true);
  tower(26, -74, 16, false);
  tower(48, -56, 13, true);
  if (lit) {
    const wins = [[-49, -70], [-15, -98], [-9, -84], [24, -60], [-30, -20], [8, -22], [47, -42]];
    wins.forEach(([wx, wy], i) => {
      const f = 0.55 + 0.35 * Math.sin(t * 2.3 + i * 1.7) * Math.sin(t * 0.7 + i);
      ctx.fillStyle = `rgba(255,170,80,${f})`;
      ctx.fillRect(wx, wy, 3.2, 6);
    });
  }
  ctx.restore();
}

// ---------------------------------------------------------------- fog
let fogSprite = null;
function getFog() {
  if (!fogSprite) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(205,195,225,.55)');
    gr.addColorStop(1, 'rgba(205,195,225,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    fogSprite = c;
  }
  return fogSprite;
}

export function fog(ctx, t, { y = H - 170, h = 170, alpha = 0.45, n = 9, speed = 7, seed = 11 } = {}) {
  const sp = getFog(); const r = rng(seed);
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const w = 170 + r() * 220, hh = h * (0.5 + r() * 0.7), v = speed * (0.4 + r());
    const base = r() * (W + w);
    const x = ((base + t * v) % (W + w)) - w;
    const yy = y + r() * h - hh / 2;
    ctx.drawImage(sp, x, yy, w, hh);
  }
  ctx.restore();
}

let vig = null;
export function vignette(ctx, strength = 1) {
  if (!vig) {
    const c = document.createElement('canvas'); c.width = 180; c.height = 320;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(90, 160, 60, 90, 160, 200);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)');
    g.fillStyle = gr; g.fillRect(0, 0, 180, 320);
    vig = c;
  }
  ctx.save(); ctx.globalAlpha = strength; ctx.drawImage(vig, 0, 0, W, H); ctx.restore();
}

// ---------------------------------------------------------------- creatures
export function bat(ctx, x, y, s, phase, color = '#0a0510') {
  const f = Math.sin(phase);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 4.5, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-2.4, -7); ctx.lineTo(-0.6, -4); ctx.lineTo(0.6, -4); ctx.lineTo(2.4, -7); ctx.lineTo(2, -3); ctx.fill();
  for (const d of [-1, 1]) {
    const tx = d * 17, ty = -3 - f * 10;
    ctx.beginPath();
    ctx.moveTo(d * 1.8, -2);
    ctx.quadraticCurveTo(d * 9, -7 - f * 8, tx, ty);
    ctx.quadraticCurveTo(d * 14, ty + 5, d * 12.5, ty * 0.45 + 5);
    ctx.quadraticCurveTo(d * 9.5, ty * 0.3 + 3, d * 7, 3 + ty * 0.15);
    ctx.quadraticCurveTo(d * 4.5, 1.5, d * 2, 3);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

const WOLF_STAND = [[-38, -44], [-50, -40], [-58, -30], [-62, -18], [-56, -22], [-48, -32], [-40, -34], [-38, -20], [-44, -2], [-46, 0], [-38, 0], [-32, -16], [-28, -22], [-26, -2], [-28, 0], [-20, 0], [-20, -22], [-6, -20], [8, -22], [14, -22], [16, -2], [14, 0], [22, 0], [22, -18], [26, -2], [26, 0], [31, 0], [29, -24], [34, -38], [46, -37], [57, -41], [55, -46], [44, -50], [42, -60], [38, -52], [35, -59], [31, -50], [22, -50], [0, -50], [-20, -48]];
const WOLF_HOWL = [[-42, 0], [-32, -6], [-24, -12], [-22, -30], [-18, -48], [-8, -62], [0, -76], [3, -90], [1, -99], [5, -110], [9, -100], [20, -108], [33, -119], [34, -113], [24, -103], [28, -100], [16, -90], [13, -72], [14, -50], [12, -20], [15, 0], [7, 0], [4, -20], [0, -28], [-6, -8], [-3, 0]];

export function wolf(ctx, x, y, s, { pose = 'stand', flip = false, eyes = true, color = '#040206', t = 0, eyeRGB = '255,190,60' } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
  ctx.fillStyle = color;
  poly(ctx, pose === 'howl' ? WOLF_HOWL : WOLF_STAND); ctx.fill();
  if (eyes) {
    const [ex, ey] = pose === 'howl' ? [19, -104] : [45, -46];
    const a = 0.75 + 0.25 * Math.sin(t * 4 + x);
    glow(ctx, ex, ey, 7, eyeRGB, 0.5 * a);
    ctx.fillStyle = `rgba(${eyeRGB},${a})`;
    ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export function eyesInDark(ctx, x, y, t, s = 1, rgb = '255,190,60') {
  const blink = Math.sin(t * 0.9 + x * 0.13) > 0.97 ? 0.1 : 1;
  ctx.save();
  for (const dx of [-4 * s, 4 * s]) {
    glow(ctx, x + dx, y, 6 * s, rgb, 0.4 * blink);
    ctx.fillStyle = `rgba(${rgb},${blink})`;
    ctx.beginPath(); ctx.arc(x + dx, y, 1.6 * s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- people
// The Count: tall, cloaked, white-haired, pale, red-eyed. y = feet.
export function count(ctx, x, y, s, { t = 0, alpha = 1, eyes = 1, arms = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
  const sw = Math.sin(t * 1.3) * 3;
  ctx.fillStyle = '#040107';
  ctx.beginPath();
  ctx.moveTo(-14, -150);
  ctx.quadraticCurveTo(-34 - arms * 30, -100, -44 + sw - arms * 40, 0);
  ctx.lineTo(44 + sw + arms * 40, 0);
  ctx.quadraticCurveTo(34 + arms * 30, -100, 14, -150);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3d0812';
  ctx.beginPath(); ctx.moveTo(-6, -142); ctx.lineTo(-16 + sw * 0.5, 0); ctx.lineTo(16 + sw * 0.5, 0); ctx.lineTo(6, -142); ctx.fill();
  ctx.fillStyle = '#0d0912';
  ctx.beginPath(); ctx.moveTo(-6, -142); ctx.lineTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(6, -142); ctx.fill();
  // collar
  ctx.fillStyle = '#040107';
  ctx.beginPath(); ctx.moveTo(-19, -172); ctx.lineTo(-14, -146); ctx.lineTo(14, -146); ctx.lineTo(19, -172); ctx.lineTo(8, -156); ctx.lineTo(-8, -156); ctx.closePath(); ctx.fill();
  // pale hands
  if (arms > 0.3) {
    ctx.fillStyle = '#d6cfc4';
    ctx.beginPath(); ctx.ellipse(-44 - arms * 30, -105, 4, 6, 0.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(44 + arms * 30, -105, 4, 6, -0.4, 0, TAU); ctx.fill();
  }
  // head
  ctx.fillStyle = '#d9d3c9';
  ctx.beginPath(); ctx.ellipse(0, -166, 8.5, 11.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#efebe4';
  ctx.beginPath(); ctx.ellipse(0, -175, 9.5, 5, 0, Math.PI, TAU); ctx.fill();
  ctx.fillRect(-9.5, -176, 3, 10); ctx.fillRect(6.5, -176, 3, 10);
  // moustache
  ctx.beginPath(); ctx.moveTo(-6, -158); ctx.quadraticCurveTo(0, -162, 6, -158); ctx.quadraticCurveTo(0, -159, -6, -158); ctx.fill();
  ctx.fillRect(-4, -159.5, 8, 1.5);
  // brows
  ctx.fillStyle = '#2a2026';
  ctx.fillRect(-6.5, -170, 5, 1.4); ctx.fillRect(1.5, -170, 5, 1.4);
  if (eyes > 0) {
    glow(ctx, -3.5, -167, 6, '255,30,40', 0.5 * eyes);
    glow(ctx, 3.5, -167, 6, '255,30,40', 0.5 * eyes);
    ctx.fillStyle = `rgba(255,40,40,${eyes})`;
    ctx.fillRect(-5, -167.8, 2.6, 1.6); ctx.fillRect(2.4, -167.8, 2.6, 1.6);
  }
  ctx.restore();
}

// One of the three women. hair colour distinguishes them; look 0..1 brightens the eyes.
export function bride(ctx, x, y, s, { hair = '#1d1014', t = 0, look = 0, phase = 0, alpha = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
  glow(ctx, 0, -80, 80, '190,205,255', 0.12 + look * 0.1);
  const g = ctx.createLinearGradient(0, -140, 0, 0);
  g.addColorStop(0, 'rgba(235,235,250,.92)'); g.addColorStop(1, 'rgba(200,210,240,.05)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-9, -128);
  ctx.quadraticCurveTo(-22, -70, -30, 0);
  for (let i = 0; i <= 6; i++) {
    const hx = -30 + i * 10;
    ctx.quadraticCurveTo(hx + 5, -8 + Math.sin(t * 2 + i + phase) * 5, hx + 10, 0);
  }
  ctx.quadraticCurveTo(22, -70, 9, -128);
  ctx.closePath(); ctx.fill();
  // arms
  ctx.strokeStyle = 'rgba(230,228,240,.85)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
  const sway = Math.sin(t * 1.4 + phase) * 6;
  ctx.beginPath(); ctx.moveTo(-8, -122); ctx.quadraticCurveTo(-22, -100, -18 + sway, -78 - look * 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -122); ctx.quadraticCurveTo(22, -100, 18 - sway, -78 - look * 20); ctx.stroke();
  // hair
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.ellipse(0, -137, 11, 12, 0, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -140); ctx.quadraticCurveTo(-18 + Math.sin(t + phase) * 3, -115, -12, -98); ctx.lineTo(-6, -125); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, -140); ctx.quadraticCurveTo(18 + Math.sin(t + phase) * 3, -115, 12, -98); ctx.lineTo(6, -125); ctx.fill();
  // face
  ctx.fillStyle = '#efecf2';
  ctx.beginPath(); ctx.ellipse(0, -134, 7, 9.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b3101e';
  ctx.beginPath(); ctx.ellipse(0, -127.5, 2.6, 1.2, 0, 0, TAU); ctx.fill();
  if (look > 0) {
    glow(ctx, -2.8, -135, 7, '255,30,50', look * 0.6);
    glow(ctx, 2.8, -135, 7, '255,30,50', look * 0.6);
    ctx.fillStyle = `rgba(255,50,60,${0.4 + look * 0.6})`;
  } else ctx.fillStyle = '#3a2a40';
  ctx.fillRect(-4.2, -136, 2.6, 1.4); ctx.fillRect(1.6, -136, 2.6, 1.4);
  ctx.restore();
}

// Jonathan seen from behind, head and shoulders. y = bottom.
export function jonathanBack(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#120c10';
  ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-66, -60, -26, -70); ctx.lineTo(26, -70); ctx.quadraticCurveTo(66, -60, 70, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a1214';
  ctx.beginPath(); ctx.ellipse(0, -96, 22, 28, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath(); ctx.ellipse(0, -104, 23, 22, 0, Math.PI, TAU); ctx.fill();
  ctx.restore();
}

// Jonathan climbing, seen from behind. reach (-1..1) shifts the arms.
export function jonathanClimb(ctx, x, y, s, { reach = 0, t = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#0c0709'; ctx.lineCap = 'round';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(-18 - reach * 4, -58 - reach * 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -30); ctx.lineTo(18 - reach * 4, -56 + reach * 4); ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-12, 26 + Math.sin(t * 3) * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(13, 24 - Math.sin(t * 3) * 2); ctx.stroke();
  ctx.fillStyle = '#17100f';
  ctx.beginPath(); ctx.moveTo(-12, -32); ctx.lineTo(12, -32); ctx.lineTo(10, 4); ctx.lineTo(-10, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2b1b12';
  ctx.beginPath(); ctx.arc(0, -40, 8.5, 0, TAU); ctx.fill();
  ctx.restore();
}

// Jonathan lying on a couch, side view, eyes nearly shut.
export function jonathanLying(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#140d10';
  ctx.beginPath(); ctx.ellipse(0, -8, 46, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d8c6b4';
  ctx.beginPath(); ctx.ellipse(52, -12, 9, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2b1b12';
  ctx.beginPath(); ctx.ellipse(56, -16, 9, 6, 0.3, Math.PI, TAU); ctx.fill();
  ctx.restore();
}

export function landlady(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const bob = Math.sin(t * 1.2) * 1;
  ctx.fillStyle = '#1d1218';
  ctx.beginPath(); ctx.moveTo(-14, -100); ctx.quadraticCurveTo(-30, -40, -34, 0); ctx.lineTo(34, 0); ctx.quadraticCurveTo(30, -40, 14, -100); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7a2a22';
  ctx.beginPath(); ctx.moveTo(-18, -60); ctx.lineTo(-26, 0); ctx.lineTo(26, 0); ctx.lineTo(18, -60); ctx.fill();
  ctx.fillStyle = '#d9c3a5';
  ctx.beginPath(); ctx.moveTo(-10, -60); ctx.lineTo(-14, -6); ctx.lineTo(14, -6); ctx.lineTo(10, -60); ctx.fill();
  ctx.fillStyle = '#e2c8a8';
  ctx.beginPath(); ctx.ellipse(0, -114 + bob, 10, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8e1f22';
  ctx.beginPath(); ctx.moveTo(-13, -112 + bob); ctx.quadraticCurveTo(0, -136 + bob, 13, -112 + bob); ctx.lineTo(16, -96 + bob); ctx.lineTo(10, -108 + bob); ctx.quadraticCurveTo(0, -124 + bob, -10, -108 + bob); ctx.lineTo(-16, -96 + bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(-5, -116 + bob, 2.4, 1.6); ctx.fillRect(2.6, -116 + bob, 2.4, 1.6);
  ctx.restore();
}

// ---------------------------------------------------------------- interiors
export function stoneWall(ctx, x, y, w, h, { seed = 1, base = '#2a2230', tint = 0.12, rowH = 22 } = {}) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  let row = 0;
  for (let yy = y; yy < y + h; yy += rowH, row++) {
    let xx = x - (row % 2 ? 18 : 0);
    while (xx < x + w) {
      const bw = 30 + r() * 26;
      const l = r();
      ctx.fillStyle = l > 0.5 ? `rgba(255,255,255,${(l - 0.5) * tint})` : `rgba(0,0,0,${(0.5 - l) * tint * 2})`;
      ctx.fillRect(xx + 1, yy + 1, bw - 2, rowH - 2);
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(xx, yy, bw, 1.2);
      ctx.fillRect(xx, yy, 1.2, rowH);
      xx += bw;
    }
  }
  ctx.restore();
}

export function woodWall(ctx, x, y, w, h, { seed = 2, base = '#3a2416' } = {}) {
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  for (let xx = x; xx < x + w; xx += 26) {
    ctx.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.2})`;
    ctx.fillRect(xx, y, 26, h);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(xx, y, 1.5, h);
  }
}

function archPath(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + w / 2);
  ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

export function archWindow(ctx, x, y, w, h, t, { mullions = true, moonX = 0.65, moonY = 0.32, mountains = true } = {}) {
  ctx.save();
  archPath(ctx, x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#0c0618'); g.addColorStop(1, '#3a1f45');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  drawMoon(ctx, x + w * moonX, y + h * moonY, Math.min(w, h) * 0.12);
  if (mountains) {
    ctx.fillStyle = '#120a1a';
    ctx.beginPath(); ctx.moveTo(x, y + h);
    for (let i = 0; i <= 6; i++) ctx.lineTo(x + (w * i) / 6, y + h * (0.72 + 0.1 * Math.sin(i * 2.3)));
    ctx.lineTo(x + w, y + h); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#120b10'; ctx.lineWidth = 5;
  archPath(ctx, x, y, w, h); ctx.stroke();
  if (mullions) {
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y + 2); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h * 0.55); ctx.lineTo(x + w, y + h * 0.55); ctx.stroke();
  }
  // moonbeam into the room
  const beam = ctx.createLinearGradient(x, y + h, x, y + h + 160);
  beam.addColorStop(0, 'rgba(200,200,255,.12)'); beam.addColorStop(1, 'rgba(200,200,255,0)');
  ctx.fillStyle = beam;
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w + 50, y + h + 160); ctx.lineTo(x + 30, y + h + 160); ctx.fill();
}

export function fireplace(ctx, x, y, w, h, t) {
  ctx.fillStyle = '#1a1216';
  ctx.fillRect(x - 10, y - 14, w + 20, 14);
  ctx.fillStyle = '#231a1e';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#070406';
  archPath(ctx, x + 10, y + 10, w - 20, h - 10); ctx.fill();
  const cx = x + w / 2, by = y + h - 4;
  glow(ctx, cx, by - 10, w * 0.9, '255,120,40', 0.35 + 0.08 * Math.sin(t * 9));
  for (let i = 0; i < 5; i++) {
    const fx = cx + (i - 2) * (w * 0.09);
    const fh = 16 + 10 * Math.abs(Math.sin(t * 6 + i * 1.7)) + (i === 2 ? 10 : 0);
    ctx.fillStyle = i % 2 ? 'rgba(255,190,80,.9)' : 'rgba(255,110,40,.85)';
    ctx.beginPath(); ctx.moveTo(fx - 6, by); ctx.quadraticCurveTo(fx - 4, by - fh * 0.6, fx + Math.sin(t * 8 + i) * 3, by - fh); ctx.quadraticCurveTo(fx + 4, by - fh * 0.6, fx + 6, by); ctx.fill();
  }
  ctx.fillStyle = '#2a1608';
  ctx.fillRect(cx - w * 0.3, by - 3, w * 0.6, 5);
}

export function candle(ctx, x, y, t, s = 1) {
  const fl = Math.sin(t * 11 + x) * 0.6 + Math.sin(t * 7.3 + y) * 0.4;
  glow(ctx, x, y - 12 * s, 46 * s, '255,170,80', 0.28 + fl * 0.04);
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(x - 3 * s, y - 10 * s, 6 * s, 12 * s);
  ctx.fillStyle = 'rgba(255,200,110,.95)';
  ctx.beginPath(); ctx.ellipse(x + fl * 0.6, y - 15 * s, 2.2 * s, 5 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,220,.9)';
  ctx.beginPath(); ctx.ellipse(x + fl * 0.4, y - 14 * s, 0.9 * s, 2.4 * s, 0, 0, TAU); ctx.fill();
}

export function bookshelf(ctx, x, y, w, h, seed = 5) {
  ctx.fillStyle = '#1e120c'; ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  const shelves = Math.floor(h / 34);
  const cols = ['#4a1a16', '#26301e', '#2b2342', '#5a3a1a', '#3a1010', '#1d2a33'];
  for (let i = 0; i < shelves; i++) {
    const sy = y + 6 + i * 34;
    let bx = x + 4;
    while (bx < x + w - 8) {
      const bw = 4 + r() * 6, bh = 20 + r() * 8;
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      ctx.fillRect(bx, sy + 28 - bh, bw, bh);
      ctx.fillStyle = 'rgba(220,180,90,.35)'; ctx.fillRect(bx, sy + 28 - bh + 4, bw, 1);
      bx += bw + 0.8;
    }
    ctx.fillStyle = '#120a06'; ctx.fillRect(x, sy + 28, w, 4);
  }
}

export function door(ctx, x, y, w, h, { open = 0, seed = 3, light = false } = {}) {
  ctx.fillStyle = '#0a0608';
  archPath(ctx, x - 5, y - 5, w + 10, h + 5); ctx.fill();
  if (open > 0) {
    ctx.fillStyle = light ? 'rgba(255,170,80,.25)' : '#000';
    archPath(ctx, x, y, w, h); ctx.fill();
  }
  ctx.save();
  archPath(ctx, x, y, w, h); ctx.clip();
  const dw = w * (1 - open * 0.8);
  const r = rng(seed);
  for (let px = x; px < x + dw; px += w / 5) {
    ctx.fillStyle = `rgb(${50 + r() * 14},${30 + r() * 8},${20 + r() * 6})`;
    ctx.fillRect(px, y, w / 5 - 1, h);
  }
  ctx.fillStyle = '#16100e';
  ctx.fillRect(x, y + h * 0.3, dw, 4); ctx.fillRect(x, y + h * 0.75, dw, 4);
  ctx.strokeStyle = '#191210'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x + dw * 0.8, y + h * 0.55, 5, 0, TAU); ctx.stroke();
  ctx.restore();
}

export function table(ctx, x, y, w, { cloth = null } = {}) {
  ctx.fillStyle = '#24150c';
  ctx.fillRect(x, y, w, 8);
  ctx.fillRect(x + 6, y + 8, 6, 46); ctx.fillRect(x + w - 12, y + 8, 6, 46);
  if (cloth) { ctx.fillStyle = cloth; ctx.fillRect(x - 3, y - 2, w + 6, 18); }
}

export function floor(ctx, y, color = '#120b10', line = 'rgba(0,0,0,.4)') {
  const g = ctx.createLinearGradient(0, y, 0, H);
  g.addColorStop(0, color); g.addColorStop(1, '#030103');
  ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y);
  ctx.strokeStyle = line; ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const yy = y + (i * i) * 8;
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
  }
}

export function crate(ctx, x, y, w, h, { lid = true, earth = false } = {}) {
  ctx.fillStyle = '#2d1c10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y + (h * i) / 4); ctx.lineTo(x + w, y + (h * i) / 4); ctx.stroke(); }
  ctx.strokeRect(x, y, w, h);
  if (earth) { ctx.fillStyle = '#1a120c'; ctx.fillRect(x + 2, y - 3, w - 4, 5); }
  if (lid) { ctx.fillStyle = '#3a2614'; ctx.fillRect(x - 2, y - 5, w + 4, 6); }
}

export function sparkle(ctx, x, y, t, a = 1, rgb = '255,225,170') {
  const p = (Math.sin(t * 2.4) + 1) / 2;
  const r = 3 + p * 5;
  ctx.save();
  ctx.globalAlpha = a * (0.25 + p * 0.5);
  glow(ctx, x, y, r * 2.4, rgb, 0.6);
  ctx.strokeStyle = `rgba(${rgb},.9)`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
  ctx.restore();
}

// A small gold crucifix (for the mirror scene and icons).
export function crucifix(ctx, x, y, s, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a;
  glow(ctx, 0, 0, 40, '255,210,120', 0.5);
  ctx.fillStyle = '#e9c060'; ctx.strokeStyle = '#7a5410'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.rect(-3, -16, 6, 32); ctx.rect(-11, -9, 22, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
}
