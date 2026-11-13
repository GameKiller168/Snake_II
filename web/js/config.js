/*
 * Snake II - browser edition (v2.1.2): the constants of the game.
 *
 * Every number in this file has an evidence level, see FIDELITY.md:
 *   FW    read from the program of a real Nokia 3310 (firmware v6.39) and cross-checked with footage
 *   VIDEO measured in footage of real phones
 * Nothing here is invented. Where a value is only known to one level of evidence it says so.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  // The game numbers its directions like this (also the order of the key handlers and the turn arithmetic).
  var LEFT = 0, UP = 1, RIGHT = 2, DOWN = 3;

  /*
   * The six "mazes" of the menu. Index 1 is "No maze" (a plain torus), 2..6 are Maze 1..5.
   * Walls are straight segments [x0, y0, x1, y1] in cells, both ends included, either horizontal (y0 == y1)
   * or vertical (x0 == x1, y0 < y1). The snake starts with its head at (startX + 7, startY) heading right.
   * [FW] - not yet compared with footage (see FIDELITY.md).
   */
  var MAZES = [
    null,
    { name: 'No maze', startX: 4, startY: 4, walls: [] },
    {
      name: 'Maze 1', startX: 4, startY: 4,
      walls: [[0, 0, 0, 8], [0, 0, 19, 0], [19, 0, 19, 8], [0, 8, 19, 8]]
    },
    {
      name: 'Maze 2', startX: 0, startY: 4,
      walls: [
        [0, 0, 1, 0], [0, 0, 0, 1], [18, 0, 19, 0], [19, 0, 19, 1],
        [0, 7, 0, 8], [0, 8, 1, 8], [18, 8, 19, 8], [19, 7, 19, 8],
        [8, 3, 12, 3], [8, 5, 12, 5]
      ]
    },
    {
      name: 'Maze 3', startX: 0, startY: 5,
      walls: [[8, 0, 8, 4], [12, 4, 12, 8], [11, 2, 19, 2], [0, 6, 9, 6]]
    },
    {
      name: 'Maze 4', startX: 4, startY: 7,
      walls: [
        [0, 0, 19, 0], [0, 0, 0, 3], [19, 0, 19, 3], [0, 5, 0, 8],
        [0, 8, 19, 8], [19, 5, 19, 8], [7, 2, 7, 6], [13, 2, 13, 6]
      ]
    },
    {
      name: 'Maze 5', startX: 4, startY: 4,
      walls: [
        [0, 0, 0, 1], [0, 0, 2, 0], [5, 0, 16, 0], [0, 3, 8, 3],
        [11, 3, 19, 3], [8, 0, 8, 3], [0, 6, 19, 6], [11, 6, 11, 8]
      ]
    }
  ];

  var Config = {
    // --- the LCD ---------------------------------------------------------------------------------------
    LCD_W: 84,                   // [FW][VIDEO]
    LCD_H: 48,                   // [FW][VIDEO]
    PIXEL_W: 10, PIXEL_H: 12,    // shape of one LCD pixel: 10 : 12 [VIDEO: measured 10.008 x 11.967]

    // --- the field -------------------------------------------------------------------------------------
    COLS: 20,                    // [FW][VIDEO] the snake wraps around all four edges
    ROWS: 9,                     // [FW][VIDEO]
    CELL: 4,                     // a cell is 4 x 4 LCD pixels
    ORIGIN_X: 2,                 // cell (x, y) covers columns 2 + 4x .. 5 + 4x  [FW][VIDEO]
    ORIGIN_Y: 10,                //                        rows 10 + 4y .. 13 + 4y

    LEFT: LEFT, UP: UP, RIGHT: RIGHT, DOWN: DOWN,
    DX: [-1, 0, 1, 0],
    DY: [0, -1, 0, 1],

    // --- speed -----------------------------------------------------------------------------------------
    // time between two steps, level 1..9, in ms [FW]; level 1 = 660 ms was measured too (0.657 .. 0.662 s, VIDEO B)
    STEP_MS: [660, 480, 380, 300, 230, 180, 140, 110, 90],
    DEFAULT_LEVEL: 1,

    // --- rules -----------------------------------------------------------------------------------------
    APPLE_POINTS: 'level',       // an apple gives `level` points [FW]
    BONUS_EVERY: 5,              // a bonus creature after every 5th apple (progress += 4, spawn at >= 20) [FW][VIDEO]
    BONUS_STEPS: 20,             // the creature stays for 20 steps, the counter starts at 20 [FW][VIDEO]
    CRASH_GRACE_MS: 100,         // after the first blocked step the game waits 100 ms for a turn [FW]
    CRASH_END_MS: 2100,          // and 2100 ms after the second one the game is over [FW][VIDEO]
    BLINK_MS: 250,               // the snake blinks every 250 ms, 8 toggles before the game ends [FW][VIDEO]
    BLINK_TOGGLES: 8,

    MAZES: MAZES,
    MAZE_NAMES: ['No maze', 'Maze 1', 'Maze 2', 'Maze 3', 'Maze 4', 'Maze 5']
  };

  NS.Config = Config;
  if (typeof module === 'object' && module.exports) module.exports = Config;
})();
