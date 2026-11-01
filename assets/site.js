/* ==========================================================
   Shared behaviour for every page, plus the renderer for
   each page type (set by <body data-page="...">).
   ========================================================== */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const page = document.body.dataset.page;
  const EMAIL = `${S.profile.emailUser}@${S.profile.emailDomain}`;
  const byId = Object.fromEntries(S.projects.map(p => [p.id, p]));
  const catLabel = Object.fromEntries(S.categories.map(c => [c.id, c.label]));
  const slug = s => s.replace(/\s+/g, '-');

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastT = 0;
  function toast(t) {
    if (!toastEl) return;
    toastEl.textContent = t; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------- theme ---------- */
  $('#themeBtn')?.addEventListener('click', () => {
    const dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    document.dispatchEvent(new Event('themechange'));
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = $('#menuBtn'), mobileNav = $('#mobileNav');
  function setMenu(open) {
    if (!menuBtn) return;
    menuBtn.setAttribute('aria-expanded', open);
    mobileNav.hidden = !open;
  }
  menuBtn?.addEventListener('click', () => setMenu(mobileNav.hidden));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => { if (mobileNav && !mobileNav.hidden && !e.target.closest('#mobileNav, #menuBtn')) setMenu(false); });

  /* ---------- email links (assembled here to deter scrapers) ---------- */
  $$('[data-email]').forEach(a => {
    a.href = `mailto:${EMAIL}`;
    if (a.dataset.email === 'text') a.textContent = EMAIL;
  });
  $$('[data-copy-email]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(EMAIL); toast('Email address copied'); }
    catch (e) { toast(EMAIL); }
  }));
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- helpers ---------- */
  const tags = (list, max = 99) => `<ul class="tags">${list.slice(0, max).map(t => `<li>${t}</li>`).join('')}</ul>`;
  const badge = s => `<span class="badge ${slug(s)}">${s}</span>`;
  function card(p) {
    return `<a class="card" href="project.html?p=${p.id}" data-cats="${p.cats.join(' ')}">
      <div class="card-meta"><span>${p.year}</span>${badge(p.status)}</div>
      <h3>${p.title}</h3>
      <p>${p.summary}</p>
      ${p.metric ? `<div class="metric"><b>${p.metric.value}</b><span>${p.metric.label}</span></div>` : ''}
      ${tags(p.tags, 4)}
      <span class="more">Read more</span>
    </a>`;
  }

  /* ---------- home ---------- */
  if (page === 'home') {
    const grid = $('#featured');
    grid.innerHTML = S.home.featured.map(id => byId[id]).filter(Boolean).map(card).join('');
    $('#projectCount').textContent = S.projects.length;
    $('#nowList').innerHTML = S.now.filter(n => n.pid !== '0006').slice(0, 4).map(n => `
      <li><div><h3>${n.label}</h3><span class="tag">${n.status}</span></div><p>${n.text}</p></li>`).join('');
  }

  /* ---------- projects ---------- */
  if (page === 'projects') {
    const grid = $('#allProjects');
    grid.innerHTML = S.projects.map(card).join('');
    const filters = $('#filters');
    filters.innerHTML = S.categories.map((c, i) => `<button class="chip-btn" type="button" aria-pressed="${i === 0}" data-cat="${c.id}">${c.label}</button>`).join('');
    filters.addEventListener('click', e => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      $$('[data-cat]', filters).forEach(x => x.setAttribute('aria-pressed', x === b));
      const cat = b.dataset.cat;
      $$('.card', grid).forEach(c => { c.hidden = !(cat === 'all' || c.dataset.cats.split(' ').includes(cat)); });
    });
  }

  /* ---------- single project ---------- */
  if (page === 'project') {
    const id = new URLSearchParams(location.search).get('p');
    const i = S.projects.findIndex(p => p.id === id);
    const mount = $('#project');
    if (i < 0) {
      mount.innerHTML = `<div class="page-head"><h1 class="page-title">Project not found</h1><p class="page-lede">That link may be out of date. <a href="projects.html">See all projects</a>.</p></div>`;
      return;
    }
    const p = S.projects[i];
    document.title = `${p.title} · Aysh Khan`;
    const list = items => items && items.length ? `<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>` : '';
    const sec = (t, inner, cls = '') => inner ? `<section class="p-sec ${cls}"><h2>${t}</h2>${inner}</section>` : '';
    const links = (p.links || []).map(l => `<a class="btn btn-sm" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join('');
    const prev = S.projects[(i - 1 + S.projects.length) % S.projects.length];
    const next = S.projects[(i + 1) % S.projects.length];
    mount.innerHTML = `
      <header class="page-head project-head">
        <p class="crumbs"><a href="projects.html">Projects</a> <span aria-hidden="true">/</span> ${p.title}</p>
        <div class="card-meta"><span>${p.year}</span>${badge(p.status)}<span>${p.cats.map(c => catLabel[c]).join(', ')}</span></div>
        <h1 class="page-title" style="margin-top:10px">${p.title}</h1>
        <p class="page-lede">${p.summary}</p>
        ${tags(p.tags)}
        <div class="project-links">${links}${p.privateNote ? `<span class="note">${p.privateNote}</span>` : ''}</div>
      </header>
      <div class="p-body">
        ${sec('The problem', p.problem ? `<p>${p.problem}</p>` : '')}
        ${sec('What I built', list(p.built))}
        <div class="p-demo" id="demo"></div>
        ${sec('What happened', list(p.results))}
        ${sec('What I learned', p.learned ? `<div class="learned"><p>${p.learned}</p></div>` : '')}
      </div>
      <nav class="p-nav" aria-label="More projects">
        <a href="project.html?p=${prev.id}"><small>Previous</small><span>${prev.title}</span></a>
        <a class="next" href="project.html?p=${next.id}"><small>Next</small><span>${next.title}</span></a>
      </nav>`;
    if (p.widget && window.Widgets) window.Widgets.mount(p, $('#demo'));
  }

  /* ---------- about ---------- */
  if (page === 'about') {
    $('#experience').innerHTML = S.experience.map(e => `
      <li><div class="when"><span>${e.dates}</span><span>${e.place}${e.type ? ` · ${e.type}` : ''}</span></div>
      <div><h3>${e.role}</h3><p class="org">${e.org}</p><ul>${e.points.map(x => `<li>${x}</li>`).join('')}</ul></div></li>`).join('');
    $('#education').innerHTML = S.education.map(e => `
      <li><div class="when"><span>${e.dates}</span></div>
      <div><h3>${e.school}</h3><p class="org">${e.award}</p><p class="org" style="margin:0">${e.note}</p></div></li>`).join('');
    $('#skills').innerHTML = S.skillGroups.map(g => `<section><h3>${g.name}</h3>${tags(g.items)}</section>`).join('');
    $('#awards').innerHTML = S.awards.map(a => `<li>${a}</li>`).join('');
    $('#languages').innerHTML = S.languages.map(a => `<li>${a}</li>`).join('');
  }
})();
