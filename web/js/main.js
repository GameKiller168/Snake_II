/*
 * Snake II - browser edition: wires the pieces to the page.
 *
 *   Controller (rules + states)  ->  Scene (draws the 84x48 matrix)  ->  LCD (paints the canvas)
 *   Input (keys, swipes, buttons) -> Controller;  Audio plays what the Controller reports.
 *
 * URL options, handy for testing and screenshots:
 *   ?corners=2021   draw the turns exactly like the 2021 version (gaps and stubs at the corners)
 *   ?skin=neon|lcd  colours
 *   ?seed=123       reproducible apples
 */
(function () {
  'use strict';

  var NS = globalThis.SnakeII;
  var doc = document;

  function $(id) {
    return doc.getElementById(id);
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var params;
  try {
    params = new URLSearchParams(location.search);
  } catch (e) {
    params = { get: function () { return null; } };
  }

  var I18n = NS.I18n;
  var store = NS.Store.create();

  var seed = params.get('seed');
  var rng = seed !== null && seed !== '' ? mulberry32(parseInt(seed, 10) || 1) : Math.random;
  var controller = new NS.Controller({ store: store, rng: rng, corner: params.get('corners') !== '2021' });

  var app = $('app');
  var stage = $('stage');
  var bezel = $('bezel');
  var canvas = $('lcd');
  var hintEl = $('hint');
  var liveEl = $('live');
  var btnSound = $('btn-sound');
  var btnSkin = $('btn-skin');
  var btnLang = $('btn-lang');
  var btnOk = $('btn-ok');
  var btnMenu = $('btn-menu');

  var lang = store.get('lang', I18n.detect(navigator.language));
  if (I18n.LANGS.indexOf(lang) < 0) lang = 'en';

  var skin = params.get('skin') || store.get('skin', 'lcd');
  var lcd = new NS.LCD(canvas, { skin: skin });
  var fb = new NS.Framebuffer(NS.config.LCD_W, NS.config.LCD_H);

  var audio = new NS.AudioOut();
  audio.setMuted(store.get('sound', 'on') === 'off');

  // --- texts, buttons ---------------------------------------------------------------------------

  var lastHint = '';

  function tt(key, vars) {
    return I18n.t(lang, key, vars);
  }

  function applyTexts() {
    doc.documentElement.lang = lang;
    doc.title = tt('doc.title');
    canvas.setAttribute('aria-label', tt('aria.lcd'));
    $('tools').setAttribute('aria-label', tt('aria.tools'));
    $('pad').setAttribute('aria-label', tt('aria.pad'));
    btnLang.textContent = tt('tool.lang');
    btnLang.title = tt('tool.lang.title');
    var labels = { 'k-up': 'btn.up', 'k-down': 'btn.down', 'k-left': 'btn.left', 'k-right': 'btn.right' };
    for (var id in labels) $(id).setAttribute('aria-label', tt(labels[id]));
    btnMenu.textContent = tt('btn.menu');
    updateTools();
    lastHint = '';
    updateHint();
  }

  function updateTools() {
    var soundOn = !audio.muted;
    btnSound.textContent = tt(soundOn ? 'tool.sound.on' : 'tool.sound.off');
    btnSound.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    btnSkin.textContent = tt('tool.skin.' + lcd.skin.name);
  }

  function updateHint() {
    var touch = app.getAttribute('data-input') === 'touch';
    var key = controller.hintKey();
    var text = tt('hint.' + key + (touch ? '.touch' : '.kbd'));
    if (text !== lastHint) {
      hintEl.textContent = text;
      lastHint = text;
    }
    var ok = tt('btn.' + key);
    if (btnOk.textContent !== ok) btnOk.textContent = ok;
    if (app.getAttribute('data-mode') !== controller.mode) app.setAttribute('data-mode', controller.mode);
  }

  function setInputMode(mode) {
    if (app.getAttribute('data-input') === mode) return;
    app.setAttribute('data-input', mode);
    lastHint = '';
    updateHint();
    fit();
  }

  // --- page level actions --------------------------------------------------------------------------

  function toggleSound() {
    audio.setMuted(!audio.muted);
    store.set('sound', audio.muted ? 'off' : 'on');
    updateTools();
    if (!audio.muted) audio.play('menu');
  }

  function cycleSkin() {
    var name = lcd.nextSkin();
    store.set('skin', name);
    updateTools();
  }

  function toggleLang() {
    lang = lang === 'hu' ? 'en' : 'hu';
    store.set('lang', lang);
    applyTexts();
  }

  function onAction(action, arg, source) {
    if (source === 'touch') setInputMode('touch');
    else if (source === 'kbd') setInputMode('kbd');
    audio.unlock(); // allowed here: we are inside a user gesture
    switch (action) {
      case 'mute':
        toggleSound();
        return;
      case 'skin':
        cycleSkin();
        return;
      case 'lang':
        toggleLang();
        return;
    }
    controller.press(action, arg);
  }

  // --- sizing ---------------------------------------------------------------------------------------

  function px(v) {
    return parseFloat(v) || 0;
  }

  function fit() {
    var cs = getComputedStyle(stage);
    var bz = getComputedStyle(bezel);
    var innerW = stage.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight);
    var innerH = stage.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom);
    var extraW = px(bz.paddingLeft) + px(bz.paddingRight) + px(bz.borderLeftWidth) + px(bz.borderRightWidth);
    var extraH = px(bz.paddingTop) + px(bz.paddingBottom) + px(bz.borderTopWidth) + px(bz.borderBottomWidth);
    lcd.resize(Math.max(1, innerW - extraW), Math.max(1, innerH - extraH), window.devicePixelRatio || 1);
  }

  // --- announcements for screen readers ------------------------------------------------------------

  var prevMode = controller.mode;

  function announce(text) {
    liveEl.textContent = '';
    // the empty string first makes screen readers repeat identical messages
    window.setTimeout(function () {
      liveEl.textContent = text;
    }, 30);
  }

  function modeChanged(from, to) {
    if (to === 'paused') announce(tt('live.paused'));
    else if (from === 'paused' && to === 'play') announce(tt('live.resumed'));
    else if (from === 'title' && to === 'play') announce(tt('live.start', { level: controller.level }));
    else if (to === 'over') {
      var score = controller.game ? controller.game.score : 0;
      announce(
        tt(controller.cleared ? 'live.cleared' : controller.newBest ? 'live.overBest' : 'live.over', { score: score })
      );
    }
  }

  // --- main loop ------------------------------------------------------------------------------------

  var last = 0;

  function frame(ts) {
    window.requestAnimationFrame(frame);
    var dt = last ? ts - last : 0;
    last = ts;

    controller.update(dt);

    var sounds = controller.drainSounds();
    for (var i = 0; i < sounds.length; i++) audio.play(sounds[i]);

    if (controller.mode !== prevMode) {
      modeChanged(prevMode, controller.mode);
      prevMode = controller.mode;
    }

    NS.Scene.render(fb, controller.view());
    lcd.draw(fb);
    updateHint();
  }

  // --- start ----------------------------------------------------------------------------------------

  var coarse = false;
  try {
    coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  } catch (e) {
    coarse = false;
  }
  app.setAttribute('data-input', coarse ? 'touch' : 'kbd');

  NS.Input.attach({ onAction: onAction, stage: stage, pad: $('pad') });

  function chip(btn, fn) {
    btn.addEventListener('click', function () {
      audio.unlock();
      fn();
      if (btn.blur) btn.blur(); // keep Space / Enter for the game, not for the last clicked button
    });
  }
  chip(btnSound, toggleSound);
  chip(btnSkin, cycleSkin);
  chip(btnLang, toggleLang);

  // pause when the player leaves
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) controller.press('autopause');
    else last = 0;
  });
  window.addEventListener('blur', function () {
    controller.press('autopause');
  });

  if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(stage);
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  applyTexts();
  fit();
  window.requestAnimationFrame(function (ts) {
    fit();
    frame(ts);
  });

  // a handle for the console and for browser tests
  NS.app = {
    controller: controller,
    lcd: lcd,
    fb: fb,
    store: store,
    audio: audio,
    fit: fit,
    lang: function () { return lang; }
  };
})();
