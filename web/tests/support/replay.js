'use strict';

/*
 * Replays a recorded conversation with the program of the phone against the JavaScript engine.
 *
 * A trace is {level, maze, seed, msgs: [...], out: [[ret, delay, timer0, code, score, picture-crc], ...]}:
 * out[0] is what the program showed after the start message, out[i + 1] the state after msgs[i]. The traces
 * were recorded from a real Nokia 3310 program run in an emulator; they contain only these numbers.
 */

require('../../js/config.js');
const Rng = require('../../js/rng.js');
const Engine = require('../../js/engine.js');
const Framebuffer = require('../../js/framebuffer.js');
require('../../js/tiles.js');
require('../../js/font.js');
const Scene = require('../../js/scene.js');
const { pictureHash } = require('./crc32.js');

const FIELDS = ['ret', 'delay', 'timer0', 'code', 'score', 'picture'];

function snapshot(game, ret, fb) {
  Scene.drawGame(fb, game);
  return [ret, game.delay, game.timer0, game.code, game.score, pictureHash(fb)];
}

/** Returns null when the engine matches the whole trace, else a description of the first difference. */
function replay(trace, hooks) {
  const game = new Engine.Game({ level: trace.level, maze: trace.maze, rng: new Rng(trace.seed) });
  const fb = new Framebuffer(84, 48);
  const ret0 = trace.out[0][0];
  let got = snapshot(game, ret0, fb);
  const diff = (i, want, got, msg) => {
    for (let f = 0; f < FIELDS.length; f++) {
      if (want[f] !== got[f]) return { step: i, msg, field: FIELDS[f], want: want[f], got: got[f], game, fb };
    }
    return null;
  };
  let d = diff(0, trace.out[0], got, 'start');
  if (d) return d;
  for (let i = 0; i < trace.msgs.length; i++) {
    const m = trace.msgs[i];
    let ret;
    if (m === 1) ret = game.tick();
    else if (m === 0) ret = game.blink();
    else ret = game.key(m);
    got = snapshot(game, ret, fb);
    if (hooks && hooks.after) hooks.after(i, m, game);
    d = diff(i + 1, trace.out[i + 1], got, m);
    if (d) return d;
  }
  return null;
}

module.exports = { replay, FIELDS };
