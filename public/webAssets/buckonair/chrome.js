/* 巴克在播报 — shared ad / popup / clutter chrome for every page.
   Decorative only. NO wall-clock: no Date, Date.now, performance.now, new Date — just
   setInterval/setTimeout delays and plain counters. Loaded from /webAssets/buckonair/chrome.js. */
(function () {
  'use strict';

  /* ---------- email-capture popup (HOMEPAGE ONLY, once per session) ---------- */
  (function () {
    // Only the homepage carries the popup markup AND sets data-home="1" on <body>.
    // Episode/merch pages ship neither, so this never fires there.
    if (document.body.dataset.home !== '1') return;
    const overlay = document.getElementById('emailPopup');
    if (!overlay) return;

    const KEY = 'buck_pop_seen';
    function seen() {
      // sessionStorage can throw on opaque origins (sandboxed iframe). Degrade gracefully.
      try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
    }
    function mark() {
      try { sessionStorage.setItem(KEY, '1'); } catch { /* no-op */ }
    }

    function close() { overlay.classList.remove('show'); }

    overlay.querySelectorAll('[data-pop-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    // click-outside the card dismisses
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    // Auto-show once per session, shortly after load. Handlers above stay
    // wired regardless so [data-open-popup] re-opens keep working.
    if (!seen()) {
      setTimeout(function () {
        overlay.classList.add('show');
        mark();
      }, 900);
    }

    // Mailing-list easter egg. Submitting always shows the in-page "谢谢订阅" no-op;
    // the server (buckonair.subscribe command) decides whether the address earns the
    // payout — only the player's own in-game address (me@manifold.institute) makes
    // Buck's promo newsletter actually arrive in the mail app. The check lives
    // server-side, so nothing here tells the two apart.
    function showThanks() {
      const body = document.getElementById('popBody');
      const thanks = document.getElementById('popThanks');
      if (body) body.hidden = true;
      if (thanks) thanks.hidden = false;
    }
    const form = document.getElementById('popForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = form.querySelector('input[type=email]');
        const email = input && input.value ? input.value : '';
        const arcade = window.arcade;
        if (arcade && typeof arcade.invoke === 'function') {
          try { arcade.invoke('buckonair.subscribe', { email: email }); } catch { /* no-op */ }
        }
        showThanks();
      });
    }
  })();

  /* ---------- in-lore notice modal ----------
     Any element with data-notice="…" shows a themed dialog with that text on
     click, instead of dead-linking. Overlay markup is created lazily once. */
  (function () {
    let overlay = null;
    function ensure() {
      if (overlay) return overlay;
      overlay = document.createElement('div');
      overlay.className = 'notice-overlay';
      overlay.innerHTML =
        '<div class="notice-card"><p></p><button class="btn btn-red" type="button">知道了</button></div>';
      document.body.append(overlay);
      function close() { overlay.classList.remove('show'); }
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      overlay.querySelector('button').addEventListener('click', close);
      return overlay;
    }
    document.querySelectorAll('[data-notice]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        const o = ensure();
        o.querySelector('.notice-card p').textContent = el.getAttribute('data-notice');
        o.classList.add('show');
      });
    });
  })();

  /* ---------- explicit popup openers (newsletter section button) ---------- */
  document.querySelectorAll('[data-open-popup]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      const overlay = document.getElementById('emailPopup');
      if (overlay) overlay.classList.add('show');
    });
  });

  /* ---------- comment 赞 links — bump once, purely decorative ---------- */
  document.querySelectorAll('[data-like]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (el.classList.contains('liked')) return;
      const n = Number.parseInt(el.textContent.replaceAll(/\D/g, ''), 10);
      if (Number.isFinite(n)) el.textContent = '赞 ' + (n + 1);
      el.classList.add('liked');
    });
  });

  /* ---------- social-proof toaster (looping, no clock) ---------- */
  (function () {
    const el = document.getElementById('toaster');
    if (!el) return;
    const textEl = el.querySelector('.toast-text');
    const msgs = [
      '刚刚 <b>有人捐助了 $100</b>，巴克又能多播一天',
      '<b>37 人</b>正在收听巴克',
      '<b>「已经醒了」</b> 抢到了买一送一最后一组',
      '刚刚 <b>有人入了巴克 VIP</b>，已经抢先听第 3 期',
      '<b>112 人</b>这一小时订阅了真相简报',
      '刚刚 <b>有人捐助了 $250</b>，留言：封到第八次也跟着你'
    ];
    let i = 0;
    function showNext() {
      textEl.innerHTML = msgs[i % msgs.length];
      i++;
      el.classList.add('show');
      setTimeout(function () { el.classList.remove('show'); }, 4200);
    }
    setTimeout(showNext, 2600);
    setInterval(showNext, 7000);
  })();

  /* ---------- donate / support preset tiles — decorative selection only ---------- */
  document.querySelectorAll('.amount-row, .donate-tiles').forEach(function (row) {
    const tileSel = row.classList.contains('donate-tiles') ? '.donate-tile' : '.amount-tile';
    row.querySelectorAll(tileSel).forEach(function (tile) {
      tile.addEventListener('click', function () {
        row.querySelectorAll(tileSel).forEach(function (t) { t.classList.remove('on'); });
        tile.classList.add('on');
      });
    });
  });

  /* ---------- decorative store countdown — counts down, loops; NO wall-clock ---------- */
  (function () {
    const h = document.getElementById('t-h');
    const m = document.getElementById('t-m');
    const s = document.getElementById('t-s');
    if (!h || !m || !s) return; // only the store page carries the timer
    let total = 2 * 3600; // 02:00:00 starting point, purely cosmetic
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function tick() {
      const hh = Math.floor(total / 3600);
      const mm = Math.floor((total % 3600) / 60);
      const ss = total % 60;
      h.textContent = pad(hh);
      m.textContent = pad(mm);
      s.textContent = pad(ss);
      total = total > 0 ? total - 1 : 2 * 3600; // loop back to top ("促销延长")
    }
    tick();
    setInterval(tick, 1000);
  })();
})();
