/*
 * Keys. Turns what the browser sends (keyboard, mouse, finger) into the keys of the phone that phone.js knows:
 * 'select', 'c', 'scrollUp', 'scrollDown' and the digits '1'..'9'.
 *
 * In the game the arrow keys, W A S D and the arrow keys of the PC numpad are the keys 2, 4, 6 and 8 - the game itself
 * says "Use the keys 2, 4, 6 and 8" - everywhere else up and down scroll. Which computer key stands for which phone key
 * is a convenience of this page, not something of the original.
 *
 * Numpad: a phone keypad has 1 2 3 on top, a PC numpad has 7 8 9 on top. The numpad keys are therefore read by their
 * position (KeyboardEvent.code, so they also work with NumLock off): Numpad8 is "up" = the phone's 2, Numpad2 is
 * "down" = the phone's 8, Numpad4 / Numpad6 are left / right, Numpad5 is the middle key, and the corners follow the
 * same rule (Numpad7 = the phone's 1, Numpad9 = 3, Numpad1 = 7, Numpad3 = 9). The digit row keeps the phone digits.
 * W A S D are read by code as well, so they are the same four physical keys on every keyboard layout.
 *
 * attach() reports both ends of a press (onPress / onRelease), so that a key tone can last as long as the key is held
 * and the on-screen key can sink while a computer key is down.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var ARROW_IN_GAME = { ArrowUp: '2', ArrowLeft: '4', ArrowRight: '6', ArrowDown: '8', w: '2', a: '4', d: '6', s: '8' };
  var SCROLL = { ArrowUp: 'scrollUp', ArrowDown: 'scrollDown', w: 'scrollUp', s: 'scrollDown' };
  var FUNCTION = { Enter: 'select', ' ': 'select', Backspace: 'c', Escape: 'c', c: 'c' };
  var NUMPAD = { Numpad8: '2', Numpad2: '8', Numpad4: '4', Numpad6: '6', Numpad5: 'select', NumpadEnter: 'select' };
  var CORNERS = { Numpad7: '1', Numpad9: '3', Numpad1: '7', Numpad3: '9' };
  var WASD = { KeyW: '2', KeyA: '4', KeyS: '8', KeyD: '6' };

  function keyFor(key, inGame) {
    var k = key.length === 1 ? key.toLowerCase() : key;
    if (inGame) {
      if (ARROW_IN_GAME[k]) return ARROW_IN_GAME[k];
      if (k >= '1' && k <= '9' && k.length === 1) return k;
    } else if (SCROLL[k]) return SCROLL[k];
    return FUNCTION[k] || null;
  }

  function keyForEvent(event, inGame) {
    var code = event.code || '';
    if (code === 'Numpad5' || code === 'NumpadEnter') return 'select';
    if (NUMPAD[code]) {
      if (code === 'Numpad8' || code === 'Numpad2') return inGame ? NUMPAD[code] : (code === 'Numpad8' ? 'scrollUp' : 'scrollDown');
      return inGame ? NUMPAD[code] : null;
    }
    if (inGame && CORNERS[code]) return CORNERS[code];
    if (WASD[code]) return inGame ? WASD[code] : (code === 'KeyW' ? 'scrollUp' : code === 'KeyS' ? 'scrollDown' : null);
    return keyFor(event.key || '', inGame);
  }

  function attach(options) {
    var pad = options.pad;
    var onRelease = options.onRelease || function () {};
    var sources = {};
    var keyboard = {};
    var pointers = {};
    var buttons = {};

    function buttonFor(key) {
      if (!pad) return null;
      if (pad.querySelector) return pad.querySelector('[data-key="' + key + '"]');
      if (pad.querySelectorAll) {
        var buttons = pad.querySelectorAll('[data-key]');
        for (var i = 0; i < buttons.length; i++) if (buttons[i].getAttribute('data-key') === key) return buttons[i];
      }
      return null;
    }
    function updateButton(key) {
      var b = buttonFor(key);
      if (!b) b = buttons[key];
      if (!b || !b.classList) return;
      if (sources[key] && sources[key].count) b.classList.add('down');
      else b.classList.remove('down');
    }
    function addSource(key, id) {
      if (!sources[key]) sources[key] = { count: 0 };
      if (sources[key][id]) return false;
      var first = sources[key].count === 0;
      sources[key][id] = true;
      sources[key].count++;
      updateButton(key);
      if (first) options.onPress(key);
      return true;
    }
    function removeSource(key, id) {
      var entry = sources[key];
      if (!entry || !entry[id]) return;
      delete entry[id];
      entry.count--;
      updateButton(key);
      if (!entry.count) { delete sources[key]; onRelease(key); }
    }
    function releaseAll() {
      Object.keys(keyboard).forEach(function (id) { removeSource(keyboard[id], id); delete keyboard[id]; });
      Object.keys(pointers).forEach(function (id) { removeSource(pointers[id], id); delete pointers[id]; });
    }

    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var key = keyForEvent(e, options.inGame());
      if (!key) return;
      e.preventDefault();
      if (e.repeat) return;
      var id = 'k:' + (e.code || e.key);
      if (keyboard[id]) return;
      keyboard[id] = key;
      addSource(key, id);
    });
    document.addEventListener('keyup', function (e) {
      var id = 'k:' + (e.code || e.key);
      if (!keyboard[id]) return;
      removeSource(keyboard[id], id);
      delete keyboard[id];
    });
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('blur', releaseAll);
    if (!pad) return;
    pad.addEventListener('pointerdown', function (e) {
      var b = e.target.closest ? e.target.closest('[data-key]') : null;
      if (!b || !pad.contains(b)) return;
      e.preventDefault();
      var id = 'p:' + (e.pointerId === undefined ? 'default' : e.pointerId);
      var key = b.getAttribute('data-key');
      buttons[key] = b;
      if (!pointers[id]) { pointers[id] = key; addSource(key, id); }
    });
    function releasePointer(e) {
      var id = 'p:' + (e.pointerId === undefined ? 'default' : e.pointerId);
      if (!pointers[id]) return;
      removeSource(pointers[id], id);
      delete pointers[id];
    }
    pad.addEventListener('pointerup', releasePointer);
    pad.addEventListener('pointerout', function (e) {
      // moving between the label and the edge of the same key is not leaving the key
      var from = e.target && e.target.closest ? e.target.closest('[data-key]') : null;
      var to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-key]') : null;
      if (from && from === to) return;
      releasePointer(e);
    });
    pad.addEventListener('pointercancel', releasePointer);
    pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  NS.Input = { attach: attach, keyFor: keyFor, keyForEvent: keyForEvent };
  if (typeof module === 'object' && module.exports) module.exports = NS.Input;
})();
