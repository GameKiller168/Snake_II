/*
 * Input: keyboard, swipes and taps on the display, and the on-screen buttons. All of it ends up in one
 * callback: onAction(action, arg, source) with the actions the Controller understands plus the page
 * level ones ('mute', 'skin', 'lang').
 *
 * Movement keys use KeyboardEvent.code (the physical position), so WASD stays WASD on AZERTY and
 * Dvorak; the mnemonic letters (P, Q, M, C, L) use the printed letter.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  var CODE_ACTIONS = {
    ArrowUp: 'up', KeyW: 'up', Numpad8: 'up',
    ArrowDown: 'down', KeyS: 'down', Numpad2: 'down',
    ArrowLeft: 'left', KeyA: 'left', Numpad4: 'left',
    ArrowRight: 'right', KeyD: 'right', Numpad6: 'right',
    Enter: 'start', NumpadEnter: 'start',
    Space: 'space', Numpad5: 'space',
    Escape: 'pause',
    Backspace: 'quit'
  };
  var KEY_ACTIONS = { p: 'pause', q: 'quit', m: 'mute', c: 'skin', l: 'lang' };
  // used only when the browser gives no usable `code` (some virtual keyboards)
  var KEY_FALLBACK = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    Enter: 'start', ' ': 'space', Escape: 'pause', Backspace: 'quit'
  };
  var REPEATABLE = { up: 1, down: 1, left: 1, right: 1 };

  /** Maps a keydown event to {action, arg} or null. Exported for the tests. */
  function actionOf(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return null; // leave browser shortcuts alone
    var code = e.code || '';
    var key = e.key || '';
    if (CODE_ACTIONS[code]) return { action: CODE_ACTIONS[code] };
    var m = /^Digit([1-9])$/.exec(code);
    if (m) return { action: 'level', arg: parseInt(m[1], 10) };
    var k = key.length === 1 ? key.toLowerCase() : '';
    if (!code || code === 'Unidentified') {
      if (/^[1-9]$/.test(k)) return { action: 'level', arg: parseInt(k, 10) };
      var fb = KEY_FALLBACK[key] || KEY_FALLBACK[k];
      if (fb) return { action: fb };
    }
    if (KEY_ACTIONS[k]) return { action: KEY_ACTIONS[k] };
    return null;
  }

  var SWIPE_MIN_PX = 22; // finger travel that counts as a swipe
  var TAP_MAX_MS = 350;

  /**
   * @param {object} o
   * @param {function} o.onAction  (action, arg, source) source: 'kbd' | 'touch' | 'mouse'
   * @param {Element}  o.stage     swipe / tap area (the display)
   * @param {Element}  [o.pad]     container of buttons with data-action
   */
  function attach(o) {
    document.addEventListener('keydown', function (e) {
      var a = actionOf(e);
      if (!a) return;
      var t = e.target;
      // Enter / Space on a focused button belong to the button
      if ((a.action === 'start' || a.action === 'space') && t && t.closest && t.closest('button, a')) return;
      e.preventDefault();
      if (e.repeat && !REPEATABLE[a.action]) return;
      o.onAction(a.action, a.arg, 'kbd');
    });

    // --- swipes and taps on the display -------------------------------------------------------
    var stage = o.stage;
    var g = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      g = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* not essential */ }
      e.preventDefault();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!g || e.pointerId !== g.id) return;
      var dx = e.clientX - g.x, dy = e.clientY - g.y;
      var min = Math.max(SWIPE_MIN_PX, Math.min(stage.clientWidth, stage.clientHeight) * 0.07);
      if (Math.abs(dx) < min && Math.abs(dy) < min) return;
      var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      g.x = e.clientX; // a long swipe can chain several turns
      g.y = e.clientY;
      g.moved = true;
      o.onAction(dir, undefined, e.pointerType === 'mouse' ? 'mouse' : 'touch');
    });
    function end(e, cancelled) {
      if (!g || e.pointerId !== g.id) return;
      var tap = !cancelled && !g.moved && e.timeStamp - g.t <= TAP_MAX_MS;
      g = null;
      if (tap) o.onAction('tap', undefined, e.pointerType === 'mouse' ? 'mouse' : 'touch');
    }
    stage.addEventListener('pointerup', function (e) { end(e, false); });
    stage.addEventListener('pointercancel', function (e) { end(e, true); });
    stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // --- on-screen buttons -----------------------------------------------------------------------
    var pad = o.pad;
    if (pad) {
      var find = function (e) { return e.target.closest && e.target.closest('[data-action]'); };
      pad.addEventListener('pointerdown', function (e) {
        var b = find(e);
        if (!b) return;
        e.preventDefault();
        b.classList.add('down');
        o.onAction(b.getAttribute('data-action'), undefined, e.pointerType === 'mouse' ? 'mouse' : 'touch');
      });
      var up = function (e) {
        var b = find(e);
        if (b) b.classList.remove('down');
        var all = pad.querySelectorAll('.down');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('down');
      };
      pad.addEventListener('pointerup', up);
      pad.addEventListener('pointercancel', up);
      pad.addEventListener('pointerleave', up);
      // keyboard activation (Tab + Enter / Space) arrives as a click without a pointer
      pad.addEventListener('click', function (e) {
        var b = find(e);
        if (b && e.detail === 0) o.onAction(b.getAttribute('data-action'), undefined, 'kbd');
      });
      pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
  }

  var Input = { attach: attach, actionOf: actionOf };
  NS.Input = Input;
  if (typeof module === 'object' && module.exports) module.exports = Input;
})();
