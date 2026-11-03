import * as A from '../art/draw.js';

const CX = 180, CY = 470;          // calèche position
const LAMP = { x: 252, y: 405 };   // carriage lamp

function horse(ctx, x, y, t, i) {
  ctx.fillStyle = '#070408';
  const st = Math.sin(t * 8 + i) * 4;
  ctx.beginPath(); ctx.ellipse(x, y - 42, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 20, y - 50); ctx.lineTo(x - 36, y - 80); ctx.lineTo(x - 26, y - 84); ctx.lineTo(x - 8, y - 54); ctx.fill();
  ctx.save(); ctx.translate(x - 40, y - 78); ctx.rotate(0.6); ctx.beginPath(); ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(x - 30, y - 88); ctx.lineTo(x - 28, y - 94); ctx.lineTo(x - 25, y - 86); ctx.fill();
  ctx.strokeStyle = '#070408'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const [lx, ph] of [[-20, 0], [-14, 2], [18, 1], [24, 3]]) {
    ctx.beginPath(); ctx.moveTo(x + lx, y - 36); ctx.lineTo(x + lx + Math.sin(t * 8 + ph + i) * 4, y - 2 - Math.abs(st) * 0.3); ctx.stroke();
  }
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 28, y - 46); ctx.quadraticCurveTo(x + 40, y - 36, x + 36 + Math.sin(t * 3) * 2, y - 20); ctx.stroke();
}

function caleche(ctx, t, { lamp = 1, driver = true } = {}) {
  const x = CX, y = CY;
  horse(ctx, x - 110, y, t, 0);
  horse(ctx, x - 96, y + 6, t, 1);
  ctx.strokeStyle = '#070408'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 80, y - 46); ctx.lineTo(x - 30, y - 40); ctx.stroke();
  ctx.fillStyle = '#0a0609';
  ctx.beginPath();
  ctx.moveTo(x - 36, y - 30); ctx.lineTo(x - 30, y - 88); ctx.quadraticCurveTo(x + 15, y - 112, x + 66, y - 88);
  ctx.lineTo(x + 70, y - 30); ctx.quadraticCurveTo(x + 17, y - 18, x - 36, y - 30); ctx.fill();
  ctx.fillStyle = 'rgba(255,170,80,.12)'; ctx.fillRect(x + 4, y - 80, 30, 26);
  ctx.strokeStyle = '#0a0609'; ctx.lineWidth = 3;
  for (const [wx, wr] of [[x - 18, 22], [x + 50, 26]]) {
    ctx.beginPath(); ctx.arc(wx, y - wr + 4, wr, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3 + t * 0.4;
      ctx.beginPath(); ctx.moveTo(wx, y - wr + 4); ctx.lineTo(wx + Math.cos(a) * wr, y - wr + 4 + Math.sin(a) * wr); ctx.stroke();
    }
  }
  ctx.fillStyle = '#0a0609';
  ctx.fillRect(x - 58, y - 66, 26, 6);
  if (driver) {
    ctx.beginPath(); ctx.moveTo(x - 52, y - 66); ctx.lineTo(x - 56, y - 112); ctx.lineTo(x - 40, y - 112); ctx.lineTo(x - 38, y - 66); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 48, y - 120, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 58, y - 132, 20, 8); ctx.fillRect(x - 62, y - 125, 28, 3);
    A.glow(ctx, x - 45, y - 121, 6, '255,40,40', 0.6);
  }
  ctx.strokeStyle = '#0a0609'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(LAMP.x - 8, LAMP.y - 12); ctx.lineTo(LAMP.x - 18, LAMP.y - 12); ctx.stroke();
  A.glow(ctx, LAMP.x, LAMP.y, 40 + lamp * 60, '255,170,80', 0.15 + lamp * 0.5);
  ctx.fillStyle = '#1a1210'; ctx.fillRect(LAMP.x - 6, LAMP.y - 12, 12, 18);
  ctx.fillStyle = `rgba(255,${150 + lamp * 70},90,${0.2 + lamp * 0.8})`;
  ctx.fillRect(LAMP.x - 4, LAMP.y - 9, 8, 12);
}

function pass(ctx, t) {
  A.sky(ctx, t, { moon: { x: 90, y: 120, r: 28 }, bottom: '#2d1530' });
  A.ridge(ctx, 21, 300, 110, '#1a0e24', { jag: 9 });
  A.ridge(ctx, 22, 360, 70, '#120a1a', { jag: 14 });
  A.forest(ctx, 5, 372, '#08050c', { n: 44, hmin: 20, hmax: 50, spread: 30 });
  // road
  ctx.fillStyle = '#1a1218';
  ctx.beginPath(); ctx.moveTo(150, 400); ctx.lineTo(210, 400); ctx.lineTo(360, 640); ctx.lineTo(0, 640); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(200,190,230,.05)';
  ctx.beginPath(); ctx.moveTo(170, 400); ctx.lineTo(190, 400); ctx.lineTo(220, 640); ctx.lineTo(130, 640); ctx.fill();
}

function blueFlame(ctx, x, y, t, life) {
  const a = Math.min(1, life * 2);
  A.glow(ctx, x, y - 8, 34, '90,140,255', 0.55 * a);
  ctx.fillStyle = `rgba(140,180,255,${0.9 * a})`;
  const fl = Math.sin(t * 13 + x) * 2;
  ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x - 6, y - 12, x + fl, y - 22); ctx.quadraticCurveTo(x + 6, y - 12, x + 6, y); ctx.fill();
  ctx.fillStyle = `rgba(230,240,255,${0.9 * a})`;
  ctx.beginPath(); ctx.ellipse(x, y - 6, 2, 5, 0, 0, Math.PI * 2); ctx.fill();
}

function ride() {
  const NEED = 5;
  let lamp = 1, marked = 0, dark = 0, flame = null, spawn = 1.6, r = 200, howlT = 3, el = 0;
  const wolves = Array.from({ length: 8 }, (_, i) => ({ a: (i / 8) * Math.PI * 2 + 0.2, j: Math.random() * 0.3, pose: i % 3 === 0 ? 'howl' : 'stand' }));
  let finished = false;
  const sparks = [];
  const status = (g) => g.prompt(`Tap the lamp to keep it lit · Blue flames marked: ${marked}/${NEED}`);
  const wolfPos = (w) => {
    const rr = r + w.j * 40;
    return { x: CX + 30 + Math.cos(w.a) * rr * 1.15, y: CY - 10 + Math.sin(w.a) * rr * 0.42 };
  };

  return {
    start(g) { status(g); g.sound.pack(); },
    peek: () => ({ lamp, marked, flame: flame && { x: flame.x, y: flame.y - 10 }, lampPos: LAMP }),
    update(dt, g) {
      if (finished) return;
      el += dt;
      lamp = Math.max(0, lamp - dt * (0.1 + marked * 0.014));
      const target = 50 + lamp * 160;
      r += (target - r) * Math.min(1, dt * 1.4);
      for (const w of wolves) w.a += dt * 0.12;
      if (lamp <= 0) {
        dark += dt;
        if (dark > 2.2) { g.die('The lamp guttered out. In the darkness the living ring of wolves closed upon the calèche, and the horses screamed.'); return; }
      } else dark = 0;
      g.sound.heartbeat(lamp < 0.3, 1.8);
      howlT -= dt;
      if (howlT <= 0) { howlT = 5 + Math.random() * 4; g.sound.howl(0, 0.85 + Math.random() * 0.3); }
      if (flame) {
        flame.life -= dt;
        if (flame.life <= 0) flame = null;
      } else {
        spawn -= dt;
        if (spawn <= 0) {
          spawn = 0.9 + Math.random() * 1.2;
          const left = Math.random() < 0.5;
          flame = { x: left ? 30 + Math.random() * 100 : 230 + Math.random() * 100, y: 330 + Math.random() * 60, life: 2.3 };
        }
      }
      for (const s of sparks) { s.t += dt; s.y -= 30 * dt; }
      while (sparks.length && sparks[0].t > 0.6) sparks.shift();
    },
    down(x, y, g) {
      if (finished) return;
      if (Math.hypot(x - LAMP.x, y - LAMP.y) < 42) {
        lamp = Math.min(1, lamp + 0.24);
        g.sound.click();
        for (let i = 0; i < 4; i++) sparks.push({ x: LAMP.x + (Math.random() - 0.5) * 12, y: LAMP.y - 8, t: 0 });
        return;
      }
      if (flame && Math.hypot(x - flame.x, y - (flame.y - 10)) < 36) {
        marked++;
        flame = null;
        g.sound.pickup();
        status(g);
        if (marked >= NEED) {
          finished = true;
          g.sound.heartbeat(false);
          g.prompt(null);
          g.say([
            { text: 'All at once the wolves began to howl as though the moonlight had had some peculiar effect on them. I shouted and beat the side of the calèche.', sfx: (g) => g.sound.pack() },
          ], () => {
            g.endChallenge();
            let rr = r;
            g.cutscene(2.6, (ctx, t, p) => {
              rr = r + p * 260;
              pass(ctx, t);
              caleche(ctx, t, { lamp, driver: false });
              A.count(ctx, 120, 560, 0.8, { t, arms: Math.min(1, p * 2), eyes: 1 });
              for (const w of wolves) {
                const pos = { x: CX + 30 + Math.cos(w.a) * rr * 1.15, y: CY - 10 + Math.sin(w.a) * rr * 0.42 };
                A.wolf(ctx, pos.x, pos.y + 8, 0.6, { pose: 'stand', flip: Math.cos(w.a) < 0 ? false : true, t });
              }
            }, () => {
              g.say([
                { text: 'I heard his voice raised in a tone of imperious command, and saw the driver stand in the roadway.' },
                { text: 'As he swept his long arms, as though brushing aside some impalpable obstacle, the wolves fell back and back further still.' },
                { text: 'Just then a heavy cloud passed across the face of the moon, so that we were again in darkness. I remembered the line my companions had whispered on the coach: “Denn die Todten reiten schnell.” For the dead travel fast.' },
              ], () => g.completeScene());
            });
          });
        }
      }
    },
    draw(ctx, t) {
      // wolves behind and in front of the carriage, sorted by depth
      const ws = wolves.map((w) => ({ w, p: wolfPos(w) })).sort((a, b) => a.p.y - b.p.y);
      for (const { w, p } of ws) if (p.y < CY - 10) A.wolf(ctx, p.x, p.y + 8, 0.55, { pose: w.pose, flip: p.x > CX + 30, t, eyes: false });
      caleche(ctx, t, { lamp });
      for (const { w, p } of ws) if (p.y >= CY - 10) A.wolf(ctx, p.x, p.y + 8, 0.6, { pose: w.pose, flip: p.x > CX + 30, t, eyes: false });
      // darkness pressing in around the lamp
      const lr = 60 + lamp * 230;
      const g = ctx.createRadialGradient(LAMP.x - 40, LAMP.y + 20, lr * 0.3, LAMP.x - 40, LAMP.y + 20, lr);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(2,0,5,${0.32 + (1 - lamp) * 0.58})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, A.W, A.H);
      // eyes glow through the dark
      for (const { w, p } of ws) {
        const flip = p.x > CX + 30;
        const s = p.y < CY - 10 ? 0.55 : 0.6;
        const [ex, ey] = w.pose === 'howl' ? [19, -104] : [45, -46];
        A.eyesInDark(ctx, p.x + (flip ? -ex : ex) * s, p.y + 8 + ey * s, t, 0.55);
      }
      if (flame) blueFlame(ctx, flame.x, flame.y, t, flame.life);
      for (const s of sparks) { ctx.fillStyle = `rgba(255,210,120,${1 - s.t / 0.6})`; ctx.fillRect(s.x, s.y, 2, 2); }
      // lamp oil gauge
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(LAMP.x - 22, LAMP.y + 26, 44, 6);
      ctx.fillStyle = lamp < 0.3 ? '#e0253a' : '#ffb35c'; ctx.fillRect(LAMP.x - 21, LAMP.y + 27, 42 * lamp, 4);
      if (lamp < 0.3) A.sparkle(ctx, LAMP.x, LAMP.y - 2, t * 3, 1);
    },
  };
}

export default {
  id: 'borgo',
  title: 'II · The Borgo Pass',
  chapter: 'Chapter I',
  ambience: 'night',
  bats: 3,
  batArea: { y: 60, h: 180 },
  fog: { y: 520, h: 150, alpha: 0.4 },
  intro: {
    date: '4 May. The Borgo Pass.',
    text: 'The calèche, with four horses, drove up behind us. The horses were coal-black and splendid animals. They were driven by a tall man, with a long brown beard and a great black hat… I could only see the gleam of a pair of very bright eyes, which seemed red in the lamplight.\n\nHe said in excellent German: “The night is chill, mein Herr, and my master the Count bade me take all care of you.”',
  },
  outro: {
    date: '5 May. The Castle.',
    text: 'I must have been asleep, for certainly if I had been fully awake I must have noticed the approach of such a remarkable place. In the gloom the courtyard looked of considerable size…',
  },
  start: 'pass',
  keep: ['letter', 'crucifix'],

  onEnter(g) {
    g.say([
      { text: 'We plunged into the darkness of the pass. The howling of the wolves grew closer.' },
      { text: 'Suddenly, away on our left, I saw a faint flickering blue flame. The driver saw it at the same moment; he at once checked the horses.' },
      { who: 'How to play', text: 'Tap each blue flame so the driver can mark it. Keep tapping the carriage lamp so it does not go out — the wolves fear the light.' },
    ], () => g.startChallenge(ride()));
  },

  hint() {
    return 'Tap the lamp on the carriage whenever it dims, and tap each blue flame as soon as it appears. Five flames, and the night will be over.';
  },

  rooms: {
    pass: {
      draw(ctx, t) { pass(ctx, t); },
      hotspots: [],
    },
  },
};
