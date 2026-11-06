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

function dresser(ctx, x, y, open) {
  A.layer(ctx, `dresser|${open}`, x - 4, y - 6, 104, 96, (c) => {
    const g = c.createLinearGradient(x, 0, x + 96, 0);
    g.addColorStop(0, '#4a2c16'); g.addColorStop(0.5, '#5e3a1e'); g.addColorStop(1, '#2a180c');
    c.fillStyle = '#2a180c'; c.fillRect(x - 4, y - 6, 104, 8);
    c.fillStyle = g; c.fillRect(x, y, 96, 84);
    A.texture(c, x, y, 96, 84, 0.35, 'overlay', 1);
    for (const dy of [6, 32, 58]) {
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + 6, y + dy, 84, 22);
      c.fillStyle = '#5a361c'; c.fillRect(x + 7, y + dy + 1, 82, 20);
      c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(x + 48, y + dy + 11, 2.2, 0, Math.PI * 2); c.fill();
    }
    // painted flowers, as on a peasant dresser
    for (const [fx, fy] of [[x + 20, y + 17], [x + 76, y + 17], [x + 20, y + 69], [x + 76, y + 69]]) {
      c.fillStyle = '#a3121f'; c.beginPath(); c.arc(fx, fy, 3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2a6a3a'; c.fillRect(fx - 6, fy - 1, 4, 2); c.fillRect(fx + 2, fy - 1, 4, 2);
    }
    if (open) { c.fillStyle = '#100804'; c.fillRect(x + 7, y + 33, 82, 20); c.fillStyle = '#5a361c'; c.fillRect(x + 4, y + 52, 88, 6); }
    else { c.fillStyle = '#111'; c.fillRect(x + 47, y + 39, 2, 4); }
  });
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
  haunts: ['bell', 'wolves', 'gutter', 'whisper'],
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
      { who: 'How to play', text: 'Ten curiosities from the novel are hidden around the castle, with only a faint, occasional glint to give them away. Find them for a better rank at the end of the act.' },
    ]);
  },

  hint(g) {
    if (!g.has('letter')) return 'Someone has left a letter for me. Perhaps on the table?';
    if (!g.has('crucifix')) return 'The landlady seems anxious to speak with me.';
    if (!g.has('deeds') && !g.has('key')) return 'She has locked my papers in the dresser. The key must be hidden somewhere a superstitious woman would trust: among her charms by the window?';
    if (!g.has('deeds')) return 'Use the iron key on the dresser.';
    if (!g.flag('packed')) return 'I should pack my bag for the journey.';
    return 'All is ready. The coach waits beyond the door.';
  },

  rooms: {
    inn: {
      curios: [
        {
          curio: 'dictionary', x: 102, y: 540, w: 40, h: 28, gx: 122, gy: 554,
          art(ctx) {
            ctx.save(); ctx.translate(122, 556); ctx.rotate(-0.25);
            ctx.fillStyle = '#2a3a26'; ctx.fillRect(-10, -6, 20, 12);
            ctx.fillStyle = '#e7d9b8'; ctx.fillRect(-9, 4, 18, 2);
            ctx.fillStyle = '#c9a24a'; ctx.fillRect(-6, -3, 12, 1); ctx.fillRect(-6, 0, 12, 1);
            ctx.restore();
          },
        },
        {
          curio: 'recipe', x: 306, y: 396, w: 30, h: 26, gx: 321, gy: 410,
          art(ctx) {
            ctx.save(); ctx.translate(321, 412); ctx.rotate(0.2);
            ctx.fillStyle = '#efe6cf'; ctx.fillRect(-8, -5, 16, 10);
            ctx.strokeStyle = 'rgba(80,50,30,.6)'; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.moveTo(-6, -2); ctx.lineTo(-2, -2); ctx.moveTo(2, 1); ctx.lineTo(6, 1); ctx.stroke();
            ctx.restore();
          },
        },
      ],
      draw(ctx, t, g) {
        A.woodWall(ctx, 0, 0, 360, 432, { seed: 4, base: '#3b2416' });
        ctx.fillStyle = '#1c100a'; ctx.fillRect(0, 56, 360, 14);
        A.archWindow(ctx, 208, 104, 112, 152, t, { moonX: 0.35 });
        ctx.fillStyle = '#24140c'; ctx.fillRect(200, 256, 128, 8);
        garlic(ctx, 192, 96);
        A.door(ctx, 20, 236, 78, 196, { seed: 9 });
        A.floor(ctx, 432, '#2a170d');
        A.glow(ctx, 290, 400, 230, '255,150,60', 0.2);
        dresser(ctx, 234, 300, g.flag('drawerOpen'));
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
          tap(g) {
            if (!g.flag('ladyGone') || g.has('key') || g.flag('drawerOpen')) { g.say('A string of garlic hangs by the window. The people here seem to put great faith in it.'); return; }
            g.give('key');
            g.say('A string of garlic… and tucked among the bulbs, where no thief would put his hand, a small iron key!');
          },
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
              g.say([
                { text: 'She put the rosary round my neck. Then, at the door, she turned.' },
                L('“Your papers I have locked away, young Herr. In the morning you will thank me.”'),
                { text: 'And she went out of the room, taking — I supposed — the key. Without the deeds to the Count’s new house, my journey is pointless.' },
              ]);
            });
          },
          use: {
            letter(g) { g.say([L('She would not even look at the letter. She only crossed herself.')]); },
          },
        },
        {
          id: 'dresser', x: 234, y: 296, w: 96, h: 88, gx: 282, gy: 342,
          tap(g) {
            if (g.flag('drawerOpen')) {
              if (!g.has('deeds')) { g.give('deeds'); g.say('My papers: the deeds of Carfax, the estate the Count has bought near London. I must deliver them to him.'); }
              else g.say('The drawer is empty now.');
              return;
            }
            if (!g.flag('ladyGone')) { g.say('A painted dresser. The middle drawer is locked.'); return; }
            g.say('The middle drawer is locked. My papers are in there. Where would a careful old woman hide a key, in a house full of charms against evil?');
          },
          use: {
            key(g) { g.take('key'); g.set('drawerOpen'); g.sound.creak(); g.give('deeds'); g.say('The key turned stiffly. Inside lay my papers: the deeds of Carfax, the estate the Count has bought near London.'); },
          },
        },
        {
          id: 'bag', x: 214, y: 500, w: 78, h: 56, gx: 252, gy: 524,
          tap(g) {
            if (g.flag('packed')) { g.say('My bag is packed and ready.'); return; }
            if (!g.has('letter')) { g.say('My travelling bag. I had better find out the Count’s instructions before I pack.'); return; }
            if (!g.has('crucifix')) { g.say('I could pack now… but the landlady keeps looking at me as if she wants to say something.'); return; }
            if (!g.has('deeds')) { g.say('I cannot leave without my papers. The Count is expecting the deeds to his new house.'); return; }
            g.set('packed');
            g.sound.thud();
            g.say('I packed my bag. The diligence for Bukovina will leave soon.');
          },
        },
        {
          id: 'door', x: 20, y: 236, w: 78, h: 196, gx: 59, gy: 330,
          tap(g) {
            if (!g.flag('packed')) {
              g.say(g.has('letter') && g.has('crucifix') && g.has('deeds') ? 'I cannot leave without my bag.' : 'I am not ready to leave yet.');
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
