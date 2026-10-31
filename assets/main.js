/* ==========================================================
   Page behaviour: theme, nav, sections, notes, terminal.
   ========================================================== */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = Object.fromEntries(S.projects.map(p => [p.id, p]));
  const catLabel = Object.fromEntries(S.categories.map(c => [c.id, c.label]));
  const EMAIL = `${S.profile.emailUser}@${S.profile.emailDomain}`;

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastT = 0;
  function toast(t, ms = 2600) {
    toastEl.textContent = t;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : sysDark.matches);
  $('#themeBtn').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    document.dispatchEvent(new CustomEvent('themechange'));
  });
  sysDark.addEventListener?.('change', () => document.dispatchEvent(new CustomEvent('themechange')));

  /* ---------- header / nav ---------- */
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('#menuBtn'), mobileNav = $('#mobileNav');
  function setMenu(open) {
    mobileNav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', () => setMenu(mobileNav.hidden));
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', e => { if (!mobileNav.hidden && !e.target.closest('#mobileNav, #menuBtn')) setMenu(false); });

  const navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => io.observe(s));
  }

  /* ---------- reveal on scroll ---------- */
  let revealIO = null;
  if ('IntersectionObserver' in window && !reduce) {
    revealIO = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  }
  function observeReveal(scope = document) {
    $$('.reveal:not(.in)', scope).forEach(n => (revealIO ? revealIO.observe(n) : n.classList.add('in')));
  }

  /* ---------- about: self_model.py ---------- */
  const SM = [
    'c:# how my agents would describe me',
    'p:self_model = {',
    '    |n:"name"|p:: |s:"Muhammad Aysh Khan"|p:,',
    '    |n:"based_in"|p:: |s:"Hull, UK"|p:,',
    '    |n:"degree"|p:: |s:"BSc CS · First Class"|p:,',
    '    |n:"started_in"|p:: |s:"Hong Kong · Engineering"|p:,',
    '    |n:"speaks"|p:: [|s:"en"|p:, |s:"ur"|p:, |s:"hi"|p:, |s:"pa"|p:, |s:"fr"|p:],',
    '    |n:"drives"|p:: {',
    '        |n:"curiosity"|p:: |k:0.97|p:,',
    '        |n:"hunger"|p:: |s:"hard problems"|p:,',
    '        |n:"fear"|p:: |s:"untested code"|p:,',
    '    |p:},',
    '    |n:"status"|p:: |s:"open to work"|p:,',
    'p:}',
  ];
  function smTokens() {
    const out = [];
    SM.forEach((line, li) => {
      line.split('|').forEach(part => {
        const m = /^([cpnsk]):(.*)$/.exec(part);
        if (m) out.push([m[1], m[2]]); else out.push(['p', part]);
      });
      if (li < SM.length - 1) out.push(['p', '\n']);
    });
    return out;
  }
  const smCode = $('#selfModel code');
  function typeSelfModel() {
    const toks = smTokens();
    if (reduce) {
      smCode.innerHTML = toks.map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join('') + '<span class="caret"></span>';
      return;
    }
    let ti = 0, ci = 0, span = null;
    smCode.innerHTML = '<span class="caret"></span>';
    const caret = smCode.lastChild;
    const tick = () => {
      if (ti >= toks.length) return;
      const [c, t] = toks[ti];
      if (!span) { span = document.createElement('span'); span.className = c; smCode.insertBefore(span, caret); }
      const n = t === '\n' ? 1 : 2;
      span.textContent += t.slice(ci, ci + n);
      ci += n;
      if (ci >= t.length) { ti++; ci = 0; span = null; }
      setTimeout(tick, t === '\n' ? 70 : 16);
    };
    tick();
  }
  onceVisible($('.code-card'), typeSelfModel);

  // count-up stats
  $$('.count').forEach(n => onceVisible(n, () => {
    const to = parseFloat(n.dataset.to), dec = +(n.dataset.dec || 0), pre = n.dataset.prefix || '', suf = n.dataset.suffix || '';
    if (reduce) return;
    const t0 = performance.now(), dur = 1300;
    const f = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      n.textContent = pre + (to * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }));

  function onceVisible(node, fn) {
    if (!node) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.3 });
    io.observe(node);
  }

  /* ---------- now: process monitor ---------- */
  const topList = $('#topList');
  S.now.forEach((p, i) => {
    const pct = p.state === 'L' ? 'ready' : Math.round(p.progress * 100) + '%';
    topList.appendChild(el(`
      <li>
        <button class="top-row st-${p.state}" type="button" aria-expanded="false" aria-controls="td${i}">
          <span class="pid">${p.pid}</span>
          <span class="proc">${esc(p.proc)}<small>${esc(p.label)}</small></span>
          <span class="stat"><i>${p.state}</i>${esc(p.status)}</span>
          <span class="cpu">0.0</span>
          <span class="prog"><span class="pb"><i style="width:${p.progress * 100}%"></i></span>${pct}</span>
          <span class="chev" aria-hidden="true">›</span>
        </button>
        <div class="top-detail" id="td${i}"><div><p>${esc(p.text)}${p.project ? `<br><button class="tiny-btn" type="button" data-open="${p.project}">open lab notes →</button>` : ''}</p></div></div>
      </li>`));
  });
  topList.addEventListener('click', e => {
    const row = e.target.closest('.top-row');
    if (!row) return;
    const open = row.getAttribute('aria-expanded') !== 'true';
    row.setAttribute('aria-expanded', open);
    $('#' + row.getAttribute('aria-controls')).classList.toggle('open', open);
  });
  const cpuEls = $$('.top-row .cpu');
  const cpu = S.now.map(p => (p.state === 'R' ? 60 : p.state === 'S' ? 6 : 1));
  function tickTop() {
    S.now.forEach((p, i) => {
      const [lo, hi] = p.state === 'R' ? [38, 99] : p.state === 'S' ? [2, 16] : [0.2, 3];
      cpu[i] = Math.min(hi, Math.max(lo, cpu[i] + (Math.random() - 0.5) * (hi - lo) * 0.35));
      cpuEls[i].textContent = cpu[i].toFixed(1);
    });
    $('#topLoad').textContent = (cpu.reduce((a, b) => a + b, 0) / 100).toFixed(2);
    $('#topClock').textContent = new Date().toLocaleTimeString('en-GB');
  }
  $('#topCount').textContent = S.now.length;
  tickTop();
  setInterval(() => { if (!document.hidden) tickTop(); }, 1200);

  /* ---------- work: filters + cards ---------- */
  const filters = $('#filters'), xpGrid = $('#xpGrid');
  S.categories.forEach((c, i) => {
    const n = c.id === 'all' ? S.projects.length : S.projects.filter(p => p.cats.includes(c.id)).length;
    filters.appendChild(el(`<button class="chip-btn" type="button" aria-pressed="${i === 0}" data-cat="${c.id}">${c.label}<sup>${n}</sup></button>`));
  });
  filters.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    $$('[data-cat]', filters).forEach(x => x.setAttribute('aria-pressed', x === b));
    const cat = b.dataset.cat;
    $$('.xp-card', xpGrid).forEach(card => {
      const show = cat === 'all' || card.dataset.cats.split(' ').includes(cat);
      card.classList.toggle('is-hidden', !show);
      if (show) card.classList.add('in');
    });
  });

  function visualHTML(p) {
    if (p.visual === 'bars') {
      const bars = [['V2', 181, 73], ['V3', '✕', 22, 'fail'], ['V5', 206, 83], ['V6', 249, 100, 'best'], ['V7', 248, 99.6]];
      return `<div class="xp-visual" aria-hidden="true"><span class="vis-cap">AVG. REWARD BY VERSION</span>
        <div class="vbars">${bars.map(([v, val, h, cls]) => `<div class="vbar ${cls || ''}"><b>${val}</b><i style="--h:${h}"></i><span>${v}</span></div>`).join('')}</div>
        <div class="vbars-axis"></div><span class="vis-foot">V3 crashed to −4,500. Lesson learned.</span></div>`;
    }
    if (p.visual === 'browser') {
      return `<div class="xp-visual" aria-hidden="true"><span class="vis-cap">PROTOTYPE · CLIENT PREVIEW</span>
        <div class="vbrowser"><div class="vb-bar"><i></i><i></i><i></i><span>preview · local co-op</span></div>
        <div class="vb-body"><div class="vb-logo">🚲</div><div class="vb-h">Two wheels,<br><em>two ways.</em></div>
        <div class="vb-row"><span class="vb-btn">Book a repair</span><span class="vb-btn alt">Send a parcel</span></div>
        <div class="vb-cards"><span></span><span></span></div></div></div></div>`;
    }
    if (p.visual === 'grid') {
      const G = ['→→→→↓f', '↑w→↑↓↑', '↑w↑d→↑', '↑w↑←↑↑', '→→↑w↑↑', '↑d↑←←↑'];
      const V = [[.4, .5, .6, .7, .85, 1], [.35, 0, .55, .6, .8, .9], [.3, 0, .45, 0, .7, .8], [.25, 0, .4, .3, .55, .7], [.2, .25, .35, 0, .45, .6], [.15, 0, .25, .2, .3, .5]];
      let cells = '';
      G.forEach((row, r) => [...row].forEach((ch, c) => {
        const cls = ch === 'w' ? 'w' : ch === 'f' ? 'f' : ch === 'd' ? 'd' : '';
        cells += `<span class="${cls}" style="--v:${V[r][c]}">${cls ? '' : ch}</span>`;
      }));
      return `<div class="xp-visual" aria-hidden="true"><span class="vis-cap">LEARNED POLICY · Q-TABLE</span><div class="vgrid">${cells}</div></div>`;
    }
    return '';
  }

  S.projects.forEach((p, i) => {
    const status = p.status.replace(/\s+/g, '-');
    const card = el(`
      <article class="xp-card reveal ${p.featured ? 'featured' : ''}" data-cats="${p.cats.join(' ')}" data-id="${p.id}">
        <div class="xp-main">
          <div class="xp-top"><span class="xp-code">${p.code}</span><span>${p.year}</span><span class="badge ${status}">${p.status}</span></div>
          <h3 class="xp-title"><button class="xp-link" type="button" data-open="${p.id}">${p.title}</button></h3>
          <p class="xp-sum">${p.summary}</p>
          ${p.metric ? `<div class="xp-metric"><b>${p.metric.value}</b><span>${p.metric.label}</span></div>` : ''}
          <ul class="xp-tags">${p.tags.map(t => `<li>${t}</li>`).join('')}</ul>
          <span class="xp-open" aria-hidden="true">Open lab notes →</span>
        </div>
        ${p.featured ? visualHTML(p) : ''}
      </article>`);
    card.style.transitionDelay = reduce ? '0ms' : `${(i % 3) * 70}ms`;
    xpGrid.appendChild(card);
  });

  // gentle tilt + spotlight on pointer devices
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    xpGrid.addEventListener('pointermove', e => {
      const card = e.target.closest('.xp-card');
      if (!card) return;
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', x * 100 + '%');
      card.style.setProperty('--my', y * 100 + '%');
      card.style.transitionDelay = '0ms';
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 3}deg) rotateY(${(x - 0.5) * 4}deg) translateY(-3px)`;
    });
    xpGrid.addEventListener('pointerout', e => {
      const card = e.target.closest('.xp-card');
      if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
    });
  }

  /* ---------- lab notes dialog ---------- */
  const notes = $('#notes'), notesBody = $('#notesBody');
  let lastFocus = null;

  function sec(title, inner) { return inner ? `<section class="n-sec"><h3>${title}</h3>${inner}</section>` : ''; }
  function list(items) { return items && items.length ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : ''; }

  function openNotes(id) {
    const p = byId[id];
    if (!p) return;
    if (!notes.open) lastFocus = document.activeElement;
    const links = (p.links || []).map(l => `<a class="btn btn-sm" href="${l.url}" target="_blank" rel="noopener">${l.label} ↗</a>`).join('');
    notesBody.innerHTML = `
      <button class="notes-close" type="button" data-close aria-label="Close notes">×</button>
      <div class="n-meta"><span class="xp-code">${p.code}</span><span>${p.year}</span><span class="badge ${p.status.replace(/\s+/g, '-')}">${p.status}</span><span>${p.cats.map(c => catLabel[c]).join(' · ')}</span></div>
      <h2 class="n-title" id="notesTitle">${p.title}</h2>
      <p class="n-sum">${p.summary}</p>
      <ul class="xp-tags n-tags">${p.tags.map(t => `<li>${t}</li>`).join('')}</ul>
      ${sec('The problem', p.problem ? `<p>${p.problem}</p>` : '')}
      ${sec('What I built', list(p.built))}
      <div id="widgetMount"></div>
      ${sec('What happened', list(p.results))}
      ${p.learned ? `<section class="n-sec"><h3>What I learned</h3><div class="n-learn"><p>${p.learned}</p></div></section>` : ''}
      <div class="n-links">${links}${p.privateNote ? `<span class="n-private">${p.privateNote}</span>` : ''}<a class="btn btn-sm btn-ghost" href="#contact" data-close>Ask me about it</a></div>`;
    if (!notes.open) { notes.showModal(); root.classList.add('modal-open'); }
    notesBody.scrollTop = 0;
    mountWidget(p, $('#widgetMount', notesBody));
    try { history.replaceState(null, '', '#notes/' + id); } catch (e) {}
  }

  function openTldr() {
    if (!notes.open) lastFocus = document.activeElement;
    notesBody.innerHTML = `
      <button class="notes-close" type="button" data-close aria-label="Close">×</button>
      <div class="n-meta"><span class="xp-code">TL;DR</span><span>the 30-second version</span></div>
      <h2 class="n-title" id="notesTitle">Muhammad Aysh Khan</h2>
      <p class="n-sum">Developer in Hull, UK with a First Class BSc in Computer Science, three-plus years in customer-facing roles, and a habit of building things nobody asked for that turn out useful.</p>
      ${sec('Looking for', '<p><b>IT support</b>, <b>junior developer</b> and <b>AI/ML</b> roles, plus freelance websites for local businesses.</p>')}
      ${sec('Education', list(['<b>BSc (Hons) Computer Science, First Class</b>, University of Hull, 2024–26', 'Associate of Engineering, UOW College Hong Kong, 2021–24']))}
      ${sec('Strongest skills', list(['C#, .NET, ASP.NET Core, Blazor', 'Python, PyTorch, scikit-learn, Hugging Face, reinforcement learning', 'SQL (MySQL, SQLite), JavaScript, REST APIs', 'Authentication, role-based access, RSA/AES, hashing and signatures', 'Windows & macOS support, Microsoft 365, networking fundamentals', 'Git/GitHub, Agile (Scrum & Kanban), clear documentation']))}
      ${sec('Three projects worth a look', list([
        '<button class="xp-link-inline" type="button" data-open="conscious">Conscious Instinct Agent</button>: deep RL with a world model, memory and a global workspace',
        '<button class="xp-link-inline" type="button" data-open="secure-api">Secure REST API</button>: custom auth, roles, RSA-2048 + AES, signatures',
        '<button class="xp-link-inline" type="button" data-open="coop">Courier co-op website</button>: my first client project, in progress',
      ]))}
      ${sec('Beyond code', list(['Retail Assistant at SPAR (Hull University Union): built a rota tool for colleagues on my own initiative', 'Employee of the Month at The Salad Project, London, and offered a supervisor role', 'Team Lead, Employer’s Challenge 2025 · President, South Asian Society · Hull Employability Award for STEM', 'English (IELTS 8.5), Urdu, Hindi, Punjabi, French']))}
      <div class="n-links"><a class="btn btn-sm btn-primary" href="mailto:${EMAIL}?subject=Hello%20Aysh">Email me</a><a class="btn btn-sm" href="${S.profile.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a><a class="btn btn-sm" href="${S.profile.github}" target="_blank" rel="noopener">GitHub ↗</a></div>`;
    if (!notes.open) { notes.showModal(); root.classList.add('modal-open'); }
    notesBody.scrollTop = 0;
  }
  $('#tldrBtn').addEventListener('click', openTldr);

  notes.addEventListener('close', () => {
    if (notes.open) return; // re-opened before this event arrived
    root.classList.remove('modal-open');
    if (location.hash.startsWith('#notes/')) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  });
  notes.addEventListener('click', e => {
    if (e.target === notes) { notes.close(); return; }
    const c = e.target.closest('[data-close]');
    if (c) {
      notes.close();
      if (c.getAttribute('href') === '#contact') { e.preventDefault(); $('#contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b && !e.target.closest('#wiring')) { e.preventDefault(); openNotes(b.dataset.open); }
  });

  /* ---------- widgets inside notes ---------- */
  function barChart(title, rows, metrics) {
    const w = el(`<div class="widget">
      <div class="widget-title"><span>${title}</span>${metrics.length > 1 ? `<div class="seg" role="radiogroup" aria-label="Metric">${metrics.map((m, i) => `<button type="button" role="radio" aria-checked="${i === 0}" class="${i === 0 ? 'is-on' : ''}" data-m="${i}">${m.label}</button>`).join('')}</div>` : ''}</div>
      <div class="hbars">${rows.map(r => `<div class="hbar"><span class="lbl">${r.label}${r.sub ? `<small>${r.sub}</small>` : ''}</span><span class="track"><span class="fill"></span></span><span class="val"></span></div>`).join('')}</div>
      <p class="chart-note"></p></div>`);
    const rowsEl = $$('.hbar', w);
    function show(i) {
      const m = metrics[i];
      const ok = m.vals.filter((v, k) => v != null && !(m.fails && m.fails[k]));
      const best = m.lower ? Math.min(...ok) : Math.max(...ok);
      const max = m.max || Math.max(...ok);
      rowsEl.forEach((row, k) => {
        const v = m.vals[k], fail = !!(m.fails && m.fails[k]);
        row.classList.toggle('fail', fail);
        row.classList.toggle('best', !fail && v === best);
        const pct = v == null ? 0 : fail ? 100 : Math.max(1.5, (v / max) * 100);
        requestAnimationFrame(() => { row.querySelector('.fill').style.width = pct + '%'; });
        row.querySelector('.val').textContent = fail && m.failText ? m.failText[k] : v == null ? 'n/a' : m.fmt(v);
      });
      $('.chart-note', w).innerHTML = m.note || '';
      $$('[data-m]', w).forEach(b => { const on = +b.dataset.m === i; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
    }
    w.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) show(+b.dataset.m); });
    requestAnimationFrame(() => show(0));
    return w;
  }

  function archWidget() {
    const nodes = [
      ['Senses', 'local grid view', 'A local view of the world around it: food, predators, walls and safe zones nearby.'],
      ['Self-model', 'drives · position', 'What it knows about itself: six drives, its position, last action, how much it has explored and, from V7, the remembered direction of food and safety.'],
      ['World model', 'RSSM · GRU-256', 'A recurrent state-space model (GRU-256 with a 32-dim stochastic latent) that learns to predict what happens next. Its prediction error doubles as a curiosity signal.'],
      ['Episodic memory', '3,000 moments', 'Up to 3,000 past moments, recalled by cosine similarity (k = 5) and tagged with valence: how good or bad they felt. Saved with every checkpoint.'],
      ['Global workspace', '8 streams → 1', 'Eight 64-dim streams (senses, world model, memory, self and four instincts) compete through Transformer attention. The winner is broadcast to everything else: the agent’s spotlight of attention.'],
      ['4 instinct Q-nets', 'dueling DQNs', 'Hunger, survival, exploration and energy each have their own dueling DQN, all reading the same broadcast.'],
      ['Arbitration', '→ action', 'Maslow-style urgency weights decide which instinct drives the action, with a crisis override when danger is close. Output: move N, S, E, W or rest.'],
    ];
    const w = el(`<div class="widget"><div class="widget-title"><span>Architecture · <b>tap a block</b></span></div>
      <div class="arch">${nodes.map((n, i) => `${i ? '<span class="arch-arrow" aria-hidden="true">→</span>' : ''}<button type="button" class="arch-node ${i === 4 ? 'is-on' : ''}" data-a="${i}"><b>${n[0]}</b><span>${n[1]}</span></button>`).join('')}</div>
      <p class="arch-desc" aria-live="polite">${nodes[4][2]}</p></div>`);
    const set = i => { $$('.arch-node', w).forEach(b => b.classList.toggle('is-on', +b.dataset.a === i)); $('.arch-desc', w).textContent = nodes[i][2]; };
    w.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) set(+b.dataset.a); });
    w.addEventListener('pointerover', e => { const b = e.target.closest('[data-a]'); if (b) set(+b.dataset.a); });
    return w;
  }

  function cryptoWidget() {
    if (!(window.crypto && crypto.subtle)) {
      return el('<div class="widget"><p class="chart-note" style="margin:0">This live demo uses your browser’s Web Crypto API, which needs the page to be served over https.</p></div>');
    }
    const w = el(`<div class="widget crypto">
      <div class="widget-title"><span>Try it · <b>hybrid encryption</b>, live</span></div>
      <p class="chart-note" style="margin:0">The same idea my API uses: a one-time AES key encrypts the message, RSA-2048 protects that key, and a digital signature proves who sent it. Real cryptography in your browser, nothing faked.</p>
      <textarea aria-label="Message to encrypt" maxlength="400">Meet me by the library at 3pm.</textarea>
      <div class="crypto-steps">
        <button class="btn btn-sm btn-primary" type="button" data-c="enc">1 · Encrypt & sign</button>
        <button class="btn btn-sm" type="button" data-c="tamper" disabled>2 · Tamper with it</button>
        <button class="btn btn-sm" type="button" data-c="dec" disabled>3 · Decrypt & verify</button>
      </div>
      <div class="crypto-out" aria-live="polite"></div></div>`);
    const out = $('.crypto-out', w), ta = $('textarea', w);
    const btn = k => $(`[data-c="${k}"]`, w);
    const hex = (b, n = 40) => { const h = [...b].map(x => x.toString(16).padStart(2, '0')).join(''); return (h.length > n * 2 ? h.slice(0, n * 2) + '…' : h) + ` (${b.length} bytes)`; };
    const row = (k, v, cls = '') => `<div class="kv ${cls}"><span>${k}</span><code>${esc(v)}</code></div>`;
    const cat = (a, b) => { const c = new Uint8Array(a.length + b.length); c.set(a); c.set(b, a.length); return c; };
    let keys = null, pkt = null;

    async function getKeys() {
      if (keys) return keys;
      out.innerHTML = row('status', 'generating two RSA-2048 key pairs…');
      const gen = (name, use) => crypto.subtle.generateKey({ name, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, use);
      keys = { enc: await gen('RSA-OAEP', ['encrypt', 'decrypt']), sig: await gen('RSASSA-PKCS1-v1_5', ['sign', 'verify']) };
      return keys;
    }
    async function encrypt() {
      btn('enc').disabled = true;
      try {
        const k = await getKeys();
        const msg = new TextEncoder().encode(ta.value || ' ');
        const aes = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, msg));
        const raw = new Uint8Array(await crypto.subtle.exportKey('raw', aes));
        const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, k.enc.publicKey, raw));
        const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k.sig.privateKey, cat(iv, ct)));
        const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', msg));
        pkt = { iv, ct, wrapped, sig };
        out.innerHTML = row('sha-256 of message', hex(hash, 32)) + row('aes key, rsa-encrypted', hex(wrapped)) + row('iv', hex(iv)) + row('ciphertext', hex(ct)) + row('signature', hex(sig));
        btn('tamper').disabled = false; btn('dec').disabled = false;
      } catch (err) { out.innerHTML = row('error', String(err.message || err), 'bad'); }
      btn('enc').disabled = false;
    }
    function tamper() {
      if (!pkt) return;
      pkt.ct[0] ^= 1;
      const rows = $$('.kv', out);
      const ctRow = rows[3];
      ctRow.querySelector('code').textContent = hex(pkt.ct) + '  ← one bit flipped';
      ctRow.classList.remove('flash'); void ctRow.offsetWidth; ctRow.classList.add('flash');
      btn('tamper').disabled = true;
    }
    async function decrypt() {
      if (!pkt) return;
      const k = await getKeys();
      const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', k.sig.publicKey, pkt.sig, cat(pkt.iv, pkt.ct));
      let text = null;
      try {
        const raw = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, k.enc.privateKey, pkt.wrapped);
        const aes = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
        text = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: pkt.iv }, aes, pkt.ct));
      } catch (e) { text = null; }
      $$('.kv.result', out).forEach(n => n.remove());
      out.insertAdjacentHTML('beforeend',
        row('signature check', ok ? '✓ valid: sent by the key holder' : '✕ invalid: message was changed', (ok ? 'ok' : 'bad') + ' result') +
        row('decrypted', text != null ? text : '✕ rejected: AES-GCM authentication failed', (text != null ? 'ok' : 'bad') + ' result'));
    }
    w.addEventListener('click', e => {
      const b = e.target.closest('[data-c]');
      if (!b) return;
      ({ enc: encrypt, tamper, dec: decrypt })[b.dataset.c]();
    });
    return w;
  }

  function replayWidget() {
    const L = [
      ['d', '$ dotnet run'],
      ['g', '=== Engagement Monitoring System ==='],
      ['', 'Log in as: [1] Student  [2] Personal supervisor  [3] Senior tutor'],
      ['o', '> 1'],
      ['', 'Student ID: S1042'],
      ['g', 'Welcome back, Sam.'],
      ['', '[1] Update progress & well-being  [2] Book a meeting  [3] Meeting history'],
      ['o', '> 1'],
      ['', 'How are you feeling this week? (1-5): 4'],
      ['', 'Anything your supervisor should know? Busy week, coursework on track.'],
      ['g', '✓ Status saved to students.json'],
      ['o', '> 2'],
      ['', 'Free slots with your supervisor: Tue 10:00 · Thu 14:00'],
      ['o', '> Thu 14:00'],
      ['g', '✓ Meeting booked (meetings.json)'],
    ];
    const w = el(`<div class="widget"><div class="widget-title"><span>Illustrative session · <b>student view</b></span><button class="tiny-btn" type="button">↻ replay</button></div><pre class="replay" aria-label="Example console session"></pre></div>`);
    const pre = $('pre', w);
    let run = 0;
    function play() {
      const my = ++run;
      pre.innerHTML = '';
      let i = 0;
      const next = () => {
        if (my !== run || i >= L.length || !document.contains(pre)) return;
        const [c, t] = L[i++];
        pre.insertAdjacentHTML('beforeend', `<span class="${c}">${esc(t)}</span>\n`);
        setTimeout(next, reduce ? 0 : c === 'o' ? 650 : 380);
      };
      next();
    }
    $('button', w).addEventListener('click', play);
    setTimeout(play, 250);
    return w;
  }

  function estimatorWidget() {
    const items = [['Puncture repair', 10], ['Brake tune-up', 15], ['Gear adjustment', 15], ['Wheel true', 18], ['Full service', 55]];
    const w = el(`<div class="widget"><div class="widget-title"><span>A taste of the <b>repair estimator</b></span><span>demo prices</span></div>
      <div class="estimator">${items.map(([n, p], i) => `<label class="est-item"><input type="checkbox" data-p="${p}" ${i === 0 ? 'checked' : ''}><span>${n}</span><em>£${p}</em></label>`).join('')}
      <div class="est-total"><span>Estimated total</span><b>£0</b></div></div></div>`);
    const total = $('.est-total b', w);
    let shown = 0, raf = 0;
    const upd = () => {
      const t = $$('input:checked', w).reduce((a, i) => a + +i.dataset.p, 0);
      cancelAnimationFrame(raf);
      const from = shown, t0 = performance.now();
      const f = now => { const k = Math.min(1, (now - t0) / 350); shown = Math.round(from + (t - from) * k); total.textContent = '£' + shown; if (k < 1) raf = requestAnimationFrame(f); };
      raf = requestAnimationFrame(f);
    };
    w.addEventListener('change', upd);
    upd();
    return w;
  }

  function stepsWidget() {
    const st = [
      ['82.64%', 'Monolithic CNN', 'One network guesses all three digits at once: a 1,000-way classification.', 82.64],
      ['94.28%', 'Split the image', 'Cut each image into three digits and read them one at a time.', 94.28],
      ['99.10%', 'Multi-task CNN', 'One shared backbone with three heads, one per digit position.', 99.1],
    ];
    const w = el(`<div class="widget"><div class="widget-title"><span>Full-sequence test accuracy · <b>three steps</b></span></div>
      <div class="steps">${st.map((s, i) => `<div class="step-card ${i === 2 ? 'best' : ''}"><b>${s[0]}</b><span>${s[1]}</span><p>${s[2]}</p><div class="step-meter"><i data-w="${s[3]}"></i></div></div>`).join('')}</div></div>`);
    setTimeout(() => $$('.step-meter i', w).forEach(i => { i.style.width = ((+i.dataset.w - 75) / 25) * 100 + '%'; }), 120);
    return w;
  }

  function mountWidget(p, mount) {
    if (!mount) return;
    const add = n => mount.appendChild(n);
    switch (p.widget) {
      case 'conscious':
        add(archWidget());
        add(barChart('Results by version', [
          { label: 'V2', sub: 'baseline' }, { label: 'V3', sub: 'LSTM Q-nets' }, { label: 'V4', sub: 'checkpoint bug' },
          { label: 'V5', sub: 'feed-forward, 16× faster' }, { label: 'V6', sub: 'more food, tuned curiosity' }, { label: 'V7', sub: 'spatial food memory' },
        ], [
          { label: 'Reward', vals: [181, -4500, null, 205.6, 249.3, 248.0], fails: [0, 1, 1, 0, 0, 0], failText: [0, '−4,500', 'broken'], fmt: v => '+' + v.toFixed(0), note: '<b>V3</b>’s LSTM Q-networks hit a backprop-through-time bottleneck and <b>V4</b> had a checkpoint bug. Both are why V5+ use feed-forward nets and evaluation-based checkpoints.' },
          { label: 'Food / ep', vals: [0.82, 0.84, null, 0.36, 0.50, 0.52], fails: [0, 1, 1, 0, 0, 0], failText: [0, '0.84', 'broken'], fmt: v => v.toFixed(2), note: 'Food per episode is the gap I’m still closing. V2 ate more but took more risks. Next: danger-aware routing and prioritised replay.' },
          { label: 'Danger hits', lower: true, vals: [5.48, 183.8, null, 4.26, 6.12, 5.44], fails: [0, 1, 1, 0, 0, 0], failText: [0, '183.8', 'broken'], fmt: v => v.toFixed(2), note: 'Lower is better. <b>V7</b> took fewer hits than the V2 baseline (5.44 vs 5.48) while earning 37% more reward.' },
        ]));
        break;
      case 'adam': {
        add(barChart('State space for the hunger agent', [
          { label: 'Absolute encoding', sub: '(x, y) of everything' }, { label: 'Relative encoding', sub: 'directions to things' },
        ], [{ label: 'keys', vals: [4474, 392], lower: true, fmt: v => v.toLocaleString(), note: 'Describing the world relative to the agent (“food is up-left”) instead of absolute coordinates made the Q-table <b>11× smaller</b>, so it could actually converge within the training budget.' }]));
        const b = el('<div class="widget"><div class="widget-title"><span>Want to see Q-learning happen?</span></div><p class="chart-note" style="margin:0 0 12px">There’s a live, editable Q-learning lab further down this page.</p><button class="btn btn-sm btn-primary" type="button">Open the Q-Lab ↓</button></div>');
        $('button', b).addEventListener('click', () => { notes.close(); $('#qlab').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
        add(b);
        break;
      }
      case 'crypto': add(cryptoWidget()); break;
      case 'nlp':
        add(barChart('Test results on LIAR (binary)', [
          { label: 'Majority class', sub: 'always says “false”' }, { label: 'TF-IDF + Naive Bayes' }, { label: 'TF-IDF + Logistic Reg.' },
          { label: 'Frozen DistilBERT + LR', sub: 'ablation' }, { label: 'Fine-tuned DistilBERT' },
        ], [
          { label: 'Macro-F1', vals: [0.3908, 0.5757, 0.5521, 0.4719, 0.6180], max: 0.7, fmt: v => v.toFixed(3), note: 'Macro-F1 weighs true and false statements equally. Fine-tuned DistilBERT wins clearly, and frozen embeddings don’t, so the gain comes from fine-tuning itself.' },
          { label: 'Accuracy', vals: [0.6415, 0.6438, 0.6594, 0.6087, 0.6493], max: 0.7, fmt: v => (v * 100).toFixed(1) + '%', note: 'The accuracy trap: always answering “false” scores <b>64.2%</b>, almost the same as DistilBERT. That’s why macro-F1 was my main metric.' },
        ]));
        break;
      case 'mnist': add(stepsWidget()); break;
      case 'codegen':
        add(barChart('CodeT5+ on 6 pseudocode tasks', [
          { label: 'Baseline' }, { label: 'Explicit constraints' }, { label: 'Role prompting' }, { label: 'Few-shot (1 example)' }, { label: 'Step-by-step' }, { label: 'LoRA fine-tuned', sub: '24 examples, 21 s' },
        ], [
          { label: 'Syntax valid', vals: [66.7, 100, 66.7, 0, 50, null], max: 100, fmt: v => v.toFixed(0) + '%', note: 'Telling the model exactly what to avoid (Python 2 prints, prompt text in <code>input()</code>) fixed every syntax failure.' },
          { label: 'Pass@1', vals: [33.3, 33.3, 33.3, 0, 33.3, 16.7], max: 100, fmt: v => v.toFixed(1) + '%', note: 'Correctness is harder than syntax. No prompt beat 2/6, and LoRA on 24 examples dropped to 1/6. A small model needs more data, not cleverer prompts.' },
        ]));
        break;
      case 'terminal': add(replayWidget()); break;
      case 'coop': add(estimatorWidget()); break;
    }
  }

  /* ---------- skills wiring ---------- */
  const SHORT = { conscious: 'Conscious agent', adam: 'Project Adam', 'human-world': 'Human Agent World', nlp: 'Fake-news detector', mnist: 'Triple-MNIST CNN', codegen: 'CodeT5+ generator', lighthr: 'LightHR analytics', 'secure-api': 'Secure REST API', halal: 'Halal Finder', 'campus-map': 'Campus map', netdb: 'Networked database', engagement: 'Engagement monitor', coop: 'Courier co-op site', rota: 'Rota tool' };
  const ORDER = ['conscious', 'adam', 'human-world', 'nlp', 'mnist', 'codegen', 'lighthr', 'secure-api', 'halal', 'campus-map', 'netdb', 'engagement', 'coop', 'rota'];
  const wiring = $('#wiring'), wires = $('#wires'), wS = $('#wSkills'), wP = $('#wProjects');
  S.skills.forEach((s, i) => wS.appendChild(el(`<li><button class="node" type="button" data-skill="${i}">${esc(s.name)}<span class="n-count">${s.projects.length}</span></button></li>`)));
  ORDER.filter(id => byId[id]).forEach(id => wP.appendChild(el(`<li><button class="node" type="button" data-proj="${id}">${SHORT[id] || byId[id].title}</button></li>`)));
  S.alsoSkills.forEach(s => $('#alsoSkills').appendChild(el(`<li>${esc(s)}</li>`)));

  let edges = [];
  function drawWires() {
    const r = wiring.getBoundingClientRect();
    wires.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    wires.innerHTML = '';
    edges = [];
    S.skills.forEach((s, i) => {
      const a = $(`[data-skill="${i}"]`, wiring).getBoundingClientRect();
      s.projects.forEach(pid => {
        const nb = $(`[data-proj="${pid}"]`, wiring);
        if (!nb) return;
        const b = nb.getBoundingClientRect();
        const x1 = a.right - r.left, y1 = a.top + a.height / 2 - r.top, x2 = b.left - r.left, y2 = b.top + b.height / 2 - r.top;
        const dx = (x2 - x1) * 0.5;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`);
        wires.appendChild(path);
        edges.push({ s: i, p: pid, path });
      });
    });
  }
  let locked = null;
  function focusWiring(kind, key) {
    clearWiring();
    if (kind == null) return;
    wiring.classList.add('has-focus');
    const hot = edges.filter(e => (kind === 's' ? e.s === key : e.p === key));
    hot.forEach(e => {
      e.path.classList.add('hot');
      $(`[data-skill="${e.s}"]`, wiring).classList.add('hot');
      $(`[data-proj="${e.p}"]`, wiring).classList.add('hot');
      wires.appendChild(e.path);
    });
    (kind === 's' ? $(`[data-skill="${key}"]`, wiring) : $(`[data-proj="${key}"]`, wiring)).classList.add('hot');
  }
  function clearWiring() {
    wiring.classList.remove('has-focus');
    $$('.hot', wiring).forEach(n => n.classList.remove('hot'));
  }
  wiring.addEventListener('pointerover', e => {
    const n = e.target.closest('.node');
    if (!n || locked) return;
    n.dataset.skill != null ? focusWiring('s', +n.dataset.skill) : focusWiring('p', n.dataset.proj);
  });
  wiring.addEventListener('pointerleave', () => { if (!locked) clearWiring(); });
  wiring.addEventListener('focusin', e => {
    const n = e.target.closest('.node');
    if (n) n.dataset.skill != null ? focusWiring('s', +n.dataset.skill) : focusWiring('p', n.dataset.proj);
  });
  wiring.addEventListener('click', e => {
    const n = e.target.closest('.node');
    if (!n) { locked = null; clearWiring(); return; }
    if (n.dataset.proj) { openNotes(n.dataset.proj); return; }
    const k = +n.dataset.skill;
    if (locked === k) { locked = null; clearWiring(); } else { locked = k; focusWiring('s', k); }
  });
  let wt = 0;
  const redraw = () => { clearTimeout(wt); wt = setTimeout(drawWires, 120); };
  window.addEventListener('resize', redraw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWires);
  drawWires();

  /* ---------- journey changelog ---------- */
  const cl = $('#changelog');
  S.changelog.forEach(c => cl.appendChild(el(`
    <li class="cl reveal ${c.major ? 'major' : ''}" data-branch="${c.branch}">
      <div class="cl-when">${c.date}</div>
      <div class="cl-dot"><i></i></div>
      <div class="cl-body">
        <div class="cl-ver"><h3>${c.v}</h3><span class="place">${c.place}</span></div>
        <ul>${c.items.map(([t, txt]) => `<li><span class="tag tag-${t}">${t}</span><span>${txt}</span></li>`).join('')}</ul>
      </div>
    </li>`)));

  /* ---------- contact ---------- */
  const emailBtn = $('#emailBtn');
  emailBtn.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Hello Aysh')}`;
  $('#emailText').textContent = EMAIL;
  $('#copyEmail').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(EMAIL); toast('Copied ' + EMAIL); }
    catch (e) { toast(EMAIL); }
  });
  $('#year').textContent = new Date().getFullYear();
  document.addEventListener('adam:eat', e => {
    const n = e.detail.total;
    $('#footerStat').textContent = `Adam has eaten ${n} seed${n === 1 ? '' : 's'} since you arrived.`;
  });

  /* ---------- terminal ---------- */
  const term = $('#term'), tOut = $('#termOut'), tIn = $('#termInput'), tForm = $('#termForm');
  const hist = [];
  let hIdx = 0, greeted = false;
  function print(html, cls = '') { tOut.insertAdjacentHTML('beforeend', `<div class="${cls}">${html}</div>`); tOut.scrollTop = tOut.scrollHeight; }
  function openTerm() {
    if (term.open) return;
    term.showModal(); root.classList.add('modal-open');
    if (!greeted) {
      greeted = true;
      print('<span class="o">aysh.khan</span> <span class="d">v4.0.0-beta · ' + new Date().toDateString() + '</span>');
      print('Type <span class="g">help</span> to see what I can do. Try <span class="g">feed 10</span>, <span class="g">neofetch</span> or <span class="g">open conscious</span>.\n');
    }
    setTimeout(() => tIn.focus(), 30);
  }
  term.addEventListener('close', () => root.classList.remove('modal-open'));
  term.addEventListener('click', e => { if (e.target === term) term.close(); else if (!e.target.closest('a, button')) tIn.focus(); });
  $('#termBtn').addEventListener('click', openTerm);
  $('#termClose').addEventListener('click', () => term.close());

  const goTo = id => { term.close(); setTimeout(() => $(id).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 60); };
  const CMDS = {
    help: () => [
      '<span class="b">about</span>        who I am           <span class="b">ls</span>            list projects',
      '<span class="b">open &lt;id&gt;</span>    open lab notes     <span class="b">now</span>           what I’m working on',
      '<span class="b">skills</span>       my toolbox         <span class="b">contact</span>       how to reach me',
      '<span class="b">neofetch</span>     system info        <span class="b">theme</span>         toggle light/dark',
      '<span class="b">feed [n]</span>     feed Adam          <span class="b">predator</span>      release a predator',
      '<span class="b">shelter</span>      build a shelter    <span class="b">reset</span>         reset Adam’s world',
      '<span class="b">github</span> · <span class="b">linkedin</span> · <span class="b">cv</span> · <span class="b">clear</span> · <span class="b">exit</span>',
      '<span class="d">psst: there’s a sudo command worth trying.</span>',
    ].join('\n'),
    about: () => 'Muhammad Aysh Khan. CS graduate (First Class, University of Hull), first trained as an engineer in Hong Kong.\nI build practical software for real people, and AI agents driven by hunger, fear and curiosity.',
    whoami: () => 'visitor (probably curious). The site owner is <span class="o">aysh</span>: run <span class="g">about</span>.',
    ls: () => S.projects.map(p => `<span class="b">${p.id.padEnd(12)}</span>${p.title}`).join('\n') + '\n<span class="d">open one with: open &lt;id&gt;</span>',
    projects: () => CMDS.ls(),
    open: a => { if (!a[0]) return 'usage: open &lt;id&gt;   (try: ls)'; const id = a[0].toLowerCase(); if (!byId[id]) return `<span class="e">no such project: ${esc(id)}</span>`; term.close(); setTimeout(() => openNotes(id), 80); return `opening ${id}…`; },
    now: () => S.now.map(p => `<span class="g">${p.pid}</span> ${p.proc.padEnd(18)} <span class="d">${p.status}</span>`).join('\n'),
    skills: () => S.skills.map(s => s.name).join(' · ') + '\n<span class="d">' + S.alsoSkills.join(' · ') + '</span>',
    contact: () => `email     <a href="mailto:${EMAIL}">${EMAIL}</a>\ngithub    <a href="${S.profile.github}" target="_blank" rel="noopener">${S.profile.github.replace('https://', '')}</a>\nlinkedin  <a href="${S.profile.linkedin}" target="_blank" rel="noopener">${S.profile.linkedin.replace('https://www.', '')}</a>`,
    email: () => CMDS.contact(),
    github: () => { window.open(S.profile.github, '_blank', 'noopener'); return 'opening GitHub…'; },
    linkedin: () => { window.open(S.profile.linkedin, '_blank', 'noopener'); return 'opening LinkedIn…'; },
    cv: () => `CV available on request: <a href="mailto:${EMAIL}?subject=CV%20request">${EMAIL}</a>`,
    neofetch: () => [
      '<span class="o">   ▄████▄    </span> <span class="g">visitor</span>@<span class="g">aysh.khan</span>',
      '<span class="o">  ██ ◕◕ ██   </span> ------------------',
      '<span class="o">  ████████   </span> <span class="b">OS</span>        Hull, UK (v4.0.0-beta)',
      '<span class="o">   ▀████▀    </span> <span class="b">Degree</span>    BSc CS, First Class',
      '              <span class="b">Kernel</span>    curiosity 0.97',
      '              <span class="b">Shell</span>     instinct-sh',
      '              <span class="b">Stack</span>     C#/.NET · Python · PyTorch · JS · SQL',
      '              <span class="b">Langs</span>     en · ur · hi · pa · fr',
      '              <span class="b">Uptime</span>    since 2021 (Hong Kong)',
      '              <span class="b">Status</span>    <span class="g">open to work</span>',
    ].join('\n'),
    feed: a => { const n = Math.min(40, Math.max(1, parseInt(a[0], 10) || 5)); window.Adam && window.Adam.feed(n); return `dropped ${n} seed${n > 1 ? 's' : ''}. scroll up to watch him eat.`; },
    predator: () => { window.Adam && window.Adam.predator(); return '<span class="e">a predator appeared.</span> Adam is not thrilled.'; },
    shelter: () => { window.Adam && window.Adam.shelter(); return 'built a shelter. predators can’t get in.'; },
    reset: () => { window.Adam && window.Adam.reset(); return 'Adam’s world has been reset.'; },
    stats: () => { const s = window.Adam ? window.Adam.stats : null; return s ? `eaten ${s.eaten} · hits ${s.hits} · explored ${s.coverage}% · in charge: ${s.winner}` : 'no stats'; },
    theme: a => { const want = a[0] || (isDark() ? 'light' : 'dark'); if (!['light', 'dark'].includes(want)) return 'usage: theme [light|dark]'; root.dataset.theme = want; try { localStorage.setItem('theme', want); } catch (e) {} document.dispatchEvent(new CustomEvent('themechange')); return `theme set to ${want}`; },
    hire: () => '<span class="e">permission denied.</span> try: <span class="g">sudo hire aysh</span>',
    sudo: a => {
      if (a.join(' ').toLowerCase().startsWith('hire')) { setTimeout(() => { goTo('#contact'); setTimeout(() => emailBtn.focus({ preventScroll: true }), 700); }, 900); return '[sudo] password for visitor: ********\n<span class="g">access granted.</span> opening a direct line to Aysh…'; }
      if (a[0] === 'rm') return 'nice try. Adam is hiding in a shelter.';
      return '<span class="e">visitor is not in the sudoers file.</span> this incident will be reported (to Adam).';
    },
    rm: () => 'nice try. Adam is hiding in a shelter.',
    echo: a => esc(a.join(' ')),
    date: () => new Date().toString(),
    clear: () => { tOut.innerHTML = ''; return null; },
    exit: () => { term.close(); return null; },
    party: () => { term.close(); setTimeout(() => { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); window.Adam && window.Adam.party(); }, 80); return '🎉'; },
  };
  tForm.addEventListener('submit', e => {
    e.preventDefault();
    const line = tIn.value.trim();
    tIn.value = '';
    print(`<span class="g">visitor@aysh:~$</span> ${esc(line)}`);
    if (!line) return;
    hist.push(line); hIdx = hist.length;
    const [cmd, ...args] = line.split(/\s+/);
    const fn = CMDS[cmd.toLowerCase()];
    const res = fn ? fn(args) : `<span class="e">command not found: ${esc(cmd)}</span>. type <span class="g">help</span>`;
    if (res != null) print(res + '\n');
  });
  tIn.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { if (hIdx > 0) { hIdx--; tIn.value = hist[hIdx]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (hIdx < hist.length - 1) { hIdx++; tIn.value = hist[hIdx]; } else { hIdx = hist.length; tIn.value = ''; } e.preventDefault(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = tIn.value.split(/\s+/);
      const pool = parts.length > 1 && parts[0] === 'open' ? Object.keys(byId) : Object.keys(CMDS);
      const cur = parts[parts.length - 1];
      const m = pool.filter(k => k.startsWith(cur));
      if (m.length === 1) { parts[parts.length - 1] = m[0]; tIn.value = parts.join(' ') + ' '; }
      else if (m.length > 1) print(m.join('  '), 'd');
    }
  });

  /* ---------- global keys + konami ---------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kPos = 0;
  window.addEventListener('keydown', e => {
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
    if (!typing && !document.querySelector('dialog[open]')) {
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openTerm(); return; }
    }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kPos = k === KONAMI[kPos] ? kPos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kPos === KONAMI.length) {
      kPos = 0;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(() => window.Adam && window.Adam.party(), 300);
      toast('↑↑↓↓←→←→BA · party mode unlocked');
    }
  });

  /* ---------- go ---------- */
  observeReveal();
  if (location.hash.startsWith('#notes/')) {
    const id = location.hash.slice(7);
    if (byId[id]) setTimeout(() => { $('#work').scrollIntoView(); openNotes(id); }, 200);
  }
  // friendly message for fellow developers
  try { console.log('%cHey, you opened the console. 👋\n%cType / on the page for a terminal, or say hi: ' + EMAIL, 'font:600 14px sans-serif', 'font:12px monospace'); } catch (e) {}
})();
