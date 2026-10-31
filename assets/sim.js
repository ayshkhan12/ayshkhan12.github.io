/* ==========================================================
   Adam: a tiny instinct-driven creature living in the hero.
   Four drives (hunger, energy, fear, curiosity) compete for a
   "global workspace"; the winner decides what Adam does next.
   The letters of the name are physical walls in his world.
   ========================================================== */
(() => {
  'use strict';

  const canvas = document.getElementById('world');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  const slot = document.getElementById('nameSlot');
  const header = document.getElementById('siteHeader');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CELL = 10;
  const DC = [1, -1, 0, 0, 1, 1, -1, -1];
  const DR = [0, 0, 1, -1, 1, -1, 1, -1];

  let W = 0, H = 0, DPR = 1, COLS = 0, ROWS = 0;
  let wall = new Uint8Array(0);   // blocked for Adam
  let pwall = new Uint8Array(0);  // blocked for predators (walls + shelters)
  let reach = new Uint8Array(0);  // main connected region
  let freeCells = [];
  let bDist = new Int32Array(0), bPrev = new Int32Array(0), bQ = new Int32Array(0);
  let visits = new Uint8Array(0), visited = 0;
  let nameLines = [], nameFont = '', fontsReady = false, built = false;
  let C = {};

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const cellOf = (x, y) => clamp((y / CELL) | 0, 0, ROWS - 1) * COLS + clamp((x / CELL) | 0, 0, COLS - 1);
  const cx = i => (i % COLS) * CELL + CELL / 2;
  const cy = i => ((i / COLS) | 0) * CELL + CELL / 2;

  /* ---------- state ---------- */
  const agent = { x: 0, y: 0, vx: 0, vy: 0, r: 10, path: [], goal: null, sleeping: false, blink: 0, blinkT: 2.5, lookX: 1, lookY: 0, hurtT: 0, shelterT: 0, gaveUp: false, lastCell: -1 };
  const drives = { hunger: 0.5, energy: 0.88, fear: 0, curiosity: 0.75 };
  const U = { hunger: 0, survival: 0, energy: 0, explore: 0 };
  let food = [], preds = [], shelters = [], parts = [], trail = [], ripples = [];
  let winner = 'explore', subMode = 'explore', planText = 'waking up…';
  let bubble = { text: '', t: 0 };
  let tool = 'food', eaten = 0, totalEaten = 0, hits = 0;
  let paused = reduceMotion, inView = true, raf = 0, last = 0, time = 0;
  let thinkT = 0, spawnT = 0, partyT = 0, autoPredT = 22, autoPredDone = false, startleCD = 0, hudT = 0;
  let exploreGoal = -1, exploreTimer = 0, firstClick = false, userPredators = false;
  const pointer = { x: -999, y: -999, inside: false, t: -99, lastT: 0, speed: 0 };

  const LINES = {
    hunger: ['food!', 'snack time', 'hungry…', 'mmm, seeds'],
    survival: ['nope.', 'run!!', 'danger!', 'yikes'],
    shelter: ['to the shelter!', 'hide!'],
    energy: ['so sleepy', 'nap time', 'zzz'],
    explore: ['what’s over there?', 'new territory', 'just looking', 'hmm…'],
    curious: ['who’s that?', 'hello, human', 'is that a cursor?'],
  };
  const DRIVE_OF = { hunger: 'hunger', survival: 'fear', energy: 'energy', explore: 'curiosity' };
  const LABEL = { hunger: 'HUNGER', survival: 'SURVIVAL', energy: 'REST', explore: 'EXPLORE' };

  /* ---------- colours ---------- */
  function readColors() {
    const s = getComputedStyle(document.documentElement);
    const g = n => s.getPropertyValue(n).trim();
    C = {
      ink: g('--ink'), ink2: g('--ink-2'), ink3: g('--ink-3'), paper: g('--paper'), card: g('--card'), line: g('--line'),
      accent: g('--accent'), hunger: g('--hunger'), energy: g('--energy'), fear: g('--fear'), curiosity: g('--curiosity'),
      food: g('--food'), pred: g('--predator'), shelter: g('--shelter'),
    };
    if (!running()) draw();
  }
  const winnerColor = w => ({ hunger: C.hunger, survival: C.fear, energy: C.energy, explore: C.curiosity }[w]);

  /* ---------- layout & walls ---------- */
  function layoutName() {
    const w = slot.getBoundingClientRect().width;
    ctx.font = '400 100px "Instrument Serif", Georgia, serif';
    const full = ctx.measureText('Aysh Khan').width;
    let size = (w / full) * 100, lines;
    if (window.innerWidth > 760 && size >= 70) {
      size = Math.min(size, 250);
      lines = ['Aysh Khan'];
    } else {
      const m = Math.max(ctx.measureText('Aysh').width, ctx.measureText('Khan').width);
      size = Math.min((w / m) * 100 * 0.96, 170);
      lines = ['Aysh', 'Khan'];
    }
    slot.style.height = Math.round(size * (1.02 + 0.86 * (lines.length - 1))) + 'px';
    return { size, lines };
  }

  function build() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const nl = layoutName();
    const hr = hero.getBoundingClientRect();
    const oldW = W, oldH = H;
    W = Math.max(1, Math.round(hr.width));
    H = Math.max(1, Math.round(hr.height));
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const sr = slot.getBoundingClientRect();
    nameFont = `400 ${nl.size}px "Instrument Serif", Georgia, serif`;
    nameLines = nl.lines.map((t, i) => ({ text: t, x: sr.left - hr.left, y: sr.top - hr.top + nl.size * 0.78 + i * nl.size * 0.86 }));

    COLS = Math.ceil(W / CELL);
    ROWS = Math.ceil(H / CELL);
    const N = COLS * ROWS;

    // Draw everything solid into an offscreen mask
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const o = off.getContext('2d', { willReadFrequently: true });
    o.fillStyle = '#000';
    o.font = nameFont;
    nameLines.forEach(l => o.fillText(l.text, l.x, l.y));
    hero.querySelectorAll('.solid').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) o.fillRect(r.left - hr.left - 6, r.top - hr.top - 6, r.width + 12, r.height + 12);
    });
    o.fillRect(0, 0, W, header.offsetHeight + 4);
    const px = o.getImageData(0, 0, W, H).data;

    const raw = new Uint8Array(N);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let hit = (c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1) ? 1 : 0;
        for (let sy = 1; sy < CELL && !hit; sy += 3) {
          for (let sx = 1; sx < CELL; sx += 3) {
            const x = c * CELL + sx, y = r * CELL + sy;
            if (x < W && y < H && px[(y * W + x) * 4 + 3] > 90) { hit = 1; break; }
          }
        }
        raw[r * COLS + c] = hit;
      }
    }
    wall = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (raw[i]) { wall[i] = 1; continue; }
      const c = i % COLS, r = (i / COLS) | 0;
      for (let k = 0; k < 8; k++) {
        const nc = c + DC[k], nr = r + DR[k];
        if (nc >= 0 && nr >= 0 && nc < COLS && nr < ROWS && raw[nr * COLS + nc]) { wall[i] = 1; break; }
      }
    }

    bDist = new Int32Array(N); bPrev = new Int32Array(N); bQ = new Int32Array(N);

    // Largest open region = Adam's world
    const seed = nearestFreeRaw(cellOf(W * 0.62, H * 0.7));
    bfs(seed, wall);
    reach = new Uint8Array(N);
    freeCells = [];
    for (let i = 0; i < N; i++) if (bDist[i] >= 0) { reach[i] = 1; freeCells.push(i); }

    // Keep exploration memory only if the world kept its size
    if (visits.length !== N || Math.abs(oldW - W) > 2) { visits = new Uint8Array(N); visited = 0; }

    // Put everything back on valid ground
    const fix = e => { const i = cellOf(e.x, e.y); if (!reach[i]) { const j = nearestReach(i); e.x = cx(j); e.y = cy(j); } };
    if (!built) {
      const j = nearestReach(cellOf(W * 0.66, H * 0.6));
      agent.x = cx(j); agent.y = cy(j);
      seedWorld();
    } else {
      if (oldW && oldH) {
        const sx = W / oldW, sy = H / oldH;
        [agent, ...food, ...preds, ...shelters].forEach(e => { e.x *= sx; e.y *= sy; });
      }
      fix(agent); food.forEach(fix); preds.forEach(fix); shelters.forEach(fix);
      trail = [];
    }
    rebuildPredWalls();
    agent.path = []; agent.goal = null; exploreGoal = -1;
    built = true;
    draw();
  }

  function rebuildPredWalls() {
    pwall = new Uint8Array(wall.length);
    for (let i = 0; i < wall.length; i++) {
      if (wall[i]) { pwall[i] = 1; continue; }
      const x = cx(i), y = cy(i);
      for (const s of shelters) if (dist(x, y, s.x, s.y) < s.r + 4) { pwall[i] = 1; break; }
    }
  }

  function nearestFreeRaw(i) {
    if (!wall[i]) return i;
    const c0 = i % COLS, r0 = (i / COLS) | 0;
    for (let rad = 1; rad < Math.max(COLS, ROWS); rad++) {
      for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
        if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
        const c = c0 + dc, r = r0 + dr;
        if (c > 0 && r > 0 && c < COLS - 1 && r < ROWS - 1 && !wall[r * COLS + c]) return r * COLS + c;
      }
    }
    return i;
  }
  function nearestReach(i) {
    if (reach[i]) return i;
    const c0 = i % COLS, r0 = (i / COLS) | 0;
    for (let rad = 1; rad < Math.max(COLS, ROWS); rad++) {
      for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
        if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
        const c = c0 + dc, r = r0 + dr;
        if (c >= 0 && r >= 0 && c < COLS && r < ROWS && reach[r * COLS + c]) return r * COLS + c;
      }
    }
    return freeCells[0] || i;
  }

  /* ---------- path finding ---------- */
  function bfs(start, blk) {
    bDist.fill(-1);
    let h = 0, t = 0;
    bQ[t++] = start; bDist[start] = 0; bPrev[start] = -1;
    while (h < t) {
      const i = bQ[h++], c = i % COLS, r = (i / COLS) | 0, d = bDist[i] + 1;
      for (let k = 0; k < 8; k++) {
        const nc = c + DC[k], nr = r + DR[k];
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
        const j = nr * COLS + nc;
        if (bDist[j] >= 0 || blk[j]) continue;
        if (k > 3 && (blk[r * COLS + nc] || blk[nr * COLS + c])) continue;
        bDist[j] = d; bPrev[j] = i; bQ[t++] = j;
      }
    }
  }
  function pathTo(goal) {
    if (goal < 0 || bDist[goal] < 0) return null;
    const p = [];
    for (let i = goal; i !== -1; i = bPrev[i]) p.push(i);
    return p.reverse();
  }
  function los(x0, y0, x1, y1, blk) {
    const d = dist(x0, y0, x1, y1), n = Math.ceil(d / 5);
    for (let s = 1; s <= n; s++) {
      const t = s / n;
      if (blk[cellOf(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)]) return false;
    }
    return true;
  }

  /* ---------- movement ---------- */
  function seek(e, tx, ty, speed, dt, arrive = 26) {
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
    const s = speed * Math.min(1, d / arrive), k = Math.min(1, dt * 7);
    e.vx += (dx / d * s - e.vx) * k;
    e.vy += (dy / d * s - e.vy) * k;
  }
  function brake(e, dt) { const k = Math.max(0, 1 - dt * 6); e.vx *= k; e.vy *= k; }
  function move(e, dt, blk) {
    const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
    if (!blk[cellOf(nx, ny)]) { e.x = nx; e.y = ny; }
    else if (!blk[cellOf(nx, e.y)]) { e.x = nx; e.vy *= 0.5; }
    else if (!blk[cellOf(e.x, ny)]) { e.y = ny; e.vx *= 0.5; }
    else { e.vx *= -0.3; e.vy *= -0.3; }
  }
  function follow(e, speed, dt, blk, gx, gy) {
    if (gx != null && dist(e.x, e.y, gx, gy) < 260 && los(e.x, e.y, gx, gy, blk)) { seek(e, gx, gy, speed, dt); return; }
    if (!e.path || !e.path.length) { brake(e, dt); return; }
    let k = Math.min(e.path.length - 1, 18);
    for (; k > 0; k--) if (los(e.x, e.y, cx(e.path[k]), cy(e.path[k]), blk)) break;
    if (k > 0) e.path.splice(0, k);
    const tx = cx(e.path[0]), ty = cy(e.path[0]);
    seek(e, tx, ty, speed, dt, 8);
    if (dist(e.x, e.y, tx, ty) < 5 && e.path.length > 1) e.path.shift();
  }

  /* ---------- world contents ---------- */
  function randomReach(minFromAgent = 0, tries = 60) {
    let best = freeCells[0];
    for (let t = 0; t < tries; t++) {
      const i = pick(freeCells);
      if (dist(cx(i), cy(i), agent.x, agent.y) >= minFromAgent) return i;
      best = i;
    }
    return best;
  }
  function openSpot(radiusCells, minFromAgent) {
    let best = -1, bestScore = -1;
    for (let t = 0; t < 120; t++) {
      const i = pick(freeCells), c = i % COLS, r = (i / COLS) | 0;
      let ok = true;
      for (let dr = -radiusCells; dr <= radiusCells && ok; dr++) for (let dc = -radiusCells; dc <= radiusCells; dc++) {
        const j = (r + dr) * COLS + (c + dc);
        if (r + dr < 0 || c + dc < 0 || r + dr >= ROWS || c + dc >= COLS || wall[j]) { ok = false; break; }
      }
      if (!ok) continue;
      const score = dist(cx(i), cy(i), agent.x, agent.y);
      if (score > bestScore && score >= minFromAgent) { best = i; bestScore = score; }
    }
    return best;
  }
  function addFood(x, y, quiet) {
    if (food.length >= 40) food.shift();
    const i = nearestReach(cellOf(x, y));
    food.push({ x: cx(i) + rnd(-2, 2), y: cy(i) + rnd(-2, 2), born: time, seed: Math.random() * 6 });
    if (!quiet) ripples.push({ x, y, t: 0, c: C.food });
  }
  function addPredator(x, y) {
    if (preds.length >= 4) preds.shift();
    let i = cellOf(x, y);
    if (!reach[i] || pwall[i]) i = nearestReach(i);
    preds.push({ x: cx(i), y: cy(i), vx: 0, vy: 0, path: [], replan: Math.random() * 0.4, bored: 1.2, hunting: false, hx: 1, hy: 0 });
    ripples.push({ x, y, t: 0, c: C.pred });
  }
  function addShelter(x, y) {
    if (shelters.length >= 3) shelters.shift();
    const i = nearestReach(cellOf(x, y));
    shelters.push({ x: cx(i), y: cy(i), r: W < 600 ? 38 : 46 });
    rebuildPredWalls();
    ripples.push({ x, y, t: 0, c: C.shelter });
  }
  function seedWorld() {
    food = []; preds = []; shelters = []; parts = []; trail = []; ripples = [];
    const s = openSpot(4, 160);
    if (s >= 0) shelters.push({ x: cx(s), y: cy(s), r: W < 600 ? 38 : 46 });
    rebuildPredWalls();
    const n = W < 600 ? 3 : 5;
    for (let k = 0; k < n; k++) { const i = randomReach(90); addFood(cx(i), cy(i), true); }
  }

  /* ---------- the "brain" ---------- */
  function say(text, dur = 2.2) { bubble = { text, t: dur }; }
  function inShelter(e) { return shelters.some(s => dist(e.x, e.y, s.x, s.y) < s.r - 4); }

  function urgencies() {
    const reachableFood = food.length > 0;
    U.hunger = Math.pow(drives.hunger, 1.4) * (reachableFood ? 1.25 : 0.3);
    U.survival = drives.fear * 1.5 + (drives.fear > 0.5 ? 0.6 : 0);
    U.energy = Math.pow(1 - drives.energy, 1.7) * 1.3 + (agent.sleeping && drives.energy < 0.95 ? 0.4 : 0);
    U.explore = 0.18 + drives.curiosity * 0.42;
  }

  function think() {
    const me = cellOf(agent.x, agent.y);
    bfs(me, wall);
    urgencies();
    const prev = winner;
    let best = 'explore', bv = -1;
    for (const k in U) { const v = U[k] + (k === winner ? 0.06 : 0); if (v > bv) { bv = v; best = k; } }
    if (drives.fear > 0.6) best = 'survival';
    winner = best;
    if (winner !== 'energy' && agent.sleeping) { agent.sleeping = false; if (winner === 'survival') say('!!', 1.2); }

    let goalCell = -1, gx = null, gy = null;
    const nearestPred = () => preds.reduce((m, p) => Math.min(m, dist(p.x, p.y, agent.x, agent.y)), Infinity);

    if (winner === 'hunger') {
      let bestI = -1, bestD = 1e9;
      food.forEach((f, idx) => { const d = bDist[cellOf(f.x, f.y)]; if (d >= 0 && d < bestD) { bestD = d; bestI = idx; } });
      if (bestI >= 0) {
        const f = food[bestI]; goalCell = cellOf(f.x, f.y); gx = f.x; gy = f.y; subMode = 'hunger';
        planText = `seeking food · ${bestD} steps away`;
      } else { winner = 'explore'; }
    }

    if (winner === 'survival') {
      let sh = null, shD = 1e9;
      shelters.forEach(s => { const d = bDist[nearestReach(cellOf(s.x, s.y))]; if (d >= 0 && d < shD) { shD = d; sh = s; } });
      if (inShelter(agent)) {
        subMode = 'hide'; planText = agent.gaveUp ? 'sheltering · predators gave up' : `sheltering · predators losing interest (${Math.max(0, 1.6 - agent.shelterT).toFixed(1)}s)`;
      } else if (sh && (shD < 70 || nearestPred() > 90)) {
        goalCell = nearestReach(cellOf(sh.x, sh.y)); gx = sh.x; gy = sh.y; subMode = 'shelter';
        planText = `fleeing to shelter · ${shD} steps`;
      } else {
        let bestI = -1, bestS = -1e9;
        for (let t = 0; t < 50; t++) {
          const i = pick(freeCells); const d = bDist[i];
          if (d < 0 || d > 50) continue;
          let m = Infinity; for (const p of preds) m = Math.min(m, dist(p.x, p.y, cx(i), cy(i)));
          const s = Math.min(m, 400) - d * CELL * 0.35;
          if (s > bestS) { bestS = s; bestI = i; }
        }
        if (bestI >= 0) { goalCell = bestI; subMode = 'flee'; planText = 'fleeing · no shelter nearby'; }
      }
    }

    if (winner === 'energy') {
      let sh = null, shD = 1e9;
      shelters.forEach(s => { const d = bDist[nearestReach(cellOf(s.x, s.y))]; if (d >= 0 && d < shD) { shD = d; sh = s; } });
      if (sh && shD < 40 && !inShelter(agent) && !agent.sleeping) {
        goalCell = nearestReach(cellOf(sh.x, sh.y)); gx = sh.x; gy = sh.y; subMode = 'tosleep';
        planText = 'tired · heading somewhere safe to sleep';
      } else {
        agent.sleeping = true; subMode = 'sleep';
        planText = `resting · energy ${drives.energy.toFixed(2)} ↑`;
      }
    }

    if (winner === 'explore') {
      const idle = time - pointer.t;
      if (pointer.inside && idle < 3 && drives.curiosity > 0.3 && dist(agent.x, agent.y, pointer.x, pointer.y) > 60) {
        const dx = agent.x - pointer.x, dy = agent.y - pointer.y, d = Math.hypot(dx, dy) || 1;
        const tx = pointer.x + dx / d * 46, ty = pointer.y + dy / d * 46;
        goalCell = nearestReach(cellOf(tx, ty)); gx = tx; gy = ty;
        if (subMode !== 'curious') say(pick(LINES.curious));
        subMode = 'curious'; planText = 'curious about your cursor';
      } else {
        exploreTimer -= 0.35;
        if (exploreGoal < 0 || exploreTimer <= 0 || dist(agent.x, agent.y, cx(exploreGoal), cy(exploreGoal)) < 14 || bDist[exploreGoal] < 0) {
          let bestI = -1, bestS = -1e9;
          for (let t = 0; t < 60; t++) {
            const i = pick(freeCells), d = bDist[i];
            if (d < 0) continue;
            const s = -visits[i] * 2 + Math.random() * 1.2 - d * 0.006 + (d > 10 ? 0.4 : 0);
            if (s > bestS) { bestS = s; bestI = i; }
          }
          exploreGoal = bestI; exploreTimer = rnd(4, 8);
        }
        goalCell = exploreGoal;
        if (subMode !== 'explore') subMode = 'explore';
        planText = `exploring · ${coverage()}% of the page mapped`;
      }
    }

    if (winner !== prev) {
      const key = winner === 'survival' ? (subMode === 'shelter' ? 'shelter' : 'survival') : winner;
      if (subMode !== 'curious') say(pick(LINES[key]));
    }

    agent.goal = gx != null ? { x: gx, y: gy } : (goalCell >= 0 ? { x: cx(goalCell), y: cy(goalCell) } : null);
    agent.path = goalCell >= 0 ? (pathTo(goalCell) || []) : [];
  }

  function coverage() { return freeCells.length ? Math.round((visited / freeCells.length) * 100) : 0; }

  /* ---------- update ---------- */
  function update(dt) {
    time += dt;
    const sp = Math.hypot(agent.vx, agent.vy);
    const sheltered = inShelter(agent);

    // drives
    drives.hunger = clamp(drives.hunger + 0.018 * dt, 0, 1);
    drives.energy = agent.sleeping ? clamp(drives.energy + 0.11 * dt, 0, 1) : clamp(drives.energy - (0.004 + (sp / 160) * 0.012) * dt, 0, 1);
    let threat = 0;
    for (const p of preds) {
      if (p.bored > 0) continue;
      threat = Math.max(threat, clamp(1 - (dist(p.x, p.y, agent.x, agent.y) - 30) / 230, 0, 1));
    }
    if (sheltered) threat *= agent.gaveUp ? 0.05 : 0.35;
    drives.fear = clamp(drives.fear + (threat - drives.fear) * (threat > drives.fear ? 3.5 : 0.5) * dt, 0, 1);
    drives.curiosity = clamp(drives.curiosity + 0.03 * dt, 0, 1);

    // exploration memory
    const me = cellOf(agent.x, agent.y);
    if (me !== agent.lastCell) {
      agent.lastCell = me;
      const c0 = me % COLS, r0 = (me / COLS) | 0;
      for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++) {
        const c = c0 + dc, r = r0 + dr;
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
        const j = r * COLS + c;
        if (!reach[j]) continue;
        if (visits[j] === 0) { visited++; drives.curiosity = clamp(drives.curiosity - 0.0005, 0, 1); }
        if (visits[j] < 250) visits[j]++;
      }
    }

    // shelter: stay hidden long enough and predators give up (the V8 "shelter" lesson)
    if (sheltered) {
      agent.shelterT += dt;
      if (!agent.gaveUp && agent.shelterT > 1.6 && preds.some(p => p.bored <= 0)) {
        agent.gaveUp = true;
        preds.forEach(p => { if (dist(p.x, p.y, agent.x, agent.y) < 380) p.bored = 4.5; });
        say('they gave up :)', 2.4);
      }
    } else { agent.shelterT = 0; agent.gaveUp = false; }

    // think a few times a second
    thinkT -= dt;
    if (thinkT <= 0) { thinkT = 0.35; think(); }

    // act
    const speeds = { hunger: 112, shelter: 170, flee: 165, hide: 0, tosleep: 60, sleep: 0, explore: 72, curious: 64 };
    if (agent.sleeping || subMode === 'hide') {
      if (subMode === 'hide' && sheltered) {
        const s = shelters.find(q => dist(agent.x, agent.y, q.x, q.y) < q.r);
        if (s) seek(agent, s.x, s.y, 30, dt, 30); else brake(agent, dt);
      } else brake(agent, dt);
    } else {
      follow(agent, speeds[subMode] || 80, dt, wall, agent.goal ? agent.goal.x : null, agent.goal ? agent.goal.y : null);
    }
    if (agent.hurtT > 0) agent.hurtT -= dt;
    move(agent, dt, wall);

    // eat
    for (let k = food.length - 1; k >= 0; k--) {
      const f = food[k];
      if (dist(f.x, f.y, agent.x, agent.y) < agent.r + 6) {
        food.splice(k, 1);
        eaten++; totalEaten++;
        drives.hunger = clamp(drives.hunger - 0.36, 0, 1);
        burst(f.x, f.y, C.food, 10);
        if (Math.random() < 0.45) say(pick(['nom', 'nom nom', '+1 seed', 'tasty']), 1.1);
        document.dispatchEvent(new CustomEvent('adam:eat', { detail: { total: totalEaten } }));
        thinkT = 0;
      }
    }

    // predators
    for (const p of preds) updatePredator(p, dt, sheltered);

    // food keeps appearing
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = 6;
      if (food.length < 3) { const i = randomReach(120); addFood(cx(i), cy(i), true); }
    }

    // a predator shows up on its own once, to show off fear + shelter
    if (!autoPredDone && !userPredators) {
      autoPredT -= dt;
      if (autoPredT <= 0) {
        autoPredDone = true;
        const i = randomReach(Math.min(W, H) * 0.55);
        addPredator(cx(i), cy(i));
        say('uh oh…', 2);
      }
    }

    // startled by fast cursor movements
    startleCD -= dt;
    if (pointer.inside && startleCD <= 0 && pointer.speed > 2.4 && dist(pointer.x, pointer.y, agent.x, agent.y) < 90 && time - pointer.t < 0.1) {
      drives.fear = clamp(drives.fear + 0.4, 0, 1);
      startleCD = 2.5;
      say('eek!', 1.2);
      agent.sleeping = false;
      thinkT = 0;
    }

    // party mode
    if (partyT > 0) {
      partyT -= dt;
      if (Math.random() < dt * 14) parts.push({ x: rnd(0, W), y: -10, vx: rnd(-30, 30), vy: rnd(60, 160), life: 4, max: 4, c: `hsl(${(time * 120 + Math.random() * 360) % 360} 85% 60%)`, s: rnd(2, 4), sq: true });
    }

    // look direction
    let lx = agent.vx, ly = agent.vy;
    if (subMode === 'curious' && pointer.inside) { lx = pointer.x - agent.x; ly = pointer.y - agent.y; }
    else if ((winner === 'survival') && preds.length) {
      const p = preds.reduce((a, b) => (dist(a.x, a.y, agent.x, agent.y) < dist(b.x, b.y, agent.x, agent.y) ? a : b));
      lx = p.x - agent.x; ly = p.y - agent.y;
    } else if (sp < 8 && agent.goal) { lx = agent.goal.x - agent.x; ly = agent.goal.y - agent.y; }
    const ll = Math.hypot(lx, ly);
    if (ll > 0.5) { agent.lookX += (lx / ll - agent.lookX) * Math.min(1, dt * 8); agent.lookY += (ly / ll - agent.lookY) * Math.min(1, dt * 8); }

    // blink
    agent.blinkT -= dt;
    if (agent.blinkT <= 0) { agent.blink = 0.16; agent.blinkT = rnd(2, 5); }
    if (agent.blink > 0) agent.blink -= dt;

    // trail
    const lt = trail[trail.length - 1];
    if (!lt || dist(lt.x, lt.y, agent.x, agent.y) > 7) { trail.push({ x: agent.x, y: agent.y, h: (time * 90) % 360 }); if (trail.length > 150) trail.shift(); }

    // particles
    if (agent.sleeping && Math.random() < dt * 1.4) parts.push({ x: agent.x + 8, y: agent.y - 12, vx: rnd(8, 18), vy: -22, life: 1.8, max: 1.8, c: C.energy, z: true, s: rnd(9, 13) });
    for (let k = parts.length - 1; k >= 0; k--) {
      const q = parts[k];
      q.life -= dt; if (q.life <= 0) { parts.splice(k, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (!q.z && !q.sq) { q.vx *= 0.92; q.vy = q.vy * 0.92 + 30 * dt; }
    }
    for (let k = ripples.length - 1; k >= 0; k--) { ripples[k].t += dt; if (ripples[k].t > 0.7) ripples.splice(k, 1); }
    if (bubble.t > 0) bubble.t -= dt;
  }

  function updatePredator(p, dt, sheltered) {
    p.replan -= dt;
    if (p.bored > 0) p.bored -= dt;
    const d = dist(p.x, p.y, agent.x, agent.y);
    if (p.replan <= 0) {
      p.replan = 0.5;
      const pc = cellOf(p.x, p.y);
      bfs(pc, pwall);
      const ac = cellOf(agent.x, agent.y);
      p.hunting = p.bored <= 0 && d < 270 && !sheltered && bDist[ac] >= 0;
      if (p.hunting) { p.path = pathTo(ac) || []; p.goal = null; }
      else if (!p.path.length || p.bored > 0 || Math.random() < 0.08) {
        let bestI = -1, bestS = -1e9;
        for (let t = 0; t < 30; t++) {
          const i = pick(freeCells); if (bDist[i] < 0) continue;
          const s = (p.bored > 0 ? dist(cx(i), cy(i), agent.x, agent.y) : -Math.abs(bDist[i] - 18)) + Math.random() * 40;
          if (s > bestS) { bestS = s; bestI = i; }
        }
        p.path = bestI >= 0 ? (pathTo(bestI) || []) : [];
      }
    }
    const speed = p.hunting ? 94 : p.bored > 0 ? 70 : 42;
    if (p.hunting && d < 200 && los(p.x, p.y, agent.x, agent.y, pwall)) seek(p, agent.x, agent.y, speed, dt, 1);
    else follow(p, speed, dt, pwall, null, null);
    move(p, dt, pwall);
    const s = Math.hypot(p.vx, p.vy);
    if (s > 3) { p.hx += (p.vx / s - p.hx) * Math.min(1, dt * 8); p.hy += (p.vy / s - p.hy) * Math.min(1, dt * 8); }

    if (!sheltered && p.bored <= 0 && agent.hurtT <= 0 && d < agent.r + 10) {
      hits++;
      agent.hurtT = 1.2;
      const nx = (agent.x - p.x) / (d || 1), ny = (agent.y - p.y) / (d || 1);
      agent.vx += nx * 260; agent.vy += ny * 260;
      drives.fear = 1;
      agent.sleeping = false;
      p.bored = 2.5;
      burst(agent.x, agent.y, C.pred, 12);
      say(pick(['ouch!', 'hey!!', 'owww']), 1.4);
      thinkT = 0;
    }
  }

  function burst(x, y, c, n) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, s = rnd(40, 140);
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, max: 0.6, c, s: rnd(1.5, 3) });
    }
  }

  /* ---------- drawing ---------- */
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);

    // the name (also the walls)
    if (fontsReady) {
      ctx.fillStyle = C.ink;
      ctx.font = nameFont;
      ctx.textBaseline = 'alphabetic';
      nameLines.forEach(l => ctx.fillText(l.text, l.x, l.y));
    }

    // shelters
    for (const s of shelters) {
      ctx.save();
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.globalAlpha = 0.08; ctx.fillStyle = C.shelter; ctx.fill();
      ctx.clip();
      ctx.globalAlpha = 0.28; ctx.strokeStyle = C.shelter; ctx.lineWidth = 1;
      for (let k = -s.r * 2; k < s.r * 2; k += 7) { ctx.beginPath(); ctx.moveTo(s.x + k - s.r, s.y - s.r); ctx.lineTo(s.x + k + s.r, s.y + s.r); ctx.stroke(); }
      ctx.restore();
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.lineDashOffset = -time * 8;
      ctx.strokeStyle = C.shelter; ctx.globalAlpha = 0.8; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = C.shelter; ctx.font = '700 9px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText('SAFE', s.x, s.y - s.r - 6); ctx.textAlign = 'start';
    }

    // tracking trail
    for (let k = 0; k < trail.length; k++) {
      const t = trail[k], a = (k / trail.length) * 0.5;
      ctx.globalAlpha = a;
      ctx.fillStyle = partyT > 0 ? `hsl(${t.h} 85% 55%)` : C.ink2;
      ctx.beginPath(); ctx.arc(t.x, t.y, partyT > 0 ? 2.4 : 1.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // planned path
    if (agent.path.length > 1 && !agent.sleeping) {
      ctx.save();
      ctx.strokeStyle = winnerColor(winner); ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(agent.x, agent.y);
      for (let k = 0; k < agent.path.length; k += 2) ctx.lineTo(cx(agent.path[k]), cy(agent.path[k]));
      if (agent.goal) ctx.lineTo(agent.goal.x, agent.goal.y);
      ctx.stroke(); ctx.restore();
    }

    // food
    for (const f of food) {
      const g = clamp((time - f.born) / 0.35, 0, 1), y = f.y + Math.sin(time * 2.2 + f.seed) * 1.4;
      ctx.save(); ctx.translate(f.x, y); ctx.scale(g, g);
      ctx.fillStyle = C.food; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.curiosity; ctx.beginPath(); ctx.ellipse(3, -5, 3.4, 1.6, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // predators
    for (const p of preds) {
      const a = Math.atan2(p.hy, p.hx);
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.save(); ctx.rotate(a);
      ctx.fillStyle = C.pred; ctx.globalAlpha = p.bored > 0 ? 0.6 : 1;
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-9, -9); ctx.lineTo(-5, 0); ctx.lineTo(-9, 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(3, -2.5, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(4, -2.5, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      if (p.hunting) { ctx.fillStyle = C.pred; ctx.fillText('!', 0, -15); }
      else if (p.bored > 0) { ctx.fillStyle = C.ink3; ctx.fillText('?', 0, -15); }
      ctx.textAlign = 'start';
      ctx.restore();
    }

    drawAgent();

    // particles
    for (const q of parts) {
      ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.c;
      if (q.z) { ctx.font = `700 ${q.s}px "JetBrains Mono", monospace`; ctx.fillText('z', q.x, q.y); }
      else if (q.sq) { ctx.fillRect(q.x, q.y, q.s * 1.6, q.s); }
      else { ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;

    // click ripples
    for (const r of ripples) {
      ctx.globalAlpha = 1 - r.t / 0.7; ctx.strokeStyle = r.c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, 6 + r.t * 50, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawBubble();
  }

  function drawAgent() {
    const a = agent, sp = Math.hypot(a.vx, a.vy), st = clamp(sp / 420, 0, 0.2);
    const ang = Math.atan2(a.vy, a.vx);

    // drive ring: four arcs, one per drive
    const order = [['hunger', C.hunger], ['energy', C.energy], ['fear', C.fear], ['curiosity', C.curiosity]];
    ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    order.forEach(([k, col], idx) => {
      const start = -Math.PI / 2 + idx * Math.PI / 2 + 0.12, span = (Math.PI / 2 - 0.24);
      ctx.strokeStyle = col; ctx.globalAlpha = 0.18;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 7, start, start + span); ctx.stroke();
      ctx.globalAlpha = DRIVE_OF[winner] === k ? 1 : 0.7;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 7, start, start + span * clamp(drives[k], 0.02, 1)); ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.lineCap = 'butt';

    // body
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(ang);
    ctx.scale(1 + st, 1 - st * 0.8);
    ctx.beginPath();
    for (let k = 0; k <= 28; k++) {
      const t = (k / 28) * Math.PI * 2;
      const r = a.r * (1 + 0.06 * Math.sin(t * 3 + time * 4) + (a.sleeping ? 0.04 * Math.sin(time * 2) : 0));
      k ? ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r) : ctx.moveTo(Math.cos(t) * r, Math.sin(t) * r);
    }
    ctx.closePath();
    ctx.fillStyle = a.hurtT > 0 && Math.sin(time * 40) > 0 ? C.pred : C.ink;
    ctx.fill();
    ctx.restore();

    // eyes
    const ex = a.lookX * 2.2, ey = a.lookY * 2.2;
    for (const side of [-1, 1]) {
      const x = a.x + side * 4 + ex, y = a.y - 2 + ey;
      if (a.sleeping) {
        ctx.strokeStyle = C.paper; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x - 2.4, y); ctx.lineTo(x + 2.4, y); ctx.stroke();
      } else {
        const open = a.blink > 0 ? 0.15 : 1;
        ctx.fillStyle = C.paper;
        ctx.beginPath(); ctx.ellipse(x, y, 3.1, 3.3 * open, 0, 0, Math.PI * 2); ctx.fill();
        if (open > 0.5) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x + a.lookX * 1.3, y + a.lookY * 1.3, 1.55, 0, Math.PI * 2); ctx.fill(); }
      }
    }
  }

  function drawBubble() {
    if (bubble.t <= 0 || !bubble.text) return;
    ctx.font = '500 11.5px "JetBrains Mono", monospace';
    const w = ctx.measureText(bubble.text).width + 16, h = 22;
    let x = agent.x - w / 2, y = agent.y - agent.r - 38;
    x = clamp(x, 6, W - w - 6);
    if (y < header.offsetHeight + 6) y = agent.y + agent.r + 16;
    ctx.globalAlpha = clamp(bubble.t / 0.3, 0, 1);
    rr(x, y, w, h, 8);
    ctx.fillStyle = C.card; ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = C.ink; ctx.fillText(bubble.text, x + 8, y + 15);
    ctx.globalAlpha = 1;
  }

  /* ---------- HUD ---------- */
  const hud = {
    rows: {}, win: document.getElementById('wsWinner'), thought: document.getElementById('simThought'),
    eaten: document.getElementById('statEaten'), hits: document.getElementById('statHits'), cov: document.getElementById('statCov'),
    pause: document.getElementById('simPause'), hint: document.getElementById('heroHint'),
  };
  document.querySelectorAll('.drive').forEach(el => { hud.rows[el.dataset.drive] = { el, bar: el.querySelector('.bar i'), val: el.querySelector('em') }; });

  function updateHud() {
    for (const k in hud.rows) {
      const r = hud.rows[k];
      r.bar.style.width = (drives[k] * 100).toFixed(1) + '%';
      r.val.textContent = drives[k].toFixed(2);
      r.el.classList.toggle('is-win', DRIVE_OF[winner] === k);
    }
    hud.win.textContent = LABEL[winner];
    hud.win.style.setProperty('--ws', winnerColor(winner));
    hud.thought.textContent = paused ? (reduceMotion ? 'paused for reduced motion · press ▶ to wake him' : 'paused') : planText;
    hud.eaten.textContent = eaten;
    hud.hits.textContent = hits;
    hud.cov.textContent = coverage() + '%';
  }

  /* ---------- loop ---------- */
  function running() { return !paused && inView && !document.hidden && built; }
  function frame(t) {
    raf = 0;
    if (!running()) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    update(dt);
    draw();
    hudT -= dt;
    if (hudT <= 0) { hudT = 0.12; updateHud(); }
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && running()) { last = 0; raf = requestAnimationFrame(frame); } }

  /* ---------- input ---------- */
  function localPos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  canvas.addEventListener('pointermove', e => {
    const p = localPos(e), now = performance.now();
    const dtm = now - pointer.lastT;
    pointer.speed = dtm > 0 ? dist(p.x, p.y, pointer.x, pointer.y) / dtm : 0;
    pointer.x = p.x; pointer.y = p.y; pointer.inside = true; pointer.t = time; pointer.lastT = now;
  });
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; });
  canvas.addEventListener('pointerdown', e => {
    if (!built) return;
    const p = localPos(e);
    if (wall[cellOf(p.x, p.y)] && tool !== 'food') { /* allow, it snaps */ }
    if (tool === 'food') addFood(p.x, p.y);
    else if (tool === 'predator') {
      const near = preds.findIndex(q => dist(q.x, q.y, p.x, p.y) < 20);
      if (near >= 0) preds.splice(near, 1); else { addPredator(p.x, p.y); userPredators = true; }
    } else if (tool === 'shelter') {
      const near = shelters.findIndex(s => dist(s.x, s.y, p.x, p.y) < s.r);
      if (near >= 0) { shelters.splice(near, 1); rebuildPredWalls(); } else addShelter(p.x, p.y);
    }
    if (!firstClick) { firstClick = true; hud.hint && hud.hint.classList.add('gone'); }
    thinkT = 0;
    if (!running()) draw();
  });

  function setTool(t) {
    tool = t;
    document.querySelectorAll('.tool').forEach(b => {
      const on = b.dataset.tool === t;
      b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    if (hud.hint && !firstClick) {
      hud.hint.textContent = { food: '↖ click anywhere on the paper to drop food', predator: '↖ click to release a predator (click it again to remove)', shelter: '↖ click to build a shelter (predators can’t enter)' }[t];
    }
  }
  document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  window.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea, select, dialog, [contenteditable]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey || !inView) return;
    const m = { 1: 'food', 2: 'predator', 3: 'shelter' }[e.key];
    if (m) setTool(m);
  });

  hud.pause.addEventListener('click', () => {
    paused = !paused;
    hud.pause.textContent = paused ? '▶' : '❚❚';
    hud.pause.setAttribute('aria-label', paused ? 'Resume simulation' : 'Pause simulation');
    updateHud(); kick();
  });
  document.getElementById('simReset').addEventListener('click', reset);

  function reset() {
    Object.assign(drives, { hunger: 0.5, energy: 0.88, fear: 0, curiosity: 0.75 });
    eaten = 0; hits = 0; visits = new Uint8Array(COLS * ROWS); visited = 0;
    agent.sleeping = false; agent.vx = agent.vy = 0; agent.path = []; agent.goal = null;
    winner = 'explore'; subMode = 'explore'; exploreGoal = -1;
    seedWorld(); say('fresh start!', 1.6); thinkT = 0;
    updateHud(); draw();
  }

  /* ---------- lifecycle ---------- */
  let resizeTimer = 0, lastVW = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // ignore pure height changes on mobile (address bar show/hide)
      if (window.innerWidth === lastVW && Math.abs(hero.getBoundingClientRect().height - H) < 2) return;
      lastVW = window.innerWidth;
      build();
    }, 180);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; kick(); }, { threshold: 0.02 }).observe(hero);
  }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('themechange', readColors);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => setTimeout(readColors, 30));

  function start() {
    if (built) return;
    fontsReady = true;
    readColors();
    build();
    if (paused) hud.pause.textContent = '▶';
    updateHud();
    kick();
  }
  readColors();
  const fontLoad = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('400 100px "Instrument Serif"'), document.fonts.load('500 12px "JetBrains Mono"')]).catch(() => {})
    : Promise.resolve();
  Promise.race([fontLoad, new Promise(r => setTimeout(r, 2500))]).then(start);

  /* ---------- public API (terminal, easter eggs) ---------- */
  window.Adam = {
    feed(n = 5) { for (let k = 0; k < n; k++) { const i = randomReach(60); addFood(cx(i), cy(i)); } kick(); },
    predator() { const i = randomReach(200); addPredator(cx(i), cy(i)); userPredators = true; kick(); },
    shelter() { const s = openSpot(4, 100); if (s >= 0) addShelter(cx(s), cy(s)); kick(); },
    party() { partyT = 12; this.feed(20); say('PARTY!!', 3); paused = false; hud.pause.textContent = '❚❚'; kick(); },
    reset,
    say(t) { say(t, 3); kick(); },
    get stats() { return { eaten: totalEaten, hits, coverage: coverage(), drives: { ...drives }, winner }; },
  };
})();
