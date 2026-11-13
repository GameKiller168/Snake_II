'use strict';

/*
 * The phone around the game, on its virtual clock: start-up, circular menus, the maze list, notes, pausing, the way
 * a game ends. The numbers in the expectations come from footage of real phones (VIDEO B, D) and the program of the
 * phone (FW); FIDELITY.md says which is which.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/config.js');
const Rng = require('../js/rng.js');
const Store = require('../js/store.js');
const Texts = require('../js/texts.js');
const Phone = require('../js/phone.js');

function phone(opts) {
  opts = opts || {};
  const store = opts.store || Store.create(null);
  if (opts.maze) store.maze = opts.maze;
  return new Phone({ store, rng: new Rng(opts.seed || 1), skipSplash: opts.skipSplash !== false });
}

function press(ph, keys) {
  keys.split(' ').filter(Boolean).forEach((k) => ph.press(k));
}

/** Run the phone until the next thing that happens on its own, `limit` times at most; returns the visited times. */
function runUntil(ph, stop) {
  for (let i = 0; i < 100000; i++) {
    if (stop(ph)) return ph.time;
    const due = ph.nextDue();
    if (!isFinite(due)) return null;
    ph.advance(due - ph.time);
  }
  throw new Error('no end');
}

/** The three lines of the list window as item names, the cursor marked with *. */
function window3(ph) {
  const m = ph.menu, n = m.items.length, out = [];
  for (let j = 0; j < 3; j++) {
    const i = (m.state.s + j) % n;
    out.push((i === m.state.c ? '*' : '') + m.items[i]);
  }
  return out;
}

// ----- start-up and the main menu ----------------------------------------------------------------------------------

test('the start-up animation lasts 2700 ms, then the menu with the cursor on New game', () => {
  const ph = phone({ skipSplash: false });
  assert.equal(ph.mode, 'splash');
  ph.advance(2699);
  assert.equal(ph.mode, 'splash');
  ph.advance(1);
  assert.equal(ph.mode, 'menu');
  assert.deepEqual(window3(ph), ['*New game', 'Level', 'Mazes']);
  assert.equal(ph.header(), '8-1-1');
});

test('keys during the start-up animation do nothing', () => {
  const ph = phone({ skipSplash: false });
  press(ph, 'select scrollDown c 5');
  assert.equal(ph.mode, 'splash');
  assert.equal(ph.time, 0);
});

test('the main menu is a circle with a three line window (VIDEO B)', () => {
  const ph = phone();
  // down: the cursor walks to the bottom line, then the list slides under it, then wraps around the end
  const seen = [];
  for (let i = 0; i < 7; i++) {
    seen.push(window3(ph).join(' | '));
    ph.press('scrollDown');
  }
  assert.deepEqual(seen, [
    '*New game | Level | Mazes',
    'New game | *Level | Mazes',
    'New game | Level | *Mazes',
    'Level | Mazes | *Top score',
    'Mazes | Top score | *Instructions',
    'Top score | Instructions | *New game',
    'Instructions | New game | *Level'
  ]);
});

test('up from the first item wraps to the last and puts it on the top line (VIDEO B)', () => {
  const ph = phone();
  ph.press('scrollUp');
  assert.deepEqual(window3(ph), ['*Instructions', 'New game', 'Level']);
  assert.equal(ph.header(), '8-1-5');
  ph.press('scrollUp');
  assert.deepEqual(window3(ph), ['*Top score', 'Instructions', 'New game']);
  assert.equal(ph.header(), '8-1-4');
  ph.press('scrollUp');
  assert.deepEqual(window3(ph), ['*Mazes', 'Top score', 'Instructions']);
});

test('up and down are exact opposites on the cursor, whatever the window does', () => {
  const ph = phone();
  const start = ph.menu.state.c;
  for (let i = 0; i < 13; i++) ph.press('scrollDown');
  for (let i = 0; i < 13; i++) ph.press('scrollUp');
  assert.equal(ph.menu.state.c, start);
});

test('the numbers of the main menu live on through the level screen, the instructions and back', () => {
  const ph = phone();
  press(ph, 'scrollDown scrollDown scrollDown');      // cursor on Top score, window Level / Mazes / Top score
  const before = JSON.stringify(ph.menu.state);
  ph.press('scrollUp');                                // Mazes
  ph.press('scrollUp');                                // Level
  ph.press('select');
  assert.equal(ph.mode, 'level');
  ph.press('c');
  assert.equal(ph.mode, 'menu');
  assert.equal(ph.menu.items[ph.menu.state.c], 'Level');
  press(ph, 'scrollDown scrollDown');
  assert.equal(JSON.stringify(ph.menu.state), before);
  press(ph, 'scrollDown select');                      // Instructions
  assert.equal(ph.mode, 'instructions');
  const s = ph.menu.state.s;
  ph.press('c');
  assert.equal(ph.menu.items[ph.menu.state.c], 'Instructions');
  assert.equal(ph.menu.state.s, s);
});

// ----- the level screen -----------------------------------------------------------------------------------------------

test('the level screen starts on the level in use and keeps the choice', () => {
  const ph = phone();
  press(ph, 'scrollDown select');
  assert.equal(ph.mode, 'level');
  assert.equal(ph.levelShown, 1);
  press(ph, 'scrollUp scrollUp scrollUp');
  assert.equal(ph.levelShown, 4);
  ph.press('select');
  assert.equal(ph.store.level, 4);
  assert.equal(ph.mode, 'menu');
});

// ----- the maze list and the maze note ------------------------------------------------------------------------------------

function toMazes(ph) {
  // from a fresh menu: down, down, select
  press(ph, 'scrollDown scrollDown select');
  assert.equal(ph.menu.kind, 'mazes');
}

test('the maze list opens on the maze in use, top line and cursor on it (VIDEO D)', () => {
  const ph = phone({ maze: 4 });                      // "Maze 2"
  toMazes(ph);
  assert.deepEqual(ph.menu.state, { s: 3, c: 3 });
  assert.equal(ph.header(), '8-1-3-4');
  assert.deepEqual(window3(ph), ['*Maze 3', 'Maze 4', 'Maze 5']);
});

test('the maze list has "OK" as soft key and is circular as well', () => {
  const ph = phone();
  toMazes(ph);
  assert.deepEqual(window3(ph), ['*No maze', 'Maze 1', 'Maze 2']);
  ph.press('scrollUp');
  assert.deepEqual(window3(ph), ['*Maze 5', 'No maze', 'Maze 1']);
  assert.equal(ph.header(), '8-1-3-6');
  ph.draw();
  assert.ok(ph.fb.toAscii().length > 0);
});

test('choosing a maze shows the note for 1.5 s, then the main menu on Mazes (VIDEO D)', () => {
  const ph = phone();
  toMazes(ph);
  press(ph, 'scrollDown scrollDown scrollDown');     // Maze 3
  ph.press('select');
  assert.equal(ph.store.maze, 4);
  assert.equal(ph.mode, 'note');
  assert.deepEqual(ph.note.lines, ['Maze 3', 'selected']);
  assert.equal(ph.note.icon, true);
  ph.advance(1499);
  assert.equal(ph.mode, 'note');
  ph.advance(1);
  assert.equal(ph.mode, 'menu');
  assert.equal(ph.menu.kind, 'main');
  assert.equal(ph.menu.items[ph.menu.state.c], 'Mazes');
});

test('"No maze" is a maze too, and its note wraps after "No maze"', () => {
  const ph = phone({ maze: 3 });
  toMazes(ph);
  ph.press('scrollUp');
  ph.press('scrollUp');
  assert.equal(ph.menu.items[ph.menu.state.c], 'No maze');
  ph.press('select');
  assert.equal(ph.store.maze, 1);
  assert.deepEqual(ph.note.lines, ['No maze', 'selected']);
});

test('C in the maze list goes back without choosing', () => {
  const ph = phone({ maze: 2 });
  toMazes(ph);
  ph.press('scrollDown');
  ph.press('c');
  assert.equal(ph.menu.kind, 'main');
  assert.equal(ph.store.maze, 2);
});

test('a key ends the note at once [EST]', () => {
  const ph = phone();
  toMazes(ph);
  ph.press('select');
  assert.equal(ph.mode, 'note');
  ph.press('5');
  assert.equal(ph.mode, 'menu');
});

// ----- the game, pausing, continue --------------------------------------------------------------------------------------

function newGame(ph) {
  // the cursor is on New game after start-up and after a game over
  assert.equal(ph.menu.items[ph.menu.state.c], 'New game');
  ph.press('select');
  assert.equal(ph.mode, 'game');
}

test('C pauses the game: Continue is put in front and the cursor is on it (VIDEO D)', () => {
  const ph = phone();
  newGame(ph);
  ph.advance(1000);
  ph.press('c');
  assert.equal(ph.mode, 'menu');
  assert.equal(ph.paused, true);
  assert.deepEqual(window3(ph), ['*Continue', 'New game', 'Level']);
  assert.equal(ph.header(), '8-1-1');
});

test('Continue goes back into the same game, the step time starts afresh [EST]', () => {
  const ph = phone();
  newGame(ph);
  ph.advance(700);                                    // one step done at 660 ms
  const score = ph.game.score, head = ph.game.snake ? ph.game.snake.length : null;
  ph.press('c');
  const game = ph.game;
  ph.advance(60000);                                  // paused: nothing moves
  assert.equal(ph.game, game);
  ph.press('select');
  assert.equal(ph.mode, 'game');
  assert.equal(ph.game, game);
  assert.equal(ph.game.score, score);
  assert.equal(head, ph.game.snake ? ph.game.snake.length : null);
  assert.equal(ph.nextDue(), ph.time + ph.game.delay);
});

test('the maze list of a paused game is "8-1-4-n"', () => {
  const ph = phone();
  newGame(ph);
  ph.press('c');
  press(ph, 'scrollDown scrollDown scrollDown select');   // Continue, New game, Level, Mazes
  assert.equal(ph.menu.kind, 'mazes');
  assert.equal(ph.header(), '8-1-4-1');
});

test('choosing a maze throws a paused game away: Continue disappears, the cursor index stays (VIDEO D)', () => {
  const ph = phone();
  newGame(ph);
  ph.press('c');
  press(ph, 'scrollDown scrollDown scrollDown select');   // into the maze list, from "Mazes" at index 3
  ph.press('scrollDown');
  ph.press('select');
  assert.equal(ph.game, null);
  assert.equal(ph.paused, false);
  ph.advance(1500);
  assert.equal(ph.mode, 'menu');
  assert.deepEqual(ph.menu.items, ['New game', 'Level', 'Mazes', 'Top score', 'Instructions']);
  assert.equal(ph.menu.state.c, 3);                       // the number did not change: it is "Top score" now
  assert.equal(ph.menu.items[ph.menu.state.c], 'Top score');
});

test('without a paused game the cursor stays on Mazes after the note', () => {
  const ph = phone();
  toMazes(ph);
  ph.press('select');
  ph.advance(1500);
  assert.equal(ph.menu.items[ph.menu.state.c], 'Mazes');
});

// ----- how a game ends ---------------------------------------------------------------------------------------------------------

function crashingGame() {
  const ph = phone({ maze: 2 });                      // "Maze 1": a frame of walls, the snake runs into the right wall
  press(ph, 'scrollDown scrollDown scrollDown scrollDown scrollDown');   // around the circle back to New game
  newGame(ph);
  return ph;
}

test('a crash: 100 ms grace, 8 blinks, game over note 2100 ms after the crash', () => {
  const ph = crashingGame();
  const t1 = runUntil(ph, (p) => p.game.crash === 1);
  assert.equal(t1, 8 * 660);                          // eight steps of level 1, then the wall
  const t2 = runUntil(ph, (p) => p.game.crash === 2);
  assert.equal(t2, t1 + 100);
  assert.equal(ph.blinksLeft, 8);
  const t3 = runUntil(ph, (p) => p.mode === 'note');
  assert.equal(t3, t2 + 2100);
  assert.deepEqual(ph.note.lines, ['Game over!', 'Your score:', '0']);
});

test('a turn during the grace time saves the snake', () => {
  const ph = crashingGame();
  runUntil(ph, (p) => p.game.crash === 1);
  ph.press('8');                                       // down, away from the wall
  runUntil(ph, (p) => p.time >= 8 * 660 + 100);
  assert.equal(ph.game.crash, 0);
  assert.equal(ph.mode, 'game');
});

test('after a game over without a record the note stays 3.07 s, the menu starts on New game with the old top line', () => {
  const ph = crashingGame();
  ph.store.top = 50;
  ph.main.s = 3;                                       // a window like Top score / Instructions / New game
  runUntil(ph, (p) => p.mode === 'note');
  const t0 = ph.time;
  ph.advance(3069);
  assert.equal(ph.mode, 'note');
  ph.advance(1);
  assert.equal(ph.time - t0, 3070);
  assert.equal(ph.mode, 'menu');
  assert.deepEqual(ph.menu.state, { s: 3, c: 0 });
  assert.deepEqual(window3(ph), ['Top score', 'Instructions', '*New game']);
});

test('a new top score: fireworks of 12 pictures, 230 ms each, then the note with TOP SCORE', () => {
  const ph = crashingGame();
  // eat something before the crash is not needed: a score of 0 is not above a top score of -1, so cheat the store
  ph.game.score = 7;
  runUntil(ph, (p) => p.mode === 'fireworks');
  const t0 = ph.time;
  assert.equal(ph.store.top, 7);
  ph.advance(2759);
  assert.equal(ph.mode, 'fireworks');
  ph.advance(1);
  assert.equal(ph.time - t0, 12 * 230);
  assert.equal(ph.mode, 'note');
  assert.deepEqual(ph.note.lines, ['Game over!', 'TOP SCORE:', '7']);
  ph.advance(3070);
  assert.equal(ph.mode, 'menu');
});

test('keys do nothing during the fireworks [EST]', () => {
  const ph = crashingGame();
  ph.game.score = 3;
  runUntil(ph, (p) => p.mode === 'fireworks');
  press(ph, 'select c 5 scrollDown');
  assert.equal(ph.mode, 'fireworks');
});

test('a score equal to the top score is no record', () => {
  const ph = crashingGame();
  ph.store.top = 0;
  runUntil(ph, (p) => p.mode === 'note');
  assert.deepEqual(ph.note.lines, ['Game over!', 'Your score:', '0']);
});

// ----- the top score note ------------------------------------------------------------------------------------------------------

test('the top score note: 3.07 s, then the main menu with the cursor on item 0 and the old top line (VIDEO B)', () => {
  const ph = phone();
  ph.store.top = 1222;
  press(ph, 'scrollUp scrollUp');                      // Top score on the top line
  assert.deepEqual(window3(ph), ['*Top score', 'Instructions', 'New game']);
  ph.press('select');
  assert.equal(ph.mode, 'note');
  assert.deepEqual(ph.note.lines, ['Top score:', '1222']);
  assert.equal(ph.note.icon, false);
  ph.advance(3069);
  assert.equal(ph.mode, 'note');
  ph.advance(1);
  assert.equal(ph.mode, 'menu');
  assert.deepEqual(window3(ph), ['Top score', 'Instructions', '*New game']);
});

// ----- instructions ---------------------------------------------------------------------------------------------------------

test('the instruction pages turn with Select and C leaves them', () => {
  const ph = phone();
  press(ph, 'scrollUp select');                        // Instructions is the last item
  assert.equal(ph.mode, 'instructions');
  assert.equal(ph.page, 0);
  ph.press('select');
  assert.equal(ph.page, 1);
  ph.press('c');
  assert.equal(ph.mode, 'menu');
  assert.equal(ph.menu.items[ph.menu.state.c], 'Instructions');
});

// ----- the picture -----------------------------------------------------------------------------------------------------------

test('every screen of the phone can be drawn', () => {
  const ph = phone({ skipSplash: false });
  const modes = new Set();
  const look = () => { modes.add(ph.mode); ph.draw(); assert.equal(ph.fb.toAscii().split('\n').length, 48); };
  look();
  ph.advance(2700); look();
  press(ph, 'scrollDown select'); look();             // level
  ph.press('c'); look();
  press(ph, 'scrollDown select'); look();             // maze list
  ph.press('select'); look();                         // maze note
  ph.press('c');                                      // a key ends the note, the cursor is on "Mazes"
  press(ph, 'scrollUp scrollUp');                     // back to "New game"
  newGame(ph); look();
  ph.press('c'); look();                              // paused menu
  assert.deepEqual([...modes].sort(), ['game', 'level', 'menu', 'note', 'splash']);
});
