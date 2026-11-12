/*
 * Small persistent store: best scores per level and a few settings.
 *
 * localStorage can be missing or throw (private mode, blocked cookies, sandboxed iframes), so every
 * access is wrapped; when the real storage fails the values simply live in memory for the session.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var config = NS.config || (req ? require('./config.js') : null);

  var PREFIX = 'snake2.v2.';

  function defaultBackend() {
    try {
      var ls = globalThis.localStorage;
      if (ls && typeof ls.getItem === 'function') return ls;
    } catch (e) {
      /* access to localStorage itself can throw */
    }
    return null;
  }

  /**
   * @param {object|null} [backend] anything with getItem / setItem (Storage-like); omitted = localStorage
   */
  function createStore(backend) {
    if (backend === undefined) backend = defaultBackend();
    var memory = {};

    function read(key) {
      var full = PREFIX + key;
      if (backend) {
        try {
          var v = backend.getItem(full);
          if (v !== null && v !== undefined) return String(v);
        } catch (e) {
          /* fall through to memory */
        }
      }
      return Object.prototype.hasOwnProperty.call(memory, full) ? memory[full] : null;
    }

    function write(key, value) {
      var full = PREFIX + key;
      memory[full] = String(value);
      if (backend) {
        try {
          backend.setItem(full, String(value));
        } catch (e) {
          /* quota or blocked: the in-memory copy still works */
        }
      }
    }

    function int(key, min, max, fallback) {
      var n = parseInt(read(key), 10);
      if (!isFinite(n)) return fallback;
      return Math.max(min, Math.min(max, n));
    }

    return {
      getLevel: function () {
        return int('level', 1, config.STEP_MS.length, config.DEFAULT_LEVEL);
      },
      setLevel: function (level) {
        write('level', level);
      },
      getBest: function (level) {
        return int('best.' + level, 0, config.MAX_SCORE, 0);
      },
      setBest: function (level, score) {
        write('best.' + level, Math.max(0, Math.min(config.MAX_SCORE, score | 0)));
      },
      get: function (key, fallback) {
        var v = read('opt.' + key);
        return v === null ? fallback : v;
      },
      set: function (key, value) {
        write('opt.' + key, value);
      }
    };
  }

  var Store = { create: createStore };
  NS.Store = Store;
  if (typeof module === 'object' && module.exports) module.exports = Store;
})();
