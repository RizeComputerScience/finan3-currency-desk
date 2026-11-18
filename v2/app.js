/* The Currency Desk v2: the page. Version 1's core (config.js, desk-engine.js with DESK_NO_UI) judges every step and builds
   the receipt payload; journey.js holds the trip's logic and words; fx.js and art.js draw and animate. */
(function () {
  'use strict';
  const D = DeskEngine.make(window.DESK), C = D.C, h = DeskEngine.h, J = window.JOURNEY, A = window.ART, FX = window.FX, sfx = FX.sfx;
  const F = J.fmt, KEY = 'rize-finan3-w12-currency-v2';
  const $ = (s, el) => (el || document).querySelector(s), $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  const IDS = D.STEPS.map((s) => s.id), idx = (id) => IDS.indexOf(id), stopOf = (id) => J.STOPS[idx(id)];
  const beatEl = $('#beat');

  // ---------------- state ----------------
  let S = null;
  const blankLog = () => { const l = {}; IDS.forEach((id) => { l[id] = { done: false, attempts: 0, help: 0 }; }); return l; };
  function begin(code, saved) {
    S = { code: h.normCode(code), log: blankLog(), memo: '', at: IDS[0], ride: { day1: 0, month: 0, closedAt: null }, flown: false, market: [] };
    if (saved) { Object.assign(S.log, saved.log || {}); S.memo = saved.memo || ''; S.at = saved.at || IDS[0]; S.ride = Object.assign(S.ride, saved.ride || {}); S.flown = !!saved.flown; S.market = saved.market || []; }
    S.tasks = D.buildTasks(S.code); save();
  }
  function save() { if (!S) return; const { tasks, ...keep } = S; store.set(KEY + ':' + S.code, keep); store.set(KEY + ':last', S.code); }
  const task = (id) => S.tasks.find((t) => t.id === id);
  const L = (id) => S.log[id];
  const doneCount = () => IDS.filter((id) => L(id).done).length;
  function markDone(id, extra) { const e = L(id); Object.assign(e, extra || {}); if (!e.done) { e.done = true; e.at = new Date().toISOString(); } save(); renderRoute(); }
  function attempt(id) { L(id).attempts = (L(id).attempts || 0) + 1; save(); }

  // ---------------- chrome: backdrop, route, sound, footer ----------------
  let sceneKey = '';
  function setScene(name, sky, variant) {
    document.body.dataset.sky = sky; const k = name + (variant || '');
    if (k === sceneKey) return; sceneKey = k;
    const bd = $('#backdrop'); bd.innerHTML = A.BACKDROPS[name](variant);
  }
  function renderRoute() {
    const cur = S ? S.at : null;
    const items = J.STOPS.map((s, i) => { const d = S && L(s.id).done; return `<li><button type="button" data-go="${s.id}" class="${d ? 'done' : ''}" ${cur === s.id ? 'aria-current="step"' : ''} aria-label="Stop ${i + 1}, ${esc(s.title)}${d ? ', done' : ''}">${i + 1}</button></li>`; });
    $('#route').innerHTML = `<li class="city" aria-hidden="true">ORD</li>${items.join('')}<li><button type="button" data-go="receipt" class="end" ${cur === 'receipt' ? 'aria-current="step"' : ''} aria-label="Your boarding pass and receipt">✈</button></li><li class="city" aria-hidden="true">HND</li>`;
    $$('#route button').forEach((b) => b.addEventListener('click', () => { if (S) go(b.dataset.go); }));
    $('#codeLine').innerHTML = S ? `Desk code <b>${h.fmtCode(S.code)}</b>. Your progress saves in this browser. To continue on another computer, type this code on the first screen.` : 'Graded on completion. A wrong answer never costs points.';
  }
  const soundBtn = $('#soundBtn');
  function setSound(v) { sfx.on = v; soundBtn.setAttribute('aria-pressed', String(v)); $('.tool-tx', soundBtn).textContent = v ? 'Sound on' : 'Sound off'; store.set(KEY + ':sound', v); }
  soundBtn.addEventListener('click', () => { setSound(!sfx.on); if (sfx.on) sfx.ok(); });

  // ---------------- one stop's frame ----------------
  function nextOf(id) { const i = idx(id); return i < IDS.length - 1 ? IDS[i + 1] : 'receipt'; }
  function nextLabel(id) { const n = nextOf(id); return n === 'receipt' ? 'Get your boarding pass' : 'Next stop: ' + stopOf(n).title; }
  function frame(id, o) {
    const i = idx(id), st = J.STOPS[i];
    beatEl.innerHTML = `<div class="beat" data-id="${id}">
      <div class="head"><p class="stopno">Stop ${i + 1} of ${IDS.length}</p><h1>${esc(st.title)}</h1>${o.prompt ? `<p class="prompt">${o.prompt}</p>` : ''}<div class="helps" id="helps"></div><div id="helptext"></div></div>
      <div class="world">${o.ex ? `<div class="exobj" role="group" aria-label="Worked example">${o.ex}</div>` : ''}${o.world || ''}
        <div class="ctrl">${o.ctrl || ''}<div id="fb" class="fb" role="status" aria-live="polite"></div>
        <div class="next" id="nextRow" ${L(id).done ? '' : 'hidden'}><button type="button" class="btn" id="nextBtn">${esc(nextLabel(id))}</button></div></div></div></div>`;
    $('#nextBtn').addEventListener('click', () => leave(id));
  }
  function leave(id) { const n = nextOf(id); if (id === 'convert' && !S.flown) return fly(() => go(n)); go(n); }
  function fb(cls, html) { const e = $('#fb'); if (!e) return; e.className = 'fb ' + (cls || ''); e.innerHTML = html; const r = e.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 70) e.scrollIntoView({ block: 'nearest', behavior: FX.reduced() ? 'auto' : 'smooth' }); }
  function showNext() { const n = $('#nextRow'); if (n) n.hidden = false; }
  function win(id, html, extra) { markDone(id, extra); fb('ok', `<b class="fbtag">Right.</b> ${html.replace(/^Right\.\s*/, '')}`); sfx.ok(); showNext(); }
  // Help: two levels, never costs points; the level prints for the instructor.
  function helps(id, how, answer, onAnswer) {
    const box = $('#helps'); if (!box) return;
    box.innerHTML = `<button type="button" class="link" data-l="1">Show me how</button><button type="button" class="link" data-l="2">Show me the answer</button>`;
    $$('button', box).forEach((b) => b.addEventListener('click', () => {
      const l = +b.dataset.l; L(id).help = Math.max(L(id).help || 0, l); save();
      $('#helptext').innerHTML = `<p class="helptext">${l === 1 ? how() : answer()}</p>`;
      if (l === 2 && onAnswer) onAnswer();
    }));
  }
  // A number box inside an equation.
  const numIn = (id, ph, wide, pre) => `<label class="num-in" id="w-${id}"><span class="sr">${esc(ph)}</span>${pre ? `<span aria-hidden="true">${pre}</span>` : ''}<input id="${id}" inputmode="decimal" autocomplete="off" class="${wide ? 'wide' : ''}"><span class="mk" aria-hidden="true"></span></label>`;
  function markIn(id, ok) { const w = $('#w-' + id); if (!w) return; w.classList.toggle('ok', ok === true); w.classList.toggle('bad', ok === false); $('.mk', w).textContent = ok === true ? '✓' : ok === false ? '✗' : ''; }
  const val = (id) => { const e = $('#' + id); return e ? e.value : ''; };
  const onEnter = (id, fn) => { const e = $('#' + id); if (e) e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); fn(); } }); };

  // Quiz tickets (version 1's questions and feedback, order shuffled as version 1 did).
  const optOrder = (q) => { const hs = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; }; return q.options.map((_, j) => j).sort((a, b) => hs(q.q + '|' + a) - hs(q.q + '|' + b)); };
  function tickets(id, qi, mount, after) {
    const q = C.quiz[qi], ord = optOrder(q), e = L(id);
    mount.innerHTML = `<p class="q" id="q-${id}">${esc(q.q)}</p><ul class="tickets" role="list" aria-labelledby="q-${id}">${ord.map((j) => `<li><button type="button" class="ticket${e.done && +e.choice === j ? ' right' : ''}" data-j="${j}">${esc(q.options[j])}</button></li>`).join('')}</ul>`;
    $$('.ticket', mount).forEach((b) => b.addEventListener('click', () => {
      const j = +b.dataset.j; attempt(id); const ok = D.judgeQuiz(qi, j).ok;
      $$('.ticket', mount).forEach((x) => x.classList.remove('wrong'));
      if (ok) { $$('.ticket', mount).forEach((x) => x.classList.remove('right')); b.classList.add('right'); win(id, q.why[j], { choice: String(j) }); if (after) after(); }
      else { b.classList.add('wrong'); fb('bad', esc(q.why[j]) + ' Try another ticket.'); sfx.nope(); }
    }));
    if (e.done) { fb('ok', `<b class="fbtag">Right.</b> ${esc(q.why[q.answer].replace(/^Right\.\s*/, ''))}`); if (after) after(true); }
  }

  // ---------------- start ----------------
  function showStart() {
    S = null; renderRoute(); setScene('hall', 'day');
    const last = store.get(KEY + ':last'), dare = J.parseRide(new URLSearchParams(location.search).get('vs')), vs = dare ? dare.k : null;
    beatEl.innerHTML = `<div class="beat start">
      <div class="head"><p class="stopno">Financial Markets and Institutions, Unit 12</p><h1>The Currency Desk</h1>${dare ? `<p class="dare">${esc(J.challengeLine(dare.k, J.pathOf(dare.seed)))}</p>` : ''}<p class="prompt">${esc(J.PROMPTS.start)}</p>
        <div class="row"><button type="button" class="btn" id="playBtn">${vs ? 'Take the trade' : 'Play the yen trade'}</button></div>
        <div class="tripdoor"><p class="prompt">${esc(J.PROMPTS.trip)}</p><div class="row"><button type="button" class="btn ghost" id="goBtn">Take the whole trip</button></div>
        <p class="q" style="margin-top:22px">Started on another computer?</p>
        <form class="codein" id="codeForm"><label class="sr" for="codeIn">Your desk code</label><input id="codeIn" placeholder="ABCD-EFGH" maxlength="9" autocomplete="off" spellcheck="false"><button class="btn small ghost" type="submit">Continue</button></form>
        ${last ? `<p><button type="button" class="link" id="resume">Continue desk ${esc(h.fmtCode(last))}</button></p>` : ''}
        <div id="fb" class="fb" role="status" aria-live="polite"></div></div></div>
      <div class="world">${boardHTML('start')}</div></div>`;
    runBoard('start');
    $('#goBtn').addEventListener('click', () => { begin(h.newCode()); showPass(); });
    $('#playBtn').addEventListener('click', () => { const saved = last ? store.get(KEY + ':' + last) : null; if (saved && saved.code) begin(saved.code, saved); else begin(h.newCode()); S.quick = true; S.ride.month = 0; S.ride.closedAt = null; S.ride.seed = dare && dare.seed ? dare.seed : J.newSeed(); save(); go('carry'); });
    $('#codeForm').addEventListener('submit', (ev) => { ev.preventDefault(); const c = $('#codeIn').value; if (!h.validCode(c)) { fb('bad', 'A desk code has eight letters and numbers, like ABCD-EFGH. Check it on your receipt or your other screen.'); return; } const n = h.normCode(c); begin(n, store.get(KEY + ':' + n)); go(S.at); });
    if (last) $('#resume').addEventListener('click', () => { begin(last, store.get(KEY + ':' + last)); go(S.at); });
  }
  function showPass() {
    renderRoute();
    $('.world', beatEl).insertAdjacentHTML('beforeend', `<div class="start-pass" role="group" aria-label="Boarding pass"><div><div class="lbl">Desk code</div><div class="code">${h.fmtCode(S.code)}</div></div><div class="route-txt">ORD ✈ HND</div><div class="lbl" style="grid-column:1/-1">Keep this code to continue on another computer.</div></div>`);
    $('.tripdoor', beatEl).innerHTML = `<p class="prompt">Your boarding pass is printed. Your first stop is the departures board.</p><button type="button" class="btn" id="board1">Go to the board</button>`;
    $('#board1').addEventListener('click', () => go(IDS[0])); $('#board1').focus();
  }

  // the departures board
  function boardHTML(kind) {
    const rows = kind === 'start' ? [['title', 18], ['r1', 18], ['r2', 18], ['r3', 18]] : [['when', 10], ['rate', 7]];
    if (kind === 'start') return `<div class="board" role="img" aria-label="Departures board: The Currency Desk. Borrow yen at 0.1%. Earn 5% in dollars. When do you exit?"><p class="board-head"><span><span class="jp">出発</span>Departures</span><small>Chicago O’Hare</small></p><div class="board-rows">${rows.map(([k, w]) => `<div class="board-row ${k === 'title' ? 'title' : ''}"><span id="fl-${k}" data-w="${w}"></span></div>`).join('')}</div></div>`;
    return `<div class="board two"><p class="board-head"><span><span class="jp">為替</span>One dollar buys</span><small>Yen per U.S. dollar</small></p><div class="board-rows"><div class="board-row"><span id="fl-when" data-w="10"></span><span id="fl-rate" data-w="7"></span></div></div><p class="board-cap" id="boardCap"></p></div>`;
  }
  async function runBoard(kind) {
    const mk = (k) => { const e = $('#fl-' + k); return e ? FX.Flap(e, +e.dataset.w) : null; };
    if (kind === 'start') {
      const t = mk('title'), a = mk('r1'), b = mk('r2'), c = mk('r3');
      await FX.wait(250); t.set('THE CURRENCY DESK', { stagger: 45 }); await FX.wait(500);
      a.set('BORROW YEN AT 0.1%'); await FX.wait(300); b.set('EARN 5% IN DOLLARS'); await FX.wait(300); c.set('WHEN DO YOU EXIT?');
      return;
    }
    const w = mk('when'), r = mk('rate'), cap = $('#boardCap');
    w.set('JAN 2022', { instant: true, label: 'January 2022' }); r.set('115 YEN', { instant: true, label: '115 yen' }); cap.textContent = 'January 2022: one dollar buys 115 yen.';
    if (kind === 'q1wait') return;
    await FX.wait(kind === 'q1now' ? 50 : 1100); if (!$('#fl-when')) return;
    w.set('OCT 2022', { label: 'October 2022' }); await r.set('150 YEN', { label: '150 yen', maxSteps: 9 }); if (cap.isConnected) cap.textContent = 'October 2022: one dollar buys 150 yen.';
  }

  // ---------------- stop 1: why did the board change? ----------------
  function stopQ1() {
    setScene('hall', 'day'); const e = L('q1'), q = C.quiz[0];
    frame('q1', { prompt: esc(J.PROMPTS.q1),
      world: boardHTML('q1') + `<div class="money" role="group" aria-label="Where does the money go?"><button type="button" class="pile" data-j="0"><span class="pile-ic usd" aria-hidden="true">$</span><b>Into dollars</b><span>The Fed pays above 4%</span></button><button type="button" class="pile" data-j="1"><span class="pile-ic jpy" aria-hidden="true">¥</span><b>Into yen</b><span>Japan pays below zero</span></button></div>`,
      ctrl: '' });
    runBoard(e.done ? 'q1' : 'q1wait');
    $$('.pile').forEach((b) => b.addEventListener('click', () => {
      const j = +b.dataset.j; attempt('q1');
      if (D.judgeQuiz(0, j).ok) { $$('.pile').forEach((x) => { x.classList.toggle('chosen', x === b); x.classList.remove('wrong'); }); fb('info', 'Investors everywhere do the same. Watch the board.'); runBoard('q1now'); setTimeout(() => win('q1', esc(q.why[0]), { choice: String(j) }), FX.reduced() ? 0 : 1500); }
      else { b.classList.add('wrong'); fb('bad', 'In 2022 yen in Japan paid less than nothing, and dollars paid above 4%. Money moves to the currency that pays more: try the other pile.'); sfx.nope(); }
    }));
    if (e.done) { $$('.pile').forEach((x) => x.classList.toggle('chosen', x.dataset.j === '0')); fb('ok', `<b class="fbtag">Right.</b> ${esc(q.why[0].replace(/^Right\.\s*/, ''))}`); }
  }

  // ---------------- stop 2: change your money ----------------
  function dollarNotes(d) { const out = []; let r = d; while (r >= 100) { out.push(100); r -= 100; } if (r >= 50) { out.push(50); r -= 50; } return out; }
  function trayYen(el, y, animate) {
    const n = J.notesFor(Math.round(y)), list = [...Array(n.big).fill(10000), ...Array(n.small).fill(1000)];
    el.innerHTML = `<span class="lbl">Yen counted out</span><span class="count">${F.yen(0)}</span>`;
    const cnt = $('.count', el); let sum = 0;
    list.forEach((v, i) => setTimeout(() => { if (!el.isConnected) return; el.insertAdjacentHTML('beforeend', A.yenNote(v).replace('class="note"', `class="note${animate ? ' dl' : ''}"`)); sum += v; cnt.textContent = F.yen(sum + (i === list.length - 1 ? n.rest : 0)); if (animate) sfx.note(); }, animate && !FX.reduced() ? 160 * i : 0));
  }
  function stopConvert() {
    setScene('counter', 'day'); const t = task('convert'), e = L('convert');
    const ex = `<div class="slip torn ex" role="group" aria-label="Worked example"><span class="label-chip">Worked for you</span><h3>The traveller ahead of you</h3>
      <div class="eq"><span>$300</span><span class="op">×</span><span>150</span><span class="op">=</span><span class="ans">¥45,000</span></div>
      <div class="eq"><span>¥1,200 ramen</span><span class="op">÷</span><span>150</span><span class="op">=</span><span class="ans">$8.00</span></div></div>`;
    const mine = `<div class="slip torn" id="mySlip"><h3>Your slip</h3>
      <div class="eq"><span>${F.usd0(t.D)}</span><span class="op">×</span><span>${t.R}</span><span class="op">=</span>${numIn('c0', 'Yen you get', true, '¥')}</div>
      <div id="mealLine" ${e.done || (e.rows && e.rows[0]) ? '' : 'hidden'}><p style="margin:12px 0 4px;font-size:16px">${esc(J.PROMPTS.convertMeal(t))}</p>
      <div class="eq"><span>${F.yen(t.Y)}</span><span class="op">÷</span><span>${t.R}</span><span class="op">=</span>${numIn('c1', 'The meal in dollars', false, '$')}</div></div></div>`;
    frame('convert', { prompt: esc(J.PROMPTS.convert(t)),
      world: `<div class="booth"><div class="booth-sign"><span class="jp">外貨両替</span><span>Currency Exchange</span></div>
        <div class="booth-rate"><span class="lab">One dollar<br>buys</span><span id="fl-cr" data-w="7"></span></div>
        <div class="booth-body"><div class="tray" id="trayUsd" aria-label="Your dollars on the counter"><span class="lbl">Your dollars</span></div><div class="tray" id="trayYen" aria-label="Yen the clerk counts out"><span class="lbl">Yen counted out</span></div></div>
        <div class="booth-body" style="margin-top:16px">${ex}${mine}</div></div>`,
      ctrl: `<button type="button" class="btn" id="chk">Hand it over</button>` });
    const fl = FX.Flap($('#fl-cr'), 7); fl.set('150 YEN', { instant: true }); setTimeout(() => fl.set(t.R + ' YEN', { label: t.R + ' yen per dollar' }), 600);
    $('#trayUsd').insertAdjacentHTML('beforeend', dollarNotes(t.D).map((v) => A.usdNote(v)).join(''));
    if (e.rows) { if (e.rows[0]) $('#c0').value = e.rows[0]; if (e.rows[1]) $('#c1').value = e.rows[1]; }
    if (e.done) { markIn('c0', true); markIn('c1', true); trayYen($('#trayYen'), t.yen, false); $('#chk').hidden = true; fb('ok', `<b class="fbtag">Right.</b> ${esc(C.praise(t))}`); }
    const check = () => {
      const r0 = val('c0'), mealOpen = !$('#mealLine').hidden, r1 = mealOpen ? val('c1') : '';
      attempt('convert'); const res = C.judgeTask(t, { rows: [r0, r1] }, h), a = res.rowRes[0];
      L('convert').rows = [r0, r1]; save();
      if (!a || !a.ok) { markIn('c0', false); fb('bad', esc(a ? a.msg : 'Type the yen you get.')); sfx.nope(); return; }
      markIn('c0', true);
      if (!mealOpen) { $('#mealLine').hidden = false; trayYen($('#trayYen'), t.yen, true); fb('info', `${F.usd0(t.D)} becomes ${F.yen(t.yen)}. Now the meal.`); $('#chk').textContent = 'Check the meal'; $('#c1').focus(); return; }
      if (!res.ok) { markIn('c1', false); fb('bad', esc(res.rowRes[1] ? res.rowRes[1].msg : res.msg)); sfx.nope(); return; }
      markIn('c1', true); $('#chk').hidden = true; win('convert', esc(C.praise(t)), { rows: [r0, r1] });
    };
    $('#chk').addEventListener('click', check); onEnter('c0', check); onEnter('c1', check);
    helps('convert', () => ($('#mealLine').hidden ? `Dollars to yen, multiply by the rate: ${F.usd0(t.D)} × ${t.R}.` : `Yen to dollars, divide by the rate: ${F.yen(t.Y)} ÷ ${t.R}.`),
      () => `${F.usd0(t.D)} × ${t.R} = ${F.yen(t.yen)}<br>${F.yen(t.Y)} ÷ ${t.R} = ${F.usd2(t.usd)}`);
  }

  // ---------------- the flight ----------------
  function fly(then) {
    const f = $('#flight'); S.flown = true; save();
    f.hidden = false;
    f.innerHTML = `<div class="layer" style="background:#B3DDF2" id="fday"></div><div class="layer" style="background:#13234F;opacity:0" id="fnight"></div>
      <svg class="route-map" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g id="fstars" opacity="0">${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 263) % 1600}" cy="${(i * 97) % 420}" r="${1 + (i % 3)}" fill="#FBF6EA"/>`).join('')}</g>
        <path id="farc" d="M180 640 Q 800 60 1420 600" fill="none" stroke="#FBF6EA" stroke-width="5" stroke-dasharray="2 16" stroke-linecap="round"/>
        <circle cx="180" cy="640" r="12" fill="#C8102E"/><circle cx="1420" cy="600" r="12" fill="#F7C548"/>
        <text x="180" y="700" text-anchor="middle" font-family="Big Shoulders Display" font-weight="900" font-size="44" fill="#FBF6EA">CHICAGO</text>
        <text x="1420" y="660" text-anchor="middle" font-family="Big Shoulders Display" font-weight="900" font-size="44" fill="#FBF6EA">TOKYO</text>
        <g id="fplane"><path d="M-34 0 L 30 -6 C 44 -6, 44 6, 30 6 Z" fill="#FBF6EA"/><path d="M-4 -4 L -20 -34 L -10 -34 L 12 -4 Z M-4 4 L -20 34 L -10 34 L 12 4 Z" fill="#FBF6EA"/><path d="M-30 -2 L -38 -16 L -32 -16 L -24 -2 Z" fill="#C8102E"/></g>
      </svg>
      <div class="arrive" id="farrive"><figure class="poster"><img src="assets/img/hiroshige-saruwaka-night.webp" alt="A woodblock print of a crowded street of theatres at night under a full moon, with lanterns and people walking." width="900" height="1365"><figcaption>Utagawa Hiroshige, <i>Night View of Saruwaka-machi</i>, 1856. Edo, the city now called Tokyo. Art Institute of Chicago, public domain.</figcaption></figure>
        <div><h2><span class="jp">東京</span>Tokyo</h2><p>You land at night with your yen in your pocket.</p><button type="button" class="btn" id="fgo">Walk into the city</button></div></div>
      <button type="button" class="btn small ghost skipf" id="fskip">Skip the flight</button>`;
    const done = () => { f.hidden = true; f.classList.remove('landed'); f.innerHTML = ''; then(); };
    $('#fskip').addEventListener('click', done); $('#fgo').addEventListener('click', done);
    const arc = $('#farc'), pl = $('#fplane'), len = arc.getTotalLength();
    const land = () => { f.classList.add('landed'); $('#fnight').style.opacity = 1; $('#fday').style.opacity = 0; $('#fstars').setAttribute('opacity', 1); $('#farrive').classList.add('show'); $('#fskip').hidden = true; $('#fgo').focus(); };
    if (FX.reduced()) { const p = arc.getPointAtLength(len); pl.setAttribute('transform', `translate(${p.x} ${p.y})`); land(); return; }
    sfx.whoosh(); $('#fskip').focus();
    setTimeout(() => { $('#fnight') && ($('#fnight').style.opacity = 1); $('#fday') && ($('#fday').style.opacity = 0); }, 200);
    FX.tween(3000, (k) => { if (!pl.isConnected) return; const p = arc.getPointAtLength(len * k), q = arc.getPointAtLength(Math.min(len, len * k + 2)); const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI; pl.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`); $('#fstars').setAttribute('opacity', Math.max(0, (k - .4) / .6).toFixed(2)); })
      .then(() => { if (pl.isConnected) land(); });
  }

  // ---------------- stop 3: the apple ----------------
  function stopApple() {
    setScene('street', 'night', 'fruit'); const t = task('apple'), e = L('apple');
    const exTilt = J.tilt(3000 / 150, 25);
    frame('apple', { prompt: esc(J.PROMPTS.apple(t)),
      ex: `<div class="exmini">${A.scale(A.shirt(0, -30, .8), A.shirt(0, -30, .8), 'exScale')}</div><p><span class="label-chip">Worked for you</span><br>A T-shirt: <b>¥3,000 ÷ 150 = $20.00</b>, against $25.00 in Chicago. Tokyo is cheaper by <b>$5.00</b>, so the Chicago shirt sinks.</p>`,
      world: `<div class="awning"><span>くだもの</span></div>
        <div class="scalebox">${A.scale(A.apple(0, -32, 1.1), A.apple(0, -32, 1.1), 'apScale')}
          <div class="tags"><div class="tag" id="tagT"><p class="where"><span class="jp">東京</span>Tokyo</p><p class="price"><span class="jp">りんご</span>¥200</p><div class="eq">¥200 <span class="op">÷</span> 150 <span class="op">=</span> ${numIn('a0', 'Tokyo apple in dollars', false, '$')}</div><button type="button" class="pick" data-c="tokyo">Tokyo is cheaper</button></div>
            <div class="tag" id="tagC"><p class="where">Chicago</p><p class="price">$1.00</p><p class="sub">Already in dollars.</p><button type="button" class="pick" data-c="chicago">Chicago is cheaper</button></div></div></div>
        <div class="slip" id="gapSlip" hidden><h3>How much cheaper?</h3><div class="eq"><span>higher price</span><span class="op">−</span><span>lower price</span><span class="op">=</span>${numIn('a1', 'How much cheaper, in dollars', false, '$')}</div></div>`,
      ctrl: `<p class="q" id="appleQ">Guess first: tap the cheaper city. Then check the Tokyo tag.</p><button type="button" class="btn" id="chk">Check the tag</button>` });
    A.setScale($('#exScale'), exTilt);
    const sc = $('#apScale'); A.setScale(sc, 0); $('.lock', sc).setAttribute('opacity', 1);
    let choice = e.choice || null, stage = 0, guess = null;
    const unlock = (anim) => { $('.lock', sc).setAttribute('opacity', 0); const target = J.tilt(1, t.tokyo) * -1; if (anim) FX.tween(900, (k) => A.setScale(sc, target * k)); else A.setScale(sc, target); $('#tagT .price').innerHTML = `<span class="jp">りんご</span>${F.usd2(t.tokyo)}`; };
    const setChoice = (c) => { choice = c; $$('.pick').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === c))); };
    const toGap = () => { stage = 2; $('#gapSlip').hidden = false; $('#gapSlip .eq').innerHTML = `<span>${F.usd2(Math.max(t.tokyo, t.usd))}</span><span class="op">−</span><span>${F.usd2(Math.min(t.tokyo, t.usd))}</span><span class="op">=</span>${numIn('a1', 'How much cheaper, in dollars', false, '$')}`; onEnter('a1', check); $('#chk').textContent = 'Check the difference'; };
    if (e.rows && e.rows[0]) $('#a0').value = e.rows[0];
    if (e.done) { markIn('a0', true); unlock(false); setChoice('chicago'); toGap(); $('#a1').value = e.rows[1] || ''; markIn('a1', true); $('#chk').hidden = true; fb('ok', `<b class="fbtag">Right.</b> ${esc(C.praise(t))}`); }
    function check() {
      attempt('apple');
      const r0 = val('a0');
      const a = C.judgeTask(t, { rows: [r0, ''] }, h).rowRes[0];
      if (!a.ok) { markIn('a0', false); fb('bad', esc(a.msg)); sfx.nope(); return; }
      markIn('a0', true);
      if (stage === 0) { stage = 1; unlock(true); sfx.flap(); $('#chk').hidden = true; $('#appleQ').textContent = 'Now both prices are in dollars, and the dearer apple sinks.';
        if (guess === t.decision) { setChoice(guess); fb('info', `Your guess holds: the Tokyo apple is ${F.usd2(t.tokyo)}, so Chicago is cheaper. Now, by how much?`); toGap(); $('#chk').hidden = false; $('#a1').focus(); }
        else if (guess) { setChoice(null); fb('info', `The scale tips against your guess: the Tokyo apple is ${F.usd2(t.tokyo)}, more than $1.00. Tap the cheaper city.`); }
        else fb('info', 'Both prices are now in dollars, so the scale can weigh them. Tap the cheaper city.');
        return; }
      if (stage === 1) return;
      const r1 = val('a1'), res = C.judgeTask(t, { rows: [r0, r1], choice }, h);
      L('apple').rows = [r0, r1]; L('apple').choice = choice; save();
      if (!res.ok) { if (res.rowRes[1] && !res.rowRes[1].ok) markIn('a1', false); fb('bad', esc(res.msg.replace(/^.*?: /, ''))); sfx.nope(); return; }
      markIn('a1', true); $('#chk').hidden = true; win('apple', esc(C.praise(t)), { rows: [r0, r1], choice });
    }
    $$('.pick').forEach((b) => b.addEventListener('click', () => {
      if (stage === 0) { guess = b.dataset.c; setChoice(guess); fb('info', `You guessed ${guess === 'tokyo' ? 'Tokyo' : 'Chicago'}. Now check: change the Tokyo price into dollars on its tag.`); $('#a0').focus(); return; }
      setChoice(b.dataset.c); attempt('apple');
      if (b.dataset.c !== t.decision) { fb('bad', 'Compare dollars with dollars: the Tokyo apple is $1.33 and the Chicago apple is $1.00. A bigger number of yen does not mean a higher price.'); sfx.nope(); return; }
      fb('info', 'Yes, Chicago. Now, by how much?'); if (stage < 2) { toGap(); $('#chk').hidden = false; } $('#a1').focus();
    }));
    $('#chk').addEventListener('click', check); onEnter('a0', check);
    helps('apple', () => (stage === 0 ? 'Change the Tokyo price into dollars: divide the yen by the yen a dollar buys, ¥200 ÷ 150.' : 'Subtract the lower dollar price from the higher one.'),
      () => `Tokyo apple in dollars: ¥200 ÷ 150 = $1.33<br>The apple is cheaper in Chicago.<br>How much cheaper: $1.33 − $1.00 = $0.33`);
  }

  // ---------------- stop 4: the Big Mac ----------------
  function stopBigmac() {
    setScene('street', 'night', 'burger'); const t = task('bigmac'), e = L('bigmac'), B = C.BIGMAC, Dl = J.DIAL;
    let rate = Dl.market, choice = e.choice || null;
    const sw = J.SWISS;
    frame('bigmac', { prompt: esc(J.PROMPTS.bigmac(t)),
      ex: `<div class="exmini">${A.dial(0.6, 1.8, sw.market, 'exDial', 'francs per $')}</div><p><span class="label-chip">Worked for you</span><br>Switzerland, same day: <b>7.30 francs ÷ $6.22 = 1.17</b> francs per dollar balances the burgers. The market gave only 0.81, so the Swiss burger cost more in dollars: the franc was overvalued.</p>`,
      world: `<div class="neon" aria-hidden="true">ハンバーガー<small>BURGERS</small></div>
        <div class="bmrow"><div class="scalebox">${A.scale(A.burger(0, -26, 1.15), A.burger(0, -26, 1.15), 'bmScale')}
          <div class="tags"><div class="tag"><p class="where"><span class="jp">日本</span>Japan</p><p class="price">¥500</p><p class="sub" id="jpUsd"></p></div><div class="tag"><p class="where">United States</p><p class="price">$6.22</p><p class="sub">Already in dollars.</p></div></div></div>
        <div class="dialbox"><div class="dial" id="dial" tabindex="0" role="slider" aria-label="Exchange rate, yen per dollar" aria-valuemin="${Dl.min}" aria-valuemax="${Dl.max}">${A.dial(Dl.min, Dl.max, Dl.market, 'dialSvg', 'yen per $')}</div>
          <div class="readout" aria-live="polite"><span class="big" id="dialBig"></span><span id="dialSub"></span><div class="eqline" id="dialEq"></div></div></div></div>
        <div id="bmChoice" hidden style="width:min(100%,640px)"><p class="q">The market said 162. The burger says 80. By this measure, is the yen undervalued or overvalued?</p><div class="row"><button type="button" class="pick" data-c="under">Undervalued: Japan’s Big Mac costs less in dollars</button><button type="button" class="pick" data-c="over">Overvalued: Japan’s Big Mac costs more in dollars</button></div></div>`,
      ctrl: `<p class="q">Turn the dial until the scale is level. The side that costs more in dollars sinks.</p>` });
    // The Swiss example dial sits at its balance point; it is drawn, not interactive.
    const exd = $('.exobj .dial-svg'); A.setDial(exd, sw.target, 0.6, 1.8, 2);
    const sc = $('#bmScale'), dsvg = $('#dial .dial-svg'), dialEl = $('#dial');
    function draw(snapped) {
      A.setDial(dsvg, rate, Dl.min, Dl.max); const jp = J.burgerUsd(rate);
      A.setScale(sc, J.tilt(jp, B.us));
      dialEl.setAttribute('aria-valuenow', (Math.round(rate * 10) / 10).toFixed(1));
      dialEl.setAttribute('aria-valuetext', `${(Math.round(rate * 10) / 10).toFixed(1)} yen per dollar; Japan’s Big Mac costs ${F.usd2(jp)}`);
      $('#jpUsd').textContent = `= ${F.usd2(jp)} at ${(Math.round(rate * 10) / 10)} yen per dollar`;
      $('#dialBig').textContent = `${(Math.round(rate * 10) / 10).toFixed(1)} yen per dollar`;
      const bal = J.dialBalanced(rate);
      $('#dialSub').textContent = Math.abs(rate - Dl.market) < 0.05 ? `The market rate on ${B.date}. Japan’s burger costs ${F.usd2(jp)}, the American one $6.22.` : bal ? 'The two burgers cost the same.' : jp < B.us ? 'Japan’s burger is still cheaper in dollars. Turn toward fewer yen per dollar.' : 'Now Japan’s burger costs more. Turn back toward more yen per dollar.';
      $('#dialEq').textContent = bal ? `¥500 ÷ $6.22 = ${J.fmt.r1(J.DIAL.target)} yen per dollar` : '';
      if (bal) { if (snapped) sfx.ok(); $('#bmChoice').hidden = false; }
    }
    function setRate(v, fromUser) { const before = J.dialBalanced(rate); rate = Math.max(Dl.min, Math.min(Dl.max, v)); if (fromUser) rate = J.dialSnap(rate); if (Math.round(rate) !== Math.round(v)) sfx.tick(); draw(!before && J.dialBalanced(rate)); }
    const fromPoint = (ev) => { const r = dialEl.getBoundingClientRect(), x = ev.clientX - r.left - r.width / 2, y = ev.clientY - r.top - r.height / 2; let a = Math.atan2(x, -y) * 180 / Math.PI; a = Math.max(-135, Math.min(135, a)); return Dl.min + (a + 135) / 270 * (Dl.max - Dl.min); };
    let dragging = false, lastTick = 0;
    dialEl.addEventListener('pointerdown', (ev) => { dragging = true; dialEl.setPointerCapture(ev.pointerId); setRate(fromPoint(ev), true); });
    dialEl.addEventListener('pointermove', (ev) => { if (!dragging) return; const v = fromPoint(ev); if (Math.floor(v) !== lastTick) { lastTick = Math.floor(v); sfx.tick(); } setRate(v, true); });
    dialEl.addEventListener('pointerup', () => { dragging = false; });
    dialEl.addEventListener('keydown', (ev) => { const st = ev.shiftKey ? 10 : 1, k = ev.key; let v = rate;
      if (k === 'ArrowLeft' || k === 'ArrowDown') v -= st; else if (k === 'ArrowRight' || k === 'ArrowUp') v += st; else if (k === 'PageDown') v -= 10; else if (k === 'PageUp') v += 10; else if (k === 'Home') v = Dl.min; else if (k === 'End') v = Dl.max; else return;
      ev.preventDefault(); setRate(Math.round(v * 10) / 10, true); });
    const setChoice = (c) => { choice = c; $$('#bmChoice .pick').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === c))); };
    $$('#bmChoice .pick').forEach((b) => b.addEventListener('click', () => {
      setChoice(b.dataset.c); attempt('bigmac');
      const rows = [J.fmt.r1(rate), (B.jp / B.jpRate).toFixed(2)], res = C.judgeTask(t, { rows, choice: b.dataset.c }, h);
      L('bigmac').rows = rows; L('bigmac').choice = b.dataset.c; save();
      if (!res.ok) { fb('bad', esc(res.msg.replace(/^.*?: /, '')) + (res.rowRes.every((x) => !x || x.ok) ? '' : ' Turn the dial until the scale is level first.')); sfx.nope(); return; }
      win('bigmac', esc(C.praise(t)), { rows, choice: b.dataset.c });
    }));
    if (e.done) { rate = Dl.target; setChoice('under'); fb('ok', `<b class="fbtag">Right.</b> ${esc(C.praise(t))}`); }
    draw(false);
    helps('bigmac', () => 'Turn the dial toward fewer yen per dollar. Each dollar then buys fewer yen, so the ¥500 burger costs more dollars, and the scale comes level.',
      () => '¥500 ÷ $6.22 = 80.4 yen per dollar. The dial is set there for you. At the market’s 162, Japan’s burger cost only $3.09, so by this measure the yen was undervalued.',
      () => { const from = rate; FX.tween(900, (k) => { rate = from + (Dl.target - from) * k; draw(false); }).then(() => { rate = Dl.target; draw(true); }); });
  }

  // ---------------- stop 5: who sets the price? ----------------
  function stopQ2() {
    setScene('street', 'night', 'market'); const M = J.MARKET, e = L('q2');
    const pos = (v, lo, hi) => (100 * (v - lo) / (hi - lo)).toFixed(2) + '%';
    frame('q2', { prompt: esc(J.PROMPTS.q2),
      world: `<div class="market">
        <div class="orders" id="orders">${J.ORDERS.map((o) => `<button type="button" class="order" data-o="${o.id}"><span class="side ${o.side}">${o.side === 'buy' ? 'Buys yen' : 'Sells yen'}</span><span class="sentmk" aria-hidden="true">Sent</span><b>${esc(o.who)}</b><span>${esc(o.what)}</span></button>`).join('')}</div>
        <div class="gauge" id="gYen" data-g="yen"><button type="button" class="slot" data-g="yen" hidden>Put a label on the yen</button><h3><span>Yen per dollar</span><span id="fl-yen" data-w="5" class="bigflap"></span></h3>
          <div class="tape"><div class="mark" id="mkYen" style="left:${pos(150, 140, 165)}"></div><div class="ends"><span><span class="jp-s">円高</span> stronger yen</span><span>weaker yen <span class="jp-s">円安</span></span></div></div><p class="gnote" id="nYen"></p></div>
        <div class="gaugerow">
          <div class="gauge" data-g="hk"><button type="button" class="slot" data-g="hk" hidden>Put a label on Hong Kong’s dollar</button><h3><span>Hong Kong dollar</span><small id="hkv">7.800 per U.S. dollar</small></h3><div class="tape"><div class="band" style="left:${pos(7.75, 7.7, 7.9)};right:${(100 - 100 * (7.85 - 7.7) / 0.2).toFixed(2)}%"></div><div class="mark" id="mkHk" style="left:${pos(7.8, 7.7, 7.9)}"></div><div class="ends"><span>7.70</span><span>7.90</span></div></div>
            <div class="tank"><span>Defender’s U.S. dollars</span><span class="t"><i id="hkRes" style="width:100%"></i></span></div><p class="gnote" id="nHk"></p></div>
          <div class="gauge" data-g="cn"><button type="button" class="slot" data-g="cn" hidden>Put a label on the yuan</button><h3><span>China’s yuan</span><small id="cnv">at the central rate</small></h3><div class="tape"><div class="band" style="left:${pos(-2, -3, 3)};right:${pos(-2, -3, 3)}"></div><div class="mark" id="mkCn" style="left:50%"></div><div class="ends"><span>−3%</span><span>+3%</span></div></div><p class="gnote" id="nCn"></p></div>
        </div>
        <p class="gnote sk">${esc(J.MARKET_NOTES.sketch)}</p></div>`,
      ctrl: `<p class="q" id="sendHint">Tap each order to send it into the market.</p><button type="button" class="link" id="skipQ">Skip to the sorting</button>
        <div id="sorter" hidden><p class="q">What sets each price? Tap a label, then tap the currency it belongs to.</p><div class="chips" id="chips">${J.SORT_CHIPS.map(([k, tx]) => `<button type="button" class="chip" data-k="${k}" aria-pressed="false">${esc(tx)}</button>`).join('')}</div></div>` });
    const fy = FX.Flap($('#fl-yen'), 5);
    let sent = (S.market || []).slice();
    const apply = (st, anim) => {
      $('#mkYen').style.left = pos(Math.max(140, Math.min(165, st.yen)), 140, 165); fy.set(st.yen.toFixed(1), { instant: !anim, label: st.yen.toFixed(1) + ' yen per dollar' });
      $('#mkHk').style.left = pos(st.hk, 7.7, 7.9); $('#hkv').textContent = st.hk.toFixed(3) + ' per U.S. dollar'; $('#hkRes').style.width = st.reserve + '%';
      $('#mkCn').style.left = pos(st.cn, -3, 3); $('#cnv').textContent = st.cn === 0 ? 'at the central rate' : `${st.cn > 0 ? '+' : '−'}${Math.abs(st.cn).toFixed(1)}% from the central rate`;
      if (st.hkDefends) $('#nHk').textContent = J.MARKET_NOTES.hk;
      if (Math.abs(st.cn) >= M.cnBand) $('#nCn').textContent = J.MARKET_NOTES.cn;
    };
    const states = () => J.playMarket(sent);
    function replayAll() { const sts = states(); fy.set('150.0', { instant: true }); if (sts.length) apply(sts[sts.length - 1], false); if (sts.some((s) => s.mof)) $('#nYen').innerHTML = `<span class="stamp">Japan’s government buys yen</span><span class="stamp-note">${esc(J.MARKET_NOTES.mof)}</span>`; sent.forEach((id) => { const b = $(`.order[data-o="${id}"]`); if (b) b.classList.add('sent'); }); }
    async function send(id) {
      if (sent.includes(id)) return; sent.push(id); S.market = sent.slice(); save();
      const b = $(`.order[data-o="${id}"]`); b.classList.add('sent'); b.setAttribute('aria-disabled', 'true'); sfx.note();
      const sts = states(), st = sts[sts.length - 1], o = J.ORDERS.find((x) => x.id === id);
      if (st.mof) { apply(Object.assign({}, st, { yen: st.yen - M.intervene }), true); await FX.wait(1100); sfx.thud(); $('#nYen').innerHTML = `<span class="stamp drop">Japan’s government buys yen</span><span class="stamp-note">${esc(J.MARKET_NOTES.mof)}</span>`; await FX.wait(400); apply(st, true); }
      else { apply(st, true); if (!$('#nYen .stamp')) $('#nYen').textContent = `${o.who} ${o.side === 'buy' ? 'buys' : 'sells'} yen, and a dollar now buys ${st.yen.toFixed(1)} yen.`; }
      if (sent.length === J.ORDERS.length) ask();
    }
    const placed = {}; let held = null;
    const chipText = (k) => (J.SORT_CHIPS.find((c) => c[0] === k) || ['', ''])[1];
    function paintSort() {
      $$('.slot').forEach((sl) => { const k = placed[sl.dataset.g]; sl.textContent = k ? chipText(k) : sl.getAttribute('data-empty'); sl.classList.toggle('filled', !!k); });
      $$('.chip').forEach((c) => { const used = Object.values(placed).includes(c.dataset.k); c.classList.toggle('used', used); c.setAttribute('aria-pressed', String(held === c.dataset.k)); });
    }
    function judgeSort() {
      attempt('q2'); const r = J.judgeSort(placed);
      $$('.slot').forEach((sl) => sl.classList.toggle('ok', r.right.includes(sl.dataset.g)));
      if (r.ok) { $$('.slot').forEach((sl) => { sl.disabled = true; }); win('q2', esc(C.quiz[1].why[C.quiz[1].answer]) + ' ' + esc(J.SORT_DONE), { choice: String(C.quiz[1].answer) }); return; }
      r.wrong.forEach((g) => { delete placed[g]; }); paintSort(); fb('bad', esc(r.msg)); sfx.nope();
    }
    function ask() {
      $('#sendHint').hidden = true; $('#skipQ').hidden = true; $('#sorter').hidden = false;
      $$('.slot').forEach((sl) => { sl.hidden = false; sl.setAttribute('data-empty', sl.textContent); });
      if (e.done) { Object.assign(placed, J.SORT_KEY); paintSort(); $$('.slot').forEach((sl) => { sl.classList.add('ok'); sl.disabled = true; }); fb('ok', `<b class="fbtag">Right.</b> ${esc(C.quiz[1].why[C.quiz[1].answer].replace(/^Right\.\s*/, ''))} ${esc(J.SORT_DONE)}`); }
    }
    $$('.chip').forEach((c) => c.addEventListener('click', () => { held = held === c.dataset.k ? null : c.dataset.k; sfx.tick(); paintSort(); }));
    $$('.slot').forEach((sl) => sl.addEventListener('click', () => {
      const g = sl.dataset.g; if (!held) { if (placed[g]) { delete placed[g]; paintSort(); } else fb('info', 'Tap a label first, then tap this currency.'); return; }
      Object.keys(placed).forEach((x) => { if (placed[x] === held) delete placed[x]; }); placed[g] = held; held = null; sfx.note(); paintSort();
      if (Object.keys(placed).length === 3) judgeSort();
    }));
    $$('.order').forEach((b) => b.addEventListener('click', () => send(b.dataset.o)));
    $('#skipQ').addEventListener('click', ask);
    replayAll();
    if (e.done || sent.length === J.ORDERS.length) ask();
  }

  // ---------------- stop 6: the carry trade ----------------
  const CH = { w: 640, hgt: 300, l: 70, r: 120, t: 18, b: 36, lo: -200000, hi: 600000 };
  const cx = (m) => CH.l + (CH.w - CH.l - CH.r) * m / 12, cy = (g) => CH.t + (CH.hgt - CH.t - CH.b) * (CH.hi - g) / (CH.hi - CH.lo);
  function chartSVG() {
    const ys = []; for (let g = CH.lo; g <= CH.hi; g += 200000) ys.push(g);
    return `<svg class="chart" viewBox="0 0 ${CH.w} ${CH.hgt}" role="img" aria-labelledby="chartT"><title id="chartT">Your gain if you closed the trade, month by month</title>
      ${ys.map((g) => `<line x1="${CH.l}" x2="${CH.w - CH.r}" y1="${cy(g)}" y2="${cy(g)}" stroke="${g === 0 ? '#FBF6EA' : 'rgba(251,246,234,.12)'}" stroke-width="${g === 0 ? 2 : 1}" ${g === 0 ? 'stroke-dasharray="6 6"' : ''}/><text x="${CH.l - 8}" y="${cy(g) + 5}" text-anchor="end" font-family="Big Shoulders Display" font-weight="700" font-size="15" fill="#C3CDE6">${g === 0 ? '¥0' : (g > 0 ? '+' : '−') + '¥' + Math.abs(g / 1000) + 'k'}</text>`).join('')}
      ${Array.from({ length: 13 }, (_, m) => `<text x="${cx(m)}" y="${CH.hgt - 12}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="700" font-size="14" fill="#C3CDE6">${m}</text>`).join('')}
      <text x="${CH.w - CH.r + 8}" y="${CH.hgt - 12}" font-family="Atkinson Hyperlegible Next" font-size="12" fill="#C3CDE6">month</text>
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
  function stopCarry() {
    setScene('floor', 'deep'); const t = task('carry'), e = L('carry'), R = S.ride;
    if (!R.seed) { R.seed = J.newSeed(); save(); }
    const P = J.pathOf(R.seed), res = (m) => J.closeResult(m, P), pt = (a, b, f) => pathTo(a, b, f, P);
    CH.hi = Math.max(600000, Math.ceil(Math.max(...Array.from({ length: 12 }, (_, i) => res(i + 1).gainYen)) / 200000) * 200000);
    const quick = !!S.quick;
    frame('carry', { prompt: esc(R.day1 < 3 ? J.PROMPTS.carryDay1 : R.closedAt ? J.PROMPTS.carryLedger : J.PROMPTS.carryRide), world: '<div class="floor" id="floor"></div>', ctrl: '<div id="carryCtrl"></div>' });
    if (R.day1 < 3) dayOne(); else ride();

    function dayOne() {
      const steps = [['Borrow ¥15,000,000', 'bank', '¥15,000,000'], ['Change it at 150', 'fx', '$100,000'], ['Deposit it at 5%', 'us', '$100,000']];
      $('#floor').innerHTML = `<div class="flow"><div class="node" id="n-bank"><span class="jp">日本</span><b>Bank in Japan</b><span>lends at 0.1% a year</span><span class="amt" id="a-bank"></span></div><div class="arrow" id="ar1"></div>
        <div class="node" id="n-fx"><span class="jp">両替</span><b>Exchange</b><span>150 yen per dollar</span><span class="amt" id="a-fx"></span></div><div class="arrow" id="ar2"></div>
        <div class="node" id="n-us"><span class="jp">ドル</span><b>U.S. account</b><span>pays 5% a year</span><span class="amt" id="a-us"></span></div></div>`;
      const paint = () => { const k = R.day1; ['bank', 'fx', 'us'].forEach((n, i) => { $('#n-' + n).classList.toggle('lit', k === i + 1); $('#a-' + n).textContent = k === i + 1 ? steps[i][2] : ''; }); $('#ar1').classList.toggle('lit', k >= 2); $('#ar2').classList.toggle('lit', k >= 3);
        $('#carryCtrl').innerHTML = k < 3 ? `<button type="button" class="btn" id="d1">${steps[k][0]}</button>` : ''; if (k < 3) $('#d1').addEventListener('click', () => { R.day1++; save(); sfx.note(); paint(); if (R.day1 === 3) setTimeout(() => { $('.prompt').textContent = J.PROMPTS.carryRide; ride(); }, FX.reduced() ? 0 : 900); else $('#d1').focus(); }); };
      paint();
      if (quick) { const auto = () => { if (!$('#d1')) return; R.day1++; save(); sfx.note(); paint(); if (R.day1 === 3) setTimeout(() => { $('.prompt').textContent = J.PROMPTS.carryRide; ride(); }, FX.reduced() ? 0 : 700); else setTimeout(auto, FX.reduced() ? 0 : 650); }; setTimeout(auto, FX.reduced() ? 0 : 500); }
    }

    function ride() {
      const m0 = R.month;
      $('#floor').innerHTML = `<div class="tickerbar"><div><div class="pair-l"><span class="jp-s">ドル円</span> One dollar buys</div><span id="fl-tick" data-w="9" class="tick"></span></div><div class="month" id="monthL"></div><div class="gainbox"><span class="lab">Gain if you closed today</span><span class="val" id="gainV"></span></div></div>
        <div class="chartwrap" id="chartwrap">${chartSVG()}</div>
        <div class="accounts" id="accts"><div class="acct"><div class="lab">U.S. account, at 5% a year</div><div class="v" id="usdV"></div><div class="pile-c" id="pile" aria-hidden="true"></div><span class="coinfly" id="coin">$</span><span class="plus" id="plusUsd">+$416.67</span></div><div class="acct"><div class="lab">You owe the bank in Japan, at 0.1%</div><div class="v" id="oweV"></div><span class="plus minus" id="plusYen">+¥1,250 owed</span></div></div>
        <p class="news" id="news" aria-live="polite"></p><div id="after"></div>`;
      const tick = FX.Flap($('#fl-tick'), 9);
      const paint = (m, anim) => { const r = res(m); tick.set(`${r.rate} YEN`, { instant: !anim, label: `${r.rate} yen per dollar`, maxSteps: 6 }); $('#monthL').textContent = m === 0 ? 'Day one' : `Month ${m} of 12`; $('#usdV').textContent = F.usd2(r.usd); $('#oweV').textContent = F.yen(r.owe); $('#pile').innerHTML = '<i></i>'.repeat(m); const gv = $('#gainV'); gv.textContent = F.yenSigned(r.gainYen); gv.classList.toggle('neg', r.gainYen < 0); $('#news').textContent = J.newsFor(m, P); $('#news').classList.toggle('alert', m > P.turn || m === P.alarm); };
      const drawYou = (m, frac) => { setYou(pt(0, Math.min(m, R.closedAt || 12), frac)); const mm = Math.min(m, R.closedAt || 12), k = frac == null ? 1 : frac, g0 = res(Math.max(0, mm - 1)).gainYen, g = res(mm).gainYen; $('#dotYou').setAttribute('cx', cx(mm - 1 + k)); $('#dotYou').setAttribute('cy', cy(g0 + (g - g0) * k)); };
      paint(m0, false); drawYou(m0);
      if (R.closedAt) return ending(false);
      if (quick && m0 === 0) { hold(); return; }
      decide();

      function decide() {
        const m = R.month;
        $('#carryCtrl').innerHTML = m === 0 ? `<div class="ridebar"><button type="button" class="btn" id="hold">Start the year</button></div>`
          : `<div class="ridebar"><p class="q">Month ${m} of 12. You are up ${F.yenSigned(res(m).gainYen)}. If a dollar still buys ${res(m).rate} yen next month, you add about ${F.yenSigned(Math.round(C.carryAt(m + 1, res(m).rate).gainYen - res(m).gainYen))}.</p><div class="decide"><button type="button" class="btn" id="hold">Hold: collect next month’s interest</button><button type="button" class="btn ghost" id="close">Close and keep <span class="nw">${F.yenSigned(res(m).gainYen)}</span></button></div></div>`;
        $('#hold').addEventListener('click', hold); if ($('#close')) $('#close').addEventListener('click', closeNow); $('#hold').focus({ preventScroll: true });
      }
      async function step(m, ghost) {
        const prev = res(m - 1), r = res(m);
        if (!ghost) { $('#pile').insertAdjacentHTML('beforeend', '<i class="new"></i>'); $('#coin').classList.remove('go'); void $('#coin').offsetWidth; $('#coin').classList.add('go'); ['#plusUsd', '#plusYen'].forEach((s) => { const x = $(s); x.classList.remove('go'); void x.offsetWidth; x.classList.add('go'); }); sfx.coin(); }
        $('#monthL').textContent = `Month ${m} of 12`; $('#news').textContent = J.newsFor(m, P); $('#news').classList.toggle('alert', m > P.turn || m === P.alarm);
        if (r.rate !== prev.rate) tick.set(`${r.rate} YEN`, { label: `${r.rate} yen per dollar`, maxSteps: 6 });
        const gv = $('#gainV');
        if (!ghost) { FX.countTo($('#usdV'), prev.usd, r.usd, 700, F.usd2); FX.countTo($('#oweV'), prev.owe, r.owe, 700, F.yen); }
        await FX.tween(ghost ? 380 : m === 12 ? 1500 : m >= 10 ? 1000 : 700, (k) => {
          if (ghost) { $('#pHeld').setAttribute('d', pt(R.closedAt, m, k)); }
          else { drawYou(m, k); const g = prev.gainYen + (r.gainYen - prev.gainYen) * k; gv.textContent = F.yenSigned(g); gv.classList.toggle('neg', g < 0); }
        });
        if (!ghost) { drawYou(m); gv.textContent = F.yenSigned(r.gainYen); gv.classList.toggle('neg', r.gainYen < 0); $('#usdV').textContent = F.usd2(r.usd); $('#oweV').textContent = F.yen(r.owe); }
        if (m === 12) { sfx.thud(); if (!FX.reduced()) { const fl = $('#floor'); fl.classList.remove('shake'); void fl.offsetWidth; fl.classList.add('shake'); } }
      }
      async function hold() {
        $('#carryCtrl').innerHTML = '<p class="q" aria-hidden="true">…</p>';
        R.month++; save(); await step(R.month, false);
        if (R.month >= 12) { R.closedAt = 12; save(); await FX.wait(500); return ending(true); }
        await FX.wait(R.month >= 9 ? 500 : 250); decide();
      }
      async function closeNow() {
        R.closedAt = R.month; save(); sfx.ok();
        $('#carryCtrl').innerHTML = `<p class="q">You closed the trade in month ${R.closedAt} with ${F.yenSigned(res(R.closedAt).gainYen)}. Watch what the market did next.</p>`;
        $('#pKept').setAttribute('d', `M${cx(R.closedAt)} ${cy(res(R.closedAt).gainYen)} L${cx(12)} ${cy(res(R.closedAt).gainYen)}`); $('#pKept').setAttribute('opacity', 1);
        $('#pHeld').setAttribute('opacity', 1); $('#accts').style.opacity = .45;
        for (let m = R.closedAt + 1; m <= 12; m++) await step(m, true);
        await FX.wait(600); ending(true);
      }
    }

    function ending(fresh) {
      const k = R.closedAt, held = res(12), mine = res(k), B = J.bestExit(P), bestG = res(B).gainYen;
      if (k < 12) { $('#pKept').setAttribute('d', `M${cx(k)} ${cy(mine.gainYen)} L${cx(12)} ${cy(mine.gainYen)}`); $('#pKept').setAttribute('opacity', 1); $('#pHeld').setAttribute('d', pt(k, 12)); $('#pHeld').setAttribute('opacity', 1); }
      setYou(pt(0, k)); $('#dotYou').setAttribute('cx', cx(k)); $('#dotYou').setAttribute('cy', cy(mine.gainYen));
      const lyou = $('#lblYou'), lh = $('#lblHeld');
      if (k < 12) { lyou.setAttribute('x', cx(12) + 8); lyou.setAttribute('y', cy(mine.gainYen) + 5); lyou.textContent = `You ${F.yenSigned(mine.gainYen)}`; }
      lh.setAttribute('x', cx(12) + 8); lh.setAttribute('y', cy(held.gainYen) + 5); lh.textContent = k < 12 ? `Held ${F.yenSigned(held.gainYen)}` : `You ${F.yenSigned(held.gainYen)}`; if (k === 12) lh.setAttribute('fill', '#FF8B85');
      $('#monthL').textContent = 'The year is over'; const tk = $('#fl-tick'); if (tk) { FX.Flap(tk, 9).set('142 YEN', { instant: true, label: '142 yen per dollar' }); }
      const gv = $('#gainV'); gv.textContent = F.yenSigned(mine.gainYen); gv.classList.toggle('neg', mine.gainYen < 0); $('.gainbox .lab').textContent = k < 12 ? 'You kept' : 'Your result';
      $('#news').textContent = J.rideEnding(k, P); $('#news').classList.add('alert'); $('#accts').hidden = true;
      $('.prompt').textContent = J.PROMPTS.carryLedger;
      // The close-out at 142: worked first at 150, then the student's own lines (version 1's table and judge).
      const strip = Array.from({ length: 12 }, (_, i) => { const m = i + 1, g = res(m).gainYen, hgt = Math.round(40 * Math.abs(g) / Math.max(bestG, 1)) + 3; return `<span class="ex-m${m === k ? ' me' : ''}${m === B ? ' best' : ''}"><i class="${g < 0 ? 'neg' : ''}" style="height:${Math.min(hgt, 46)}px"></i><b>${m}</b></span>`; }).join('');
      $('#after').innerHTML = `<div class="share" role="group" aria-label="Your result"><div class="exits" aria-hidden="true">${strip}</div><p class="exits-key"><span class="k-me">your exit</span> <span class="k-best">this year’s best exit</span></p><p class="verdict-l">${esc(J.exitVerdict(k, P))}</p>
          <div class="row"><button type="button" class="btn small" id="shareBtn">Send this to a friend</button><button type="button" class="btn small ghost" id="again2">Ride a new year</button>${S.quick && !L('q1').done ? '<button type="button" class="btn small ghost" id="trip">Take the whole trip</button>' : ''}</div><p class="sharemsg" id="shareMsg" role="status"></p></div>
        <div class="ledger two" role="group" aria-label="Close out the year"><h3>For Unit 12: close out the year</h3>
          <div class="ln hd"><span class="l"></span><span class="col ex">Worked: if a dollar still bought 150</span><span class="col">Holding to the end: a dollar buys 142</span></div>
          <div class="ln"><span class="l">Yen you get</span><span class="col ex">$105,000 × 150 = <b>¥15,750,000</b></span><span class="col">$105,000 × 142 = ${numIn('k0', 'Yen you get for your dollars', true, '¥')}</span></div>
          <div class="ln"><span class="l">Yen you owe</span><span class="col ex">¥15,000,000 plus a year at 0.1% = <b>¥15,015,000</b></span><span class="col">¥15,000,000 plus a year at 0.1% = <b>¥15,015,000</b></span></div>
          <div class="ln"><span class="l">Gain or loss</span><span class="col ex">¥15,750,000 − ¥15,015,000 = <b>+¥735,000</b></span><span class="col">yen you get − yen you owe = ${numIn('k2', 'Gain or loss, in yen', true, '¥')}</span></div></div>`;
      $('#carryCtrl').innerHTML = `<button type="button" class="btn" id="chk">Check the ledger</button> <button type="button" class="link" id="again">Ride the year again</button>`;
      if (e.rows) { if (e.rows[0]) $('#k0').value = e.rows[0]; if (e.rows[2]) $('#k2').value = e.rows[2]; }
      if (e.done) { markIn('k0', true); markIn('k2', true); $('#chk').hidden = true; fb('ok', `<b class="fbtag">Right.</b> ${esc(J.carryPraise(t, k, P).replace(/^Right\.\s*/, ''))}`); showNext(); if (L('carry').value !== J.rideValue(k, R.seed)) { L('carry').value = J.rideValue(k, R.seed); save(); } }
      const check = () => {
        attempt('carry'); const rows = [val('k0'), null, val('k2')], res = C.judgeTask(t, { rows }, h);
        L('carry').rows = rows; save();
        res.rowRes.forEach((x, i) => { if (x) markIn(i === 0 ? 'k0' : 'k2', x.ok); });
        if (!res.ok) { fb('bad', esc(res.msg)); sfx.nope(); return; }
        $('#chk').hidden = true; win('carry', esc(J.carryPraise(t, k, P)), { rows, value: J.rideValue(k, R.seed) });
      };
      $('#chk').addEventListener('click', check); onEnter('k0', check); onEnter('k2', check);
      const again = () => { R.month = 0; R.closedAt = null; R.seed = J.newSeed(); save(); stopCarry(); };
      $('#again').addEventListener('click', again); $('#again2').addEventListener('click', again);
      if ($('#trip')) $('#trip').addEventListener('click', () => { S.quick = false; save(); go(IDS[0]); });
      $('#shareBtn').addEventListener('click', async () => {
        const url = location.origin + location.pathname + '?vs=' + J.rideValue(k, R.seed), text = J.shareText(k, P), msg = $('#shareMsg');
        try { if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ title: 'The Currency Desk', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(text + ' ' + url); msg.textContent = 'Copied. Paste it into a text to a friend.'; }
        catch (e) { msg.innerHTML = `<label class="sr" for="shareTxt">Your result to send</label><input id="shareTxt" readonly value="${esc(text + ' ' + url)}" style="width:100%">`; $('#shareTxt').select(); }
      });
      helps('carry', () => 'Multiply the dollars you have by the rate at the end: $105,000 × 142. Then subtract the yen you owe.',
        () => 'Yen you get: $105,000 × 142 = ¥14,910,000<br>Gain or loss: ¥14,910,000 − ¥15,015,000 = −¥105,000');
      if (fresh) $('#k0').focus({ preventScroll: false });
    }
  }

  // ---------------- stop 7: how far can the yen rise? ----------------
  function historySVG() {
    const data = window.YEN_HISTORY || [], W = 900, H = 380, l = 50, r = 20, tp = 20, b = 40, lo = 110, hi = 166;
    const t0 = Date.parse(data[0][0]), t1 = Date.parse(data[data.length - 1][0]);
    const x = (d) => l + (W - l - r) * (Date.parse(d) - t0) / (t1 - t0), y = (v) => tp + (H - tp - b) * (hi - v) / (hi - lo);
    const path = 'M' + data.map(([d, v]) => x(d).toFixed(1) + ' ' + y(v).toFixed(1)).join(' L');
    const yt = [115, 130, 145, 160].map((v) => `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" stroke="#E3D9C0"/><text x="${l - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" font-family="Big Shoulders Display" font-weight="700" fill="#4A5577">${v}</text>`).join('');
    const xt = ['2022-01-03', '2023-01-03', '2024-01-02'].map((d) => `<text x="${x(d)}" y="${H - 14}" font-size="14" font-family="Big Shoulders Display" font-weight="700" fill="#4A5577">${d.slice(0, 4)}</text>`).join('');
    const mof = [['2022-09-22', '2022-10-21'], ['2024-04-26', '2024-05-29']].map(([a, z]) => `<rect x="${x(a)}" y="${tp}" width="${Math.max(6, x(z) - x(a))}" height="${H - tp - b}" fill="#C8102E" opacity=".12"/><text x="${x(a) + Math.max(6, x(z) - x(a)) / 2}" y="${H - b - 8}" text-anchor="middle" font-size="13" font-family="Big Shoulders Display" font-weight="800" fill="#C8102E">Japan buys yen</text>`).join('');
    const pts = [['2022-01-03', 115.27, 'January 2022: about 115', 'start'], ['2022-10-20', 149.82, 'about 150', 'end'], ['2024-07-10', 161.73, 'July 10, 2024: about 162', 'end'], ['2024-08-05', 143.95, 'Aug. 5: about 144', 'end']];
    const dots = pts.map(([d, v, s, anc]) => `<circle cx="${x(d)}" cy="${y(v)}" r="6" fill="${d === '2024-08-05' ? '#C8102E' : '#13234F'}"/><text x="${x(d) + (anc === 'start' ? 10 : -10)}" y="${y(v) + (d === '2024-08-05' || d === '2022-01-03' ? 22 : -10)}" text-anchor="${anc}" font-size="16" font-family="Big Shoulders Display" font-weight="800" fill="${d === '2024-08-05' ? '#C8102E' : '#13234F'}">${s}</text>`).join('');
    const boj = `<line x1="${x('2024-07-31')}" x2="${x('2024-07-31')}" y1="${tp}" y2="${H - b}" stroke="#13234F" stroke-dasharray="4 4"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="histT"><title id="histT">The yen from January 2022 to August 2024: a dollar went from about 115 yen to about 162 in July 2024, then fell to about 144 on August 5, 2024. Japan bought yen in September and October 2022 and in April and May 2024.</title>${yt}${xt}${mof}${boj}<path id="histPath" d="${path}" fill="none" stroke="#13234F" stroke-width="3"/>${dots}<text x="${l}" y="${tp - 4}" font-size="13" font-family="Atkinson Hyperlegible Next" fill="#4A5577">Yen per dollar</text></svg>`;
  }
  function stopBreakeven() {
    setScene('floor', 'deep'); const t = task('breakeven'), e = L('breakeven'), BE = J.BE;
    let rate = 147, choice = e.choice || null;
    frame('breakeven', { prompt: esc(J.PROMPTS.breakeven(t)),
      world: `<div class="floor"><div style="width:100%">
          <div class="ledger two" role="group" aria-label="Break-even rate"><h3>Break-even rate</h3>
            <div class="ln hd"><span class="l"></span><span class="col ex">Worked: borrow ¥1,000,000 at 0%, change at 100, earn 3%</span><span class="col">Your trade</span></div>
            <div class="ln"><span class="l">Yen you owe</span><span class="col ex"><b>¥1,000,000</b></span><span class="col"><b>¥15,015,000</b></span></div>
            <div class="ln"><span class="l">Dollars you have</span><span class="col ex"><b>$10,300</b></span><span class="col"><b>$105,000</b></span></div>
            <div class="ln"><span class="l">Break-even rate</span><span class="col ex">¥1,000,000 ÷ $10,300 = <b>97.1</b></span><span class="col">yen you owe ÷ dollars you have = ${numIn('b2', 'Break-even rate, in yen per dollar', false)}</span></div></div></div>
        <div class="bemeter"><div><label for="beSlide" class="q" style="display:block;margin:0 0 4px">Slide the rate at the end of the year</label><input type="range" class="slider" id="beSlide" min="${BE.min}" max="${BE.max}" step="0.1" value="${rate}"></div><div class="val" id="beVal" aria-live="polite"></div></div>
        <div id="beChoice" hidden><p class="q" id="beLegend">A dollar bought 150 yen when you started. About how far could the yen rise before the year’s interest gain was gone?</p><div id="beOpts" class="tickets" role="group" aria-labelledby="beLegend"></div></div>
        <div id="hist"></div></div>`,
      ctrl: `<button type="button" class="btn" id="chk">Check the rate</button>` });
    const opts = [['p01', 'About 0.1%'], ['p5', 'About 5%'], ['p20', 'About 20%'], ['any', 'By any amount: the interest is already earned']];
    $('#beOpts').innerHTML = opts.map(([v, s]) => `<button type="button" class="ticket" data-c="${v}">${esc(s)}</button>`).join('');
    const sl = $('#beSlide');
    const show = () => { const g = BE.at(rate), z = Math.abs(g) < 1; $('#beVal').innerHTML = `At ${rate.toFixed(1)}: <span style="color:${z ? 'var(--lantern)' : g > 0 ? 'var(--mint)' : '#FF8B85'}">${z ? '¥0, break-even' : F.yenSigned(g)}</span>`; sl.setAttribute('aria-valuetext', `${rate.toFixed(1)} yen per dollar: ${z ? 'zero, break-even' : (g > 0 ? 'a gain of ' : 'a loss of ') + F.yen(Math.abs(g))}`); };
    sl.addEventListener('input', () => { const v = +sl.value, s = J.beSnap(v); if (s !== rate && Math.abs(s - BE.zero) < 1e-9 && Math.abs(rate - BE.zero) > 1e-9) sfx.ok(); rate = s; if (s !== v) sl.value = s.toFixed(1); show(); });
    show();
    const showHistory = () => { if ($('#hist').innerHTML) return; $('#hist').innerHTML = `<div class="history"><h2>What really happened</h2><p>From January 2022 to July 2024 a dollar went from about 115 yen to about 162, so the carry trade paid month after month. On July 31, 2024, Japan’s central bank raised its rate to about 0.25%. By August 5 a dollar bought about 144 yen, and Japan’s Nikkei 225 stock index fell 12.4%, its worst day since 1987.</p>${historySVG()}<p class="src">Federal Reserve H.10 daily rates (FRED series DEXJPUS); Bank of Japan, July 31, 2024; Voice of America, August 5, 2024; Japan’s Ministry of Finance data via Nippon.com and AFP.</p></div>`;
      const p = $('#histPath'); if (p && !FX.reduced() && p.getTotalLength) { const n = p.getTotalLength(); p.style.strokeDasharray = n; p.style.strokeDashoffset = n; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 2.6s ease'; p.style.strokeDashoffset = 0; } };
    const toChoice = () => { $('#beChoice').hidden = false; };
    if (e.rows && e.rows[2]) $('#b2').value = e.rows[2];
    if (e.done) { markIn('b2', true); $('#chk').hidden = true; toChoice(); rate = BE.zero; sl.value = rate.toFixed(1); show(); $$('#beOpts .ticket').forEach((b) => b.classList.toggle('right', b.dataset.c === 'p5')); fb('ok', `<b class="fbtag">Right.</b> ${esc(C.praise(t))}`); showHistory(); }
    const check = () => {
      attempt('breakeven'); const r2 = val('b2'), res = C.judgeTask(t, { rows: [null, null, r2], choice: 'p5' }, h), a = res.rowRes[2];
      L('breakeven').rows = [null, null, r2]; save();
      if (!a || !a.ok) { markIn('b2', false); fb('bad', esc(a ? a.msg : 'Type the break-even rate.')); sfx.nope(); return; }
      markIn('b2', true); $('#chk').hidden = true; toChoice();
      const from = rate; FX.tween(900, (k) => { rate = from + (BE.zero - from) * k; sl.value = rate.toFixed(1); show(); }).then(() => { rate = BE.zero; sl.value = rate.toFixed(1); show(); });
      fb('info', `At ${J.fmt.r1(BE.zero)} yen per dollar your $105,000 repays ¥15,015,000 exactly. Now the question under the slider.`);
    };
    $('#chk').addEventListener('click', check); onEnter('b2', check);
    $$('#beOpts .ticket').forEach((b) => b.addEventListener('click', () => {
      choice = b.dataset.c; attempt('breakeven'); const rows = [null, null, val('b2')], res = C.judgeTask(t, { rows, choice }, h);
      $$('#beOpts .ticket').forEach((x) => x.classList.remove('wrong', 'right'));
      if (!res.ok) { b.classList.add('wrong'); fb('bad', 'Compare 150 with your break-even rate of about 143. A move of 7 yen on 150 is about 5%.'); sfx.nope(); return; }
      b.classList.add('right'); L('breakeven').choice = choice; win('breakeven', esc(C.praise(t)), { rows, choice }); showHistory();
    }));
    helps('breakeven', () => 'Divide the yen you owe by the dollars you have: ¥15,015,000 ÷ $105,000. Or slide the rate until the gain reads ¥0.',
      () => 'Break-even rate: ¥15,015,000 ÷ $105,000 = 143.0<br>From 150 to 143 is a move of 7 yen, about 5%.');
  }

  // ---------------- stop 8: who is happy? ----------------
  function stopQ3() {
    setScene('dawn', 'dawn'); const e = L('q3'); const vals = {};
    if (e.done) J.PEOPLE.forEach((p) => { vals[p.id] = p.happy ? 'win' : 'lose'; });
    const pics = { tractor: A.tractor, student: A.student, toyota: A.car };
    frame('q3', { prompt: esc(J.PROMPTS.q3),
      world: `<div class="cards3">${J.PEOPLE.map((p) => `<div class="pc" data-p="${p.id}">${pics[p.id]}<span class="who">${esc(p.name)}</span><div class="seg" role="group" aria-label="${esc(p.name)}"><button type="button" data-v="win">Happy</button><button type="button" data-v="lose">Hurt</button></div><span class="after" hidden>${esc(p.after)}</span></div>`).join('')}</div>`,
      ctrl: '' });
    const paint = () => $$('.pc').forEach((c) => { const v = vals[c.dataset.p]; $$('.seg button', c).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); c.dataset.v = v || ''; });
    const reveal = () => $$('.pc').forEach((c) => { $('.after', c).hidden = false; c.classList.add('shown'); });
    $$('.seg button').forEach((b) => b.addEventListener('click', () => {
      if (L('q3').done) return; const id = b.closest('.pc').dataset.p; vals[id] = b.dataset.v; sfx.tick(); paint();
      if (Object.keys(vals).length < 3) return;
      attempt('q3'); const set = Object.keys(vals).filter((k) => vals[k] === 'win'), i = J.happyChoice(set);
      if (i === C.quiz[2].answer) { reveal(); win('q3', esc(J.happyFeedback(set)), { choice: String(i) }); return; }
      if (i != null) { L('q3').choice = String(i); save(); } fb('bad', esc(J.happyFeedback(set))); sfx.nope();
    }));
    paint(); if (e.done) { reveal(); fb('ok', `<b class="fbtag">Right.</b> ${esc(C.quiz[2].why[0].replace(/^Right\.\s*/, ''))}`); }
  }

  // ---------------- stop 9: a coin that promises $1 ----------------
  function stopQ4() {
    setScene('dawn', 'dawn'); const e = L('q4'), q = C.quiz[3];
    frame('q4', { prompt: esc(J.PROMPTS.q4),
      world: `<p class="ask">${esc(J.COIN_ASK)}</p><div class="coinwrap" id="coinw">${A.coinScene}<div class="supports" role="group" aria-label="What holds the coin at $1?">${optOrder(q).map((j) => `<button type="button" class="support" data-j="${j}">${esc(J.COIN_SUPPORTS[j])}</button>`).join('')}</div></div>
        <div class="row" id="event" hidden><button type="button" class="btn small red" id="freeze">Freeze $3.3 billion of the vault at Silicon Valley Bank</button><button type="button" class="btn small" id="rescue" hidden>Regulators: every depositor will be repaid</button></div><div id="usdc"></div>`,
      ctrl: '' });
    const coinTxt = () => $('#coinw .coin text');
    const usdc = () => { $('#usdc').innerHTML = `<div class="history" style="max-width:560px"><h2>USDC, March 2023</h2><svg viewBox="0 0 520 170" role="img" aria-labelledby="usdcT"><title id="usdcT">USDC's price fell from $1 to about 86 cents and returned to $1 on March 13, 2023.</title><line x1="40" x2="500" y1="30" y2="30" stroke="#E3D9C0"/><text x="32" y="35" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="15" fill="#4A5577">$1.00</text><text x="32" y="135" text-anchor="end" font-family="Big Shoulders Display" font-weight="800" font-size="15" fill="#C8102E">$0.86</text><line x1="40" x2="500" y1="130" y2="130" stroke="#E3D9C0" stroke-dasharray="4 4"/><path d="M40 30 L 170 30 C 200 30, 210 130, 240 130 C 270 130, 300 34, 340 30 L 500 30" fill="none" stroke="#13234F" stroke-width="4"/><circle cx="240" cy="130" r="6" fill="#C8102E"/><text x="340" y="22" font-family="Big Shoulders Display" font-weight="800" font-size="15" fill="#13234F">March 13: back to $1</text></svg><p>${esc(J.USDC)}</p></div>`; };
    const showEvent = () => { $('#event').hidden = false; };
    $('#freeze').addEventListener('click', () => { $('#coinw').classList.add('sunk'); coinTxt().textContent = '86¢'; sfx.thud(); $('#freeze').hidden = true; $('#rescue').hidden = false; fb('info', 'Holders doubt the vault, sell, and the coin slips to 86 cents. Now tap the rescue.'); });
    $('#rescue').addEventListener('click', () => { $('#coinw').classList.remove('sunk'); coinTxt().textContent = '$1'; sfx.ok(); $('#rescue').hidden = true; usdc(); fb('ok', `<b class="fbtag">Right.</b> ${esc(q.why[0].replace(/^Right\.\s*/, ''))}`); });
    $$('.support').forEach((b) => b.addEventListener('click', () => {
      const j = +b.dataset.j; attempt('q4'); $$('.support').forEach((x) => x.classList.remove('wrong'));
      if (D.judgeQuiz(3, j).ok) { $$('.support').forEach((x) => x.classList.toggle('chosen', x === b)); markDone('q4', { choice: String(j) }); sfx.ok(); showNext(); fb('info', 'Yes: the vault. Now see what happens when holders stop trusting it.'); showEvent(); return; }
      b.classList.add('wrong'); fb('bad', esc(q.why[j])); sfx.nope();
    }));
    if (e.done) { $$('.support').forEach((x) => x.classList.toggle('chosen', x.dataset.j === String(q.answer))); showEvent(); fb('ok', `<b class="fbtag">Right.</b> ${esc(q.why[0].replace(/^Right\.\s*/, ''))}`); }
  }

  // ---------------- stop 10: write home ----------------
  function stopNote() {
    setScene('dawn', 'dawn'); const e = L('note'), N = C.note;
    frame('note', { prompt: esc(J.PROMPTS.note),
      world: `<div class="postcard"><div class="pic"><img src="assets/img/hiroshige-saruwaka-night.webp" alt="" loading="lazy"><p class="bubble">The yen is cheap. A dollar buys 150 of them!</p></div>
        <div class="write"><div class="stampbox" aria-hidden="true">東京</div><label for="memo">Your reply</label><textarea id="memo" spellcheck="true">${esc(S.memo)}</textarea><p class="wc" id="wc"></p></div></div>`,
      ctrl: '' });
    const ta = $('#memo'), wc = () => { const n = h.wordCount(ta.value); $('#wc').textContent = n >= N.minWords ? `${n} words. Saved: your reply prints on your boarding pass.` : `${n} words so far. Your reply saves itself once it reaches ${N.minWords} words.`; };
    let tmr = null;
    ta.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => { const ok = D.judgeNote(ta.value).ok; if (ok || !L('note').done) S.memo = ta.value; if (ok && !L('note').done) { markDone('note'); fb('ok', '<b class="fbtag">Saved.</b> Your reply will print on your boarding pass.'); showNext(); sfx.ok(); } save(); wc(); }, 400); wc(); });
    wc(); if (e.done) fb('ok', '<b class="fbtag">Saved.</b> Your reply will print on your boarding pass.');
  }

  // ---------------- the receipt: a boarding pass ----------------
  function wrap(g, text, maxW, maxLines) { const words = String(text).replace(/\s+/g, ' ').trim().split(' '); const lines = []; let cur = ''; for (const w of words) { const t2 = cur ? cur + ' ' + w : w; if (g.measureText(t2).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t2; } if (cur) lines.push(cur); if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += ' …'; } return lines; }
  async function receiptBlob() {
    try { await document.fonts.ready; } catch (e) { /* fonts optional */ }
    const payload = D.makePayload(S.code, S.log, S.memo), done = doneCount(), pts = D.pointsFor(done), n = IDS.length;
    const W = 1200, H = 1640, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const DSP = '"Big Shoulders Display", "Arial Narrow", sans-serif', BOD = '"Atkinson Hyperlegible Next", Arial, sans-serif';
    g.fillStyle = '#B3DDF2'; g.fillRect(0, 0, W, H);
    // the pass
    const rr = (x, y, w, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    g.fillStyle = '#FBF6EA'; rr(40, 40, W - 80, H - 80, 28); g.fill();
    g.fillStyle = '#13234F'; rr(40, 40, W - 80, 230, 28); g.fill(); g.fillRect(40, 200, W - 80, 70);
    g.fillStyle = '#F7C548'; g.font = `800 26px ${DSP}`; g.fillText('BOARDING PASS AND RECEIPT', 90, 100);
    g.fillStyle = '#FBF6EA'; g.font = `900 80px ${DSP}`; g.fillText(C.story.title, 90, 182);
    g.font = `24px ${BOD}`; g.fillStyle = '#C3CDE6'; g.fillText(C.story.kicker, 90, 236);
    g.textAlign = 'right'; g.fillStyle = '#FBF6EA'; g.font = `900 64px ${DSP}`; g.fillText('ORD ✈ HND', W - 90, 182); g.font = `24px ${BOD}`; g.fillStyle = '#C3CDE6'; g.fillText('Chicago to Tokyo', W - 90, 236); g.textAlign = 'left';
    // perforation
    g.fillStyle = '#B3DDF2'; for (let x = 70; x < W - 60; x += 28) { g.beginPath(); g.arc(x, 300, 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#4A5577'; g.font = `800 22px ${DSP}`; g.fillText('DESK CODE', 90, 360); g.fillStyle = '#0F1A33'; g.font = `900 66px ${DSP}`; g.fillText(h.fmtCode(S.code), 90, 424);
    // points box
    g.fillStyle = done === n ? '#146B43' : '#8A5A00'; rr(90, 460, W - 180, 110, 16); g.fill();
    g.fillStyle = '#fff'; g.font = `900 56px ${DSP}`; g.fillText(`Points: ${pts} / ${D.POINTS}`, 124, 534);
    g.font = `24px ${BOD}`; g.textAlign = 'right'; g.fillText(`${done} of ${n} stops complete, graded on completion`, W - 124, 530); g.textAlign = 'left';
    // stops
    const colW = (W - 180 - 20) / 2;
    D.STEPS.forEach((s, k) => { const x = 90 + (k % 2) * (colW + 20), y = 600 + Math.floor(k / 2) * 66, ok = L(s.id).done;
      g.fillStyle = ok ? '#DDF5E8' : '#FBE2E0'; rr(x, y, colW, 54, 10); g.fill(); g.fillStyle = ok ? '#146B43' : '#A8261E'; g.font = `800 26px ${DSP}`; g.fillText(`${ok ? '✓' : '✗'}  ${k + 1}. ${J.STOPS[k].title}`, x + 16, y + 36); });
    let y = 600 + 5 * 66 + 34;
    g.fillStyle = '#13234F'; g.font = `800 28px ${DSP}`; g.fillText(J.rideReceiptLine(S.ride.closedAt, J.pathOf(S.ride.seed)), 90, y); y += 54;
    g.fillStyle = '#0F1A33'; g.font = `800 28px ${DSP}`; g.fillText(C.note.receiptHeading, 90, y); y += 38;
    g.font = `23px ${BOD}`; (S.memo.trim() ? wrap(g, S.memo, W - 180, 9) : ['(no note yet)']).forEach((ln, i) => g.fillText(ln, 90, y + i * 33));
    g.fillStyle = '#4A5577'; g.font = `21px ${BOD}`; g.fillText('Issued ' + new Date(payload.issued).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }), 90, H - 170);
    g.fillStyle = '#0F1A33'; g.font = 'bold 28px ui-monospace, Menlo, monospace'; g.fillText('Verification code  ' + D.shortCode(payload.sum), 90, H - 128);
    g.fillStyle = '#4A5577'; g.font = `19px ${BOD}`; g.fillText('Instructors: enter the points shown above. To spot-check, open ' + C.verifyUrl.replace('https://', ''), 90, H - 88);
    const blob = await new Promise((res) => cv.toBlob(res, 'image/png')); const bytes = new Uint8Array(await blob.arrayBuffer());
    return { blob: new Blob([D.addTextChunk(bytes, D.encodeReceipt(payload))], { type: 'image/png' }), url: cv.toDataURL('image/png'), payload, pts, done };
  }
  async function showReceipt() {
    S.at = 'receipt'; save(); renderRoute(); setScene('dawn', 'dawn');
    const all = doneCount() === IDS.length, open = IDS.filter((id) => !L(id).done);
    beatEl.innerHTML = `<div class="beat" data-id="receipt"><div class="head"><p class="stopno">Your receipt</p><h1>${all ? 'Every stop is complete' : 'A few stops are still open'}</h1>
      <p class="prompt">${all ? 'Download your boarding pass and upload the file to the assignment page.' : 'This assignment is graded on completion. Finish the open stops for full points, then download your boarding pass.'}</p></div>
      <div class="world"><p class="q" style="color:var(--ink)">Drawing your boarding pass…</p></div>
      <div class="ctrl"><p class="q" id="ptsLine"></p>${open.length ? `<ul class="openlist">${open.map((id) => `<li><span><span class="nomark">✗</span> ${esc(stopOf(id).title)}</span><button type="button" class="link" data-go="${id}">Go there</button></li>`).join('')}</ul>` : ''}
        <div class="next"><a class="btn" id="dl" href="#" download>Download your boarding pass</a></div>
        <p style="font-size:15px;margin-top:14px">Upload the downloaded file itself, not a screenshot: your instructor’s checker reads data stored inside the file. If you finish more stops later, download a new one.</p></div></div>`;
    $$('[data-go]', beatEl).forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
    const r = await receiptBlob(); if (!$('#dl')) return;
    const name = C.filePrefix + '_' + h.fmtCode(S.code) + '.png';
    $('#ptsLine').textContent = `${r.pts} / ${D.POINTS} points, ${r.done} of ${IDS.length} stops complete.`;
    $('.world', beatEl).innerHTML = `<img class="passprev" src="${r.url}" alt="Boarding pass receipt: desk code ${h.fmtCode(S.code)}, ${r.pts} of ${D.POINTS} points, ${r.done} of ${IDS.length} stops complete, verification code ${D.shortCode(r.payload.sum)}.">`;
    const dl = $('#dl'); dl.href = URL.createObjectURL(r.blob); dl.setAttribute('download', name);
  }

  // ---------------- routing ----------------
  const STOPFN = { q1: stopQ1, convert: stopConvert, apple: stopApple, bigmac: stopBigmac, q2: stopQ2, carry: stopCarry, breakeven: stopBreakeven, q3: stopQ3, q4: stopQ4, note: stopNote };
  function go(id) {
    if (!S) return showStart();
    if (id === 'receipt') return showReceipt();
    if (!STOPFN[id]) id = IDS[0];
    S.at = id; save(); renderRoute(); STOPFN[id]();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); beatEl.focus({ preventScroll: true });
  }

  // ---------------- boot ----------------
  setSound(!!store.get(KEY + ':sound'));
  const last = store.get(KEY + ':last'), saved = last ? store.get(KEY + ':' + last) : null;
  if (saved && saved.code) { begin(saved.code, saved); go(S.at); } else showStart();

  // ---------------- self-checks (interactive-health contract) ----------------
  const checks = []; const reg = (name, fn) => checks.push({ name, fn });
  window.__selfCheck = async () => { const out = []; for (const c of checks) { try { const r = await c.fn(); out.push(r === true || r === undefined ? { name: c.name, ok: true } : r === false ? { name: c.name, ok: false } : { name: c.name, ok: !!r.ok, detail: r.detail }); } catch (e) { out.push({ name: c.name, ok: false, detail: String(e) }); } } return { ok: out.every((x) => x.ok), checks: out }; };
  reg('a stop rendered', () => beatEl.textContent.trim().length > 120 || { ok: false, detail: 'the stop is empty' });
  reg('a scene is drawn', () => !!$('#backdrop svg') || { ok: false, detail: 'no backdrop svg' });
  reg('each task accepts its own answer and rejects a wrong one', () => { for (const t of D.buildTasks('SELFCHEK')) { if (!C.judgeTask(t, C.selfAnswer(t, h), h).ok) return { ok: false, detail: t.id + ' rejects its own answer' }; if (C.judgeTask(t, C.selfWrong(t, h), h).ok) return { ok: false, detail: t.id + ' accepts a wrong answer' }; } return true; });
  reg('every question grades its key right and the rest wrong', () => C.quiz.every((q, qi) => q.options.every((_, j) => D.judgeQuiz(qi, j).ok === (j === q.answer))) || { ok: false, detail: 'a quiz key is off' });
  reg('the split-flap flips', async () => { const el = document.createElement('span'); const f = FX.Flap(el, 3); await f.set('150', { instant: true }); return f.text === '150' || { ok: false, detail: 'flap shows ' + f.text }; });
  reg('the carry year ends at a loss of 105,000 yen', () => Math.abs(J.closeResult(12).gainYen + 105000) < 1e-6 || { ok: false, detail: String(J.closeResult(12).gainYen) });
  reg('the Big Mac dial balances at 80.4', () => J.dialBalanced(J.dialSnap(81.2)) && !J.dialBalanced(J.DIAL.market) || { ok: false, detail: 'dial' });
  reg('the strong-dollar postcards map onto the key', () => J.happyChoice(['student', 'toyota']) === C.quiz[2].answer || { ok: false, detail: 'mapping' });
  reg('the yen history is present', () => (window.YEN_HISTORY || []).length > 600 || { ok: false, detail: 'history data missing' });
  reg('receipt PNG round-trips its payload', async () => {
    const code = 'SELFCHEK', tasks = D.buildTasks(code), log = {};
    D.STEPS.forEach((s) => { if (s.kind === 'check') log[s.id] = { done: true, choice: C.quiz[s.quiz].answer }; else if (s.kind === 'task') log[s.id] = Object.assign({ done: true }, C.selfAnswer(tasks.find((x) => x.id === s.id), h)); else log[s.id] = { done: true }; });
    log.carry.value = 'closed:6';
    const p = D.makePayload(code, log, 'word '.repeat(C.note.minWords + 5));
    const cv2 = document.createElement('canvas'); cv2.width = 20; cv2.height = 20; const blob = await new Promise((res) => cv2.toBlob(res, 'image/png'));
    const v = D.verifyPayload(D.decodeReceipt(D.readTextChunk(D.addTextChunk(new Uint8Array(await blob.arrayBuffer()), D.encodeReceipt(p)))));
    return (v.checksumOk && v.done === D.STEPS.length && v.points === D.POINTS) || { ok: false, detail: JSON.stringify(v.problems) };
  });
  window.Desk = D;
})();
