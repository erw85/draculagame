import * as A from '../art/draw.js';

const C = (text) => ({ who: 'The Count', text });
const MIRROR = { x: 262, y: 212, rx: 16, ry: 22 };

function smallMirror(ctx, t) {
  ctx.strokeStyle = '#4a3a20'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MIRROR.x, MIRROR.y - 40); ctx.lineTo(MIRROR.x, MIRROR.y - MIRROR.ry); ctx.stroke();
  ctx.fillStyle = '#8a6a2a';
  ctx.beginPath(); ctx.ellipse(MIRROR.x, MIRROR.y, MIRROR.rx + 3, MIRROR.ry + 3, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(MIRROR.x - 10, MIRROR.y - 20, MIRROR.x + 10, MIRROR.y + 20);
  g.addColorStop(0, '#8d8aa6'); g.addColorStop(0.5, '#3b3650'); g.addColorStop(1, '#6b6884');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(MIRROR.x, MIRROR.y, MIRROR.rx, MIRROR.ry, 0, 0, Math.PI * 2); ctx.fill();
}

function bedroom(ctx, t, g) {
  A.stoneWall(ctx, 0, 0, 360, 452, { seed: 12, base: '#2b2231' });
  A.archWindow(ctx, 135, 92, 96, 164, t, { moonX: 0.6 });
  if (!g || !g.flag('mirrorGone')) smallMirror(ctx, t);
  A.door(ctx, 290, 268, 62, 184, { seed: 21 });
  A.fireplace(ctx, 14, 330, 108, 122, t);
  A.floor(ctx, 452, '#1b1218');
  // rug
  ctx.fillStyle = '#3e0d14'; ctx.beginPath(); ctx.ellipse(190, 560, 150, 40, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(200,150,60,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(190, 560, 138, 34, 0, 0, Math.PI * 2); ctx.stroke();
  A.table(ctx, 128, 466, 140, { cloth: '#d8d0c0' });
  ctx.fillStyle = '#c9c9d3'; ctx.beginPath(); ctx.ellipse(178, 460, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a3a12'; ctx.beginPath(); ctx.ellipse(178, 457, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a0a1a'; ctx.fillRect(222, 438, 9, 22); ctx.fillRect(224, 432, 5, 7);
  A.candle(ctx, 150, 462, t, 0.9);
  A.candle(ctx, 252, 462, t, 0.9);
}

// ---------------------------------------------------------------- the Count's map quiz
const COAST = '5.0,251.9 17.5,256.1 32.5,241.7 45.0,239.6 60.0,245.9 62.5,228.1 73.8,224.7 86.2,230.2 98.8,224.7 115.0,221.8 127.5,222.6 145.0,220.1 153.8,223.0 167.5,215.0 172.5,212.0 182.0,205.6 183.2,195.9 170.0,194.2 161.2,192.9 153.8,192.1 160.0,190.0 167.5,188.7 172.5,180.2 178.8,176.0 187.5,166.2 191.2,149.2 189.5,137.8 180.0,130.2 170.0,128.5 157.5,134.8 152.5,131.4 156.2,120.8 151.3,108.1 150.8,101.8 143.8,96.7 142.5,84.8 145.5,79.7 137.5,72.1 132.5,64.0 123.8,60.6 118.8,57.7 115.0,50.9 112.0,41.6 107.5,25.4 101.3,14.8 97.5,8.5 87.5,0.0 22.5,0.0 7.5,10.6 5.0,29.7 15.0,17.0 27.5,17.0 31.2,25.4 23.8,40.3 18.8,48.8 25.0,57.2 37.5,50.9 57.5,44.5 65.0,46.6 58.8,59.4 62.5,72.1 68.8,80.6 76.2,78.4 72.5,91.2 71.3,108.1 67.5,112.4 57.5,114.5 45.0,116.6 32.5,110.2 36.3,120.8 28.8,135.7 45.0,137.8 46.3,154.8 35.0,163.2 23.8,167.5 15.0,174.7 21.3,184.4 30.0,184.4 41.3,188.7 50.0,185.7 66.3,194.2 73.8,187.4 82.5,186.6 75.0,195.9 71.3,203.5 60.0,203.5 42.5,204.4 34.2,212.0 28.8,222.6 22.5,231.1 15.0,241.7';
const THAMES = '116.0,180.2 122.5,190.0 132.5,191.6 140.0,192.9 144.5,190.8 150.0,191.2 153.8,192.1 160.0,190.8';
const RINGS = [{ id: 'purfleet', x: 154, y: 191.6 }, { id: 'exeter', x: 59.3, y: 223.9 }, { id: 'whitby', x: 132.2, y: 64 }];

function mapQuiz(g, onDone) {
  g.mode = 'puzzle';
  let wrong = g.flag('quizWrong') || 0;
  const root = g.overlay(`<div class="ov shorthand mapquiz">
    <div class="paper">
      <div class="task">The Count laid his long finger beside the atlas. <i>“Show me where stands the house you have bought for me.”</i><br>Three places on his map are ringed in red ink. Tap the right one.</div>
      <svg viewBox="0 0 200 262" class="map">
        <rect x="0" y="0" width="200" height="262" fill="#d9c7a0"/>
        <polygon points="${COAST}" fill="#ead9b0" stroke="#6b4a2a" stroke-width="0.8"/>
        <polyline points="${THAMES}" fill="none" stroke="#5a7a9a" stroke-width="1.2"/>
        <text x="122" y="203" font-size="6" fill="#4a3018" font-style="italic">R. Thames</text>
        <circle cx="144.5" cy="190.4" r="1.6" fill="#2b1a10"/>
        <text x="122" y="186" font-size="7" fill="#2b1a10">London</text>
        <g transform="translate(22,22)"><path d="M0 -12 L3 0 L0 -2 L-3 0 Z" fill="#2b1a10"/><text x="-2.5" y="-14" font-size="6" fill="#2b1a10">N</text></g>
        ${RINGS.map((r) => `<g data-ring="${r.id}" style="cursor:pointer"><circle cx="${r.x}" cy="${r.y}" r="12" fill="transparent"/><circle cx="${r.x}" cy="${r.y}" r="5" fill="none" stroke="#a3121f" stroke-width="1.4"/></g>`).join('')}
      </svg>
      <div class="msg"></div>
      <div class="row"><button class="btn ghost" data-deeds>Glance at the deeds</button></div>
    </div>
  </div>`);
  const msg = root.querySelector('.msg');
  root.querySelector('[data-deeds]').addEventListener('click', () => {
    g.sound.click();
    msg.innerHTML = '<span style="color:#3a2010">“At Purfleet, on a by-road…” — Purfleet lies on the north bank of the Thames, a little east of London.</span>';
  });
  root.querySelectorAll('[data-ring]').forEach((el) => el.addEventListener('click', () => {
    g.clearOverlay(); g.mode = 'play'; g.renderInventory();
    if (el.dataset.ring === 'purfleet') { onDone(); return; }
    wrong++; g.set('quizWrong', wrong);
    g.sound.stinger(); g.shake = 0.8;
    if (wrong >= 3) {
      g.die('His eyes blazed with a red light, and I understood, too late, that a solicitor who does not know his own business is of no use to him at all.');
      return;
    }
    g.say({ who: 'The Count', text: wrong === 1 ? '“No.” His eyes flashed red. “Look again, my friend. You have the papers. Read them.”' : '“Do not play with me.” The red light in his eyes burned steadily now. “Once more.”' },
      () => mapQuiz(g, onDone));
  }));
}

function library(ctx, t, g) {
  A.stoneWall(ctx, 0, 0, 360, 450, { seed: 31, base: '#251d2a' });
  A.bookshelf(ctx, 12, 70, 130, 330, 7);
  A.bookshelf(ctx, 218, 70, 130, 330, 8);
  A.floor(ctx, 450, '#1a1116');
  A.door(ctx, 152, 250, 56, 150, { seed: 5 });
  // sofa
  ctx.fillStyle = '#3a1218'; ctx.fillRect(220, 470, 120, 40); ctx.fillRect(214, 446, 132, 28); ctx.fillRect(208, 456, 16, 56); ctx.fillRect(336, 456, 16, 56);
  ctx.fillStyle = '#c9b48a'; ctx.save(); ctx.translate(280, 462); ctx.rotate(-0.15); ctx.fillRect(-14, -8, 28, 18); ctx.restore();
  // centre table with atlas
  A.table(ctx, 40, 500, 140, { cloth: '#2a1a12' });
  ctx.fillStyle = '#e1d4b0'; ctx.beginPath(); ctx.moveTo(70, 498); ctx.lineTo(108, 492); ctx.lineTo(146, 498); ctx.lineTo(146, 486); ctx.lineTo(108, 482); ctx.lineTo(70, 486); ctx.fill();
  ctx.strokeStyle = 'rgba(150,20,30,.8)'; ctx.lineWidth = 1;
  for (const [x, y] of [[122, 489], [95, 491], [130, 486]]) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.stroke(); }
  A.candle(ctx, 165, 496, t, 1);
  A.glow(ctx, 110, 480, 140, '255,160,70', 0.12);
  if (g && g.flag('countLib')) A.count(ctx, 290, 640, 2.15, { t, eyes: 0.9, shadow: { dx: -95, dy: 0, s: 1.55, a: 0.72, skew: 0.18 } });
}

function mirrorScene() {
  let phase = 'shave', el = 0, countA = 0, lunge = 0, cut = 0, gone = false, recoil = 0, broke = 0;
  const TIME = 2.4;
  const CRU = { x: 180, y: 512 };
  let shards = [];

  const success = (g) => {
    phase = 'recoil'; el = 0;
    g.sound.heartbeat(false);
    g.prompt(null);
    g.sound.chime();
    g.say([
      { text: 'His hand touched the string of beads which held the crucifix. It made an instant change in him, for the fury passed so quickly that I could hardly believe that it was ever there.' },
      { who: 'The Count', text: '“Take care,” he said, “take care how you cut yourself. It is more dangerous than you think in this country.”' },
      { who: 'The Count', text: '“And this is the wretched thing that has done the mischief. It is a foul bauble of man’s vanity. Away with it!”' },
    ], () => {
      gone = true;
      g.set('mirrorGone');
      g.sound.shatter();
      shards = Array.from({ length: 24 }, () => ({ x: 180 + (Math.random() - 0.5) * 120, y: 230 + (Math.random() - 0.5) * 160, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 120, r: Math.random() * 6 }));
      broke = 0.001;
      g.say('He flung the glass from the window, and it shattered into a thousand pieces on the stones of the courtyard far below. Then he withdrew without a word.', () => { g.endChallenge(); g.completeScene(); });
    });
  };

  return {
    peek: () => ({ phase, crucifix: CRU }),
    start(g) {
      g.say([
        { text: 'I only slept a few hours, and feeling that I could not sleep any more, got up. I had hung my shaving glass by the window, and was just beginning to shave.' },
        { text: 'Suddenly I felt a hand on my shoulder, and heard the Count’s voice saying to me, “Good-morning.”' },
      ], () => { phase = 'appear'; el = 0; });
    },
    update(dt, g) {
      el += dt;
      for (const s of shards) { s.vy += 400 * dt; s.x += s.vx * dt; s.y += s.vy * dt; }
      if (broke) broke += dt;
      if (phase === 'appear') {
        countA = Math.min(1, countA + dt * 1.2);
        if (el > 1.3) {
          phase = 'wait';
          g.say([
            { text: 'I started, for it amazed me that I had not seen him, since the reflection of the glass covered the whole room behind me.' },
            { text: 'But there was no reflection of him in the mirror! The whole room behind me was displayed; but there was no sign of a man in it, except myself.' },
            { text: 'In starting I had cut myself slightly. The blood was trickling over my chin…' },
          ], () => {
            cut = 0.01;
            phase = 'qte'; el = 0;
            g.sound.heartbeat(true, 2.4);
            g.sound.sting();
            g.prompt('His eyes blaze — he grabs for your throat! TAP THE CRUCIFIX!');
          });
        }
      } else if (phase === 'qte') {
        lunge = Math.min(1, el / TIME);
        if (el >= TIME) g.die('The Count’s eyes blazed with a sort of demoniac fury, and his hand closed upon my throat before I could raise the crucifix.');
      } else if (phase === 'recoil') {
        recoil = Math.min(1, recoil + dt * 1.5);
      }
      if (cut > 0) cut = Math.min(1, cut + dt * 0.4);
    },
    down(x, y, g) {
      if (phase === 'qte' && Math.hypot(x - CRU.x, y - CRU.y) < 54) success(g);
    },
    item(id, g) {
      if (phase === 'qte' && id === 'crucifix') success(g);
    },
    draw(ctx, t) {
      // Morning light in Jonathan's room, close on the shaving glass.
      A.stoneWall(ctx, 0, 0, 360, 640, { seed: 12, base: '#2f2734', rowH: 30 });
      A.archWindow(ctx, 10, 60, 90, 300, t, { moonX: 0.5, moonY: 0.2 });
      A.glow(ctx, 60, 200, 200, '200,190,230', 0.12);
      const mx = 190, my = 250, rx = 68, ry = 92;
      if (!gone) {
        ctx.fillStyle = '#8a6a2a';
        ctx.beginPath(); ctx.ellipse(mx, my, rx + 8, ry + 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4a3410'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save();
        ctx.beginPath(); ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
        const g = ctx.createLinearGradient(0, my - ry, 0, my + ry);
        g.addColorStop(0, '#4a4258'); g.addColorStop(1, '#1d1824');
        ctx.fillStyle = g; ctx.fillRect(mx - rx, my - ry, rx * 2, ry * 2);
        // reflected room: a door and a window, and only Jonathan
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(mx + 20, my - 40, 30, 90);
        ctx.fillStyle = 'rgba(200,200,240,.25)'; ctx.fillRect(mx - 60, my - 70, 22, 40);
        // Jonathan's face
        const fx = mx - 4, fy = my + 22;
        ctx.fillStyle = '#1e1418'; ctx.beginPath(); ctx.ellipse(fx, fy + 70, 52, 30, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#d6bfa8'; ctx.beginPath(); ctx.ellipse(fx, fy, 26, 34, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.ellipse(fx, fy - 22, 28, 16, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#2a1a1a'; ctx.fillRect(fx - 12, fy - 6, 6, 3); ctx.fillRect(fx + 6, fy - 6, 6, 3);
        ctx.fillStyle = '#f2efe8';
        ctx.beginPath(); ctx.ellipse(fx - 13, fy + 14, 10, 10, 0, 0, Math.PI * 2); ctx.ellipse(fx + 13, fy + 14, 10, 10, 0, 0, Math.PI * 2); ctx.ellipse(fx, fy + 24, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
        if (cut > 0) {
          ctx.strokeStyle = '#b0101c'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(fx + 4, fy + 22); ctx.lineTo(fx + 10, fy + 26); ctx.stroke();
          ctx.fillStyle = '#b0101c'; ctx.fillRect(fx + 8, fy + 26, 2, 4 + cut * 14);
        }
        // sheen
        ctx.fillStyle = 'rgba(255,255,255,.07)';
        ctx.beginPath(); ctx.moveTo(mx - rx, my - 40); ctx.lineTo(mx - 20, my - ry); ctx.lineTo(mx, my - ry); ctx.lineTo(mx - rx, my); ctx.fill();
        ctx.restore();
        if (phase === 'wait' || phase === 'qte') {
          ctx.strokeStyle = `rgba(255,60,80,${0.4 + 0.3 * Math.sin(t * 6)})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(mx, my, rx + 12, ry + 12, 0, 0, Math.PI * 2); ctx.stroke();
        }
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(mx, my - ry - 30); ctx.lineTo(mx, my - ry); ctx.stroke();
      }
      for (const s of shards) { ctx.fillStyle = 'rgba(200,200,230,.8)'; ctx.fillRect(s.x, s.y, s.r, s.r * 0.6); }
      // The Count, behind Jonathan — but not in the glass.
      if (countA > 0) {
        const cx = 92 + lunge * 46 - recoil * 60, s = 2.3 + lunge * 0.4;
        A.count(ctx, cx, 690, s, { t, alpha: countA * (1 - recoil * 0.3), eyes: phase === 'qte' ? 1 : 0.3 + (1 - recoil) * 0.2, arms: lunge * 0.6, shadow: { dx: 70, s: 1.25, a: 0.35, skew: -0.12 } });
        if (phase === 'qte') {
          ctx.fillStyle = '#d6cfc4';
          ctx.beginPath(); ctx.ellipse(cx + 40 + lunge * 50, 470 - lunge * 10, 9, 13, -0.8, 0, Math.PI * 2); ctx.fill();
        }
      }
      A.jonathanBack(ctx, 200, 660, 1.6);
      if (phase === 'qte') {
        const left = 1 - el / TIME;
        A.crucifix(ctx, CRU.x, CRU.y, 1.5, 1);
        ctx.strokeStyle = `rgba(255,${120 + left * 120},80,.95)`; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(CRU.x, CRU.y, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); ctx.stroke();
      }
      if (phase === 'recoil') A.crucifix(ctx, CRU.x, CRU.y, 1.5, Math.max(0, 1 - recoil));
    },
  };
}

export default {
  id: 'arrival',
  title: 'III · The Count’s House',
  chapter: 'Chapter II',
  ambience: 'interior',
  haunts: ['wolves', 'scratch', 'gutter', 'eyes', 'whisper'],
  intro: {
    date: '5 May. The Castle.',
    text: 'Within, stood a tall old man, clean shaven save for a long white moustache, and clad in black from head to foot. He motioned me in with his right hand with a courtly gesture, saying in excellent English, but with a strange intonation:—\n\n“Welcome to my house! Enter freely and of your own will!”',
  },
  outro: {
    date: '8 May.',
    text: 'I explored further; doors, doors, doors everywhere, and all locked and bolted. In no place save from the windows in the castle walls is there an available exit.\n\nThe castle is a veritable prison, and I am a prisoner!',
  },
  start: 'bedroom',
  keep: ['crucifix', 'deeds'],

  onEnter(g) {
    g.say([
      C('“I pray you, be seated and sup how you please. You will, I trust, excuse me that I do not join you; but I have dined already, and I do not sup.”'),
      { text: 'He bowed and left me to my supper. I am alone in my room. I should look about this strange house.' },
    ]);
  },

  hint(g) {
    if (!g.flag('atlas')) return 'The Count keeps a library. I wonder what he has been reading — try the door to the right.';
    if (!g.flag('quizDone')) return 'Read the deeds of Carfax (tap them twice in your bag): the house is at Purfleet, on the Thames just east of London. Then look at the atlas again.';
    if (!g.flag('howl')) return 'Listen at the window before the night is out.';
    return 'It is nearly morning. I should shave at my glass by the window.';
  },

  rooms: {
    bedroom: {
      draw(ctx, t, g) { bedroom(ctx, t, g); },
      hotspots: [
        {
          id: 'window', x: 135, y: 92, w: 96, h: 164,
          tap(g) {
            g.set('howl');
            g.say([
              { text: 'Far below in the valley came the howling of many wolves. The Count’s eyes had gleamed when he heard them, and he said:—', sfx: (g) => g.sound.pack() },
              C('“Listen to them—the children of the night. What music they make!”'),
            ]);
          },
        },
        {
          id: 'mirror', x: 240, y: 180, w: 46, h: 64,
          show: (g) => !g.flag('mirrorGone'),
          tap(g) {
            if (!g.flag('quizDone') || !g.flag('howl')) { g.say('My shaving glass, hung by the window. It is the dead of night — I will shave in the morning. First I would see more of this house.'); return; }
            g.say('The night has passed. Grey light creeps over the mountains; it is time to shave.', () => g.startChallenge(mirrorScene()));
          },
        },
        {
          id: 'fire', x: 14, y: 330, w: 108, h: 122,
          tap(g) { g.say('A great fire of logs, freshly replenished, flamed and flared. Someone has made my room most comfortable — yet I have seen no servant in all the castle.'); },
        },
        {
          id: 'supper', x: 128, y: 430, w: 140, h: 40,
          tap(g) { g.say('An excellent roast chicken, some cheese and a salad, and a bottle of old Tokay. A supper for one: the Count does not eat.'); },
        },
        {
          id: 'door', x: 290, y: 268, w: 62, h: 184, gx: 321, gy: 360,
          tap(g) { g.sound.door(); g.goRoom('library'); },
        },
      ],
    },
    library: {
      draw(ctx, t, g) { library(ctx, t, g); },
      haunts: ['whisper', 'gutter', 'slam'],
      eyes: [[180, 280], [60, 430]],
      onEnter(g) {
        if (!g.flag('libSeen')) { g.set('libSeen'); g.say('The library. The Count is not here, though a book lies open on the sofa.'); }
      },
      hotspots: [
        {
          id: 'shelves', x: 12, y: 70, w: 130, h: 330, gx: 77, gy: 200,
          tap(g) { g.say('In the library I found, to my great delight, a vast number of English books, whole shelves full of them, and bound volumes of magazines and newspapers.'); },
        },
        {
          id: 'shelves2', x: 218, y: 70, w: 130, h: 330, hidden: true,
          tap(g) { g.say('History, geography, politics, political economy, botany, geology, law — all relating to England and English life and customs and manners.'); },
        },
        {
          id: 'bradshaw', x: 262, y: 448, w: 40, h: 30,
          tap(g) { g.say('An English Bradshaw’s Guide — the railway timetable. Why should a Transylvanian nobleman study the trains to London?'); },
        },
        {
          id: 'atlas', x: 66, y: 474, w: 86, h: 32, gx: 108, gy: 490,
          tap(g) {
            if (g.flag('quizDone')) { g.say('The atlas, open at England, with its three red rings. Why should he want three places?'); return; }
            g.set('atlas');
            g.say([
              { text: 'One was an atlas, which I found opened naturally at England, as if that map had been much used.' },
              { text: 'On looking at it I found in certain places little rings marked in red ink…' },
            ], () => {
              g.set('countLib');
              g.sound.stinger(); g.shake = 0.7; g.fadeA = 0.6;
              g.say([
                { text: 'I had not heard him come. He was standing behind me.' },
                { who: 'The Count', text: '“Aha!” he said; “still at your books? Good!”' },
                { who: 'The Count', text: '“Come. You have brought me the papers. Show me upon my map where stands the house that you have bought for me.”' },
              ], () => mapQuiz(g, () => {
                g.set('quizDone'); g.take('deeds'); g.sound.countVoice();
                g.say([
                  { who: 'The Count', text: '“Good. Purfleet.” He took the deeds from my hand, and his fingers were as cold as ice.' },
                  { who: 'The Count', text: '“Here I am noble; I am boyar; the common people know me, and I am master. But a stranger in a strange land, he is no one; men know him not—and to know not is to care not for.”' },
                  { who: 'The Count', text: '“We are in Transylvania; and Transylvania is not England. Our ways are not your ways, and there shall be to you many strange things.”' },
                  { text: 'When I looked up from the map again, he was gone.' },
                ], () => g.set('countLib', false));
              }));
            });
          },
        },
        {
          id: 'back', x: 152, y: 250, w: 56, h: 150, gx: 180, gy: 330,
          tap(g) { g.sound.door(); g.goRoom('bedroom'); },
        },
      ],
    },
  },
};
