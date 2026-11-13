/*
 * The picture of the game: the engine's state drawn into the 84 x 48 matrix of the LCD, the way the phone
 * composes it. The phone keeps a list of display objects and draws them in order (first everything of
 * layer 0 in the order it was created, then layer 1):
 *
 *   layer 0  the frame, the walls of the maze, the apple, the bonus creature, the score, the bonus counter
 *   layer 1  the snake, the line under the header
 *
 * "Opaque" objects (snake tiles, digits, the creature in the header) clear their box before they draw;
 * "transparent" ones (apple, creature on the field) only set pixels.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var Config = NS.Config || (req ? require('./config.js') : null);
  var Tiles = NS.Tiles || (req ? require('./tiles.js') : null);
  var Font = NS.Font || (req ? require('./font.js') : null);

  var W = Config.COLS, H = Config.ROWS;
  var GEOM = { x0: Config.ORIGIN_X, y0: Config.ORIGIN_Y, tile: Config.CELL };

  // the program's direction numbers (0 left, 1 up, 2 right, 3 down) -> the ones of tiles.js (0 right, 1 left, 2 up, 3 down)
  var TILE_DIR = [1, 2, 0, 3];

  /** The frame around the field and the walls of the maze. Constant for a maze. */
  function drawBackground(fb, mazeIndex) {
    fb.fillRect(0, 8, 4 * W + 3, 1, 1);            // top
    fb.fillRect(0, 8, 1, 4 * H + 3, 1);            // left
    fb.fillRect(4 * W + 3, 8, 1, 4 * (H + 1), 1);  // right
    fb.fillRect(0, 4 * H + 11, 4 * W + 3, 1, 1);   // bottom
    var walls = Config.MAZES[mazeIndex].walls;
    for (var i = 0; i < walls.length; i++) {
      var s = walls[i];
      if (s[0] === s[2]) fb.fillRect(4 * s[0] + 3, 4 * s[1] + 11, 2, 4 * (s[3] - s[1]) + 2, 1);
      else fb.fillRect(4 * s[0] + 3, 4 * s[1] + 11, 4 * (s[2] - s[0]) + 2, 2, 1);
    }
  }

  function drawScore(fb, score) {
    var v = score % 10000;
    for (var i = 0; i < 4; i++) {
      Font.drawDigit(fb, Math.floor(v / Math.pow(10, 3 - i)) % 10, 4 * i, 0);
    }
  }

  function drawCounter(fb, game) {
    if (game.counter <= 0) return;
    Font.drawDigit(fb, game.counter % 10, 79, 0);
    Font.drawDigit(fb, Math.floor(game.counter / 10), 75, 0);
    fb.clearRect(66, 1, 8, 4);
    Tiles.drawCreature(fb, game.iconType, 66, 1, { x0: 0, y0: 0, tile: 1 });
  }

  function drawSnake(fb, game) {
    var segs = [];
    for (var i = 0; i < game.snake.length; i++) {
      var s = game.snake[i];
      segs.push({ x: s.x, y: s.y, d: TILE_DIR[s.d], fed: s.fed });
    }
    Tiles.drawSnake(fb, segs, GEOM, game.headOpen);
  }

  /** Draw a whole game picture into fb (cleared first). */
  function drawGame(fb, game) {
    fb.clear();
    drawBackground(fb, game.mazeIndex);
    if (game.apple.x >= 0) Tiles.drawApple(fb, game.apple.x, game.apple.y, GEOM);
    if (game.creature.shown) Tiles.drawCreature(fb, game.creature.type, game.creature.x, game.creature.y, GEOM);
    drawScore(fb, game.score);
    drawCounter(fb, game);
    if (!game.snakeHidden) drawSnake(fb, game);
    fb.hline(0, 6, 84);
    return fb;
  }

  var Scene = { drawGame: drawGame, drawBackground: drawBackground, TILE_DIR: TILE_DIR };

  NS.Scene = Scene;
  if (typeof module === 'object' && module.exports) module.exports = Scene;
})();
