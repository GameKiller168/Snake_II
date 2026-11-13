'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../js/engine.js');
const Rng = require('../js/rng.js');
const Phone = require('../js/phone.js');

test('a full field awards the clear bonus and emits the win tone event', () => {
  const game = new Engine.Game({ level: 1, maze: 1, rng: new Rng(12) });
  const head = game.snake[game.snake.length - 1];
  game.apple.x = (head.x + 1) % 20;
  game.apple.y = head.y;
  game.placeApple = function () { this.apple.x = -1; this.apple.y = -1; };
  assert.equal(game.tick(), Engine.RET.OVER);
  assert.equal(game.score, 101);
  assert.equal(game.code, 0x22);
  assert.deepEqual(game.events.slice(-2), ['vibra', 'won']);
});

test('a restored game with the last main-menu item selected remains restorable', () => {
  const source = new Phone({ rng: new Rng(22), skipSplash: true });
  source.startGame();
  source.pause();
  source.press('scrollUp');
  const saved = JSON.parse(JSON.stringify(source.snapshot()));
  assert.equal(saved.main.c, 6);
  const restored = new Phone({ rng: new Rng(1), skipSplash: true });
  assert.equal(restored.restore(saved), true);
  assert.equal(restored.menu.items[restored.menu.state.c], 'Options');
});
