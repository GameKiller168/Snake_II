/*
 * Keys. Turns what the browser sends (keyboard, mouse, finger) into the keys of the phone that phone.js knows:
 * 'select', 'c', 'scrollUp', 'scrollDown' and the digits '1'..'9'.
 *
 * In the game the arrow keys (and W A S D) are the keys 2, 4, 6 and 8 - the game itself says "Use the keys 2, 4, 6
 * and 8" - everywhere else the up and down arrows scroll. Which computer key stands for which phone key is a
 * convenience of this page, not something of the original.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  var ARROW_IN_GAME = { ArrowUp: '2', ArrowLeft: '4', ArrowRight: '6', ArrowDown: '8', w: '2', a: '4', d: '6', s: '8' };
  var SCROLL = { ArrowUp: 'scrollUp', ArrowDown: 'scrollDown', w: 'scrollUp', s: 'scrollDown' };
  var FUNCTION = { Enter: 'select', ' ': 'select', Backspace: 'c', Escape: 'c', c: 'c' };

  /** The phone key for a keyboard event's `key`, or null. inGame: do the keys steer the snake right now? */
  function keyFor(key, inGame) {
    var k = key.length === 1 ? key.toLowerCase() : key;
    if (inGame) {
      if (ARROW_IN_GAME[k]) return ARROW_IN_GAME[k];
      if (k >= '1' && k <= '9' && k.length === 1) return k;
    } else if (SCROLL[k]) {
      return SCROLL[k];
    }
    return FUNCTION[k] || null;
  }

  /**
   * Listen for keys. options:
   *   inGame()   true while the keys steer the snake
   *   onPress(k) called with the phone key
   *   pad        element holding buttons with data-key="select" etc. (optional)
   */
  function attach(options) {
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = keyFor(e.key, options.inGame());
      if (!k) return;
      e.preventDefault();
      if (!e.repeat) options.onPress(k);
    });

    var pad = options.pad;
    if (!pad) return;
    pad.addEventListener('pointerdown', function (e) {
      var b = e.target.closest ? e.target.closest('[data-key]') : null;
      if (!b || !pad.contains(b)) return;
      e.preventDefault();                  // no focus, no text selection, no double tap zoom
      b.classList.add('down');
      options.onPress(b.getAttribute('data-key'));
    });
    function release(e) {
      var b = e.target.closest ? e.target.closest('[data-key]') : null;
      if (b) b.classList.remove('down');
    }
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointerout', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  NS.Input = { attach: attach, keyFor: keyFor };
  if (typeof module === 'object' && module.exports) module.exports = NS.Input;
})();
