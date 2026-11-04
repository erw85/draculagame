// Climbing minigame: tap the glowing stones to climb down the castle wall.
// Dangers: crumbling stones (look for cracks), wind gusts (don't move), and bats (tap them away).
import * as A from '../art/draw.js';

const { W, H } = A;
const STEP = 92;          // vertical distance between levels (world units)
const JON_SCREEN_Y = 250; // where Jonathan sits on screen

export function climb(cfg) {
  const {
    levels = 9,
    gustEvery = [5, 8],
    batEvery = [4, 7],
    crumbleChance = 0.45,
    grips: maxGrips = 5,
    seed = 1,
    target = 'window', // 'window' or 'ground'
    deathText = 'My fingers slipped from the stone, and the abyss took me.',
    onWin,
    startText,
  } = cfg;

  const r = A.rng(seed);
  // Build the route. Each level after the first has 1-2 holds; at most one crumbles.
  const route = [];
  let px = 200;
  for (let i = 0; i <= levels; i++) {
    const y = 120 + i * STEP;
    if (i === 0 || i === levels) { route.push([{ x: i === levels ? 200 : px, y, crumble: false }]); continue; }
    const a = Math.max(105, Math.min(320, px + (r() - 0.5) * 150));
    const holds = [{ x: a, y: y + (r() - 0.5) * 18, crumble: false }];
    if (i > 1 && r() < 0.8) {
      let b = a < 210 ? a + 70 + r() * 60 : a - 70 - r() * 60;
      b = Math.max(100, Math.min(330, b));
      holds.push({ x: b, y: y + (r() - 0.5) * 18, crumble: false });
      if (r() < crumbleChance) holds[0].crumble = true; // the "obvious" one cracks
    }
    holds.sort(() => r() - 0.5);
    route.push(holds);
    px = holds.find((h) => !h.crumble).x;
  }

  let level = 0;
  let cur = route[0][0];
  let jx = cur.x, jy = cur.y; // Jonathan's world position (hands)
  let move = null;            // {fx,fy,tx,ty,t}
  let camY = jy - JON_SCREEN_Y;
  let grips = maxGrips;
  let gust = { state: 'calm', t: gustEvery[0] + r() * (gustEvery[1] - gustEvery[0]) };
  let batT = batEvery[0] + 1.5;
  const bats = [];
  let shake = 0;
  let flashRed = 0;
  const debris = [];
  let done = false;
  let hint = 0;

  const lose = (g, why) => {
    grips--;
    shake = 0.4;
    flashRed = 0.6;
    g.sound.scrape();
    if (grips <= 0) { g.die(deathText); return; }
    g.say(why);
  };

  const nextHolds = () => (route[level + 1] || []);

  return {
    peek: () => ({
      moving: !!move, gust: gust.state, level, grips,
      next: nextHolds().map((h) => ({ x: h.x, y: h.y - camY, crumble: h.crumble })),
      bats: bats.filter((b) => !b.gone).map((b) => ({ x: b.x, y: b.y - camY })),
    }),
    start(g) {
      g.sound.heartbeat(true, 1.3);
      g.prompt('Tap a glowing stone to climb down');
      if (startText) g.say(startText);
    },

    update(dt, g) {
      if (done) return;
      hint += dt;
      shake = Math.max(0, shake - dt);
      flashRed = Math.max(0, flashRed - dt);
      if (move) {
        move.t += dt / 0.4;
        const e = Math.min(1, move.t);
        const s = e * e * (3 - 2 * e);
        jx = move.fx + (move.tx - move.fx) * s;
        jy = move.fy + (move.ty - move.fy) * s;
        if (e >= 1) {
          move = null;
          if (level >= levels) { done = true; g.endChallenge(); onWin(g); return; }
        }
      }
      camY += (jy - JON_SCREEN_Y - camY) * Math.min(1, dt * 4);

      // Wind gusts: a warning, then a blast. Moving during the blast costs a grip.
      gust.t -= dt;
      if (gust.state === 'calm' && gust.t <= 0) {
        gust = { state: 'warn', t: 2.0 };
        g.sound.gust();
        g.prompt('The wind is rising — hold still!');
      } else if (gust.state === 'warn' && gust.t <= 0) {
        gust = { state: 'blow', t: 1.2 };
      } else if (gust.state === 'blow' && gust.t <= 0) {
        gust = { state: 'calm', t: gustEvery[0] + r() * (gustEvery[1] - gustEvery[0]) };
        g.prompt('Tap a glowing stone to climb down');
      }

      // Bats swoop in from the side; tap them before they reach you.
      batT -= dt;
      if (batT <= 0 && !move && gust.state === 'calm') {
        batT = batEvery[0] + r() * (batEvery[1] - batEvery[0]);
        const side = r() < 0.5 ? -1 : 1;
        bats.push({ x: side < 0 ? -20 : W + 20, y: jy - 30 + (r() - 0.5) * 120, side, t: 0, ph: 0, gone: false, vx: 0, vy: 0 });
        g.sound.screech(side * 0.8);
      }
      for (const b of bats) {
        b.ph += dt * 22;
        if (b.gone) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy -= 200 * dt; continue; }
        b.t += dt;
        const tx = jx, ty = jy - 40;
        const sp = 55 + b.t * 12;
        const d = Math.hypot(tx - b.x, ty - b.y);
        b.x += ((tx - b.x) / d) * sp * dt;
        b.y += ((ty - b.y) / d) * sp * dt + Math.sin(b.t * 9) * 1.2;
        if (d < 16) { b.gone = true; b.vx = -b.side * 120; b.vy = -60; lose(g, 'The bat beat its wings in my face and I lost my hold! I clung on by my fingertips.'); }
      }
      for (let i = bats.length - 1; i >= 0; i--) if (bats[i].gone && (bats[i].y < camY - 80 || bats[i].x < -60 || bats[i].x > W + 60)) bats.splice(i, 1);
      for (const d of debris) { d.vy += 500 * dt; d.y += d.vy * dt; d.x += d.vx * dt; }
    },

    down(x, y, g) {
      if (done) return;
      const wy = y + camY;
      // bats first
      for (const b of bats) {
        if (!b.gone && Math.hypot(b.x - x, b.y - camY - y) < 48) {
          b.gone = true; b.vx = (b.x < jx ? -1 : 1) * 200; b.vy = -100;
          g.sound.flap((b.x / W) * 1.6 - 0.8);
          return;
        }
      }
      if (move) return;
      const near = nextHolds()
        .map((h) => ({ h, d: Math.hypot(h.x - x, h.y - wy) }))
        .filter((o) => o.d < 50)
        .sort((a, b) => a.d - b.d)[0];
      if (!near) return;
      const h = near.h;
      // Moving in the wind is refused rather than punished.
      if (gust.state === 'blow') { shake = 0.25; g.sound.scrape(); g.prompt('Too windy to move — wait for the gust to pass'); return; }
      if (h.crumble) {
        g.sound.crumble();
        const list = route[level + 1];
        list.splice(list.indexOf(h), 1);
        for (let i = 0; i < 8; i++) debris.push({ x: h.x, y: h.y, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 60 });
        lose(g, 'The stone crumbled away beneath my hand! The mortar is rotten where the stone is cracked.');
        return;
      }
      level++;
      cur = h;
      move = { fx: jx, fy: jy, tx: h.x, ty: h.y, t: 0 };
      g.sound.scrape();
      hint = 0;
    },

    draw(ctx, t) {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * shake, (Math.random() - 0.5) * 8 * shake);
      drawWall(ctx, t, camY, levels, target);
      // holds
      for (let i = 0; i < route.length; i++) {
        for (const h of route[i]) {
          const sy = h.y - camY;
          if (sy < -30 || sy > H + 30) continue;
          drawHold(ctx, h.x, sy, h.crumble);
          if (i === level + 1 && !move) A.sparkle(ctx, h.x, sy, t * 1.6 + h.x, hint > 6 ? 1 : 0.8);
        }
      }
      for (const d of debris) { ctx.fillStyle = '#4a4050'; ctx.fillRect(d.x, d.y - camY, 4, 4); }
      A.jonathanClimb(ctx, jx, jy - camY + 52, 1.1, { reach: move ? Math.sin(move.t * Math.PI) : 0, t });
      for (const b of bats) A.bat(ctx, b.x, b.y - camY, 1.3, b.ph);
      // gust streaks
      if (gust.state !== 'calm') {
        const a = gust.state === 'warn' ? 0.25 : 0.55;
        ctx.strokeStyle = `rgba(210,210,240,${a})`;
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 14; i++) {
          const yy = (i * 47 + t * 30) % H;
          const xx = ((t * 600 + i * 137) % (W + 200)) - 100;
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 40, yy - 6, xx + 90, yy); ctx.stroke();
        }
      }
      ctx.restore();
      if (flashRed > 0) { ctx.fillStyle = `rgba(160,0,10,${flashRed * 0.5})`; ctx.fillRect(0, 0, W, H); }
    },

    drawTop(ctx) {
      // grip meter
      ctx.save();
      ctx.font = '12px "IM Fell English", serif';
      ctx.fillStyle = 'rgba(230,220,240,.85)';
      ctx.textAlign = 'right';
      const x0 = W - 20 - (maxGrips - 1) * 15; // fit any number of grips on screen
      ctx.fillText('Grip', x0 - 12, 92);
      for (let i = 0; i < maxGrips; i++) {
        ctx.fillStyle = i < grips ? '#d0283a' : 'rgba(80,60,70,.6)';
        ctx.beginPath(); ctx.arc(x0 + i * 15, 88, 5.5, 0, Math.PI * 2); ctx.fill();
      }
      // depth meter
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(230,220,240,.85)';
      ctx.fillText(`${Math.max(0, levels - level)} holds to go`, 14, 92);
      ctx.restore();
    },
  };
}

function drawHold(ctx, x, y, crumble) {
  // a jutting stone: shadow beneath, a front face and a moonlit top
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath(); ctx.ellipse(x + 3, y + 10, 17, 4, 0, 0, Math.PI * 2); ctx.fill();
  const front = ctx.createLinearGradient(0, y - 2, 0, y + 7);
  front.addColorStop(0, crumble ? '#4a4048' : '#57505e'); front.addColorStop(1, '#221c26');
  ctx.fillStyle = front; ctx.fillRect(x - 15, y - 2, 30, 9);
  const top = ctx.createLinearGradient(x - 15, 0, x + 15, 0);
  top.addColorStop(0, crumble ? '#8a7f86' : '#a59cb2'); top.addColorStop(1, crumble ? '#4e454e' : '#5c5468');
  ctx.fillStyle = top;
  ctx.beginPath(); ctx.moveTo(x - 15, y - 2); ctx.lineTo(x - 12, y - 7); ctx.lineTo(x + 13, y - 7); ctx.lineTo(x + 15, y - 2); ctx.fill();
  A.texture(ctx, x - 15, y - 7, 30, 14, 0.5, 'overlay', 0.5);
  if (crumble) {
    ctx.strokeStyle = 'rgba(10,4,10,.95)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - 8, y - 7); ctx.lineTo(x - 3, y - 1); ctx.lineTo(x - 6, y + 7); ctx.moveTo(x + 9, y - 7); ctx.lineTo(x + 3, y + 1); ctx.lineTo(x + 7, y + 7); ctx.stroke();
    ctx.fillStyle = '#1a141c'; ctx.fillRect(x - 15, y + 5, 6, 2); ctx.fillRect(x + 10, y + 4, 5, 3);
  }
}

// A tall strip of castle stonework, made once and scrolled.
const TILE_H = 720;
let wallTile = null;
function getWallTile(ctx) {
  if (wallTile) return wallTile;
  const s = 2;
  const c = document.createElement('canvas');
  c.width = W * s; c.height = TILE_H * s;
  const g = c.getContext('2d');
  g.scale(s, s);
  A.stoneBlocks(g, 0, 0, W, TILE_H, { seed: 23, base: '#3a3246', rowH: 24, tint: 0.16 });
  wallTile = c;
  return c;
}

// The castle wall with the abyss to the left.
function drawWall(ctx, t, camY, levels, target) {
  const depth = Math.min(1, camY / (levels * STEP));
  A.sky(ctx, t, { moon: { x: 40, y: 120, r: 22 }, clouds: false, top: '#0a0614', mid: '#170d24', bottom: '#2a1838' });
  A.ridge(ctx, 31, H - 120 + Math.round(depth * 8) * 10, 60, '#0e0818');
  const edge = (wy) => 70 + Math.sin(wy * 0.013) * 14 + Math.sin(wy * 0.041) * 6;
  const wall = new Path2D();
  wall.moveTo(W, -10);
  for (let sy = -10; sy <= H + 10; sy += 8) wall.lineTo(edge(sy + camY), sy);
  wall.lineTo(W, H + 10); wall.closePath();
  // moonlit rim along the wall's edge
  ctx.save(); ctx.translate(-1.5, 0); ctx.fillStyle = 'rgba(190,180,240,.5)'; ctx.fill(wall); ctx.restore();
  ctx.save();
  ctx.clip(wall);
  const tile = getWallTile(ctx);
  const off = -(((camY % TILE_H) + TILE_H) % TILE_H);
  for (let ty = off; ty < H; ty += TILE_H) ctx.drawImage(tile, 0, ty, W, TILE_H);
  // moonlight from the left, falling off across the wall
  const mg = ctx.createLinearGradient(60, 0, W, 0);
  mg.addColorStop(0, 'rgba(170,165,240,.16)'); mg.addColorStop(0.4, 'rgba(0,0,0,.1)'); mg.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // destination
  const endY = 120 + levels * STEP - camY;
  if (target === 'window') {
    if (endY < H + 140) {
      const x = 160, y = endY + 20, w = 80, h = 110;
      ctx.fillStyle = '#5a5064';
      ctx.beginPath(); ctx.moveTo(x - 8, y + h + 4); ctx.lineTo(x - 8, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2 + 8, Math.PI, 0); ctx.lineTo(x + w + 8, y + h + 4); ctx.fill();
      A.texture(ctx, x - 8, y - 8, w + 16, h + 12, 0.5, 'overlay', 1);
      const ig = ctx.createLinearGradient(0, y, 0, y + h);
      ig.addColorStop(0, '#120a10'); ig.addColorStop(1, '#3a2016');
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill();
      A.glow(ctx, x + w / 2, y + h - 20, 60, '255,150,60', 0.18, true);
      ctx.fillStyle = '#6a6074'; ctx.fillRect(x - 12, y + h, w + 24, 8);
      ctx.fillStyle = 'rgba(220,210,240,.25)'; ctx.fillRect(x - 12, y + h, w + 24, 1.5);
    }
  } else if (endY < H + 260) {
    // the foot of the precipice: rocks, mist and waiting eyes
    ctx.fillStyle = '#0a0610';
    ctx.beginPath(); ctx.moveTo(0, endY + 90);
    for (let i = 0; i <= 12; i++) ctx.lineTo(i * 30, endY + 70 + Math.sin(i * 2.1) * 14);
    ctx.lineTo(W, H + 300); ctx.lineTo(0, H + 300); ctx.fill();
    A.fog(ctx, t, { y: endY + 40, h: 220, alpha: 0.6, n: 7, speed: 10, seed: 4 });
    for (const [ex, ey] of [[120, 120], [220, 150], [300, 110], [170, 190]]) A.eyesInDark(ctx, ex, endY + ey, t, 1.1);
  }
}
