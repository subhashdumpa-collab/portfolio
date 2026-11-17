/* Demo suite: shared shell.
   Plain script, no dependencies, works from file:// and from any static host.

   A module page sets window.SUITE_MODULE before loading this file:

     window.SUITE_MODULE = {
       id: 'documents',            // one of the ids in MODULES below
       title: 'Documents',         // shown in the top bar
       intro: 'One line on what this tool is for.',
       tryIt: [ { title: 'Send a document for checking', steps: ['...', '...'] } ],
       themes: 'both',             // 'both' (default) or 'light' if the page has no dark styles
       shell: true                 // false = no menu or top bar (for a phone-sized page)
     };

   Everything is stored in this browser only, under keys starting "dsr-demo:". */
(function () {
  'use strict';

  var KEY = 'dsr-demo:';
  var DEFAULT_COMPANY = 'Your Company';
  var MAKER = 'Subhash';
  /* The one contact setting for the whole site. Empty: contact links go to the front page instead. */
  var CONTACT_EMAIL = 'subhashdumpa@gmail.com';
  /* Shown as written; the tel: link drops the spaces. */
  var CONTACT_PHONE = '07884 827712';

  var ACCENTS = [
    { id: 'teal', name: 'Teal', hex: '#0F766E' },
    { id: 'blue', name: 'Blue', hex: '#2563EB' },
    { id: 'green', name: 'Green', hex: '#15803D' },
    { id: 'purple', name: 'Purple', hex: '#6D28D9' },
    { id: 'red', name: 'Red', hex: '#B91C1C' },
    { id: 'orange', name: 'Orange', hex: '#C2410C' },
    { id: 'graphite', name: 'Graphite', hex: '#374151' }
  ];

  var ICONS = {
    dashboard: '<path d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z"/>',
    fleet: '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    documents: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4M9 12h6M9 16h6"/>',
    training: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c2 2 10 2 12 0v-4.5M22 9v6"/>',
    suppliers: '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-7h6v7M3 21h18"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
    admin: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>'
  };

  var MODULES = [
    { id: 'dashboard', title: 'Dashboard', href: 'dashboard.html', fixed: true },
    { id: 'fleet', title: 'Vehicle checks', href: 'fleet.html' },
    { id: 'documents', title: 'Document control', href: 'documents.html' },
    { id: 'training', title: 'Training matrix', href: 'training.html' },
    { id: 'suppliers', title: 'Supplier approval', href: 'suppliers.html' },
    { id: 'admin', title: 'Settings', href: 'admin.html', fixed: true }
  ];

  /* ---------- sample people and jobs, shared by every module ---------- */
  var PEOPLE = [
    { id: 'hw', name: 'Hannah Whitlock', role: 'Operations Manager', team: 'Office', access: 'Admin' },
    { id: 'dm', name: 'Daniel Mercer', role: 'Director', team: 'Office', access: 'Admin' },
    { id: 'mo', name: 'Marcus Oyelaran', role: 'Contracts Manager', team: 'Office', access: 'Manager' },
    { id: 'ek', name: 'Elena Kowalczyk', role: 'Senior Engineer', team: 'Design', access: 'Manager' },
    { id: 'ta', name: 'Tom Ashdown', role: 'Design Engineer', team: 'Design', access: 'Staff' },
    { id: 'pr', name: 'Priya Raman', role: 'Document Controller', team: 'Office', access: 'Staff' },
    { id: 'ak', name: 'Aisha Karim', role: 'Health and Safety Manager', team: 'Office', access: 'Manager' },
    { id: 'sm', name: 'Sofia Marchetti', role: 'Procurement Lead', team: 'Office', access: 'Staff' },
    { id: 'rf', name: 'Rob Fenwick', role: 'Fleet Coordinator', team: 'Yard', access: 'Manager' },
    { id: 'cb', name: 'Callum Byrne', role: 'Site Supervisor', team: 'Site Team A', access: 'Driver' },
    { id: 'jh', name: 'Jade Holloway', role: 'Site Operative', team: 'Site Team A', access: 'Driver' },
    { id: 'op', name: 'Owen Pritchard', role: 'Site Operative', team: 'Site Team B', access: 'Driver' }
  ];

  var JOBS = [
    { id: 'J-2401', name: 'Riverside Depot Refurbishment', client: 'Aldermoor Council' },
    { id: 'J-2407', name: 'Northgate Retail Park, Units 4 to 6', client: 'Kestrel Property Group' },
    { id: 'J-2412', name: 'Millbrook Primary School Extension', client: 'Tamar Education Trust' },
    { id: 'J-2415', name: 'Harbour Road Pumping Station', client: 'Westmere Water' },
    { id: 'J-2419', name: 'Ashby Logistics Hub Fit-out', client: 'Corvid Freight' }
  ];

  /* ---------- storage (never throws) ---------- */
  function read(k, fallback) {
    try {
      var v = window.localStorage.getItem(KEY + k);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }
  function write(k, v) {
    try { window.localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }
  function clear(keepSetup) {
    try {
      var keep = { company: 1, accent: 1, theme: 1, 'modules-off': 1 };
      var del = [];
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf(KEY) === 0 && !(keepSetup && keep[k.slice(KEY.length)])) del.push(k);
      }
      del.forEach(function (k) { window.localStorage.removeItem(k); });
    } catch (e) { /* ignore */ }
  }

  /* ---------- text helpers ---------- */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cleanName(s) {
    return String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  }
  function company() { return cleanName(read('company', '')) || DEFAULT_COMPANY; }
  function setCompany(name) { write('company', cleanName(name)); changed(); }
  function initials() {
    var words = company().replace(/[^A-Za-z0-9 ]/g, ' ').split(' ').filter(function (w) {
      return w && !/^(ltd|limited|plc|llp|and|the|of|co)$/i.test(w);
    });
    if (!words.length) return 'CO';
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.slice(0, 3).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }
  function slug() { return company().toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'company'; }
  function emailFor(p) {
    var parts = p.name.toLowerCase().split(' ');
    return parts[0] + '.' + parts[parts.length - 1] + '@' + slug() + '.example';
  }

  /* ---------- dates: always relative to today so the demo never goes stale ---------- */
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function daysFromNow(n) { var d = today(); d.setDate(d.getDate() + n); return d; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtDate(d) {
    if (!d) return '';
    if (!(d instanceof Date)) d = new Date(d);
    if (isNaN(d)) return '';
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function iso(d) {
    if (!(d instanceof Date)) d = new Date(d);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function daysUntil(d) {
    if (!(d instanceof Date)) d = new Date(d);
    return Math.round((d.getTime() - today().getTime()) / 86400000);
  }

  /* ---------- colour ---------- */
  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    var x = rgb(a), y = rgb(b);
    return '#' + [0, 1, 2].map(function (i) {
      var v = Math.round(x[i] + (y[i] - x[i]) * t).toString(16);
      return v.length < 2 ? '0' + v : v;
    }).join('');
  }
  function accent() {
    var id = read('accent', 'teal');
    for (var i = 0; i < ACCENTS.length; i++) if (ACCENTS[i].id === id) return ACCENTS[i];
    return ACCENTS[0];
  }
  function setAccent(id) { write('accent', id); changed(); }
  function theme() {
    if (M.themes === 'light') return 'light';
    return read('theme', 'light') === 'dark' ? 'dark' : 'light';
  }
  function setTheme(t) { write('theme', t === 'dark' ? 'dark' : 'light'); changed(); }

  function applyLook() {
    var root = document.documentElement, hex = accent().hex, dark = theme() === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.style.setProperty('--suite-accent', hex);
    root.style.setProperty('--suite-accent-strong', dark ? mix(hex, '#ffffff', 0.14) : mix(hex, '#000000', 0.16));
    root.style.setProperty('--suite-accent-ink', dark ? mix(hex, '#ffffff', 0.58) : mix(hex, '#000000', 0.12));
    root.style.setProperty('--suite-accent-tint', dark ? mix(hex, '#17171a', 0.80) : mix(hex, '#ffffff', 0.91));
    root.style.setProperty('--suite-accent-line', dark ? mix(hex, '#17171a', 0.55) : mix(hex, '#ffffff', 0.68));
    root.style.setProperty('--suite-on-accent', '#ffffff');
    setIcon(hex);
  }

  /* Browser tab icon in the chosen colour; also stops the browser asking for /favicon.ico. */
  function setIcon(hex) {
    if (!document.head) return;
    var link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="' + hex +
      '"/><path d="M9 9h6a7 7 0 0 1 0 14H9z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  /* ---------- modules on and off ---------- */
  function modulesOff() { var v = read('modules-off', []); return Array.isArray(v) ? v : []; }
  function moduleOn(id) { return modulesOff().indexOf(id) === -1; }
  function setModuleOn(id, on) {
    var off = modulesOff().filter(function (x) { return x !== id; });
    if (!on) off.push(id);
    write('modules-off', off);
    changed();
  }

  /* ---------- per-module saved state (optional) ---------- */
  function load(id, version) {
    var v = read('state:' + id, null);
    return v && v.v === version ? v.data : null;
  }
  function save(id, version, data) { write('state:' + id, { v: version, data: data }); }

  /* ---------- shell ---------- */
  var M = window.SUITE_MODULE || {};
  var listeners = [];
  function changed() {
    applyLook();
    fillTokens();
    if (document.getElementById('suite-rail')) drawRail();
    listeners.forEach(function (fn) { try { fn(); } catch (e) { /* module error must not break the shell */ } });
  }
  function onChange(fn) { listeners.push(fn); }

  function fillTokens(scope) {
    var root = scope || document;
    var map = { company: company(), initials: initials(), maker: MAKER };
    var els = root.querySelectorAll('[data-suite]');
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-suite');
      if (map.hasOwnProperty(k)) els[i].textContent = map[k];
    }
    var co = document.getElementById('suite-co');
    if (co) co.textContent = company();
    var badge = document.getElementById('suite-badge');
    if (badge) badge.textContent = initials();
  }

  function icon(id) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[id] || '') + '</svg>';
  }

  function drawRail() {
    var rail = document.getElementById('suite-rail');
    if (!rail) return;
    var html = '<a class="suite-badge" id="suite-badge" href="dashboard.html" title="Dashboard">' + esc(initials()) + '</a>';
    MODULES.forEach(function (m) {
      if (!m.fixed && !moduleOn(m.id)) return;
      html += '<a class="suite-nav' + (m.id === M.id ? ' on' : '') + '" href="' + m.href + '"' +
        (m.id === M.id ? ' aria-current="page"' : '') + '>' + icon(m.id) + '<span class="suite-nav-label">' + esc(m.title) + '</span></a>';
    });
    html += '<a class="suite-nav suite-maker" href="../index.html" title="Back to ' + esc(MAKER) + '\'s page">' + icon('home') + '<span class="suite-nav-label">Home</span></a>';
    rail.innerHTML = html;
  }

  /* Where "Want one like this?" goes: an email naming this tool, or the front page's contact section. */
  function contactHref() {
    if (!CONTACT_EMAIL) return '../index.html#contact';
    var what = M.title && M.id !== 'dashboard' && M.id !== 'admin' ? 'A system like the ' + M.title + ' demo' : 'A system like your demo';
    return 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(what);
  }

  function buildShell() {
    document.documentElement.classList.add('suite-on');

    var rail = document.createElement('nav');
    rail.id = 'suite-rail';
    rail.className = 'suite-rail';
    rail.setAttribute('aria-label', 'Tools');
    document.body.appendChild(rail);
    drawRail();

    var bar = document.createElement('header');
    bar.id = 'suite-bar';
    bar.className = 'suite-bar';
    bar.innerHTML =
      '<div class="suite-where"><b id="suite-co"></b><span class="suite-sep">/</span><span>' + esc(M.title || '') + '</span></div>' +
      '<div id="suite-slot" class="suite-slot"></div>' +
      '<span class="suite-grow"></span>' +
      '<span class="suite-pill" title="Nothing you do here is saved to a server or sent anywhere.">Interactive demo · sample data</span>' +
      (M.tryIt && M.tryIt.length ? '<button type="button" class="suite-btn" id="suite-try-btn">What to try</button>' : '') +
      (M.themes === 'light' ? '' : '<button type="button" class="suite-btn" id="suite-theme-btn" aria-label="Switch between light and dark">Dark</button>') +
      '<button type="button" class="suite-btn" id="suite-reset-btn">Reset<span class="suite-wide"> demo</span></button>' +
      '<a class="suite-btn suite-want" href="' + esc(contactHref()) + '">Want one like this?</a>' +
      '<a class="suite-built" href="../index.html">Built by <b>' + esc(MAKER) + '</b></a>';
    document.body.appendChild(bar);

    /* On a phone the bar is short of room: when a module has put a control in the slot
       (and has not hidden it), the company name gives way to it. */
    var slot = document.getElementById('suite-slot');
    var slotCheck = function () {
      var live = slot.children.length > 0 && window.getComputedStyle(slot).display !== 'none';
      bar.classList.toggle('suite-slot-live', live);
    };
    if (window.MutationObserver) new MutationObserver(slotCheck).observe(slot, { childList: true });
    window.addEventListener('resize', slotCheck);
    slotCheck();

    var themeBtn = document.getElementById('suite-theme-btn');
    if (themeBtn) {
      themeBtn.textContent = theme() === 'dark' ? 'Light' : 'Dark';
      themeBtn.addEventListener('click', function () {
        setTheme(theme() === 'dark' ? 'light' : 'dark');
        themeBtn.textContent = theme() === 'dark' ? 'Light' : 'Dark';
      });
    }
    document.getElementById('suite-reset-btn').addEventListener('click', function () {
      if (window.confirm('Put all the sample data back to how it started?\n\nYour company name and colour are kept.')) {
        clear(true);
        window.location.reload();
      }
    });

    if (M.tryIt && M.tryIt.length) buildTry();
    fillTokens();
  }

  function buildTry() {
    var panel = document.createElement('aside');
    panel.id = 'suite-try';
    panel.className = 'suite-try';
    panel.setAttribute('aria-label', 'What to try');
    panel.hidden = true;
    var html = '<div class="suite-try-head"><h2>What to try</h2><button type="button" class="suite-btn" id="suite-try-close" aria-label="Close">Close</button></div>';
    if (M.intro) html += '<p class="suite-try-intro">' + esc(M.intro) + '</p>';
    M.tryIt.forEach(function (t, i) {
      html += '<section><h3><span>' + (i + 1) + '</span>' + esc(t.title) + '</h3><ol>';
      (t.steps || []).forEach(function (s) { html += '<li>' + esc(s) + '</li>'; });
      html += '</ol></section>';
    });
    html += '<p class="suite-try-foot">The data here is made up, and nothing is saved to a server. Use <b>Reset demo</b> to start again.</p>';
    html += '<p class="suite-try-foot"><a href="' + esc(contactHref()) + '">Want one like this for your business? Get in touch.</a></p>';
    panel.innerHTML = html;
    document.body.appendChild(panel);
    function toggle(open) { panel.hidden = open === undefined ? !panel.hidden : !open; }
    document.getElementById('suite-try-btn').addEventListener('click', function () { toggle(); });
    document.getElementById('suite-try-close').addEventListener('click', function () { toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
    /* ?shot=1 is for taking the front page's screenshots without the panel in the way. */
    if (!read('tried:' + M.id, false) && !/[?&]shot=1/.test(window.location.search)) { write('tried:' + M.id, true); toggle(true); }
  }

  function buildBackChip() {
    var a = document.createElement('a');
    a.className = 'suite-back';
    a.href = 'dashboard.html';
    a.textContent = '‹ Back to the demo';
    document.body.appendChild(a);
  }

  function start() {
    /* The front page loads this file only for the shared settings (contact email, company name). */
    if (!window.SUITE_MODULE) return;
    applyLook();
    if (M.title) document.title = M.title + ' · ' + MAKER + ' demo';
    if (M.shell === false) { fillTokens(); if (!/[?&]embed=1/.test(window.location.search)) buildBackChip(); return; }
    buildShell();
  }

  window.Suite = {
    maker: MAKER,
    contactEmail: CONTACT_EMAIL,
    contactPhone: CONTACT_PHONE,
    defaultCompany: DEFAULT_COMPANY,
    accents: ACCENTS,
    modules: MODULES,
    people: PEOPLE,
    jobs: JOBS,
    person: function (id) { for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].id === id) return PEOPLE[i]; return null; },
    emailFor: emailFor,
    company: company, setCompany: setCompany, initials: initials, slug: slug,
    accent: accent, setAccent: setAccent,
    theme: theme, setTheme: setTheme,
    moduleOn: moduleOn, setModuleOn: setModuleOn,
    esc: esc,
    today: today, daysFromNow: daysFromNow, daysUntil: daysUntil, fmtDate: fmtDate, iso: iso,
    load: load, save: save,
    get: read, set: write,
    reset: function (keepSetup) { clear(keepSetup !== false); },
    onChange: onChange,
    fill: fillTokens,
    icon: icon
  };

  applyLook();
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
