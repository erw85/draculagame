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
};
const PALETTE_ORDER = ['DANGER', 'MINA', 'HOME', 'COUNT', 'LOVE', 'PRISONER', 'HELP', 'CASTLE'];
const TARGET = ['PRISONER', 'COUNT', 'DANGER'];
const sym = (w) => `<svg viewBox="0 0 40 40"><path d="${SYMBOLS[w]}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function shorthandPuzzle(g, onSolved) {
  g.mode = 'puzzle';
  const filled = [null, null, null];
  let active = 0;
  const root = g.overlay(`<div class="ov shorthand">
    <div class="paper">
      <div class="task">The Count watches as I write. To Mr. Hawkins, a formal note. But to Mina, the truth — in our shorthand, which he cannot read:<br><i>I am a <b>prisoner</b>. The <b>Count</b> is a <b>danger</b>.</i></div>
      <div class="slots">${TARGET.map((w, i) => `<div class="wslot" data-i="${i}"><span class="s"></span><span class="lbl">${w}</span></div>`).join('')}</div>
      <div class="palette">${PALETTE_ORDER.map((w) => `<button class="sym" data-w="${w}" aria-label="shorthand stroke">${sym(w)}</button>`).join('')}</div>
      <div class="msg"></div>
      <div class="row">
        <button class="btn ghost" data-peek>Hold: glance at notebook</button>
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
  const peek = root.querySelector('[data-peek]');
  let peeks = 0;
  const show = (e) => { e.preventDefault(); key.classList.remove('hidden'); peeks++; if (peeks === 6) msg.textContent = '“You consult your little book a great deal, my friend.”'; };
  const hide = () => key.classList.add('hidden');
  peek.addEventListener('pointerdown', (e) => {
    show(e);
    const off = () => { hide(); window.removeEventListener('pointerup', off); window.removeEventListener('pointercancel', off); };
    window.addEventListener('pointerup', off);
    window.addEventListener('pointercancel', off);
  });
  root.querySelector('[data-send]').addEventListener('click', () => {
    if (filled.some((f) => !f)) { msg.textContent = 'The letter is not finished.'; g.sound.click(); return; }
    if (filled.every((f, i) => f === TARGET[i])) {
      g.clearOverlay();
      g.mode = 'play';
      g.renderInventory();
      onSolved();
    } else {
      msg.textContent = 'No — Mina could never read that. I scratched it out and began again.';
      g.sound.scrape();
      filled.fill(null); active = 0; render();
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
  if (!g.flag('countGone')) A.count(ctx, 300, 560, 1.45, { t, eyes: 0.5 });
}

function wallView(ctx, t, g, crawlP = -1) {
  A.sky(ctx, t, { moon: { x: 280, y: 90, r: 24 }, clouds: true, h: 640 });
  // far valley
  A.ridge(ctx, 51, 560, 40, '#100a18');
  A.forest(ctx, 9, 590, '#06040a', { n: 50, hmin: 8, hmax: 18, spread: 30 });
  A.fog(ctx, t, { y: 560, h: 120, alpha: 0.5, seed: 3 });
  // the castle wall dropping away beneath the window, in perspective
  ctx.fillStyle = '#2a2232';
  ctx.beginPath(); ctx.moveTo(0, 640); ctx.lineTo(0, 0); ctx.lineTo(250, 0); ctx.lineTo(150, 640); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const y = Math.pow(i / 26, 1.4) * 640;
    const right = 250 - (y / 640) * 100;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(right, y); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(190,190,255,.07)';
  ctx.beginPath(); ctx.moveTo(180, 0); ctx.lineTo(250, 0); ctx.lineTo(150, 640); ctx.lineTo(120, 640); ctx.fill();
  // window frame we are looking out of
  ctx.fillStyle = '#0c080e';
  ctx.fillRect(0, 0, 360, 40); ctx.fillRect(0, 0, 24, 640); ctx.fillRect(336, 0, 24, 640);
  if (crawlP >= 0) {
    // The Count emerging and crawling face down, cloak spread like great wings.
    const y = 50 + crawlP * 400, x = 175 - crawlP * 70, s = 1.9 - crawlP * 1.1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const flap = Math.sin(t * 2) * 6;
    ctx.fillStyle = '#050208';
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.quadraticCurveTo(-60 - flap, 0, -50, -40); ctx.quadraticCurveTo(-20, -20, 0, -46); ctx.quadraticCurveTo(20, -20, 50, -40); ctx.quadraticCurveTo(60 + flap, 0, 0, 30); ctx.fill();
    ctx.fillStyle = '#eeeae2'; ctx.beginPath(); ctx.ellipse(0, 38, 8, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d6cfc4';
    const k = Math.sin(t * 5);
    for (const [hx, hy] of [[-22, 30 + k * 6], [22, 30 - k * 6], [-16, -40 - k * 4], [16, -40 + k * 4]]) { ctx.beginPath(); ctx.ellipse(hx, hy, 4, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}

function corridor(ctx, t, g) {
  ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, 360, 640);
  if (!g.has('lamp')) {
    A.eyesInDark(ctx, 180, 300, t, 0.6, '200,40,60');
    return;
  }
  const vx = 180, vy = 300;
  // walls and floor
  ctx.fillStyle = '#1e1824';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(150, 250); ctx.lineTo(150, 350); ctx.lineTo(0, 640); ctx.fill();
  ctx.beginPath(); ctx.moveTo(360, 0); ctx.lineTo(210, 250); ctx.lineTo(210, 350); ctx.lineTo(360, 640); ctx.fill();
  ctx.fillStyle = '#140f16';
  ctx.beginPath(); ctx.moveTo(0, 640); ctx.lineTo(150, 350); ctx.lineTo(210, 350); ctx.lineTo(360, 640); ctx.fill();
  ctx.fillStyle = '#0e0a10';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(150, 250); ctx.lineTo(210, 250); ctx.lineTo(360, 0); ctx.fill();
  ctx.fillStyle = '#2a2230'; ctx.fillRect(150, 250, 60, 100);
  // end door (the one that gives)
  ctx.fillStyle = '#3a2416'; ctx.fillRect(160, 268, 40, 82);
  ctx.fillStyle = '#16100e'; ctx.fillRect(160, 290, 40, 3); ctx.fillRect(160, 330, 40, 3);
  // side doors drawn as skewed quads
  const sideDoor = (x1, x2, top1, top2, bot1, bot2) => {
    ctx.fillStyle = '#34200f';
    ctx.beginPath(); ctx.moveTo(x1, top1); ctx.lineTo(x2, top2); ctx.lineTo(x2, bot2); ctx.lineTo(x1, bot1); ctx.fill();
    ctx.strokeStyle = '#120a06'; ctx.lineWidth = 2; ctx.stroke();
  };
  sideDoor(30, 82, 130, 190, 520, 450);
  sideDoor(108, 132, 222, 246, 400, 375);
  sideDoor(330, 278, 130, 190, 520, 450);
  sideDoor(252, 228, 222, 246, 400, 375);
  // lamplight
  const gr = ctx.createRadialGradient(vx, 560, 40, vx, 420, 420);
  gr.addColorStop(0, 'rgba(255,170,80,.18)'); gr.addColorStop(0.5, 'rgba(0,0,0,.2)'); gr.addColorStop(1, 'rgba(0,0,0,.9)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 360, 640);
  void vy;
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

const LOCKED = [
  'Locked, and the lock comparatively new.',
  'Locked and bolted.',
  'Locked. Doors, doors, doors everywhere…',
  'This one is locked too. The castle is a veritable prison.',
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

  onEnter(g) {
    g.say([
      C('“Then write now, my young friend,” he said, laying a heavy hand on my shoulder: “write to our friend and to any other; and say, if it will please you, that you shall stay with me until a month from now.”'),
      { text: 'My heart grew cold. He will read every word I write… unless I write to Mina in shorthand.' },
    ]);
  },

  hint(g) {
    if (!g.has('notebook')) return 'My shorthand notebook is on the desk.';
    if (!g.flag('written')) return 'Use the notebook at the desk. Hold the button to glance at my key — the Count is watching, so memorise the strokes.';
    if (!g.flag('crawled')) return 'The Count has left me. Where has he gone? Look out of the window.';
    if (!g.has('lamp')) return 'The corridor is pitch dark. I need the lamp from my desk.';
    return 'Try every door in the corridor — the one at the far end seemed different.';
  },

  rooms: {
    chamber: {
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
      vignette: 0.6,
      onEnter(g) {
        if (!g.has('lamp')) g.say('It is pitch dark. Something glints at the far end of the passage… I need a light.');
        else if (!g.flag('corrSeen')) { g.set('corrSeen'); g.say('The lamp throws long quivering shadows down the passage. Doors on every side.'); }
      },
      hotspots: [
        { id: 'd1', x: 30, y: 150, w: 54, h: 340, gx: 56, gy: 320, show: (g) => g.has('lamp'), tap(g) { g.sound.thud(); g.say(LOCKED[0]); } },
        { id: 'd2', x: 104, y: 222, w: 30, h: 170, gx: 120, gy: 310, show: (g) => g.has('lamp'), tap(g) { g.sound.thud(); g.say(LOCKED[1]); } },
        { id: 'd3', x: 276, y: 150, w: 54, h: 340, gx: 304, gy: 320, show: (g) => g.has('lamp'), tap(g) { g.sound.thud(); g.say(LOCKED[2]); } },
        { id: 'd4', x: 226, y: 222, w: 30, h: 170, gx: 240, gy: 310, show: (g) => g.has('lamp'), tap(g) { g.sound.thud(); g.say(LOCKED[3]); } },
        {
          id: 'end', x: 154, y: 262, w: 52, h: 92, gx: 180, gy: 310,
          show: (g) => g.has('lamp'),
          tap(g) {
            if (!g.flag('crawled')) { g.say('This door gave a little under pressure… but I heard a step somewhere below. Not while the Count is in the castle.'); return; }
            g.sound.door();
            g.say([
              { text: 'I found one door at the top of the stairway which, though it seemed to be locked, gave a little under pressure. I tried it harder, and found that it was not really locked, but that the hinges had fallen somewhat.' },
              { text: 'With many efforts I forced it back so that I could enter. I was now in a wing of the castle further to the right than the rooms I knew.' },
            ], () => g.completeScene());
          },
        },
        {
          id: 'back', x: 140, y: 470, w: 80, h: 80, gx: 180, gy: 520,
          tap(g) { g.goRoom('chamber'); },
        },
      ],
    },
  },
};
