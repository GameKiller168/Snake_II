/*
 * The page: one phone, one display, a few keys. All the rest is in the other files.
 */
(function () {
  'use strict';

  var NS = globalThis.SnakeII;
  var MAX_STEP_MS = 250;           // after a pause (hidden tab) the game goes on from where it was, it does not catch up

  var phone = new NS.Phone({ store: NS.Store.create() });
  var lcd = new NS.Lcd(document.getElementById('lcd'));
  var last = performance.now();

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
      phone.press(key);
      paint();
    }
  });

  document.addEventListener('visibilitychange', function () { last = performance.now(); });

  NS.phone = phone;                // for the console and the page tests
  paint();
  requestAnimationFrame(frame);
})();
