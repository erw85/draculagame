import * as A from '../art/draw.js';

// The prologue: who Jonathan Harker is, and why he is travelling to Castle Dracula.
// Five illustrated "slides", each narrated in the text box.

const { W, H } = A;

// ---------------------------------------------------------------- slide art
function caption(ctx, title, sub) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(0, 54, W, sub ? 58 : 40);
  ctx.font = '22px "UnifrakturMaguntia", serif';
  ctx.fillStyle = '#ead9f2';
  ctx.shadowColor = 'rgba(200,30,60,.7)'; ctx.shadowBlur = 10;
  ctx.fillText(title, W / 2, 82);
  ctx.shadowBlur = 0;
  if (sub) { ctx.font = 'italic 13px "IM Fell English", serif'; ctx.fillStyle = '#bfaed6'; ctx.fillText(sub, W / 2, 102); }
  ctx.restore();
}

// Mr. Hawkins' office in Exeter, on a grey, rainy day.
function office(ctx, t) {
  A.woodWall(ctx, 0, 0, W, 470, { seed: 14, base: '#3a2616' });
  // a tall window full of rain
  const x = 214, y = 130, w = 110, h = 190;
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#8a8f9c'); g.addColorStop(1, '#4a4e5a');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#3a3e48';
  for (let i = 0; i < 7; i++) ctx.fillRect(x + i * 16, y + h - 40 - (i % 3) * 14, 14, 40 + (i % 3) * 14); // Exeter roofs
  ctx.strokeStyle = 'rgba(220,225,240,.35)'; ctx.lineWidth = 0.8;
  for (let i = 0; i < 26; i++) {
    const rx = x + ((i * 37) % w), ry = y + ((i * 53 + t * 260) % h);
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 2, ry + 9); ctx.stroke();
  }
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  // shelves of deed boxes
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const bx = 22 + c * 40, by = 150 + r * 56;
    ctx.fillStyle = r === 1 && c === 2 ? '#2a3a2a' : '#1e1a24'; ctx.fillRect(bx, by, 34, 44);
    ctx.fillStyle = '#e7d9b8'; ctx.fillRect(bx + 8, by + 8, 18, 8);
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(bx + 14, by + 26, 6, 4);
  }
  A.floor(ctx, 470, '#22160e');
  // the desk, heaped with papers
  ctx.fillStyle = '#3a2412'; ctx.fillRect(30, 470, 300, 14);
  ctx.fillStyle = '#24160a'; ctx.fillRect(40, 484, 280, 90);
  const pr = A.rng(3);
  for (let i = 0; i < 9; i++) {
    ctx.save(); ctx.translate(70 + pr() * 200, 462 + pr() * 6); ctx.rotate((pr() - 0.5) * 0.3);
    ctx.fillStyle = '#e9dcbf'; ctx.fillRect(-18, -4, 36, 8);
    ctx.fillStyle = 'rgba(60,40,20,.5)'; ctx.fillRect(-14, -2, 24, 1);
    ctx.restore();
  }
  ctx.fillStyle = '#111'; ctx.fillRect(250, 452, 12, 14);
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(256, 452); ctx.lineTo(266, 430); ctx.stroke();
  A.candle(ctx, 96, 466, t, 1.1);
  A.jonathanBack(ctx, 176, 660, 1.35);
}

// Hawkins' letter, with the Count's reply beside it, sealed in red.
function letters(ctx, t) {
  A.woodWall(ctx, 0, 0, W, H, { seed: 22, base: '#2e1e12' });
  A.glow(ctx, 180, 330, 300, '255,170,90', 0.18);
  const sheet = (x, y, w, h, rot, lines, seed) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, w);
    g.addColorStop(0, '#f1e6c8'); g.addColorStop(1, '#c9b48a');
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    const r = A.rng(seed);
    ctx.strokeStyle = 'rgba(40,25,15,.75)'; ctx.lineWidth = 0.9;
    for (let i = 0; i < lines; i++) {
      const ly = -h / 2 + 30 + i * 13, len = (i === lines - 1 ? 0.4 : 0.8 + r() * 0.15) * (w - 40);
      ctx.beginPath(); ctx.moveTo(-w / 2 + 20, ly);
      for (let k = 0; k < len; k += 4) ctx.lineTo(-w / 2 + 20 + k, ly + Math.sin(k * 0.9 + i) * 1.6 + (r() - 0.5));
      ctx.stroke();
    }
    ctx.restore();
  };
  sheet(150, 330, 210, 290, -0.08, 16, 5);
  sheet(250, 470, 150, 110, 0.12, 4, 9);
  // the Count's wax seal
  ctx.save(); ctx.translate(268, 500);
  A.glow(ctx, 0, 0, 30, '160,0,20', 0.3);
  ctx.fillStyle = '#8a0e18'; ctx.beginPath();
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, rr = 14 + (i % 2) * 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.fill();
  ctx.fillStyle = '#5a060e'; ctx.font = 'bold 15px "UnifrakturMaguntia", serif'; ctx.textAlign = 'center'; ctx.fillText('D', 0, 5);
  ctx.restore();
  // quill
  ctx.strokeStyle = '#e8e2d2'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 520); ctx.quadraticCurveTo(110, 470, 170, 440); ctx.stroke();
  A.candle(ctx, 300, 300, t, 1.2);
}

// A small portrait of Mina, by candlelight.
function mina(ctx, t) {
  A.woodWall(ctx, 0, 0, W, H, { seed: 31, base: '#2a1a14' });
  A.glow(ctx, 180, 300, 260, '255,180,110', 0.22);
  const cx = 180, cy = 300;
  // gilt oval frame
  ctx.fillStyle = '#7a5a20'; ctx.beginPath(); ctx.ellipse(cx, cy, 104, 134, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.ellipse(cx, cy, 96, 126, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, 86, 116, 0, 0, Math.PI * 2); ctx.clip();
  const bg = ctx.createRadialGradient(cx - 20, cy - 40, 10, cx, cy, 130);
  bg.addColorStop(0, '#6a5a4a'); bg.addColorStop(1, '#241a14');
  ctx.fillStyle = bg; ctx.fillRect(cx - 90, cy - 120, 180, 240);
  // high-collared dress
  ctx.fillStyle = '#2a2236';
  ctx.beginPath(); ctx.moveTo(cx - 80, cy + 120); ctx.quadraticCurveTo(cx - 70, cy + 40, cx - 22, cy + 30); ctx.lineTo(cx + 22, cy + 30); ctx.quadraticCurveTo(cx + 70, cy + 40, cx + 80, cy + 120); ctx.fill();
  ctx.fillStyle = '#e8e0d4'; ctx.fillRect(cx - 11, cy + 14, 22, 20);
  ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(cx, cy + 36, 3, 0, Math.PI * 2); ctx.fill();
  // hair, pinned up
  ctx.fillStyle = '#3a2214';
  ctx.beginPath(); ctx.ellipse(cx, cy - 34, 34, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy - 60, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
  // face
  const fg = ctx.createRadialGradient(cx - 6, cy - 22, 4, cx, cy - 14, 32);
  fg.addColorStop(0, '#f4e2cf'); fg.addColorStop(1, '#c49a80');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(cx, cy - 14, 24, 31, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2214';
  ctx.beginPath(); ctx.moveTo(cx - 26, cy - 22); ctx.quadraticCurveTo(cx - 10, cy - 52, cx + 2, cy - 44); ctx.quadraticCurveTo(cx + 14, cy - 52, cx + 26, cy - 22); ctx.quadraticCurveTo(cx + 10, cy - 40, cx, cy - 38); ctx.quadraticCurveTo(cx - 10, cy - 40, cx - 26, cy - 22); ctx.fill();
  // gentle eyes, a small smile
  ctx.fillStyle = '#3a2a24';
  ctx.beginPath(); ctx.ellipse(cx - 9, cy - 16, 3, 1.8, 0, 0, Math.PI * 2); ctx.ellipse(cx + 9, cy - 16, 3, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(cx - 13, cy - 21); ctx.quadraticCurveTo(cx - 9, cy - 23, cx - 5, cy - 21); ctx.moveTo(cx + 5, cy - 21); ctx.quadraticCurveTo(cx + 9, cy - 23, cx + 13, cy - 21); ctx.stroke();
  ctx.strokeStyle = '#9a6050'; ctx.beginPath(); ctx.moveTo(cx, cy - 13); ctx.lineTo(cx + 1, cy - 6); ctx.stroke();
  ctx.strokeStyle = '#a04a48'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx - 6, cy + 2); ctx.quadraticCurveTo(cx, cy + 5, cx + 6, cy + 2); ctx.stroke();
  ctx.fillStyle = 'rgba(200,110,100,.2)'; ctx.beginPath(); ctx.ellipse(cx - 14, cy - 4, 6, 4, 0, 0, Math.PI * 2); ctx.ellipse(cx + 14, cy - 4, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
  A.texture(ctx, cx - 90, cy - 120, 180, 240, 0.3, 'overlay', 1);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.ellipse(cx - 30, cy - 60, 30, 50, -0.4, 0, Math.PI * 2); ctx.fill();
  // the journal and pen in front
  ctx.save(); ctx.translate(180, 520); ctx.rotate(-0.06);
  ctx.fillStyle = '#4a1e16'; ctx.fillRect(-70, -26, 140, 52);
  ctx.fillStyle = '#efe3c6'; ctx.fillRect(-64, -22, 62, 44); ctx.fillRect(2, -22, 62, 44);
  ctx.strokeStyle = 'rgba(40,25,15,.7)'; ctx.lineWidth = 0.9;
  for (let i = 0; i < 6; i++) for (const side of [-60, 6]) {
    ctx.beginPath(); ctx.moveTo(side, -14 + i * 6);
    for (let k = 0; k < 52; k += 3) ctx.lineTo(side + k, -14 + i * 6 + Math.sin(k + i) * 1.5); // shorthand squiggles
    ctx.stroke();
  }
  ctx.restore();
  A.candle(ctx, 300, 520, t, 1.2);
}

// The journey east: London to Bistritz, with a little train travelling the line.
const PX = (lon) => (lon + 5) * 9.5 + 10;
const PY = (lat) => (57 - lat) * 21 + 96;
const CITIES = [
  ['London', -0.13, 51.5, -40, -6], ['Munich', 11.6, 48.1, -18, 16], ['Vienna', 16.4, 48.2, -14, -9],
  ['Buda-Pesth', 19.05, 47.5, -52, 15], ['Klausenburg', 23.6, 46.77, -24, 20], ['Bistritz', 24.5, 47.13, -14, -9],
];
const ROUTE = [[-0.13, 51.5], [1.3, 51.12], [1.85, 50.95], [4.4, 50.85], [8.7, 50.1], [11.6, 48.1], [13.0, 47.8], [16.4, 48.2], [19.05, 47.5], [21.9, 47.05], [23.6, 46.77], [24.5, 47.13]];
const BRITAIN = [[-5.7, 50.06], [-3.5, 50.2], [-1.3, 50.77], [0.25, 50.74], [1.38, 51.15], [0.9, 51.42], [1.6, 52.08], [1.75, 52.48], [0.4, 52.82], [0.13, 53.6], [-0.08, 54.12], [-1.42, 55.02], [-2.0, 55.8], [-2.4, 56.6], [-5.0, 56.6], [-5.7, 55.3], [-4.95, 55.05], [-3.4, 54.3], [-3.05, 53.45], [-4.6, 53.4], [-4.1, 52.75], [-5.3, 51.88], [-3.25, 51.42], [-4.2, 51.18], [-5.0, 50.55]];
const COASTS = [
  [[-4.5, 48.4], [-1.6, 49.6], [0.2, 49.6], [1.6, 50.9], [3.2, 51.3], [4.5, 52.5], [5.0, 53.3], [7.0, 53.6], [8.6, 53.9], [8.6, 55.3], [8.2, 56.8]],
  [[10.0, 54.4], [12.0, 54.2], [14.0, 53.9], [18.0, 54.6], [21.0, 54.9], [21.0, 57.0]],
  [[12.3, 45.4], [13.7, 45.6], [14.5, 45.2], [15.2, 44.2], [16.4, 43.5], [18.1, 42.6], [19.4, 41.9]],
  [[27.8, 43.2], [28.6, 44.2], [29.7, 45.2], [30.7, 46.5]],
];
const DANUBE = [[8.2, 48.0], [10.9, 48.7], [13.4, 48.6], [16.4, 48.2], [17.1, 48.1], [18.9, 47.8], [19.05, 47.5], [18.9, 46.0], [19.5, 45.2], [20.4, 44.8], [22.5, 44.6], [25.0, 43.7], [28.0, 44.5]];
const CARPATHIANS = [[18, 49.2], [19.5, 49.4], [21, 49.3], [22.5, 49], [23.8, 48.3], [24.6, 47.7], [25.3, 47.2], [25.8, 46.4], [25.6, 45.7], [24.5, 45.5], [23, 45.4], [22.3, 45.7]];
const ALPS = [[6.5, 46], [7.6, 46.4], [8.8, 46.6], [10, 46.8], [11.2, 47], [12.4, 47.1], [13.6, 47.2], [14.8, 47.3]];

function journeyMap(ctx, t, el) {
  ctx.fillStyle = '#120a0c'; ctx.fillRect(0, 0, W, H);
  A.layer(ctx, 'prologue-map', 0, 120, W, 340, (c) => {
    const g = c.createRadialGradient(180, 290, 30, 180, 290, 260);
    g.addColorStop(0, '#ead9b0'); g.addColorStop(1, '#a88a5a');
    c.fillStyle = g; c.fillRect(6, 124, W - 12, 332);
    A.texture(c, 6, 124, W - 12, 332, 0.4, 'overlay', 1);
    c.save(); c.beginPath(); c.rect(6, 124, W - 12, 332); c.clip();
    // sea tint and coasts
    c.fillStyle = 'rgba(80,110,130,.25)';
    c.beginPath(); c.moveTo(PX(-6), PY(57)); c.lineTo(PX(8.6), PY(57)); for (const [lo, la] of COASTS[0].slice().reverse()) c.lineTo(PX(lo), PY(la)); c.lineTo(PX(-6), PY(48)); c.fill();
    c.fillStyle = '#ead9b0'; c.strokeStyle = '#6b4a2a'; c.lineWidth = 0.9;
    c.beginPath(); BRITAIN.forEach(([lo, la], i) => (i ? c.lineTo(PX(lo), PY(la)) : c.moveTo(PX(lo), PY(la)))); c.closePath(); c.fill(); c.stroke();
    for (const line of COASTS) { c.beginPath(); line.forEach(([lo, la], i) => (i ? c.lineTo(PX(lo), PY(la)) : c.moveTo(PX(lo), PY(la)))); c.stroke(); }
    c.strokeStyle = 'rgba(70,100,140,.8)'; c.lineWidth = 1.3;
    c.beginPath(); DANUBE.forEach(([lo, la], i) => (i ? c.lineTo(PX(lo), PY(la)) : c.moveTo(PX(lo), PY(la)))); c.stroke();
    // mountains as little peaks
    c.fillStyle = 'rgba(90,60,40,.75)';
    for (const [lo, la] of [...ALPS, ...CARPATHIANS]) {
      const x = PX(lo), y = PY(la);
      c.beginPath(); c.moveTo(x - 5, y + 3); c.lineTo(x, y - 5); c.lineTo(x + 5, y + 3); c.fill();
    }
    c.font = 'italic 9px "IM Fell English", serif'; c.fillStyle = '#5a3a20';
    c.fillText('Carpathian Mountains', PX(17.8), PY(50.1));
    c.fillText('R. Danube', PX(20.5), PY(44.2));
    c.fillText('ENGLAND', PX(-3.6), PY(52.4));
    c.fillText('TRANSYLVANIA', PX(22.6), PY(44.9));
    c.restore();
    c.strokeStyle = '#4a3018'; c.lineWidth = 3; c.strokeRect(6, 124, W - 12, 332);
  });
  // the line travelled so far
  const pts = ROUTE.map(([lo, la]) => [PX(lo), PY(la)]);
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  const prog = Math.min(1, Math.max(0, el) / 9) * total;
  const cum = [0]; segs.forEach((s, i) => cum.push(cum[i] + s));
  ctx.strokeStyle = '#8a0e18'; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(...pts[0]);
  let d = 0, tip = pts[0];
  for (let i = 0; i < segs.length; i++) {
    if (d + segs[i] <= prog) { ctx.lineTo(...pts[i + 1]); d += segs[i]; tip = pts[i + 1]; continue; }
    const k = (prog - d) / segs[i];
    tip = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    ctx.lineTo(...tip); break;
  }
  ctx.stroke(); ctx.setLineDash([]);
  // cities appear as the train reaches them
  ctx.font = '10px "IM Fell English", serif';
  for (const [name, lo, la, dx, dy] of CITIES) {
    const x = PX(lo), y = PY(la);
    const ri = ROUTE.findIndex(([a, b]) => a === lo && b === la);
    const reached = prog >= cum[ri] - 0.5;
    ctx.fillStyle = '#2b1a10'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = reached ? 1 : 0.45;
    ctx.fillText(name, x + dx, y + dy);
    ctx.globalAlpha = 1;
  }
  // a small locomotive with a plume of smoke
  ctx.save(); ctx.translate(tip[0], tip[1]);
  ctx.fillStyle = '#1a1010'; ctx.fillRect(-7, -6, 14, 7); ctx.fillRect(3, -11, 4, 6);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(90,80,80,${0.5 - i * 0.1})`; ctx.beginPath(); ctx.arc(5 - i * 6, -14 - i * 3 + Math.sin(t * 3 + i) * 1.5, 3 + i, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  if (prog >= total) A.sparkle(ctx, PX(24.5), PY(47.13), t * 2, 1, '255,80,80');
}

// The Carpathians at dusk: somewhere among them, the castle.
function carpathians(ctx, t) {
  A.sky(ctx, t, { moon: { x: 90, y: 150, r: 26 }, top: '#0a0612', mid: '#2a1430', bottom: '#6a3040' });
  A.ridge(ctx, 71, 380, 150, '#1e1028', { jag: 7 });
  A.castle(ctx, 250, 300, 0.45, t);
  A.ridge(ctx, 72, 450, 80, '#120a1a', { jag: 11 });
  A.forest(ctx, 31, 470, '#08050c', { n: 50, hmin: 16, hmax: 40, spread: 40 });
  A.fog(ctx, t, { y: 480, h: 140, alpha: 0.5 });
  // a road winding up into the hills
  ctx.strokeStyle = 'rgba(160,140,170,.25)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(180, 640); ctx.quadraticCurveTo(80, 560, 170, 520); ctx.quadraticCurveTo(240, 490, 200, 470); ctx.stroke();
}

const SLIDES = [
  { title: 'Exeter, England', sub: 'Spring', draw: office },
  { title: 'A Letter to Transylvania', sub: null, draw: letters },
  { title: 'Mina', sub: null, draw: mina },
  { title: 'London to Bistritz', sub: 'by rail, across Europe', draw: journeyMap },
  { title: 'The Carpathians', sub: 'the edge of the known world', draw: carpathians },
];

const J = (text) => ({ who: 'Jonathan’s Journal', text });
const STORY = [
  [
    { text: 'Jonathan Harker is a young clerk in the office of Mr. Peter Hawkins, a solicitor of Exeter. He has just sat his final examinations, and is waiting to hear whether he has passed.' },
    { text: 'A foreign nobleman has written to the firm. Count Dracula, of Transylvania, wishes to buy a house in England: a great old house, near London, with high walls and plenty of room.' },
    { text: 'Jonathan has found him one. Carfax, an ancient walled estate at Purfleet, on the Thames. Now the deeds must be signed, and the Count has a great many questions about England.' },
  ],
  [
    { text: 'Mr. Hawkins ought to go himself. Instead, he writes to the Count:' },
    { who: 'Mr. Hawkins', text: '“I must regret that an attack of gout, from which malady I am a constant sufferer, forbids absolutely any travelling on my part for some time to come; but I am happy to say I can send a sufficient substitute, one in whom I have every possible confidence.”' },
    { who: 'Mr. Hawkins', text: '“He is a young man, full of energy and talent in his own way, and of a very faithful disposition. He is discreet and silent, and has grown into manhood in my service.”' },
    { text: 'So it is Jonathan who must cross Europe, carrying the deeds of Carfax, to the Count’s castle in the Carpathian Mountains. The Count’s reply came sealed in red wax.' },
  ],
  [
    { text: 'He leaves behind Mina Murray, an assistant schoolmistress, whom he means to marry when he comes home.' },
    { text: 'Mina has been practising shorthand, so that one day she can help him in his work. He has promised to keep a journal of everything he sees, to talk over with her when he returns.' },
    { text: 'Its pages soon fill with little notes for her. At Klausenburg, after a supper of chicken done up with red pepper: “Mem., get recipe for Mina.”' },
  ],
  [
    { text: 'He takes the train east from London: across the Channel, through Germany to Munich, then Vienna.' },
    J('“The impression I had was that we were leaving the West and entering the East.”'),
    J('“It seems to me that the further east you go the more unpunctual are the trains. What ought they to be in China?”'),
    { text: 'From Buda-Pesth to Klausenburg, and on by slow train to Bistritz, the last town before the Borgo Pass.' },
  ],
  [
    { text: 'Before leaving London, Jonathan read everything about Transylvania that he could find in the library of the British Museum.' },
    J('“I was not able to light on any map or work giving the exact locality of the Castle Dracula, as there are no maps of this country as yet to compare with our own Ordnance Survey maps.”'),
    J('“I read that every known superstition in the world is gathered into the horseshoe of the Carpathians, as if it were the centre of some sort of imaginative whirlpool; if so my stay may be very interesting.”'),
    { text: 'The Count has written that a room is waiting for him at the Golden Krone in Bistritz. It is the third of May. Tomorrow is the eve of St. George’s Day.', sfx: (g) => g.sound.pack() },
  ],
];

function show(g, i) {
  g.set('slide', i);
  g.set('slideT', g.t);
  g.fadeA = 1;
  if (i === 3) g.sound.ambience('night');
  g.say(STORY[i], () => {
    if (i + 1 < SLIDES.length) show(g, i + 1);
    else g.completeScene();
  });
}

export default {
  id: 'prologue',
  title: 'Prologue',
  chapter: 'Prologue',
  ambience: 'interior',
  start: 'slides',
  keep: [],

  onEnter(g) { show(g, g.flag('slide') || 0); },

  hint() { return 'Tap to read on. Your journey begins at Bistritz.'; },

  rooms: {
    slides: {
      vignette: 0.9,
      draw(ctx, t, g) {
        const i = g.flag('slide') || 0, s = SLIDES[i];
        s.draw(ctx, t, t - (g.flag('slideT') ?? t));
        caption(ctx, s.title, s.sub);
      },
      hotspots: [],
    },
  },
};
