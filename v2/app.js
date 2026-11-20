/* The Currency Desk, step-by-step version (2026-11-19): the page. lesson.js says what each step asks; config.js and
   desk-engine.js (run with DESK_NO_UI) judge the records and build the receipt; journey.js runs the yen trade's year;
   fx.js and art.js flip the board and draw. One layout for every step: picture and worked example on the left, the
   question with its boxes and picks on a paper card on the right. */
(function () {
  'use strict';
  const D = DeskEngine.make(window.DESK), C = D.C, h = DeskEngine.h, J = window.JOURNEY, A = window.ART, FX = window.FX, sfx = FX.sfx, LS = window.LESSON;
  const F = LS.fmt, KEY = 'rize-finan3-w12-currency-v3', OLD = 'rize-finan3-w12-currency-v2';
  const $ = (s, el) => (el || document).querySelector(s), $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  const main = $('#main');

  // ---------------- state ----------------
  // S.log is config.js's ten records (what the receipt carries). S.done marks the twelve steps; S.vals holds what the
  // student typed and picked, keyed "step.item".
  let S = null, STEPS = [];
  const blankLog = () => { const l = {}; D.STEPS.forEach((s) => { l[s.id] = { done: false, attempts: 0, help: 0 }; }); return l; };
  function begin(code, saved) {
    S = { code: h.normCode(code), log: blankLog(), memo: '', at: 'start', done: {}, vals: {}, ride: { month: 0, closedAt: null, seed: 0, started: false } };
    if (saved) { Object.keys(saved.log || {}).forEach((k) => { if (S.log[k]) S.log[k] = Object.assign(S.log[k], saved.log[k]); }); S.memo = saved.memo || ''; S.at = saved.at || 'start'; S.done = saved.done || {}; S.vals = saved.vals || {}; S.ride = Object.assign(S.ride, saved.ride || {}); }
    STEPS = LS.build(D.buildTasks(S.code)); save();
  }
  function save() { if (!S) return; store.set(KEY + ':' + S.code, { code: S.code, log: S.log, memo: S.memo, at: S.at, done: S.done, vals: S.vals, ride: S.ride }); store.set(KEY + ':last', S.code); }
  // A student who began the journey version keeps their code and every finished record.
  function fromOld(code) {
    const o = store.get(OLD + ':' + code); if (!o || !o.log) return null;
    const steps = LS.build(D.buildTasks(code)), done = {};
    Object.keys(o.log).forEach((rec) => { if (o.log[rec] && o.log[rec].done) steps.filter((s) => s.rec === rec).forEach((s) => { done[s.id] = true; }); });
    const ride = o.ride && o.ride.closedAt ? { month: o.ride.month || 12, closedAt: o.ride.closedAt, seed: o.ride.seed || 0, started: true } : undefined;
    return { log: o.log, memo: o.memo || '', at: 'start', done, vals: {}, ride };
  }
  const idx = (id) => STEPS.findIndex((s) => s.id === id);
  const stepById = (id) => STEPS.find((s) => s.id === id);
  const recDone = () => D.STEPS.filter((s) => S.log[s.id].done).length;
  const stepsDone = () => STEPS.filter((s) => S.done[s.id]).length;
  const task = (rec) => D.buildTasks(S.code).find((t) => t.id === rec);
  function attempt(st) { const e = S.log[st.rec]; e.attempts = (e.attempts || 0) + 1; save(); }
  // A finished step; when every step of its record is finished, the record is written and checked by config.js's judge.
  function finishStep(st) {
    S.done[st.id] = true;
    const rec = st.rec, e = S.log[rec];
    if (LS.stepsOf(STEPS, rec).every((id) => S.done[id])) {
      Object.assign(e, LS.recordFor(rec, S.vals, rec === 'carry' && S.ride.closedAt ? J.rideValue(S.ride.closedAt, S.ride.seed) : null));
      const spec = D.STEPS.find((s) => s.id === rec);
      if (spec.kind === 'task') { const t = task(rec); if (!C.judgeTask(t, { value: e.value, choice: e.choice, rows: e.rows }, h).ok) { const a = C.selfAnswer(t, h); e.rows = a.rows; e.choice = a.choice; } }
      if (!e.done) { e.done = true; e.at = new Date().toISOString(); }
    }
    save(); renderRoute();
  }

  // ---------------- chrome: the route of named steps, sound, footer ----------------
  function renderRoute() {
    const items = STEPS.map((s, i) => { const d = S && S.done[s.id]; return `<li><button type="button" data-go="${s.id}" class="${d ? 'done' : ''}" ${S && S.at === s.id ? 'aria-current="step"' : ''} title="${i + 1}. ${esc(s.name)}" aria-label="Step ${i + 1}, ${esc(s.name)}${d ? ', done' : ''}">${i + 1}</button></li>`; });
    $('#route').innerHTML = S ? `${items.join('')}<li><button type="button" data-go="receipt" class="end${stepsDone() === STEPS.length ? ' done' : ''}" ${S.at === 'receipt' ? 'aria-current="step"' : ''} title="Your receipt" aria-label="Your receipt">✈</button></li>` : '';
    $$('#route button').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
    const i = S ? idx(S.at) : -1;
    $('#routeNow').innerHTML = !S || S.at === 'start' ? '' : S.at === 'receipt' ? '<b>Your receipt</b>' : `Step ${i + 1} of ${STEPS.length}: <b>${esc(STEPS[i].name)}</b>`;
    $('#codeLine').innerHTML = S ? `Your progress saves in this browser. Desk code <b>${h.fmtCode(S.code)}</b>. ` : '';
  }
  const soundBtn = $('#soundBtn');
  function setSound(v) { sfx.on = v; soundBtn.setAttribute('aria-pressed', String(v)); $('.tool-tx', soundBtn).textContent = v ? 'Sound on' : 'Sound off'; store.set(KEY + ':sound', v); }
  soundBtn.addEventListener('click', () => { setSound(!sfx.on); if (sfx.on) sfx.ok(); });
  // Continuing on another computer lives in the footer, out of the way.
  $('#codeForm').addEventListener('submit', (ev) => {
    ev.preventDefault(); const c = $('#codeIn').value, err = $('#codeErr');
    if (!h.validCode(c)) { err.textContent = 'A desk code has eight letters and numbers, like ABCD-EFGH.'; return; }
    const n = h.normCode(c); err.textContent = ''; begin(n, store.get(KEY + ':' + n) || fromOld(n)); $('#codeMore').open = false; go(S.at === 'start' ? STEPS[0].id : S.at);
  });

  // ---------------- one step's frame ----------------
  const says = (who, mood, text) => `<div class="says" data-who="${who}"><div class="face">${A.person(who, mood)}</div><p class="bubble"><b>${who === 'ken' ? 'Ken, at the next desk' : 'Travis'}</b>${nb(esc(text))}</p></div>`;
  // Keep a sign and its amount on one line (+¥285,667 never breaks after the +).
  const nb = (html) => String(html).replace(/[+−-]?[¥$][\d,.]+/g, (m) => `<span class="nw">${m}</span>`);
  function workedHTML(w) {
    if (!w) return '';
    const body = w.lines ? `<div class="wlines">${w.lines.map(([l, c, v]) => `<div class="wl"><span class="l">${esc(l)}</span><span class="v">${esc(v)}</span>${c && c !== 'given' ? `<span class="c">= ${esc(c)}</span>` : ''}</div>`).join('')}</div>${w.note ? `<p>${esc(w.note)}</p>` : ''}` : `<p>${esc(w.text)}</p>`;
    return `<aside class="worked" aria-label="Worked example"><h2><span class="tag">Worked example</span>${esc(w.title)}</h2>${body}</aside>`;
  }
  function nextLabel(id) { const i = idx(id); return i < STEPS.length - 1 ? 'Next: ' + STEPS[i + 1].name : 'Get your receipt'; }
  function frame(st, o) {
    const i = idx(st.id);
    main.innerHTML = `<section class="step" data-id="${st.id}" aria-labelledby="stepT">
      <div class="left"><figure class="pic" id="pic">${o.pic || ''}</figure>${o.worked || ''}</div>
      <div class="right"><div class="card head"><p class="kicker">Step ${i + 1} of ${STEPS.length}</p><h1 id="stepT">${esc(st.name)}</h1><p class="ask">${st.ask}</p>${o.headExtra || ''}</div>
        <div class="card ctrl" id="ctrl">${o.ctrl || ''}<div class="fb" id="fb" role="status" aria-live="polite"></div><div id="sayRow"></div>
          <div class="next" id="nextRow" ${S.done[st.id] ? '' : 'hidden'}><button type="button" class="btn" id="nextBtn">${esc(nextLabel(st.id))}</button></div></div></div></section>`;
    $('#nextBtn').addEventListener('click', () => go(i < STEPS.length - 1 ? STEPS[i + 1].id : 'receipt'));
  }
  function fb(cls, html) { const e = $('#fb'); if (!e) return; e.className = 'fb ' + (cls || ''); e.innerHTML = html; }
  function showNext(focus) { const n = $('#nextRow'); if (!n) return; n.hidden = false; if (focus) { const b = $('#nextBtn'); b.focus({ preventScroll: true }); const r = n.getBoundingClientRect(); if (r.bottom > innerHeight) n.scrollIntoView({ block: 'nearest', behavior: FX.reduced() ? 'auto' : 'smooth' }); } }

  // ---------------- the three controls ----------------
  const key = (st, it) => st.id + '.' + it.id;
  const show = (it) => LS.SHOW[it.kind](it.answer);
  function itemHTML(st, it) {
    const k = key(st, it), id = `in-${st.id}-${it.id}`;
    if (it.type === 'given') return `<div class="item given"><span><span class="lab">${esc(it.label)}</span><span class="calc">${esc(it.calc)}</span></span><span class="val">${esc(it.value)}</span></div>`;
    if (it.type === 'box') return `<div class="item box" data-k="${k}"><label for="${id}"><span class="lab">${esc(it.label)}</span><span class="calc">${esc(it.calc)}</span></label>
      <span class="inwrap"><input id="${id}" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="${LS.PH[it.kind]}" value="${esc(S.vals[k] != null ? S.vals[k] : '')}" aria-describedby="m-${id}"><span class="mk" aria-hidden="true"></span></span><p class="imsg" id="m-${id}" aria-live="polite"></p></div>`;
    const both = it.both ? `<div class="both">${it.both.map(([l, a, b]) => `<span class="bl">${esc(l)}</span><span class="bv">${esc(a)}</span><span class="ar" aria-label="then">→</span><span class="bv">${esc(b)}</span>`).join('')}</div>` : '';
    const row = !it.both && it.options.every(([, l]) => l.length <= 12);
    return `<div class="item pick${row ? ' row' : ''}" data-k="${k}" role="group" aria-labelledby="q-${id}"><p class="pask" id="q-${id}"><span class="mk" aria-hidden="true"></span><span>${esc(it.ask)}</span></p>${both}
      <div class="opts">${it.options.map(([v, label]) => `<button type="button" class="opt" data-k="${k}" data-v="${esc(String(v))}" aria-pressed="false">${esc(label)}</button>`).join('')}</div><p class="imsg" aria-live="polite"></p></div>`;
  }
  const solved = (st, it) => (it.type === 'box' ? LS.judgeBox(it, S.vals[key(st, it)]).ok : it.type === 'pick' ? S.vals[key(st, it)] != null && String(S.vals[key(st, it)]) === String(it.answer) : true);
  const allSolved = (st) => st.items.every((it) => solved(st, it));
  function markBox(st, it, res) {
    const el = $(`.box[data-k="${key(st, it)}"]`); if (!el) return;
    el.classList.toggle('ok', res === true); el.classList.toggle('bad', !!res && res !== true);
    $('.mk', el).textContent = res === true ? '✓' : res ? '✗' : ''; $('.mk', el).className = 'mk ' + (res === true ? 'yes' : res ? 'no' : '');
    $('.imsg', el).textContent = res && res !== true ? res.msg : '';
    $('input', el).setAttribute('aria-invalid', res && res !== true ? 'true' : 'false');
  }
  function markPick(st, it, chosen, ok, msg) {
    const el = $(`.pick[data-k="${key(st, it)}"]`); if (!el) return;
    $$('.opt', el).forEach((b) => { const me = b.dataset.v === String(chosen); if (ok) { b.classList.toggle('yes', me); b.classList.remove('no'); b.disabled = true; b.setAttribute('aria-pressed', String(me)); } else if (me) { b.classList.add('no'); b.setAttribute('aria-pressed', 'true'); } });
    el.classList.toggle('ok', !!ok); const mk = $('.pask .mk', el); mk.textContent = ok ? '✓' : ''; mk.className = 'mk ' + (ok ? 'yes' : '');
    $('.imsg', el).textContent = ok ? '' : msg || '';
  }

  // A step made of boxes and picks: the Mortgage Machine's pattern, one layout for all of them.
  function showItems(st) {
    const P = PICS[st.pic], hasBox = st.items.some((it) => it.type === 'box'), done = !!S.done[st.id];
    frame(st, { pic: P.html(st), worked: workedHTML(st.worked),
      ctrl: `<p class="howto">${hasBox ? `Type in each box (commas, $ or ¥${st.items.some((it) => it.answer < 0) ? ', and a minus sign for a loss' : ''} are fine)${st.items.some((it) => it.type === 'pick') ? ' and tap an answer' : ''}, then press Check.` : 'Tap an answer for each. Each one is checked as you tap it.'}</p><div class="items">${st.items.map((it) => itemHTML(st, it)).join('')}</div>
        <div class="actions" id="acts">${hasBox ? '<button type="button" class="btn ink" id="chk">Check</button>' : ''}<button type="button" class="btn small ghost" id="hintBtn">Hint</button><span class="free">Hints never cost points.</span></div>
        <div class="hintbox" id="hintBox" role="status"></div>` });
    if (P.init) P.init(st);
    const st0 = () => st.items.filter((it) => solved(st, it)).map((it) => it.id);
    const paint = () => { if (P.update) P.update(st, st0()); };
    const complete = (fresh) => {
      $('#acts').hidden = true; $('#hintBox').innerHTML = '';
      fb('ok', `<span class="tag">Right.</span> ${esc(st.praise.replace(/^Right\.\s*/, ''))}`);
      if (st.say) $('#sayRow').innerHTML = says(...st.say);
      if (fresh) { finishStep(st); sfx.ok(); }
      if (P.done) P.done(st, fresh);
      showNext(fresh);
    };
    // what is already there (a return visit, or a finished step)
    st.items.forEach((it) => {
      const k = key(st, it);
      if (it.type === 'box') { if (done && !LS.judgeBox(it, S.vals[k]).ok) { S.vals[k] = show(it); $('#in-' + st.id + '-' + it.id).value = S.vals[k]; } if (LS.judgeBox(it, S.vals[k]).ok) markBox(st, it, true); }
      if (it.type === 'pick') { if (done) S.vals[k] = it.answer; if (solved(st, it)) markPick(st, it, it.answer, true); }
    });
    paint();
    if (done) { complete(false); return; }
    // boxes: a box turns green as soon as it is right; Check marks the rest with what went wrong
    let liveT = null;
    const live = () => {
      st.items.filter((it) => it.type === 'box').forEach((it) => { const r = LS.judgeBox(it, S.vals[key(st, it)]); const el = $(`.box[data-k="${key(st, it)}"]`); if (r.ok) { if (!el.classList.contains('ok')) { markBox(st, it, true); sfx.tick(); } } else if (el.classList.contains('ok')) markBox(st, it, null); });
      paint(); if (allSolved(st)) complete(true);
    };
    $$('.box input').forEach((inp) => {
      const k = inp.closest('.box').dataset.k;
      inp.addEventListener('input', () => { S.vals[k] = inp.value; save(); clearTimeout(liveT); liveT = setTimeout(live, 450); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    });
    function check() {
      clearTimeout(liveT); attempt(st); let bad = 0;
      st.items.filter((it) => it.type === 'box').forEach((it) => { const r = LS.judgeBox(it, S.vals[key(st, it)]); markBox(st, it, r.ok ? true : r); if (!r.ok) bad++; });
      paint();
      if (allSolved(st)) return complete(true);
      if (bad) { fb('bad', `<span class="tag">Not yet.</span> ${bad === 1 ? 'One box is marked ✗. The note under it says what went wrong.' : `${bad} boxes are marked ✗. The note under each says what went wrong.`}`); sfx.nope(); const first = $('.box.bad input'); if (first) first.focus(); return; }
      const open = st.items.find((it) => it.type === 'pick' && !solved(st, it));
      fb('info', `Every box is right. Now answer: ${esc(open.ask)}`); sfx.ok();
    }
    if ($('#chk')) $('#chk').addEventListener('click', check);
    // picks: judged the moment they are tapped
    $$('.opt').forEach((b) => b.addEventListener('click', () => {
      const it = st.items.find((x) => key(st, x) === b.dataset.k); if (!it || solved(st, it)) return;
      const v = typeof it.answer === 'number' ? Number(b.dataset.v) : b.dataset.v, r = LS.judgePick(it, v); attempt(st);
      if (r.ok) { S.vals[key(st, it)] = v; save(); markPick(st, it, v, true); sfx.ok(); paint(); if (P.pick) P.pick(st, it); if (allSolved(st)) complete(true); else { fb('', ''); const nb = st.items.find((x) => !solved(st, x)); if (nb && nb.type === 'pick' && !st.items.some((x) => x.type === 'box' && !solved(st, x))) { const nx = $(`.pick[data-k="${key(st, nb)}"] .opt`); if (nx) nx.focus({ preventScroll: true }); } } }
      else { markPick(st, it, v, false, r.msg); sfx.nope(); }
    }));
    // the hint: two levels, never costs anything; the level prints for the instructor
    $('#hintBtn').addEventListener('click', () => {
      const e = S.log[st.rec], lvl = $('#hintBox').innerHTML ? 2 : 1; e.help = Math.max(e.help || 0, lvl); save();
      $('#hintBox').innerHTML = `<b>Hint.</b> ${esc(st.hint)}${lvl === 2 ? `<br><b>The answer.</b> ${esc(st.answer)}` : ''}`;
      $('#hintBtn').textContent = 'Show the answer'; if (lvl === 2) $('#hintBtn').hidden = true;
    });
  }

  // ---------------- pictures (each one teaches: it changes when an answer is right) ----------------
  function dollarNotes(d) { const out = []; let r = d; while (r >= 100) { out.push(100); r -= 100; } if (r >= 50) { out.push(50); r -= 50; } return out; }
  function trayYen(el, y, animate) {
    const big = Math.floor(y / 10000), small = Math.floor((y - big * 10000) / 1000), list = [...Array(big).fill(10000), ...Array(small).fill(1000)], rest = y - big * 10000 - small * 1000;
    el.innerHTML = `<span class="lbl">Yen counted out to Travis</span><span class="count">${F.yen(animate ? 0 : y)}</span>`;
    const cnt = $('.count', el); let sum = 0;
    list.forEach((v, i) => setTimeout(() => { if (!el.isConnected) return; el.insertAdjacentHTML('beforeend', A.yenNote(v).replace('class="note"', `class="note${animate ? ' dl' : ''}"`)); sum += v; if (animate) { cnt.textContent = F.yen(sum + (i === list.length - 1 ? rest : 0)); sfx.note(); } }, animate && !FX.reduced() ? 120 * i : 0));
  }
  const flapRow = (id, w, label) => `<div class="board-row">${label ? `<span class="rl">${esc(label)}</span>` : ''}<span id="${id}" data-w="${w}"></span></div>`;
  const flap = (id) => { const e = $('#' + id); return e ? FX.Flap(e, +e.dataset.w) : null; };
  const cap = (html) => { const c = $('#cap'); if (c) c.innerHTML = html; };
  const BM = () => task('bigmac');
  const PICS = {
    counter: {
      html: (st) => `<div class="board two"><p class="board-head"><span>One dollar buys</span><small>Your desk, Chicago</small></p><div class="board-rows">${flapRow('fl-a', 7)}</div></div><div class="tray" id="tray"></div><figcaption id="cap"></figcaption>`,
      init: () => { const t = task('convert'); flap('fl-a').set(`${t.R} YEN`, { instant: true, label: `${t.R} yen` }); const tray = $('#tray'); tray.innerHTML = `<span class="lbl">Travis hands over</span>${dollarNotes(t.D).map((v) => A.usdNote(v, 70)).join('')}`; cap(`At your desk a dollar buys <b>${t.R} yen</b>. Travis has <b>${F.usd0(t.D)}</b>.`); },
      update: (st, ok) => { const t = task('convert'); if (ok.includes('yen') && !$('#tray').dataset.yen) { $('#tray').dataset.yen = '1'; trayYen($('#tray'), t.D * t.R, !S.done[st.id]); cap(`Each of Travis’s ${t.D} dollars becomes ${t.R} yen: <b>${F.yen(t.D * t.R)}</b>.`); } },
    },
    board2: {
      html: () => `<div class="board two"><p class="board-head"><span id="b2when">Two ways to read one rate</span></p><div class="board-rows">${flapRow('fl-a', 10, 'A dollar buys')}${flapRow('fl-b', 10, '¥10,000 buys')}</div></div><figcaption id="cap"></figcaption>`,
      init: (st) => { PICS.board2.at = -1; PICS.board2.update(st, st.items.filter((it) => solved(st, it)).map((it) => it.id)); },
      update: (st, ok) => {
        const k = Math.min(st.items.findIndex((it) => !ok.includes(it.id)) < 0 ? st.items.length - 1 : st.items.findIndex((it) => !ok.includes(it.id)), st.items.length - 1);
        if (PICS.board2.at === k) return; PICS.board2.at = k; const it = st.items[k], a = flap('fl-a'), b = flap('fl-b');
        $('#b2when').textContent = it.ask; a.set(it.both[0][1], { instant: true }); b.set(it.both[1][1], { instant: true });
        cap(`<b>${esc(it.ask)}.</b> Watch both lines change.`);
        setTimeout(() => { if (!$('#fl-a')) return; a.set(it.both[0][2], { maxSteps: 6 }); b.set(it.both[1][2], { maxSteps: 6 }); }, FX.reduced() ? 0 : 700);
      },
      done: () => cap('A dollar that buys more yen is a stronger dollar. ¥10,000 that buys more dollars is a stronger yen.'),
    },
    apple: {
      html: () => `<div class="scalewrap">${A.scale(A.apple(0, -2, 1), A.apple(0, -2, 1), 'scl')}</div><div class="tags"><div class="tagc"><div class="w">Tokyo</div><div class="p">¥200</div><div class="p2" id="tag-l"></div></div><div class="tagc"><div class="w">Chicago</div><div class="p">$1.00</div><div class="p2">Already in dollars</div></div></div><figcaption id="cap"></figcaption>`,
      init: () => { A.setScale($('#scl'), 0); $('#scl .lock').setAttribute('opacity', 1); cap('The scale is locked: <b>¥200</b> and <b>$1.00</b> are in different units. Change the yen price into dollars to unlock it.'); },
      update: (st, ok) => { if (ok.includes('tokyo')) { $('#scl .lock').setAttribute('opacity', 0); $('#tag-l').textContent = '= $1.33'; A.setScale($('#scl'), -9); cap('In dollars the Tokyo apple costs more, so it sinks: <b>$1.33</b> against <b>$1.00</b>.'); } },
    },
    burger: {
      html: () => `<div class="scalewrap">${A.scale(A.burger(0, 0, 1), A.burger(0, 0, 1), 'scl')}</div><div class="tags"><div class="tagc"><div class="w">Japan</div><div class="p">¥500</div><div class="p2" id="tag-l"></div></div><div class="tagc"><div class="w">United States</div><div class="p">$6.22</div><div class="p2">Already in dollars</div></div></div><figcaption id="cap"></figcaption>`,
      init: () => { A.setScale($('#scl'), 0); $('#scl .lock').setAttribute('opacity', 1); cap('The scale is locked: <b>¥500</b> and <b>$6.22</b> are in different units. Price Japan’s burger in dollars to unlock it.'); },
      update: (st, ok) => {
        const t = BM();
        if (ok.includes('jpusd')) { $('#scl .lock').setAttribute('opacity', 0); $('#tag-l').textContent = `= ${F.usd2(t.jpUsd)} at ${t.R}`; A.setScale($('#scl'), 10); cap(`At the market rate, <b>${t.R} yen per dollar</b>, Japan’s burger costs ${F.usd2(t.jpUsd)}, so the dearer American one sinks.`); }
        if (ok.includes('equal')) { $('#tag-l').textContent = `= $6.22 at 80.4`; A.setScale($('#scl'), 0); cap(`At <b>80.4 yen per dollar</b> the burgers would cost the same. The market gave <b>${t.R}</b>, about twice as many.`); }
      },
    },
    float: {
      html: () => `<div class="board two"><p class="board-head"><span>One dollar buys</span><small>The yen floats</small></p><div class="board-rows">${flapRow('fl-a', 7)}</div></div><figcaption id="cap"></figcaption>`,
      init: (st) => { const ok = st.items.filter((it) => solved(st, it)); const r = 150 + ok.reduce((s, it) => s + it.move, 0); flap('fl-a').set(`${r} YEN`, { instant: true, label: `${r} yen` }); PICS.float.rate = r; cap(ok.length ? PICS.float.say(ok[ok.length - 1], r) : 'Each answer you get right moves the board.'); },
      say: (it, r) => (it.answer === 'up' ? `More buying of yen: the yen gets stronger, so a dollar buys fewer yen, <b>${r}</b>.` : `More selling of yen: the yen gets weaker, so a dollar buys more yen, <b>${r}</b>.`),
      pick: (st, it) => { const r = PICS.float.rate + it.move; PICS.float.rate = r; flap('fl-a').set(`${r} YEN`, { label: `${r} yen`, maxSteps: 6 }); cap(PICS.float.say(it, r)); },
    },
    peg: {
      html: () => {
        const y = (v) => 30 + (7.90 - v) * 1000, yc = (v) => 30 + (7.20 - v) * 500;
        const wig = 'M' + Array.from({ length: 26 }, (_, i) => `${60 + i * 10} ${y(7.80 + 0.026 * Math.sin(i * 0.55) + 0.012 * Math.sin(i * 1.7 + 1)).toFixed(1)}`).join(' L');
        return `<svg class="svgpic" viewBox="0 0 640 260" role="img" aria-label="Hong Kong: the price of a U.S. dollar stays between 7.75 and 7.85 Hong Kong dollars. China: the yuan stays within 2% of a central rate of 7.00, between 6.86 and 7.14.">
          <text x="40" y="20" font-family="Big Shoulders Display" font-weight="800" font-size="18" fill="#FBF6EA">Hong Kong dollars per U.S. dollar</text>
          <rect x="60" y="${y(7.85)}" width="250" height="${y(7.75) - y(7.85)}" fill="#2FBF7F" opacity=".34"/>
          <line id="pg-hi" x1="60" x2="310" y1="${y(7.85)}" y2="${y(7.85)}" stroke="#F7C548" stroke-width="3"/><line id="pg-lo" x1="60" x2="310" y1="${y(7.75)}" y2="${y(7.75)}" stroke="#F7C548" stroke-width="3"/>
          <text x="54" y="${y(7.85) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="17" fill="#F7C548">7.85</text><text x="54" y="${y(7.75) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="17" fill="#F7C548">7.75</text>
          <text x="66" y="${y(7.85) - 8}" font-family="Atkinson Hyperlegible Next" font-size="13.5" fill="#FBF6EA">Your bank can always buy U.S. dollars here</text><text x="66" y="${y(7.75) + 20}" font-family="Atkinson Hyperlegible Next" font-size="13.5" fill="#FBF6EA">Your bank can always sell U.S. dollars here</text>
          <path d="${wig}" fill="none" stroke="#B3DDF2" stroke-width="3"/>
          <g id="pg-ask" opacity=".95"><text x="54" y="${y(7.90) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="16" fill="#FF8B85">7.90</text><line x1="60" x2="310" y1="${y(7.90)}" y2="${y(7.90)}" stroke="#FF8B85" stroke-dasharray="5 5"/></g>
          <g><text x="54" y="${y(7.70) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="16" fill="#FF8B85">7.70</text><line x1="60" x2="310" y1="${y(7.70)}" y2="${y(7.70)}" stroke="#FF8B85" stroke-dasharray="5 5"/></g>
          <text x="360" y="20" font-family="Big Shoulders Display" font-weight="800" font-size="18" fill="#FBF6EA">Yuan per dollar, one day</text>
          <rect x="400" y="${yc(7.14)}" width="200" height="${yc(6.86) - yc(7.14)}" fill="#2FBF7F" opacity=".34"/>
          <line x1="400" x2="600" y1="${yc(7.00)}" y2="${yc(7.00)}" stroke="#FBF6EA" stroke-width="2" stroke-dasharray="6 5"/>
          <line id="pg-cn1" x1="400" x2="600" y1="${yc(7.14)}" y2="${yc(7.14)}" stroke="#F7C548" stroke-width="3"/><line id="pg-cn2" x1="400" x2="600" y1="${yc(6.86)}" y2="${yc(6.86)}" stroke="#F7C548" stroke-width="3"/>
          <text x="394" y="${yc(7.14) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="17" fill="#F7C548">7.14</text><text x="394" y="${yc(7.00) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="17" fill="#FBF6EA">7.00</text><text x="394" y="${yc(6.86) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="17" fill="#F7C548">6.86</text>
          <text x="500" y="${yc(7.00) - 8}" text-anchor="middle" font-family="Atkinson Hyperlegible Next" font-size="13" fill="#FBF6EA">this morning’s central rate</text>
          <g id="pg-cn"><text x="394" y="${yc(7.20) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="16" fill="#FF8B85">7.20</text><line x1="400" x2="600" y1="${yc(7.20)}" y2="${yc(7.20)}" stroke="#FF8B85" stroke-dasharray="5 5"/></g>
        </svg><figcaption id="cap">The shaded band is where each price can trade. The red dashed lines are the offers in the questions.</figcaption>`;
      },
      update: (st, ok) => {
        const hl = (id, on) => { const e = $('#' + id); if (e) e.setAttribute('stroke-width', on ? 6 : 3); };
        hl('pg-hi', ok.includes('buy')); hl('pg-lo', ok.includes('sell')); hl('pg-cn1', ok.includes('cny')); hl('pg-cn2', ok.includes('cny'));
        const last = ['cny', 'sell', 'buy'].find((x) => ok.includes(x));
        if (last === 'buy') cap('No bank pays more than <b>7.85</b>: the Monetary Authority sells U.S. dollars to any bank at that price.');
        if (last === 'sell') cap('No bank takes less than <b>7.75</b>: the Monetary Authority buys U.S. dollars from any bank at that price.');
        if (last === 'cny') cap('Today the yuan stays between <b>6.86</b> and <b>7.14</b>, 2% either side of 7.00. 7.20 is outside.');
      },
    },
    winners: {
      html: (st) => `<div class="cards3">${st.items.map((it) => `<div class="pc" id="pc-${it.id}">${{ tractor: A.tractor, student: A.student, toyota: A.car }[it.id]}<span class="who">${esc({ tractor: 'Michigan tractor maker', student: 'Student in Tokyo', toyota: 'Toyota' }[it.id])}</span><span class="badge" hidden></span><span class="res" hidden></span></div>`).join('')}</div><figcaption id="cap">A dollar went from 150 yen to 165.</figcaption>`,
      update: (st, ok) => st.items.forEach((it) => { if (!ok.includes(it.id)) return; const c = $('#pc-' + it.id), b = $('.badge', c); b.hidden = false; b.className = 'badge ' + it.answer; b.textContent = it.answer === 'gain' ? 'Gains' : 'Loses'; const r = $('.res', c); r.hidden = false; r.textContent = it.after; }),
    },
    flow: {
      html: () => `<div class="flow"><div class="node"><span class="n">1</span><b>Borrow in Japan at 0.1%</b><span class="amt">¥15,000,000</span></div><div class="node"><span class="n">2</span><b>Change at 150 yen per dollar</b><span class="amt">$100,000</span></div><div class="node"><span class="n">3</span><b>A year in a U.S. account at 5%</b><span class="amt" id="fa3"></span></div><div class="node risk"><span class="n">4 · the risk</span><b>Change back at 142 and repay ¥15,015,000</b><span class="amt" id="fa4"></span></div></div><div class="result" id="fres" hidden></div><figcaption id="cap">Step 4 is the risk: if a dollar buys fewer yen by then, the dollars may not repay the loan.</figcaption>`,
      update: (st, ok) => { if (ok.includes('usd')) $('#fa3').textContent = '$105,000'; if (ok.includes('back')) $('#fa4').textContent = '¥14,910,000'; if (ok.includes('gain')) { const r = $('#fres'); r.hidden = false; r.innerHTML = 'The year: ¥14,910,000 − ¥15,015,000 = <b class="neg">−¥105,000</b>. At 150 it would have been +¥735,000.'; } },
    },
    howfar: {
      html: () => `<div id="hf">${gainLineSVG()}</div><figcaption id="cap">The year’s result for each rate a dollar might buy at the end. Fewer yen per dollar means a stronger yen.</figcaption>`,
      update: (st, ok) => { if (ok.includes('rate')) { const g = $('#hf-zero'); if (g) g.setAttribute('opacity', 1); cap('At <b>143.0</b> yen per dollar the gain is gone. From 150 that is <b>7 yen</b>: 7 ÷ 150 is about 5%.'); } },
      done: (st) => { $('#hf').innerHTML = historySVG(); cap('What really happened: from 2022 to mid-2024 a dollar bought more and more yen, so the trade paid. Then the yen jumped.'); drawLine($('#histPath')); },
    },
    coin: {
      html: () => `<div class="coinwrap" id="coinw">${A.coinScene}</div><div id="usdc"></div><figcaption id="cap">The coin stands on its reserve: cash and short-term government bonds.</figcaption>`,
      update: (st, ok) => { if (ok.includes('svb') && !$('#usdc').innerHTML) { $('#usdc').innerHTML = usdcSVG(); } },
      pick: (st, it) => { if (it.id !== 'svb') return; const cw = $('#coinw'), t = $('#coinw .coin text'); cw.classList.add('sunk'); t.textContent = '86¢'; sfx.thud(); setTimeout(() => { if (!cw.isConnected) return; cw.classList.remove('sunk'); t.textContent = '$1'; }, FX.reduced() ? 0 : 1800); },
      done: () => cap('USDC fell to about 86 cents, then was back at $1 on March 13, 2023, after regulators said every depositor at the bank would be repaid.'),
    },
  };
  function drawLine(p) { if (!p || FX.reduced() || !p.getTotalLength) return; const n = p.getTotalLength(); p.style.strokeDasharray = n; p.style.strokeDashoffset = n; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 2.4s ease'; p.style.strokeDashoffset = 0; }
  // The year's result against the rate at the end: $105,000 × rate − ¥15,015,000.
  function gainLineSVG() {
    const W = 640, H = 280, l = 100, r = 20, t = 20, b = 44, x0 = 136, x1 = 156, lo = -800000, hi = 1400000;
    const x = (v) => l + (W - l - r) * (v - x0) / (x1 - x0), y = (g) => t + (H - t - b) * (hi - g) / (hi - lo), G = (v) => 105000 * v - 15015000;
    const yt = [-500000, 0, 500000, 1000000].map((g) => `<line x1="${l}" x2="${W - r}" y1="${y(g)}" y2="${y(g)}" stroke="${g === 0 ? '#FBF6EA' : 'rgba(251,246,234,.15)'}" stroke-width="${g === 0 ? 2 : 1}" ${g === 0 ? 'stroke-dasharray="6 6"' : ''}/><text x="${l - 8}" y="${y(g) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="700" font-size="15" fill="#C3CDE6">${g === 0 ? '¥0' : (g > 0 ? '+' : '−') + '¥' + Math.abs(g).toLocaleString('en-US')}</text>`).join('');
    const xt = [138, 142, 146, 150, 154].map((v) => `<text x="${x(v)}" y="${H - 22}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="700" font-size="15" fill="#C3CDE6">${v}</text>`).join('');
    const dot = (v, c, label, dy) => `<circle cx="${x(v)}" cy="${y(G(v))}" r="7" fill="${c}"/><text x="${x(v) + (dy < 0 ? -12 : 10)}" text-anchor="${dy < 0 ? 'end' : 'start'}" y="${y(G(v)) + dy}" font-family="Big Shoulders Display" font-weight="800" font-size="16" fill="${c}">${label}</text>`;
    return `<svg class="svgpic" viewBox="0 0 ${W} ${H}" role="img" aria-label="The year's gain or loss for each year-end rate: plus 735,000 yen at 150, zero at 143.0, minus 105,000 yen at 142."><text x="${l}" y="14" font-family="Atkinson Hyperlegible Next" font-size="13" fill="#C3CDE6">The year’s gain or loss</text>${yt}${xt}<text x="${W - r}" y="${H - 4}" text-anchor="end" font-family="Atkinson Hyperlegible Next" font-size="13" fill="#C3CDE6">yen per dollar at the end of the year</text>
      <path d="M${x(x0)} ${y(G(x0))} L${x(x1)} ${y(G(x1))}" stroke="#F7C548" stroke-width="4"/>${dot(150, '#2FBF7F', '150: +¥735,000', -10)}${dot(142, '#FF8B85', '142: −¥105,000', 22)}
      <g id="hf-zero" opacity="0"><circle cx="${x(143)}" cy="${y(0)}" r="8" fill="#FBF6EA"/><text x="${x(143) - 10}" y="${y(0) - 12}" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="17" fill="#FBF6EA">143.0: gain gone</text><path d="M${x(143)} ${y(0) + 30} H${x(150)}" stroke="#FBF6EA" stroke-width="2"/><path d="M${x(143)} ${y(0) + 24} v12 M${x(150)} ${y(0) + 24} v12" stroke="#FBF6EA" stroke-width="2"/><text x="${(x(143) + x(150)) / 2}" y="${y(0) + 50}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="16" fill="#FBF6EA">7 yen, about 5%</text></g></svg>`;
  }
  function historySVG() {
    const data = window.YEN_HISTORY || [], W = 640, H = 300, l = 46, r = 14, tp = 22, b = 34, lo = 110, hi = 168;
    const t0 = Date.parse(data[0][0]), t1 = Date.parse(data[data.length - 1][0]);
    const x = (d) => l + (W - l - r) * (Date.parse(d) - t0) / (t1 - t0), y = (v) => tp + (H - tp - b) * (hi - v) / (hi - lo);
    const path = 'M' + data.map(([d, v]) => x(d).toFixed(1) + ' ' + y(v).toFixed(1)).join(' L');
    const yt = [115, 130, 145, 160].map((v) => `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(251,246,234,.15)"/><text x="${l - 6}" y="${y(v) + 5}" text-anchor="end" font-size="14" font-family="Big Shoulders Display" font-weight="700" fill="#C3CDE6">${v}</text>`).join('');
    const xt = ['2022-01-03', '2023-01-03', '2024-01-02'].map((d) => `<text x="${x(d)}" y="${H - 10}" font-size="14" font-family="Big Shoulders Display" font-weight="700" fill="#C3CDE6">${d.slice(0, 4)}</text>`).join('');
    const pts = [['2022-01-03', 115.27, 'January 2022: about 115', 'start', 22], ['2024-07-10', 161.73, 'July 10, 2024: about 162', 'end', -10], ['2024-08-05', 143.95, 'Aug. 5: about 144', 'end', 24]];
    const dots = pts.map(([d, v, s, anc, dy]) => `<circle cx="${x(d)}" cy="${y(v)}" r="6" fill="${d === '2024-08-05' ? '#FF8B85' : '#F7C548'}"/><text x="${x(d) + (anc === 'start' ? 10 : -10)}" y="${y(v) + dy}" text-anchor="${anc}" font-size="16" font-family="Big Shoulders Display" font-weight="800" fill="${d === '2024-08-05' ? '#FF8B85' : '#F7C548'}">${s}</text>`).join('');
    return `<svg class="svgpic" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="histT"><title id="histT">Yen per dollar from January 2022 to August 2024: about 115 in January 2022, about 162 on July 10, 2024, about 144 on August 5, 2024.</title><text x="${l}" y="14" font-size="13" font-family="Atkinson Hyperlegible Next" fill="#C3CDE6">Yen per dollar (FRED, DEXJPUS)</text>${yt}${xt}<path id="histPath" d="${path}" fill="none" stroke="#B3DDF2" stroke-width="2.5"/>${dots}</svg>`;
  }
  function usdcSVG() {
    return `<svg class="svgpic" viewBox="0 0 520 150" role="img" aria-labelledby="usdcT" style="margin-top:8px"><title id="usdcT">USDC's price fell from $1 to about 86 cents and was back to $1 on March 13, 2023.</title><line x1="50" x2="500" y1="28" y2="28" stroke="rgba(251,246,234,.3)"/><text x="42" y="33" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="15" fill="#C3CDE6">$1.00</text><text x="42" y="123" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="15" fill="#FF8B85">$0.86</text><line x1="50" x2="500" y1="118" y2="118" stroke="rgba(251,246,234,.3)" stroke-dasharray="4 4"/><path d="M50 28 L 170 28 C 200 28, 210 118, 240 118 C 270 118, 300 32, 340 28 L 500 28" fill="none" stroke="#F7C548" stroke-width="4"/><circle cx="240" cy="118" r="6" fill="#FF8B85"/><text x="344" y="20" font-family="Big Shoulders Display" font-weight="800" font-size="15" fill="#F7C548">March 13: back to $1</text></svg>`;
  }

  // ---------------- step 9: the yen trade ----------------
  const CH = { w: 640, hgt: 250, l: 70, r: 112, t: 16, b: 30, lo: -200000, hi: 600000 };
  const cx = (m) => CH.l + (CH.w - CH.l - CH.r) * m / 12, cy = (g) => CH.t + (CH.hgt - CH.t - CH.b) * (CH.hi - g) / (CH.hi - CH.lo);
  function chartSVG() {
    const ys = []; for (let g = CH.lo; g <= CH.hi; g += 200000) ys.push(g);
    return `<svg class="chart" viewBox="0 0 ${CH.w} ${CH.hgt}" role="img" aria-labelledby="chartT"><title id="chartT">Your gain if you cashed out, month by month</title>
      ${ys.map((g) => `<line x1="${CH.l}" x2="${CH.w - CH.r}" y1="${cy(g)}" y2="${cy(g)}" stroke="${g === 0 ? '#FBF6EA' : 'rgba(251,246,234,.12)'}" stroke-width="${g === 0 ? 2 : 1}" ${g === 0 ? 'stroke-dasharray="6 6"' : ''}/><text x="${CH.l - 8}" y="${cy(g) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="700" font-size="15" fill="#C3CDE6">${g === 0 ? '¥0' : (g > 0 ? '+' : '−') + '¥' + Math.abs(g / 1000) + 'k'}</text>`).join('')}
      ${Array.from({ length: 13 }, (_, m) => `<text x="${cx(m)}" y="${CH.hgt - 12}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="700" font-size="14" fill="#C3CDE6">${m}</text>`).join('')}
      <text x="${CH.w - CH.r + 8}" y="${CH.hgt - 12}" font-family="Atkinson Hyperlegible Next" font-size="12" fill="#C3CDE6">month</text>
      <text x="${CH.l}" y="12" font-family="Atkinson Hyperlegible Next" font-size="12.5" fill="#C3CDE6">Your gain if you cashed out</text>
      <path id="pHeld" fill="none" stroke="#FF8B85" stroke-width="4" stroke-dasharray="3 7" stroke-linecap="round" opacity="0"/>
      <path id="pKept" fill="none" stroke="#2FBF7F" stroke-width="3" stroke-dasharray="8 6" opacity="0"/>
      <defs><clipPath id="cUp"><rect x="0" y="0" width="${CH.w}" height="${cy(0)}"/></clipPath><clipPath id="cDn"><rect x="0" y="${cy(0)}" width="${CH.w}" height="${CH.hgt}"/></clipPath></defs>
      <path id="aYou" fill="#2FBF7F" opacity=".16" clip-path="url(#cUp)"/><path id="aYouDn" fill="#FF5B57" opacity=".22" clip-path="url(#cDn)"/>
      <path id="pYou" fill="none" stroke="#F7C548" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#cUp)"/>
      <path id="pYouDn" fill="none" stroke="#FF6B66" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#cDn)"/>
      <circle id="dotYou" r="7" fill="#F7C548" stroke="#0C1736" stroke-width="3"/>
      <text id="lblYou" font-family="Big Shoulders Display" font-weight="800" font-size="17" fill="#F7C548"></text>
      <text id="lblHeld" font-family="Big Shoulders Display" font-weight="800" font-size="17" fill="#FF8B85"></text></svg>`;
  }
  function setYou(d) { $('#pYou').setAttribute('d', d); $('#pYouDn').setAttribute('d', d); const end = d.match(/([\d.]+) [\d.]+$/), z = cy(0).toFixed(1); const area = d + ` L${end ? end[1] : cx(0)} ${z} L${cx(0)} ${z} Z`; $('#aYou').setAttribute('d', area); $('#aYouDn').setAttribute('d', area); }
  const pathTo = (from, to, frac, P) => { const pts = []; for (let m = from; m <= to; m++) pts.push([cx(m), cy(J.closeResult(m, P).gainYen)]); if (frac != null && frac < 1 && pts.length > 1) { const a = pts[pts.length - 2], b = pts[pts.length - 1]; pts[pts.length - 1] = [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]; } return 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L'); };
  function sayKen(arr) { const r = $('#kenRow'); if (!r) return; r.innerHTML = says(...arr); if (!FX.reduced()) { const n = $('.says', r); if (n && n.animate) n.animate([{ transform: 'scale(.97)', opacity: .5 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: 'ease-out' }); } }

  function showGame(st) {
    const R = S.ride; if (!R.seed) { R.seed = J.newSeed(); save(); }
    const P = J.pathOf(R.seed), res = (m) => J.closeResult(m, P), pt = (a, b, f) => pathTo(a, b, f, P);
    CH.hi = Math.max(600000, Math.ceil(Math.max(...Array.from({ length: 12 }, (_, i) => res(i + 1).gainYen)) / 200000) * 200000);
    const sum = (r) => `${F.usd2(r.usd)} × ${r.rate} − ${F.yen(r.owe)} owed`;
    frame(st, {
      pic: `<div class="ticker"><div><div class="pl">One dollar buys</div><span id="fl-tick" data-w="9" class="tick"></span></div><div></div><div class="month" id="monthL"></div></div><p class="news" id="news" aria-live="polite"></p><div class="chartwrap" id="chartwrap">${chartSVG()}</div>`,
      worked: `<aside class="worked" aria-label="Your trade"><h2><span class="tag">Your trade</span>The numbers from step 8</h2><div class="wlines"><div class="wl"><span class="l">Borrowed in Japan at 0.1% a year</span><span class="v">¥15,000,000</span></div><div class="wl"><span class="l">Changed at 150, earning 5% a year</span><span class="v">$100,000</span></div><div class="wl"><span class="l">Each month your dollars earn</span><span class="v">+$416.67</span></div><div class="wl"><span class="l">Each month the loan’s interest adds to what you owe</span><span class="v">+¥1,250</span></div></div></aside>`,
      headExtra: `<p class="credit-line">${esc(LS.GAME.credit)}</p>`,
      ctrl: `<div id="kenRow"></div><div class="gainbox"><span class="lab" id="gainLab">If you cashed out now</span><span class="val" id="gainV"></span><span class="sum" id="gainSum"></span></div><p class="rule">${esc(LS.GAME.rule)}</p><div id="decide"></div>`,
    });
    const tick = FX.Flap($('#fl-tick'), 9);
    const paint = (m) => { const r = res(m); tick.set(`${r.rate} YEN`, { instant: true, label: `${r.rate} yen per dollar` }); $('#monthL').textContent = m === 0 ? 'Day one' : `Month ${m} of 12`; const gv = $('#gainV'); gv.textContent = J.fmt.yenSigned(r.gainYen); gv.classList.toggle('neg', r.gainYen < 0); $('#gainSum').textContent = sum(r); $('#news').textContent = J.newsFor(m, P); $('#news').classList.toggle('alert', m > P.turn || (P.alarm && m === P.alarm)); };
    const drawYou = (m, frac) => { const mm = Math.min(m, R.closedAt || 12); setYou(pt(0, mm, frac)); const k = frac == null ? 1 : frac, g0 = res(Math.max(0, mm - 1)).gainYen, g = res(mm).gainYen; $('#dotYou').setAttribute('cx', cx(Math.max(0, mm - 1 + k))); $('#dotYou').setAttribute('cy', cy(mm === 0 ? 0 : g0 + (g - g0) * k)); };
    paint(R.month); drawYou(R.month); sayKen(J.kenSays(R.month, P, false));
    if (R.closedAt) return ending(false);
    decide();

    function decide(wait) {
      const m = R.month, c = J.nextMonthCases(m, P), g = res(m).gainYen, add = c.stay - g;
      if (!R.started) { $('#decide').innerHTML = '<div class="decide live one"><button type="button" class="btn" id="go">Start the year: month 1</button></div>'; $('#go').addEventListener('click', () => { R.started = true; save(); hold(); }); return; }
      $('#decide').innerHTML = `<div class="decide live"><span class="dgain">If you cash out now: <b class="${g < 0 ? 'neg' : ''}">${J.fmt.yenSigned(g)}</b> · Month ${m} of 12</span><button type="button" class="btn" id="hold">Hold<small>about ${J.fmt.yenSigned(add)} more if a dollar still buys ${c.rate} yen</small></button><button type="button" class="btn ink" id="cash">Cash out<small>keep ${J.fmt.yenSigned(g)}</small></button></div>`;
      $('#hold').addEventListener('click', hold); $('#cash').addEventListener('click', cashOut);
      if (wait) $$('#decide button').forEach((x) => { x.disabled = true; }); else $('#hold').focus({ preventScroll: true });
    }
    async function step(m, ghost) {
      const prev = res(m - 1), r = res(m);
      sayKen(J.kenSays(m, P, ghost));
      if (!ghost) sfx.coin();
      $('#monthL').textContent = `Month ${m} of 12`; $('#news').textContent = J.newsFor(m, P); $('#news').classList.toggle('alert', m > P.turn || (P.alarm && m === P.alarm));
      if (r.rate !== prev.rate) tick.set(`${r.rate} YEN`, { label: `${r.rate} yen per dollar`, maxSteps: 6 });
      const gv = $('#gainV');
      if (!ghost) { gv.textContent = J.fmt.yenSigned(r.gainYen); gv.classList.toggle('neg', r.gainYen < 0); $('#gainSum').textContent = sum(r); }
      await FX.tween(ghost ? 450 : m === 12 ? 1400 : m > P.turn ? 950 : 650, (k) => {
        if (!$('#gainV')) return;
        if (ghost) $('#pHeld').setAttribute('d', pt(R.closedAt, m, k));
        else drawYou(m, k);
      });
      if (!$('#gainV')) return;
      if (!ghost) { drawYou(m); gv.textContent = J.fmt.yenSigned(r.gainYen); gv.classList.toggle('neg', r.gainYen < 0); $('#gainSum').textContent = sum(r); }
      if (m === 12) { sfx.thud(); if (!FX.reduced()) { const w = $('#chartwrap'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); } }
    }
    async function hold() {
      $$('#decide button').forEach((x) => { x.disabled = true; });
      R.started = true; R.month++; save(); if (R.month < 12) decide(true); await step(R.month, false); if (!$('#decide')) return;
      if (R.month >= 12) { R.closedAt = 12; save(); await FX.wait(500); return ending(true); }
      await FX.wait(R.month >= P.turn ? 300 : 120); $$('#decide button').forEach((x) => { x.disabled = false; }); const hb = $('#hold'); if (hb) hb.focus({ preventScroll: true });
    }
    async function cashOut() {
      R.closedAt = R.month; save(); sfx.ok();
      $('#decide').innerHTML = `<p class="verdict">You cashed out with <b>${J.fmt.yenSigned(res(R.closedAt).gainYen)}</b>. Ken is still in. Watch his year.</p>`;
      $('#gainLab').textContent = 'You kept'; $('#gainSum').textContent = sum(res(R.closedAt));
      $('#pKept').setAttribute('d', `M${cx(R.closedAt)} ${cy(res(R.closedAt).gainYen)} L${cx(12)} ${cy(res(R.closedAt).gainYen)}`); $('#pKept').setAttribute('opacity', 1); $('#pHeld').setAttribute('opacity', 1);
      for (let m = R.closedAt + 1; m <= 12; m++) { await step(m, true); if (!$('#decide')) return; }
      await FX.wait(400); ending(true);
    }
    function ending(fresh) {
      const k = R.closedAt, held = res(12), mine = res(k), B = J.bestExit(P);
      if (k < 12) { $('#pKept').setAttribute('d', `M${cx(k)} ${cy(mine.gainYen)} L${cx(12)} ${cy(mine.gainYen)}`); $('#pKept').setAttribute('opacity', 1); $('#pHeld').setAttribute('d', pt(k, 12)); $('#pHeld').setAttribute('opacity', 1); }
      setYou(pt(0, k)); $('#dotYou').setAttribute('cx', cx(k)); $('#dotYou').setAttribute('cy', cy(mine.gainYen));
      const ly = $('#lblYou'), lh = $('#lblHeld');
      if (k < 12) { ly.setAttribute('x', cx(12) + 8); ly.setAttribute('y', cy(mine.gainYen) + 5); ly.textContent = `You ${J.fmt.yenSigned(mine.gainYen)}`; }
      lh.setAttribute('x', cx(12) + 8); lh.setAttribute('y', cy(held.gainYen) + (k < 12 && Math.abs(cy(held.gainYen) - cy(mine.gainYen)) < 20 ? 22 : 5)); lh.textContent = k < 12 ? `Ken ${J.fmt.yenSigned(held.gainYen)}` : `You ${J.fmt.yenSigned(held.gainYen)}`;
      tick.set('142 YEN', { instant: !fresh, label: '142 yen per dollar' }); $('#monthL').textContent = 'The year is over';
      const gv = $('#gainV'); gv.textContent = J.fmt.yenSigned(mine.gainYen); gv.classList.toggle('neg', mine.gainYen < 0); $('#gainLab').textContent = k < 12 ? `You kept, cashing out in month ${k}` : 'Your result, holding to the end'; $('#gainSum').textContent = sum(mine);
      $('#news').textContent = J.rideEnding(k, P); $('#news').classList.add('alert');
      sayKen(J.kenEnding(k, P));
      $('#decide').innerHTML = `<p class="verdict">${esc(J.exitVerdict(k, P)).replace(/ ([+−]?¥)/g, '\u00a0$1')} Your credit for this step is saved; another year is only for fun.</p>`; const rl = $('#ctrl .rule'); if (rl) rl.hidden = true;
      if (!$('#again')) $('#nextRow').insertAdjacentHTML('beforeend', ' <button type="button" class="btn small ghost" id="again">Play another year</button>');
      $('#again').addEventListener('click', () => { R.month = 0; R.closedAt = null; R.seed = J.newSeed(); R.started = false; save(); showGame(st); });
      if (!S.done.game) finishStep(st); else if (S.log.carry.done) { S.log.carry.value = J.rideValue(k, R.seed); save(); }
      showNext(fresh);
    }
  }

  // ---------------- step 12: reply to Travis ----------------
  function showReply(st) {
    const N = C.note;
    frame(st, {
      pic: `<div class="postcard"><img src="assets/img/hiroshige-saruwaka-night.webp" alt="Utagawa Hiroshige, Night View of Saruwaka-machi, 1856: a moonlit street of theaters in Edo, the city now called Tokyo." width="900" height="1360"><p class="cap">The postcard Travis sent: Hiroshige, <i>Night View of Saruwaka-machi</i>, 1856. Art Institute of Chicago, public domain (CC0).</p></div><div class="textmsg"><b>Travis</b>The yen is cheap. A dollar buys 150 of them!</div>`,
      worked: `<aside class="worked" aria-label="What you worked out"><h2><span class="tag">From your steps</span>Numbers you can use</h2><div class="wlines"><div class="wl"><span class="l">The apple: Tokyo against Chicago</span><span class="v">$1.33 vs $1.00</span></div><div class="wl"><span class="l">The Big Mac: Japan against the U.S.</span><span class="v">$3.08 vs $6.22</span></div><div class="wl"><span class="l">Yen per dollar for the same burger price</span><span class="v">80.4, not 162</span></div></div><p>The apple and the Big Mac point different ways. Either way, the 150 alone tells you nothing.</p></aside>`,
      ctrl: `<div class="write"><label for="memo">${esc(N.label)}</label><textarea id="memo" spellcheck="true" aria-describedby="wc">${esc(S.memo)}</textarea><p class="wc" id="wc" aria-live="polite"></p></div><div class="actions" id="acts"><button type="button" class="btn small ghost" id="hintBtn">Hint</button><span class="free">Any reply of 30 words or more earns the credit.</span></div><div class="hintbox" id="hintBox"></div>`,
    });
    const ta = $('#memo'), wc = () => { const n = h.wordCount(ta.value), el = $('#wc'); el.textContent = n >= N.minWords ? `${n} words. Done: your reply prints on your receipt. Press Get your receipt below.` : `${n} words so far. Saved as you type; it counts once it reaches ${N.minWords} words.`; el.classList.toggle('ok', n >= N.minWords); };
    let tmr = null;
    ta.addEventListener('input', () => { clearTimeout(tmr); wc(); tmr = setTimeout(() => { const ok = D.judgeNote(ta.value).ok; if (ok || !S.done.reply) S.memo = ta.value; if (ok && !S.done.reply) { finishStep(st); fb('ok', '<span class="tag">Saved.</span> Your reply will print on your receipt.'); showNext(false); sfx.ok(); } save(); }, 400); });
    $('#hintBtn').addEventListener('click', () => { const e = S.log.note; e.help = Math.max(e.help || 0, 1); save(); $('#hintBox').innerHTML = `<b>Hint.</b> ${esc(st.hint)}`; $('#hintBtn').hidden = true; });
    wc(); if (S.done.reply) fb('ok', '<span class="tag">Saved.</span> Your reply will print on your receipt.');
  }

  // ---------------- the first screen ----------------
  function showStart() {
    main.innerHTML = `<section class="start on-dark" aria-labelledby="startT"><div><p class="kicker">${esc(LS.START.kicker)}</p><h1 id="startT">The Currency Desk</h1>
        <p class="lede">${esc(LS.START.lede)}</p><p class="plan">${esc(LS.START.plan)}</p><p class="cr">${esc(LS.START.credit)}</p>
        <button type="button" class="btn" id="startBtn">${S && stepsDone() ? `Continue: step ${Math.max(1, idx(S.at) + 1)} of ${STEPS.length}` : 'Start'}</button></div>
      <div class="poster"><div class="board big" role="img" aria-label="Departures board: The Currency Desk. Chicago to Tokyo. 12 steps, 1 trade."><p class="board-head"><span><span class="jp">出発</span>Departures</span><small>Chicago O’Hare</small></p><div class="board-rows">${flapRow('fl-1', 18)}${flapRow('fl-2', 18)}${flapRow('fl-3', 18)}</div></div>
        <div class="print"><img src="assets/img/hiroshige-saruwaka-night.webp" alt="" width="150" height="227"><span>Tokyo, then called Edo: Hiroshige, <i>Night View of Saruwaka-machi</i>, 1856. Art Institute of Chicago, CC0.</span></div></div></section>`;
    (async () => { const a = flap('fl-1'), b = flap('fl-2'), c = flap('fl-3'); await FX.wait(200); if (!a) return; a.set('THE CURRENCY DESK', { stagger: 40 }); await FX.wait(450); if (!$('#fl-2')) return; b.set('CHICAGO TO TOKYO'); await FX.wait(300); if (!$('#fl-3')) return; c.set('12 STEPS, 1 TRADE'); })();
    $('#startBtn').addEventListener('click', () => { if (!S) begin(h.newCode()); go(S.at && S.at !== 'start' ? S.at : STEPS[0].id); });
    $('#startBtn').focus({ preventScroll: true });
  }

  // ---------------- the receipt ----------------
  function wrap(g, text, maxW, maxLines) { const words = String(text).replace(/\s+/g, ' ').trim().split(' '); const lines = []; let cur = ''; for (const w of words) { const t2 = cur ? cur + ' ' + w : w; if (g.measureText(t2).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t2; } if (cur) lines.push(cur); if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += ' …'; } return lines; }
  async function receiptBlob() {
    try { await document.fonts.ready; } catch (e) { /* fonts optional */ }
    const payload = D.makePayload(S.code, S.log, S.memo), done = recDone(), pts = LS.pointsForSteps(LS.stepsFromRecords(STEPS, (r) => S.log[r].done), STEPS.length, D.POINTS), n = STEPS.length, sd = stepsDone();   // points by the rubric's twelve steps, as verify.html counts them
    const W = 1200, H = 1700, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const DSP = '"Big Shoulders Display", "Arial Narrow", sans-serif', BOD = '"Atkinson Hyperlegible Next", Arial, sans-serif';
    const rr = (x, y, w, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    g.fillStyle = '#B3DDF2'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#FBF6EA'; rr(40, 40, W - 80, H - 80, 28); g.fill();
    g.fillStyle = '#13234F'; rr(40, 40, W - 80, 230, 28); g.fill(); g.fillRect(40, 200, W - 80, 70);
    g.fillStyle = '#F7C548'; g.font = `800 26px ${DSP}`; g.fillText('RECEIPT', 90, 100);
    g.fillStyle = '#FBF6EA'; g.font = `900 80px ${DSP}`; g.fillText(C.story.title, 90, 182);
    g.font = `24px ${BOD}`; g.fillStyle = '#C3CDE6'; g.fillText(C.story.kicker, 90, 236);
    g.fillStyle = '#B3DDF2'; for (let x = 70; x < W - 60; x += 28) { g.beginPath(); g.arc(x, 300, 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#4A5577'; g.font = `800 22px ${DSP}`; g.fillText('DESK CODE', 90, 360); g.fillStyle = '#0F1A33'; g.font = `900 66px ${DSP}`; g.fillText(h.fmtCode(S.code), 90, 424);
    g.fillStyle = done === D.STEPS.length ? '#146B43' : '#8A5A00'; rr(90, 460, W - 180, 110, 16); g.fill();
    g.fillStyle = '#fff'; g.font = `900 56px ${DSP}`; g.fillText(`Points: ${pts} / ${D.POINTS}`, 124, 534);
    g.font = `24px ${BOD}`; g.textAlign = 'right'; g.fillText(`${sd} of ${n} steps complete, graded on completion`, W - 124, 530); g.textAlign = 'left';
    const colW = (W - 180 - 20) / 2;
    STEPS.forEach((s, k) => { const x = 90 + (k % 2) * (colW + 20), y = 600 + Math.floor(k / 2) * 62, ok = !!S.done[s.id];
      g.fillStyle = ok ? '#DDF5E8' : '#FBE2E0'; rr(x, y, colW, 52, 10); g.fill(); g.fillStyle = ok ? '#146B43' : '#A8261E'; g.font = `800 25px ${DSP}`; g.fillText(`${ok ? '✓' : '✗'}  ${k + 1}. ${s.name}`, x + 16, y + 35); });
    let y = 600 + 6 * 62 + 34;
    g.fillStyle = '#13234F'; g.font = `800 28px ${DSP}`; g.fillText(J.rideReceiptLine(S.ride.closedAt, J.pathOf(S.ride.seed)), 90, y); y += 54;
    g.fillStyle = '#0F1A33'; g.font = `800 28px ${DSP}`; g.fillText(C.note.receiptHeading, 90, y); y += 38;
    g.font = `23px ${BOD}`; (S.memo.trim() ? wrap(g, S.memo, W - 180, 9) : ['(no reply yet)']).forEach((ln, i) => g.fillText(ln, 90, y + i * 33));
    g.fillStyle = '#4A5577'; g.font = `21px ${BOD}`; g.fillText('Issued ' + new Date(payload.issued).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }), 90, H - 170);
    g.fillStyle = '#0F1A33'; g.font = 'bold 28px ui-monospace, Menlo, monospace'; g.fillText('Verification code  ' + D.shortCode(payload.sum), 90, H - 128);
    g.fillStyle = '#4A5577'; g.font = `19px ${BOD}`; g.fillText('Instructors: enter the points shown above. To spot-check, open ' + C.verifyUrl.replace('https://', ''), 90, H - 88);
    const blob = await new Promise((res) => cv.toBlob(res, 'image/png')); const bytes = new Uint8Array(await blob.arrayBuffer());
    return { blob: new Blob([D.addTextChunk(bytes, D.encodeReceipt(payload))], { type: 'image/png' }), url: cv.toDataURL('image/png'), payload, pts, done };
  }
  async function showReceipt() {
    const all = stepsDone() === STEPS.length, open = STEPS.filter((s) => !S.done[s.id]);
    main.innerHTML = `<section class="step" data-id="receipt" aria-labelledby="stepT"><div class="left"><figure class="pic" id="pic"><p>Drawing your receipt…</p></figure></div>
      <div class="right"><div class="card head"><p class="kicker">Your receipt</p><h1 id="stepT">${all ? 'Every step is complete' : 'A few steps are still open'}</h1><p class="ask">${all ? 'Download your receipt (a PNG image) and upload that file to The Currency Desk assignment in Unit 12.' : 'Finish the open steps for full credit, then download your receipt.'}</p></div>
      <div class="card ctrl"><p id="ptsLine" class="ask"></p>${open.length ? `<ul class="openlist">${open.map((s) => `<li><span>✗ ${idx(s.id) + 1}. ${esc(s.name)}</span><button type="button" class="btn small ghost" data-go="${s.id}">Go there</button></li>`).join('')}</ul>` : ''}
        <div class="next"><a class="btn" id="dl" href="#" download>Download your receipt</a></div>
        <p class="credit-line">Upload the downloaded file itself, not a screenshot: the instructor’s checker reads data stored inside it. If you finish more steps later, download a new one.</p></div></div></section>`;
    $$('[data-go]', main).forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
    const r = await receiptBlob(); if (!$('#dl')) return;
    $('#ptsLine').textContent = `${r.pts} of ${D.POINTS} points. ${stepsDone()} of ${STEPS.length} steps complete.`;
    $('#pic').innerHTML = `<img class="passprev" src="${r.url}" alt="Receipt: desk code ${h.fmtCode(S.code)}, ${r.pts} of ${D.POINTS} points, ${stepsDone()} of ${STEPS.length} steps complete, verification code ${D.shortCode(r.payload.sum)}.">`;
    const dl = $('#dl'); dl.href = URL.createObjectURL(r.blob); dl.setAttribute('download', C.filePrefix + '_' + h.fmtCode(S.code) + '.png');
  }

  // ---------------- routing ----------------
  function go(id) {
    if (!S) return showStart();
    if (id === 'start') { S.at = 'start'; save(); renderRoute(); return showStart(); }
    if (id !== 'receipt' && !stepById(id)) id = STEPS[0].id;
    S.at = id; save(); renderRoute();
    if (id === 'receipt') showReceipt();
    else { const st = stepById(id); if (st.game) showGame(st); else if (st.note) showReply(st); else showItems(st); }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); main.focus({ preventScroll: true });
  }

  // ---------------- boot ----------------
  setSound(!!store.get(KEY + ':sound'));
  {
    const last = store.get(KEY + ':last'), saved = last ? store.get(KEY + ':' + last) : null, oldLast = store.get(OLD + ':last');
    if (saved && saved.code) { begin(saved.code, saved); if (S.at && S.at !== 'start') go(S.at); else { renderRoute(); showStart(); } }
    else if (oldLast && fromOld(oldLast)) { begin(oldLast, fromOld(oldLast)); renderRoute(); showStart(); }
    else { renderRoute(); showStart(); }
  }

  // ---------------- self-checks (interactive-health contract) ----------------
  const checks = []; const reg = (name, fn) => checks.push({ name, fn });
  window.__selfCheck = async () => { const out = []; for (const c of checks) { try { const r = await c.fn(); out.push(r === true || r === undefined ? { name: c.name, ok: true } : r === false ? { name: c.name, ok: false } : { name: c.name, ok: !!r.ok, detail: r.detail }); } catch (e) { out.push({ name: c.name, ok: false, detail: String(e) }); } } return { ok: out.every((x) => x.ok), checks: out }; };
  reg('a screen rendered', () => main.textContent.trim().length > 120 || { ok: false, detail: 'the screen is empty' });
  reg('twelve steps cover all ten records', () => { const st = LS.build(D.buildTasks('SELFCHEK')); return (st.length === 12 && D.STEPS.every((s) => st.some((x) => x.rec === s.id))) || { ok: false, detail: 'step map' }; });
  reg('every box accepts its answer and rejects a wrong one', () => { for (const st of LS.build(D.buildTasks('SELFCHEK'))) for (const it of st.items || []) if (it.type === 'box') { if (!LS.judgeBox(it, String(it.answer)).ok) return { ok: false, detail: st.id + '.' + it.id + ' rejects its answer' }; if (LS.judgeBox(it, String(it.answer * 1.3 + 7)).ok) return { ok: false, detail: st.id + '.' + it.id + ' accepts a wrong answer' }; } return true; });
  reg('each task accepts its own answer and rejects a wrong one', () => { for (const t of D.buildTasks('SELFCHEK')) { if (!C.judgeTask(t, C.selfAnswer(t, h), h).ok) return { ok: false, detail: t.id + ' rejects its own answer' }; if (C.judgeTask(t, C.selfWrong(t, h), h).ok) return { ok: false, detail: t.id + ' accepts a wrong answer' }; } return true; });
  reg('every question grades its key right and the rest wrong', () => C.quiz.every((q, qi) => q.options.every((_, j) => D.judgeQuiz(qi, j).ok === (j === q.answer))) || { ok: false, detail: 'a quiz key is off' });
  reg('the split-flap flips', async () => { const el = document.createElement('span'); const f = FX.Flap(el, 3); await f.set('150', { instant: true }); return f.text === '150' || { ok: false, detail: 'flap shows ' + f.text }; });
  reg('holding the yen trade to the end loses 105,000 yen', () => Math.abs(J.closeResult(12, J.pathOf(J.newSeed())).gainYen + 105000) < 1e-6 || { ok: false, detail: 'carry' });
  reg('the yen history is present', () => (window.YEN_HISTORY || []).length > 600 || { ok: false, detail: 'history data missing' });
  reg('receipt PNG round-trips its payload', async () => {
    const code = 'SELFCHEK', tasks = D.buildTasks(code), log = {};
    D.STEPS.forEach((s) => { if (s.kind === 'check') log[s.id] = { done: true, choice: C.quiz[s.quiz].answer }; else if (s.kind === 'task') log[s.id] = Object.assign({ done: true }, C.selfAnswer(tasks.find((x) => x.id === s.id), h)); else log[s.id] = { done: true }; });
    log.carry.value = 'closed:6';
    const p = D.makePayload(code, log, Array(C.note.minWords + 1).fill('word').join(' ')), bytes = D.addTextChunk(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]), D.encodeReceipt(p));
    const back = D.decodeReceipt(D.readTextChunk(bytes)), v = D.verifyPayload(back);
    return (v.checksumOk && v.points === D.POINTS) || { ok: false, detail: JSON.stringify(v.problems) };
  });
  window.Desk = D; window.__state = () => S; window.__steps = () => STEPS;
})();
