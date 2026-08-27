/* 巴克在播报 — themed streaming podcast player.
   Enhances every <div class="podcast-player" data-src="…" data-title="…"></div> into a real
   player UI. The AUDIO ENGINE lives in the HOST (noriOS routes it through the OS SFX track so
   episodes obey the player's volume/mute settings — an in-iframe <audio> can't): transport goes
   out as client-handled `podcast.*` commands via window.arcade.invoke, and playback state comes
   back through window.arcade.podcast.subscribe. One episode plays at a time, globally — starting
   one pauses any other, including across pages. Vanilla JS, no library, no wall-clock date API —
   all timing reads come from the host engine's pushed state. */
(function () {
  'use strict';

  const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const PAUSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  const BACK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg>';
  const FWD_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1l5 5-5 5V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z"/></svg>';
  const SPEEDS = [1, 1.25, 1.5, 2, 3];

  function fmt(t) {
    if (!Number.isFinite(t) || t < 0) t = 0;
    const total = Math.floor(t);
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    return (mm < 10 ? '0' + mm : '' + mm) + ':' + (ss < 10 ? '0' + ss : '' + ss);
  }

  function invoke(command, payload) {
    if (!window.arcade || typeof window.arcade.invoke !== 'function') return;
    window.arcade.invoke(command, payload).then(function (result) {
      // Surface transport failures — a swallowed {ok:false} reads as a
      // dead play button with no trace.
      if (!result || result.ok !== true) {
        console.warn('[podcast-player] ' + command + ' failed', result);
      }
    });
  }

  function build(root) {
    if (root.dataset.ppReady === '1') return;
    root.dataset.ppReady = '1';

    const src = root.getAttribute('data-src') || '';
    const title = root.getAttribute('data-title') || '本期音频';
    const foot = root.getAttribute('data-foot') || '';

    root.innerHTML =
      '<div class="pp-head">' +
        '<span class="pp-onair">本期音频</span>' +
        '<p class="pp-title"></p>' +
      '</div>' +
      '<div class="pp-row">' +
        '<button class="pp-play" type="button" aria-label="播放">' + PLAY_SVG + '</button>' +
        '<div class="pp-mid">' +
          '<div class="pp-bar" role="slider" tabindex="0" aria-label="进度">' +
            '<div class="pp-buffer"></div>' +
            '<div class="pp-fill"></div>' +
            '<div class="pp-knob"></div>' +
          '</div>' +
          '<div class="pp-times"><span class="pp-cur">00:00</span><span class="pp-dur">--:--</span></div>' +
        '</div>' +
        '<div class="pp-ctrls">' +
          '<button class="pp-btn pp-back" type="button" aria-label="后退 15 秒">' + BACK_SVG + '<span>15</span></button>' +
          '<button class="pp-btn pp-fwd" type="button" aria-label="前进 15 秒">' + FWD_SVG + '<span>15</span></button>' +
          '<button class="pp-btn pp-speed" type="button" aria-label="播放速度">1x</button>' +
        '</div>' +
      '</div>' +
      (foot ? '<div class="pp-foot"></div>' : '');

    root.querySelector('.pp-title').textContent = title;
    if (foot) root.querySelector('.pp-foot').textContent = foot;

    const playBtn = root.querySelector('.pp-play');
    const bar = root.querySelector('.pp-bar');
    const buffer = root.querySelector('.pp-buffer');
    const fill = root.querySelector('.pp-fill');
    const knob = root.querySelector('.pp-knob');
    const curEl = root.querySelector('.pp-cur');
    const durEl = root.querySelector('.pp-dur');
    const backBtn = root.querySelector('.pp-back');
    const fwdBtn = root.querySelector('.pp-fwd');
    const speedBtn = root.querySelector('.pp-speed');
    let speedIdx = 0;
    let dragging = false;

    // Local mirror of THIS episode's playback, fed by host pushes while the
    // engine holds our src. When the engine moves on to another episode it
    // forgets our position, so the mirror keeps it — hitting play again
    // resumes from here via `at`.
    const mirror = { loaded: false, paused: true, currentTime: 0, duration: null, buffered: 0 };

    function paintProgress(ratio) {
      const pct = Math.max(0, Math.min(1, ratio)) * 100;
      fill.style.width = pct + '%';
      knob.style.left = pct + '%';
    }

    function refresh() {
      const d = mirror.duration;
      durEl.textContent = d ? fmt(d) : '--:--';
      if (d && d > 0) {
        if (!dragging) paintProgress(mirror.currentTime / d);
        buffer.style.width = Math.max(0, Math.min(1, mirror.buffered / d)) * 100 + '%';
      } else if (!dragging) {
        paintProgress(0);
        buffer.style.width = '0%';
      }
      curEl.textContent = fmt(mirror.currentTime);
    }

    function setPlayIcon() {
      playBtn.innerHTML = mirror.paused ? PLAY_SVG : PAUSE_SVG;
      playBtn.setAttribute('aria-label', mirror.paused ? '播放' : '暂停');
    }

    function applyHostState(state) {
      if (state && state.src === src) {
        mirror.loaded = true;
        mirror.paused = state.paused;
        mirror.currentTime = state.currentTime;
        mirror.duration = state.duration;
        mirror.buffered = state.buffered;
        // Track the engine's rate so the label survives a page reload.
        const idx = SPEEDS.indexOf(state.rate);
        if (idx >= 0 && idx !== speedIdx) {
          speedIdx = idx;
          speedBtn.textContent = SPEEDS[speedIdx] + 'x';
        }
      } else {
        // Engine idle or holding another episode: we're paused at the last
        // position we saw (buffer bar no longer meaningful).
        mirror.loaded = false;
        mirror.paused = true;
        mirror.buffered = 0;
      }
      setPlayIcon();
      refresh();
    }

    if (window.arcade && window.arcade.podcast) {
      window.arcade.podcast.subscribe(applyHostState);
    }

    // ---- seeking from a pointer position over the bar ----
    function ratioFromEvent(e) {
      const rect = bar.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return rect.width > 0 ? x / rect.width : 0;
    }
    function seekTo(ratio) {
      const d = mirror.duration;
      if (d && d > 0) {
        ratio = Math.max(0, Math.min(1, ratio));
        const to = ratio * d;
        mirror.currentTime = to;
        paintProgress(ratio);
        curEl.textContent = fmt(to);
        if (mirror.loaded) invoke('podcast.seek', { src: src, to: to });
      }
    }
    function onMove(e) {
      if (!dragging) return;
      const r = ratioFromEvent(e);
      paintProgress(r);
      e.preventDefault();
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      seekTo(ratioFromEvent(e));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    }
    function onDown(e) {
      dragging = true;
      const r = ratioFromEvent(e);
      paintProgress(r);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
      e.preventDefault();
    }
    bar.addEventListener('mousedown', onDown);
    bar.addEventListener('touchstart', onDown, { passive: false });

    // keyboard seek on the bar
    bar.addEventListener('keydown', function (e) {
      const d = mirror.duration;
      if (!d || d <= 0) return;
      if (e.key === 'ArrowRight') { seekTo(Math.min(d, mirror.currentTime + 5) / d); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { seekTo(Math.max(0, mirror.currentTime - 5) / d); e.preventDefault(); }
    });

    // ---- transport (host engine is single: playing here pauses any other) ----
    playBtn.addEventListener('click', function () {
      if (mirror.paused) {
        // If the engine still holds our src, resume in place; otherwise reload
        // it at the mirrored position.
        const payload = mirror.loaded
          ? { src: src }
          : { src: src, at: mirror.currentTime };
        invoke('podcast.play', payload);
      } else {
        invoke('podcast.pause', { src: src });
      }
    });
    function seekBy(delta) {
      const d = mirror.duration;
      const max = d && d > 0 ? d : Number.POSITIVE_INFINITY;
      const to = Math.max(0, Math.min(max, mirror.currentTime + delta));
      mirror.currentTime = to;
      refresh();
      if (mirror.loaded) invoke('podcast.seek', { src: src, to: to });
    }
    backBtn.addEventListener('click', function () { seekBy(-15); });
    fwdBtn.addEventListener('click', function () { seekBy(15); });
    speedBtn.addEventListener('click', function () {
      speedIdx = (speedIdx + 1) % SPEEDS.length;
      speedBtn.textContent = SPEEDS[speedIdx] + 'x';
      if (mirror.loaded) invoke('podcast.rate', { src: src, rate: SPEEDS[speedIdx] });
    });

    setPlayIcon();
    refresh();
  }

  function init() {
    document.querySelectorAll('.podcast-player').forEach(build);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
