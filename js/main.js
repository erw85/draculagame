import { Game } from './engine/game.js';
import { SCENES } from './scenes/index.js';
import prologue from './scenes/s0_prologue.js';
import * as A from './art/draw.js';

// Title screen backdrop: Castle Dracula on its crag, a wolf howling at the moon.
function drawTitle(ctx, t) {
  A.sky(ctx, t, { moon: { x: 268, y: 410, r: 60 }, bottom: '#4a1d3c' });
  A.ridge(ctx, 3, 470, 90, '#1c0f26', { jag: 10 });
  A.castle(ctx, 120, 430, 0.95, t);
  A.ridge(ctx, 4, 520, 50, '#100818', { jag: 14 });
  A.forest(ctx, 2, 540, '#07040b', { n: 46, hmin: 16, hmax: 40, spread: 30 });
  // foreground rock with the howling wolf, silhouetted against the moon
  ctx.fillStyle = '#030105';
  ctx.beginPath(); ctx.moveTo(180, 640); ctx.lineTo(200, 560); ctx.lineTo(240, 520); ctx.lineTo(300, 515); ctx.lineTo(340, 560); ctx.lineTo(360, 640); ctx.fill();
  A.wolf(ctx, 272, 520, 0.75, { pose: 'howl', t, color: '#030105' });
}

const game = new Game({ scenes: SCENES, prologue, drawTitle });
game.boot();

// Lets automated tests reach the game. Harmless in normal play.
window.__game = game;
