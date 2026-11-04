import * as A from '../art/draw.js';

const C = (text) => ({ who: 'The Count', text });

// ---------------------------------------------------------------- shorthand puzzle
// Simplified shorthand: each word Mina and Jonathan use has its own stroke.
const SYMBOLS = {
  MINA: 'M8 30 Q20 4 32 30',
  HELP: 'M8 12 L32 28 M30 10 l0.1 0',
  PRISONER: 'M8 22 Q14 8 20 22 T32 22',
  CASTLE: 'M10 8 L10 32 M10 20 L30 20',
  COUNT: 'M14 20 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M26 22 L34 32',
  DANGER: 'M8 30 L20 10 L32 30',
  LOVE: 'M10 12 Q32 12 20 22 Q8 32 30 30',
  HOME: 'M6 20 L30 20 M24 13 L31 20 L24 27',
  // look-alikes, to trap a careless hand
  BLOOD: 'M8 10 L20 30 L32 10',
  NIGHT: 'M8 10 Q20 36 32 10',
  WOLVES: 'M8 18 Q14 32 20 18 T32 18',
  ESCAPE: 'M34 20 L10 20 M16 13 L9 20 L16 27',
};
const PALETTE_ORDER = ['DANGER', 'NIGHT', 'HOME', 'COUNT', 'WOLVES', 'LOVE', 'PRISONER', 'BLOOD', 'HELP', 'ESCAPE', 'CASTLE', 'MINA'];
const TARGET = ['PRISONER', 'COUNT', 'DANGER', 'HELP'];
const GLANCES = 3;
const sym = (w) => `<svg viewBox="0 0 40 40"><path d="${SYMBOLS[w]}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function shorthandPuzzle(g, onSolved) {
  g.mode = 'puzzle';
  const filled = TARGET.map(() => null);
  let active = 0;
  const root = g.overlay(`<div class="ov shorthand">
    <div class="paper">
      <div class="task">The Count watches as I write. To Mr. Hawkins, a formal note. But to Mina, the truth — in our shorthand, which he cannot read:<br><i>I am a <b>prisoner</b>. The <b>Count</b> is a <b>danger</b>. <b>Help</b>.</i><br><small>He is watching. I dare glance at my key only three times.</small></div>
      <div class="slots">${TARGET.map((w, i) => `<div class="wslot" data-i="${i}"><span class="s"></span><span class="lbl">${w}</span></div>`).join('')}</div>
      <div class="palette">${PALETTE_ORDER.map((w) => `<button class="sym" data-w="${w}" aria-label="shorthand stroke">${sym(w)}</button>`).join('')}</div>
      <div class="msg"></div>
      <div class="row">
        <button class="btn ghost" data-peek>Glance at key (<span class="left">${GLANCES}</span>)</button>
        <button class="btn" data-send>Seal letter</button>
      </div>
      <div class="key hidden"><h4>From my notebook:</h4><div class="keygrid">${Object.keys(SYMBOLS).map((w) => `<div>${sym(w)}${w.toLowerCase()}</div>`).join('')}</div></div>
    </div>
  </div>`);
  const slots = [...root.querySelectorAll('.wslot')];
  const msg = root.querySelector('.msg');
  const key = root.querySelector('.key');
  const render = () => slots.forEach((s, i) => {
    s.classList.toggle('active', i === active);
    s.querySelector('.s').innerHTML = filled[i] ? sym(filled[i]) : '';
  });
  render();
  slots.forEach((s, i) => s.addEventListener('click', () => { active = i; g.sound.click(); render(); }));
  root.querySelectorAll('.sym').forEach((b) => b.addEventListener('click', () => {
    g.sound.scrape();
    filled[active] = b.dataset.w;
    const next = filled.findIndex((f) => !f);
    active = next === -1 ? active : next;
    msg.textContent = '';
    render();
  }));
  // Each glance shows the key for a moment only, and the Count notices.
  const peek = root.querySelector('[data-peek]');
  const left = root.querySelector('.left');
  let glances = GLANCES, showing = false;
  const warnings = ['The Count’s shadow fell across the page.', '“You consult your little book a great deal, my friend.”', 'He leaned closer. I could feel the cold of him on my neck.'];
  const setGlances = (n) => { glances = n; left.textContent = n; peek.disabled = n <= 0; peek.style.opacity = n <= 0 ? 0.4 : 1; };
  peek.addEventListener('click', () => {
    if (showing || glances <= 0) return;
    showing = true;
    key.classList.remove('hidden');
    msg.textContent = warnings[GLANCES - glances] || '';
    setGlances(glances - 1);
    g.sound.countVoice();
    setTimeout(() => { key.classList.add('hidden'); showing = false; if (glances <= 0) msg.textContent = 'He is watching too closely now. I must write from memory.'; }, 1800);
  });
  root.querySelector('[data-send]').addEventListener('click', () => {
    if (filled.some((f) => !f)) { msg.textContent = 'The letter is not finished.'; g.sound.click(); return; }
    if (filled.every((f, i) => f === TARGET[i])) {
      g.clearOverlay();
      g.mode = 'play';
      g.renderInventory();
      onSolved();
    } else {
      msg.textContent = 'No — Mina could never read that. I scratched it out and began again, and he turned away for a moment.';
      g.sound.scrape(); g.sound.growl(0, 0.8);
      filled.fill(null); active = 0; render();
      setGlances(Math.max(glances, 2));
    }
  });
}

// ---------------------------------------------------------------- rooms
function chamber(ctx, t, g) {
  A.stoneWall(ctx, 0, 0, 360, 440, { seed: 41, base: '#272030' });
  A.archWindow(ctx, 242, 96, 92, 158, t, { moonX: 0.4 });
  A.door(ctx, 16, 250, 72, 190, { seed: 13 });
  A.floor(ctx, 440, '#181016');
  // desk
  ctx.fillStyle = '#2a180e'; ctx.fillRect(104, 420, 160, 12);
  ctx.fillRect(110, 432, 10, 60); ctx.fillRect(248, 432, 10, 60);
  ctx.fillStyle = '#e4d6b4'; ctx.fillRect(150, 408, 38, 12);
  ctx.fillStyle = '#111'; ctx.fillRect(196, 406, 8, 12);
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(200, 406); ctx.lineTo(210, 392); ctx.stroke();
  if (!g.has('notebook')) { ctx.fillStyle = '#4a1e16'; ctx.fillRect(120, 410, 22, 10); ctx.fillStyle = '#c9a77a'; ctx.fillRect(120, 410, 22, 2); }
  if (!g.has('lamp')) {
    ctx.fillStyle = '#b9bcc6'; ctx.beginPath(); ctx.moveTo(222, 420); ctx.lineTo(250, 420); ctx.lineTo(246, 412); ctx.lineTo(226, 412); ctx.fill();
    A.glow(ctx, 238, 400, 80, '255,170,80', 0.35);
    ctx.fillStyle = 'rgba(255,190,90,.95)'; ctx.beginPath(); ctx.ellipse(238, 404, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
  } else A.candle(ctx, 230, 420, t, 0.8);
  if (!g.flag('countGone')) A.count(ctx, 292, 600, 1.85, { t, eyes: 0.6, shadow: { dx: -70, s: 1.6, a: 0.7, skew: 0.2 } });
}

function wallView(ctx, t, g, crawlP = -1) {
  A.sky(ctx, t, { moon: { x: 280, y: 90, r: 24 }, clouds: true, h: 640 });
  // far valley
  A.ridge(ctx, 51, 560, 40, '#100a18');
  A.forest(ctx, 9, 590, '#06040a', { n: 50, hmin: 8, hmax: 18, spread: 30 });
  A.fog(ctx, t, { y: 560, h: 120, alpha: 0.5, seed: 3 });
  // the castle wall dropping away beneath the window, in perspective
  const wall = new Path2D();
  wall.moveTo(0, 640); wall.lineTo(0, 0); wall.lineTo(250, 0); wall.lineTo(150, 640); wall.closePath();
  ctx.save(); ctx.translate(1.5, 0); ctx.fillStyle = 'rgba(190,180,240,.5)'; ctx.fill(wall); ctx.restore();
  ctx.save();
  ctx.clip(wall);
  A.layer(ctx, 'crawlwall', 0, 0, 250, 640, (c) => {
    // courses of stone that shrink with distance
    let y = 0, rh = 30, row = 0;
    const r = A.rng(77);
    while (y < 640) {
      const right = 250 - (y / 640) * 100;
      let x = -(row % 2) * 20;
      while (x < right) {
        const bw = (40 + r() * 20) * (rh / 30);
        const l = (r() - 0.5) * 0.3;
        const col = A.shade('#3a3246', l);
        const gr = c.createLinearGradient(0, y, 0, y + rh);
        gr.addColorStop(0, A.shade(col, 0.12)); gr.addColorStop(1, A.shade(col, -0.3));
        c.fillStyle = gr; c.fillRect(x + 1, y + 1, bw - 2, rh - 2);
        c.fillStyle = 'rgba(255,250,240,.06)'; c.fillRect(x + 1, y + 1, bw - 2, 1);
        x += bw;
      }
      y += rh; rh = Math.max(4, rh * 0.93); row++;
    }
    A.texture(c, 0, 0, 250, 640, 0.45, 'overlay', 1);
    const dg = c.createLinearGradient(0, 0, 0, 640);
    dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(10,5,20,.75)');
    c.fillStyle = dg; c.fillRect(0, 0, 250, 640);
    const mg = c.createLinearGradient(0, 0, 250, 0);
    mg.addColorStop(0, 'rgba(0,0,0,.45)'); mg.addColorStop(1, 'rgba(170,160,230,.12)');
    c.fillStyle = mg; c.fillRect(0, 0, 250, 640);
  });
  ctx.restore();
  // window frame we are looking out of
  const fr = ctx.createLinearGradient(0, 0, 0, 40);
  fr.addColorStop(0, '#0c080e'); fr.addColorStop(1, '#2a2230');
  ctx.fillStyle = fr; ctx.fillRect(0, 0, 360, 40);
  ctx.fillStyle = '#16101a'; ctx.fillRect(0, 0, 24, 640); ctx.fillRect(336, 0, 24, 640);
  ctx.fillStyle = 'rgba(200,190,230,.15)'; ctx.fillRect(22, 40, 2, 600); ctx.fillRect(336, 40, 2, 600);
  if (crawlP >= 0) crawler(ctx, t, crawlP);
}

// The Count, seen from above, crawling face down with his cloak spread like great wings.
function crawler(ctx, t, p) {
  const y = 60 + p * 400, x = 175 - p * 70, s = 1.9 - p * 1.1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const k = Math.sin(t * 5);
  // limbs reaching for the corners of the stones
  ctx.strokeStyle = '#08060c'; ctx.lineCap = 'round'; ctx.lineWidth = 5;
  const limbs = [[-26, -34 - k * 5], [26, -34 + k * 5], [-22, 34 + k * 5], [22, 34 - k * 5]];
  for (const [lx, ly] of limbs) { ctx.beginPath(); ctx.moveTo(lx * 0.3, ly * 0.4); ctx.quadraticCurveTo(lx * 0.9, ly * 0.5, lx, ly); ctx.stroke(); }
  // cloak
  const flap = Math.sin(t * 2) * 5;
  const cloak = new Path2D();
  cloak.moveTo(0, 30);
  cloak.bezierCurveTo(-30, 26, -62 - flap, 6, -54, -36);
  cloak.quadraticCurveTo(-46, -26, -40, -40); cloak.quadraticCurveTo(-30, -28, -22, -44); cloak.quadraticCurveTo(-12, -32, 0, -48);
  cloak.quadraticCurveTo(12, -32, 22, -44); cloak.quadraticCurveTo(30, -28, 40, -40); cloak.quadraticCurveTo(46, -26, 54, -36);
  cloak.bezierCurveTo(62 + flap, 6, 30, 26, 0, 30); cloak.closePath();
  const cg = ctx.createRadialGradient(-10, -10, 4, 0, 0, 60);
  cg.addColorStop(0, '#2a2234'); cg.addColorStop(1, '#040207');
  A.rimFill(ctx, cloak, cg, 'rgba(190,180,240,.5)', 1.2, -1.2);
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.4;
  for (const fx of [-34, -18, 18, 34]) { ctx.beginPath(); ctx.moveTo(fx * 0.2, 20); ctx.quadraticCurveTo(fx * 0.8, 0, fx, -36); ctx.stroke(); }
  // pale hands and feet gripping the stone
  ctx.fillStyle = '#d8cfc2';
  for (const [lx, ly] of limbs) {
    ctx.beginPath(); ctx.ellipse(lx, ly, 3.4, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8cfc2'; ctx.lineWidth = 1;
    for (const f of [-2, 0, 2]) { ctx.beginPath(); ctx.moveTo(lx + f, ly + Math.sign(ly) * 3); ctx.lineTo(lx + f * 1.5, ly + Math.sign(ly) * 8); ctx.stroke(); }
  }
  // the white-haired head, going first
  const hg = ctx.createRadialGradient(-2, 36, 1, 0, 38, 10);
  hg.addColorStop(0, '#fbf8f2'); hg.addColorStop(1, '#a8a098');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, 38, 8, 9.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(120,110,105,.6)'; ctx.lineWidth = 0.5;
  for (let i = -6; i <= 6; i += 2) { ctx.beginPath(); ctx.moveTo(i * 0.4, 30); ctx.quadraticCurveTo(i, 38, i * 0.8, 46); ctx.stroke(); }
  ctx.restore();
}

// A long stone passage in one-point perspective.
function corridor(ctx, t, g) {
  ctx.fillStyle = '#030205'; ctx.fillRect(0, 0, 360, 640);
  if (!g.has('lamp')) {
    A.eyesInDark(ctx, 180, 300, t, 0.6, '200,40,60');
    return;
  }
  A.layer(ctx, 'corridor', 0, 0, 360, 640, (c) => {
    c.fillStyle = '#030205'; c.fillRect(0, 0, 360, 640);
    const f = (z) => (1 - 1 / z) * (4 / 3);           // 0 at the viewer, 1 at the far wall
    const lerp = (a, b, k) => a + (b - a) * k;
    const r = A.rng(31);
    const quad = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.closePath(); c.fill(); };
    // side walls of stone
    for (const side of [-1, 1]) {
      const X = (k) => (side < 0 ? 150 * k : 360 - 150 * k);
      const Y = (k, v) => lerp(250 * k, 640 - 290 * k, v);
      const rows = 16;
      for (let row = 0; row < rows; row++) {
        const v0 = row / rows, v1 = (row + 1) / rows;
        for (let z = 1 + (row % 2) * 0.12; z < 4; z += 0.24) {
          const k0 = f(z), k1 = f(Math.min(4, z + 0.24));
          const col = A.shade('#3a3246', (r() - 0.5) * 0.3 - k0 * 0.2);
          quad([[X(k0), Y(k0, v0) + 0.6], [X(k1), Y(k1, v0) + 0.6], [X(k1), Y(k1, v1) - 0.6], [X(k0), Y(k0, v1) - 0.6]], col);
        }
      }
    }
    // flagstone floor
    for (let z = 1; z < 4; z += 0.3) {
      const k0 = f(z), k1 = f(Math.min(4, z + 0.3));
      const y0 = 640 - 290 * k0, y1 = 640 - 290 * k1;
      for (let i = 0; i < 4; i++) {
        const a0 = lerp(150 * k0, 360 - 150 * k0, i / 4), a1 = lerp(150 * k0, 360 - 150 * k0, (i + 1) / 4);
        const b0 = lerp(150 * k1, 360 - 150 * k1, i / 4), b1 = lerp(150 * k1, 360 - 150 * k1, (i + 1) / 4);
        quad([[a0 + 0.8, y0 - 0.8], [a1 - 0.8, y0 - 0.8], [b1 - 0.5, y1 + 0.5], [b0 + 0.5, y1 + 0.5]], A.shade('#2a2228', (r() - 0.5) * 0.25));
      }
    }
    // ceiling beams
    for (let z = 1; z < 4; z += 0.4) {
      const k0 = f(z), k1 = f(z + 0.12);
      quad([[150 * k0, 250 * k0], [360 - 150 * k0, 250 * k0], [360 - 150 * k1, 250 * k1], [150 * k1, 250 * k1]], '#1a110a');
    }
    A.texture(c, 0, 0, 360, 640, 0.4, 'overlay', 1);
    // far wall and the door that gives
    A.stoneBlocks(c, 150, 250, 60, 100, { seed: 4, base: '#2a2432', rowH: 8 });
    const woodDoor = (pts, dark) => {
      const xs = pts.map((p) => p[0]);
      const g2 = c.createLinearGradient(Math.min(...xs), 0, Math.max(...xs), 0);
      g2.addColorStop(0, dark ? '#24140a' : '#4a2c16'); g2.addColorStop(1, dark ? '#4a2c16' : '#24140a');
      quad(pts, g2);
      c.strokeStyle = '#0a0604'; c.lineWidth = 2; c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.closePath(); c.stroke();
    };
    woodDoor([[160, 268], [200, 268], [200, 350], [160, 350]]);
    c.fillStyle = '#16100e'; c.fillRect(160, 288, 40, 3); c.fillRect(160, 330, 40, 3);
    // side doors
    woodDoor([[30, 130], [82, 190], [82, 450], [30, 520]], true);
    woodDoor([[108, 222], [132, 246], [132, 375], [108, 400]], true);
    woodDoor([[330, 130], [278, 190], [278, 450], [330, 520]]);
    woodDoor([[252, 222], [228, 246], [228, 375], [252, 400]]);
    for (const [x1, y1, x2, y2] of [[30, 230, 82, 262], [30, 420, 82, 400], [330, 230, 278, 262], [330, 420, 278, 400]]) {
      c.strokeStyle = '#141012'; c.lineWidth = 4; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }
  });
  // lamplight from the lamp in Jonathan's hand
  const flick = 1 + Math.sin(t * 9) * 0.03 + Math.sin(t * 13) * 0.02;
  A.glow(ctx, 180, 600, 260 * flick, '255,160,70', 0.22, true);
  const gr = ctx.createRadialGradient(180, 560, 60, 180, 420, 430);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,.92)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 360, 640);
}

function lettersWritten(g) {
  g.set('written');
  g.sound.chime();
  g.say([
    { text: 'I wrote a formal note to Mr. Hawkins, and to Mina in shorthand. The Count took both letters and put them with his own. He cannot read a word of Mina’s.' },
    C('“Let me advise you, my dear young friend… that should you leave these rooms you will not by any chance go to sleep in any other part of the castle. It is old, and has many memories, and there are bad dreams for those who sleep unwisely. Be warned!”'),
    { text: 'Then he left me. Later, from my window, I saw something move.' },
  ], () => { g.set('countGone'); g.sound.door(); });
}

// The five doors of the passage. One of them (chosen anew each game) is only stuck.
const DOORS = [
  { id: 'd1', x: 30, y: 150, w: 54, h: 340, gx: 56, gy: 320 },
  { id: 'd2', x: 104, y: 222, w: 30, h: 170, gx: 120, gy: 310 },
  { id: 'd3', x: 276, y: 150, w: 54, h: 340, gx: 304, gy: 320 },
  { id: 'd4', x: 226, y: 222, w: 30, h: 170, gx: 240, gy: 310 },
  { id: 'end', x: 154, y: 262, w: 52, h: 92, gx: 180, gy: 310 },
];

function forceDoor(g) {
  if (!g.flag('crawled')) { g.say('I dared not force it while the Count was in the castle. I heard his step somewhere below.'); return; }
  const n = (g.flag('shoves') || 0) + 1;
  g.set('shoves', n);
  g.sound.creak(); g.shake = 0.5;
  if (n === 1) { g.say('I set my shoulder to the door. It gave a little under pressure, and the sound of it echoed through the castle.'); return; }
  if (n === 2) { g.sound.whisper(0.6, 0.3); g.say('Again. The hinges had fallen somewhat, and the heavy door rested on the floor. Somewhere behind me, something whispered.'); return; }
  g.sound.door();
  g.say([
    { text: 'With many efforts I forced it back so that I could enter.' },
    { text: 'I was now in a wing of the castle further to the right than the rooms I knew.' },
  ], () => g.completeScene());
}

const LOCKED = [
  'Locked, and the lock comparatively new.',
  'Locked and bolted.',
  'Locked. Doors, doors, doors everywhere…',
  'This one is locked too. The castle is a veritable prison.',
  'Locked. The keyhole is black with age.',
];

export default {
  id: 'prisoner',
  title: 'IV · A Prisoner',
  chapter: 'Chapter III',
  ambience: 'interior',
  intro: {
    date: '12 May.',
    text: 'Let me begin with facts—bare, meagre facts, verified by books and figures, and of which there can be no doubt.\n\nThe Count asked if I had written since my first letter to our friend Mr. Peter Hawkins, or to any other.',
  },
  outro: {
    date: 'Later: the Morning of 16 May.',
    text: 'I determined not to return to-night to the gloom-haunted rooms, but to sleep here, where, of old, ladies had sat and sung and lived sweet lives…\n\nThe Count’s warning came into my mind, but I took pleasure in disobeying it.',
  },
  start: 'chamber',
  keep: ['crucifix'],
  setup(g) { g.set('draftDoor', Math.floor(Math.random() * DOORS.length)); },

  onEnter(g) {
    g.say([
      C('“Then write now, my young friend,” he said, laying a heavy hand on my shoulder: “write to our friend and to any other; and say, if it will please you, that you shall stay with me until a month from now.”'),
      { text: 'My heart grew cold. He will read every word I write… unless I write to Mina in shorthand.' },
    ]);
  },

  hint(g) {
    if (!g.has('notebook')) return 'My shorthand notebook is on the desk.';
    if (!g.flag('written')) return 'Use the notebook at the desk. You may glance at the key only three times, so memorise the four strokes you need — and beware the strokes that look almost the same, only turned about.';
    if (!g.flag('crawled')) return 'The Count has left me. Where has he gone? Look out of the window.';
    if (!g.has('lamp')) return 'The corridor is pitch dark. I need the lamp from my desk.';
    if (!g.flag('draftFound')) return 'Every door seems locked. But a door that is only stuck would let a draught through. Select the lamp and hold it to each door, and watch the flame.';
    return 'That door is only stuck. Keep putting your shoulder to it.';
  },

  rooms: {
    chamber: {
      haunts: ['scratch', 'wolves', 'whisper', 'gutter'],
      eyes: [[60, 210]],
      draw(ctx, t, g) { chamber(ctx, t, g); },
      hotspots: [
        {
          id: 'count', x: 260, y: 360, w: 80, h: 200, gx: 300, gy: 400,
          show: (g) => !g.flag('countGone'),
          tap(g) { g.say(C('“Come, my friend. Write your letters. I shall see that they are posted.”')); },
          use: { crucifix: (g) => g.say('I dared not show it to him openly. Not yet.') },
        },
        {
          id: 'notebook', x: 114, y: 398, w: 34, h: 26, gx: 131, gy: 414,
          show: (g) => !g.has('notebook'),
          tap(g) { g.give('notebook'); g.say('My notebook. Mina and I learned the same shorthand.'); },
        },
        {
          id: 'desk', x: 146, y: 390, w: 66, h: 36, gx: 175, gy: 410,
          tap(g) {
            if (g.flag('written')) { g.say('My letters are written and gone. God grant Mina reads hers.'); return; }
            if (!g.has('notebook')) { g.say('Paper, ink and pen. Anything I write in plain English, the Count will read.'); return; }
            shorthandPuzzle(g, () => lettersWritten(g));
          },
          use: { notebook(g) { if (!g.flag('written')) shorthandPuzzle(g, () => lettersWritten(g)); else g.say('The letters are already written.'); } },
        },
        {
          id: 'lamp', x: 216, y: 390, w: 40, h: 36, gx: 238, gy: 405,
          show: (g) => !g.has('lamp'),
          tap(g) {
            if (!g.flag('countGone')) { g.say('The lamp lights my desk. I will need it to write.'); return; }
            g.give('lamp'); g.say('I took the lamp. Its flame burns without chimney or globe.');
          },
        },
        {
          id: 'window', x: 242, y: 96, w: 92, h: 158,
          tap(g) {
            if (!g.flag('countGone')) { g.say('The Count watches me. I dare not go to the window now.'); return; }
            g.goRoom('wall');
          },
        },
        {
          id: 'door', x: 16, y: 250, w: 72, h: 190, gx: 52, gy: 340,
          tap(g) {
            if (!g.flag('countGone')) { g.say('Not while he stands there watching me.'); return; }
            g.sound.door(); g.goRoom('corridor');
          },
        },
      ],
    },

    wall: {
      draw(ctx, t, g) { wallView(ctx, t, g); },
      vignette: 1,
      onEnter(g) {
        if (g.flag('crawled')) return;
        g.say('What I saw was the Count’s head coming out from the window below my own.', () => {
          g.cutscene(5, (ctx, t, p) => wallView(ctx, t, g, p), () => {
            g.set('crawled');
            g.say([
              { text: 'I saw the whole man slowly emerge from the window and begin to crawl down the castle wall over that dreadful abyss, face down with his cloak spreading out around him like great wings.' },
              { text: 'I saw the fingers and toes grasp the corners of the stones… and move downwards with considerable speed, just as a lizard moves along a wall.' },
              { text: 'What manner of man is this, or what manner of creature is it in the semblance of man? He has left the castle. Now is my chance to explore.' },
            ]);
          });
        });
      },
      hotspots: [
        {
          id: 'back', x: 270, y: 470, w: 70, h: 80, gx: 305, gy: 510,
          tap(g) { g.goRoom('chamber'); },
        },
      ],
    },

    corridor: {
      draw(ctx, t, g) { corridor(ctx, t, g); },
      haunts: ['slam', 'eyes', 'gutter', 'whisper'],
      eyes: [[180, 300], [118, 330], [242, 330]],
      vignette: 0.6,
      onEnter(g) {
        if (!g.has('lamp')) g.say('It is pitch dark. Something glints at the far end of the passage… I need a light.');
        else if (!g.flag('corrSeen')) { g.set('corrSeen'); g.say('The lamp throws long quivering shadows down the passage. Doors on every side.'); }
      },
      hotspots: [
        ...DOORS.map((d, i) => ({
          ...d,
          show: (g) => g.has('lamp'),
          tap(g) {
            if (g.flag('draftDoor') !== i || !g.flag('draftFound')) { g.sound.thud(); g.say(LOCKED[i]); return; }
            forceDoor(g);
          },
          use: {
            lamp(g) {
              if (g.flag('draftDoor') === i) {
                g.set('draftFound'); g.sound.sputter();
                g.say('I held the lamp to the crack of the door. The flame bowed toward it, and guttered — a draught! This door is not locked, only stuck fast.');
              } else g.say('I held the lamp close to the door. The flame stood perfectly still.');
            },
          },
        })),
        {
          id: 'back', x: 140, y: 470, w: 80, h: 80, gx: 180, gy: 520,
          tap(g) { g.goRoom('chamber'); },
        },
      ],
    },
  },
};
