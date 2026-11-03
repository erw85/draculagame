import * as A from '../art/draw.js';

const L = (text) => ({ who: 'Landlady', text });
const J = (text) => ({ who: 'Jonathan', text });

function bag(ctx, x, y, packed) {
  ctx.fillStyle = '#4a2416';
  ctx.beginPath(); ctx.moveTo(x - 34, y); ctx.lineTo(x - 28, y - 38); ctx.lineTo(x + 28, y - 38); ctx.lineTo(x + 34, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6b3a1c';
  for (let i = -24; i < 26; i += 12) ctx.fillRect(x + i, y - 34, 5, 32);
  ctx.strokeStyle = '#1c0e08'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y - 40, 12, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#b08a3a'; ctx.fillRect(x - 30, y - 40, 60, 4);
  if (!packed) {
    ctx.fillStyle = '#d8ccb0'; ctx.fillRect(x - 18, y - 46, 22, 8);
    ctx.fillStyle = '#2a1a2a'; ctx.fillRect(x + 4, y - 48, 12, 10);
  }
}

function envelope(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12);
  ctx.fillStyle = '#e9dcbc'; ctx.fillRect(-15, -9, 30, 18);
  ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-15, -9); ctx.lineTo(0, 2); ctx.lineTo(15, -9); ctx.stroke();
  ctx.fillStyle = '#9c1420'; ctx.beginPath(); ctx.arc(0, 2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function garlic(ctx, x, y) {
  ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 60); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#e8e2d2';
    ctx.beginPath(); ctx.ellipse(x + (i % 2 ? 5 : -5), y + 10 + i * 11, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
  }
}

export default {
  id: 'bistritz',
  title: 'I · Bistritz',
  chapter: 'Chapter I',
  ambience: 'inn',
  intro: {
    date: '3 May. Bistritz.',
    text: 'Count Dracula had directed me to go to the Golden Krone Hotel, which I found, to my great delight, to be thoroughly old-fashioned, for of course I wanted to see all I could of the ways of the country. I was evidently expected…',
  },
  outro: {
    date: '4 May.',
    text: 'I am writing up this part of the diary whilst I am waiting for the coach, which is, of course, late; and the crucifix is still round my neck.',
  },
  start: 'inn',
  keep: [],

  onEnter(g) {
    g.say([
      { who: 'How to play', text: 'Tap anything that glimmers to examine it or pick it up.' },
      { who: 'How to play', text: 'Items you carry appear below. Tap one to select it, then tap something in the scene to use it there. Tap a selected item again to read about it.' },
      { who: 'How to play', text: 'Stuck? The ? button gives a hint — but only three per chapter.' },
    ]);
  },

  hint(g) {
    if (!g.has('letter')) return 'Someone has left a letter for me. Perhaps on the table?';
    if (!g.has('crucifix')) return 'The landlady seems anxious to speak with me.';
    if (!g.flag('packed')) return 'I should pack my bag for the journey.';
    return 'All is ready. The coach waits beyond the door.';
  },

  rooms: {
    inn: {
      draw(ctx, t, g) {
        A.woodWall(ctx, 0, 0, 360, 432, { seed: 4, base: '#3b2416' });
        ctx.fillStyle = '#1c100a'; ctx.fillRect(0, 56, 360, 14);
        A.archWindow(ctx, 208, 104, 112, 152, t, { moonX: 0.35 });
        ctx.fillStyle = '#24140c'; ctx.fillRect(200, 256, 128, 8);
        garlic(ctx, 192, 96);
        A.door(ctx, 20, 236, 78, 196, { seed: 9 });
        A.floor(ctx, 432, '#2a170d');
        A.glow(ctx, 290, 400, 230, '255,150,60', 0.2);
        A.table(ctx, 178, 422, 150, { cloth: '#5a1a16' });
        A.candle(ctx, 300, 420, t, 1.1);
        if (!g.has('letter')) envelope(ctx, 220, 412);
        bag(ctx, 252, 548, g.flag('packed'));
        if (!g.flag('ladyGone')) A.landlady(ctx, 140, 500, 1.45, t);
      },
      hotspots: [
        {
          id: 'window', x: 208, y: 104, w: 112, h: 152,
          tap(g) {
            g.say({ text: 'Beyond the window the Carpathians are black against the moon. Somewhere far off, a dog — or a wolf — is howling.', sfx: (g) => g.sound.howl(0.2, 0.9) });
          },
        },
        {
          id: 'garlic', x: 178, y: 92, w: 28, h: 72, hidden: true,
          tap(g) { g.say('A string of garlic hangs by the window. The people here seem to put great faith in it.'); },
        },
        {
          id: 'letter', x: 195, y: 392, w: 52, h: 36, gx: 220, gy: 410,
          show: (g) => !g.has('letter'),
          tap(g) {
            g.give('letter');
            g.say([
              { who: 'The letter', text: '“My Friend.—Welcome to the Carpathians. I am anxiously expecting you. Sleep well to-night. At three to-morrow the diligence will start for Bukovina; a place on it is kept for you.”' },
              { who: 'The letter', text: '“At the Borgo Pass my carriage will await you and will bring you to me.” — Your friend, Dracula.' },
            ]);
          },
        },
        {
          id: 'landlady', x: 98, y: 300, w: 86, h: 200, gx: 140, gy: 380,
          show: (g) => !g.flag('ladyGone'),
          tap(g) {
            if (!g.has('letter')) {
              g.say([L('“The Herr Englishman?”'), J('“Yes, Jonathan Harker.”'), { text: 'She smiled, and glanced toward the table, where a letter is waiting for me.' }]);
              return;
            }
            g.say([
              L('“Must you go? Oh! young Herr, must you go?”'),
              { text: 'I told her that I must go at once, and that I was engaged on important business.' },
              L('“Do you know what day it is?”'),
              J('“It is the fourth of May.”'),
              L('“It is the eve of St. George’s Day. Do you not know that to-night, when the clock strikes midnight, all the evil things in the world will have full sway?”'),
              { text: 'She went down on her knees and implored me not to go. Then she rose, dried her eyes, and taking a crucifix from her neck, offered it to me.' },
              L('“For your mother’s sake.”'),
            ], () => {
              g.give('crucifix');
              g.set('ladyGone');
              g.sound.door();
              g.say('She put the rosary round my neck and went out of the room. It is all very ridiculous — and yet I do not feel comfortable.');
            });
          },
          use: {
            letter(g) { g.say([L('She would not even look at the letter. She only crossed herself.')]); },
          },
        },
        {
          id: 'bag', x: 214, y: 500, w: 78, h: 56, gx: 252, gy: 524,
          tap(g) {
            if (g.flag('packed')) { g.say('My bag is packed and ready.'); return; }
            if (!g.has('letter')) { g.say('My travelling bag. I had better find out the Count’s instructions before I pack.'); return; }
            if (!g.has('crucifix')) { g.say('I could pack now… but the landlady keeps looking at me as if she wants to say something.'); return; }
            g.set('packed');
            g.sound.thud();
            g.say('I packed my bag. The diligence for Bukovina will leave soon.');
          },
        },
        {
          id: 'door', x: 20, y: 236, w: 78, h: 196, gx: 59, gy: 330,
          tap(g) {
            if (!g.flag('packed')) {
              g.say(g.has('letter') && g.has('crucifix') ? 'I cannot leave without my bag.' : 'I am not ready to leave yet.');
              return;
            }
            g.sound.door();
            g.say('The coach is waiting in the street. A crowd has gathered round it, and they cross themselves as I pass.', () => g.completeScene());
          },
        },
      ],
    },
  },
};
