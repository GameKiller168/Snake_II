/*
 * The page: one phone, one display, a few keys. All the rest is in the other files.
 */
(function () {
  'use strict';

  var NS = globalThis.SnakeII;
  var MAX_STEP_MS = 250;           // after a pause (hidden tab) the game goes on from where it was, it does not catch up

  var phone = new NS.Phone({ store: NS.Store.create() });
  var storage = null;
  try { storage = globalThis.localStorage; } catch (ignore) {}
  // Restore and autosave are invisible; transient screens return to the phone's main menu.
  var save = NS.Save.create({ storage: storage });
  var snap = save.load();
  if (snap) phone.restore(snap);
  var autosave = NS.Save.autosave({ phone: phone, save: save });
  var originalPress = phone.press;
  phone.press = function (key) { originalPress.call(phone, key); autosave.touch(); autosave.flush(); };
  phone.onChange = function () { autosave.touch(); autosave.flush(); };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') autosave.flush(); });
  globalThis.addEventListener('pagehide', function () { autosave.flush(); });
  var audio = NS.Audio.create({ settings: phone.store });
  phone.onEvent = function (name) {
    if (name === 'vibration') {
      try { if (phone.store.vibration && globalThis.navigator && typeof globalThis.navigator.vibrate === 'function') globalThis.navigator.vibrate(494); } catch (ignore) {}
    } else audio.playGame(name);
  };
  var lcd = new NS.Lcd(document.getElementById('lcd'));
  var last = performance.now();

  function updatePageLanguage() {
    var t = function (key) { return NS.I18n.text(key, phone.store.language); };
    var lang = NS.I18n.resolve(phone.store.language);
    document.documentElement.lang = lang;
    document.getElementById('lcd').setAttribute('aria-label', t('DISPLAY'));
    document.getElementById('keys').setAttribute('aria-label', t('KEYS'));
    var buttons = document.querySelectorAll('#keys [data-key]');
    for (var i = 0; i < buttons.length; i++) {
      var key = buttons[i].getAttribute('data-key');
      if (key === 'select') {
        buttons[i].setAttribute('aria-label', t('BUTTON_SELECT'));
        var cap = buttons[i].querySelector('.cap');
        if (cap) cap.textContent = t('SELECT');
      } else if (key === 'scrollUp') buttons[i].setAttribute('aria-label', t('SCROLL_UP'));
      else if (key === 'scrollDown') buttons[i].setAttribute('aria-label', t('SCROLL_DOWN'));
      else if (key === 'c') buttons[i].setAttribute('aria-label', 'C');
      else buttons[i].setAttribute('aria-label', key);
    }
    document.querySelector('.help').textContent = t('KEYBOARD_HELP');
  }
  phone.onLanguageChange = updatePageLanguage;
  updatePageLanguage();
  if (NS.Notice) NS.Notice.show({ container: document.querySelector('main.unit'), storage: storage });

  function sync() {
    var now = performance.now();
    phone.advance(Math.min(now - last, MAX_STEP_MS));
    last = now;
  }

  function paint() {
    lcd.draw(phone.draw());
  }

  function frame() {
    sync();
    paint();
    requestAnimationFrame(frame);
  }

  NS.Input.attach({
    inGame: function () { return phone.inGame(); },
    pad: document.getElementById('keys'),
    onPress: function (key) {
      sync();
      audio.unlock();
      audio.keyDown(key);
      phone.press(key);
      paint();
    },
    onRelease: function (key) { audio.keyUp(key); }
  });

  document.addEventListener('visibilitychange', function () { last = performance.now(); });

  NS.phone = phone;                // for the console and the page tests
  paint();
  requestAnimationFrame(frame);
})();
