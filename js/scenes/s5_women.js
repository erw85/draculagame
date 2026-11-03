import * as A from '../art/draw.js';

const DOOR = { x: 300, y: 300, w: 52, h: 170 };
const START_X = 110, END_X = 290, FLOOR_Y = 500;

function wing(ctx, t) {
  A.stoneWall(ctx, 0, 0, 360, 470, { seed: 61, base: '#231c2c' });
  A.archWindow(ctx, 30, 70, 120, 230, t, { moonX: 0.55, moonY: 0.25 });
  // broad moonbeam across the dusty floor
  ctx.fillStyle = 'rgba(200,200,255,.08)';
  ctx.beginPath(); ctx.moveTo(30, 300); ctx.lineTo(150, 300); ctx.lineTo(260, 620); ctx.lineTo(40, 620); ctx.fill();
  A.door(ctx, DOOR.x, DOOR.y, DOOR.w, DOOR.h, { seed: 44, open: 0.2 });
  A.floor(ctx, 470, '#1a141c');
  // dust motes in the moonlight
  for (let i = 0; i < 24; i++) {
    const x = 50 + ((i * 53 + t * 6) % 180), y = 320 + ((i * 97 + t * 4 * (i % 3 + 1)) % 280);
    ctx.fillStyle = `rgba(220,220,255,${0.25 + 0.2 * Math.sin(t + i)})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  // the old couch Jonathan pulled out
  ctx.fillStyle = '#2c1016'; ctx.fillRect(70, 488, 110, 24); ctx.fillRect(64, 468, 12, 44);
}

function women() {
  let p = 0, danger = 0, holding = false, el = 0, appear = 0;
  let active = 0, phase = 'away', pt = 2.2;
  const brides = [
    { hair: '#1d1014', bx: 50, phase: 0 },
    { hair: '#e0b860', bx: 100, phase: 2 },
    { hair: '#24121a', bx: 150, phase: 4 },
  ];
  let finished = false;

  const finish = (g) => {
    finished = true;
    holding = false;
    g.sound.heartbeat(false);
    g.prompt(null);
    g.endChallenge();
    g.cutscene(2.2, (ctx, t, q) => {
      wing(ctx, t);
      A.jonathanLying(ctx, END_X, FLOOR_Y, 1);
      brides.forEach((b) => A.bride(ctx, b.bx + danger * 60 - q * 40, 520, 1.15, { hair: b.hair, t, phase: b.phase, look: 0.2, alpha: 1 - q * 0.3 }));
      A.count(ctx, DOOR.x + 26, 470, 1.25, { t, arms: Math.min(1, q * 2), alpha: Math.min(1, q * 2), eyes: 1 });
    }, () => {
      g.say([
        { text: 'I was conscious of the presence of the Count, and of his being as if lapped in a storm of fury.' },
        { who: 'The Count', text: '“How dare you touch him, any of you? How dare you cast eyes on him when I had forbidden it? Back, I tell you all! This man belongs to me!”' },
        { who: 'The fair woman', text: '“You yourself never loved; you never love!”', sfx: (g) => g.sound.laugh() },
        { text: 'Then the horror overcame me, and I sank down unconscious.' },
      ], () => g.completeScene());
    });
  };

  return {
    start(g) {
      g.prompt('Hold to creep toward the door · Let go to lie still');
      g.sound.heartbeat(true, 1.4);
    },
    update(dt, g) {
      if (finished) return;
      el += dt;
      appear = Math.min(1, appear + dt * 0.6);
      // one woman at a time turns to look; a laugh and red eyes warn first
      pt -= dt;
      if (pt <= 0) {
        if (phase === 'away') { phase = 'warn'; pt = 0.9; g.sound.laugh(); }
        else if (phase === 'warn') { phase = 'watch'; pt = 1.4 + Math.random() * 0.8; }
        else { phase = 'away'; pt = 1.2 + Math.random() * 2; active = (active + 1 + Math.floor(Math.random() * 2)) % 3; }
      }
      if (holding) {
        p = Math.min(1, p + dt * 0.085);
        if (phase === 'watch') danger += dt * 0.75;
      }
      if (!holding || phase !== 'watch') danger = Math.max(0, danger - dt * 0.08);
      g.sound.heartbeat(true, 1.4 + danger * 2);
      if (danger >= 1) {
        g.die('She went on her knees and bent over me, simply gloating… I felt the hard dents of two sharp teeth, just touching and pausing there. And then no more.');
        return;
      }
      if (p >= 1) finish(g);
    },
    peek: () => ({ p, danger, phase }),
    down() { holding = true; },
    up() { holding = false; },
    draw(ctx, t) {
      // Jonathan edges along the floor
      const jx = START_X + (END_X - START_X) * p;
      // women, drawing nearer as danger rises
      brides.forEach((b, i) => {
        const look = i === active ? (phase === 'watch' ? 1 : phase === 'warn' ? 0.5 + 0.5 * Math.sin(t * 20) : 0) : 0;
        const x = b.bx + danger * 70 + Math.sin(t * 0.8 + b.phase) * 4;
        A.bride(ctx, x, 520 + i * 6, 1.15, { hair: b.hair, t, phase: b.phase, look, alpha: appear });
      });
      A.jonathanLying(ctx, jx, FLOOR_Y + 4, 1);
      // eyes half-shut when lying still
      if (!holding) {
        ctx.fillStyle = 'rgba(0,0,0,.42)';
        ctx.fillRect(0, 0, A.W, A.H);
        ctx.fillStyle = 'rgba(5,0,6,.9)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(A.W, 0); ctx.lineTo(A.W, 90); ctx.quadraticCurveTo(A.W / 2, 170, 0, 90); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, A.H); ctx.lineTo(A.W, A.H); ctx.lineTo(A.W, A.H - 72); ctx.quadraticCurveTo(A.W / 2, A.H - 112, 0, A.H - 72); ctx.fill();
      }
      // danger tint
      if (danger > 0) { ctx.fillStyle = `rgba(140,0,20,${danger * 0.35})`; ctx.fillRect(0, 0, A.W, A.H); }
    },
    drawTop(ctx) {
      // progress to the door
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(40, 96, 280, 6);
      ctx.fillStyle = '#cbb9e0'; ctx.fillRect(40, 96, 280 * p, 6);
      ctx.font = '11px "IM Fell English", serif'; ctx.fillStyle = 'rgba(230,220,240,.8)';
      ctx.textAlign = 'right'; ctx.fillText('door', 320, 116);
      ctx.textAlign = 'left'; ctx.fillText(danger > 0.05 ? 'They are coming closer…' : '', 40, 116);
    },
  };
}

export default {
  id: 'women',
  title: 'V · The Three Women',
  chapter: 'Chapter III',
  ambience: 'crypt',
  intro: {
    date: 'Later: the Morning of 16 May.',
    text: 'God preserve my sanity, for to this I am reduced. Safety and the assurance of safety are things of the past.',
  },
  outro: {
    date: 'Morning.',
    text: 'I awoke in my own bed. If it be that I had not dreamt, the Count must have carried me here.\n\nI am in fear—in awful fear—and there is no escape for me; I am encompassed about with terrors that I dare not think of…',
  },
  start: 'wing',
  keep: ['crucifix'],

  onEnter(g) {
    g.say([
      { text: 'I lay on the old couch in the moonlight. I suppose I must have fallen asleep…' },
      { text: 'I was not alone. In the moonlight opposite me were three young women, ladies by their dress and manner. Though the moonlight was behind them, they threw no shadow on the floor.', sfx: (g) => g.sound.laugh() },
      { who: 'A dark woman', text: '“Go on! You are first, and we shall follow; yours is the right to begin.”' },
      { who: 'Another', text: '“He is young and strong; there are kisses for us all.”' },
      { who: 'How to play', text: 'Hold your finger down to creep toward the door. Let go to lie still. When you hear their laugh and see red eyes, one of them is about to look — stop moving!' },
    ], () => g.startChallenge(women()));
  },

  hint() {
    return 'Creep only when none of them is watching. Their silvery laugh is the warning — let go at once and wait for the red eyes to fade.';
  },

  rooms: {
    wing: {
      draw(ctx, t) { wing(ctx, t); },
      hotspots: [],
    },
  },
};
