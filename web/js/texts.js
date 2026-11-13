/*
 * The texts of the English version of the phone's Snake II, exactly as they stand in the text table of the
 * firmware (v6.39, English). Nothing here is translated or reworded.
 *
 *   %U  is replaced by the name of the thing that was selected, %N by a number
 *   \n  starts a new line
 *
 * Which screen shows which text, and in which font, is decided in screens.js.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  var Texts = {
    // the games menu: "Continue" appears first while a game is paused
    NEW_GAME: 'New game',
    CONTINUE: 'Continue',
    LEVEL: 'Level',
    MAZES: 'Mazes',
    TOP_SCORE: 'Top score',
    INSTRUCTIONS: 'Instructions',

    // soft keys
    SELECT: 'Select',
    OK: 'OK',
    NEXT: 'Next',

    LEVEL_LABEL: 'Level:',

    MAZE_NAMES: ['No maze', 'Maze 1', 'Maze 2', 'Maze 3', 'Maze 4', 'Maze 5'],
    SELECTED: '%U selected',

    TOP_SCORE_NOTE: 'Top score:\n%N',
    GAME_OVER_TOP: 'Game over!\nTOP SCORE:\n%N',
    GAME_OVER_SCORE: 'Game over!\nYour score:\n%N',
    YOU_WON: 'YOU WON!',

    INSTRUCTION_TEXT: 'Make the snake grow longer by directing it to the food. Use the keys 2, 4, 6 and 8. ' +
      'You cannot stop the snake or make it go backwards. Try not to hit the walls or the tail.'
  };

  NS.Texts = Texts;
  if (typeof module === 'object' && module.exports) module.exports = Texts;
})();
