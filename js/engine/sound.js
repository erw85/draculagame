// All sound is synthesised with the Web Audio API, so the game ships no audio files.
// Browsers only allow audio after a user gesture, so nothing plays until unlock().

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambKind = null;
    this.amb = null;
    this.heart = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.85;
      this.master.connect(this.ctx.destination);
      this.noiseBuf = this._makeNoise();
      if (this.ambKind) { const k = this.ambKind; this.ambKind = null; this.ambience(k); }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05);
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  _makeNoise() {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _noise() {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    return s;
  }

  _env(gainNode, t, a, peak, d) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(peak, t + a);
    g.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  _osc(type, freq) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    return o;
  }

  // ---------- ambience beds ----------
  ambience(kind) {
    if (kind === this.ambKind) return;
    this.ambKind = kind;
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (this.amb) {
      const old = this.amb;
      old.out.gain.setTargetAtTime(0.0001, t, 0.6);
      setTimeout(() => { old.nodes.forEach(n => { try { n.stop(); } catch (e) { /* not a source */ } }); old.out.disconnect(); clearInterval(old.timer); }, 3000);
      this.amb = null;
    }
    if (!kind || kind === 'none') return;

    const out = ctx.createGain();
    out.gain.value = 0.0001;
    out.gain.setTargetAtTime(1, t, 1.2);
    out.connect(this.master);
    const nodes = [];
    const cfg = {
      night: { wind: 0.32, windF: 450, drone: 0.05, crackle: false, warm: false },
      interior: { wind: 0.12, windF: 260, drone: 0.06, crackle: true, warm: false },
      inn: { wind: 0.06, windF: 300, drone: 0.0, crackle: true, warm: true },
      crypt: { wind: 0.1, windF: 200, drone: 0.09, crackle: false, warm: false },
      cliff: { wind: 0.45, windF: 600, drone: 0.05, crackle: false, warm: false },
    }[kind] || { wind: 0.2, windF: 400, drone: 0.05 };

    // Wind: noise through a slowly swept band-pass.
    const n = this._noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = cfg.windF; bp.Q.value = 0.8;
    const wg = ctx.createGain(); wg.gain.value = cfg.wind;
    const lfo = this._osc('sine', 0.09), lfoG = ctx.createGain(); lfoG.gain.value = cfg.windF * 0.55;
    lfo.connect(lfoG); lfoG.connect(bp.frequency);
    const lfo2 = this._osc('sine', 0.05), lfo2G = ctx.createGain(); lfo2G.gain.value = cfg.wind * 0.6;
    lfo2.connect(lfo2G); lfo2G.connect(wg.gain);
    n.connect(bp); bp.connect(wg); wg.connect(out);
    n.start(); lfo.start(); lfo2.start();
    nodes.push(n, lfo, lfo2);

    // Low drone (A and a dissonant B-flat far below) for unease.
    if (cfg.drone) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
      const dg = ctx.createGain(); dg.gain.value = cfg.drone;
      lp.connect(dg); dg.connect(out);
      for (const f of [55, 58.3, 82.4]) {
        const o = this._osc('sawtooth', f); o.connect(lp); o.start(); nodes.push(o);
      }
      const trem = this._osc('sine', 0.13), tg = ctx.createGain(); tg.gain.value = cfg.drone * 0.5;
      trem.connect(tg); tg.connect(dg.gain); trem.start(); nodes.push(trem);
    }
    if (cfg.warm) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      const dg = ctx.createGain(); dg.gain.value = 0.035;
      lp.connect(dg); dg.connect(out);
      for (const f of [110, 164.8, 220]) { const o = this._osc('triangle', f); o.connect(lp); o.start(); nodes.push(o); }
    }
    let timer = null;
    if (cfg.crackle) {
      timer = setInterval(() => {
        if (!this.ctx || Math.random() < 0.35) return;
        const tt = this.ctx.currentTime + Math.random() * 0.2;
        const s = this._noise(), hp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        hp.type = 'highpass'; hp.frequency.value = 1800 + Math.random() * 2000;
        s.connect(hp); hp.connect(g); g.connect(out);
        this._env(g, tt, 0.002, 0.05 + Math.random() * 0.12, 0.03 + Math.random() * 0.05);
        s.start(tt, Math.random()); s.stop(tt + 0.12);
      }, 140);
    }
    this.amb = { out, nodes, timer };
  }

  // ---------- one-shot effects ----------
  howl(delay = 0, pitch = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 * pitch; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    bp.connect(g); g.connect(this.master);
    const dur = 3.2;
    const vib = this._osc('sine', 5.5), vg = ctx.createGain(); vg.gain.value = 9 * pitch;
    vib.connect(vg);
    for (const [type, mul, lvl] of [['sine', 1, 1], ['triangle', 2.01, 0.25], ['sawtooth', 1, 0.05]]) {
      const o = this._osc(type, 330 * pitch * mul);
      const og = ctx.createGain(); og.gain.value = lvl;
      vg.connect(o.frequency);
      const f = o.frequency;
      f.setValueAtTime(330 * pitch * mul, t);
      f.exponentialRampToValueAtTime(560 * pitch * mul, t + 0.7);
      f.setValueAtTime(560 * pitch * mul, t + 1.8);
      f.exponentialRampToValueAtTime(390 * pitch * mul, t + dur);
      o.connect(og); og.connect(bp);
      o.start(t); o.stop(t + dur + 0.1);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.6);
    g.gain.setValueAtTime(0.32, t + 1.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    vib.start(t); vib.stop(t + dur + 0.1);
  }

  pack() { this.howl(0, 1); this.howl(0.5, 0.86); this.howl(1.1, 1.12); }

  flap() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    for (let i = 0; i < 5; i++) {
      const t = ctx.currentTime + i * 0.055;
      const s = this._noise(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      bp.type = 'bandpass'; bp.frequency.value = 1100 + Math.random() * 400; bp.Q.value = 1.5;
      s.connect(bp); bp.connect(g); g.connect(this.master);
      this._env(g, t, 0.005, 0.18, 0.04);
      s.start(t, Math.random()); s.stop(t + 0.07);
    }
    this.squeak(0.05);
  }

  squeak(delay = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = this._osc('sine', 4200), g = ctx.createGain();
    o.frequency.setValueAtTime(5200, t);
    o.frequency.exponentialRampToValueAtTime(3400, t + 0.06);
    o.connect(g); g.connect(this.master);
    this._env(g, t, 0.004, 0.05, 0.06);
    o.start(t); o.stop(t + 0.1);
  }

  screech() {
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) this.squeak(i * 0.09);
  }

  creak() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = this._osc('sawtooth', 70), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 6;
    o.frequency.setValueAtTime(60, t);
    o.frequency.linearRampToValueAtTime(110, t + 0.5);
    o.frequency.linearRampToValueAtTime(75, t + 0.9);
    const w = this._osc('square', 23), wg = ctx.createGain(); wg.gain.value = 25;
    w.connect(wg); wg.connect(o.frequency);
    o.connect(bp); bp.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    o.start(t); w.start(t); o.stop(t + 1.05); w.stop(t + 1.05);
  }

  thud(delay = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = this._osc('sine', 90), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
    o.connect(g); g.connect(this.master);
    this._env(g, t, 0.005, 0.7, 0.4);
    o.start(t); o.stop(t + 0.5);
  }

  door() { this.creak(); this.thud(0.95); }

  shatter() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    for (let i = 0; i < 14; i++) {
      const t = ctx.currentTime + Math.random() * 0.35;
      const o = this._osc('sine', 2000 + Math.random() * 4000), g = ctx.createGain();
      o.connect(g); g.connect(this.master);
      this._env(g, t, 0.002, 0.06, 0.15 + Math.random() * 0.3);
      o.start(t); o.stop(t + 0.6);
    }
    const s = this._noise(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 3000;
    s.connect(hp); hp.connect(g); g.connect(this.master);
    this._env(g, ctx.currentTime, 0.003, 0.35, 0.25);
    s.start(); s.stop(ctx.currentTime + 0.4);
  }

  // "Like the intolerable, tingling sweetness of water-glasses" - the women's laugh.
  laugh() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const notes = [1568, 1760, 1480, 1661, 1397, 1568, 1319];
    notes.forEach((f, i) => {
      const t = ctx.currentTime + i * 0.085 + Math.random() * 0.02;
      const o = this._osc('sine', f * (1 + (Math.random() - 0.5) * 0.02)), g = ctx.createGain();
      const v = this._osc('sine', 7), vg = ctx.createGain(); vg.gain.value = 12;
      v.connect(vg); vg.connect(o.frequency);
      o.connect(g); g.connect(this.master);
      this._env(g, t, 0.01, 0.08, 0.5);
      o.start(t); v.start(t); o.stop(t + 0.6); v.stop(t + 0.6);
    });
  }

  sting() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, t);
    lp.frequency.exponentialRampToValueAtTime(2400, t + 0.4);
    lp.frequency.exponentialRampToValueAtTime(200, t + 3);
    const g = ctx.createGain();
    lp.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    for (const f of [110, 116.5, 155.6, 164.8, 233]) {
      const o = this._osc('sawtooth', f); o.connect(lp); o.start(t); o.stop(t + 3.3);
    }
    this.thud(0);
  }

  chime() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    [440, 523.3, 659.3, 880].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.13;
      const o = this._osc('sine', f), g = ctx.createGain();
      o.connect(g); g.connect(this.master);
      this._env(g, t, 0.01, 0.12, 1.2);
      o.start(t); o.stop(t + 1.4);
    });
  }

  click() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = this._osc('triangle', 520), g = ctx.createGain();
    o.connect(g); g.connect(this.master);
    this._env(g, t, 0.002, 0.08, 0.06);
    o.start(t); o.stop(t + 0.1);
  }

  pickup() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    [660, 990].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.08;
      const o = this._osc('sine', f), g = ctx.createGain();
      o.connect(g); g.connect(this.master);
      this._env(g, t, 0.005, 0.12, 0.35);
      o.start(t); o.stop(t + 0.45);
    });
  }

  gust() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = this._noise(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(1100, t + 1);
    bp.frequency.exponentialRampToValueAtTime(350, t + 2.4);
    s.connect(bp); bp.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
    s.start(t); s.stop(t + 2.6);
  }

  scrape() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = this._noise(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    s.connect(lp); lp.connect(g); g.connect(this.master);
    this._env(g, t, 0.01, 0.25, 0.18);
    s.start(t, Math.random()); s.stop(t + 0.25);
  }

  crumble() {
    if (!this.ctx) return;
    for (let i = 0; i < 6; i++) setTimeout(() => this.scrape(), i * 60);
    this.thud(0.1);
  }

  // A few bars of a minor-key song for the Szgany, with a drum.
  song() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const mel = [0, 3, 4, 7, 8, 7, 4, 3, 4, 0, -1, 0];
    const base = 220;
    mel.forEach((s, i) => {
      const t = ctx.currentTime + i * 0.32;
      const o = this._osc('triangle', base * Math.pow(2, s / 12)), g = ctx.createGain();
      o.connect(g); g.connect(this.master);
      this._env(g, t, 0.02, 0.12, 0.28);
      o.start(t); o.stop(t + 0.35);
      if (i % 2 === 0) this.thud(i * 0.32);
    });
  }

  heartbeat(on, rate = 1.1) {
    if (this.heart) { clearInterval(this.heart); this.heart = null; }
    if (!on || !this.ctx) return;
    const beat = () => { this.thud(0); this.thud(0.18); };
    beat();
    this.heart = setInterval(beat, 1000 / rate);
  }
}
