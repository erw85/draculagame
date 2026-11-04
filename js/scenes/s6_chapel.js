import * as A from '../art/draw.js';
import { climb } from './climb.js';

const BOX = { x: 120, y: 470, w: 130, h: 50 };

function dawnRoom(ctx, t) {
  A.stoneWall(ctx, 0, 0, 360, 460, { seed: 71, base: '#2e2834' });
  // the window is grey with dawn
  const x = 115, y = 80, w = 130, h = 230;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#4c4566'); g.addColorStop(1, '#c79a8a');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2a2232';
  ctx.beginPath(); ctx.moveTo(x, y + h); for (let i = 0; i <= 6; i++) ctx.lineTo(x + (w * i) / 6, y + h * (0.75 + 0.08 * Math.sin(i * 2.1))); ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#120b10'; ctx.lineWidth = 5; ctx.strokeRect(x, y + w / 2, w, h - w / 2);
  ctx.fillStyle = '#1b141c'; ctx.fillRect(x - 10, y + h, w + 20, 12);
  A.door(ctx, 270, 270, 70, 190, { seed: 81 });
  A.floor(ctx, 460, '#1c161c');
  ctx.fillStyle = '#2a1416'; ctx.fillRect(20, 470, 90, 30); ctx.fillRect(16, 450, 10, 50);
}

// A small arched window showing a grey-pink dawn sky.
function dawnWindow(ctx, x, y, w, h) {
  A.layer(ctx, `dawnwin|${x}|${y}|${w}|${h}`, x - 10, y - 10, w + 20, h + 22, (c) => {
    const arch = (px, py, pw, ph) => { c.beginPath(); c.moveTo(px, py + ph); c.lineTo(px, py + pw / 2); c.arc(px + pw / 2, py + pw / 2, pw / 2, Math.PI, 0); c.lineTo(px + pw, py + ph); c.closePath(); };
    arch(x - 8, y - 8, w + 16, h + 12);
    c.fillStyle = '#4a4050'; c.fill();
    c.save(); arch(x - 8, y - 8, w + 16, h + 12); c.clip();
    A.texture(c, x - 10, y - 10, w + 20, h + 22, 0.5, 'overlay', 1);
    c.restore();
    c.save(); arch(x, y, w, h); c.clip();
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#5a5274'); g.addColorStop(0.6, '#b08a90'); g.addColorStop(1, '#e0b090');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#3a3044';
    c.beginPath(); c.moveTo(x, y + h); for (let i = 0; i <= 8; i++) c.lineTo(x + (w * i) / 8, y + h * (0.72 + 0.08 * Math.sin(i * 2.3))); c.lineTo(x + w, y + h); c.fill();
    c.strokeStyle = 'rgba(20,14,20,.8)'; c.lineWidth = 0.8;
    for (let d = -h; d < w + h; d += 10) { c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d + h * 0.55, y + h); c.moveTo(x + d, y); c.lineTo(x + d - h * 0.55, y + h); c.stroke(); }
    c.restore();
    c.strokeStyle = '#1e1820'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke();
    c.fillStyle = '#3a3240'; c.fillRect(x - 10, y + h + 2, w + 20, 6);
  });
}

function countRoom(ctx, t, g) {
  A.stoneWall(ctx, 0, 0, 360, 450, { seed: 91, base: '#2a2228' });
  // dusty light from the window we climbed in by
  ctx.fillStyle = 'rgba(220,200,190,.08)';
  ctx.beginPath(); ctx.moveTo(250, 80); ctx.lineTo(330, 80); ctx.lineTo(260, 520); ctx.lineTo(130, 520); ctx.fill();
  dawnWindow(ctx, 255, 80, 70, 120);
  A.floor(ctx, 450, '#1d1518');
  // corner door to the winding stair
  A.door(ctx, 20, 260, 64, 190, { seed: 17, open: 0.5 });
  // old dusty furniture
  ctx.fillStyle = '#24160e'; ctx.fillRect(140, 410, 90, 10); ctx.fillRect(146, 420, 8, 40); ctx.fillRect(216, 420, 8, 40);
  ctx.fillStyle = 'rgba(200,190,180,.12)'; ctx.fillRect(140, 406, 90, 4);
  // the heap of gold
  if (!g.has('gold')) {
    for (let i = 0; i < 60; i++) {
      const r = A.rng(i + 3);
      const x = 270 + (r() - 0.5) * 80 * (1 - i / 80), y = 540 - r() * 40 * (1 - i / 70);
      ctx.fillStyle = r() > 0.5 ? '#c99a30' : '#e8c15a';
      ctx.beginPath(); ctx.ellipse(x, y, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    A.glow(ctx, 270, 520, 70, '255,210,110', 0.15 + 0.05 * Math.sin(t * 3));
  } else {
    for (let i = 0; i < 20; i++) { const r = A.rng(i + 3); ctx.fillStyle = '#a07a28'; ctx.beginPath(); ctx.ellipse(270 + (r() - 0.5) * 70, 545 - r() * 12, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill(); }
  }
}

function chapel(ctx, t, g) {
  // ruined chapel: broken roof letting in grey daylight
  A.stoneWall(ctx, 0, 0, 360, 470, { seed: 101, base: '#211b22', rowH: 26 });
  ctx.fillStyle = '#7d7488';
  ctx.beginPath(); ctx.moveTo(140, 0); ctx.lineTo(260, 0); ctx.lineTo(230, 40); ctx.lineTo(170, 30); ctx.fill();
  ctx.fillStyle = 'rgba(210,205,230,.09)';
  ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(250, 0); ctx.lineTo(300, 560); ctx.lineTo(90, 560); ctx.fill();
  // gothic arch shapes
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 6;
  for (const x of [30, 300]) { ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x, 200); ctx.quadraticCurveTo(x + 15, 140, x + 30, 120); ctx.stroke(); }
  ctx.fillStyle = '#16100e'; ctx.fillRect(0, 470, 360, 170);
  ctx.fillStyle = 'rgba(80,60,40,.25)';
  for (let i = 0; i < 40; i++) { const r = A.rng(i); ctx.fillRect(r() * 360, 480 + r() * 150, 6 + r() * 14, 2); }
  // the great boxes, filled with earth
  A.crate(ctx, 10, 410, 90, 58, { earth: true });
  A.crate(ctx, 270, 400, 84, 64, { earth: true });
  A.crate(ctx, 22, 360, 70, 50, { earth: true });
  A.crate(ctx, 280, 350, 70, 50, { earth: true });
  // the great box
  if (!g.flag('lidUp')) A.crate(ctx, BOX.x, BOX.y, BOX.w, BOX.h, { lid: true });
  else gorged(ctx, t, g.flag('struck'));
  // shovel
  if (!g.has('shovel')) {
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(300, 470); ctx.lineTo(330, 380); ctx.stroke();
    ctx.fillStyle = '#7d828a'; ctx.beginPath(); ctx.moveTo(292, 470); ctx.lineTo(306, 470); ctx.lineTo(304, 500); ctx.lineTo(290, 500); ctx.fill();
  }
}

// The Count in his box, "simply gorged with blood".
function gorged(ctx, t, struck) {
  const { x, y, w, h } = BOX;
  // the open box, its lid leaning on the wall
  const lid = ctx.createLinearGradient(x + w, y - 40, x + w + 16, y + 30);
  lid.addColorStop(0, '#4a3018'); lid.addColorStop(1, '#1a1008');
  ctx.save(); ctx.translate(x + w + 2, y - 34); ctx.rotate(0.28); ctx.fillStyle = lid; ctx.fillRect(0, 0, 12, 76); ctx.restore();
  A.crate(ctx, x, y, w, h, { lid: false });
  ctx.fillStyle = '#0c0705'; ctx.fillRect(x + 5, y + 3, w - 10, h - 8);
  for (let i = 0; i < 30; i++) { const r = A.rng(i + 50); ctx.fillStyle = r() < 0.5 ? '#2a1c10' : '#160e08'; ctx.beginPath(); ctx.arc(x + 8 + r() * (w - 16), y + 6 + r() * (h - 14), 1 + r() * 2, 0, Math.PI * 2); ctx.fill(); }
  // body beneath the black cloak, hands folded
  const body = new Path2D();
  body.moveTo(x + 40, y + 14); body.quadraticCurveTo(x + 80, y + 8, x + 120, y + 16); body.lineTo(x + 120, y + 34); body.quadraticCurveTo(x + 80, y + 40, x + 40, y + 36); body.closePath();
  const bg = ctx.createLinearGradient(0, y + 8, 0, y + 40);
  bg.addColorStop(0, '#2a2232'); bg.addColorStop(1, '#050307');
  A.rimFill(ctx, body, bg, 'rgba(200,190,220,.35)', 0, -1);
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1;
  for (const fx of [60, 80, 100]) { ctx.beginPath(); ctx.moveTo(x + fx, y + 12); ctx.quadraticCurveTo(x + fx + 4, y + 24, x + fx - 2, y + 37); ctx.stroke(); }
  ctx.fillStyle = '#d0b0a0'; ctx.beginPath(); ctx.ellipse(x + 70, y + 24, 5, 4, 0, 0, Math.PI * 2); ctx.ellipse(x + 76, y + 23, 5, 4, 0.3, 0, Math.PI * 2); ctx.fill();
  // bloated, ruddy face; hair and moustache now dark iron-grey
  const fx = x + 26, fy = y + 25;
  ctx.fillStyle = '#4a4650';
  ctx.beginPath(); ctx.ellipse(fx - 9, fy, 9, 15, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
  const sk = ctx.createRadialGradient(fx - 2, fy - 4, 2, fx, fy, 17);
  sk.addColorStop(0, '#e89a86'); sk.addColorStop(0.7, '#b8604e'); sk.addColorStop(1, '#7a3028');
  ctx.fillStyle = sk; ctx.beginPath(); ctx.ellipse(fx, fy, 15, 14, 0, 0, Math.PI * 2); ctx.fill();
  // swollen lids and pouches under the eyes
  ctx.fillStyle = 'rgba(120,40,40,.45)';
  ctx.beginPath(); ctx.ellipse(fx + 1, fy - 6, 3.5, 2.4, 0, 0, Math.PI * 2); ctx.ellipse(fx + 1, fy + 3, 3.5, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  const eye = 0.6 + 0.4 * Math.sin(t * 2);
  for (const ey of [fy - 6, fy + 3]) {
    A.glow(ctx, fx + 1, ey, 7, '255,30,40', 0.45 * eye, true);
    ctx.fillStyle = `rgba(255,40,40,${eye})`; ctx.beginPath(); ctx.ellipse(fx + 1.5, ey, 1.4, 0.9, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(fx + 2, fy - 2); ctx.quadraticCurveTo(fx + 8, fy - 1.5, fx + 8, fy - 1); ctx.stroke();
  // iron-grey moustache and blood-red mouth
  ctx.fillStyle = '#5a5660';
  ctx.beginPath(); ctx.ellipse(fx + 10, fy - 1.5, 2.2, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a0a14';
  ctx.beginPath(); ctx.ellipse(fx + 12.5, fy - 1.5, 1.8, 4, 0, 0, Math.PI * 2); ctx.fill();
  // gouts of fresh blood trickling over the chin and neck
  ctx.fillStyle = '#a0101c';
  ctx.beginPath(); ctx.moveTo(fx + 13, fy + 1); ctx.quadraticCurveTo(fx + 20, fy + 3, fx + 24, fy + 2); ctx.lineTo(fx + 24, fy + 4); ctx.quadraticCurveTo(fx + 19, fy + 5, fx + 13, fy + 3); ctx.fill();
  ctx.fillRect(fx + 18, fy + 3, 1.6, 6 + Math.sin(t) * 0.5);
  ctx.fillStyle = 'rgba(255,200,200,.5)'; ctx.fillRect(fx + 20, fy + 2, 2, 0.8);
  if (struck) {
    ctx.strokeStyle = '#b0101c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fx - 10, fy - 8); ctx.lineTo(fx - 5, fy + 6); ctx.stroke();
  }
}

export default {
  id: 'chapel',
  title: 'VI · The Chapel',
  chapter: 'Chapter IV',
  ambience: 'interior',
  intro: {
    date: '30 June, morning.',
    text: 'These may be the last words I ever write in this diary. I slept till just before the dawn, and when I woke threw myself on my knees, for I determined that if Death came he should find me ready.',
  },
  outro: {
    date: '30 June.',
    text: 'The door is shut, and the chains rattle; there is a grinding of the key in the lock.\n\nHark! in the courtyard and down the rocky way the roll of heavy wheels, the crack of whips, and the chorus of the Szgany as they pass into the distance.\n\nI am alone in the castle with those awful women.',
  },
  start: 'dawn',
  keep: ['crucifix'],
  setup(g) { g.take('lamp'); g.take('notebook'); },

  onEnter(g) {
    g.say([
      { text: 'At last I felt that subtle change in the air, and knew that the morning had come. Then came the welcome cock-crow, and I felt that I was safe.' },
      { text: 'I ran down to the hall and drew back the massive bolts. But the door would not move. It had been locked after I left the Count.' },
      { text: 'Then a wild desire took me to obtain that key at any risk, and I determined then and there to scale the wall again and gain the Count’s room.' },
    ]);
  },

  hint(g) {
    if (g.state.room === 'dawn') return 'The key must be in the Count’s room. The only way there is down the outside wall — through my window.';
    if (!g.flag('lidUp') && g.state.room !== 'chapel') return 'No key here. The door in the corner leads down a winding stair to the old chapel.';
    if (!g.flag('lidUp')) return 'The great box against the wall. I must look inside.';
    if (!g.flag('searched')) return 'I must search him for the key, however my senses revolt.';
    if (!g.has('shovel')) return 'The workmen left a shovel by the boxes.';
    return 'There is a terrible thing I could do with that shovel…';
  },

  rooms: {
    dawn: {
      draw(ctx, t) { dawnRoom(ctx, t); },
      hotspots: [
        {
          id: 'window', x: 115, y: 80, w: 130, h: 230,
          tap(g) {
            g.say('I scrambled out of the east window and onto the wall. The Count’s window lies below.', () => {
              g.startChallenge(climb({
                levels: 6, seed: 8, gustEvery: [7, 10], batEvery: [6, 9], crumbleChance: 0.25, target: 'window',
                deathText: 'The stone came away in my hand, and I fell from the castle wall into the abyss below.',
                onWin: (g) => { g.goRoom('countroom'); g.say('I dropped through the window into the Count’s room. It was empty.'); },
              }));
            });
          },
        },
        {
          id: 'door', x: 270, y: 270, w: 70, h: 190, gx: 305, gy: 360,
          tap(g) { g.sound.thud(); g.say('Locked. I could see the bolt shot.'); },
        },
      ],
    },
    countroom: {
      draw(ctx, t, g) { countRoom(ctx, t, g); },
      hotspots: [
        {
          id: 'gold', x: 220, y: 490, w: 100, h: 60, gx: 270, gy: 525,
          show: (g) => !g.has('gold'),
          tap(g) {
            g.give('gold');
            g.say('A great heap of gold in one corner — gold of all kinds, Roman, and British, and Austrian, and Hungarian, and Greek and Turkish money. I took some, lest I want it later.');
          },
        },
        {
          id: 'table', x: 140, y: 395, w: 90, h: 40,
          tap(g) { g.say('The furniture is covered with dust. I looked for the key, but it was not in the lock, and I could not find it anywhere.'); },
        },
        {
          id: 'stair', x: 20, y: 260, w: 64, h: 190, gx: 52, gy: 350,
          tap(g) { g.sound.creak(); g.say('I went through the door in the corner and down the winding stair and along the dark passage to the old chapel.', () => g.goRoom('chapel')); },
        },
      ],
    },
    chapel: {
      draw(ctx, t, g) { chapel(ctx, t, g); },
      onEnter(g) { if (!g.flag('chSeen')) { g.set('chSeen'); g.say('The great box was in the same place, close against the wall, but the lid was laid on it, not fastened down, with the nails ready in their places to be hammered home.'); } },
      hotspots: [
        {
          id: 'boxes', x: 10, y: 350, w: 92, h: 120, gx: 55, gy: 400,
          tap(g) { g.say('Great wooden boxes, fifty of them, filled with fresh-dug earth. The Count is sending them somewhere… to London?'); },
        },
        {
          id: 'shovel', x: 284, y: 370, w: 54, h: 134, gx: 312, gy: 440,
          show: (g) => !g.has('shovel'),
          tap(g) { g.give('shovel'); g.say('A shovel which the workmen had been using to fill the cases.'); },
        },
        {
          id: 'box', x: BOX.x, y: BOX.y - 10, w: BOX.w, h: BOX.h + 16, gx: BOX.x + BOX.w / 2, gy: BOX.y + 20,
          tap(g) {
            if (g.flag('struck')) { g.say('The lid has fallen over again, and hid the horrid thing from my sight.'); return; }
            if (!g.flag('lidUp')) {
              g.set('lidUp');
              g.sound.creak();
              g.say([
                { text: 'I raised the lid, and laid it back against the wall; and then I saw something which filled my very soul with horror.' },
                { text: 'There lay the Count, but looking as if his youth had been half renewed, for the white hair and moustache were changed to dark iron-grey; the mouth was redder than ever, for on the lips were gouts of fresh blood.' },
                { text: 'It seemed as if the whole awful creature were simply gorged with blood. He lay like a filthy leech, exhausted with his repletion.' },
              ]);
              return;
            }
            g.set('searched');
            g.say('I shuddered as I bent over to touch him, and every sense in me revolted at the contact; but I had to search, or I was lost. I felt all over the body, but no sign could I find of the key.');
          },
          use: {
            shovel(g) {
              if (!g.flag('lidUp')) { g.say('The lid is on the box.'); return; }
              if (!g.flag('searched')) { g.say('First I must search him for the key.'); return; }
              g.say([
                { text: 'There was a mocking smile on the bloated face which seemed to drive me mad. This was the being I was helping to transfer to London. A terrible desire came upon me to rid the world of such a monster.' },
                { text: 'I lifted the shovel high, and struck, with the edge downward, at the hateful face. But as I did so the head turned, and the eyes fell full upon me, with all their blaze of basilisk horror.', sfx: (g) => g.sound.sting() },
              ], () => {
                g.set('struck');
                g.take('shovel');
                g.say('The sight seemed to paralyse me, and the shovel turned in my hand and glanced from the face. The lid fell over again, and hid the horrid thing from my sight.', () => {
                  g.set('lidUp', false);
                  g.say([
                    { text: 'As I waited I heard in the distance a gipsy song sung by merry voices coming closer — the Szgany and the Slovaks of whom the Count had spoken were coming.', sfx: (g) => g.sound.song() },
                    { text: 'I ran from the place and gained the Count’s room. But at the moment there seemed to come a violent puff of wind, and the door to the winding stair blew to with a shock.', sfx: (g) => g.sound.door() },
                    { text: 'When I ran to push it open, I found that it was hopelessly fast. I was again a prisoner, and the net of doom was closing round me more closely.' },
                  ], () => g.completeScene());
                });
              });
            },
          },
          wrong: (g, item) => (item === 'crucifix' ? 'He does not stir. The crucifix will not open his eyes — nor give me the key.' : null),
        },
      ],
    },
  },
};
