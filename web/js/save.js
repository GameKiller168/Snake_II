/* Automatic, invisible persistence for the phone's JSON-safe snapshot. */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  function create(options) {
    options = options || {};
    var storage = options.storage, key = options.key || 'snake2.v1.save';
    function load() {
      try {
        var raw = storage && storage.getItem(key);
        if (!raw) return null;
        var value = JSON.parse(raw);
        if (!value || value.v !== 1 || !value.phone || typeof value.phone !== 'object') return null;
        return value.phone;
      } catch (e) { return null; }
    }
    function write(snapshot) {
      try {
        if (!storage || !snapshot) return;
        storage.setItem(key, JSON.stringify({ v: 1, savedAt: Date.now(), phone: snapshot }));
      } catch (e) { /* storage can be full or unavailable */ }
    }
    function clear() { try { if (storage) storage.removeItem(key); } catch (e) { /* blocked storage */ } }
    return { load: load, write: write, clear: clear };
  }

  function autosave(options) {
    options = options || {};
    var phone = options.phone, save = options.save, now = options.now || function () { return Date.now(); };
    var later = options.setTimeout || setTimeout, cancel = options.clearTimeout || clearTimeout;
    var dirty = false, lastWrite = -Infinity, pending = null, poll = null, stopped = false;
    function commit() {
      pending = null;
      if (!dirty || stopped) return;
      var wait = 500 - (now() - lastWrite);
      if (wait > 0) { pending = later(commit, wait); return; }
      try { save.write(phone.snapshot()); lastWrite = now(); dirty = false; } catch (e) { /* leave state dirty for the next touch */ }
    }
    function touch() {
      dirty = true;
      if (pending === null) pending = later(commit, Math.max(0, 500 - (now() - lastWrite)));
    }
    function flush() {
      if (pending !== null) { cancel(pending); pending = null; }
      if (!dirty || stopped) return;
      try { save.write(phone.snapshot()); lastWrite = now(); dirty = false; } catch (e) { /* retry on the next save opportunity */ }
    }
    function pollGame() {
      if (stopped) return;
      if (phone.inGame()) touch();
      poll = later(pollGame, 2000);
    }
    poll = later(pollGame, 2000);
    return { touch: touch, flush: flush, stop: function () { stopped = true; if (pending !== null) cancel(pending); if (poll !== null) cancel(poll); } };
  }

  var Save = { create: create, autosave: autosave };
  NS.Save = Save;
  if (typeof module === 'object' && module.exports) module.exports = Save;
})();
