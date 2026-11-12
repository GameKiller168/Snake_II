/*
 * Snake II - browser edition (v2.0)
 *
 * Shared constants. The geometry comes straight from the original 2021 Java code (v1.0):
 *   - the LCD is 84 x 48 pixels; one LCD pixel is a 10 x 12 rectangle on screen (Screen.java: 841 x 576)
 *   - the snake advances 4 LCD pixels per tick (Screen.tick: xCoor += 4)
 *   - the anchor of game cell (cx, cy) is (3 + 4 * cx, 11 + 4 * cy)  (getRandomX / getRandomY lattice)
 *   - the frame lines sit on rows 6, 8, 47 and columns 0, 83 (Screen.paint)
 *
 * The play field is a torus, like Snake II without a maze: leave on one side, come back on the other.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  var config = {
    // --- LCD -----------------------------------------------------------------------------------
    LCD_W: 84,
    LCD_H: 48,
    CELL_W: 10,            // screen px per LCD pixel, horizontally (original rectangular pixel)
    CELL_H: 12,            // screen px per LCD pixel, vertically

    // --- lattice -------------------------------------------------------------------------------
    STEP: 4,               // LCD pixels per game cell
    ORIGIN_X: 3,           // anchor x of cell cx = 0
    ORIGIN_Y: 11,          // anchor y of cell cy = 0
    FIELD_TOP: 8,          // first row of the play field (its frame line); wrap region = rows 8..47
    FIELD_COLS: 21,        // 84 / 4
    FIELD_ROWS: 10,        // (48 - 8) / 4
    APPLE_COLS: 20,        // apples never straddle the wrap seam: cx 0..19
    APPLE_ROWS: 9,         //                                     cy 0..8

    // --- start position (Screen.java: xCoor = 7, yCoor = 31, size = 9) --------------------------
    START_CX: 1,
    START_CY: 5,
    START_SIZE: 9,

    // --- speed: milliseconds per step for level 1..9 (higher level = faster) ------------------
    STEP_MS: [200, 175, 150, 130, 112, 96, 82, 70, 60],
    INTRO_STEP_MS: 24,     // the snake "unrolls" quickly at the start (the original used t = 5000)
    DEFAULT_LEVEL: 4,

    // --- scoring ----------------------------------------------------------------------------------
    POINTS_PER_APPLE: 4,   // Screen.java: Score = (size - 9) * 4, multiplied by the level here
    MAX_SCORE: 9999,       // four digits, like the original display
    BONUS_EVERY: 5,        // a bonus bug shows up after every 5th apple
    BONUS_TICKS: 56,       // lifetime of a bonus bug in steps (1 bar pixel per step)
    BONUS_BASE: 5,         // bonus = level * (BONUS_BASE + remaining / 4 + 3 * skippedBonuses)
    BONUS_BAR_X: 22,
    BONUS_BAR_Y: 1,
    BONUS_BAR_W: 56,
    BONUS_BAR_H: 3,

    // --- timing of the UI -------------------------------------------------------------------------
    DYING_MS: 1100,        // frozen / blinking snake after a crash
    OVER_LOCK_MS: 900      // ignore start presses right after the game over screen appears
  };

  // direction codes are the original "lastPressed" codes
  config.RIGHT = 0;
  config.LEFT = 1;
  config.UP = 2;
  config.DOWN = 3;
  config.DX = [1, -1, 0, 0];
  config.DY = [0, 0, -1, 1];
  config.OPPOSITE = [1, 0, 3, 2];

  NS.config = config;
  if (typeof module === 'object' && module.exports) module.exports = config;
})();
