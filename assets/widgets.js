/* ==========================================================
   Interactive demos shown on project pages.
   Exposes window.Widgets.mount(project, element).
   ========================================================== */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      ['Self model', 'drives · position', 'What it knows about itself: six drives, its position, last action, how much it has explored and, from V7, the remembered direction of food and safety.'],
      ['World model', 'RSSM · GRU 256', 'A recurrent state space model (GRU 256 with a 32 dim stochastic latent) that learns to predict what happens next. Its prediction error doubles as a curiosity signal.'],
      ['Episodic memory', '3,000 moments', 'Up to 3,000 past moments, recalled by cosine similarity (k = 5) and tagged with valence: how good or bad they felt. Saved with every checkpoint.'],
      ['Global workspace', '8 streams → 1', 'Eight 64 dim streams (senses, world model, memory, self and four instincts) compete through Transformer attention. The winner is broadcast to everything else: the agent’s spotlight of attention.'],
      ['4 instinct Q nets', 'dueling DQNs', 'Hunger, survival, exploration and energy each have their own dueling DQN, all reading the same broadcast.'],
      ['Arbitration', '→ action', 'Maslow style urgency weights decide which instinct drives the action, with a crisis override when danger is close. Output: move N, S, E, W or rest.'],
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
      <p class="chart-note" style="margin:0">The same idea my API uses: a one time AES key encrypts the message, RSA 2048 protects that key, and a digital signature proves who sent it. Real cryptography in your browser, nothing faked.</p>
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
      out.innerHTML = row('status', 'generating two RSA 2048 key pairs…');
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
        out.innerHTML = row('sha 256 of message', hex(hash, 32)) + row('aes key, rsa encrypted', hex(wrapped)) + row('iv', hex(iv)) + row('ciphertext', hex(ct)) + row('signature', hex(sig));
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
        row('signature check', ok ? '✓ valid, sent by the key holder' : '✕ invalid, message was changed', (ok ? 'ok' : 'bad') + ' result') +
        row('decrypted', text != null ? text : '✕ rejected, AES GCM authentication failed', (text != null ? 'ok' : 'bad') + ' result'));
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
      ['', '[1] Update progress & wellbeing  [2] Book a meeting  [3] Meeting history'],
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
    const items = [['Puncture repair', 10], ['Brake tune up', 15], ['Gear adjustment', 15], ['Wheel true', 18], ['Full service', 55]];
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
      ['82.64%', 'Monolithic CNN', 'One network guesses all three digits at once: a 1,000 way classification.', 82.64],
      ['94.28%', 'Split the image', 'Cut each image into three digits and read them one at a time.', 94.28],
      ['99.10%', 'Multi task CNN', 'One shared backbone with three heads, one per digit position.', 99.1],
    ];
    const w = el(`<div class="widget"><div class="widget-title"><span>Full sequence test accuracy · <b>three steps</b></span></div>
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
          { label: 'V2', sub: 'baseline' }, { label: 'V3', sub: 'LSTM Q nets' }, { label: 'V4', sub: 'checkpoint bug' },
          { label: 'V5', sub: 'feed forward, 16× faster' }, { label: 'V6', sub: 'more food, tuned curiosity' }, { label: 'V7', sub: 'spatial food memory' },
        ], [
          { label: 'Reward', vals: [181, -4500, null, 205.6, 249.3, 248.0], fails: [0, 1, 1, 0, 0, 0], failText: [0, 'minus 4,500', 'broken'], fmt: v => '+' + v.toFixed(0), note: '<b>V3</b>’s LSTM Q networks hit a backprop through time bottleneck and <b>V4</b> had a checkpoint bug. Both are why V5 onwards use feed forward nets and evaluation based checkpoints.' },
          { label: 'Food / ep', vals: [0.82, 0.84, null, 0.36, 0.50, 0.52], fails: [0, 1, 1, 0, 0, 0], failText: [0, '0.84', 'broken'], fmt: v => v.toFixed(2), note: 'Food per episode is the gap I’m still closing. V2 ate more but took more risks. Next: danger aware routing and prioritised replay.' },
          { label: 'Danger hits', lower: true, vals: [5.48, 183.8, null, 4.26, 6.12, 5.44], fails: [0, 1, 1, 0, 0, 0], failText: [0, '183.8', 'broken'], fmt: v => v.toFixed(2), note: 'Lower is better. <b>V7</b> took fewer hits than the V2 baseline (5.44 vs 5.48) while earning 37% more reward.' },
        ]));
        break;
      case 'adam': {
        add(barChart('State space for the hunger agent', [
          { label: 'Absolute encoding', sub: '(x, y) of everything' }, { label: 'Relative encoding', sub: 'directions to things' },
        ], [{ label: 'keys', vals: [4474, 392], lower: true, fmt: v => v.toLocaleString(), note: 'Describing the world relative to the agent (“food is up and left”) instead of absolute coordinates made the Q table <b>11× smaller</b>, so it could actually converge within the training budget.' }]));
        add(el('<div class="widget"><div class="widget-title"><span>Want to see Q learning happen?</span></div><p class="chart-note" style="margin:0 0 12px">There is a live, editable Q learning lab on the Lab page.</p><a class="btn btn-sm btn-primary" href="lab.html#qlab">Open the Q Lab</a></div>'));
        break;
      }
      case 'crypto': add(cryptoWidget()); break;
      case 'nlp':
        add(barChart('Test results on LIAR (binary)', [
          { label: 'Majority class', sub: 'always says “false”' }, { label: 'TF IDF + Naive Bayes' }, { label: 'TF IDF + Logistic Reg.' },
          { label: 'Frozen DistilBERT + LR', sub: 'ablation' }, { label: 'Fine tuned DistilBERT' },
        ], [
          { label: 'Macro F1', vals: [0.3908, 0.5757, 0.5521, 0.4719, 0.6180], max: 0.7, fmt: v => v.toFixed(3), note: 'Macro F1 weighs true and false statements equally. Fine tuned DistilBERT wins clearly, and frozen embeddings don’t, so the gain comes from fine tuning itself.' },
          { label: 'Accuracy', vals: [0.6415, 0.6438, 0.6594, 0.6087, 0.6493], max: 0.7, fmt: v => (v * 100).toFixed(1) + '%', note: 'The accuracy trap: always answering “false” scores <b>64.2%</b>, almost the same as DistilBERT. That’s why macro F1 was my main metric.' },
        ]));
        break;
      case 'mnist': add(stepsWidget()); break;
      case 'codegen':
        add(barChart('CodeT5+ on 6 pseudocode tasks', [
          { label: 'Baseline' }, { label: 'Explicit constraints' }, { label: 'Role prompting' }, { label: 'Few shot (1 example)' }, { label: 'Step by step' }, { label: 'LoRA fine tuned', sub: '24 examples, 21 s' },
        ], [
          { label: 'Syntax valid', vals: [66.7, 100, 66.7, 0, 50, null], max: 100, fmt: v => v.toFixed(0) + '%', note: 'Telling the model exactly what to avoid (Python 2 prints, prompt text in <code>input()</code>) fixed every syntax failure.' },
          { label: 'Pass@1', vals: [33.3, 33.3, 33.3, 0, 33.3, 16.7], max: 100, fmt: v => v.toFixed(1) + '%', note: 'Correctness is harder than syntax. No prompt beat 2/6, and LoRA on 24 examples dropped to 1/6. A small model needs more data, not cleverer prompts.' },
        ]));
        break;
      case 'terminal': add(replayWidget()); break;
      case 'coop': add(estimatorWidget()); break;
    }
  }

  window.Widgets = { mount: mountWidget };
})();
