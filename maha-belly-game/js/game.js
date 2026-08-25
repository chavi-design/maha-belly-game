(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const shell = document.getElementById("gameShell");
  const overlay = document.getElementById("overlay");
  const startButton = document.getElementById("startButton");
  const soundButton = document.getElementById("soundButton");
  const pauseButton = document.getElementById("pauseButton");
  const caffeineBanner = document.getElementById("caffeineBanner");
  const liveStatus = document.getElementById("liveStatus");
  const arrowButtons = [...document.querySelectorAll("[data-direction]")];

  ctx.imageSmoothingEnabled = false;

  const W = 1080;
  const H = 1920;
  const TILE = 56;
  const COLS = 15;
  const ROWS = 15;
  const BOARD_W = COLS * TILE;
  const BOARD_H = ROWS * TILE;
  const BOARD_X = (W - BOARD_W) / 2;
  const BOARD_Y = 405;
  const PLAYER_ANIMATION_MS = 115;
  const ENEMY_ANIMATION_MS = 125;
  const CAFFEINE_STEPS = 14;

  const C = {
    blue: "#0600ff",
    green: "#26ff00",
    white: "#ffffff",
    black: "#000000",
    yellow: "#ffd42b",
    orange: "#ff8a21",
    cream: "#fff1c9",
    leaf: "#2d8a40",
    leafLight: "#9bf28e",
    red: "#ef3f43",
    pink: "#ff76c8",
    purple: "#7738ff",
    cyan: "#32d9ff",
    brown: "#8d4b26",
    skin: "#d7935f",
    gold: "#f2ba31",
    rice: "#fbf7ed",
    wall: "#08082c"
  };

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const MAPS = [
    [
      "###############",
      "#P....#.......#",
      "#.###.#.#####.#",
      "#.....#.....#.#",
      "#####.#####.#.#",
      "#...........#.#",
      "#.#####.#####.#",
      "#.....#.......#",
      "#.###.#######.#",
      "#...#.........#",
      "###.#####.###.#",
      "#.........#...#",
      "#.#######.#.#.#",
      "#.....C.......#",
      "###############"
    ],
    [
      "###############",
      "#P........#...#",
      "#.##.#.#.#.#..#",
      "#....#...#....#",
      "####.#####.####",
      "#......#......#",
      "#.####.#.####.#",
      "#.#.........#.#",
      "#.#.#######.#.#",
      "#...#.....#...#",
      "#.###.###.###.#",
      "#.....#.#.....#",
      "#.#####.#####.#",
      "#......C......#",
      "###############"
    ],
    [
      "###############",
      "#P......#.....#",
      "#.#####.#.###.#",
      "#.#.....#...#.#",
      "#.#.#######.#.#",
      "#.#.........#.#",
      "#.###########.#",
      "#.............#",
      "###.#######.###",
      "#...#.....#...#",
      "#.###.###.###.#",
      "#.....#.#.....#",
      "#.#####.#####.#",
      "#..C..........#",
      "###############"
    ],
    [
      "###############",
      "#P..#.........#",
      "#.#.#.#######.#",
      "#.#.#.......#.#",
      "#.#.#######.#.#",
      "#.#.........#.#",
      "#.###########.#",
      "#.............#",
      "#.###########.#",
      "#.#.........#.#",
      "#.#.#######.#.#",
      "#.#.......#.#.#",
      "#.#######.#.#.#",
      "#.....C.......#",
      "###############"
    ],
    [
      "###############",
      "#P............#",
      "#.###########.#",
      "#.#.........#.#",
      "#.#.#######.#.#",
      "#.#.#.....#.#.#",
      "#...#.###.#...#",
      "###...#.#...###",
      "#...#.#.#.#...#",
      "#.#.#...#.#.#.#",
      "#.#.#####.#.#.#",
      "#.#.......#.#.#",
      "#.#########.#.#",
      "#.....C.......#",
      "###############"
    ]
  ];

  const LEVELS = [
    { title: "WELCOME, MAVELI", enemies: 2, enemyEvery: 2 },
    { title: "SECOND SERVING", enemies: 3, enemyEvery: 2 },
    { title: "PAYASAM PANIC", enemies: 4, enemyEvery: 1 },
    { title: "CLIENT CHAOS", enemies: 5, enemyEvery: 1 },
    { title: "FINAL FEAST", enemies: 6, enemyEvery: 1 }
  ];

  const DISH_TYPES = ["rice", "chips", "payasam", "avial", "pappadam", "banana", "pickle"];
  const ENEMY_TYPES = [
    { type: "urgent", color: C.red, label: "URGENT" },
    { type: "cursor", color: C.white, label: "CURSOR" },
    { type: "feedback", color: C.purple, label: "%!#*" },
    { type: "spinner", color: C.cyan, label: "LOAD" },
    { type: "mail", color: C.green, label: "MAIL" },
    { type: "final", color: C.orange, label: "FINAL" }
  ];

  const game = {
    mode: "start",
    paused: false,
    level: 0,
    score: 0,
    highScore: loadHighScore(),
    lives: 3,
    map: MAPS[0],
    player: null,
    enemies: [],
    pellets: new Set(),
    dishes: [],
    coffee: null,
    turns: 0,
    caffeine: 0,
    queue: [],
    moving: false,
    phase: null,
    animation: null,
    notice: "ONE PRESS = ONE STEP",
    noticeUntil: 0,
    transitionUntil: 0,
    bumpUntil: 0,
    sound: true,
    audio: null,
    swipe: null
  };

  function loadHighScore() {
    try {
      const value = Number.parseInt(localStorage.getItem("maha-belly-high-score") || "0", 10);
      return Number.isFinite(value) ? value : 0;
    } catch (_) {
      return 0;
    }
  }

  function saveHighScore() {
    game.highScore = Math.max(game.highScore, game.score);
    try {
      localStorage.setItem("maha-belly-high-score", String(game.highScore));
    } catch (_) {}
  }

  function initAudio() {
    if (!game.audio) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) game.audio = new AudioContext();
    }
    if (game.audio && game.audio.state === "suspended") game.audio.resume().catch(() => {});
  }

  function beep(freq, length = 0.05, type = "square", volume = 0.03, delay = 0) {
    if (!game.sound) return;
    initAudio();
    if (!game.audio) return;
    const start = game.audio.currentTime + delay;
    const oscillator = game.audio.createOscillator();
    const gain = game.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    oscillator.connect(gain);
    gain.connect(game.audio.destination);
    oscillator.start(start);
    oscillator.stop(start + length + 0.02);
  }

  function soundDish() {
    beep(420, 0.07, "square", 0.04);
    beep(620, 0.09, "square", 0.035, 0.055);
  }

  function soundCoffee() {
    [330, 440, 660, 880].forEach((f, i) => beep(f, 0.1, "sawtooth", 0.035, i * 0.055));
  }

  function soundLevel() {
    [392, 523, 659, 784].forEach((f, i) => beep(f, 0.12, "square", 0.035, i * 0.09));
  }

  function setNotice(text, ms = 1300) {
    game.notice = text;
    game.noticeUntil = performance.now() + ms;
    if (liveStatus) liveStatus.textContent = text;
  }

  function isWall(x, y) {
    return x < 0 || y < 0 || x >= COLS || y >= ROWS || game.map[y][x] === "#";
  }

  function same(a, b) {
    return Boolean(a && b && a.x === b.x && a.y === b.y);
  }

  function distance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function cellCenter(x, y) {
    return { x: BOARD_X + x * TILE + TILE / 2, y: BOARD_Y + y * TILE + TILE / 2 };
  }

  function openCells() {
    const cells = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!isWall(x, y)) cells.push({ x, y });
      }
    }
    return cells;
  }

  function chooseDishCells(cells, start, coffee) {
    const candidates = cells
      .filter((p) => game.map[p.y][p.x] === "." && !same(p, start) && !same(p, coffee))
      .sort((a, b) => distance(b, start) - distance(a, start));
    const chosen = [];
    for (const p of candidates) {
      if (chosen.every((q) => distance(p, q) >= 4)) chosen.push(p);
      if (chosen.length === DISH_TYPES.length) break;
    }
    for (const p of candidates) {
      if (chosen.length === DISH_TYPES.length) break;
      if (!chosen.some((q) => same(p, q))) chosen.push(p);
    }
    return chosen.map((p, i) => ({ ...p, type: DISH_TYPES[i], collected: false }));
  }

  function chooseEnemyCells(cells, start, count) {
    const middle = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
    const candidates = cells
      .filter((p) => distance(p, start) >= 6)
      .sort((a, b) => distance(a, middle) - distance(b, middle));
    const chosen = [];
    for (const p of candidates) {
      if (chosen.every((q) => distance(p, q) >= 2)) chosen.push(p);
      if (chosen.length === count) break;
    }
    while (chosen.length < count) chosen.push(candidates[chosen.length % candidates.length] || middle);
    return chosen;
  }

  function loadLevel() {
    game.map = MAPS[game.level];
    game.pellets = new Set();
    game.dishes = [];
    game.enemies = [];
    game.coffee = null;
    game.turns = 0;
    game.caffeine = 0;
    game.queue.length = 0;
    game.moving = false;
    game.phase = null;
    game.animation = null;

    let start = { x: 1, y: 1 };
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const value = game.map[y][x];
        if (value === ".") game.pellets.add(`${x},${y}`);
        if (value === "P") start = { x, y };
        if (value === "C") game.coffee = { x, y, active: true };
      }
    }

    const cells = openCells();
    game.dishes = chooseDishCells(cells, start, game.coffee);
    game.dishes.forEach((dish) => game.pellets.delete(`${dish.x},${dish.y}`));

    game.player = {
      x: start.x,
      y: start.y,
      renderX: start.x,
      renderY: start.y,
      startX: start.x,
      startY: start.y,
      facing: "right"
    };

    const spawns = chooseEnemyCells(cells, start, LEVELS[game.level].enemies);
    game.enemies = spawns.map((p, i) => ({
      ...ENEMY_TYPES[i % ENEMY_TYPES.length],
      x: p.x,
      y: p.y,
      renderX: p.x,
      renderY: p.y,
      spawnX: p.x,
      spawnY: p.y,
      dir: i % 2 ? { x: 0, y: 1 } : { x: 1, y: 0 }
    }));

    setNotice(LEVELS[game.level].title, 1700);
    updateControls();
  }

  function startGame() {
    initAudio();
    game.mode = "playing";
    game.paused = false;
    game.level = 0;
    game.score = 0;
    game.lives = 3;
    overlay.classList.add("is-hidden");
    shell.classList.remove("is-paused");
    pauseButton.textContent = "PAUSE";
    loadLevel();
    soundLevel();
  }

  function requestStep(name) {
    if (game.mode !== "playing" || game.paused || !DIRS[name]) return;
    initAudio();
    if (game.queue.length < 8) game.queue.push(name);
    processQueue();
  }

  function processQueue() {
    if (game.moving || game.paused || game.mode !== "playing") return;
    const name = game.queue.shift();
    if (!name) return;
    const dir = DIRS[name];
    const target = { x: game.player.x + dir.x, y: game.player.y + dir.y };
    game.player.facing = name;

    if (isWall(target.x, target.y)) {
      game.bumpUntil = performance.now() + 120;
      beep(95, 0.05, "square", 0.02);
      requestAnimationFrame(processQueue);
      return;
    }

    game.moving = true;
    game.phase = "player";
    game.animation = {
      start: performance.now(),
      duration: PLAYER_ANIMATION_MS,
      from: { x: game.player.x, y: game.player.y },
      to: target,
      enemyMoves: []
    };
    beep(185, 0.035, "square", 0.018);
  }

  function lerp(a, b, n) {
    return a + (b - a) * n;
  }

  function animate(now) {
    if (!game.moving || !game.animation) return;
    const raw = Math.min(1, (now - game.animation.start) / game.animation.duration);
    const eased = 1 - Math.pow(1 - raw, 3);

    if (game.phase === "player") {
      game.player.renderX = lerp(game.animation.from.x, game.animation.to.x, eased);
      game.player.renderY = lerp(game.animation.from.y, game.animation.to.y, eased);
      if (raw >= 1) finishPlayerStep();
      return;
    }

    if (game.phase === "enemies") {
      game.animation.enemyMoves.forEach((move) => {
        move.enemy.renderX = lerp(move.from.x, move.to.x, eased);
        move.enemy.renderY = lerp(move.from.y, move.to.y, eased);
      });
      if (raw >= 1) finishEnemyStep();
    }
  }

  function finishPlayerStep() {
    const to = game.animation.to;
    game.player.x = to.x;
    game.player.y = to.y;
    game.player.renderX = to.x;
    game.player.renderY = to.y;
    game.turns += 1;

    const pellet = `${to.x},${to.y}`;
    if (game.pellets.delete(pellet)) {
      game.score += game.caffeine > 0 ? 20 : 10;
      beep(280, 0.025, "square", 0.012);
    }

    game.dishes.forEach((dish) => {
      if (!dish.collected && same(dish, game.player)) {
        dish.collected = true;
        game.score += game.caffeine > 0 ? 300 : 150;
        setNotice(`${dishName(dish.type)} ACQUIRED`, 1200);
        soundDish();
      }
    });

    if (game.coffee && game.coffee.active && same(game.coffee, game.player)) {
      game.coffee.active = false;
      game.caffeine = CAFFEINE_STEPS + 1;
      game.score += 200;
      setNotice("OVER CAFFEINATED MODE", 1600);
      soundCoffee();
    }

    if (resolvePlayerCollision()) return;

    if (game.dishes.every((dish) => dish.collected)) {
      completeLevel();
      return;
    }

    if (game.caffeine > 0) {
      game.caffeine -= 1;
      if (game.caffeine === 0) setNotice("CAFFEINE CRASH", 1100);
    }

    saveHighScore();
    if (game.turns % LEVELS[game.level].enemyEvery === 0) beginEnemyStep();
    else endTurn();
  }

  function resolvePlayerCollision() {
    const hits = game.enemies.filter((enemy) => same(enemy, game.player));
    if (!hits.length) return false;
    if (game.caffeine > 0) {
      hits.forEach(deleteEnemy);
      return false;
    }
    loseLife();
    return true;
  }

  function deleteEnemy(enemy) {
    game.score += 250;
    enemy.x = enemy.spawnX;
    enemy.y = enemy.spawnY;
    enemy.renderX = enemy.spawnX;
    enemy.renderY = enemy.spawnY;
    setNotice(`${enemy.label} DELETED`, 1000);
    beep(780, 0.06, "square", 0.035);
    beep(980, 0.07, "square", 0.035, 0.04);
  }

  function chooseEnemyDirection(enemy) {
    let choices = Object.values(DIRS).filter((dir) => !isWall(enemy.x + dir.x, enemy.y + dir.y));
    const forward = choices.filter((dir) => !(dir.x === -enemy.dir.x && dir.y === -enemy.dir.y));
    if (forward.length) choices = forward;
    if (!choices.length) return null;
    choices.sort((a, b) => {
      const da = distance({ x: enemy.x + a.x, y: enemy.y + a.y }, game.player);
      const db = distance({ x: enemy.x + b.x, y: enemy.y + b.y }, game.player);
      return game.caffeine > 0 ? db - da : da - db;
    });
    return Math.random() < 0.76 ? choices[0] : choices[Math.floor(Math.random() * choices.length)];
  }

  function beginEnemyStep() {
    const moves = game.enemies.map((enemy) => {
      const dir = chooseEnemyDirection(enemy);
      const to = dir ? { x: enemy.x + dir.x, y: enemy.y + dir.y } : { x: enemy.x, y: enemy.y };
      if (dir) enemy.dir = dir;
      return { enemy, from: { x: enemy.x, y: enemy.y }, to };
    });
    game.phase = "enemies";
    game.animation = { start: performance.now(), duration: ENEMY_ANIMATION_MS, enemyMoves: moves };
  }

  function finishEnemyStep() {
    game.animation.enemyMoves.forEach((move) => {
      move.enemy.x = move.to.x;
      move.enemy.y = move.to.y;
      move.enemy.renderX = move.to.x;
      move.enemy.renderY = move.to.y;
    });

    const hits = game.enemies.filter((enemy) => same(enemy, game.player));
    if (hits.length) {
      if (game.caffeine > 0) hits.forEach(deleteEnemy);
      else {
        loseLife();
        return;
      }
    }
    endTurn();
  }

  function endTurn() {
    game.moving = false;
    game.phase = null;
    game.animation = null;
    updateControls();
    processQueue();
  }

  function loseLife() {
    game.lives -= 1;
    game.queue.length = 0;
    game.caffeine = 0;
    beep(120, 0.18, "sawtooth", 0.055);
    beep(78, 0.22, "square", 0.04, 0.1);

    if (game.lives <= 0) {
      saveHighScore();
      game.mode = "lose";
      game.moving = false;
      showEnd("CLIENT CHAOS WINS", "GAME<br>OVER", "Mahabali needs another coffee.", "RESTART");
      return;
    }

    game.player.x = game.player.startX;
    game.player.y = game.player.startY;
    game.player.renderX = game.player.startX;
    game.player.renderY = game.player.startY;
    game.enemies.forEach((enemy) => {
      enemy.x = enemy.spawnX;
      enemy.y = enemy.spawnY;
      enemy.renderX = enemy.spawnX;
      enemy.renderY = enemy.spawnY;
    });
    game.moving = false;
    game.phase = null;
    game.animation = null;
    setNotice("URGENT CLIENT FEEDBACK", 1400);
    updateControls();
  }

  function completeLevel() {
    game.score += 750;
    saveHighScore();
    game.queue.length = 0;
    game.moving = false;
    game.phase = null;
    game.animation = null;
    soundLevel();

    if (game.level === LEVELS.length - 1) {
      game.mode = "win";
      showEnd(
        "SADHYA: DESTROYED",
        "ONAM<br>SAVED",
        "Happy Onam from the mostly-Malayali madness at Over Caffeinated Design.",
        "PLAY AGAIN"
      );
      return;
    }

    game.mode = "transition";
    game.transitionUntil = performance.now() + 900;
    setNotice("SADHYA COMPLETE", 900);
    updateControls();
  }

  function updateTransition(now) {
    if (game.mode === "transition" && now >= game.transitionUntil) {
      game.level += 1;
      game.mode = "playing";
      loadLevel();
    }
  }

  function showEnd(eyebrow, title, copy, button) {
    overlay.innerHTML = `
      <div class="overlay-card">
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p class="intro-copy">${copy}</p>
        <p class="intro-copy">SCORE ${String(game.score).padStart(5, "0")}</p>
        <button id="restartButton" class="primary-button" type="button">${button}</button>
        <p class="control-copy">Each arrow press moves Mahabali exactly one tile.</p>
      </div>`;
    overlay.classList.remove("is-hidden");
    document.getElementById("restartButton").addEventListener("click", startGame, { once: true });
    updateControls();
  }

  function togglePause() {
    if (game.mode !== "playing") return;
    game.paused = !game.paused;
    pauseButton.textContent = game.paused ? "RESUME" : "PAUSE";
    shell.classList.toggle("is-paused", game.paused);
    if (!game.paused) processQueue();
    updateControls();
  }

  function toggleSound() {
    game.sound = !game.sound;
    soundButton.textContent = game.sound ? "SOUND ON" : "SOUND OFF";
    soundButton.setAttribute("aria-label", game.sound ? "Mute sound" : "Enable sound");
    if (game.sound) beep(520, 0.06, "square", 0.03);
  }

  function updateControls() {
    const enabled = game.mode === "playing" && !game.paused;
    arrowButtons.forEach((button) => { button.disabled = !enabled; });
    pauseButton.disabled = game.mode !== "playing";
    caffeineBanner.classList.toggle("is-visible", game.caffeine > 0);
  }

  function rr(x, y, w, h, radius, fill, stroke, lineWidth = 3) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function draw(now) {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, W, H);
    drawHeader();
    drawMaze(now);
    game.dishes.forEach(drawDish);
    drawCoffee(now);
    game.enemies.forEach((enemy) => drawEnemy(enemy, now));
    if (game.player) drawMahabali(now);
    drawHud(now);
    if (game.mode === "transition") drawCenter("LEVEL COMPLETE", "SECOND SERVING INCOMING");
    if (game.paused) drawCenter("PAUSED", "PRESS RESUME");
  }

  function drawHeader() {
    rr(52, 34, 976, 205, 28, "#151515", C.blue, 7);
    rr(72, 54, 936, 165, 20, "#1d1704", C.yellow, 4);
    ctx.textAlign = "center";
    ctx.font = '900 108px "Clash Display", "Arial Black", Arial';
    ctx.lineWidth = 14;
    ctx.strokeStyle = C.blue;
    ctx.strokeText("MAHA-BELLY", W / 2, 163);
    const grad = ctx.createLinearGradient(0, 74, 0, 184);
    grad.addColorStop(0, "#fff59a");
    grad.addColorStop(0.48, C.yellow);
    grad.addColorStop(1, C.orange);
    ctx.fillStyle = grad;
    ctx.fillText("MAHA-BELLY", W / 2, 163);

    ctx.fillStyle = C.green;
    ctx.font = "900 23px ui-monospace, Menlo, monospace";
    ctx.fillText("OVER CAFFEINATED DESIGN X ONAM", W / 2, 269);

    ctx.font = "900 29px ui-monospace, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = C.white;
    ctx.fillText("1UP", 108, 322);
    ctx.fillStyle = C.yellow;
    ctx.fillText(String(game.score).padStart(5, "0"), 108, 357);
    ctx.textAlign = "center";
    ctx.fillStyle = C.white;
    ctx.fillText("HIGH SCORE", W / 2, 322);
    ctx.fillStyle = C.yellow;
    ctx.fillText(String(Math.max(game.highScore, game.score)).padStart(6, "0"), W / 2, 357);
    ctx.textAlign = "right";
    ctx.fillStyle = C.white;
    ctx.fillText(`LEVEL ${game.level + 1}`, 972, 322);
    ctx.fillStyle = C.green;
    ctx.fillText("o".repeat(game.level + 1), 972, 357);
  }

  function drawMaze(now) {
    const caff = game.caffeine > 0;
    const flash = Math.floor(now / 130) % 2 === 0;
    const accent = caff && flash ? C.green : C.blue;
    rr(BOARD_X - 17, BOARD_Y - 17, BOARD_W + 34, BOARD_H + 34, 24, "#020202", accent, 7);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (game.map[y][x] !== "#") continue;
        const px = BOARD_X + x * TILE;
        const py = BOARD_Y + y * TILE;
        const edge = caff && (x + y + (flash ? 1 : 0)) % 2 === 0 ? C.green : C.blue;
        rr(px + 5, py + 5, TILE - 10, TILE - 10, 10, C.wall, edge, 5);
        ctx.fillStyle = "rgba(255,255,255,.08)";
        ctx.fillRect(px + 12, py + 12, TILE - 24, 3);
      }
    }

    game.pellets.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const p = cellCenter(x, y);
      ctx.fillStyle = (x + y) % 7 === 0 ? C.pink : C.cream;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    drawPookalam(W / 2, BOARD_Y + 51, 0.72);
    drawLamp(BOARD_X + 215, BOARD_Y + 61);
    drawLamp(BOARD_X + BOARD_W - 215, BOARD_Y + 61);
    drawBananaLeaf(BOARD_X + 58, BOARD_Y + 31, 1);
    drawBananaLeaf(BOARD_X + BOARD_W - 58, BOARD_Y + 31, -1);
  }

  function drawPookalam(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    [
      [45, 18, 7, C.orange],
      [31, 14, 7, C.cream],
      [18, 10, 7, C.purple]
    ].forEach(([radius, count, size, color]) => {
      ctx.fillStyle = color;
      for (let i = 0; i < count; i += 1) {
        const a = Math.PI * 2 * i / count;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * radius, Math.sin(a) * radius, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLamp(x, y) {
    ctx.fillStyle = C.gold;
    ctx.fillRect(x - 3, y - 28, 6, 31);
    ctx.fillRect(x - 14, y + 1, 28, 5);
    rr(x - 9, y + 5, 18, 12, 4, C.gold, "#6b3d0d", 2);
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(x, y - 33, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBananaLeaf(x, y, flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip, 1);
    ctx.fillStyle = C.leaf;
    ctx.beginPath();
    ctx.ellipse(0, 0, 46, 14, -0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.leafLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-35, 10);
    ctx.lineTo(35, -10);
    ctx.stroke();
    ctx.restore();
  }

  function drawLeaf(x, y, width = 43, height = 24) {
    ctx.fillStyle = C.leaf;
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.leafLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - width / 2 + 5, y);
    ctx.lineTo(x + width / 2 - 5, y);
    ctx.stroke();
  }

  function drawDish(dish) {
    if (dish.collected) return;
    const p = cellCenter(dish.x, dish.y);
    drawDishIcon(dish.type, p.x, p.y, 1);
  }

  function drawDishIcon(type, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    drawLeaf(0, 9);
    if (type === "rice") {
      ctx.fillStyle = C.rice;
      ctx.beginPath();
      ctx.arc(0, 1, 14, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-14, 1, 28, 6);
      ctx.fillStyle = C.orange;
      ctx.fillRect(-2, -8, 4, 4);
    } else if (type === "chips") {
      ctx.fillStyle = C.yellow;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.arc(-12 + i * 6, (i % 2) * 3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#b77d14";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (type === "payasam") {
      rr(-16, -8, 32, 20, 5, C.brown, "#4b200d", 2);
      ctx.fillStyle = "#f0dfb3";
      ctx.fillRect(-13, -6, 26, 9);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(0, -2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "avial") {
      rr(-16, -8, 32, 20, 5, C.brown, "#4b200d", 2);
      ctx.fillStyle = "#ead47f";
      ctx.fillRect(-13, -5, 26, 8);
      ctx.fillStyle = "#8ed35d";
      ctx.fillRect(-10, -3, 6, 5);
      ctx.fillRect(1, -4, 6, 5);
      ctx.fillStyle = C.orange;
      ctx.fillRect(7, -2, 4, 4);
    } else if (type === "pappadam") {
      ctx.fillStyle = "#f0d49d";
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#c59e5e";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#b78d52";
      ctx.fillRect(-6, -5, 3, 3);
      ctx.fillRect(5, 2, 3, 3);
    } else if (type === "banana") {
      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, -1, 16, 0.15, 2.83);
      ctx.stroke();
      ctx.strokeStyle = "#756113";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (type === "pickle") {
      rr(-15, -7, 30, 18, 5, "#6f310e", "#371708", 2);
      ctx.fillStyle = C.red;
      [[-6, -1], [0, -4], [7, 1]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function dishName(type) {
    return ({
      rice: "RICE",
      chips: "BANANA CHIPS",
      payasam: "PAYASAM",
      avial: "AVIYAL",
      pappadam: "PAPPADAM",
      banana: "BANANA",
      pickle: "PICKLE"
    })[type] || type.toUpperCase();
  }

  function drawCoffee(now) {
    if (!game.coffee || !game.coffee.active) return;
    const p = cellCenter(game.coffee.x, game.coffee.y);
    const pulse = 1 + Math.sin(now / 110) * 0.08;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);
    rr(-18, -13, 31, 25, 5, C.white, C.black, 2);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(16, -1, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.font = "900 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("OCD", -2, 4);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-7, -19);
    ctx.lineTo(-1, -28);
    ctx.lineTo(4, -19);
    ctx.lineTo(9, -27);
    ctx.stroke();
    ctx.restore();
  }

  function drawMahabali(now) {
    const p = cellCenter(game.player.renderX, game.player.renderY);
    const x = p.x - 26;
    const y = p.y - 33;
    const caff = game.caffeine > 0;
    const walk = game.moving && game.phase === "player" ? Math.sin(now / 38) * 2 : 0;
    const bump = now < game.bumpUntil ? Math.sin(now / 18) * 3 : 0;
    ctx.save();
    ctx.translate(bump, walk);
    if (caff) {
      ctx.strokeStyle = Math.floor(now / 110) % 2 ? C.green : C.blue;
      ctx.lineWidth = 4;
      ctx.strokeRect(x - 5, y - 5, 62, 76);
    }
    ctx.fillStyle = C.gold;
    ctx.fillRect(x + 13, y + 1, 27, 8);
    ctx.fillRect(x + 17, y - 6, 19, 7);
    ctx.fillRect(x + 22, y - 12, 9, 6);
    ctx.fillStyle = C.red;
    ctx.fillRect(x + 24, y + 2, 5, 4);
    ctx.fillStyle = C.skin;
    ctx.fillRect(x + 10, y + 10, 33, 23);
    ctx.fillStyle = C.black;
    ctx.fillRect(x + 16, y + 17, 4, 4);
    ctx.fillRect(x + 31, y + 17, 4, 4);
    ctx.fillRect(x + 10, y + 25, 12, 4);
    ctx.fillRect(x + 31, y + 25, 12, 4);
    ctx.fillRect(x + 22, y + 28, 9, 4);
    ctx.fillStyle = C.skin;
    ctx.fillRect(x + 7, y + 33, 39, 22);
    ctx.fillRect(x + 1, y + 36, 9, 9);
    ctx.fillRect(x + 43, y + 36, 9, 9);
    ctx.fillStyle = caff ? C.green : C.cream;
    ctx.fillRect(x + 11, y + 51, 33, 21);
    ctx.fillStyle = C.gold;
    ctx.fillRect(x + 11, y + 66, 33, 4);
    ctx.fillStyle = caff ? C.blue : C.pink;
    ctx.fillRect(x + 42, y + 32, 7, 31);
    ctx.fillStyle = C.gold;
    ctx.fillRect(x + 15, y + 35, 23, 3);
    ctx.fillStyle = C.skin;
    ctx.fillRect(x + 15, y + 72, 7, 7);
    ctx.fillRect(x + 32, y + 72, 7, 7);
    ctx.restore();
  }

  function drawEnemy(enemy, now) {
    const p = cellCenter(enemy.renderX, enemy.renderY);
    const x = p.x - 21;
    const y = p.y - 20;
    const vulnerable = game.caffeine > 0;
    const bob = Math.sin((now + enemy.spawnX * 90) / 120) * 2;
    ctx.save();
    ctx.translate(0, bob);

    if (enemy.type === "cursor") {
      ctx.fillStyle = vulnerable ? C.green : C.white;
      ctx.strokeStyle = C.black;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 2);
      ctx.lineTo(x + 39, y + 22);
      ctx.lineTo(x + 24, y + 25);
      ctx.lineTo(x + 33, y + 41);
      ctx.lineTo(x + 25, y + 45);
      ctx.lineTo(x + 16, y + 29);
      ctx.lineTo(x + 6, y + 38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (enemy.type === "spinner") {
      ctx.strokeStyle = vulnerable ? C.white : C.cyan;
      ctx.lineWidth = 6;
      for (let i = 0; i < 8; i += 1) {
        const a = i * Math.PI / 4 + now / 330;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(a) * 8, p.y + Math.sin(a) * 8);
        ctx.lineTo(p.x + Math.cos(a) * 20, p.y + Math.sin(a) * 20);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    rr(x, y, 43, 35, 9, vulnerable ? C.white : enemy.color, C.black, 2);
    ctx.fillStyle = vulnerable ? C.blue : C.white;
    ctx.fillRect(x + 7, y + 8, 10, 10);
    ctx.fillRect(x + 26, y + 8, 10, 10);
    ctx.fillStyle = C.black;
    ctx.fillRect(x + 11, y + 11, 3, 3);
    ctx.fillRect(x + 29, y + 11, 3, 3);
    ctx.font = "900 8px Arial";
    ctx.textAlign = "center";
    ctx.fillText(enemy.label, x + 21.5, y + 28);
    ctx.restore();
  }

  function drawHud(now) {
    const lineY = 1284;
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(66, lineY);
    ctx.lineTo(1014, lineY);
    ctx.stroke();
    drawLife(100, 1381);

    game.dishes.forEach((dish, i) => {
      ctx.save();
      ctx.globalAlpha = dish.collected ? 1 : 0.28;
      drawDishIcon(dish.type, 270 + i * 101, 1378, 0.78);
      ctx.restore();
    });
    ctx.save();
    ctx.globalAlpha = game.coffee && !game.coffee.active ? 1 : 0.3;
    drawHudCoffee(975, 1378);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.font = '900 43px "Clash Display", "Arial Black", Arial';
    ctx.fillStyle = C.white;
    ctx.fillText("OVER", W / 2, 1517);
    ctx.fillStyle = C.green;
    ctx.fillText("CAFFEINATED", W / 2, 1558);
    ctx.fillStyle = C.white;
    ctx.font = "900 19px ui-monospace, Menlo, monospace";
    ctx.fillText("DESIGN", W / 2, 1587);
    ctx.fillStyle = C.blue;
    ctx.fillRect(66, 1642, 948, 5);

    ctx.fillStyle = C.white;
    ctx.font = "900 25px ui-monospace, Menlo, monospace";
    const notice = game.paused ? "PAUSED" : now < game.noticeUntil ? game.notice : "ONE PRESS = ONE STEP";
    ctx.fillText(notice, W / 2, 1700);
    ctx.fillStyle = "#989898";
    ctx.font = "800 18px ui-monospace, Menlo, monospace";
    ctx.fillText("TAP AN ARROW, PRESS A KEY, OR SWIPE FOR ONE TILE", W / 2, 1740);

    const meterW = 560;
    const meterX = (W - meterW) / 2;
    const meterY = 1783;
    rr(meterX, meterY, meterW, 23, 10, "#151515", C.white, 2);
    const ratio = Math.max(0, Math.min(1, game.caffeine / CAFFEINE_STEPS));
    if (ratio > 0) rr(meterX + 3, meterY + 3, (meterW - 6) * ratio, 17, 8, C.green, null, 0);
    ctx.fillStyle = ratio > 0 ? C.black : C.white;
    ctx.font = "900 12px ui-monospace, Menlo, monospace";
    ctx.fillText(ratio > 0 ? `CAFFEINE ${game.caffeine} STEPS` : "FIND THE OCD COFFEE", W / 2, meterY + 16);

    ctx.fillStyle = C.green;
    ctx.font = "900 18px ui-monospace, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`MOVES ${String(game.turns).padStart(3, "0")}`, 76, 1862);
    ctx.textAlign = "right";
    ctx.fillText(`${game.dishes.filter((dish) => dish.collected).length}/7 DISHES`, 1004, 1862);
  }

  function drawLife(x, y) {
    ctx.fillStyle = C.gold;
    ctx.fillRect(x - 21, y - 25, 28, 9);
    ctx.fillStyle = C.skin;
    ctx.fillRect(x - 19, y - 16, 23, 20);
    ctx.fillStyle = C.black;
    ctx.fillRect(x - 13, y - 8, 3, 3);
    ctx.fillRect(x - 4, y - 8, 3, 3);
    ctx.fillStyle = C.white;
    ctx.font = "900 31px ui-monospace, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`x${game.lives}`, x + 17, y + 2);
  }

  function drawHudCoffee(x, y) {
    rr(x - 18, y - 17, 32, 25, 5, C.white, C.black, 2);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + 17, y - 3, 7, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.font = "900 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("OCD", x - 2, y + 1);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 23);
    ctx.lineTo(x, y - 31);
    ctx.lineTo(x + 6, y - 23);
    ctx.stroke();
  }

  function drawCenter(title, subtitle) {
    ctx.fillStyle = "rgba(0,0,0,.76)";
    ctx.fillRect(0, 0, W, H);
    rr(180, 720, 720, 310, 18, C.cream, C.black, 5);
    ctx.textAlign = "center";
    ctx.fillStyle = C.blue;
    ctx.font = "900 25px ui-monospace, Menlo, monospace";
    ctx.fillText(subtitle, W / 2, 805);
    ctx.fillStyle = C.black;
    ctx.font = '900 88px "Clash Display", "Arial Black", Arial';
    ctx.fillText(title, W / 2, 930);
  }

  function loop(now) {
    updateTransition(now);
    animate(now);
    updateControls();
    draw(now);
    requestAnimationFrame(loop);
  }

  arrowButtons.forEach((button) => button.addEventListener("click", () => requestStep(button.dataset.direction)));

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const map = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", W: "up", s: "down", S: "down", a: "left", A: "left", d: "right", D: "right"
    };
    if (map[event.key]) {
      event.preventDefault();
      requestStep(map[event.key]);
    } else if (event.key === " " || event.key === "Escape") {
      event.preventDefault();
      togglePause();
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    game.swipe = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!game.swipe) return;
    const dx = event.clientX - game.swipe.x;
    const dy = event.clientY - game.swipe.y;
    game.swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
    if (Math.abs(dx) > Math.abs(dy)) requestStep(dx > 0 ? "right" : "left");
    else requestStep(dy > 0 ? "down" : "up");
  });
  canvas.addEventListener("pointercancel", () => { game.swipe = null; });

  startButton.addEventListener("click", startGame);
  soundButton.addEventListener("click", toggleSound);
  pauseButton.addEventListener("click", togglePause);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.mode === "playing" && !game.paused) togglePause();
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  window.MahaBelly = Object.freeze({
    start: startGame,
    step: requestStep,
    pause: togglePause,
    getState: () => ({
      mode: game.mode,
      paused: game.paused,
      level: game.level + 1,
      score: game.score,
      lives: game.lives,
      turns: game.turns,
      caffeineSteps: game.caffeine,
      queueLength: game.queue.length,
      moving: game.moving,
      phase: game.phase,
      player: game.player ? { x: game.player.x, y: game.player.y } : null
    })
  });

  game.map = MAPS[0];
  loadLevel();
  game.mode = "start";
  updateControls();
  requestAnimationFrame(loop);
})();
