import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.PrintWriter;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import javax.imageio.ImageIO;

import Snake.graphics.Screen;
import entities.Apple;
import entities.BodyParts;

/**
 * Golden-frame dumper for the browser port.
 *
 * Lives OUTSIDE the original project. It only READS the 2021 sources (compiled into a separate
 * output directory), builds game states, calls the ORIGINAL Screen.paint(Graphics) on an offscreen
 * BufferedImage and samples the 841x576 picture down to the 84x48 LCD matrix (10x12 screen pixels
 * per LCD pixel, exactly like the original window).
 */
public class GoldenDump {

    static sun.misc.Unsafe unsafe;
    static Field fSnake, fOr, fApples, fScore, fLen;

    // movement area used by the golden scenarios: cx 0..19, cy 0..8 (nothing leaves the frame)
    static final int COLS = 20, ROWS = 9;
    // 0 = right, 1 = left, 2 = up, 3 = down (the original lastPressed codes)
    static final int[] DX = {1, -1, 0, 0};
    static final int[] DY = {0, 0, -1, 1};
    static final int[] OPP = {1, 0, 3, 2};

    static class Scenario {
        String name;
        List<int[]> segs = new ArrayList<>();
        int[] apple;
        int score;
        String[] rows;
    }

    static Scenario make(String name, List<int[]> segs, int[] apple, int score) {
        Scenario s = new Scenario();
        s.name = name;
        s.segs = segs;
        s.apple = apple;
        s.score = score;
        return s;
    }

    static List<int[]> path(int cx, int cy, int[] moves) {
        List<int[]> segs = new ArrayList<>();
        segs.add(new int[]{cx, cy, moves[0]});
        for (int m : moves) {
            cx += DX[m];
            cy += DY[m];
            if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) {
                throw new IllegalStateException("path leaves the field");
            }
            segs.add(new int[]{cx, cy, m});
        }
        return segs;
    }

    static boolean fits(int cx, int cy, int[] moves) {
        for (int m : moves) {
            cx += DX[m];
            cy += DY[m];
            if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return false;
        }
        return cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS;
    }

    static int[] rep(int dir, int n) {
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = dir;
        return a;
    }

    static int[] cat(int[]... parts) {
        int n = 0;
        for (int[] p : parts) n += p.length;
        int[] a = new int[n];
        int k = 0;
        for (int[] p : parts) for (int v : p) a[k++] = v;
        return a;
    }

    static List<int[]> centered(int[] moves) {
        int bestX = -1, bestY = -1, bestD = Integer.MAX_VALUE;
        for (int cx = 0; cx < COLS; cx++) {
            for (int cy = 0; cy < ROWS; cy++) {
                if (!fits(cx, cy, moves)) continue;
                int d = (cx - 10) * (cx - 10) + (cy - 4) * (cy - 4);
                if (d < bestD) {
                    bestD = d;
                    bestX = cx;
                    bestY = cy;
                }
            }
        }
        if (bestX < 0) throw new IllegalStateException("no start position fits");
        return path(bestX, bestY, moves);
    }

    static List<Scenario> build() {
        List<Scenario> out = new ArrayList<>();

        out.add(make("empty", new ArrayList<int[]>(), null, 0));

        int[] scores = {0, 4, 8, 12, 36, 40, 44, 96, 100, 123, 400, 404, 999, 1000, 1234, 2468,
                5678, 7890, 9012, 3456, 9996, 9999, 70, 700, 7000, 1, 2, 3, 5, 6, 7, 9};
        for (int sc : scores) out.add(make("score_" + sc, new ArrayList<int[]>(), null, sc));

        int[][] apples = {{0, 0}, {19, 0}, {0, 8}, {19, 8}, {10, 4}, {1, 5}, {5, 2}, {14, 7}, {7, 1}, {18, 3}};
        for (int[] a : apples) {
            out.add(make("apple_" + a[0] + "_" + a[1], new ArrayList<int[]>(), a, 0));
        }

        out.add(make("straight_R", path(6, 4, rep(0, 8)), null, 0));
        out.add(make("straight_L", path(14, 4, rep(1, 8)), null, 0));
        out.add(make("straight_U", path(10, 8, rep(2, 8)), null, 0));
        out.add(make("straight_D", path(10, 0, rep(3, 8)), null, 0));
        out.add(make("original_start", path(1, 5, rep(0, 9)), new int[]{12, 5}, 0));

        String[] dn = {"R", "L", "U", "D"};
        for (int a = 0; a < 4; a++) {
            for (int b = 0; b < 4; b++) {
                if (b == a || b == OPP[a]) continue;
                out.add(make("corner_" + dn[a] + "to" + dn[b], centered(cat(rep(a, 5), rep(b, 4))), null, 0));
            }
        }

        // rectangle-ish loop with every corner type, plus staircases
        out.add(make("loop_cw", path(4, 2, cat(rep(0, 6), rep(3, 4), rep(1, 6), rep(2, 3))), null, 0));
        out.add(make("loop_ccw", path(4, 6, cat(rep(0, 6), rep(2, 4), rep(1, 6), rep(3, 3))), null, 0));
        int[] stairRU = new int[10], stairRD = new int[10], stairLU = new int[10], stairLD = new int[10];
        for (int i = 0; i < 10; i += 2) {
            stairRU[i] = 0; stairRU[i + 1] = 2;
            stairRD[i] = 0; stairRD[i + 1] = 3;
            stairLU[i] = 1; stairLU[i + 1] = 2;
            stairLD[i] = 1; stairLD[i + 1] = 3;
        }
        out.add(make("stairs_RU", centered(stairRU), null, 0));
        out.add(make("stairs_RD", centered(stairRD), null, 0));
        out.add(make("stairs_LU", centered(stairLU), null, 0));
        out.add(make("stairs_LD", centered(stairLD), null, 0));

        // self-avoiding random walks (seeded with the year of the original)
        Random rnd = new Random(2021);
        int made = 0;
        while (made < 60) {
            int len = 8 + rnd.nextInt(60);
            int cx = rnd.nextInt(COLS), cy = rnd.nextInt(ROWS);
            boolean[][] used = new boolean[COLS][ROWS];
            used[cx][cy] = true;
            List<int[]> segs = new ArrayList<>();
            int dir = rnd.nextInt(4);
            segs.add(new int[]{cx, cy, dir});
            for (int i = 1; i < len; i++) {
                List<Integer> options = new ArrayList<>();
                for (int d = 0; d < 4; d++) {
                    if (d == OPP[dir]) continue;
                    int nx = cx + DX[d], ny = cy + DY[d];
                    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || used[nx][ny]) continue;
                    options.add(d);
                }
                if (options.isEmpty()) break;
                int pick;
                if (options.contains(dir) && rnd.nextInt(100) < 65) pick = dir;
                else pick = options.get(rnd.nextInt(options.size()));
                dir = pick;
                cx += DX[dir];
                cy += DY[dir];
                used[cx][cy] = true;
                segs.add(new int[]{cx, cy, dir});
            }
            if (segs.size() < 8) continue;
            // first segment keeps the direction of the second one (it is never drawn)
            segs.get(0)[2] = segs.get(1)[2];
            int[] apple = null;
            if (rnd.nextInt(100) < 70) {
                for (int tries = 0; tries < 50; tries++) {
                    int ax = rnd.nextInt(COLS), ay = rnd.nextInt(ROWS);
                    if (!used[ax][ay]) {
                        apple = new int[]{ax, ay};
                        break;
                    }
                }
            }
            int score = 4 * rnd.nextInt(250);
            out.add(make("walk_" + made, segs, apple, score));
            made++;
        }
        return out;
    }

    static boolean black(BufferedImage img, int x, int y) {
        return (img.getRGB(x, y) & 0xFFFFFF) == 0;
    }

    static int partialCells = 0;

    static BufferedImage paint(Scenario sc) throws Exception {
        Screen s = (Screen) unsafe.allocateInstance(Screen.class);
        ArrayList<BodyParts> snake = new ArrayList<>();
        ArrayList<Integer> or = new ArrayList<>();
        for (int[] g : sc.segs) {
            int px = 3 + 4 * g[0], py = 11 + 4 * g[1];
            // the original Screen.tick() passes (yCoor, xCoor) to the BodyParts constructor
            snake.add(new BodyParts(py, px, 10));
            or.add(g[2]);
        }
        ArrayList<Apple> apples = new ArrayList<>();
        if (sc.apple != null) apples.add(new Apple(3 + 4 * sc.apple[0], 11 + 4 * sc.apple[1], 10));
        fSnake.set(s, snake);
        fOr.set(s, or);
        fApples.set(s, apples);
        fScore.setInt(s, sc.score);
        fLen.setInt(s, String.valueOf(sc.score).length());

        BufferedImage img = new BufferedImage(841, 576, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        s.paint(g);
        g.dispose();
        return img;
    }

    static String[] sample(BufferedImage img) {
        String[] rows = new String[48];
        for (int r = 0; r < 48; r++) {
            StringBuilder hex = new StringBuilder();
            int nib = 0, bits = 0;
            for (int c = 0; c < 84; c++) {
                boolean a = black(img, c * 10 + 5, r * 12 + 6);
                boolean b = black(img, c * 10 + 1, r * 12 + 1);
                boolean d = black(img, c * 10 + 9, r * 12 + 11);
                if (a != b || a != d) partialCells++;
                nib = (nib << 1) | (a ? 1 : 0);
                if (++bits == 4) {
                    hex.append(Integer.toHexString(nib));
                    nib = 0;
                    bits = 0;
                }
            }
            rows[r] = hex.toString();
        }
        return rows;
    }

    public static void main(String[] args) throws Exception {
        String jsonPath = args[0];
        File pngDir = args.length > 1 ? new File(args[1]) : null;
        if (pngDir != null) pngDir.mkdirs();

        Field f = sun.misc.Unsafe.class.getDeclaredField("theUnsafe");
        f.setAccessible(true);
        unsafe = (sun.misc.Unsafe) f.get(null);
        fSnake = Screen.class.getDeclaredField("snake");
        fOr = Screen.class.getDeclaredField("orArray");
        fApples = Screen.class.getDeclaredField("apples");
        fScore = Screen.class.getDeclaredField("Score");
        fLen = Screen.class.getDeclaredField("lenNum");
        for (Field x : new Field[]{fSnake, fOr, fApples, fScore, fLen}) x.setAccessible(true);

        List<Scenario> all = build();
        StringBuilder json = new StringBuilder();
        json.append("{\n  \"about\": \"Golden frames rendered by the ORIGINAL 2021 Java code (Screen.paint). ")
            .append("84x48 LCD, rows as 21 hex digits (4 LCD pixels each, MSB first). ")
            .append("Segments are [cx, cy, dir]; dir 0=right 1=left 2=up 3=down; anchor px = 3 + 4*cx, py = 11 + 4*cy.\",\n");
        json.append("  \"scenarios\": [\n");
        for (int i = 0; i < all.size(); i++) {
            Scenario sc = all.get(i);
            BufferedImage img = paint(sc);
            sc.rows = sample(img);
            if (pngDir != null && (sc.name.startsWith("corner_") || sc.name.startsWith("loop")
                    || sc.name.startsWith("stairs") || sc.name.startsWith("straight") || sc.name.equals("walk_0")
                    || sc.name.equals("walk_1") || sc.name.equals("walk_2") || sc.name.equals("original_start"))) {
                ImageIO.write(img, "png", new File(pngDir, sc.name + ".png"));
            }
            json.append("    {\"name\": \"").append(sc.name).append("\", \"score\": ").append(sc.score).append(", \"apple\": ");
            json.append(sc.apple == null ? "null" : "[" + sc.apple[0] + ", " + sc.apple[1] + "]");
            json.append(", \"segments\": [");
            for (int k = 0; k < sc.segs.size(); k++) {
                int[] g = sc.segs.get(k);
                if (k > 0) json.append(", ");
                json.append("[").append(g[0]).append(", ").append(g[1]).append(", ").append(g[2]).append("]");
            }
            json.append("],\n      \"rows\": [");
            for (int r = 0; r < 48; r++) {
                if (r > 0) json.append(", ");
                json.append("\"").append(sc.rows[r]).append("\"");
            }
            json.append("]}");
            json.append(i + 1 < all.size() ? ",\n" : "\n");
        }
        json.append("  ]\n}\n");
        try (PrintWriter w = new PrintWriter(jsonPath, "UTF-8")) {
            w.print(json);
        }
        System.out.println("scenarios: " + all.size() + ", partial (non cell-aligned) LCD pixels: " + partialCells);
    }
}
