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

function countRoom(ctx, t, g) {
  A.stoneWall(ctx, 0, 0, 360, 450, { seed: 91, base: '#2a2228' });
  // dusty light from the window we climbed in by
  ctx.fillStyle = 'rgba(220,200,190,.08)';
  ctx.beginPath(); ctx.moveTo(250, 80); ctx.lineTo(330, 80); ctx.lineTo(260, 520); ctx.lineTo(130, 520); ctx.fill();
  ctx.fillStyle = '#c0a090'; ctx.fillRect(255, 80, 70, 120);
  ctx.strokeStyle = '#120b10'; ctx.lineWidth = 4; ctx.strokeRect(255, 80, 70, 120);
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
  ctx.fillStyle = '#2d1c10'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#140c08'; ctx.fillRect(x + 5, y + 4, w - 10, h - 8);
  ctx.fillStyle = '#3a2614'; ctx.save(); ctx.translate(x + w + 4, y - 30); ctx.rotate(0.3); ctx.fillRect(0, 0, 12, 70); ctx.restore();
  // body under dark cloak
  ctx.fillStyle = '#060308'; ctx.beginPath(); ctx.ellipse(x + w / 2 + 14, y + h / 2, 48, 14, 0, 0, Math.PI * 2); ctx.fill();
  // bloated face, ruddy, hair now dark iron-grey
  const fx = x + 30, fy = y + h / 2;
  ctx.fillStyle = '#c87a6a'; ctx.beginPath(); ctx.ellipse(fx, fy, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a4650'; ctx.beginPath(); ctx.ellipse(fx - 9, fy, 8, 13, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
  ctx.fillStyle = '#8a1018';
  ctx.beginPath(); ctx.ellipse(fx + 9, fy + 1, 2.5, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(fx + 9, fy + 3, 12, 2); ctx.fillRect(fx + 14, fy + 5, 2, 6);
  const eye = 0.6 + 0.4 * Math.sin(t * 2);
  A.glow(ctx, fx + 2, fy - 4, 8, '255,30,40', 0.4 * eye);
  ctx.fillStyle = `rgba(255,40,40,${eye})`; ctx.fillRect(fx, fy - 6, 2, 2); ctx.fillRect(fx, fy - 1, 2, 2);
  if (struck) { ctx.strokeStyle = '#b0101c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx - 12, fy - 6); ctx.lineTo(fx - 6, fy + 4); ctx.stroke(); }
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
