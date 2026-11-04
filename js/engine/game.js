import { W, H, vignette, fog, sparkle } from '../art/draw.js';
import { Bats } from '../art/bats.js';
import { ITEMS } from '../items.js';
import { Sound } from './sound.js';
import * as save from './save.js';

const HINTS_PER_CHAPTER = 3;
const clone = (o) => JSON.parse(JSON.stringify(o));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Game {
  constructor({ scenes, drawTitle }) {
    this.scenes = scenes;
    this.drawTitle = drawTitle;
    this.stage = document.getElementById('stage');
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.el = {
      topbar: document.getElementById('topbar'),
      title: document.getElementById('scene-title'),
      hint: document.getElementById('btn-hint'),
      hintCount: document.getElementById('hint-count'),
      menu: document.getElementById('btn-menu'),
      prompt: document.getElementById('prompt'),
      textbox: document.getElementById('textbox'),
      speaker: document.getElementById('speaker'),
      text: document.getElementById('text'),
      inv: document.getElementById('inventory'),
      overlay: document.getElementById('overlay'),
    };
    this.sound = new Sound();
    this.bats = new Bats();
    this.t = 0;
    this.mode = 'title';
    this.state = null;
    this.checkpoint = null;
    this.challenge = null;
    this.queue = [];
    this.typing = null;
    this.onTextDone = null;
    this.fadeA = 1;
    this.ripples = [];
    const saved = save.load();
    this.saved = saved && saved.checkpoint ? saved : null;
    this.sound.muted = !!(saved && saved.muted);
  }

  // ------------------------------------------------------------ boot & loop
  boot() {
    const resize = () => this.resize();
    window.addEventListener('resize', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    this.resize();

    this.canvas.addEventListener('pointerdown', (e) => this.pointer('down', e));
    window.addEventListener('pointermove', (e) => this.pointer('move', e));
    window.addEventListener('pointerup', (e) => this.pointer('up', e));
    window.addEventListener('pointercancel', (e) => this.pointer('up', e));
    this.stage.addEventListener('pointerdown', () => this.sound.unlock(), true);
    this.stage.addEventListener('contextmenu', (e) => e.preventDefault());

    this.el.textbox.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.advanceText(); });
    this.el.hint.addEventListener('click', () => this.useHint());
    this.el.menu.addEventListener('click', () => this.showMenu());
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.sound.ctx) this.sound.ctx.suspend(); else if (this.sound.ctx) this.sound.ctx.resume(); });

    this.showTitle();
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  resize() {
    const vv = window.visualViewport;
    const vw = vv ? vv.width : window.innerWidth;
    const vh = vv ? vv.height : window.innerHeight;
    const scale = Math.min(vw / W, vh / H);
    this.scale = scale;
    this.stage.style.width = `${W * scale}px`;
    this.stage.style.height = `${H * scale}px`;
    this.stage.style.fontSize = `${16 * scale}px`;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(W * scale * dpr);
    this.canvas.height = Math.round(H * scale * dpr);
    this.ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }

  toLogical(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  pointer(kind, e) {
    if (this.mode !== 'play') return;
    const { x, y } = this.toLogical(e);
    if (kind === 'down') {
      e.preventDefault();
      this.ripples.push({ x, y, t: 0 });
      if (this.textActive()) { this.advanceText(); return; }
      if (this.challenge) { this.challenge.down && this.challenge.down(x, y, this); return; }
      this.tapScene(x, y);
    } else if (this.challenge) {
      // Always pass finger-lifts through, so a "hold" can't get stuck on.
      if (kind === 'up' && this.challenge.up) this.challenge.up(x, y, this);
      if (kind === 'move' && this.challenge.move && !this.textActive()) this.challenge.move(x, y, this);
    }
  }

  update(dt) {
    this.t += dt;
    if (this.fadeA > 0) this.fadeA = Math.max(0, this.fadeA - dt * 1.6);
    this.ripples = this.ripples.filter((r) => (r.t += dt) < 0.5);
    this.bats.update(dt, this.t);
    if (this.typing) {
      this.typing.shown = Math.min(this.typing.full.length, this.typing.shown + dt * 70);
      this.el.text.textContent = this.typing.full.slice(0, Math.floor(this.typing.shown));
      if (this.typing.shown >= this.typing.full.length) this.typing = null;
    }
    if (this.mode === 'play' && this.challenge && !this.textActive() && this.challenge.update) {
      this.challenge.update(dt, this);
    }
  }

  draw() {
    const ctx = this.ctx, t = this.t;
    ctx.clearRect(0, 0, W, H);
    if (this.mode === 'title' || !this.scene) {
      this.drawTitle(ctx, t, this);
      this.bats.draw(ctx);
      fog(ctx, t, { y: H - 130, h: 140, alpha: 0.5 });
      vignette(ctx, 0.9);
      return;
    }
    const scene = this.scene, room = this.room();
    room.draw(ctx, t, this);
    const showSpots = !this.challenge || this.challenge.showHotspots;
    if (showSpots && this.mode === 'play') {
      const sel = !!this.state.selected;
      room.hotspots.forEach((h, i) => {
        if (!this.visible(h) || h.hidden) return;
        const cx = h.gx ?? h.x + h.w / 2, cy = h.gy ?? h.y + h.h / 2;
        sparkle(ctx, cx, cy, t + i * 1.3, sel ? 0.9 : 0.55);
      });
    }
    if (scene.bats) this.bats.draw(ctx);
    if (this.challenge && this.challenge.draw) this.challenge.draw(ctx, t, this);
    if (room.fog || scene.fog) fog(ctx, t, room.fog || scene.fog);
    if (this.challenge && this.challenge.drawTop) this.challenge.drawTop(ctx, t, this);
    vignette(ctx, room.vignette ?? 0.85);
    for (const r of this.ripples) {
      ctx.strokeStyle = `rgba(255,220,180,${0.6 * (1 - r.t / 0.5)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(r.x, r.y, 6 + r.t * 50, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.fadeA > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fadeA})`; ctx.fillRect(0, 0, W, H); }
  }

  // ------------------------------------------------------------ scenes
  get scene() { return this.state ? this.scenes[this.state.scene] : null; }
  room() { return this.scene.rooms[this.state.room]; }
  visible(h) { return h.show ? h.show(this) : true; }

  newGame() {
    this.state = { scene: 0, room: null, inv: [], flags: {}, hints: HINTS_PER_CHAPTER, selected: null };
    this.startScene(0, true);
  }

  continueGame() {
    this.state = clone(this.saved.checkpoint);
    this.checkpoint = clone(this.saved.checkpoint);
    this.enterScene(true);
  }

  startScene(i, showIntro) {
    const s = this.state;
    s.scene = i;
    const scene = this.scene;
    s.room = scene.start;
    s.flags = {};
    s.selected = null;
    s.hints = HINTS_PER_CHAPTER;
    if (scene.keep) s.inv = s.inv.filter((it) => scene.keep.includes(it));
    if (scene.setup) scene.setup(this);
    this.checkpoint = clone(s);
    this.persist();
    this.enterScene(showIntro);
  }

  enterScene(showIntro) {
    const scene = this.scene;
    this.mode = 'play';
    this.challenge = null;
    this.queue = []; this.typing = null; this.onTextDone = null;
    this.hideText();
    this.prompt(null);
    this.sound.heartbeat(false);
    this.sound.ambience(scene.ambience || 'night');
    this.bats.set(scene.bats || 0, scene.batArea);
    const [num, name] = scene.title.includes(' · ') ? scene.title.split(' · ') : ['', scene.title];
    this.el.title.innerHTML = `${num ? `<span class="num">${esc(num)}</span>` : ''}${esc(name)}`;
    this.el.topbar.classList.remove('hidden');
    this.renderInventory();
    this.updateHintCount();
    this.fadeA = 1;
    const begin = () => { this.mode = 'play'; if (scene.onEnter) scene.onEnter(this); };
    if (showIntro && scene.intro) this.showJournal(scene.intro, scene.chapter, begin);
    else { this.clearOverlay(); begin(); }
  }

  completeScene() {
    const scene = this.scene;
    this.challenge = null;
    this.sound.heartbeat(false);
    this.prompt(null);
    const next = () => {
      if (this.state.scene + 1 < this.scenes.length) this.startScene(this.state.scene + 1, true);
      else this.showEnding();
    };
    this.sound.chime();
    if (scene.outro) this.showJournal(scene.outro, null, next);
    else next();
  }

  goRoom(id) {
    this.state.room = id;
    this.state.selected = null;
    this.renderInventory();
    this.fadeA = 0.8;
    const r = this.room();
    if (r.onEnter) r.onEnter(this);
  }

  persist() {
    save.write({ checkpoint: this.checkpoint, muted: this.sound.muted });
    this.saved = { checkpoint: this.checkpoint };
  }

  // ------------------------------------------------------------ state helpers
  flag(k) { return this.state.flags[k]; }
  set(k, v = true) { this.state.flags[k] = v; }
  has(item) { return this.state.inv.includes(item); }
  give(item, silent) {
    if (this.has(item)) return;
    this.state.inv.push(item);
    this.renderInventory(item);
    if (!silent) this.sound.pickup();
  }
  take(item) {
    this.state.inv = this.state.inv.filter((i) => i !== item);
    if (this.state.selected === item) this.state.selected = null;
    this.renderInventory();
  }

  // ------------------------------------------------------------ interaction
  tapScene(x, y) {
    const hs = this.room().hotspots;
    for (let i = hs.length - 1; i >= 0; i--) {
      const h = hs[i];
      if (!this.visible(h)) continue;
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        this.sound.click();
        const sel = this.state.selected;
        if (sel) {
          this.select(null);
          const fn = h.use && h.use[sel];
          if (fn) fn(this);
          else this.say((h.wrong && h.wrong(this, sel)) || `The ${ITEMS[sel].name.toLowerCase()} is no use there.`);
        } else if (h.tap) h.tap(this);
        return;
      }
    }
    if (this.scene.bats && this.bats.hit(x, y)) { this.sound.flap((x / W) * 1.6 - 0.8); return; }
    if (this.state.selected) this.select(null);
  }

  select(item) {
    this.state.selected = item;
    this.renderInventory();
    this.prompt(item ? `Use ${ITEMS[item].name} on…` : null);
  }

  renderInventory(flash) {
    const inv = this.el.inv;
    inv.classList.toggle('hidden', this.mode !== 'play');
    inv.innerHTML = '';
    const items = this.state ? this.state.inv : [];
    const slots = Math.max(5, items.length);
    for (let i = 0; i < slots; i++) {
      const id = items[i];
      const b = document.createElement('button');
      b.className = 'slot' + (id ? '' : ' empty') + (id && this.state.selected === id ? ' selected' : '') + (id && id === flash ? ' flash' : '');
      if (id) {
        b.innerHTML = ITEMS[id].icon;
        b.setAttribute('aria-label', ITEMS[id].name);
        b.addEventListener('click', (e) => { e.stopPropagation(); this.tapItem(id); });
      }
      inv.appendChild(b);
    }
  }

  tapItem(id) {
    this.sound.unlock();
    this.sound.click();
    if (this.textActive()) { this.advanceText(); return; }
    if (this.challenge) { if (this.challenge.item) this.challenge.item(id, this); return; }
    if (this.state.selected === id) {
      this.select(null);
      this.say({ who: ITEMS[id].name, text: ITEMS[id].desc });
    } else this.select(id);
  }

  useHint() {
    if (this.mode !== 'play' || !this.scene) return;
    this.sound.click();
    if (this.textActive()) return;
    if (this.state.hints <= 0) { this.say('No hints remain for this chapter. Trust your own wits.'); return; }
    this.state.hints--;
    this.updateHintCount();
    const h = this.scene.hint ? this.scene.hint(this) : 'Look about you. Tap whatever glimmers.';
    this.say({ who: 'A thought', text: h });
  }

  updateHintCount() { this.el.hintCount.textContent = this.state ? this.state.hints : ''; }

  // ------------------------------------------------------------ text
  textActive() { return !this.el.textbox.classList.contains('hidden'); }

  say(lines, cb) {
    const arr = (Array.isArray(lines) ? lines : [lines]).map((l) => (typeof l === 'string' ? { text: l } : l));
    if (this.textActive()) {
      // Chain after whatever is already showing.
      const prev = this.onTextDone;
      this.queue.push(...arr);
      this.onTextDone = () => { if (prev) prev(); if (cb) cb(); };
      return;
    }
    this.queue = arr;
    this.onTextDone = cb || null;
    this.showNextLine();
  }

  showNextLine() {
    const l = this.queue.shift();
    if (!l) {
      this.hideText();
      const cb = this.onTextDone; this.onTextDone = null;
      if (cb) cb();
      return;
    }
    this.el.textbox.classList.remove('hidden');
    this.el.speaker.textContent = l.who || '';
    this.el.text.textContent = '';
    this.typing = { full: l.text, shown: 0 };
    if (l.sfx) l.sfx(this);
  }

  advanceText() {
    if (this.typing) { this.el.text.textContent = this.typing.full; this.typing = null; return; }
    this.showNextLine();
  }

  hideText() { this.el.textbox.classList.add('hidden'); this.typing = null; }

  prompt(text) {
    this.el.prompt.classList.toggle('hidden', !text);
    if (text) this.el.prompt.textContent = text;
  }

  // ------------------------------------------------------------ challenges
  startChallenge(ch) {
    this.select(null);
    this.challenge = ch;
    if (ch.start) ch.start(this);
  }

  endChallenge() {
    this.challenge = null;
    this.prompt(null);
    this.sound.heartbeat(false);
  }

  // A timed animation with no input. draw(ctx, t, p) gets progress 0..1.
  cutscene(duration, draw, cb) {
    let el = 0;
    this.startChallenge({
      update: (dt, g) => { el += dt; if (el >= duration) { g.endChallenge(); cb && cb(); } },
      draw: (ctx, t) => draw(ctx, t, Math.min(1, el / duration)),
    });
  }

  die(text) {
    if (this.mode === 'dead') return;
    this.mode = 'dead';
    this.challenge = null;
    this.hideText();
    this.prompt(null);
    this.sound.heartbeat(false);
    this.sound.sting();
    this.el.inv.classList.add('hidden');
    this.overlay(`<div class="ov death">
      <h1>You Have Perished</h1>
      <p>${esc(text)}</p>
      <button class="btn" data-a="retry">Rise Again</button>
      <button class="btn ghost" data-a="title">Return to Title</button>
    </div>`, {
      retry: () => { this.state = clone(this.checkpoint); this.enterScene(false); },
      title: () => this.showTitle(),
    });
  }

  // ------------------------------------------------------------ overlays
  overlay(html, actions = {}) {
    const o = this.el.overlay;
    o.innerHTML = html;
    o.querySelectorAll('[data-a]').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.unlock();
        this.sound.click();
        const fn = actions[b.dataset.a];
        if (fn) fn(b);
      });
    });
    return o.firstElementChild;
  }

  clearOverlay() { this.el.overlay.innerHTML = ''; }

  showJournal(page, chapter, cb) {
    this.mode = 'journal';
    this.el.inv.classList.add('hidden');
    this.hideText();
    const el = this.overlay(`<div class="ov journal">
      <div class="paper">
        <div class="blot"></div>
        ${chapter ? `<div class="chapter">${esc(chapter)}</div>` : ''}
        <div class="date">${esc(page.date)}</div>
        <div class="body">${esc(page.text)}</div>
        <div class="sig">${esc(page.sig || 'Jonathan Harker’s Journal')}</div>
        <div class="tap">tap to continue</div>
      </div>
    </div>`);
    let ready = false;
    setTimeout(() => { ready = true; }, 500);
    el.addEventListener('click', () => {
      if (!ready) return;
      this.sound.unlock();
      this.sound.click();
      this.clearOverlay();
      this.mode = 'play';
      this.renderInventory();
      cb && cb();
    });
  }

  showTitle() {
    this.mode = 'title';
    this.state = null;
    this.challenge = null;
    this.hideText();
    this.prompt(null);
    this.sound.heartbeat(false);
    this.sound.ambience('night');
    this.bats.set(7, { y: 60, h: 300 });
    this.el.topbar.classList.add('hidden');
    this.el.inv.classList.add('hidden');
    const cont = this.saved ? `<button class="btn" data-a="cont">Continue</button>` : '';
    this.overlay(`<div class="ov title-screen">
      <h1>Dracula</h1>
      <h2>The Castle</h2>
      <div class="menu">
        ${cont}
        <button class="btn ${this.saved ? 'ghost' : ''}" data-a="new">${this.saved ? 'New Journal' : 'Begin'}</button>
        <button class="btn ghost" data-a="sound">Sound: ${this.sound.muted ? 'Off' : 'On'}</button>
        <div class="credit">After Bram Stoker’s <i>Dracula</i> (1897)</div>
      </div>
    </div>`, {
      cont: () => { this.clearOverlay(); this.continueGame(); },
      new: () => { this.clearOverlay(); this.newGame(); },
      sound: (b) => { this.toggleMute(); b.textContent = `Sound: ${this.sound.muted ? 'Off' : 'On'}`; },
    });
    // A howl greets the player once audio is allowed.
    this.el.overlay.addEventListener('pointerdown', () => { if (!this._howled) { this._howled = true; setTimeout(() => this.sound.pack(), 200); } }, { once: true });
  }

  toggleMute() {
    this.sound.setMuted(!this.sound.muted);
    if (this.checkpoint) this.persist();
    else save.write({ ...(save.load() || {}), muted: this.sound.muted });
  }

  showMenu() {
    if (this.mode !== 'play') return;
    const prevMode = this.mode;
    this.mode = 'menu';
    this.overlay(`<div class="ov menu-ov">
      <h2>Paused</h2>
      <button class="btn" data-a="resume">Resume</button>
      <button class="btn ghost" data-a="sound">Sound: ${this.sound.muted ? 'Off' : 'On'}</button>
      <button class="btn ghost" data-a="journal">Reread Journal</button>
      <button class="btn ghost" data-a="restart">Restart Chapter</button>
      <button class="btn ghost" data-a="title">Title Screen</button>
    </div>`, {
      resume: () => { this.clearOverlay(); this.mode = prevMode; },
      sound: (b) => { this.toggleMute(); b.textContent = `Sound: ${this.sound.muted ? 'Off' : 'On'}`; },
      journal: () => { this.clearOverlay(); this.showJournal(this.scene.intro, this.scene.chapter, () => {}); },
      restart: () => { this.clearOverlay(); this.state = clone(this.checkpoint); this.enterScene(false); },
      title: () => this.showTitle(),
    });
  }

  showEnding() {
    this.mode = 'ending';
    this.challenge = null;
    this.el.topbar.classList.add('hidden');
    this.el.inv.classList.add('hidden');
    save.write({ muted: this.sound.muted });
    this.saved = null;
    this.sound.pack();
    this.overlay(`<div class="ov ending">
      <h1>End of Act I</h1>
      <p class="teaser">Jonathan Harker’s fate on the castle wall is unknown…<br><br>
      Far away, by the sea at Whitby, Mina Murray waits for a letter that does not come.</p>
      <p class="teaser"><b>Act II: Mina Murray’s Journal</b><br>coming soon</p>
      <button class="btn" data-a="title">Return to Title</button>
    </div>`, { title: () => this.showTitle() });
  }
}

export { esc };
