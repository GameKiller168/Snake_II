/*
 * What the phone keeps between two uses: the chosen level, the chosen maze and the top score.
 *
 * The phone stores them in its own memory; the browser edition uses localStorage for that. localStorage can be
 * missing or throw (private mode, blocked cookies, sandboxed iframes), so every access is wrapped and the values
 * simply live in memory for the session when the real storage fails. Not part of the original, only the place where
 * the three values are kept.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var Config = NS.Config || (req ? require('./config.js') : null);

  var KEY = 'snake2.v2.phone';

  function defaultBackend() {
    try {
      var ls = globalThis.localStorage;
      if (ls && typeof ls.getItem === 'function') return ls;
    } catch (e) {
      /* even looking at localStorage can throw */
    }
    return null;
  }

  function clampInt(v, lo, hi, dflt) {
    v = Math.floor(Number(v));
    return v >= lo && v <= hi ? v : dflt;
  }

  /**
   * @param {object|null} [backend] anything with getItem / setItem; omitted = localStorage, null = memory only
   */
  function createStore(backend) {
    if (backend === undefined) backend = defaultBackend();
    var data = { level: Config.DEFAULT_LEVEL, maze: 1, top: 0 };

    function load() {
      if (!backend) return;
      try {
        var raw = backend.getItem(KEY);
        if (!raw) return;
        var o = JSON.parse(raw);
        data.level = clampInt(o.level, 1, 9, data.level);
        data.maze = clampInt(o.maze, 1, 6, data.maze);
        data.top = clampInt(o.top, 0, 0x7fffffff, 0);
      } catch (e) {
        /* unreadable: start from the defaults */
      }
    }

    function save() {
      if (!backend) return;
      try {
        backend.setItem(KEY, JSON.stringify(data));
      } catch (e) {
        /* full or blocked: keep the values in memory */
      }
    }

    load();

    return {
      get level() { return data.level; },
      set level(v) { data.level = clampInt(v, 1, 9, data.level); save(); },
      get maze() { return data.maze; },
      set maze(v) { data.maze = clampInt(v, 1, 6, data.maze); save(); },
      get top() { return data.top; },
      set top(v) { data.top = clampInt(v, 0, 0x7fffffff, data.top); save(); }
    };
  }

  var Store = { create: createStore, KEY: KEY };

  NS.Store = Store;
  if (typeof module === 'object' && module.exports) module.exports = Store;
})();
