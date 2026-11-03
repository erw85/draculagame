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
    grips: maxGrips = 3,
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
      moving: !!move, gust: gust.state, level,
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
        gust = { state: 'warn', t: 1.1 };
        g.sound.gust();
        g.prompt('The wind is rising — hold still!');
      } else if (gust.state === 'warn' && gust.t <= 0) {
        gust = { state: 'blow', t: 1.6 };
      } else if (gust.state === 'blow' && gust.t <= 0) {
        gust = { state: 'calm', t: gustEvery[0] + r() * (gustEvery[1] - gustEvery[0]) };
        g.prompt('Tap a glowing stone to climb down');
      }

      // Bats swoop in from the side; tap them before they reach you.
      batT -= dt;
      if (batT <= 0 && !move) {
        batT = batEvery[0] + r() * (batEvery[1] - batEvery[0]);
        const side = r() < 0.5 ? -1 : 1;
        bats.push({ x: side < 0 ? -20 : W + 20, y: jy - 30 + (r() - 0.5) * 120, side, t: 0, ph: 0, gone: false, vx: 0, vy: 0 });
        g.sound.screech();
      }
      for (const b of bats) {
        b.ph += dt * 22;
        if (b.gone) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy -= 200 * dt; continue; }
        b.t += dt;
        const tx = jx, ty = jy - 40;
        const sp = 95 + b.t * 30;
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
        if (!b.gone && Math.hypot(b.x - x, b.y - camY - y) < 34) {
          b.gone = true; b.vx = (b.x < jx ? -1 : 1) * 200; b.vy = -100;
          g.sound.flap();
          return;
        }
      }
      if (move) return;
      for (const h of nextHolds()) {
        if (Math.hypot(h.x - x, h.y - wy) < 38) {
          if (gust.state === 'blow') { lose(g, 'The wind tore at me as I let go — I nearly fell! I must wait for the gust to pass.'); return; }
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
          return;
        }
      }
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
      ctx.fillText('Grip', W - 70, 92);
      for (let i = 0; i < maxGrips; i++) {
        ctx.fillStyle = i < grips ? '#d0283a' : 'rgba(80,60,70,.6)';
        ctx.beginPath(); ctx.arc(W - 56 + i * 16, 88, 5.5, 0, Math.PI * 2); ctx.fill();
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
  ctx.fillStyle = '#5b5164';
  ctx.fillRect(x - 15, y - 6, 30, 11);
  ctx.fillStyle = '#7a7086';
  ctx.fillRect(x - 15, y - 6, 30, 3);
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.fillRect(x - 15, y + 5, 30, 3);
  if (crumble) {
    ctx.strokeStyle = 'rgba(15,8,15,.9)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x - 2, y - 1); ctx.lineTo(x - 5, y + 4); ctx.moveTo(x + 7, y - 6); ctx.lineTo(x + 4, y); ctx.stroke();
  }
}

// The castle wall with the abyss to the left. Rows are generated per world-row so the
// pattern scrolls consistently.
function drawWall(ctx, t, camY, levels, target) {
  const depth = Math.min(1, camY / (levels * STEP));
  // abyss / sky strip
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a0614'); g.addColorStop(1, '#241434');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  A.drawMoon(ctx, 40, 120 - depth * 60, 22);
  A.ridge(ctx, 31, H - 120 + depth * 80, 60, '#0e0818');
  // wall
  const edge = (wy) => 70 + Math.sin(wy * 0.013) * 14 + Math.sin(wy * 0.041) * 6;
  const rowH = 24;
  const first = Math.floor(camY / rowH) - 1;
  for (let row = first; row < first + H / rowH + 3; row++) {
    const wy = row * rowH, sy = wy - camY;
    const r = A.rng(row * 7919 + 13);
    const ex = edge(wy);
    let xx = ex - (row % 2 ? 16 : 0);
    while (xx < W) {
      const bw = 34 + r() * 24;
      const l = r();
      ctx.fillStyle = `rgb(${34 + l * 14},${28 + l * 10},${40 + l * 14})`;
      ctx.fillRect(Math.max(ex, xx) + 1, sy + 1, bw - 2, rowH - 2);
      xx += bw;
    }
  }
  // shadowed edge
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  for (let sy = 0; sy < H; sy += 6) ctx.fillRect(edge(sy + camY) - 2, sy, 10, 6);
  // moonlight wash
  const mg = ctx.createLinearGradient(0, 0, W, 0);
  mg.addColorStop(0, 'rgba(180,180,255,.12)'); mg.addColorStop(1, 'rgba(0,0,0,.35)');
  ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
  // destination
  const endY = 120 + levels * STEP - camY;
  if (target === 'window') {
    if (endY < H + 140) {
      ctx.fillStyle = '#05030a';
      ctx.fillRect(160, endY + 20, 80, 110);
      ctx.fillStyle = 'rgba(255,170,80,.15)';
      ctx.fillRect(166, endY + 26, 68, 98);
      ctx.fillStyle = '#4c4256'; ctx.fillRect(152, endY + 14, 96, 8);
    }
  } else if (endY < H + 260) {
    // the foot of the precipice: mist and waiting eyes
    A.fog(ctx, t, { y: endY + 40, h: 220, alpha: 0.6, n: 7, speed: 10, seed: 4 });
    for (const [ex, ey] of [[120, 120], [220, 150], [300, 110], [170, 190]]) A.eyesInDark(ctx, ex, endY + ey, t, 1.1);
  }
}
