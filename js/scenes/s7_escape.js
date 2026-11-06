import * as A from '../art/draw.js';
import { climb } from './climb.js';

function ledge(ctx, t) {
  A.sky(ctx, t, { moon: { x: 250, y: 120, r: 30 }, top: '#0a0612', bottom: '#4a2a3a' });
  A.ridge(ctx, 61, 420, 120, '#170d22', { jag: 8 });
  A.ridge(ctx, 62, 480, 60, '#0e0816');
  A.forest(ctx, 12, 520, '#06040a', { n: 50, hmin: 10, hmax: 26, spread: 40 });
  A.fog(ctx, t, { y: 520, h: 120, alpha: 0.55, seed: 21 });
  // a wolf howling on a rock far below
  ctx.fillStyle = '#05030a';
  ctx.beginPath(); ctx.moveTo(40, 600); ctx.lineTo(60, 560); ctx.lineTo(110, 552); ctx.lineTo(130, 600); ctx.fill();
  A.wolf(ctx, 86, 556, 0.35, { pose: 'howl', t });
  // the window frame of the Count's room
  ctx.fillStyle = '#0c080e';
  ctx.fillRect(0, 0, 360, 50); ctx.fillRect(0, 0, 30, 640); ctx.fillRect(330, 0, 30, 640);
  ctx.fillStyle = '#2a2232'; ctx.fillRect(0, 600, 360, 40);
}

export default {
  id: 'escape',
  title: 'VII · The Precipice',
  chapter: 'Chapter IV',
  ambience: 'cliff',
  bats: 4,
  batArea: { y: 70, h: 260 },
  intro: {
    date: '30 June, later.',
    text: 'I am alone in the castle with those awful women. Faugh! Mina is a woman, and there is nought in common. They are devils of the Pit!\n\nI shall not remain alone with them; I shall try to scale the castle wall farther than I have yet attempted.',
  },
  outro: {
    date: '30 June.',
    text: 'At least God’s mercy is better than that of these monsters, and the precipice is steep and high. At its foot a man may sleep—as a man.\n\nGood-bye, all! Mina!',
  },
  start: 'ledge',
  keep: ['crucifix', 'gold'],

  onEnter(g) {
    g.say([
      { text: 'Somewhere behind me, in the dark of the castle, I heard a silvery, musical laugh.', sfx: (g) => g.sound.laugh() },
      { text: 'The window of the Count’s room opens on the precipice. Far below, the wolves are gathering.', sfx: (g) => g.sound.pack() },
    ]);
  },

  hint() {
    return 'Climb out of the window. Tap stones without cracks, wait for the wind to pass, and tap the bats away before they reach you.';
  },

  rooms: {
    ledge: {
      curios: [{
        curio: 'wagons', x: 176, y: 546, w: 70, h: 26, gx: 210, gy: 560,
        art(ctx, t) {
          for (const [wx, ph] of [[196, 0], [222, 1]]) {
            ctx.fillStyle = '#0a0610'; ctx.fillRect(wx - 7, 556, 14, 6);
            ctx.beginPath(); ctx.arc(wx - 4, 563, 2, 0, Math.PI * 2); ctx.arc(wx + 4, 563, 2, 0, Math.PI * 2); ctx.fill();
            A.glow(ctx, wx + 8, 557, 6, '255,170,80', 0.6 + 0.2 * Math.sin(t * 5 + ph), true);
          }
        },
      }],
      draw(ctx, t) { ledge(ctx, t); },
      hotspots: [
        {
          id: 'sill', x: 40, y: 380, w: 280, h: 200, gx: 180, gy: 470,
          tap(g) {
            g.say('I took some of the gold, and climbed out over the sill into the wind. There is no way back.', () => {
              g.startChallenge(climb({
                levels: 10, seed: 77, gustEvery: [6, 9], batEvery: [5, 8], crumbleChance: 0.35, target: 'ground',
                deathText: 'My grip failed, and the precipice took me. At its foot a man may sleep — as a man.',
                onWin: (g) => {
                  g.sound.pack();
                  g.say('My feet touched the rocks at the foot of the wall. Around me in the mist, the eyes of the wolves glowed… but the sun was rising behind the mountains.', () => g.completeScene());
                },
              }));
            });
          },
        },
      ],
    },
  },
};
