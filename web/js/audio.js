(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var Tones = NS.Tones;
  var GAME_GAIN = 0.2; // This peak level is an estimate, not firmware data.
  var MIN_KEY_MS = 60; // This audible minimum is an estimate for quick taps.
  var KEY_CHAR = { select: 'A', c: 'B', scrollUp: 'C', scrollDown: 'D' }; // These phone-key mappings are estimates.
  var KEY_ATTACK = 0.002;
  var KEY_RELEASE = 0.005;
  var GAME_ENVELOPE = 0.0003;
  var START_AHEAD = 0.005;

  function create(options) {
    options = options || {};
    var Context = options.AudioContext;
    if (typeof Context !== 'function') Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    var settings = options.settings || {};
    var ctx = null;
    var unlocked = false;
    var gameVoice = null;
    var keyVoices = {};

    function isSupported() {
      return typeof Context === 'function';
    }

    function disconnect(node) {
      try {
        if (node && node.disconnect) node.disconnect();
      } catch (ignore) {}
    }

    function cleanupVoice(voice) {
      var i;
      if (!voice || voice.cleaned) return;
      voice.cleaned = true;
      for (i = 0; i < voice.nodes.length; i += 1) disconnect(voice.nodes[i]);
      if (voice.key) {
        if (keyVoices[voice.key] === voice) delete keyVoices[voice.key];
      } else if (gameVoice === voice) {
        gameVoice = null;
      }
    }

    function ended(voice) {
      voice.endedCount += 1;
      if (voice.endedCount >= voice.oscillators.length) cleanupVoice(voice);
    }

    function unlock() {
      var result;
      if (!isSupported()) return;
      try {
        if (!ctx) ctx = new Context();
        if (!ctx) return;
        unlocked = true;
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          result = ctx.resume();
          if (result && typeof result.then === 'function') result.then(function () {}, function () {});
        }
      } catch (ignore) {
        ctx = null;
        unlocked = false;
      }
    }

    function ready() {
      return !!(isSupported() && unlocked && ctx);
    }

    function cancelGame() {
      var voice = gameVoice;
      var now;
      var i;
      if (!voice || !ctx) return;
      try {
        now = ctx.currentTime;
        for (i = 0; i < voice.oscillators.length; i += 1) {
          var osc = voice.oscillators[i];
          var gain = voice.gains[i].gain;
          gain.cancelScheduledValues(now);
          gain.setValueAtTime(GAME_GAIN, now);
          gain.linearRampToValueAtTime(0, now + 0.005);
          osc.stop(now + 0.006);
        }
      } catch (ignore) {}
      gameVoice = null;
    }

    function playGame(name) {
      var tone;
      var voice;
      var start;
      var cursor;
      var i;
      if (!ready()) return;
      try {
        if (!settings.gameSounds) return;
        tone = Tones && Tones.GAME[name];
        if (!tone) return;
        cancelGame();
        voice = { oscillators: [], gains: [], nodes: [], key: null, cleaned: false, endedCount: 0 };
        gameVoice = voice;
        start = ctx.currentTime + START_AHEAD;
        cursor = start;
        for (i = 0; i < tone.segments.length; i += 1) {
          var segment = tone.segments[i];
          var frequency = segment[0];
          var duration = segment[1] * Tones.TICK_MS / 1000;
          var end = cursor + duration;
          if (frequency) {
            var oscillator = ctx.createOscillator();
            var gainNode = ctx.createGain();
            var attack = Math.min(GAME_ENVELOPE, duration / 2);
            var release = Math.min(GAME_ENVELOPE, duration / 2);
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(frequency, cursor);
            gainNode.gain.setValueAtTime(0, cursor);
            gainNode.gain.linearRampToValueAtTime(GAME_GAIN, cursor + attack);
            gainNode.gain.setValueAtTime(GAME_GAIN, end - release);
            gainNode.gain.linearRampToValueAtTime(0, end);
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            voice.oscillators.push(oscillator);
            voice.gains.push(gainNode);
            voice.nodes.push(oscillator, gainNode);
            oscillator.onended = (function (v) {
              return function () { ended(v); };
            })(voice);
            oscillator.start(cursor);
            oscillator.stop(end);
          }
          cursor = end;
        }
        if (!voice.oscillators.length) cleanupVoice(voice);
      } catch (ignore) {
        if (gameVoice) cleanupVoice(gameVoice);
        gameVoice = null;
      }
    }

    function keyDown(phoneKey) {
      var char;
      var frequencies;
      var voice;
      var i;
      if (!ready() || keyVoices[phoneKey]) return;
      try {
        if (!settings.keyTones) return;
        char = Object.prototype.hasOwnProperty.call(Tones.DTMF, phoneKey) ? phoneKey : KEY_CHAR[phoneKey];
        frequencies = char && Tones.DTMF[char];
        if (!frequencies) return;
        voice = { key: phoneKey, oscillators: [], gains: [], nodes: [], cleaned: false, endedCount: 0, startedAt: ctx.currentTime };
        keyVoices[phoneKey] = voice;
        for (i = 0; i < frequencies.length; i += 1) {
          var oscillator = ctx.createOscillator();
          var gainNode = ctx.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequencies[i], voice.startedAt);
          gainNode.gain.setValueAtTime(0, voice.startedAt);
          gainNode.gain.linearRampToValueAtTime(0.1, voice.startedAt + KEY_ATTACK);
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          voice.oscillators.push(oscillator);
          voice.gains.push(gainNode);
          voice.nodes.push(oscillator, gainNode);
          oscillator.onended = (function (v) {
            return function () { ended(v); };
          })(voice);
          oscillator.start(voice.startedAt);
        }
      } catch (ignore) {
        if (voice) cleanupVoice(voice);
      }
    }

    function keyUp(phoneKey) {
      var voice = keyVoices[phoneKey];
      var releaseAt;
      var i;
      if (!ready() || !voice) return;
      try {
        releaseAt = Math.max(ctx.currentTime, voice.startedAt + MIN_KEY_MS / 1000);
        for (i = 0; i < voice.oscillators.length; i += 1) {
          voice.gains[i].gain.cancelScheduledValues(releaseAt);
          voice.gains[i].gain.setValueAtTime(0.1, releaseAt);
          voice.gains[i].gain.linearRampToValueAtTime(0, releaseAt + KEY_RELEASE);
          voice.oscillators[i].stop(releaseAt + KEY_RELEASE);
        }
      } catch (ignore) {
        cleanupVoice(voice);
      }
    }

    function stopAll() {
      var key;
      var now;
      var voice;
      var i;
      if (!ready()) return;
      try {
        cancelGame();
        now = ctx.currentTime;
        for (key in keyVoices) {
          if (Object.prototype.hasOwnProperty.call(keyVoices, key)) {
            voice = keyVoices[key];
            for (i = 0; i < voice.oscillators.length; i += 1) {
              try {
              voice.gains[i].gain.cancelScheduledValues(now);
              voice.gains[i].gain.setValueAtTime(0.1, now);
              voice.gains[i].gain.linearRampToValueAtTime(0, now + KEY_RELEASE);
              voice.oscillators[i].stop(now + KEY_RELEASE);
              } catch (ignore) {}
            }
          }
        }
      } catch (ignore) {}
    }

    return {
      isSupported: isSupported,
      unlock: unlock,
      playGame: playGame,
      keyDown: keyDown,
      keyUp: keyUp,
      stopAll: stopAll
    };
  }

  var Audio = { create: create };
  NS.Audio = Audio;
  if (typeof module === 'object' && module.exports) module.exports = Audio;
})();
