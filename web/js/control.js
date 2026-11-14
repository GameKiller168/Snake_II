(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var Config = NS.Config || (req ? require('./config.js') : null);
  var Engine = NS.Engine || (req ? require('./engine.js') : null);
  var Rng = NS.Rng || (req ? require('./rng.js') : null);
  var W = Config.COLS, H = Config.ROWS, size = W * H;
  var RET = Engine.RET;
  var KEYS = [13, 11, 15, 17];
  var DEPTH = 2;      // how many apples ahead a way out may lead through (mazes without a cycle)
  var VARIETY = 10;   // extra, randomly broken ties between equally short routes
  var CANDIDATES = 40;
  var RESTARTS = 3;
  var WORK = 6000;    // search steps per move, so that no move takes long
  var SEARCH = 1500;  // search steps allowed when fitting a cycle to a snake

  // Closed tours through every free cell of the mazes that have one (cell = y * 20 + x). They are never followed
  // blindly: they only seed the search for a tour that fits the snake as it is, see Planner.prototype.cycleOf.
  var TOURS = {
    1: [
      85, 86, 87, 88, 89, 90, 91, 111, 112, 92, 93, 113, 133, 132, 131, 130, 110, 109, 129, 149,
      169, 168, 148, 128, 108, 107, 106, 105, 125, 126, 127, 147, 167, 7, 27, 28, 8, 9, 10, 30,
      29, 49, 48, 47, 46, 26, 6, 166, 146, 145, 165, 5, 4, 24, 25, 45, 65, 66, 67, 68,
      69, 70, 50, 51, 71, 72, 52, 53, 73, 74, 54, 34, 33, 13, 173, 172, 12, 32, 31, 11,
      171, 170, 150, 151, 152, 153, 154, 134, 114, 94, 95, 115, 135, 155, 175, 174, 14, 15, 35, 55,
      75, 76, 96, 116, 136, 156, 176, 16, 17, 177, 157, 137, 117, 97, 77, 57, 56, 36, 37, 38,
      18, 178, 158, 138, 118, 98, 78, 58, 59, 79, 99, 119, 139, 120, 100, 80, 60, 40, 41, 42,
      22, 21, 1, 161, 160, 0, 20, 39, 19, 179, 159, 140, 141, 142, 143, 123, 122, 121, 101, 102,
      103, 83, 82, 81, 61, 62, 63, 64, 44, 43, 23, 3, 2, 162, 163, 164, 144, 124, 104, 84
    ],
    2: [
      85, 86, 87, 88, 89, 90, 91, 71, 51, 50, 70, 69, 49, 48, 68, 67, 66, 65, 64, 84,
      104, 124, 144, 143, 123, 103, 83, 63, 43, 42, 62, 82, 102, 122, 142, 141, 121, 101, 81, 61,
      41, 21, 22, 23, 24, 44, 45, 25, 26, 46, 47, 27, 28, 29, 30, 31, 32, 33, 34, 35,
      36, 37, 38, 58, 78, 98, 118, 138, 158, 157, 137, 117, 97, 77, 57, 56, 76, 96, 116, 136,
      156, 155, 135, 115, 95, 75, 55, 54, 74, 94, 114, 134, 154, 153, 133, 113, 93, 73, 53, 52,
      72, 92, 112, 132, 152, 151, 131, 111, 110, 130, 150, 149, 129, 109, 108, 128, 148, 147, 127, 107,
      106, 126, 146, 145, 125, 105
    ],
    3: [
      81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 73, 74, 94, 95, 75, 55, 35,
      15, 14, 174, 154, 153, 152, 151, 131, 132, 133, 113, 114, 134, 135, 115, 116, 117, 137, 136, 156,
      155, 175, 176, 16, 36, 56, 76, 96, 97, 77, 57, 58, 38, 37, 17, 177, 157, 158, 138, 118,
      98, 78, 79, 59, 40, 41, 21, 22, 23, 43, 42, 62, 63, 64, 44, 24, 25, 26, 46, 45,
      65, 66, 67, 47, 48, 49, 29, 30, 50, 51, 31, 32, 52, 53, 54, 34, 33, 13, 173, 172,
      12, 11, 171, 170, 10, 9, 169, 168, 8, 28, 27, 7, 167, 147, 148, 149, 150, 130, 129, 128,
      127, 107, 106, 105, 104, 124, 125, 126, 146, 166, 6, 5, 165, 145, 144, 143, 163, 164, 4, 3,
      2, 162, 142, 141, 121, 122, 123, 103, 102, 101, 100, 120, 139, 119, 99, 80, 60, 61
    ],
    4: [
      101, 102, 103, 104, 105, 106, 107, 108, 109, 89, 69, 49, 29, 9, 10, 170, 150, 130, 131, 151,
      171, 11, 31, 30, 50, 70, 90, 110, 111, 91, 71, 72, 73, 93, 113, 133, 153, 173, 13, 12,
      32, 33, 34, 14, 174, 154, 134, 114, 94, 74, 75, 95, 115, 135, 155, 175, 15, 35, 36, 16,
      176, 156, 136, 116, 96, 76, 77, 97, 117, 137, 157, 177, 17, 37, 38, 18, 178, 158, 138, 118,
      98, 78, 79, 99, 119, 139, 159, 179, 160, 140, 141, 161, 162, 142, 143, 163, 164, 144, 145, 165,
      5, 4, 3, 2, 1, 0, 19, 39, 20, 21, 22, 23, 24, 25, 26, 6, 166, 146, 147, 148,
      149, 169, 168, 167, 7, 27, 47, 67, 87, 86, 66, 46, 45, 65, 85, 84, 64, 44, 43, 63,
      83, 82, 62, 42, 41, 40, 60, 61, 81, 80, 100
    ],
    6: [
      85, 86, 87, 88, 89, 69, 49, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 19, 18,
      17, 177, 176, 175, 174, 173, 172, 152, 153, 154, 155, 156, 157, 158, 178, 179, 159, 140, 160, 161,
      141, 142, 162, 163, 143, 144, 145, 146, 147, 148, 149, 150, 170, 169, 168, 167, 166, 165, 164, 4,
      3, 23, 24, 25, 26, 27, 47, 46, 45, 44, 43, 42, 22, 21, 41, 40, 59, 58, 57, 56,
      55, 54, 53, 52, 51, 50, 70, 90, 91, 92, 93, 94, 114, 113, 112, 111, 110, 109, 108, 107,
      106, 105, 104, 103, 102, 101, 100, 119, 118, 117, 116, 115, 95, 96, 97, 98, 99, 80, 81, 82,
      83, 84
    ]
  };
  // The last maze starts with a snake that fits none of its tours; these two lead into one within five steps.
  var ENTRIES = [
    [
      85, 86, 87, 88, 89, 69, 49, 29, 30, 31, 32, 33, 34, 35, 36, 37, 17, 177, 176, 175,
      174, 173, 172, 152, 153, 154, 155, 156, 157, 158, 159, 140, 160, 161, 141, 142, 162, 163, 143, 144,
      145, 146, 147, 148, 149, 150, 170, 169, 168, 167, 166, 165, 164, 4, 3, 23, 24, 25, 26, 27,
      47, 46, 45, 44, 43, 42, 22, 21, 41, 40, 59, 39, 19, 179, 178, 18, 38, 58, 57, 56,
      55, 54, 53, 52, 51, 50, 70, 90, 91, 92, 93, 113, 112, 111, 110, 109, 108, 107, 106, 105,
      104, 103, 102, 101, 100, 119, 118, 117, 116, 115, 114, 94, 95, 96, 97, 98, 99, 80, 81, 82,
      83, 84
    ],
    [
      85, 86, 87, 88, 89, 69, 49, 29, 30, 31, 32, 33, 34, 35, 36, 37, 17, 177, 176, 175,
      174, 173, 172, 152, 153, 154, 155, 156, 157, 158, 178, 18, 19, 179, 159, 140, 160, 161, 141, 142,
      162, 163, 143, 144, 145, 146, 147, 148, 149, 150, 170, 169, 168, 167, 166, 165, 164, 4, 3, 23,
      24, 25, 26, 27, 47, 46, 45, 44, 43, 42, 22, 21, 41, 40, 59, 39, 38, 58, 57, 56,
      55, 54, 53, 52, 51, 50, 70, 90, 91, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101,
      100, 119, 118, 117, 116, 115, 114, 113, 112, 92, 93, 94, 95, 96, 97, 98, 99, 80, 81, 82,
      83, 84
    ]
  ];

  // The four neighbours of every cell in the game's own order: left, up, right, down.
  var AROUND = [];
  for (var c0 = 0; c0 < size; c0++) {
    var x0 = c0 % W, y0 = (c0 - x0) / W;
    AROUND.push([
      y0 * W + (x0 + W - 1) % W, ((y0 + H - 1) % H) * W + x0,
      y0 * W + (x0 + 1) % W, ((y0 + 1) % H) * W + x0
    ]);
  }

  // Tie-breaking between equally short routes, relative to the heading: 0 straight on, 1 right, 3 left.
  var STYLES = [[0, 1, 3], [0, 3, 1], [1, 0, 3], [3, 0, 1], [1, 3, 0], [3, 1, 0]];
  var ORDER = STYLES.map(function (turns) {
    var rows = [];
    for (var heading = 0; heading < 4; heading++) rows.push(turns.map(function (t) { return (heading + t) % 4; }));
    return rows;
  });

  var chance = Math.random;
  /** The three ways on (not back) in a random order, for variety between equally short routes. */
  function shuffled(heading) {
    var a = (heading + 1) % 4, b = (heading + 3) % 4, c = heading, t, r = chance();
    if (r < 0.34) { t = a; a = c; c = t; } else if (r < 0.67) { t = b; b = c; c = t; }
    return chance() < 0.5 ? [a, b, c] : [b, a, c];
  }

  function cell(x, y) { return ((y + H) % H) * W + ((x + W) % W); }
  function cellOf(s) { return s.y * W + s.x; }
  function directionTo(a, b) {
    var around = AROUND[a];
    for (var d = 0; d < 4; d++) if (around[d] === b) return d;
    return -1;
  }

  function wallCells(game) {
    var blocked = new Uint8Array(size);
    var walls = Config.MAZES[game.mazeIndex].walls;
    for (var i = 0; i < walls.length; i++) {
      var w = walls[i];
      for (var y = w[1]; y <= w[3]; y++) for (var x = w[0]; x <= w[2]; x++) blocked[cell(x, y)] = 1;
    }
    return blocked;
  }

  /*
   * Shortest route over a field that opens up while the snake moves: body[i] can be entered at step i + 1
   * (one step later while the snake is still growing) because the tail has left it by then.
   * `at[c]` is the body index of cell c or -1; `from` is entered at step t0 while heading `heading`.
   */
  function route(wall, at, grow, scratch, from, t0, heading, goals, style, limit) {
    var dist = scratch.dist, parent = scratch.parent, way = scratch.way, queue = scratch.queue;
    dist.fill(-1);
    var head = 0, tail = 0, found = -1;
    dist[from] = t0; parent[from] = -1; way[from] = heading; queue[tail++] = from;
    while (head < tail) {
      var here = queue[head++];
      if (goals && goals[here]) { found = here; break; }
      var t = dist[here] + 1;
      if (limit && t > limit) continue;
      var order = style < STYLES.length ? ORDER[style][way[here]] : shuffled(way[here]), around = AROUND[here];
      for (var k = 0; k < 3; k++) {
        var d = order[k], next = around[d];
        if (dist[next] >= 0 || wall[next]) continue;
        var released = at[next];
        if (released >= 0 && t < released + 1 + grow) continue;
        dist[next] = t; parent[next] = here; way[next] = d; queue[tail++] = next;
      }
    }
    if (found < 0) return null;
    var cells = [];
    for (var p = found; p !== -1; p = parent[p]) cells.push(p);
    return cells.reverse();
  }

  function Planner(game) {
    this.game = game;
    this.wall = wallCells(game);
    this.scratch = {
      dist: new Int16Array(size), parent: new Int16Array(size), way: new Uint8Array(size), queue: new Int16Array(size)
    };
    this.goal = new Uint8Array(size);
    this.tailGoal = new Uint8Array(size);
    this.shut = new Uint8Array(size);
    this.at = new Int16Array(size);
    this.mark = new Uint8Array(size);
    this.stamp = new Int32Array(size);
    this.stack = new Int16Array(size);
    this.round = 0;
    this.allowance = 0;
  }

  /** What the planner needs to know about a moment of a game: the body and when each of its cells lets go. */
  Planner.prototype.moment = function (g) {
    var body = g.snake.map(cellOf);
    var at = new Int16Array(size); at.fill(-1);
    for (var i = 0; i < body.length; i++) at[body[i]] = i;
    return { body: body, at: at, head: body[body.length - 1], grow: g.grow ? 1 : 0, heading: g.curdir };
  };

  /** Play the cells in order on a copy of the game g (with the game's own rules); null if that would end badly. */
  Planner.prototype.play = function (g, steps) {
    var c = Engine.Game.restore(g.snapshot(), new Rng(0));
    if (!c) return null;
    for (var i = 0; i < steps.length; i++) {
      var head = c.snake[c.snake.length - 1], d = directionTo(cellOf(head), steps[i]);
      if (d < 0 || d === (c.curdir + 2) % 4) return null;
      c.key(KEYS[d]);
      var ret = c.tick();
      if (ret === RET.RECOVER || ret === RET.CRASH) return null;
      if (ret === RET.OVER) return i === steps.length - 1 && c.code === 0x22 ? c : null;
    }
    return c;
  };

  /** The head can reach its own tail over free cells without touching the apple that is already waiting. */
  Planner.prototype.open = function (g) {
    var body = g.snake.map(cellOf), n = body.length;
    var at = this.at, shut = this.shut;
    at.fill(-1);
    for (var i = 0; i < n; i++) at[body[i]] = i;
    shut.set(this.wall);
    if (g.apple.x >= 0) shut[cell(g.apple.x, g.apple.y)] = 1;
    this.tailGoal.fill(0); this.tailGoal[body[0]] = 1;
    return route(shut, at, g.grow ? 1 : 0, this.scratch, body[n - 1], 0, g.curdir, this.tailGoal, 0) !== null;
  };

  /** Free cells the snake could not reach again, however long it moves: holes it has left behind. */
  Planner.prototype.holes = function (g) {
    if (g.over) return 0;
    var body = g.snake.map(cellOf), n = body.length;
    var at = this.at;
    at.fill(-1);
    for (var i = 0; i < n; i++) at[body[i]] = i;
    route(this.wall, at, g.grow ? 1 : 0, this.scratch, body[n - 1], 0, g.curdir, null, 0);
    var dist = this.scratch.dist, lost = 0;
    for (i = 0; i < size; i++) if (!this.wall[i] && at[i] < 0 && dist[i] < 0) lost++;
    return lost;
  };

  /**
   * Can the snake of `g` get away from here? The next apple is already placed in the copy, so this is exact:
   * either the head can still reach its tail, or the only way on is to eat that apple, and that is safe in turn.
   */
  Planner.prototype.safe = function (g, depth) {
    if (g.over) return g.code === 0x22;
    if (this.open(g)) return true;
    if (!depth || g.apple.x < 0) return false;
    return this.direct(g, [cell(g.apple.x, g.apple.y)], 0, depth - 1, size) !== null;
  };

  /**
   * A Hamiltonian cycle that has the snake of `g` as one of its arcs: the snake plus an order of all free cells that
   * leads from its head round to its tail. While such a cycle exists the snake can always follow it, so it can never
   * be trapped and will fill the field in the end. `guide` (cell -> next cell of an older cycle) is tried first, so a
   * small change of the snake finds its new cycle at once. Returns the whole cycle (tail .. head, then the free cells),
   * [] for a finished game, null if there is none (or none was found within `budget` search steps).
   */
  Planner.prototype.cycleOf = function (g, guide, budget) {
    if (g.over) return g.code === 0x22 ? [] : null;
    var self = this, body = g.snake.map(cellOf), n = body.length, head = body[n - 1], tail = body[0];
    var mark = this.mark, stamp = this.stamp, stack = this.stack, path = [], i, k;
    mark.set(this.wall);
    for (i = 0; i < n; i++) mark[body[i]] = 1;
    var left0 = 0;
    for (i = 0; i < size; i++) if (!mark[i]) left0++;
    if (!left0) return directionTo(head, tail) >= 0 ? body.slice() : null;

    // the ways a still unvisited cell can be passed through: free neighbours, the end of the path, the tail
    function links(u, end) {
      var around = AROUND[u], count = 0;
      for (var k = 0; k < 4; k++) if (!mark[around[k]] || around[k] === end || around[k] === tail) count++;
      return count;
    }
    function open(u) {
      var around = AROUND[u], count = 0;
      for (var k = 0; k < 4; k++) if (!mark[around[k]]) count++;
      return count;
    }

    // a cell with fewer than two ways through can never be part of the cycle
    for (i = 0; i < size; i++) if (!mark[i] && links(i, head) < 2) { mark.set(this.wall); return null; }

    function feasible(from, x, left) {
      var k, v, around, urgent = 0, count = 0, ends = false;
      around = AROUND[from];
      for (k = 0; k < 4; k++) { v = around[k]; if (!mark[v] && links(v, x) < 2) return false; }
      around = AROUND[x];
      for (k = 0; k < 4; k++) {
        v = around[k];
        if (mark[v]) continue;
        var l = links(v, x);
        if (l < 2) return false;
        if (l === 2 && ++urgent > 1) return false;
      }
      if (left === 0) return true;
      around = AROUND[tail];
      for (k = 0; k < 4; k++) if (!mark[around[k]]) ends = true;
      if (!ends) return false;
      self.round++;
      around = AROUND[x];
      for (k = 0; k < 4; k++) {
        v = around[k];
        if (!mark[v] && stamp[v] !== self.round) { stamp[v] = self.round; stack[count++] = v; }
      }
      var seen = count;
      while (count) {
        around = AROUND[stack[--count]];
        for (k = 0; k < 4; k++) {
          v = around[k];
          if (!mark[v] && stamp[v] !== self.round) { stamp[v] = self.round; stack[count++] = v; seen++; }
        }
      }
      return seen === left;
    }

    var nodes = Math.min(budget || 4000, this.allowance), guided = !!guide;
    function search(cur, left) {
      if (left === 0) return directionTo(cur, tail) >= 0;
      if (--nodes < 0) return false;
      var options = [], around = AROUND[cur], k, x;
      for (k = 0; k < 4; k++) if (!mark[around[k]]) options.push(around[k]);
      if (options.length > 1) {
        var wanted = guided ? guide[cur] : -1;
        options.sort(function (a, b) {
          if (a === wanted) return -1;
          if (b === wanted) return 1;
          return open(a) - open(b) + (guided ? 0 : chance() - 0.5);
        });
      }
      for (k = 0; k < options.length; k++) {
        x = options[k];
        mark[x] = 1; path.push(x);
        if (feasible(cur, x, left - 1) && search(x, left - 1)) return true;
        mark[x] = 0; path.pop();
        if (nodes < 0) return false;
      }
      return false;
    }

    var start = nodes, found = search(head, left0);
    this.allowance -= start - Math.max(nodes, 0);
    for (var again = 0; !found && nodes < 0 && again < RESTARTS && this.allowance > 0; again++) {
      // heavy-tailed search: a few fresh starts with other tie-breaking beat one long run
      mark.set(this.wall);
      for (i = 0; i < n; i++) mark[body[i]] = 1;
      path.length = 0; nodes = Math.min(budget || 4000, this.allowance); start = nodes; guided = false;
      found = search(head, left0);
      this.allowance -= start - Math.max(nodes, 0);
    }
    mark.set(this.wall);
    return found ? body.concat(path) : null;
  };

  Planner.prototype.legalFirst = function (m, d) {
    var next = AROUND[m.head][d];
    if (d === (m.heading + 2) % 4 || this.wall[next]) return false;
    var released = m.at[next];
    return released < 0 || 1 >= released + 1 + m.grow;
  };

  /** Shortest routes (one per first step and tie-breaking style) to one of the goal cells, shortest first. */
  Planner.prototype.routes = function (m, goals, limit) {
    var found = [], seen = {};
    this.goal.fill(0);
    for (var g = 0; g < goals.length; g++) this.goal[goals[g]] = 1;
    for (var d = 0; d < 4; d++) {
      if (!this.legalFirst(m, d)) continue;
      var first = AROUND[m.head][d];
      for (var style = 0; style < STYLES.length + VARIETY; style++) {
        var steps = route(this.wall, m.at, m.grow, this.scratch, first, 1, d, this.goal, style, limit);
        if (!steps) continue;
        var key = steps.join(',');
        if (seen[key]) continue;
        seen[key] = 1;
        found.push(steps);
      }
    }
    return found.sort(function (a, b) { return a.length - b.length; });
  };

  /**
   * The shortest route to one of the goal cells that leaves the snake with a way out afterwards and does not
   * wall in more than `holes` free cells.
   */
  Planner.prototype.direct = function (g, goals, limit, depth, holes) {
    var found = this.routes(this.moment(g), goals, limit);
    for (var i = 0; i < found.length; i++) {
      var after = this.play(g, found[i]);
      if (after && this.safe(after, depth) && this.holes(after) <= holes) return found[i];
    }
    return null;
  };

  function create(game, random) {
    random = random || Math.random;
    chance = random;
    var planner = new Planner(game), plan = null, witness = null, entry = null, entered = 0;
    var quiet = 0, lastLength = game.snake.length, lastScore = game.score, seen = new Int32Array(size), clock = 0;

    function foodCell() { return game.apple.x >= 0 && game.apple.y >= 0 ? cell(game.apple.x, game.apple.y) : -1; }
    function bonusCells() {
      var found = [];
      if (!game.active || !game.creature.shown || game.progress <= 0) return found;
      for (var i = 0; i < game.cells.length; i++) {
        var c = game.cells[i];
        if (c.x < 0 || c.y < 0) continue;
        var n = cell(c.x, c.y);
        if (found.indexOf(n) < 0) found.push(n);
      }
      return found;
    }

    function stillValid(m, next) {
      var d = directionTo(m.head, next);
      if (d < 0 || d === (game.curdir + 2) % 4) return false;
      var tail = game.snake[0];
      return !game.occ[next] || (next === cellOf(tail) && !game.grow);
    }

    /** A cycle through all free cells, kept together with the position of every cell in it. */
    function keep(cyc) {
      var idx = new Int16Array(size), succ = new Int16Array(size);
      idx.fill(-1); succ.fill(-1);
      for (var i = 0; i < cyc.length; i++) { idx[cyc[i]] = i; succ[cyc[i]] = cyc[(i + 1) % cyc.length]; }
      return { cyc: cyc, idx: idx, succ: succ };
    }

    /** Does the snake lie along `tour` (either way round)? Then it is the cycle to follow. */
    function adopt(tour) {
      var body = game.snake.map(cellOf), n = tour.length, at = {}, i, forward = true, backward = true;
      for (i = 0; i < n; i++) at[tour[i]] = i;
      for (i = 0; i < body.length; i++) if (at[body[i]] === undefined) return null;
      for (i = 1; i < body.length; i++) {
        if ((at[body[i - 1]] + 1) % n !== at[body[i]]) forward = false;
        if ((at[body[i]] + 1) % n !== at[body[i - 1]]) backward = false;
      }
      if (!forward && !backward) return null;
      return keep(forward ? tour.slice() : tour.slice().reverse());
    }

    /** One step along the cycle: always possible, whatever else happens. */
    function follow(m) {
      if (!witness) return -1;
      var i = witness.idx[m.head];
      if (i < 0) return -1;
      var next = witness.cyc[(i + 1) % witness.cyc.length];
      return stillValid(m, next) ? directionTo(m.head, next) : -1;
    }

    /** The shortest route to the goals after which a cycle through the whole field still exists. */
    function shortcut(m, goals, limit) {
      var found = planner.routes(m, goals, limit);
      for (var i = 0; i < found.length && i < CANDIDATES; i++) {
        var after = planner.play(game, found[i]);
        if (!after) continue;
        var cyc = planner.cycleOf(after, witness.succ, SEARCH);
        if (cyc) return { steps: found[i], cyc: cyc.length ? cyc : null };
      }
      return null;
    }

    /** The same without a cycle to rely on: keep the way to the tail open and leave no holes behind. */
    function carefully(m, goals, limit, holes) {
      var found = planner.routes(m, goals, limit);
      for (var i = 0; i < found.length && i < CANDIDATES; i++) {
        var after = planner.play(game, found[i]);
        if (after && planner.safe(after, DEPTH) && planner.holes(after) <= holes) return { steps: found[i], cyc: null };
      }
      return null;
    }

    /** No safe way to any food right now: keep a way out open and close in on the target. */
    function survive(m, targets) {
      var best = -1, bestScore = -Infinity, wander = Math.min(quiet / 40, 40), goals = planner.goal;
      goals.fill(0);
      for (var g = 0; g < targets.length; g++) goals[targets[g]] = 1;
      for (var d = 0; d < 4; d++) {
        if (!planner.legalFirst(m, d)) continue;
        var next = AROUND[m.head][d], after = planner.play(game, [next]);
        if (!after) continue;
        var open = planner.safe(after, 1);
        var way = route(planner.wall, m.at, m.grow, planner.scratch, next, 1, d, goals, 0);
        var far = way ? way.length : 99, age = clock - seen[next];
        var score = (open ? 100000 : 0) - far * 100 + Math.min(age, 60) * 0.5 + random() * (1 + wander);
        if (score > bestScore) { bestScore = score; best = d; }
      }
      return best;
    }

    var tour = TOURS[game.mazeIndex];
    if (tour) witness = adopt(tour);
    if (!witness && tour && game.mazeIndex === 6) {
      var apple0 = foodCell(), head0 = cellOf(game.snake[game.snake.length - 1]);
      entry = ENTRIES[0];
      for (var e = 0; e < ENTRIES.length; e++) {
        var at0 = ENTRIES[e].indexOf(head0), clear = true;
        for (var k = 1; k <= 5; k++) if (ENTRIES[e][(at0 + k) % ENTRIES[e].length] === apple0) clear = false;
        if (clear) { entry = ENTRIES[e]; break; }
      }
    }

    return {
      step: function () {
        clock++;
        if (game.snake.length !== lastLength || game.score !== lastScore) {
          lastLength = game.snake.length; lastScore = game.score; quiet = 0;
        } else quiet++;
        var m = planner.moment(game), d = -1, attempt;
        planner.allowance = WORK;
        seen[m.head] = clock;

        if (entry) {                                   // the first steps of the last maze, until the snake fits a cycle
          if (entered < 5) {
            entered++;
            d = directionTo(m.head, entry[(entry.indexOf(m.head) + 1) % entry.length]);
            if (d >= 0) { game.key(KEYS[d]); return d; }
          }
          witness = adopt(entry); entry = null;
        }

        var bonus = bonusCells(), food = foodCell(), tolerance = quiet < 40 ? 0 : quiet < 120 ? 2 : quiet < 400 ? 6 : size;
        if (plan && plan.steps.length && !stillValid(m, plan.steps[0])) { plan = null; witness = null; }
        if (!witness && tour) {                        // lost the cycle: find one that fits the snake as it is
          planner.allowance = WORK * 4;
          var again = planner.cycleOf(game, null, SEARCH * 5);
          if (again && again.length) witness = keep(again);
        }

        // the bonus first: whatever the snake can reach before it runs off, if it can do so safely
        if (bonus.length && !(plan && plan.bonus)) {
          attempt = witness ? shortcut(m, bonus, game.progress) : carefully(m, bonus, game.progress, tolerance + 1);
          if (attempt) { attempt.bonus = true; plan = attempt; }
        }
        if (plan && plan.bonus && !bonus.length) plan = null;
        if (!plan && food >= 0) {
          attempt = witness ? shortcut(m, [food], 0) : carefully(m, [food], 0, tolerance);
          if (attempt) { attempt.bonus = false; plan = attempt; }
        }

        if (plan && plan.steps.length) {
          d = directionTo(m.head, plan.steps.shift());
          if (!plan.steps.length) { if (plan.cyc) witness = keep(plan.cyc); plan = null; }
        } else {
          plan = null;
          d = follow(m);
          if (d < 0) d = survive(m, bonus.length ? bonus : (food >= 0 ? [food] : []));
        }
        if (d >= 0) game.key(KEYS[d]);
        return d;
      }
    };
  }

  // The mazes that have a closed tour through every cell. The last-but-one cannot be cleared at all: its cells
  // are 60 of one colour and 58 of the other, and a snake alternates colours, so it can never be longer than 117.
  NS.Control = { create: create, MAZES: Object.keys(TOURS).map(Number) };
  if (typeof module === 'object' && module.exports) module.exports = NS.Control;
})();
