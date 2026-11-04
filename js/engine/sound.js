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
      this.attach(new AC());
      if (this.ambKind) { const k = this.ambKind; this.ambKind = null; this.ambience(k); }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // Wire up an audio context (a live one, or an OfflineAudioContext for rendering to a file).
  attach(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;
    this.master.connect(ctx.destination);
    this.noiseBuf = this._makeNoise();
    this._makeReverb();
  }

  // A long, darkening tail with a few echoes off the valley walls, for the howls.
  _makeReverb() {
    const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * 3.6);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const u = i / len;
        const k = 0.3 + 0.65 * u; // smoother noise later = darker tail
        lp = lp * k + (Math.random() * 2 - 1) * (1 - k);
        d[i] = lp * Math.pow(1 - u, 2.4) * Math.min(1, i / (sr * 0.03)) * 2.2;
      }
      for (const [at, a] of [[0.29, 0.5], [0.52, 0.32], [0.94, 0.2], [1.5, 0.1]]) {
        const j = Math.floor((at + ch * 0.017) * sr);
        for (let k = 0; k < sr * 0.04 && j + k < len; k++) d[j + k] += (Math.random() * 2 - 1) * a * (1 - k / (sr * 0.04));
      }
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = buf;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 3200;
    const wet = ctx.createGain(); wet.gain.value = 0.7;
    this.reverb.connect(tone); tone.connect(wet); wet.connect(this.master);
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
  // One wolf's howl. Real howls are nearly pure tones: a swoop up, a long held note that
  // wavers slowly (sometimes breaking upward), then a sagging fall. The mouth opens from
  // "oo" to "ah" and closes again, which we imitate by sweeping a filter.
  howl(delay = 0, pitch = 1, o = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t0 = ctx.currentTime + delay, r = Math.random;
    const f0 = 400 * pitch * (0.94 + r() * 0.12);
    const dur = o.dur ?? 3.8 + r() * 2.4;
    const dist = o.dist ?? 0.3 + r() * 0.5; // 0 = close, 1 = far down the valley
    const pan = o.pan ?? r() * 1.4 - 0.7;
    const broken = o.brk ?? r() < 0.45;

    // pitch contour
    const N = 400, f = new Float32Array(N);
    const ph = [r() * 6, r() * 6, r() * 6];
    const bAt = 0.34 + r() * 0.22, bLen = 0.1 + r() * 0.1, bUp = 1.1 + r() * 0.12;
    const smooth = (e0, e1, x) => { const k = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      let m = 0.7 + 0.33 * smooth(0, 0.15, u) - 0.03 * smooth(0.15, 0.25, u);
      m *= 1 + 0.018 * Math.sin(u * dur * 1.1 + ph[0]) + 0.011 * Math.sin(u * dur * 2.6 + ph[1]) + 0.005 * Math.sin(u * dur * 6.3 + ph[2]);
      if (broken) m *= 1 + (bUp - 1) * smooth(bAt, bAt + 0.015, u) * (1 - smooth(bAt + bLen, bAt + bLen + 0.015, u));
      m *= 1 - 0.3 * smooth(0.7, 1, u) * smooth(0.7, 1, u);
      f[i] = f0 * m;
    }
    // loudness: soft start, a slight swell, a long fade
    const amp = new Float32Array(N), peak = 0.24 * (1 - dist * 0.45);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      amp[i] = peak * smooth(0, 0.1, u) * (1 - smooth(0.78, 1, u)) * (0.9 + 0.1 * Math.sin(u * Math.PI * 1.3));
    }
    // mouth shape: a filter that opens then closes
    const mouth = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      mouth[i] = f0 * (1.3 + 2.4 * smooth(0, 0.2, u) - 0.5 * smooth(0.3, 0.6, u) - 1.6 * smooth(0.7, 1, u));
    }

    // voice: a nearly pure tone with faint harmonics
    const wave = ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0]), new Float32Array([0, 1, 0.13, 0.05, 0.02, 0.008]));
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(wave);
    osc.frequency.setValueCurveAtTime(f, t0, dur);
    // a little tremor that grows toward the end
    const trem = ctx.createOscillator(); trem.frequency.value = 4.5 + r() * 2;
    const tremG = ctx.createGain();
    tremG.gain.setValueAtTime(0, t0); tremG.gain.linearRampToValueAtTime(f0 * 0.006, t0 + dur);
    trem.connect(tremG); tremG.connect(osc.frequency);

    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8;
    lp.frequency.setValueCurveAtTime(mouth, t0, dur);
    const env = ctx.createGain(); env.gain.value = 0;
    env.gain.setValueCurveAtTime(amp, t0, dur);
    osc.connect(lp); lp.connect(env);

    // breath: noise tuned around the voice, plus a little air
    const breath = this._noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 7;
    bp.frequency.setValueCurveAtTime(f, t0, dur);
    const bg = ctx.createGain(); bg.gain.value = 0.9;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const ag = ctx.createGain(); ag.gain.value = 0.012;
    breath.connect(bp); bp.connect(bg); bg.connect(env);
    breath.connect(hp); hp.connect(ag); ag.connect(env);

    // distance: farther wolves are duller, quieter and more echoey
    const far = ctx.createBiquadFilter(); far.type = 'lowpass'; far.frequency.value = 7000 - dist * 5200;
    env.connect(far);
    let out = far;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; far.connect(p); out = p; }
    const dry = ctx.createGain(); dry.gain.value = 1 - dist * 0.55;
    const send = ctx.createGain(); send.gain.value = 0.35 + dist * 0.7;
    out.connect(dry); dry.connect(this.master);
    if (this.reverb) { out.connect(send); send.connect(this.reverb); }

    osc.start(t0); trem.start(t0); breath.start(t0, r());
    const end = t0 + dur + 0.05;
    osc.stop(end); trem.stop(end); breath.stop(end);
  }

  // A short rising yip, as younger wolves give during a chorus.
  yip(delay = 0, pitch = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = 'triangle';
    const f = 700 * pitch;
    o.frequency.setValueAtTime(f * 0.7, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.09);
    o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.22);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    const g = ctx.createGain();
    o.connect(lp); lp.connect(g);
    this._env(g, t, 0.02, 0.09, 0.2);
    const send = ctx.createGain(); send.gain.value = 0.8;
    g.connect(this.master);
    if (this.reverb) { g.connect(send); send.connect(this.reverb); }
    o.start(t); o.stop(t + 0.3);
  }

  // A chorus: wolves join one after another, each on a different pitch.
  pack() {
    if (!this.ctx) return;
    const r = Math.random;
    const voices = [
      { d: 0, p: 1.0, dur: 5.6, dist: 0.25, pan: -0.25 },
      { d: 0.9, p: 1.24, dur: 4.8, dist: 0.45, pan: 0.5 },
      { d: 1.9, p: 0.8, dur: 5.2, dist: 0.6, pan: -0.65 },
      { d: 2.8, p: 1.45, dur: 3.6, dist: 0.8, pan: 0.75 },
    ];
    for (const v of voices) this.howl(v.d, v.p * (0.96 + r() * 0.08), { dur: v.dur, dist: v.dist, pan: v.pan });
    this.yip(3.3, 1.1);
    this.yip(3.75, 1.25);
    this.yip(4.5, 1.05);
  }

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
