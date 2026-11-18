/* The Currency Desk v2: split-flap displays, synthesized sound, number tweens. No dependencies. */
(function (root) {
  'use strict';
  const RM = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const reduced = () => RM.matches || document.documentElement.classList.contains('calm');

  // ---------------- sound (off by default; Web Audio only, no files) ----------------
  let ctx = null, on = false, lastFlap = 0;
  function ac() { if (!ctx) { const A = root.AudioContext || root.webkitAudioContext; if (!A) return null; ctx = new A(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function noise(dur) { const a = ac(), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); return b; }
  function tone(freq, dur, type, gain, when) { const a = ac(); if (!a) return; const t = a.currentTime + (when || 0), o = a.createOscillator(), g = a.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || 0.15, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02); }
  function burst(dur, freq, q, gain, when) { const a = ac(); if (!a) return; const t = a.currentTime + (when || 0), s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = noise(dur); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain; s.connect(f).connect(g).connect(a.destination); s.start(t); }
  const sfx = {
    get on() { return on; }, set on(v) { on = !!v; if (on) ac(); },
    flap() { if (!on) return; const n = performance.now(); if (n - lastFlap < 28) return; lastFlap = n; burst(0.035, 2400 + Math.random() * 1600, 1.4, 0.5); },
    coin() { if (!on) return; tone(1975, 0.25, 'sine', 0.09); tone(2637, 0.35, 'sine', 0.07, 0.06); },
    note() { if (!on) return; burst(0.09, 900, 0.7, 0.35); },
    ok() { if (!on) return; tone(784, 0.18, 'triangle', 0.12); tone(1175, 0.3, 'triangle', 0.1, 0.09); },
    nope() { if (!on) return; tone(220, 0.18, 'triangle', 0.08); },
    thud() { if (!on) return; const a = ac(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.4); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.6); burst(0.2, 300, 0.8, 0.4); },
    whoosh() { if (!on) return; const a = ac(); if (!a) return; const t = a.currentTime, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); const n = Math.floor(a.sampleRate * 2.2), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n); s.buffer = b; f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1800, t + 1.1); f.frequency.exponentialRampToValueAtTime(250, t + 2.2); g.gain.value = 0.25; s.connect(f).connect(g).connect(a.destination); s.start(t); },
    tick() { if (!on) return; tone(1400, 0.04, 'square', 0.03); },
  };

  // ---------------- split-flap ----------------
  const ALPHA = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-/¥$%+';
  function cellHTML(ch) { const c = ch === ' ' ? '&nbsp;' : ch; return `<span class="fl-t"><b>${c}</b></span><span class="fl-b"><b>${c}</b></span>`; }
  // Flap(el, width): el becomes a row of `width` cells. set(text, {instant, stagger}) flips each cell through the alphabet.
  function Flap(el, width, opts) {
    opts = opts || {};
    el.classList.add('flap'); el.innerHTML = ''; el.setAttribute('role', 'img');
    const cells = [], cur = [];
    for (let i = 0; i < width; i++) { const s = document.createElement('span'); s.className = 'fl-cell'; s.innerHTML = cellHTML(' '); s.setAttribute('aria-hidden', 'true'); el.appendChild(s); cells.push(s); cur.push(' '); }
    let token = 0;
    function face(cell, ch) { cell.innerHTML = cellHTML(ch); }
    function flipOnce(cell, from, to, dur) {
      return new Promise((res) => {
        const f = from === ' ' ? '&nbsp;' : from, t = to === ' ' ? '&nbsp;' : to;
        cell.innerHTML = `<span class="fl-t"><b>${t}</b></span><span class="fl-b"><b>${f}</b></span><span class="fl-ft"><b>${f}</b></span><span class="fl-fb"><b>${t}</b></span>`;
        const ft = cell.querySelector('.fl-ft'), fb = cell.querySelector('.fl-fb');
        ft.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: dur / 2, easing: 'ease-in', fill: 'forwards' });
        const a = fb.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: dur / 2, delay: dur / 2, easing: 'ease-out', fill: 'forwards' });
        sfx.flap();
        a.onfinish = () => { face(cell, to); res(); };
      });
    }
    async function run(i, target, my, opt) {
      const steps = [];
      const a = ALPHA.indexOf(cur[i]), b = ALPHA.indexOf(target);
      if (a >= 0 && b >= 0) { let k = a; while (k !== b) { k = (k + 1) % ALPHA.length; steps.push(ALPHA[k]); } }
      else if (cur[i] !== target) steps.push(ALPHA[1 + Math.floor(Math.random() * 26)], ALPHA[27 + Math.floor(Math.random() * 10)], target);
      const seq = steps.length > (opt.maxSteps || 7) ? steps.slice(steps.length - (opt.maxSteps || 7)) : steps;
      await new Promise((r) => setTimeout(r, i * (opt.stagger == null ? 38 : opt.stagger)));
      for (const ch of seq) { if (my !== token) return; await flipOnce(cells[i], cur[i], ch, opt.speed || 90); cur[i] = ch; }
    }
    function set(text, o) {
      o = o || {}; const t = String(text).toUpperCase().padEnd(width, ' ').slice(0, width);
      el.setAttribute('aria-label', o.label || String(text).trim());
      token++; const my = token;
      if (o.instant || reduced() || !el.animate) { for (let i = 0; i < width; i++) { cur[i] = t[i]; face(cells[i], t[i]); } return Promise.resolve(); }
      const jobs = []; for (let i = 0; i < width; i++) if (t[i] !== cur[i]) jobs.push(run(i, t[i], my, Object.assign({}, opts, o)));
      return Promise.all(jobs);
    }
    return { set, get text() { return cur.join(''); } };
  }

  // ---------------- tweens ----------------
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  function tween(dur, fn) {
    if (reduced()) { fn(1); return Promise.resolve(); }
    return new Promise((res) => { const t0 = performance.now(); const f = (n) => { const x = Math.min(1, (n - t0) / dur); fn(ease(x)); if (x < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  }
  function countTo(el, from, to, dur, fmt) { return tween(dur, (k) => { el.textContent = fmt(from + (to - from) * k); }); }
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 60) : ms));

  root.FX = { sfx, Flap, tween, countTo, wait, reduced };
})(window);
