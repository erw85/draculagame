import { bat, W } from './draw.js';

// Ambient bats that drift across a scene. Tapping one scatters it (and squeaks).
export class Bats {
  constructor() { this.list = []; this.area = { y: 40, h: 260 }; }

  set(n, area = { y: 40, h: 260 }) {
    this.area = area;
    this.list = Array.from({ length: n }, () => this._spawn(true));
  }

  _spawn(anywhere) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    return {
      x: anywhere ? Math.random() * W : (dir > 0 ? -30 : W + 30),
      y: this.area.y + Math.random() * this.area.h,
      vx: dir * (22 + Math.random() * 26),
      vy: 0,
      s: 0.55 + Math.random() * 0.55,
      ph: Math.random() * 6,
      fr: 13 + Math.random() * 6,
      wob: Math.random() * 6,
      scatter: 0,
      wait: anywhere ? 0 : Math.random() * 4,
    };
  }

  update(dt, t) {
    for (let i = 0; i < this.list.length; i++) {
      const b = this.list[i];
      if (b.wait > 0) { b.wait -= dt; continue; }
      b.ph += dt * b.fr * (b.scatter ? 1.8 : 1);
      if (b.scatter) {
        b.scatter += dt;
        b.vx *= 1 + dt * 1.5;
        b.vy -= dt * 140;
      } else {
        b.vy = Math.sin(t * 1.7 + b.wob) * 22;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < -60 || b.x > W + 60 || b.y < -60) this.list[i] = this._spawn(false);
    }
  }

  draw(ctx) {
    for (const b of this.list) if (b.wait <= 0) bat(ctx, b.x, b.y, b.s, b.ph);
  }

  hit(x, y) {
    for (const b of this.list) {
      if (b.wait > 0 || b.scatter) continue;
      if (Math.hypot(b.x - x, b.y - y) < 24 * b.s + 8) {
        b.scatter = 0.001;
        b.vx = (b.x < x ? -1 : 1) * 160;
        b.vy = -80;
        return true;
      }
    }
    return false;
  }
}
