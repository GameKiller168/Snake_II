/*
 * The number font of the header: ten digits, 3 x 5 pixels, each in a box 4 pixels wide (the first column of the
 * box stays empty). Measured from footage of real phones (VIDEO B, D) and confirmed against the program of
 * the phone, see FIDELITY.md.
 *
 * The menu texts have their own, larger font; it lives in text.js.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  var DIGITS = [
    ['###', '#.#', '#.#', '#.#', '###'],   // 0
    ['.#.', '##.', '.#.', '.#.', '.#.'],   // 1
    ['###', '..#', '###', '#..', '###'],   // 2
    ['###', '..#', '###', '..#', '###'],   // 3
    ['#.#', '#.#', '###', '..#', '..#'],   // 4
    ['###', '#..', '###', '..#', '###'],   // 5
    ['###', '#..', '###', '#.#', '###'],   // 6
    ['###', '..#', '.#.', '.#.', '.#.'],   // 7
    ['###', '#.#', '###', '#.#', '###'],   // 8
    ['###', '#.#', '###', '..#', '###']    // 9
  ];

  /** Draw digit d in its 4 x 5 box with the upper left corner at (x, y). The box is cleared first. */
  function drawDigit(fb, d, x, y) {
    fb.clearRect(x, y, 4, 5);
    var g = DIGITS[d];
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 3; c++) {
        if (g[r].charAt(c) === '#') fb.set(x + 1 + c, y + r, 1);
      }
    }
  }

  var Font = { DIGITS: DIGITS, drawDigit: drawDigit };

  NS.Font = Font;
  if (typeof module === 'object' && module.exports) module.exports = Font;
})();
