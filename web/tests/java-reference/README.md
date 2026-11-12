# Java reference (golden frames)

`GoldenDump.java` is a small harness that lives next to, but outside of, the original 2021 project.
It only **reads** the untouched sources in `Snake II/src`: it builds game states, calls the original
`Screen.paint(Graphics)` on an off-screen 841 x 576 image and samples every 10 x 12 LCD cell down to the
84 x 48 bit matrix the game shows. The result is `../fixtures/golden.json`, which the browser tests
(`../golden.test.js`) compare against bit for bit.

Regenerate the fixture (JDK 8+, run from the repository root):

```sh
mkdir -p /tmp/snake_ref_classes
javac -nowarn -d /tmp/snake_ref_classes \
  "Snake II/src/entities/Apple.java" "Snake II/src/entities/BodyParts.java" \
  "Snake II/src/entities/Display.java" "Snake II/src/Snake/graphics/Screen.java" \
  web/tests/java-reference/GoldenDump.java
java -Djava.awt.headless=true -cp /tmp/snake_ref_classes GoldenDump web/tests/fixtures/golden.json /tmp/snake_ref_png
```

The optional second argument is a folder for PNG previews of the corner / loop / staircase scenarios.
