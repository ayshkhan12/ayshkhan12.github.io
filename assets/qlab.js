/* ==========================================================
   Q-Lab: tabular Q-learning in an 8x8 grid world.
   Q(s,a) ← Q(s,a) + α · (r + γ · max Q(s',·) − Q(s,a))
   ========================================================== */
(() => {
  'use strict';

  const grid = document.getElementById('qGrid');
  if (!grid) return;

  const N = 8, A = 4, MAX_STEPS = 80;
  const MOVES = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const NAMES = ['up', 'right', 'down', 'left'];
  const idx = (x, y) => y * N + x;

  const DEFAULT = {
    walls: [[3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [5, 3], [6, 3], [5, 6], [5, 7]],
    danger: [[5, 1], [1, 4], [6, 5]],
    food: [7, 0], start: [0, 7],
  };

  let walls, danger, food, start;
  let Q = new Float32Array(N * N * A);
  let history = [];
  let params = { eps: 0.2, alpha: 0.5, gamma: 0.92 };
  let editTool = 'wall';
  let job = 0;

  const $ = id => document.getElementById(id);
  const msg = $('qMsg'), spark = $('qSpark');
  const cells = [];
  let agentEl;

  function resetWorld() {
    walls = new Set(DEFAULT.walls.map(([x, y]) => idx(x, y)));
    danger = new Set(DEFAULT.danger.map(([x, y]) => idx(x, y)));
    food = idx(...DEFAULT.food);
    start = idx(...DEFAULT.start);
  }

  /* ---------- environment ---------- */
  function step(s, a) {
    const x = s % N, y = (s / N) | 0, nx = x + MOVES[a][0], ny = y + MOVES[a][1];
    if (nx < 0 || ny < 0 || nx >= N || ny >= N || walls.has(idx(nx, ny))) return { s2: s, r: -0.5, done: false };
    const s2 = idx(nx, ny);
    if (s2 === food) return { s2, r: 10, done: true, ate: true };
    if (danger.has(s2)) return { s2, r: -10, done: true, died: true };
    return { s2, r: -0.1, done: false };
  }
  function maxQ(s) { let m = -Infinity; for (let a = 0; a < A; a++) m = Math.max(m, Q[s * A + a]); return m; }
  function greedy(s) {
    let best = [], m = -Infinity;
    for (let a = 0; a < A; a++) {
      const v = Q[s * A + a];
      if (v > m + 1e-9) { m = v; best = [a]; } else if (Math.abs(v - m) <= 1e-9) best.push(a);
    }
    return best[(Math.random() * best.length) | 0];
  }
  function bestAction(s) { let b = 0; for (let a = 1; a < A; a++) if (Q[s * A + a] > Q[s * A + b]) b = a; return b; }
  function choose(s, eps) { return Math.random() < eps ? (Math.random() * A) | 0 : greedy(s); }
  function learn(s, a, r, s2, done) {
    const target = r + (done ? 0 : params.gamma * maxQ(s2));
    Q[s * A + a] += params.alpha * (target - Q[s * A + a]);
  }
  function episode() {
    let s = start, total = 0, ok = false;
    for (let t = 0; t < MAX_STEPS; t++) {
      const a = choose(s, params.eps), o = step(s, a);
      learn(s, a, o.r, o.s2, o.done);
      total += o.r; s = o.s2;
      if (o.done) { ok = !!o.ate; break; }
    }
    history.push({ r: total, ok });
    return ok;
  }

  /* ---------- rendering ---------- */
  function build() {
    grid.innerHTML = '';
    cells.length = 0;
    for (let s = 0; s < N * N; s++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-cell';
      b.innerHTML = '<span class="arrow"></span><span class="qv"></span>';
      b.addEventListener('click', () => edit(s));
      grid.appendChild(b);
      cells.push(b);
    }
    agentEl = document.createElement('div');
    agentEl.className = 'q-agent';
    agentEl.innerHTML = '<i></i>';
    grid.appendChild(agentEl);
  }

  function render() {
    for (let s = 0; s < N * N; s++) {
      const c = cells[s], x = s % N, y = (s / N) | 0;
      c.classList.toggle('wall', walls.has(s));
      c.classList.toggle('danger', danger.has(s));
      c.classList.toggle('food', s === food);
      c.classList.toggle('start', s === start);
      let label = `Row ${y + 1}, column ${x + 1}`;
      if (walls.has(s)) label += ', wall';
      else if (danger.has(s)) label += ', danger';
      else if (s === food) label += ', food';
      else {
        const m = maxQ(s), a = bestAction(s);
        let sum = 0; for (let k = 0; k < A; k++) sum += Q[s * A + k];
        const seen = sum !== 0;
        c.style.setProperty('--v', seen ? Math.min(1, Math.abs(m) / 10).toFixed(3) : 0);
        c.classList.toggle('neg', m < 0);
        c.classList.toggle('unseen', !seen);
        c.style.setProperty('--rot', a * 90 + 'deg');
        c.style.setProperty('--conf', seen ? Math.min(1, Math.abs(m - sum / A) / 2.5).toFixed(3) : 0);
        c.querySelector('.qv').textContent = seen ? m.toFixed(1) : '';
        label += seen ? `, best move ${NAMES[a]}, value ${m.toFixed(1)}` : ', unexplored';
        if (s === start) label += ', start';
      }
      c.setAttribute('aria-label', label);
      c.title = label;
    }
  }

  function placeAgent(s, cls) {
    const c = cells[s];
    if (!c) return;
    agentEl.style.width = c.offsetWidth + 'px';
    agentEl.style.height = c.offsetHeight + 'px';
    agentEl.style.transform = `translate(${c.offsetLeft}px, ${c.offsetTop}px)`;
    agentEl.classList.remove('ate', 'died');
    if (cls) { void agentEl.offsetWidth; agentEl.classList.add(cls); }
  }

  function stats() {
    const last = history.slice(-50);
    $('qEpisodes').textContent = history.length.toLocaleString();
    if (!last.length) { $('qSuccess').textContent = '–'; $('qAvg').textContent = '–'; return 0; }
    const rate = last.filter(h => h.ok).length / last.length;
    $('qSuccess').textContent = Math.round(rate * 100) + '%';
    $('qAvg').textContent = (last.reduce((a, h) => a + h.r, 0) / last.length).toFixed(1);
    return rate;
  }

  function drawSpark() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = spark.clientWidth, h = spark.clientHeight;
    if (!w) return;
    spark.width = w * dpr; spark.height = h * dpr;
    const g = spark.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const ink3 = cs.getPropertyValue('--ink-3').trim(), acc = cs.getPropertyValue('--accent').trim();
    const lo = -12, hi = 10, Y = v => h - 6 - ((v - lo) / (hi - lo)) * (h - 12);
    g.clearRect(0, 0, w, h);
    g.strokeStyle = ink3; g.globalAlpha = 0.5; g.setLineDash([3, 4]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(w, Y(0)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    g.fillStyle = ink3; g.font = '10px "JetBrains Mono", monospace';
    g.fillText('reward / episode', 8, 13);
    if (history.length < 2) return;
    const pts = history.slice(-300), win = 15, avg = [];
    let acc2 = 0;
    pts.forEach((p, i) => { acc2 += p.r; if (i >= win) acc2 -= pts[i - win].r; avg.push(acc2 / Math.min(i + 1, win)); });
    g.fillStyle = ink3; g.globalAlpha = 0.35;
    pts.forEach((p, i) => { const x = 6 + (i / (pts.length - 1)) * (w - 12); g.fillRect(x, Y(Math.max(lo, p.r)) - 1, 1.5, 1.5); });
    g.globalAlpha = 1; g.strokeStyle = acc; g.lineWidth = 2;
    g.beginPath();
    avg.forEach((v, i) => { const x = 6 + (i / (avg.length - 1)) * (w - 12); i ? g.lineTo(x, Y(Math.max(lo, v))) : g.moveTo(x, Y(Math.max(lo, v))); });
    g.stroke();
  }

  function refresh() { render(); const r = stats(); drawSpark(); return r; }
  function say(t) { msg.textContent = t; }

  /* ---------- actions ---------- */
  function trainN(n) {
    const my = ++job;
    const chunk = Math.max(1, Math.round(n / 45));
    let done = 0;
    placeAgent(start);
    say(`Training ${n} episodes…`);
    const tick = () => {
      if (my !== job) return;
      for (let k = 0; k < chunk && done < n; k++, done++) episode();
      const rate = refresh();
      if (done < n) requestAnimationFrame(tick);
      else {
        if (rate >= 0.9) say(`Got it: ${Math.round(rate * 100)}% of recent episodes reach the food. Press “Run learned policy”, then drop a wall on its route and watch it adapt.`);
        else if (rate >= 0.5) say(`Getting there: ${Math.round(rate * 100)}% success. Exploration (ε) still makes it take risks. Keep training or lower ε.`);
        else say(`Still mostly lost (${Math.round(rate * 100)}% success). More episodes will fill in the value map.`);
      }
    };
    requestAnimationFrame(tick);
  }

  function animate(learning) {
    const my = ++job;
    let s = start, t = 0, total = 0;
    placeAgent(s);
    say(learning ? 'Watching one training episode. It explores at random with probability ε and learns from every step.' : 'Running the learned policy with no exploration.');
    const tick = () => {
      if (my !== job) return;
      const a = learning ? choose(s, params.eps) : greedy(s);
      const o = step(s, a);
      if (learning) learn(s, a, o.r, o.s2, o.done);
      total += o.r; s = o.s2; t++;
      placeAgent(s, o.ate ? 'ate' : o.died ? 'died' : null);
      if (learning) render();
      if (o.done || t >= MAX_STEPS) {
        if (learning) { history.push({ r: total, ok: !!o.ate }); refresh(); }
        if (o.ate) say(`${learning ? 'Lucky! ' : ''}Found the food in ${t} steps (reward ${total.toFixed(1)}).`);
        else if (o.died) say(`Walked into danger after ${t} steps. ${learning ? 'It will remember that cell is bad.' : 'More training needed.'}`);
        else say(`Gave up after ${t} steps without finding food. ${learning ? 'Early episodes look like this. Try “Train ×1000”.' : 'The policy loops. Needs more training.'}`);
        return;
      }
      setTimeout(tick, learning ? 90 : 130);
    };
    setTimeout(tick, 200);
  }

  function edit(s) {
    job++;
    if (editTool === 'wall') {
      if (s === food || s === start) return;
      danger.delete(s);
      walls.has(s) ? walls.delete(s) : walls.add(s);
    } else if (editTool === 'danger') {
      if (s === food || s === start) return;
      walls.delete(s);
      danger.has(s) ? danger.delete(s) : danger.add(s);
    } else if (editTool === 'food') {
      if (s === start) return;
      walls.delete(s); danger.delete(s); food = s;
    } else if (editTool === 'start') {
      if (s === food) return;
      walls.delete(s); danger.delete(s); start = s;
    }
    placeAgent(start);
    render();
    say('World changed. The old policy might be wrong now: train again and watch it adapt, or forget everything and start over.');
  }

  /* ---------- wiring ---------- */
  document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.q;
    if (k === 'watch1') animate(true);
    else if (k === 'train100') trainN(100);
    else if (k === 'train1000') trainN(1000);
    else if (k === 'greedy') animate(false);
    else if (k === 'reset') {
      job++; Q = new Float32Array(N * N * A); history = []; resetWorld(); placeAgent(start); refresh();
      say('Memory wiped. The agent knows nothing again.');
    }
  }));
  document.querySelectorAll('#qTools button').forEach(b => b.addEventListener('click', () => {
    editTool = b.dataset.edit;
    document.querySelectorAll('#qTools button').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on); });
  }));
  [['qEps', 'eps', 'qEpsOut'], ['qAlpha', 'alpha', 'qAlphaOut'], ['qGamma', 'gamma', 'qGammaOut']].forEach(([id, key, out]) => {
    const el = $(id);
    const sync = () => { params[key] = parseFloat(el.value); $(out).textContent = params[key].toFixed(2); };
    el.addEventListener('input', sync); sync();
  });
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { placeAgent(start); drawSpark(); }, 150); });
  document.addEventListener('themechange', drawSpark);

  resetWorld();
  build();
  refresh();
  requestAnimationFrame(() => placeAgent(start));
  window.QLab = { trainN };
})();
