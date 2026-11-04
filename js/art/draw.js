// Code-drawn art. Everything is drawn in a 360x640 logical space.
//
// Static pieces (walls, mountains, shelves, doors…) are rendered once into an
// offscreen "layer" at screen resolution and reused every frame, so the scenes
// can be richly detailed and still run smoothly on phones. Animated pieces
// (flames, characters, bats, wolves) are drawn live.
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

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// ---------------------------------------------------------------- colour helpers
function hex(c) {
  if (c.startsWith('rgb')) return c.match(/[\d.]+/g).slice(0, 3).map(Number);
  c = c.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const n = parseInt(c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}
function shade(c, amt) { return amt > 0 ? mix(c, '#ffffff', amt) : mix(c, '#000000', -amt); }

// ---------------------------------------------------------------- layers & texture
const layers = new Map();
let layerScale = 0;
function scaleOf(ctx) {
  const m = ctx.getTransform ? ctx.getTransform() : { a: 2 };
  return Math.max(1, Math.min(3, Math.round(Math.abs(m.a) * 2) / 2));
}
// Draw fn once into an offscreen canvas covering (x,y,w,h), then reuse it.
// fn draws in the same absolute coordinates as the main canvas.
export function layer(ctx, key, x, y, w, h, fn) {
  const s = scaleOf(ctx);
  // A new screen scale (e.g. rotation) makes old layers useless: drop them.
  if (ctx.canvas && ctx.canvas.id === 'game' && s !== layerScale) { layers.clear(); layerScale = s; }
  const k = `${key}@${s}`;
  let c = layers.get(k);
  if (!c) {
    c = mk(Math.max(1, Math.ceil(w * s)), Math.max(1, Math.ceil(h * s)));
    const o = c.getContext('2d');
    o.scale(s, s);
    o.translate(-x, -y);
    fn(o);
    layers.set(k, c);
  }
  ctx.drawImage(c, x, y, w, h);
}

// Soft fractal noise, used to give surfaces grit.
let noiseC = null;
function noise() {
  if (noiseC) return noiseC;
  const S = 256;
  noiseC = mk(S, S);
  const g = noiseC.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
  const r = rng(99);
  for (const [n, a] of [[8, 0.45], [16, 0.4], [32, 0.35], [64, 0.3], [128, 0.25], [256, 0.2]]) {
    const t = mk(n, n), tg = t.getContext('2d');
    const id = tg.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const v = r() * 255;
      id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
    }
    tg.putImageData(id, 0, 0);
    g.globalAlpha = a; g.imageSmoothingEnabled = true;
    g.drawImage(t, 0, 0, S, S);
  }
  return noiseC;
}

export { shade, rimFill };

export function texture(ctx, x, y, w, h, alpha = 0.3, mode = 'overlay', scale = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = mode;
  const p = ctx.createPattern(noise(), 'repeat');
  if (scale !== 1 && p.setTransform && typeof DOMMatrix !== 'undefined') p.setTransform(new DOMMatrix().scale(scale));
  ctx.fillStyle = p;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

export function glow(ctx, x, y, r, rgb, a = 1, additive = false) {
  if (r <= 0) return;
  if (additive) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; }
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.4, `rgba(${rgb},${a * 0.35})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (additive) ctx.restore();
}

// Fill a silhouette with a thin moonlit rim on its upper-left edge.
function rimFill(ctx, path, fill, rim = 'rgba(185,175,235,.55)', dx = -1, dy = -1) {
  ctx.save(); ctx.translate(dx, dy); ctx.fillStyle = rim; ctx.fill(path); ctx.restore();
  ctx.fillStyle = fill; ctx.fill(path);
}

// ---------------------------------------------------------------- sky
export function sky(ctx, t, o = {}) {
  const { top = '#05030a', mid = '#170b22', bottom = '#3b1c3c', moon = { x: 268, y: 112, r: 30 }, h = H, stars = true, clouds = true } = o;
  const moonKey = moon ? `${moon.x},${moon.y},${moon.r}` : 'none';
  layer(ctx, `sky|${top}|${mid}|${bottom}|${h}|${moonKey}|${stars}`, 0, 0, W, h, (c) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fillRect(0, 0, W, h);
    if (moon) {
      const mg = c.createRadialGradient(moon.x, moon.y, moon.r, moon.x, moon.y, moon.r * 9);
      mg.addColorStop(0, 'rgba(160,150,215,.32)'); mg.addColorStop(0.35, 'rgba(110,90,170,.12)'); mg.addColorStop(1, 'rgba(110,90,170,0)');
      c.fillStyle = mg; c.fillRect(0, 0, W, h);
    }
    texture(c, 0, 0, W, h, 0.18, 'soft-light', 2);
    if (stars) {
      const r = rng(7);
      for (let i = 0; i < 170; i++) {
        const x = r() * W, y = r() * h * 0.75, m = r();
        const near = moon && Math.hypot(x - moon.x, y - moon.y) < moon.r * 3;
        if (near) continue;
        const a = (0.25 + m * 0.6) * (1 - y / (h * 0.9));
        c.fillStyle = `rgba(${230 + m * 25},${225 + m * 20},255,${a})`;
        const sz = 0.4 + m * m * 1.4;
        c.beginPath(); c.arc(x, y, sz, 0, TAU); c.fill();
        if (m > 0.93) {
          c.strokeStyle = `rgba(230,225,255,${a * 0.5})`; c.lineWidth = 0.4;
          c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.moveTo(x, y - 4); c.lineTo(x, y + 4); c.stroke();
        }
      }
    }
    if (moon) drawMoonDisk(c, moon.x, moon.y, moon.r);
  });
  if (stars) {
    const tw = cached('twinkle', () => { const r = rng(17); return Array.from({ length: 24 }, () => ({ x: r() * W, y: r() * H * 0.5, p: r() * 6 })); });
    for (const s of tw) {
      if (s.y > h || (moon && Math.hypot(s.x - moon.x, s.y - moon.y) < moon.r * 3)) continue;
      const a = Math.max(0, Math.sin(t * 1.3 + s.p)) * 0.8;
      ctx.fillStyle = `rgba(240,235,255,${a})`;
      ctx.fillRect(s.x, s.y, 1.2, 1.2);
    }
  }
  if (clouds) drawClouds(ctx, t, h, moon);
}

function drawMoonDisk(c, x, y, r) {
  // halo
  const hg = c.createRadialGradient(x, y, r * 0.9, x, y, r * 3.2);
  hg.addColorStop(0, 'rgba(235,230,255,.45)'); hg.addColorStop(0.3, 'rgba(200,190,240,.12)'); hg.addColorStop(1, 'rgba(200,190,240,0)');
  c.fillStyle = hg; c.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  c.save();
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r * 1.05);
  g.addColorStop(0, '#fffdf4'); g.addColorStop(0.7, '#e3dccd'); g.addColorStop(1, '#a9a1b4');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  // maria: soft grey seas
  const rr = rng(Math.round(r * 13));
  for (let i = 0; i < 9; i++) {
    const mx = x + (rr() - 0.45) * r * 1.3, my = y + (rr() - 0.5) * r * 1.2, mr = r * (0.18 + rr() * 0.32);
    const mg = c.createRadialGradient(mx, my, 0, mx, my, mr);
    mg.addColorStop(0, 'rgba(120,112,135,.42)'); mg.addColorStop(1, 'rgba(120,112,135,0)');
    c.fillStyle = mg; c.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
  }
  // craters with a lit rim
  for (let i = 0; i < 14; i++) {
    const cx = x + (rr() - 0.5) * r * 1.7, cy = y + (rr() - 0.5) * r * 1.7, cr = r * (0.03 + rr() * 0.07);
    c.fillStyle = 'rgba(110,100,125,.35)'; c.beginPath(); c.arc(cx, cy, cr, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,250,.35)'; c.lineWidth = cr * 0.35;
    c.beginPath(); c.arc(cx, cy, cr, Math.PI * 0.2, Math.PI * 1.1); c.stroke();
  }
  texture(c, x - r, y - r, r * 2, r * 2, 0.35, 'overlay', 0.5);
  // limb darkening
  const lg = c.createRadialGradient(x, y, r * 0.6, x, y, r);
  lg.addColorStop(0, 'rgba(60,50,80,0)'); lg.addColorStop(1, 'rgba(60,50,80,.35)');
  c.fillStyle = lg; c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

// A moon drawn on its own (cached by size and position).
export function drawMoon(ctx, x, y, r) {
  layer(ctx, `moon|${x}|${y}|${r}`, x - r * 3.3, y - r * 3.3, r * 6.6, r * 6.6, (c) => drawMoonDisk(c, x, y, r));
}

// Clouds: soft dark puffs with a moonlit upper edge.
const cloudSprites = [];
function cloudSprite(i) {
  if (cloudSprites[i]) return cloudSprites[i];
  const c = mk(320, 110), g = c.getContext('2d');
  const r = rng(40 + i);
  const puffs = Array.from({ length: 22 }, () => ({ x: 40 + r() * 240, y: 50 + (r() - 0.5) * 36, rad: 18 + r() * 30 }));
  for (const p of puffs) {
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad);
    gr.addColorStop(0, 'rgba(26,16,38,.9)'); gr.addColorStop(1, 'rgba(26,16,38,0)');
    g.fillStyle = gr; g.fillRect(p.x - p.rad, p.y - p.rad, p.rad * 2, p.rad * 2);
  }
  g.globalCompositeOperation = 'source-atop';
  for (const p of puffs) {
    const gr = g.createRadialGradient(p.x - p.rad * 0.2, p.y - p.rad * 0.55, 0, p.x, p.y - p.rad * 0.4, p.rad * 0.8);
    gr.addColorStop(0, 'rgba(150,135,190,.45)'); gr.addColorStop(1, 'rgba(150,135,190,0)');
    g.fillStyle = gr; g.fillRect(p.x - p.rad, p.y - p.rad * 1.4, p.rad * 2, p.rad * 2);
  }
  texture(g, 0, 0, 320, 110, 0.4, 'source-atop', 1);
  cloudSprites[i] = c;
  return c;
}

function drawClouds(ctx, t, h) {
  const cl = cached('clouds', () => { const r = rng(3); return Array.from({ length: 6 }, (_, i) => ({ x: r() * W * 1.5, y: 20 + r() * 210, w: 170 + r() * 170, v: 3 + r() * 5, i: i % 4 })); });
  for (const c of cl) {
    if (c.y > h - 20) continue;
    const x = ((c.x + t * c.v) % (W + c.w * 2)) - c.w;
    ctx.save(); ctx.globalAlpha = 0.85;
    ctx.drawImage(cloudSprite(c.i), x, c.y - c.w * 0.17, c.w, c.w * 0.34);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- landscape
function ridgePoints(seed, baseY, amp, jag) {
  return cached(`rp${seed}_${baseY}_${amp}_${jag}`, () => {
    const r = rng(seed);
    let pts = [];
    for (let x = -20; x <= W + 20.1; x += (W + 40) / jag) pts.push([x, baseY - r() * amp]);
    let d = amp * 0.35;
    for (let it = 0; it < 5; it++) {
      const np = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
        np.push(pts[i], [(x1 + x2) / 2 + (r() - 0.5) * d * 0.3, (y1 + y2) / 2 + (r() - 0.5) * d]);
      }
      np.push(pts[pts.length - 1]);
      pts = np; d *= 0.55;
    }
    return pts;
  });
}

export function ridge(ctx, seed, baseY, amp, color, { jag = 12, bottom = H } = {}) {
  const pts = ridgePoints(seed, baseY, amp, jag);
  const top = Math.min(...pts.map((p) => p[1])) - 4;
  layer(ctx, `ridge|${seed}|${baseY}|${amp}|${color}|${jag}|${bottom}`, 0, top, W, bottom - top, (c) => {
    const path = new Path2D();
    path.moveTo(-20, bottom);
    for (const [x, y] of pts) path.lineTo(x, y);
    path.lineTo(W + 20, bottom); path.closePath();
    const g = c.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, shade(color, 0.1)); g.addColorStop(0.3, color); g.addColorStop(1, shade(color, -0.5));
    rimFill(c, path, g, 'rgba(170,160,220,.35)', 0, -1);
    c.save(); c.clip(path);
    // gullies and ridgelines catching the moon
    const r = rng(seed * 3 + 1);
    for (let i = 0; i < pts.length; i += 3) {
      const [x, y] = pts[i];
      if (r() < 0.5) continue;
      c.strokeStyle = r() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(170,160,220,.07)';
      c.lineWidth = 1 + r() * 2;
      c.beginPath(); c.moveTo(x, y + 2); c.quadraticCurveTo(x + (r() - 0.5) * 30, y + 30, x + (r() - 0.5) * 50, y + 60 + r() * 60); c.stroke();
    }
    texture(c, 0, top, W, bottom - top, 0.35, 'overlay', 1.5);
    c.restore();
  });
}

// A fir tree with tiers of drooping, ragged branches.
export function pine(ctx, x, y, h, color, r = Math.random) {
  ctx.fillStyle = color;
  const w = h * 0.36;
  ctx.fillRect(x - h * 0.02, y - h * 0.25, h * 0.04, h * 0.25);
  const tiers = 6;
  ctx.beginPath();
  for (let i = 0; i < tiers; i++) {
    const ty = y - h + (i * h * 0.78) / tiers;
    const by = ty + h * 0.26;
    const ww = w * (0.2 + (i / tiers) * 0.85);
    ctx.moveTo(x, ty);
    ctx.lineTo(x - ww * 0.4, by - h * 0.12);
    ctx.lineTo(x - ww * 0.55, by - h * 0.13);
    ctx.lineTo(x - ww, by + (r() - 0.5) * 2);
    ctx.lineTo(x - ww * 0.3, by - h * 0.04);
    ctx.lineTo(x + ww * 0.3, by - h * 0.04);
    ctx.lineTo(x + ww, by + (r() - 0.5) * 2);
    ctx.lineTo(x + ww * 0.55, by - h * 0.13);
    ctx.lineTo(x + ww * 0.4, by - h * 0.12);
    ctx.closePath();
  }
  ctx.fill();
}

export function forest(ctx, seed, baseY, color, { n = 36, hmin = 14, hmax = 34, spread = 14 } = {}) {
  const top = baseY - hmax - 4;
  layer(ctx, `forest|${seed}|${baseY}|${color}|${n}|${hmin}|${hmax}|${spread}`, 0, top, W, H - top, (c) => {
    const r = rng(seed);
    const trees = Array.from({ length: n }, () => ({ x: r() * (W + 20) - 10, y: baseY + r() * spread, h: hmin + r() * (hmax - hmin) })).sort((a, b) => a.y - b.y);
    // back rows are hazier
    for (const tr of trees) {
      const depth = (tr.y - baseY) / Math.max(1, spread);
      const col = shade(color, 0.12 * (1 - depth));
      c.save(); c.translate(-0.8, -0.8); pine(c, tr.x, tr.y, tr.h, 'rgba(160,150,210,.25)', r); c.restore();
      pine(c, tr.x, tr.y, tr.h, col, r);
    }
    c.fillStyle = color;
    c.fillRect(0, baseY + spread - 2, W, H);
  });
}

export function castle(ctx, x, y, s, t, { color = '#07040b', lit = true } = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  layer(ctx, `castle|${color}`, -110, -200, 220, 280, (c) => {
    const body = new Path2D();
    // jagged crag
    const r = rng(12);
    const crag = [[-105, 80], [-96, 50], [-86, 36], [-78, 30], [-66, 16], [-56, 10], [-50, 2], [54, 2], [62, 10], [70, 18], [78, 26], [86, 34], [96, 50], [108, 80]];
    body.moveTo(crag[0][0], crag[0][1]);
    for (const [px, py] of crag) body.lineTo(px + (r() - 0.5) * 3, py + (r() - 0.5) * 3);
    body.closePath();
    // curtain wall with crenellations
    body.rect(-50, -36, 104, 40);
    for (let cx = -50; cx < 54; cx += 9) body.rect(cx, -43, 5.5, 8);
    const tower = (tx, top, w, roof) => {
      body.rect(tx - w / 2, top, w, 40 - top);
      if (roof) {
        body.moveTo(tx - w / 2 - 4, top); body.lineTo(tx, top - w * 1.6); body.lineTo(tx + w / 2 + 4, top); body.closePath();
      } else for (let cx = tx - w / 2; cx < tx + w / 2; cx += 5) body.rect(cx, top - 6, 3.5, 6);
    };
    tower(-48, -88, 18, true);
    tower(-13, -120, 24, true);
    tower(-13, -150, 8, true);
    tower(26, -76, 16, false);
    tower(50, -58, 13, true);
    tower(-70, -40, 10, true);
    const g = c.createLinearGradient(-100, -160, 100, 80);
    g.addColorStop(0, shade(color, 0.18)); g.addColorStop(0.5, color); g.addColorStop(1, shade(color, -0.4));
    rimFill(c, body, g, 'rgba(190,175,235,.6)', 0.9, -0.9);
    c.save(); c.clip(body);
    texture(c, -110, -200, 220, 280, 0.5, 'overlay', 0.6);
    // stone courses and arrow slits
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.5;
    for (let yy = -150; yy < 40; yy += 5) { c.beginPath(); c.moveTo(-80, yy); c.lineTo(80, yy); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.6)';
    for (const [sx, sy] of [[-52, -60], [-44, -60], [-16, -72], [-10, -72], [22, -50], [30, -50], [50, -32], [-30, -10], [0, -14], [36, -10]]) c.fillRect(sx, sy, 1.4, 6);
    // roof shingles
    c.strokeStyle = 'rgba(0,0,0,.4)';
    for (let yy = -186; yy < -80; yy += 4) { c.beginPath(); c.moveTo(-40, yy); c.lineTo(40, yy); c.stroke(); }
    c.restore();
  });
  if (lit) {
    const wins = [[-49, -70], [-15, -100], [-9, -86], [24, -60], [-30, -20], [8, -22], [47, -42], [-71, -28]];
    wins.forEach(([wx, wy], i) => {
      const f = 0.55 + 0.35 * Math.sin(t * 2.3 + i * 1.7) * Math.sin(t * 0.7 + i);
      glow(ctx, wx + 1.6, wy + 3, 9, '255,150,60', 0.25 * f, true);
      ctx.fillStyle = `rgba(255,${170 + f * 40},90,${f})`;
      ctx.beginPath(); ctx.moveTo(wx, wy + 6); ctx.lineTo(wx, wy + 1.6); ctx.arc(wx + 1.6, wy + 1.6, 1.6, Math.PI, 0); ctx.lineTo(wx + 3.2, wy + 6); ctx.fill();
    });
  }
  ctx.restore();
}

// ---------------------------------------------------------------- fog
let fogSprites = null;
function getFog() {
  if (!fogSprites) {
    fogSprites = [0, 1, 2].map((i) => {
      const c = mk(256, 128), g = c.getContext('2d');
      const r = rng(70 + i);
      for (let k = 0; k < 18; k++) {
        const x = 40 + r() * 176, y = 40 + r() * 48, rad = 20 + r() * 40;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(205,195,228,.28)'); gr.addColorStop(1, 'rgba(205,195,228,0)');
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      return c;
    });
  }
  return fogSprites;
}

export function fog(ctx, t, { y = H - 170, h = 170, alpha = 0.45, n = 9, speed = 7, seed = 11 } = {}) {
  const sp = getFog(); const r = rng(seed);
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const w = 200 + r() * 260, hh = h * (0.6 + r() * 0.8), v = speed * (0.4 + r());
    const base = r() * (W + w);
    const x = ((base + t * v) % (W + w)) - w;
    const yy = y + r() * h - hh / 2;
    ctx.drawImage(sp[i % 3], x, yy, w, hh);
  }
  ctx.restore();
}

let vig = null;
export function vignette(ctx, strength = 1) {
  if (!vig) {
    vig = mk(180, 320);
    const g = vig.getContext('2d');
    const gr = g.createRadialGradient(90, 150, 50, 90, 160, 210);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.7, 'rgba(4,0,8,.35)'); gr.addColorStop(1, 'rgba(4,0,8,.9)');
    g.fillStyle = gr; g.fillRect(0, 0, 180, 320);
  }
  ctx.save(); ctx.globalAlpha = strength; ctx.drawImage(vig, 0, 0, W, H); ctx.restore();
}

// ---------------------------------------------------------------- creatures
export function bat(ctx, x, y, s, phase, color = '#0a0510') {
  const f = Math.sin(phase);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const d of [-1, 1]) {
    const tx = d * 18, ty = -3 - f * 10;
    const wing = new Path2D();
    wing.moveTo(d * 1.8, -2.5);
    wing.quadraticCurveTo(d * 6, -9 - f * 6, d * 10, -6 - f * 9);
    wing.lineTo(tx, ty);
    wing.quadraticCurveTo(d * 15.5, ty + 4, d * 14, ty * 0.5 + 5.5);
    wing.quadraticCurveTo(d * 11.5, ty * 0.35 + 3, d * 9.5, ty * 0.3 + 6);
    wing.quadraticCurveTo(d * 7, ty * 0.15 + 2.5, d * 5.5, 4.5);
    wing.quadraticCurveTo(d * 3.5, 1.5, d * 1.8, 3.5);
    wing.closePath();
    rimFill(ctx, wing, 'rgba(14,7,20,.93)', 'rgba(170,160,220,.4)', 0, -0.7);
    // finger bones through the membrane
    ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(d * 10, -6 - f * 9); ctx.lineTo(d * 14, ty * 0.5 + 5.5);
    ctx.moveTo(d * 10, -6 - f * 9); ctx.lineTo(d * 9.5, ty * 0.3 + 6);
    ctx.moveTo(d * 10, -6 - f * 9); ctx.lineTo(tx, ty);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, 0.5, 2.8, 5, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -4.2, 2.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(-2.6, -8.6); ctx.lineTo(-0.6, -5.6); ctx.lineTo(0.6, -5.6); ctx.lineTo(2.6, -8.6); ctx.lineTo(2, -5); ctx.fill();
  ctx.fillStyle = 'rgba(255,60,60,.7)';
  ctx.fillRect(-1.2, -4.6, 0.7, 0.7); ctx.fillRect(0.5, -4.6, 0.7, 0.7);
  ctx.restore();
}

const WOLF_STAND = [[-38, -44], [-50, -40], [-58, -30], [-62, -18], [-56, -22], [-48, -32], [-40, -34], [-38, -20], [-44, -2], [-46, 0], [-38, 0], [-32, -16], [-28, -22], [-26, -2], [-28, 0], [-20, 0], [-20, -22], [-6, -20], [8, -22], [14, -22], [16, -2], [14, 0], [22, 0], [22, -18], [26, -2], [26, 0], [31, 0], [29, -24], [34, -38], [46, -37], [57, -41], [55, -46], [44, -50], [42, -60], [38, -52], [35, -59], [31, -50], [22, -50], [0, -50], [-20, -48]];
const WOLF_HOWL = [[-42, 0], [-32, -6], [-24, -12], [-22, -30], [-18, -48], [-8, -62], [0, -76], [3, -90], [1, -99], [5, -110], [9, -100], [20, -108], [33, -119], [34, -113], [24, -103], [28, -100], [16, -90], [13, -72], [14, -50], [12, -20], [15, 0], [7, 0], [4, -20], [0, -28], [-6, -8], [-3, 0]];

// Turn a polygon into a ragged, furry outline.
function furPath(pts, seed) {
  const r = rng(seed);
  const p = new Path2D();
  const n = pts.length;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.floor(len / 2.6));
    const nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1);
    // paws and the ground line stay clean
    const furry = !(Math.abs(y1) < 3 && Math.abs(y2) < 3);
    for (let k = 1; k <= steps; k++) {
      const u = k / steps;
      let x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u;
      if (furry && k < steps && k % 2) { const a = (r() - 0.3) * 2.6; x += nx * a; y += ny * a; }
      p.lineTo(x, y);
    }
  }
  p.closePath();
  return p;
}

export function wolf(ctx, x, y, s, { pose = 'stand', flip = false, eyes = true, color = '#060409', t = 0, eyeRGB = '255,190,60' } = {}) {
  const path = cached(`wolf${pose}`, () => furPath(pose === 'howl' ? WOLF_HOWL : WOLF_STAND, pose === 'howl' ? 3 : 4));
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
  const g = ctx.createLinearGradient(0, -110, 0, 0);
  g.addColorStop(0, shade(color, 0.14)); g.addColorStop(0.5, shade(color, 0.05)); g.addColorStop(1, color);
  rimFill(ctx, path, g, 'rgba(180,170,230,.55)', flip ? 1.2 : -1.2, -1.2);
  // a hint of fur texture down the flank
  ctx.save(); ctx.clip(path);
  ctx.strokeStyle = 'rgba(150,140,190,.08)'; ctx.lineWidth = 0.6;
  for (let i = -40; i < 40; i += 4) { ctx.beginPath(); ctx.moveTo(i, -48); ctx.lineTo(i + 3, -30); ctx.stroke(); }
  ctx.restore();
  if (eyes) {
    const [ex, ey] = pose === 'howl' ? [19, -104] : [45, -46];
    const a = 0.75 + 0.25 * Math.sin(t * 4 + x);
    glow(ctx, ex, ey, 8, eyeRGB, 0.55 * a, true);
    ctx.fillStyle = `rgba(${eyeRGB},${a})`;
    ctx.beginPath(); ctx.ellipse(ex, ey, 2, 1.3, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,220,.9)'; ctx.fillRect(ex - 0.3, ey - 0.5, 0.6, 0.6);
  }
  ctx.restore();
}

export function eyesInDark(ctx, x, y, t, s = 1, rgb = '255,190,60') {
  const blink = Math.sin(t * 0.9 + x * 0.13) > 0.97 ? 0.1 : 1;
  for (const dx of [-4 * s, 4 * s]) {
    glow(ctx, x + dx, y, 7 * s, rgb, 0.45 * blink, true);
    ctx.fillStyle = `rgba(${rgb},${blink})`;
    ctx.beginPath(); ctx.ellipse(x + dx, y, 1.8 * s, 1.1 * s, dx < 0 ? 0.25 : -0.25, 0, TAU); ctx.fill();
  }
}

// ---------------------------------------------------------------- people
function skin(ctx, cx, cy, r, light, dark) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r * 1.1);
  g.addColorStop(0, light); g.addColorStop(1, dark);
  return g;
}

// A pale hand with long pointed nails, at (hx, hy), pointing angle a.
function claw(ctx, hx, hy, a, sc = 1) {
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(a); ctx.scale(sc, sc);
  ctx.fillStyle = skin(ctx, 0, 0, 6, '#ece4d8', '#a69888');
  ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 5.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#d8cfc2'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  for (const k of [-2.4, -0.8, 0.8, 2.4]) { ctx.beginPath(); ctx.moveTo(k, 4); ctx.lineTo(k * 1.15, 10 - Math.abs(k) * 0.6); ctx.stroke(); }
  ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 0.7;
  for (const k of [-2.4, -0.8, 0.8, 2.4]) { ctx.beginPath(); ctx.moveTo(k * 1.15, 10 - Math.abs(k) * 0.6); ctx.lineTo(k * 1.2, 12.5 - Math.abs(k) * 0.6); ctx.stroke(); }
  ctx.restore();
}

// The Count: tall, cloaked, white-haired, pale, red-eyed. y = feet.
// His shadow, thrown huge up the wall behind him. It lags a moment behind him,
// and its arms reach a little further than his own.
function countShadow(ctx, t, a, sh) {
  const sw = Math.sin((t - 0.5) * 1.3) * 4, aa = Math.min(1, a + 0.25 + 0.1 * Math.sin(t * 0.9));
  ctx.save();
  ctx.translate(sh.dx ?? 30, sh.dy ?? 0);
  ctx.transform(1, 0, sh.skew ?? -0.18, 1, 0, 0);
  ctx.scale(sh.s ?? 1.5, (sh.s ?? 1.5) * 1.12);
  ctx.fillStyle = `rgba(0,0,0,${sh.a ?? 0.45})`;
  const p = new Path2D();
  p.moveTo(-15, -150); p.bezierCurveTo(-34 - aa * 34, -112, -44 - aa * 42, -60, -48 + sw - aa * 42, 0);
  p.lineTo(48 + sw + aa * 42, 0); p.bezierCurveTo(44 + aa * 42, -60, 34 + aa * 34, -112, 15, -150); p.closePath();
  p.moveTo(-22, -178); p.lineTo(-14, -146); p.lineTo(14, -146); p.lineTo(22, -178); p.lineTo(8, -156); p.lineTo(-8, -156); p.closePath();
  p.ellipse(0, -168, 10, 14, 0, 0, TAU);
  p.moveTo(-9, -174); p.lineTo(-13, -184); p.lineTo(-7, -178); p.moveTo(9, -174); p.lineTo(13, -184); p.lineTo(7, -178);
  ctx.fill(p);
  ctx.strokeStyle = ctx.fillStyle; ctx.lineCap = 'round';
  for (const d of [-1, 1]) {
    const hx = d * (44 + aa * 40), hy = -112 + aa * 4;
    ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(d * 12, -138); ctx.quadraticCurveTo(d * 30, -134, hx, hy); ctx.stroke();
    ctx.lineWidth = 2.6;
    for (const k of [-6, -2, 2, 6]) { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + d * 16, hy + k * 1.6 - 4); ctx.stroke(); }
  }
  ctx.restore();
}

export function count(ctx, x, y, s, { t = 0, alpha = 1, eyes = 1, arms = 0, shadow = null } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
  if (shadow) countShadow(ctx, t, arms, shadow);
  const sw = Math.sin(t * 1.3) * 3, a = arms;
  // cloak
  const cloak = new Path2D();
  cloak.moveTo(-15, -150);
  cloak.bezierCurveTo(-34 - a * 34, -112, -44 - a * 42, -60, -48 + sw - a * 42, 0);
  cloak.quadraticCurveTo(-30, 5, -14, 1); cloak.quadraticCurveTo(0, 4, 14, 1); cloak.quadraticCurveTo(30, 5, 48 + sw + a * 42, 0);
  cloak.bezierCurveTo(44 + a * 42, -60, 34 + a * 34, -112, 15, -150);
  cloak.closePath();
  const cg = ctx.createLinearGradient(-50, -150, 50, 0);
  cg.addColorStop(0, '#221a2c'); cg.addColorStop(0.45, '#0c0812'); cg.addColorStop(1, '#030205');
  rimFill(ctx, cloak, cg, 'rgba(175,165,225,.45)', -1, -1);
  ctx.save(); ctx.clip(cloak);
  for (let i = -4; i <= 4; i++) {
    const bx = i * 4, ex = i * 12 + sw * 0.6 + (i < 0 ? -a * 30 : a * 30);
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(bx, -140); ctx.quadraticCurveTo(bx + i * 4, -70, ex, 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,140,190,.08)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(bx + 2, -140); ctx.quadraticCurveTo(bx + i * 4 + 2, -70, ex + 2.5, 2); ctx.stroke();
  }
  ctx.restore();
  // blood-red lining at the opening
  const lining = new Path2D();
  lining.moveTo(-7, -143); lining.quadraticCurveTo(-21, -70, -19 + sw * 0.5, 0); lining.lineTo(19 + sw * 0.5, 0); lining.quadraticCurveTo(21, -70, 7, -143); lining.closePath();
  const lg = ctx.createLinearGradient(-20, 0, 20, 0);
  lg.addColorStop(0, '#2a0308'); lg.addColorStop(0.3, '#7a0e1c'); lg.addColorStop(0.7, '#5a0a14'); lg.addColorStop(1, '#22030a');
  ctx.fillStyle = lg; ctx.fill(lining);
  // black suit
  const suit = new Path2D();
  suit.moveTo(-8, -143); suit.lineTo(-11.5, 0); suit.lineTo(11.5, 0); suit.lineTo(8, -143); suit.closePath();
  const sg = ctx.createLinearGradient(-11, 0, 11, 0);
  sg.addColorStop(0, '#16111c'); sg.addColorStop(0.4, '#0b0810'); sg.addColorStop(1, '#030205');
  ctx.fillStyle = sg; ctx.fill(suit);
  ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-0.5, -140); ctx.lineTo(-0.8, -60); ctx.moveTo(-4, -60); ctx.lineTo(-5, 0); ctx.moveTo(4, -60); ctx.lineTo(5, 0); ctx.stroke();
  // arms reaching out
  if (a > 0.05) {
    for (const d of [-1, 1]) {
      const hx = d * (40 + a * 34), hy = -106 + a * 6;
      ctx.strokeStyle = '#08060c'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(d * 12, -138); ctx.quadraticCurveTo(d * 28, -130, hx, hy - 4); ctx.stroke();
      claw(ctx, hx + d * 2, hy, d * -1.1 - 0.1 * d, 1);
    }
  }
  // high flared collar with red inside
  const collar = new Path2D();
  collar.moveTo(-22, -178); collar.lineTo(-14, -146); collar.lineTo(14, -146); collar.lineTo(22, -178); collar.quadraticCurveTo(12, -164, 8, -154); collar.lineTo(-8, -154); collar.quadraticCurveTo(-12, -164, -22, -178); collar.closePath();
  rimFill(ctx, collar, '#07050a', 'rgba(175,165,225,.5)', -0.8, -0.8);
  ctx.fillStyle = '#5c0a16';
  ctx.beginPath(); ctx.moveTo(-20, -175); ctx.quadraticCurveTo(-12, -163, -9, -155); ctx.lineTo(-12, -152); ctx.quadraticCurveTo(-15, -164, -20, -175); ctx.fill();
  ctx.beginPath(); ctx.moveTo(20, -175); ctx.quadraticCurveTo(12, -163, 9, -155); ctx.lineTo(12, -152); ctx.quadraticCurveTo(15, -164, 20, -175); ctx.fill();
  // neck
  ctx.fillStyle = '#b8ab9c'; ctx.fillRect(-3.5, -158, 7, 6);
  // pointed ears
  for (const d of [-1, 1]) {
    ctx.fillStyle = '#c9bcae';
    ctx.beginPath(); ctx.moveTo(d * 8, -171); ctx.lineTo(d * 12.5, -178); ctx.lineTo(d * 9.5, -165); ctx.closePath(); ctx.fill();
  }
  // face: long, hard, with a strong chin
  const face = new Path2D();
  face.moveTo(-8.6, -176); face.bezierCurveTo(-10, -167, -9, -160, -4.2, -154.5); face.quadraticCurveTo(0, -151.5, 4.2, -154.5);
  face.bezierCurveTo(9, -160, 10, -167, 8.6, -176); face.bezierCurveTo(6, -183, -6, -183, -8.6, -176); face.closePath();
  ctx.fillStyle = skin(ctx, -1, -170, 12, '#f1e9dd', '#9f9182'); ctx.fill(face);
  // cheek hollows
  ctx.fillStyle = 'rgba(90,70,70,.18)';
  ctx.beginPath(); ctx.ellipse(-5.5, -162, 2, 4, 0.2, 0, TAU); ctx.ellipse(5.5, -162, 2, 4, -0.2, 0, TAU); ctx.fill();
  // white hair swept back, thin at the temples
  const hair = new Path2D();
  hair.moveTo(-9.5, -172); hair.bezierCurveTo(-11, -184, -4, -188, 0, -187.5); hair.bezierCurveTo(4, -188, 11, -184, 9.5, -172);
  hair.quadraticCurveTo(7, -179, 0, -180.5); hair.quadraticCurveTo(-7, -179, -9.5, -172); hair.closePath();
  ctx.fillStyle = '#ece8e1'; ctx.fill(hair);
  ctx.strokeStyle = 'rgba(150,140,135,.6)'; ctx.lineWidth = 0.35;
  for (let i = -8; i <= 8; i += 1.6) { ctx.beginPath(); ctx.moveTo(i * 0.7, -181); ctx.quadraticCurveTo(i, -185, i * 1.15, -186.5); ctx.stroke(); }
  // massive brows almost meeting over the nose
  ctx.fillStyle = '#e2ddd5';
  ctx.beginPath(); ctx.moveTo(-7.5, -171.5); ctx.quadraticCurveTo(-4, -174, -0.6, -171.2); ctx.lineTo(-0.8, -170.2); ctx.quadraticCurveTo(-4, -172, -7.2, -170.3); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7.5, -171.5); ctx.quadraticCurveTo(4, -174, 0.6, -171.2); ctx.lineTo(0.8, -170.2); ctx.quadraticCurveTo(4, -172, 7.2, -170.3); ctx.fill();
  // deep eye sockets
  ctx.fillStyle = 'rgba(70,45,55,.45)';
  ctx.beginPath(); ctx.ellipse(-3.8, -168.3, 2.6, 1.5, 0, 0, TAU); ctx.ellipse(3.8, -168.3, 2.6, 1.5, 0, 0, TAU); ctx.fill();
  if (eyes > 0) {
    glow(ctx, -3.8, -168.3, 7, '255,30,40', 0.55 * eyes, true);
    glow(ctx, 3.8, -168.3, 7, '255,30,40', 0.55 * eyes, true);
  }
  ctx.fillStyle = `rgba(${Math.round(120 + 135 * eyes)},30,35,1)`;
  ctx.beginPath(); ctx.ellipse(-3.8, -168.3, 1.3, 0.8, 0, 0, TAU); ctx.ellipse(3.8, -168.3, 1.3, 0.8, 0, 0, TAU); ctx.fill();
  // aquiline nose
  ctx.strokeStyle = '#8f7f72'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(-0.3, -169.5); ctx.quadraticCurveTo(1.6, -165, 1, -161.5); ctx.quadraticCurveTo(0, -160.6, -1.3, -161.4); ctx.stroke();
  // red lips and the sharp white teeth
  ctx.fillStyle = '#a3121f';
  ctx.beginPath(); ctx.ellipse(0, -157.4, 3.1, 1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fbf8f0';
  ctx.beginPath(); ctx.moveTo(-2.2, -157.3); ctx.lineTo(-1.5, -155.6); ctx.lineTo(-1, -157.3); ctx.moveTo(1, -157.3); ctx.lineTo(1.5, -155.6); ctx.lineTo(2.2, -157.3); ctx.fill();
  // long white moustache
  ctx.fillStyle = '#f2eee8';
  ctx.beginPath(); ctx.moveTo(0, -160.5); ctx.bezierCurveTo(-3, -161, -6, -159, -7.5, -153.5); ctx.quadraticCurveTo(-5, -157, -0.5, -158.4); ctx.quadraticCurveTo(0, -158, 0.5, -158.4);
  ctx.quadraticCurveTo(5, -157, 7.5, -153.5); ctx.bezierCurveTo(6, -159, 3, -161, 0, -160.5); ctx.fill();
  ctx.restore();
}

// One of the three women. hair colour distinguishes them; look 0..1 brightens the eyes.
export function bride(ctx, x, y, s, { hair = '#1d1014', t = 0, look = 0, phase = 0, alpha = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
  glow(ctx, 0, -80, 85, '180,195,255', 0.12 + look * 0.08, true);
  const sway = Math.sin(t * 1.4 + phase) * 6;
  // hair falling behind the shoulders
  const back = new Path2D();
  back.moveTo(-10, -140); back.bezierCurveTo(-18, -128, -17 + Math.sin(t + phase) * 2, -108, -13, -96);
  back.lineTo(13, -96); back.bezierCurveTo(17 + Math.sin(t + phase) * 2, -108, 18, -128, 10, -140); back.closePath();
  ctx.fillStyle = hair; ctx.fill(back);
  // flowing gown
  const gown = new Path2D();
  gown.moveTo(-9, -128);
  gown.bezierCurveTo(-16, -100, -22, -60, -31, 0);
  for (let i = 0; i <= 6; i++) {
    const hx = -31 + i * 10.3;
    gown.quadraticCurveTo(hx + 5, -9 + Math.sin(t * 2 + i + phase) * 5, hx + 10.3, 0);
  }
  gown.bezierCurveTo(22, -60, 16, -100, 9, -128); gown.closePath();
  const gg = ctx.createLinearGradient(0, -135, 0, 2);
  gg.addColorStop(0, 'rgba(244,242,252,.95)'); gg.addColorStop(0.55, 'rgba(215,220,245,.6)'); gg.addColorStop(1, 'rgba(190,200,240,0)');
  ctx.fillStyle = gg; ctx.fill(gown);
  ctx.save(); ctx.clip(gown);
  for (let i = -3; i <= 3; i++) {
    const bx = i * 3, ex = i * 9 + Math.sin(t * 1.6 + i + phase) * 3;
    ctx.strokeStyle = i % 2 ? 'rgba(130,130,175,.28)' : 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(bx, -118); ctx.bezierCurveTo(bx + i, -80, ex - i, -40, ex, 0); ctx.stroke();
  }
  ctx.restore();
  // bare shoulders and arms
  ctx.fillStyle = skin(ctx, 0, -125, 12, '#f6f2f6', '#bdb4c4');
  ctx.beginPath(); ctx.ellipse(0, -126, 10, 4, 0, 0, TAU); ctx.fill();
  ctx.lineCap = 'round';
  for (const d of [-1, 1]) {
    ctx.strokeStyle = '#dad3e2'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(d * 8, -124); ctx.quadraticCurveTo(d * 21, -102, d * (18 - sway * d * 0.5), -78 - look * 20); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(d * 8, -125); ctx.quadraticCurveTo(d * 20, -103, d * (17 - sway * d * 0.5), -80 - look * 20); ctx.stroke();
  }
  // face
  const face = new Path2D();
  face.ellipse(0, -134, 6.6, 8.8, 0, 0, TAU);
  ctx.fillStyle = skin(ctx, -1, -136, 9, '#fbf8fb', '#c3b8c8'); ctx.fill(face);
  // eyes: heavy-lidded, red when she looks
  for (const d of [-1, 1]) {
    ctx.fillStyle = 'rgba(80,50,80,.35)'; ctx.beginPath(); ctx.ellipse(d * 2.7, -135.6, 2, 1.1, 0, 0, TAU); ctx.fill();
    if (look > 0) glow(ctx, d * 2.7, -135.4, 7, '255,30,50', look * 0.6, true);
    ctx.fillStyle = look > 0 ? `rgba(255,${60 - look * 30},70,${0.5 + look * 0.5})` : '#2a1a30';
    ctx.beginPath(); ctx.ellipse(d * 2.7, -135.3, 1.1, 0.7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a1824'; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(d * 1.2, -136.2); ctx.quadraticCurveTo(d * 2.7, -137.2, d * 4.4, -136); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(140,110,130,.5)'; ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(0, -134.5); ctx.lineTo(0.5, -131.5); ctx.stroke();
  // ruby lips
  const lg = ctx.createLinearGradient(0, -129.5, 0, -127);
  lg.addColorStop(0, '#d01a2c'); lg.addColorStop(1, '#7a0a16');
  ctx.fillStyle = lg;
  ctx.beginPath(); ctx.moveTo(-2.6, -128.6); ctx.quadraticCurveTo(-1.2, -130, 0, -129.2); ctx.quadraticCurveTo(1.2, -130, 2.6, -128.6); ctx.quadraticCurveTo(0, -126.8, -2.6, -128.6); ctx.fill();
  // hair framing the face
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.moveTo(-7.5, -134); ctx.bezierCurveTo(-8.5, -145, -3, -146, 0, -144.5); ctx.bezierCurveTo(3, -146, 8.5, -145, 7.5, -134);
  ctx.quadraticCurveTo(5, -142, 0, -141.5); ctx.quadraticCurveTo(-5, -142, -7.5, -134); ctx.fill();
  ctx.strokeStyle = shade(hair.length === 7 ? hair : '#1d1014', 0.3); ctx.lineWidth = 0.4;
  for (let i = -6; i <= 6; i += 1.5) { ctx.beginPath(); ctx.moveTo(i * 0.5, -144); ctx.quadraticCurveTo(i * 1.3, -138, i * 1.5 + Math.sin(t + phase + i) * 0.5, -112); ctx.stroke(); }
  ctx.restore();
}

// Jonathan seen from behind, head and shoulders. y = bottom.
export function jonathanBack(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const coat = new Path2D();
  coat.moveTo(-72, 0); coat.bezierCurveTo(-70, -48, -50, -66, -24, -72); coat.lineTo(24, -72); coat.bezierCurveTo(50, -66, 70, -48, 72, 0); coat.closePath();
  const cg = ctx.createLinearGradient(-70, -70, 70, 0);
  cg.addColorStop(0, '#3a2c2a'); cg.addColorStop(0.5, '#1d1517'); cg.addColorStop(1, '#0a0709');
  rimFill(ctx, coat, cg, 'rgba(200,190,230,.35)', -1.2, -1.2);
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-26, -70); ctx.quadraticCurveTo(-40, -40, -46, 0); ctx.moveTo(26, -70); ctx.quadraticCurveTo(40, -40, 46, 0); ctx.stroke();
  // white collar and neck
  ctx.fillStyle = '#d9d2c4'; ctx.fillRect(-15, -78, 30, 8);
  ctx.fillStyle = skin(ctx, 0, -84, 14, '#d7bea6', '#8f735e');
  ctx.fillRect(-11, -88, 22, 12);
  // head: brown hair, ears
  ctx.fillStyle = '#c8a890';
  ctx.beginPath(); ctx.ellipse(-21, -98, 3.5, 6, 0, 0, TAU); ctx.ellipse(21, -98, 3.5, 6, 0, 0, TAU); ctx.fill();
  const head = new Path2D(); head.ellipse(0, -100, 21, 25, 0, 0, TAU);
  const hg = ctx.createRadialGradient(-6, -112, 3, 0, -100, 26);
  hg.addColorStop(0, '#6a4630'); hg.addColorStop(0.6, '#3a2418'); hg.addColorStop(1, '#1c100a');
  ctx.fillStyle = hg; ctx.fill(head);
  ctx.strokeStyle = 'rgba(140,100,70,.35)'; ctx.lineWidth = 0.7;
  for (let i = -16; i <= 16; i += 3) { ctx.beginPath(); ctx.moveTo(i * 0.4, -122); ctx.quadraticCurveTo(i, -105, i * 0.85, -78); ctx.stroke(); }
  ctx.restore();
}

// Jonathan climbing, seen from behind. reach (-1..1) shifts the arms.
export function jonathanClimb(ctx, x, y, s, { reach = 0, t = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineCap = 'round';
  const limb = (x1, y1, x2, y2, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  // legs
  limb(-5, 0, -12, 26 + Math.sin(t * 3) * 2, 7, '#1a1214');
  limb(5, 0, 13, 24 - Math.sin(t * 3) * 2, 7, '#1a1214');
  ctx.fillStyle = '#0a0607';
  ctx.beginPath(); ctx.ellipse(-12.5, 28 + Math.sin(t * 3) * 2, 4, 2.4, 0, 0, TAU); ctx.ellipse(13.5, 26 - Math.sin(t * 3) * 2, 4, 2.4, 0, 0, TAU); ctx.fill();
  // arms up to the stones
  limb(-7, -30, -18 - reach * 4, -58 - reach * 4, 6, '#2a1d1a');
  limb(7, -30, 18 - reach * 4, -56 + reach * 4, 6, '#231816');
  ctx.fillStyle = '#d6bca4';
  ctx.beginPath(); ctx.arc(-18 - reach * 4, -60 - reach * 4, 3, 0, TAU); ctx.arc(18 - reach * 4, -58 + reach * 4, 3, 0, TAU); ctx.fill();
  // coat
  const coat = new Path2D(); coat.moveTo(-12, -33); coat.lineTo(12, -33); coat.lineTo(11, 6); coat.quadraticCurveTo(0, 9, -11, 6); coat.closePath();
  const cg = ctx.createLinearGradient(-12, -33, 12, 6);
  cg.addColorStop(0, '#3e2e2a'); cg.addColorStop(1, '#120c0c');
  rimFill(ctx, coat, cg, 'rgba(200,190,235,.4)', -0.8, -0.8);
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(0, 6); ctx.stroke();
  // head
  const hg = ctx.createRadialGradient(-2, -44, 1, 0, -40, 9);
  hg.addColorStop(0, '#6a4630'); hg.addColorStop(1, '#1e120c');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, -40, 8.5, 0, TAU); ctx.fill();
  ctx.restore();
}

// Jonathan lying on the floor, side view, eyes nearly shut.
export function jonathanLying(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(6, 1, 62, 5, 0, 0, TAU); ctx.fill();
  const body = new Path2D();
  body.moveTo(-48, -4); body.quadraticCurveTo(-46, -14, -30, -15); body.lineTo(20, -17); body.quadraticCurveTo(40, -19, 44, -12); body.lineTo(44, -2); body.lineTo(-48, -1); body.closePath();
  const bg = ctx.createLinearGradient(0, -18, 0, 0);
  bg.addColorStop(0, '#3a2c2a'); bg.addColorStop(1, '#0c0809');
  rimFill(ctx, body, bg, 'rgba(200,190,235,.35)', 0, -1);
  ctx.fillStyle = '#d9d2c4'; ctx.fillRect(40, -15, 5, 10);
  ctx.fillStyle = skin(ctx, 52, -11, 9, '#e2cbb4', '#9a7e68');
  ctx.beginPath(); ctx.ellipse(52, -11, 8.5, 7.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.ellipse(54, -15, 9, 6, 0.3, Math.PI, TAU); ctx.fill();
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(54, -11); ctx.lineTo(57, -11); ctx.stroke();
  ctx.restore();
}

// The landlady of the Golden Krone: white undergarment, long coloured apron, kerchief.
export function landlady(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const bob = Math.sin(t * 1.2) * 1;
  // skirt
  const skirt = new Path2D();
  skirt.moveTo(-15, -62); skirt.bezierCurveTo(-26, -40, -32, -20, -35, 0); skirt.quadraticCurveTo(0, 4, 35, 0); skirt.bezierCurveTo(32, -20, 26, -40, 15, -62); skirt.closePath();
  const sg = ctx.createLinearGradient(-35, 0, 35, 0);
  sg.addColorStop(0, '#1a0f14'); sg.addColorStop(0.4, '#2e1a22'); sg.addColorStop(1, '#0c070a');
  ctx.fillStyle = sg; ctx.fill(skirt);
  // long apron of coloured stuff, striped
  const apron = new Path2D();
  apron.moveTo(-12, -62); apron.lineTo(-20, -4); apron.quadraticCurveTo(0, 0, 20, -4); apron.lineTo(12, -62); apron.closePath();
  ctx.save(); ctx.clip(apron);
  const ag = ctx.createLinearGradient(-20, 0, 20, 0);
  ag.addColorStop(0, '#5a1814'); ag.addColorStop(0.45, '#9a2a1e'); ag.addColorStop(1, '#4a1210');
  ctx.fillStyle = ag; ctx.fillRect(-22, -64, 44, 66);
  for (let yy = -58; yy < 0; yy += 7) {
    ctx.fillStyle = 'rgba(230,180,60,.55)'; ctx.fillRect(-22, yy, 44, 1.2);
    ctx.fillStyle = 'rgba(20,40,80,.5)'; ctx.fillRect(-22, yy + 2.5, 44, 1.6);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5;
  for (const fx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(fx * 0.6, -60); ctx.lineTo(fx, -2); ctx.stroke(); }
  ctx.restore();
  // white blouse with embroidered sleeves
  const blouse = new Path2D();
  blouse.moveTo(-13, -100); blouse.quadraticCurveTo(-24, -92, -22, -64); blouse.lineTo(22, -64); blouse.quadraticCurveTo(24, -92, 13, -100); blouse.closePath();
  const bg = ctx.createLinearGradient(-22, -100, 22, -64);
  bg.addColorStop(0, '#f2ece0'); bg.addColorStop(1, '#a89f92');
  ctx.fillStyle = bg; ctx.fill(blouse);
  ctx.fillStyle = '#a3121f';
  for (let i = 0; i < 6; i++) { ctx.fillRect(-20 + i * 0.4, -90 + i * 4, 3, 1.4); ctx.fillRect(17 - i * 0.4, -90 + i * 4, 3, 1.4); }
  // dark bodice
  ctx.fillStyle = '#1a1018';
  ctx.beginPath(); ctx.moveTo(-11, -84); ctx.lineTo(-12, -62); ctx.lineTo(12, -62); ctx.lineTo(11, -84); ctx.quadraticCurveTo(0, -78, -11, -84); ctx.fill();
  ctx.fillStyle = '#c99a30'; for (let yy = -82; yy < -64; yy += 4) ctx.fillRect(-0.8, yy, 1.6, 1.6);
  // hands clasped
  ctx.fillStyle = skin(ctx, 0, -66, 6, '#e6cdb0', '#a3846a');
  ctx.beginPath(); ctx.ellipse(0, -66, 6, 4, 0, 0, TAU); ctx.fill();
  // head and kerchief
  ctx.fillStyle = skin(ctx, -2, -116 + bob, 12, '#ecd4b8', '#a07e64');
  ctx.beginPath(); ctx.ellipse(0, -113 + bob, 9.5, 11.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(140,90,70,.3)'; ctx.beginPath(); ctx.ellipse(-4.5, -109 + bob, 2.5, 1.5, 0, 0, TAU); ctx.ellipse(4.5, -109 + bob, 2.5, 1.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2418';
  ctx.beginPath(); ctx.ellipse(-3.6, -115 + bob, 1.4, 1, 0, 0, TAU); ctx.ellipse(3.6, -115 + bob, 1.4, 1, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7a4a3a'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(-2.5, -106 + bob); ctx.quadraticCurveTo(0, -107 + bob, 2.5, -106 + bob); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,80,60,.5)'; ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(-6, -118 + bob); ctx.lineTo(-2, -119 + bob); ctx.moveTo(6, -118 + bob); ctx.lineTo(2, -119 + bob); ctx.stroke();
  const kg = ctx.createLinearGradient(-14, -130, 14, -100);
  kg.addColorStop(0, '#b02a28'); kg.addColorStop(1, '#5a1010');
  ctx.fillStyle = kg;
  ctx.beginPath(); ctx.moveTo(-13, -111 + bob); ctx.quadraticCurveTo(0, -137 + bob, 13, -111 + bob); ctx.lineTo(17, -94 + bob); ctx.lineTo(10, -107 + bob); ctx.quadraticCurveTo(0, -125 + bob, -10, -107 + bob); ctx.lineTo(-17, -94 + bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(240,200,80,.6)';
  for (let i = -8; i <= 8; i += 4) ctx.fillRect(i, -126 + bob + Math.abs(i) * 0.4, 1.5, 1.5);
  ctx.restore();
}

// ---------------------------------------------------------------- interiors
// Stone blocks with bevelled edges, mortar, damp and moss. Cached.
export function stoneWall(ctx, x, y, w, h, opts = {}) {
  const { seed = 1, base = '#2a2230', rowH = 22 } = opts;
  layer(ctx, `stone|${x}|${y}|${w}|${h}|${seed}|${base}|${rowH}`, x, y, w, h, (c) => {
    const r = stoneBlocks(c, x, y, w, h, opts);
    // damp streaks running down
    for (let i = 0; i < 6; i++) {
      const sx = x + r() * w, sw = 8 + r() * 20;
      const sg = c.createLinearGradient(0, y, 0, y + h);
      sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(0.4 + r() * 0.3, 'rgba(0,0,0,.18)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sg; c.fillRect(sx, y, sw, h);
    }
    // darker toward the floor and the corners
    const ao = c.createLinearGradient(0, y, 0, y + h);
    ao.addColorStop(0, 'rgba(0,0,0,.35)'); ao.addColorStop(0.3, 'rgba(0,0,0,0)'); ao.addColorStop(0.85, 'rgba(0,0,0,.05)'); ao.addColorStop(1, 'rgba(0,0,0,.45)');
    c.fillStyle = ao; c.fillRect(x, y, w, h);
  });
}

// Just the blocks (no lighting), drawn straight into c. Returns the random source.
export function stoneBlocks(c, x, y, w, h, { seed = 1, base = '#2a2230', tint = 0.12, rowH = 22 } = {}) {
  {
    c.fillStyle = shade(base, -0.55); c.fillRect(x, y, w, h);
    const r = rng(seed);
    let row = 0;
    for (let yy = y; yy < y + h; yy += rowH, row++) {
      let xx = x - (row % 2 ? 20 : 0) - r() * 10;
      while (xx < x + w) {
        const bw = 30 + r() * 28;
        const l = (r() - 0.5) * tint * 2.2;
        const col = shade(base, l);
        const j = () => (r() - 0.5) * 1.6;
        const x0 = xx + 1.2, y0 = yy + 1.2, x1 = xx + bw - 1.2, y1 = yy + rowH - 1.2;
        const stone = new Path2D();
        stone.moveTo(x0 + 1.5 + j(), y0 + j()); stone.lineTo(x1 - 1.5 + j(), y0 + j()); stone.lineTo(x1 + j(), y0 + 2 + j());
        stone.lineTo(x1 + j(), y1 - 1.5 + j()); stone.lineTo(x1 - 2 + j(), y1 + j()); stone.lineTo(x0 + 1.5 + j(), y1 + j());
        stone.lineTo(x0 + j(), y1 - 2 + j()); stone.lineTo(x0 + j(), y0 + 1.5 + j()); stone.closePath();
        const g = c.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, shade(col, 0.12)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.22));
        c.fillStyle = g; c.fill(stone);
        // bevel: light top edge, dark bottom edge
        c.save(); c.clip(stone);
        c.fillStyle = 'rgba(255,245,235,.07)'; c.fillRect(x0, y0, bw, 1.6);
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x0, y1 - 1.8, bw, 2); c.fillRect(x1 - 1.6, y0, 2, rowH);
        // the odd crack or chip
        if (r() < 0.12) {
          c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.6;
          const cx = x0 + r() * bw * 0.8;
          c.beginPath(); c.moveTo(cx, y0); c.lineTo(cx + (r() - 0.5) * 6, y0 + rowH * 0.5); c.lineTo(cx + (r() - 0.5) * 8, y1); c.stroke();
        }
        if (r() < 0.07) { c.fillStyle = 'rgba(60,80,40,.25)'; c.beginPath(); c.ellipse(x0 + r() * bw, y1, 8 + r() * 8, 3 + r() * 3, 0, 0, TAU); c.fill(); }
        c.restore();
        xx += bw;
      }
    }
    texture(c, x, y, w, h, 0.45, 'overlay', 1);
    return r;
  }
}

export function woodWall(ctx, x, y, w, h, { seed = 2, base = '#3a2416' } = {}) {
  layer(ctx, `wood|${x}|${y}|${w}|${h}|${seed}|${base}`, x, y, w, h, (c) => {
    c.fillStyle = base; c.fillRect(x, y, w, h);
    const r = rng(seed);
    for (let xx = x; xx < x + w; xx += 28) {
      const col = shade(base, (r() - 0.5) * 0.25);
      const g = c.createLinearGradient(xx, 0, xx + 28, 0);
      g.addColorStop(0, shade(col, -0.15)); g.addColorStop(0.5, shade(col, 0.06)); g.addColorStop(1, shade(col, -0.2));
      c.fillStyle = g; c.fillRect(xx, y, 28, h);
      // grain
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.5;
      for (let k = 0; k < 9; k++) {
        const gx = xx + 2 + r() * 24, ph = r() * 6;
        c.beginPath(); c.moveTo(gx, y);
        for (let yy = y; yy <= y + h; yy += 12) c.lineTo(gx + Math.sin(yy * 0.03 + ph) * 1.6, yy);
        c.stroke();
      }
      // knots
      if (r() < 0.6) {
        const kx = xx + 6 + r() * 16, ky = y + r() * h;
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.8;
        for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(kx, ky, k * 1.6, k * 3.2, 0, 0, TAU); c.stroke(); }
      }
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(xx, y, 1.3, h);
      c.fillStyle = 'rgba(255,220,180,.06)'; c.fillRect(xx + 1.3, y, 1, h);
    }
    texture(c, x, y, w, h, 0.35, 'overlay', 1);
    const ao = c.createLinearGradient(0, y, 0, y + h);
    ao.addColorStop(0, 'rgba(0,0,0,.4)'); ao.addColorStop(0.35, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,.4)');
    c.fillStyle = ao; c.fillRect(x, y, w, h);
  });
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
  const pad = 9;
  layer(ctx, `win|${x}|${y}|${w}|${h}|${mullions}|${moonX}|${moonY}|${mountains}`, x - pad - 2, y - pad - 2, w + pad * 2 + 4, h + pad * 2 + 8, (c) => {
    // carved stone surround
    archPath(c, x - pad, y - pad, w + pad * 2, h + pad + 4);
    const fg = c.createLinearGradient(x - pad, y, x + w + pad, y + h);
    fg.addColorStop(0, '#5a5060'); fg.addColorStop(1, '#221c26');
    c.fillStyle = fg; c.fill();
    c.save(); archPath(c, x - pad, y - pad, w + pad * 2, h + pad + 4); c.clip();
    texture(c, x - pad, y - pad, w + pad * 2, h + pad * 2, 0.5, 'overlay', 1);
    c.restore();
    // inner reveal (depth of the wall)
    archPath(c, x - 3, y - 3, w + 6, h + 3);
    c.fillStyle = '#16111a'; c.fill();
    c.save();
    archPath(c, x, y, w, h); c.clip();
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#0c0618'); g.addColorStop(0.7, '#2c1838'); g.addColorStop(1, '#4a2a4a');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    const r = rng(Math.round(x + y));
    for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(240,235,255,${0.2 + r() * 0.6})`; c.fillRect(x + r() * w, y + r() * h * 0.6, 0.8, 0.8); }
    const mr = Math.min(w, h) * 0.12;
    drawMoonDisk(c, x + w * moonX, y + h * moonY, mr);
    if (mountains) {
      for (const [k, col, base] of [[0, '#1c1028', 0.7], [1, '#0e0816', 0.8]]) {
        c.fillStyle = col;
        c.beginPath(); c.moveTo(x, y + h);
        for (let i = 0; i <= 12; i++) c.lineTo(x + (w * i) / 12, y + h * (base + 0.07 * Math.sin(i * 1.9 + k * 2) + 0.03 * Math.sin(i * 5.3 + k)));
        c.lineTo(x + w, y + h); c.fill();
      }
    }
    // leaded diamond panes with a sheen
    c.strokeStyle = 'rgba(10,8,12,.85)'; c.lineWidth = 0.8;
    for (let d = -h; d < w + h; d += 11) {
      c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d + h * 0.55, y + h); c.stroke();
      c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d - h * 0.55, y + h); c.stroke();
    }
    const sh = c.createLinearGradient(x, y, x + w, y + h);
    sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(0.7, 'rgba(255,255,255,.05)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sh; c.fillRect(x, y, w, h);
    c.restore();
    if (mullions) {
      c.strokeStyle = '#2a2230'; c.lineWidth = 3.2;
      c.beginPath(); c.moveTo(x + w / 2, y + 2); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * 0.55); c.lineTo(x + w, y + h * 0.55); c.stroke();
      c.strokeStyle = 'rgba(200,190,220,.25)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(x + w / 2 - 1.2, y + 2); c.lineTo(x + w / 2 - 1.2, y + h); c.stroke();
    }
    // sill
    c.fillStyle = '#3a3240'; c.fillRect(x - pad - 2, y + h + 2, w + pad * 2 + 4, 6);
    c.fillStyle = 'rgba(220,210,240,.15)'; c.fillRect(x - pad - 2, y + h + 2, w + pad * 2 + 4, 1.2);
  });
  // moonbeam into the room, with drifting motes
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const beam = ctx.createLinearGradient(x, y + h, x + 40, y + h + 200);
  beam.addColorStop(0, 'rgba(150,150,210,.14)'); beam.addColorStop(1, 'rgba(150,150,210,0)');
  ctx.fillStyle = beam;
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w + 60, y + h + 200); ctx.lineTo(x + 30, y + h + 200); ctx.fill();
  for (let i = 0; i < 10; i++) {
    const mx = x + 10 + ((i * 37 + t * 4) % (w + 30)), my = y + h + ((i * 53 + t * 6) % 180);
    ctx.fillStyle = `rgba(220,220,255,${0.15 + 0.15 * Math.sin(t + i)})`;
    ctx.fillRect(mx, my, 1.2, 1.2);
  }
  ctx.restore();
}

export function fireplace(ctx, x, y, w, h, t) {
  layer(ctx, `fire|${x}|${y}|${w}|${h}`, x - 14, y - 22, w + 28, h + 24, (c) => {
    // stone surround
    const sg = c.createLinearGradient(x, y, x + w, y + h);
    sg.addColorStop(0, '#4a4048'); sg.addColorStop(1, '#1e181e');
    c.fillStyle = sg; c.fillRect(x - 6, y, w + 12, h);
    texture(c, x - 6, y, w + 12, h, 0.5, 'overlay', 1);
    // mantel with moulding
    c.fillStyle = '#2a2026'; c.fillRect(x - 14, y - 20, w + 28, 14);
    c.fillStyle = '#3a3038'; c.fillRect(x - 14, y - 20, w + 28, 3);
    c.fillStyle = '#151015'; c.fillRect(x - 10, y - 6, w + 20, 6);
    // firebox
    archPath(c, x + 10, y + 10, w - 20, h - 10);
    const fb = c.createLinearGradient(0, y + 10, 0, y + h);
    fb.addColorStop(0, '#050304'); fb.addColorStop(1, '#2a1208');
    c.fillStyle = fb; c.fill();
    c.save(); archPath(c, x + 10, y + 10, w - 20, h - 10); c.clip();
    c.strokeStyle = 'rgba(80,30,10,.35)'; c.lineWidth = 0.6;
    for (let yy = y + 14; yy < y + h; yy += 6) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
    c.restore();
    // andirons and logs
    c.fillStyle = '#0c0808'; c.fillRect(x + 18, y + h - 12, 4, 12); c.fillRect(x + w - 22, y + h - 12, 4, 12);
    for (const [lx, ly, lw] of [[x + w * 0.22, y + h - 9, w * 0.56], [x + w * 0.3, y + h - 15, w * 0.42]]) {
      const lg = c.createLinearGradient(0, ly - 4, 0, ly + 4);
      lg.addColorStop(0, '#4a2a14'); lg.addColorStop(1, '#1a0c06');
      c.fillStyle = lg; c.fillRect(lx, ly - 4, lw, 8);
      c.fillStyle = '#6a4024'; c.beginPath(); c.ellipse(lx, ly, 2, 4, 0, 0, TAU); c.fill();
    }
  });
  const cx = x + w / 2, by = y + h - 10;
  const fl = Math.sin(t * 9) * 0.06 + Math.sin(t * 13.7) * 0.04;
  glow(ctx, cx, by - 10, w * 1.4, '255,110,30', 0.26 + fl, true);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const fx = cx + (i - 3) * (w * 0.065);
    const fh = 14 + 12 * Math.abs(Math.sin(t * 6 + i * 1.7)) + (i === 3 ? 14 : 0) + (i === 2 || i === 4 ? 6 : 0);
    const g = ctx.createLinearGradient(0, by, 0, by - fh);
    g.addColorStop(0, 'rgba(255,240,180,.9)'); g.addColorStop(0.4, 'rgba(255,150,40,.7)'); g.addColorStop(1, 'rgba(200,40,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(fx - 6, by); ctx.quadraticCurveTo(fx - 5, by - fh * 0.55, fx + Math.sin(t * 8 + i) * 3, by - fh); ctx.quadraticCurveTo(fx + 5, by - fh * 0.55, fx + 6, by); ctx.fill();
  }
  // embers
  for (let i = 0; i < 6; i++) {
    const p = (t * 0.6 + i * 0.37) % 1;
    ctx.fillStyle = `rgba(255,${150 + i * 10},60,${1 - p})`;
    ctx.fillRect(cx + Math.sin(i * 3 + t * 2) * 12, by - 10 - p * h * 0.6, 1.3, 1.3);
  }
  ctx.restore();
}

export function candle(ctx, x, y, t, s = 1) {
  const fl = Math.sin(t * 11 + x) * 0.6 + Math.sin(t * 7.3 + y) * 0.4;
  glow(ctx, x, y - 14 * s, 60 * s, '255,160,70', 0.2 + fl * 0.03, true);
  // brass holder
  ctx.fillStyle = '#6a4a1a'; ctx.beginPath(); ctx.ellipse(x, y + 1.5 * s, 6 * s, 1.8 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c99a40'; ctx.beginPath(); ctx.ellipse(x, y + 0.8 * s, 5.5 * s, 1.4 * s, 0, 0, TAU); ctx.fill();
  // wax with drips
  const wg = ctx.createLinearGradient(x - 3 * s, 0, x + 3 * s, 0);
  wg.addColorStop(0, '#fff6dc'); wg.addColorStop(0.6, '#e6d8b4'); wg.addColorStop(1, '#a8987a');
  ctx.fillStyle = wg; ctx.fillRect(x - 3 * s, y - 11 * s, 6 * s, 12 * s);
  ctx.fillStyle = '#f2e8cc';
  ctx.beginPath(); ctx.ellipse(x - 2 * s, y - 7 * s, 1 * s, 3 * s, 0, 0, TAU); ctx.ellipse(x + 2.2 * s, y - 5 * s, 0.9 * s, 2.4 * s, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 0.6 * s; ctx.beginPath(); ctx.moveTo(x, y - 11 * s); ctx.lineTo(x, y - 13 * s); ctx.stroke();
  // flame
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const fx = x + fl * 0.6, fy = y - 16 * s;
  const g = ctx.createRadialGradient(fx, fy + 2 * s, 0, fx, fy, 6 * s);
  g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(0.35, 'rgba(255,210,110,.95)'); g.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(fx, fy - 6 * s); ctx.quadraticCurveTo(fx + 3 * s, fy + 1 * s, fx, fy + 4 * s); ctx.quadraticCurveTo(fx - 3 * s, fy + 1 * s, fx, fy - 6 * s); ctx.fill();
  ctx.fillStyle = 'rgba(90,120,255,.5)'; ctx.beginPath(); ctx.ellipse(x, y - 12.5 * s, 1 * s, 1.2 * s, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

export function bookshelf(ctx, x, y, w, h, seed = 5) {
  layer(ctx, `shelf|${x}|${y}|${w}|${h}|${seed}`, x - 4, y - 8, w + 8, h + 10, (c) => {
    // carved frame
    const fg = c.createLinearGradient(x, 0, x + w, 0);
    fg.addColorStop(0, '#3a2414'); fg.addColorStop(0.5, '#2a180c'); fg.addColorStop(1, '#1a0e06');
    c.fillStyle = fg; c.fillRect(x - 4, y - 8, w + 8, h + 10);
    c.fillStyle = '#4a3020'; c.fillRect(x - 4, y - 8, w + 8, 3);
    c.fillStyle = '#0e0804'; c.fillRect(x, y, w, h);
    texture(c, x - 4, y - 8, w + 8, h + 10, 0.4, 'overlay', 1);
    const r = rng(seed);
    const shelves = Math.floor(h / 34);
    const cols = ['#5a1a16', '#26341e', '#2b2348', '#6a4220', '#4a1010', '#1d2a38', '#3a2a14', '#502030'];
    for (let i = 0; i < shelves; i++) {
      const sy = y + 6 + i * 34;
      // shadow at the back of each shelf
      c.fillStyle = '#060302'; c.fillRect(x, sy - 6, w, 34);
      let bx = x + 3;
      while (bx < x + w - 6) {
        if (r() < 0.06) { bx += 6 + r() * 6; continue; }
        const bw = 4 + r() * 6, bh = 19 + r() * 9;
        const col = cols[Math.floor(r() * cols.length)];
        const lean = r() < 0.07 ? 0.18 : 0;
        c.save(); c.translate(bx, sy + 28); c.rotate(lean);
        const g = c.createLinearGradient(0, 0, bw, 0);
        g.addColorStop(0, shade(col, -0.3)); g.addColorStop(0.35, shade(col, 0.22)); g.addColorStop(1, shade(col, -0.45));
        c.fillStyle = g; c.fillRect(0, -bh, bw, bh);
        c.fillStyle = 'rgba(230,190,100,.55)'; c.fillRect(0, -bh + 3, bw, 0.9); c.fillRect(0, -5, bw, 0.9);
        if (bw > 6) { c.fillStyle = 'rgba(20,10,5,.6)'; c.fillRect(1.5, -bh + 7, bw - 3, 5); }
        c.restore();
        bx += bw + 0.6 + (lean ? 4 : 0);
      }
      // the shelf board
      c.fillStyle = '#2a180c'; c.fillRect(x, sy + 28, w, 5);
      c.fillStyle = 'rgba(255,220,170,.12)'; c.fillRect(x, sy + 28, w, 1);
    }
    c.fillStyle = 'rgba(120,110,100,.06)'; c.fillRect(x, y, w, h); // dust
  });
}

export function door(ctx, x, y, w, h, { open = 0, seed = 3, light = false } = {}) {
  layer(ctx, `door|${x}|${y}|${w}|${h}|${open}|${seed}|${light}`, x - 12, y - 12, w + 24, h + 12, (c) => {
    // voussoirs: the stone arch around the door
    archPath(c, x - 10, y - 10, w + 20, h + 10);
    const ag = c.createLinearGradient(x - 10, y - 10, x + w + 10, y + h);
    ag.addColorStop(0, '#564c58'); ag.addColorStop(1, '#201a22');
    c.fillStyle = ag; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1;
    const cx = x + w / 2, cy = y + w / 2;
    for (let a = Math.PI; a <= TAU + 0.01; a += Math.PI / 7) {
      c.beginPath(); c.moveTo(cx + Math.cos(a) * (w / 2), cy + Math.sin(a) * (w / 2)); c.lineTo(cx + Math.cos(a) * (w / 2 + 10), cy + Math.sin(a) * (w / 2 + 10)); c.stroke();
    }
    c.save(); archPath(c, x - 10, y - 10, w + 20, h + 10); c.clip();
    texture(c, x - 12, y - 12, w + 24, h + 12, 0.45, 'overlay', 1);
    c.restore();
    archPath(c, x, y, w, h);
    c.fillStyle = light ? '#3a2410' : '#030203'; c.fill();
    c.save();
    archPath(c, x, y, w, h); c.clip();
    if (open > 0) {
      const og = c.createLinearGradient(x, 0, x + w, 0);
      og.addColorStop(0, 'rgba(0,0,0,1)'); og.addColorStop(1, light ? 'rgba(255,160,70,.3)' : 'rgba(25,15,30,1)');
      c.fillStyle = og; c.fillRect(x, y, w, h);
    }
    const dw = w * (1 - open * 0.8);
    const r = rng(seed);
    const planks = 5;
    for (let i = 0; i < planks; i++) {
      const px = x + (i * dw) / planks, pw = dw / planks - 0.8;
      const base = `#${(0x40 + Math.floor(r() * 18)).toString(16)}${(0x26 + Math.floor(r() * 10)).toString(16)}${(0x16 + Math.floor(r() * 6)).toString(16)}`;
      const g = c.createLinearGradient(px, 0, px + pw, 0);
      g.addColorStop(0, shade(base, -0.25)); g.addColorStop(0.5, base); g.addColorStop(1, shade(base, -0.35));
      c.fillStyle = g; c.fillRect(px, y, pw, h);
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.5;
      for (let k = 0; k < 4; k++) {
        const gx = px + 1 + r() * (pw - 2), ph = r() * 6;
        c.beginPath(); c.moveTo(gx, y); for (let yy = y; yy <= y + h; yy += 10) c.lineTo(gx + Math.sin(yy * 0.05 + ph) * 1, yy); c.stroke();
      }
    }
    texture(c, x, y, dw, h, 0.4, 'overlay', 1);
    // iron strap hinges with rivets
    for (const sy of [y + h * 0.28, y + h * 0.74]) {
      const ig = c.createLinearGradient(0, sy, 0, sy + 5);
      ig.addColorStop(0, '#3a3438'); ig.addColorStop(1, '#0a0809');
      c.fillStyle = ig; c.fillRect(x, sy, dw * 0.85, 5);
      c.beginPath(); c.moveTo(x + dw * 0.85, sy); c.lineTo(x + dw * 0.92, sy + 2.5); c.lineTo(x + dw * 0.85, sy + 5); c.fill();
      c.fillStyle = '#5a5258';
      for (let rx = x + 4; rx < x + dw * 0.8; rx += dw / 6) { c.beginPath(); c.arc(rx, sy + 2.5, 0.9, 0, TAU); c.fill(); }
    }
    // ring handle and keyhole
    c.strokeStyle = '#2a2428'; c.lineWidth = 2.2;
    c.beginPath(); c.arc(x + dw * 0.8, y + h * 0.56, 5, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(160,150,170,.35)'; c.lineWidth = 0.7;
    c.beginPath(); c.arc(x + dw * 0.8, y + h * 0.56, 5, Math.PI, Math.PI * 1.6); c.stroke();
    c.fillStyle = '#000'; c.fillRect(x + dw * 0.8 - 0.8, y + h * 0.5 - 2, 1.6, 3.5);
    c.restore();
  });
}

export function table(ctx, x, y, w, { cloth = null } = {}) {
  layer(ctx, `table|${x}|${y}|${w}|${cloth}`, x - 6, y - 4, w + 12, 62, (c) => {
    // turned legs
    for (const lx of [x + 9, x + w - 9]) {
      const lg = c.createLinearGradient(lx - 4, 0, lx + 4, 0);
      lg.addColorStop(0, '#120a05'); lg.addColorStop(0.4, '#4a2e18'); lg.addColorStop(1, '#0c0603');
      c.fillStyle = lg;
      c.fillRect(lx - 3, y + 8, 6, 46);
      for (const by of [y + 16, y + 34, y + 48]) { c.beginPath(); c.ellipse(lx, by, 4.5, 2.5, 0, 0, TAU); c.fill(); }
    }
    const tg = c.createLinearGradient(0, y, 0, y + 8);
    tg.addColorStop(0, '#5a3a20'); tg.addColorStop(1, '#1e1208');
    c.fillStyle = tg; c.fillRect(x, y, w, 8);
    c.fillStyle = 'rgba(255,220,170,.2)'; c.fillRect(x, y, w, 1);
    if (cloth) {
      const cg = c.createLinearGradient(0, y - 2, 0, y + 18);
      cg.addColorStop(0, shade(cloth, 0.15)); cg.addColorStop(1, shade(cloth, -0.35));
      c.fillStyle = cg;
      c.beginPath(); c.moveTo(x - 4, y - 2); c.lineTo(x + w + 4, y - 2); c.lineTo(x + w + 5, y + 18);
      for (let i = 10; i >= 0; i--) c.quadraticCurveTo(x - 4 + (w + 8) * (i + 0.5) / 10, y + 21, x - 4 + ((w + 8) * i) / 10, y + 18);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1;
      for (let i = 1; i < 10; i++) { const fx = x - 4 + ((w + 8) * i) / 10; c.beginPath(); c.moveTo(fx, y + 4); c.lineTo(fx, y + 18); c.stroke(); }
    }
  });
}

// Flagstones in perspective.
export function floor(ctx, y, color = '#120b10') {
  layer(ctx, `floor|${y}|${color}`, 0, y, W, H - y, (c) => {
    const g = c.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, shade(color, -0.2)); g.addColorStop(0.3, color); g.addColorStop(1, shade(color, -0.6));
    c.fillStyle = g; c.fillRect(0, y, W, H - y);
    const r = rng(Math.round(y));
    const vx = W / 2;
    let rowY = y, rh = 6;
    while (rowY < H) {
      const ny = rowY + rh;
      const k = (rowY - y) / (H - y);
      const cols = 6;
      for (let i = -3; i <= cols + 3; i++) {
        const off = (Math.floor(rowY) % 2) * 0.5;
        const xa = vx + ((i + off) / cols - 0.5) * W * (0.9 + k * 2.4);
        const xb = vx + ((i + off) / cols - 0.5) * W * (0.9 + ((ny - y) / (H - y)) * 2.4);
        const xa2 = vx + ((i + 1 + off) / cols - 0.5) * W * (0.9 + k * 2.4);
        const xb2 = vx + ((i + 1 + off) / cols - 0.5) * W * (0.9 + ((ny - y) / (H - y)) * 2.4);
        c.fillStyle = `rgba(${r() < 0.5 ? '255,245,235' : '0,0,0'},${0.03 + r() * 0.06})`;
        c.beginPath(); c.moveTo(xa, rowY); c.lineTo(xa2, rowY); c.lineTo(xb2, ny); c.lineTo(xb, ny); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.6 + k;
        c.beginPath(); c.moveTo(xa, rowY); c.lineTo(xb, ny); c.stroke();
      }
      c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.6 + k * 1.2;
      c.beginPath(); c.moveTo(0, rowY); c.lineTo(W, rowY); c.stroke();
      c.strokeStyle = 'rgba(255,240,230,.04)'; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(0, rowY + 1); c.lineTo(W, rowY + 1); c.stroke();
      rowY = ny; rh *= 1.45;
    }
    texture(c, 0, y, W, H - y, 0.45, 'overlay', 1);
  });
}

export function crate(ctx, x, y, w, h, { lid = true, earth = false } = {}) {
  layer(ctx, `crate|${x}|${y}|${w}|${h}|${lid}|${earth}`, x - 3, y - 9, w + 6, h + 12, (c) => {
    const r = rng(Math.round(x * 7 + y));
    const planks = 4;
    for (let i = 0; i < planks; i++) {
      const py = y + (h * i) / planks, ph = h / planks - 0.8;
      const base = shade('#3a2414', (r() - 0.5) * 0.3);
      const g = c.createLinearGradient(0, py, 0, py + ph);
      g.addColorStop(0, shade(base, 0.1)); g.addColorStop(1, shade(base, -0.3));
      c.fillStyle = g; c.fillRect(x, py, w, ph);
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.5;
      for (let k = 0; k < 3; k++) { const gy = py + 1 + r() * (ph - 2); c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x + w / 2, gy + (r() - 0.5) * 3, x + w, gy); c.stroke(); }
    }
    // corner battens and nails
    c.fillStyle = '#24160a'; c.fillRect(x, y, 5, h); c.fillRect(x + w - 5, y, 5, h);
    c.fillStyle = '#7a7470';
    for (const nx of [x + 2.5, x + w - 2.5]) for (let ny = y + 4; ny < y + h; ny += h / 4) { c.beginPath(); c.arc(nx, ny, 0.8, 0, TAU); c.fill(); }
    texture(c, x, y, w, h, 0.4, 'overlay', 1);
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(x, y + h - 3, w, 3);
    if (earth) {
      c.fillStyle = '#1e140c'; c.fillRect(x + 2, y - 3, w - 4, 5);
      for (let i = 0; i < w / 3; i++) { c.fillStyle = r() < 0.5 ? '#2a1c10' : '#120a06'; c.beginPath(); c.arc(x + 4 + r() * (w - 8), y - 2 + r() * 2, 1 + r() * 2, 0, TAU); c.fill(); }
    }
    if (lid) {
      const lg = c.createLinearGradient(0, y - 6, 0, y);
      lg.addColorStop(0, '#5a3a20'); lg.addColorStop(1, '#2a1a0c');
      c.fillStyle = lg; c.fillRect(x - 2, y - 6, w + 4, 6);
      c.fillStyle = '#9a948e'; for (let nx = x + 4; nx < x + w; nx += w / 5) { c.beginPath(); c.arc(nx, y - 3, 0.9, 0, TAU); c.fill(); }
    }
  });
}

export function sparkle(ctx, x, y, t, a = 1, rgb = '255,225,170') {
  const p = (Math.sin(t * 2.4) + 1) / 2;
  const r = 3 + p * 5;
  ctx.save();
  ctx.globalAlpha = a * (0.25 + p * 0.5);
  glow(ctx, x, y, r * 2.4, rgb, 0.6, true);
  ctx.strokeStyle = `rgba(${rgb},.9)`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
  ctx.restore();
}

// A small gold crucifix (for the mirror scene).
export function crucifix(ctx, x, y, s, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a;
  glow(ctx, 0, 0, 40, '255,210,120', 0.45, true);
  const g = ctx.createLinearGradient(-11, -16, 11, 16);
  g.addColorStop(0, '#fff0b0'); g.addColorStop(0.4, '#e9c060'); g.addColorStop(1, '#8a6018');
  ctx.fillStyle = g; ctx.strokeStyle = '#6a4408'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.rect(-3, -16, 6, 32); ctx.rect(-11, -9, 22, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,240,.6)'; ctx.fillRect(-2, -15, 1.2, 30); ctx.fillRect(-10, -8, 20, 1.2);
  ctx.restore();
}
