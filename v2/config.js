/* The Currency Desk: FINAN III week 12 (foreign exchange). Config for the shared desk engine (desk-engine.js in this folder,
   copied from the FINAN IV no-identifier engine, 2026-11-16: random desk code, no name or email; receipt and verify.html check
   from the code). Built 2026-11-17 to COURSE-SPEC.md "Week 12" (ten steps, in the spec's order), Samuel's notes 19 and 20, and
   w12/TEACHING-MAP.md (the lesson of each step in one sentence; tests/core_test.js asserts the desk shows each one).
   - The page "Why Is a Dollar Worth 150 Yen?" tells the story in words. This desk teaches every number: converting, the
     apple, the Big Mac rate, the carry trade and the break-even.
   - Step 6 (the carry trade) runs month by month with a "Next month" button, built without engine changes on the w06 pattern:
     taskView returns the game's HTML in parts[0].html and a wire() that runs it; the close-out table (parts[1]) appears after
     month 12. carrySim() below is the one function the screen, the judge and the tests all use.
   - No new fictional names: Great Lakes Community Bank is the course's fixed fiction (COURSE-SPEC rule 16), so no case_reuse
     sweep was needed. Real figures: The Economist's Big Mac data (July 1, 2026), USDC in March 2023 (w12/sources/FACTS.md).
   Version 1, seedVersion 1.
   2026-11-19 (the step-by-step rebuild, ../DESIGN.md): same app id, version, salt, step ids and judges, so receipts keep
   their shape. Changed: the Big Mac market rate is 162.1 (the page's figure), the worked examples are the page's euro row
   and its 142.86 row, the step labels name the new steps, the break-even feedback says the yen "weakened" (a dollar bought
   more yen), and verifyUrl points at v2/verify.html. The page lesson.js says what each screen asks; this file still judges. */
(function (root) {
  'use strict';

  // ---------------- the carry trade (step 6) and break-even (step 7): COURSE-SPEC's numbers ----------------
  const CARRY = { borrowYen: 15000000, yenRate: 0.001, start: 150, usdRate: 0.05, end: 142,
    // Yen per dollar at the end of each month. Flat for nine months, then the yen strengthens (modelled on July to August 2024).
    path: [150, 150, 150, 150, 150, 150, 150, 150, 150, 149, 147, 142] };
  // Month m (0..12): simple interest each month, as the step describes it.
  function carryAt(m, rate) {
    const C = CARRY, usd0 = C.borrowYen / C.start;
    const usd = usd0 * (1 + C.usdRate * m / 12), owe = C.borrowYen * (1 + C.yenRate * m / 12);
    const r = rate != null ? rate : (m === 0 ? C.start : C.path[m - 1]);
    const back = usd * r, gainYen = back - owe;
    return { m, rate: r, usd, owe, back, gainYen, gainUsd: gainYen / r };
  }
  function carrySim() { const rows = []; for (let m = 0; m <= 12; m++) rows.push(carryAt(m)); return rows; }

  // ---------------- Big Mac (step 4): The Economist, big-mac-raw-index.csv, rows dated 2026-07-01 ----------------
  const BIGMAC = { date: 'July 1, 2026', jp: 500, us: 6.22, jpRate: 162.1, eu: 6.19, euRate: 0.874 };   // 2026-11-19: 162.1 and the euro row, as the page prints them

  const QUIZ = [
    { title: 'Rates and the yen',
      q: 'In 2022 the Fed raised its rate from near 0% to above 4%, as you saw in Unit 3. Japan’s central bank kept its rate below zero. What happened to the appeal of holding dollars instead of yen?',
      options: ['It rose: dollars paid far more interest, so investors bought dollars and the yen fell',
        'It fell: a higher rate makes dollars more expensive to borrow, so investors avoided them',
        'Nothing changed, because exchange rates do not respond to interest rates',
        'It rose, and the yen rose along with the dollar'],
      answer: 0,
      why: ['Right. Investors sold yen to buy dollars that paid more. A dollar bought about 115 yen in January 2022 and about 150 in October.',
        'A higher rate makes dollars more expensive to borrow, but more rewarding to hold. Investors holding money wanted the dollars that paid more.',
        'Money moves toward the currency that pays more interest, and that buying and selling moves the exchange rate.',
        'When investors sell yen to buy dollars, the dollar rises and the yen falls. Both cannot rise against each other.'] },
    { title: 'Who sets the price?',
      q: 'Who sets how many yen a dollar buys, and how is China’s yuan different?',
      options: ['Banks and traders set the yen’s price every second by buying and selling; China’s central bank sets a central rate each morning and keeps the yuan within 2% of it',
        'The Fed and Japan’s central bank agree on the rate each morning, and China’s yuan works the same way',
        'The dollar’s value in gold fixes the rate, and the yuan is tied to gold too',
        'The International Monetary Fund sets both rates once a year'],
      answer: 0,
      why: ['Right. The yen floats, and the yuan is managed.',
        'Central banks set interest rates. Buyers and sellers set the yen’s price, though Japan’s government sometimes buys yen to slow a fall. China is the one that sets a daily central rate.',
        'The dollar’s link to gold ended in 1971, and big currencies have floated since 1973.',
        'No international body sets the yen’s price. Buyers and sellers do, every second, with Japan’s government stepping in now and then.'] },
    { title: 'Who wins when the dollar rises?',
      q: 'The dollar rises 10% against the euro and the yen. Who is happy: a Michigan company selling tractors in Europe, an American student spending a semester in Tokyo, or Toyota selling cars in the U.S.?',
      options: ['The student and Toyota', 'Only the tractor company', 'All three', 'The tractor company and the student'],
      answer: 0,
      why: ['Right. Each dollar the student spends buys more yen, and each dollar Toyota earns in the U.S. changes into more yen. The tractors now cost more in euros, so European farmers may buy elsewhere.',
        'The tractors now cost more in euros, so the tractor company is the one that loses. The student’s dollars and Toyota’s dollars both buy more yen.',
        'The tractor company loses: its tractors now cost more in euros.',
        'The tractors now cost more in euros, which hurts the tractor company. Toyota is the other winner: its U.S. sales change into more yen.'] },
    { title: 'A coin that promises $1',
      q: 'A stablecoin promises that each coin is always worth $1. What holds that promise up, and can it break?',
      options: ['The company keeps cash and short-term government bonds behind every coin, and if holders doubt those assets, the price can fall below $1',
        'The Fed guarantees every stablecoin at $1, so the promise cannot break',
        'Computer code fixes the price at $1, so the promise cannot break',
        'Bitcoin’s price holds every stablecoin at $1'],
      answer: 0,
      why: ['Right. A stablecoin is a peg run by a company. In March 2023 USDC fell to about 86 cents when $3.3 billion of its reserves were stuck at Silicon Valley Bank, and it returned to $1 after regulators said every depositor would be repaid.',
        'The Fed does not stand behind stablecoins. The coin is worth $1 only while people trust the assets the company holds.',
        'Code records who owns each coin, but the price comes from buyers and sellers, and they pay $1 only while they trust the assets behind it.',
        'Bitcoin floats. A stablecoin’s $1 rests on the cash and bonds its company holds.'] },
  ];

  const STEPS = [
    { id: 'q1', label: 'Who moves the yen? (step 5)', kind: 'check', quiz: 0 },
    { id: 'convert', label: 'Change money and Which got stronger? (steps 1 and 2)', kind: 'task' },
    { id: 'apple', label: 'The apple (step 3)', kind: 'task' },
    { id: 'bigmac', label: 'The Big Mac (step 4)', kind: 'task' },
    { id: 'q2', label: 'What a peg is (step 6)', kind: 'check', quiz: 1 },
    { id: 'carry', label: 'Ken’s trade by hand and The yen trade (steps 8 and 9)', kind: 'task' },
    { id: 'breakeven', label: 'How far can the yen rise? (step 10)', kind: 'task' },
    { id: 'q3', label: 'A stronger dollar (step 7)', kind: 'check', quiz: 2 },
    { id: 'q4', label: 'A coin that promises $1 (step 11)', kind: 'check', quiz: 3 },
    { id: 'note', label: 'Your reply to Travis (step 12)', kind: 'note' },
  ];

  // ---------------- seeded numbers (step 2 only; every other task uses the spec's or the sources' numbers) ----------------
  // Worked example: $300 at 150 gives ¥45,000; ramen ¥1,200 is $8.00. No seed equals either answer (150 is never seeded).
  const RATES = [140, 145, 155, 160], DOLLARS = [200, 250, 400, 500, 600, 800], PRICES = [900, 1500, 1800, 2400, 3000, 3600];
  function buildTasks(rng, h) {
    const T = [];
    { const R = h.pick(rng, RATES), D = h.pick(rng, DOLLARS), Y = h.pick(rng, PRICES);
      T.push({ id: 'convert', R, D, Y, yen: D * R, usd: Y / R, answer: D * R }); }
    T.push({ id: 'apple', yen: 200, usd: 1, R: 150, tokyo: 200 / 150, gap: 200 / 150 - 1, answer: 200 / 150 - 1, decision: 'chicago' });
    { const B = BIGMAC; T.push({ id: 'bigmac', jp: B.jp, us: B.us, R: B.jpRate, implied: B.jp / B.us, jpUsd: B.jp / B.jpRate, answer: B.jp / B.us, decision: 'under' }); }
    { const end = carryAt(12); T.push({ id: 'carry', usd: end.usd, owe: end.owe, R: CARRY.end, back: end.back, answer: end.gainYen }); }
    { const end = carryAt(12); T.push({ id: 'breakeven', usd: end.usd, owe: end.owe, R0: CARRY.start, be: end.owe / end.usd, answer: end.owe / end.usd, decision: 'p5' }); }
    return T;
  }

  // ---------------- formatting and input parsing ----------------
  const H = () => root.DeskEngine.h;
  const fix = (x, dp) => String(+Number(x).toFixed(dp == null ? 2 : dp));
  const usd = (x) => H().money(x, 2);
  const usd0 = (x) => H().money(x);
  const yen = (x) => (x < 0 ? '−¥' : '¥') + Math.abs(Math.round(x)).toLocaleString('en-US');
  const rateStr = (x) => (x < 10 ? Number(x).toFixed(2) : fix(x, 1));
  const SHOW = { usd: (v) => usd(v), yen: (v) => yen(v), rate: (v) => rateStr(v), text: (v) => String(v) };
  const strip = (s, re) => String(s == null ? '' : s).replace(re, '').trim();
  const PARSE = {
    usd: (h, s) => h.parseMoney(strip(s, /\s*(dollars?|usd)\s*$/i)),
    yen: (h, s) => h.parseMoney(strip(String(s == null ? '' : s).replace(/[¥￥]/g, ''), /\s*(yen|jpy)\s*$/i)),
    rate: (h, s) => h.parseMoney(strip(String(s == null ? '' : s).replace(/[¥￥]/g, ''), /\s*(yen|francs?)?\s*(per|a|\/)?\s*(dollar|\$|usd)?\s*$/i)),
  };
  const TOL = { usd: () => 0.006, yen: (v) => Math.max(1, 0.0002 * Math.abs(v)), rate: () => 0.6 };
  const PLACEHOLDER_FMT = { usd: 'money', yen: 'num', rate: 'num' };
  const UNREADABLE = { usd: 'Type a dollar amount, like 8.25.', yen: 'Type a number of yen, like 45,000.', rate: 'Type the number of yen per dollar, like 120.' };

  // One function per task draws both the worked example and the student's table, so the two always match (rule 29).
  // A line: { label, calc, num (the right value), kind, input }. `own` = the student's table, which names the operation in words.
  const LINES = {
    convert: (D, R, Y, item, own) => [
      { label: 'Yen you get', calc: own ? 'dollars × yen per dollar' : `${usd0(D)} × ${R}`, num: D * R, kind: 'yen', input: true },
      { label: `${item} in dollars`, calc: own ? 'yen price ÷ yen per dollar' : `${yen(Y)} ÷ ${R}`, num: Y / R, kind: 'usd', input: true }],
    apple: (Y, U, R, item, filled) => [
      { label: `Tokyo ${item} in dollars`, calc: `${yen(Y)} ÷ ${R}`, num: Y / R, kind: 'usd', input: true },
      { label: 'How much cheaper the cheaper city is', calc: filled ? `${usd(Math.max(Y / R, U))} − ${usd(Math.min(Y / R, U))}` : 'higher dollar price − lower dollar price', num: Math.abs(Y / R - U), kind: 'usd', input: true }],
    bigmac: (local, cur, us, R) => [
      { label: 'Exchange rate that makes the two cost the same', calc: `${cur === '¥' ? yen(local) : cur + local.toFixed(2)} ÷ ${usd(us)}`, num: local / us, kind: 'rate', input: true },
      { label: 'Its Big Mac in dollars at the market rate', calc: `${cur === '¥' ? yen(local) : cur + local.toFixed(2)} ÷ ${rateStr(R)}`, num: local / R, kind: 'usd', input: true }],
    carry: (dollars, owe, R) => [
      { label: 'Yen you get for your dollars', calc: `${usd0(dollars)} × the rate in month 12`, num: dollars * R, kind: 'yen', input: true },
      { label: 'Yen you owe', calc: '¥15,000,000 plus a year at 0.1%', num: yen(owe), kind: 'text', input: false },
      { label: 'Gain or loss, in yen', calc: 'yen you get − yen you owe', num: dollars * R - owe, kind: 'yen', input: true }],
    carryEx: (dollars, owe, R) => [
      { label: 'Yen you get for your dollars', calc: `${usd0(dollars)} × ${R}`, num: dollars * R, kind: 'yen', input: true },
      { label: 'Yen you owe', calc: '¥15,000,000 plus a year at 0.1%', num: yen(owe), kind: 'text', input: false },
      { label: 'Gain or loss, in yen', calc: `${yen(dollars * R)} − ${yen(owe)}`, num: dollars * R - owe, kind: 'yen', input: true }],
    breakeven: (owe, dollars) => [
      { label: 'Yen you owe at the end', calc: 'the loan plus a year’s interest', num: yen(owe), kind: 'text', input: false },
      { label: 'Dollars you have at the end', calc: 'the dollars plus a year’s interest', num: usd0(dollars), kind: 'text', input: false },
      { label: 'Yen per dollar at which the gain is gone', calc: 'yen you owe ÷ dollars you have', num: owe / dollars, kind: 'rate', input: true }],
  };
  // The engine's ladder() draws text as given; filled lines and given lines show their value, input lines show a box.
  const toLadder = (lines, filled) => lines.map((l) => ((filled || !l.input)
    ? { label: l.label, calc: l.calc, value: l.kind === 'text' ? l.num : SHOW[l.kind](l.num), fmt: 'text', input: l.input }
    : { label: l.label, calc: l.calc, value: l.num, fmt: PLACEHOLDER_FMT[l.kind], input: true }));

  function linesFor(t) {
    if (t.id === 'convert') return LINES.convert(t.D, t.R, t.Y, 'The meal', true);
    if (t.id === 'apple') return LINES.apple(t.yen, t.usd, t.R, 'apple', false);
    if (t.id === 'bigmac') return LINES.bigmac(t.jp, '¥', t.us, t.R).map((l, i) => (i === 1 ? Object.assign({}, l, { label: 'Japan’s Big Mac in dollars at the market rate' }) : l));
    if (t.id === 'carry') return LINES.carry(t.usd, t.owe, t.R);
    if (t.id === 'breakeven') return LINES.breakeven(t.owe, t.usd);
    return [];
  }
  const EXAMPLES = {
    convert: { cap: 'You change $300 at 150 yen per dollar, and a bowl of ramen costs ¥1,200.', lines: () => LINES.convert(300, 150, 1200, 'The ramen', false) },
    apple: { cap: 'A T-shirt costs ¥3,000 in Tokyo and $25.00 in Chicago, and a dollar buys 150 yen. Tokyo is cheaper.', lines: () => LINES.apple(3000, 25, 150, 'T-shirt', true) },
    bigmac: { cap: 'On the same day, a Big Mac cost €6.19 in the euro area, and a dollar bought 0.874 euros. €6.19 ÷ 0.874 = $7.08, more than $6.22, so by this test the euro was overvalued. For the burgers to cost the same, a dollar would have to buy €6.19 ÷ $6.22, about 0.995 euros.',
      lines: () => LINES.bigmac(BIGMAC.eu, '€', BIGMAC.us, BIGMAC.euRate).map((l, i) => (i === 1 ? Object.assign({}, l, { label: 'Euro-area Big Mac in dollars at the market rate' }) : l)) },
    carry: { cap: 'What the year would have paid if a dollar still bought 150 yen at the end.', lines: () => LINES.carryEx(105000, 15015000, 150) },
    breakeven: { cap: 'The page’s trade: borrow ¥150,000 at 0%, change it at 150 yen per dollar into $1,000, and earn 5% to end with $1,050. At 142.86 yen to the dollar, the ¥150,000 that was worth $1,000 is worth $1,050: the yen has risen 5%.',
      lines: () => [{ label: 'Yen you owe at the end', calc: 'the loan plus a year’s interest', num: '¥150,000', kind: 'text', input: false },
        { label: 'Dollars you have at the end', calc: 'the dollars plus a year’s interest', num: '$1,050', kind: 'text', input: false },
        { label: 'Yen per dollar at which the gain is gone', calc: '¥150,000 ÷ $1,050', num: 150000 / 1050, kind: 'rate', input: true }] },
  };

  // ---------------- the carry trade's screens (step 6) ----------------
  const NEWS = [
    'You borrow ¥15,000,000 from a bank in Japan at 0.1% a year. You change it into dollars at 150 yen per dollar and put the $100,000 in a U.S. account that pays 5% a year. Each month your dollars earn interest, and the yen you owe grows a little too.',
    'Your first month of interest arrives. The yen has not moved.',
    'Another quiet month. A dollar still buys 150 yen.',
    'Another quiet month. Your gain keeps growing.',
    'A third of the year is gone, and nothing has gone wrong.',
    'Another quiet month. A dollar still buys 150 yen.',
    'Halfway through the year. Your gain has passed ¥350,000.',
    'Another quiet month. Traders around the world are running the same trade.',
    'Another quiet month. A dollar still buys 150 yen.',
    'Nine months have passed without one bad month.',
    'Japan’s central bank hints that it will raise its interest rate. A dollar now buys 149 yen.',
    'Japan’s central bank raises its rate. Some traders start buying back yen to repay their loans, and a dollar buys 147 yen.',
    'Everyone who borrowed yen rushes to repay at once, and all that buying pushes the yen up. A dollar buys 142 yen. The year is over: change your dollars back and repay the loan in the table below.',
  ];
  const GSTYLE = `<style>
    .ct{border:1.5px solid var(--line-strong);border-radius:10px;padding:1rem 1.1rem;background:var(--bg);margin:.4rem 0 1rem}
    .ct h3{font:400 28px/1.1 var(--display);margin:0 0 .4rem}
    .ct .news{margin:.2rem 0 .8rem;min-height:3em}
    .ct table.cf{margin:.4rem 0 .6rem;max-width:30rem}
    .ct .bars{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;height:140px;margin:.6rem 0 .2rem}
    .ct .col{display:flex;flex-direction:column;height:100%}
    .ct .up{height:75%;display:flex;align-items:flex-end}
    .ct .dn{height:25%;display:flex;align-items:flex-start;border-top:2px solid var(--ink)}
    .ct .bar{width:100%;background:var(--brand);border-radius:3px 3px 0 0;min-height:2px}
    .ct .bar.neg{background:var(--bad);border-radius:0 0 3px 3px}
    .ct .bar.q{background:none;border:2px dashed var(--line-strong);height:24px;text-align:center;font-size:13px;line-height:20px}
    .ct .mlab{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;font-size:12px;color:var(--muted);text-align:center}
    .ct .loss{color:var(--bad);font-weight:700}
  </style>`;
  function statTable(r, hideGain) {
    const gain = hideGain ? 'Work it out in the table below'
      : `<span class="${r.gainYen < 0 ? 'loss' : ''}">${yen(r.gainYen)}</span> (about ${r.gainUsd < 0 ? '−' : ''}${usd0(Math.abs(r.gainUsd))})`;
    return `<div class="tw"><table class="cf"><caption>${r.m === 0 ? 'The day you start' : 'End of month ' + r.m}</caption><tbody>
      <tr><td class="lbl">A dollar buys</td><td><b>${r.rate} yen</b></td></tr>
      <tr><td class="lbl">Your dollars, with interest</td><td>${usd(r.usd)}</td></tr>
      <tr><td class="lbl">Yen you owe, with interest</td><td>${yen(r.owe)}</td></tr>
      <tr><td class="lbl">Gain if you changed back and repaid today</td><td>${gain}</td></tr></tbody></table></div>`;
  }
  function barsHtml(m, done) {
    const rows = carrySim(), max = rows[9].gainYen;   // the tallest bar is month 9; the up zone is 3 times the down zone
    const cells = []; for (let k = 1; k <= 12; k++) {
      const r = rows[k]; let up = '', dn = '';
      if (k > m) { /* not played yet */ } else if (k === 12 && !done) up = '<div class="bar q">?</div>';
      else if (r.gainYen < 0) dn = `<div class="bar neg" style="height:${Math.min(100, 300 * -r.gainYen / max).toFixed(1)}%"></div>`;
      else up = `<div class="bar" style="height:${(100 * r.gainYen / max).toFixed(1)}%"></div>`;
      cells.push(`<div class="col"><div class="up">${up}</div><div class="dn">${dn}</div></div>`);
    }
    return `<p class="small" style="margin:.6rem 0 0"><b>Your gain at the end of each month</b> (above the line a gain, below it a loss)</p><div class="bars" aria-hidden="true">${cells.join('')}</div><div class="mlab" aria-hidden="true">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => `<span>${k}</span>`).join('')}</div>`;
  }
  function carryScreen(m, done) {
    const r = carryAt(m);
    const btn = m < 12 ? `<button type="button" class="btn" data-month="1">${m === 0 ? 'Start the year' : 'Next month'}</button>`
      : '<button type="button" class="btn secondary" data-restart="1">Watch the year again</button>';
    return `<h3>${m === 0 ? 'Day one' : 'Month ' + m + ' of 12'}</h3><p class="news">${NEWS[m]}</p>${statTable(r, m === 12 && !done)}${barsHtml(m, done)}<div class="actions">${btn}</div>`;
  }
  const CKEY = () => (root.DESK ? root.DESK.storageKey : 'currency') + ':carryMonth';
  function wireCarry($, L) {
    const box = $('#ct'); if (!box) return;
    let m = 0; try { m = Number(localStorage.getItem(CKEY())) || 0; } catch (e) { /* private mode */ }
    if (L && L.done) m = 12;
    const after = () => { const tb = box.closest('.part') && box.closest('.part').nextElementSibling; if (tb) tb.style.display = m < 12 ? 'none' : '';
      // The Check button and the calculator strip wait for month 12 too, so nothing invites a check before the year is run.
      const sub = document.querySelector('#ask button[type=submit]'), cs = document.getElementById('calcSlot');
      if (sub && sub.parentElement) sub.parentElement.style.display = m < 12 ? 'none' : ''; if (cs) cs.style.display = m < 12 ? 'none' : ''; };
    const draw = () => {
      box.innerHTML = carryScreen(m, !!(L && L.done)); after();
      const b = box.querySelector('[data-month]'); if (b) b.addEventListener('click', () => { m += 1; try { localStorage.setItem(CKEY(), String(m)); } catch (e) { /* */ } draw(); const n = box.querySelector('button'); if (n) n.focus(); });
      const r = box.querySelector('[data-restart]'); if (r) r.addEventListener('click', () => { m = 0; try { localStorage.setItem(CKEY(), '0'); } catch (e) { /* */ } draw(); });
    };
    draw();
    // When the step is checked right, redraw so the month-12 bar and the gain show.
    const fb = $('#fb'); if (fb && root.MutationObserver) new root.MutationObserver(() => { if (/^Right/.test(fb.textContent) && m === 12) draw(); }).observe(fb, { childList: true });
  }

  // ---------------- step text ----------------
  const PROBLEM = {
    convert: (t) => ({ title: 'Change money', place: 'A customer is flying to Tokyo.',
      body: `<p>She changes <b>${usd0(t.D)}</b> into yen at <b>${t.R}</b> yen per dollar. In Tokyo, a meal costs <b>${yen(t.Y)}</b>. How many yen does she get, and what does the meal cost in dollars?</p>` }),
    apple: (t) => ({ title: 'The apple', place: 'Is the yen cheap because a dollar buys 150 of them?',
      body: `<p>An apple costs <b>${yen(t.yen)}</b> in Tokyo and <b>${usd(t.usd)}</b> in Chicago. A dollar buys <b>${t.R}</b> yen. Where is the apple cheaper, and by how much in dollars?</p>`,
      choice: { legend: 'Where is the apple cheaper?', options: [['chicago', 'Chicago'], ['tokyo', 'Tokyo']] } }),
    bigmac: (t) => ({ title: 'The Big Mac', place: 'The Economist compares the price of one burger around the world.',
      body: `<p>On ${BIGMAC.date}, a Big Mac cost <b>${yen(t.jp)}</b> in Japan and <b>${usd(t.us)}</b> in the U.S. A dollar bought <b>${t.R}</b> yen. What exchange rate would make the two burgers cost the same?</p>`,
      choice: { legend: 'By this measure, is the yen undervalued or overvalued?', options: [['under', 'Undervalued: Japan’s Big Mac costs less in dollars'], ['over', 'Overvalued: Japan’s Big Mac costs more in dollars']] } }),
    carry: () => ({ title: 'The carry trade', place: 'You borrow yen and earn interest in dollars.',
      body: '<p>Run the trade one month at a time and watch your gain. When the year ends, change your dollars back into yen and repay the loan.</p>' }),
    breakeven: (t) => ({ title: 'How far can the yen rise?', place: 'Back to day one of your trade.',
      body: `<p>You ended the year with <b>${usd0(t.usd)}</b> and owed <b>${yen(t.owe)}</b>. At what rate would your dollars repay the loan exactly, with nothing left over?</p>`,
      choice: { legend: 'A dollar bought 150 yen when you started. About how far could the yen rise before the year’s interest gain was gone?',
        options: [['p01', 'About 0.1%'], ['p5', 'About 5%'], ['p20', 'About 20%'], ['any', 'By any amount: the interest is already earned']] } }),
  };
  const SOURCES = {
    bigmac: '<p>The Economist, <a href="https://github.com/TheEconomist/big-mac-data" target="_blank" rel="noopener">Big Mac index data</a>, prices dated July 1, 2026. The market rates (162.135 yen and 0.80735 francs per dollar) are rounded.</p>',
    carry: '<p>The trade’s numbers are made up so the arithmetic is round. The yen’s path is modelled on July and August 2024, when a dollar went from about 162 yen to about 144 (Federal Reserve, <a href="https://fred.stlouisfed.org/series/DEXJPUS" target="_blank" rel="noopener">yen to U.S. dollar exchange rate</a>).</p>',
  };

  function taskView(t, L, h) {
    const P = PROBLEM[t.id](t), E = EXAMPLES[t.id];
    const example = h.ladder(toLadder(E.lines(), true), { filled: true, caption: E.cap });
    const lines = linesFor(t);
    const table = h.ladder(toLadder(lines, false), { rows: L.rows, caption: 'Your turn' });
    if (t.id === 'carry') {
      return { title: P.title, place: P.place, body: P.body, example: '', table, sources: SOURCES.carry,
        parts: [{ html: `${GSTYLE}<div class="ct" id="ct" aria-live="polite"></div>`, field: null },
          { html: `<p style="margin-top:1rem"><b>Close out the year.</b> A dollar now buys 142 yen.</p>${example}`, field: 'table' }],
        wire: ($) => wireCarry($, L), helpLabels: ['Show me the first blank', 'Show me every line'] };
    }
    const parts = [{ html: '', field: 'table' }];
    if (P.choice) parts.push({ html: '', field: 'choice' });
    return { title: P.title, place: P.place, body: P.body, example, table, parts, choice: P.choice, sources: SOURCES[t.id] || '',
      helpLabels: ['Show me the first blank', 'Show me every line'] };
  }

  // ---------------- judging ----------------
  // Common slips, per line, phrased with the student's own numbers (rule 3). Values are in the line's own units.
  function diagFor(t, l, i) {
    const D = [];
    if (t.id === 'convert' && i === 0) D.push([t.D / t.R, 'div', `To go from dollars to yen, multiply: ${usd0(t.D)} × ${t.R}. Each dollar becomes ${t.R} yen.`], [t.D, 'same', `That is still dollars. Each dollar buys ${t.R} yen: ${usd0(t.D)} × ${t.R}.`]);
    if (t.id === 'convert' && i === 1) D.push([t.Y * t.R, 'mul', `To go from yen to dollars, divide: ${yen(t.Y)} ÷ ${t.R}. It takes ${t.R} yen to make one dollar.`], [t.Y, 'same', `That is the price in yen. Divide by ${t.R} to get dollars.`], [t.R / t.Y, 'flip', `Divide the yen price by the rate: ${yen(t.Y)} ÷ ${t.R}.`]);
    if (t.id === 'apple' && i === 0) D.push([t.yen, 'yen', `That is the price in yen, not dollars. Divide by ${t.R}: ¥200 ÷ ${t.R}.`], [t.yen * t.R, 'mul', `To go from yen to dollars, divide: ¥200 ÷ ${t.R}.`], [t.R / t.yen, 'flip', 'Divide the yen price by the rate: ¥200 ÷ 150.']);
    if (t.id === 'apple' && i === 1) D.push([t.tokyo, 'tokyo', 'That is the Tokyo price in dollars. Now subtract the Chicago price, $1.00.'], [t.yen - t.usd, 'units', 'That subtracts $1 from 200 yen. Change the yen into dollars first, then subtract.'], [t.tokyo + t.usd, 'plus', 'Subtract the lower price from the higher one.']);
    if (t.id === 'bigmac' && i === 0) D.push([t.us / t.jp, 'flip', `Divide the yen price by the dollar price: ¥500 ÷ ${usd(t.us)}.`], [t.jp * t.us, 'mul', `Divide, don’t multiply: ¥500 ÷ ${usd(t.us)}.`], [t.R, 'market', `That is the market rate. The question asks for the rate that would make ¥500 and ${usd(t.us)} the same: ¥500 ÷ ${usd(t.us)}.`]);
    if (t.id === 'bigmac' && i === 1) D.push([t.jp / (t.jp / t.us), 'us', `That is the U.S. price. Change ¥500 into dollars at the market rate: ¥500 ÷ ${t.R}.`], [t.jp * t.R, 'mul', `Divide, don’t multiply: ¥500 ÷ ${t.R}.`], [t.jp, 'yen', `That is the price in yen. Divide by ${t.R}.`]);
    if (t.id === 'carry' && i === 0) D.push([t.usd * CARRY.start, 'start', `That uses 150, the rate when you started. By month 12 a dollar buys only ${t.R} yen: ${usd0(t.usd)} × ${t.R}.`],
      [100000 * t.R, 'nointerest', `That leaves out the year’s interest. You have ${usd0(t.usd)} now: ${usd0(t.usd)} × ${t.R}.`], [t.usd / t.R, 'div', `To go from dollars to yen, multiply: ${usd0(t.usd)} × ${t.R}.`]);
    if (t.id === 'carry' && i === 2) D.push([t.usd * CARRY.start - t.owe, 'start', `That is what the year would have paid at 150. At ${t.R}, subtract what you owe from the yen you get: ${yen(t.back)} − ${yen(t.owe)}.`],
      [t.back, 'back', `That is the yen you get. Subtract the ${yen(t.owe)} you owe.`], [t.back - CARRY.borrowYen, 'nointerest', `You owe interest too: subtract ${yen(t.owe)}, not ¥15,000,000.`]);
    if (t.id === 'breakeven' && i === 2) D.push([t.usd / t.owe, 'flip', `Divide the yen by the dollars: ${yen(t.owe)} ÷ ${usd0(t.usd)}.`], [t.owe / 100000, 'start', `That uses the $100,000 you started with. You end the year with ${usd0(t.usd)}.`], [t.owe * t.usd, 'mul', `Divide, don’t multiply: ${yen(t.owe)} ÷ ${usd0(t.usd)}.`]);
    return D;
  }
  const plain = (s) => String(s).replace(/<[^>]+>/g, '');
  const CHOICE_MSG = {
    apple: 'Compare dollars with dollars: the Tokyo apple is $1.33 and the Chicago apple is $1.00. A bigger number of yen does not mean a higher price.',
    bigmac: 'Japan’s Big Mac costs less in dollars than the American one, and the market gives about twice the yen that would make the burgers cost the same. By this test the yen is cheap: undervalued.',
    breakeven: 'Compare 150 with your break-even rate of about 143. A move of 7 yen on 150 is about 5%.',
  };

  function judgeTask(t, e, h) {
    const lines = linesFor(t), rows = e.rows || [], rowRes = [];
    if (t.id === 'carry' && !rows.some((x) => x != null && String(x).trim())) return { ok: false, rowRes, msg: 'Run all twelve months, then fill in the table.' };
    lines.forEach((l, i) => {
      if (!l.input) return;
      rowRes[i] = h.judgeNumber(PARSE[l.kind](h, rows[i]), l.num, diagFor(t, l, i),
        { tol: TOL[l.kind](l.num), scale: Math.abs(l.num), unreadable: UNREADABLE[l.kind],
          signMsg: l.num < 0 ? 'You get back less than you owe, so this is a loss. Type it with a minus sign.' : 'The size is right but the sign is flipped.',
          closeMsg: 'Close. Check the arithmetic and round only at the end.', otherMsg: `${plain(l.calc)}.` });
    });
    const bad = rowRes.findIndex((x) => x && !x.ok);
    if (bad >= 0) return { ok: false, rowRes, msg: `${plain(lines[bad].label)}: ${rowRes[bad].msg}` };
    if (t.decision && e.choice !== t.decision) {
      if (!e.choice) return { ok: false, rowRes, msg: 'Now answer the question under the table.' };
      return { ok: false, rowRes, msg: CHOICE_MSG[t.id] };
    }
    return { ok: true, rowRes };
  }

  function helpText(t, lvl) {
    const lines = linesFor(t), blanks = lines.filter((l) => l.input);
    const calcHelp = (l) => (t.id === 'carry' ? l.calc.replace('the rate in month 12', String(t.R)) : l.calc);
    const say = (l) => `${l.label}: ${calcHelp(l)} = ${l.kind === 'text' ? l.num : SHOW[l.kind](l.num)}`;
    const tail = { apple: '<br>The apple is cheaper in Chicago.', bigmac: '<br>Japan’s burger costs less in dollars, so by this measure the yen is undervalued.', breakeven: '<br>From 150 to 143 is a move of 7 yen, about 5%.' };
    return lvl === 1 ? say(blanks[0]) : lines.map(say).join('<br>') + (tail[t.id] || '');
  }
  function praise(t) {
    if (t.id === 'convert') return `${usd0(t.D)} becomes ${yen(t.yen)}, and a ${yen(t.Y)} meal costs ${usd(t.usd)}. To go from dollars to yen you multiply by the rate, and to come back you divide.`;
    if (t.id === 'apple') return 'The Tokyo apple costs $1.33, so Chicago is cheaper by $0.33. A price of 200 yen sounds high only because a yen is a small unit.';
    if (t.id === 'bigmac') return `At about 80 yen per dollar the burgers would cost the same, but the market gave 162. Japan’s Big Mac cost about ${usd(t.jpUsd)} against ${usd(t.us)}, so by this measure the yen was undervalued by about half.`;
    if (t.id === 'carry') return `You earned ${usd0(5000)} of interest and still lost ${yen(-t.answer)}, about ${usd0(-t.answer / t.R)}. For nine months the trade paid every month. In the last three, a yen that strengthened from 150 to 142 per dollar took the whole gain and more. On August 5, 2024, the same thing happened to many traders at once, when a dollar fell to about 144 yen.`;
    if (t.id === 'breakeven') return 'The yen could rise only about 5% before the year’s gain was gone, about the size of the interest gap (5% minus 0.1%). The trade pays for as long as the yen rises by less than the gap. From 2022 to mid-2024 the yen weakened instead: a dollar went from about 115 to about 162 yen, so the carry trade paid month after month for years. Then the yen jumped by more than the gap in a few weeks, and the trade lost fast.';
    return '';
  }
  const fmtIn = (l, x) => String(Math.round(x * 1000) / 1000);
  function selfAnswer(t) {
    const rows = []; linesFor(t).forEach((l, i) => { if (l.input) rows[i] = fmtIn(l, l.num); });
    return { rows, choice: t.decision || null };
  }
  function selfWrong(t) {
    const rows = []; linesFor(t).forEach((l, i) => { if (l.input) rows[i] = fmtIn(l, l.num * 1.3); });
    return { rows, choice: t.decision || null };
  }

  root.DESK = {
    app: 'finan3-w12-currency-desk', version: 1, seedVersion: 1, salt: 'rize-finan3-w12-currency:c391de', points: 60,
    storageKey: 'rize-finan3-w12-currency-v1', filePrefix: 'CurrencyDesk',
    verifyUrl: 'https://rizecomputerscience.github.io/finan3-currency-desk/v2/verify.html',
    calcPlaceholder: '105000*142',
    calcHint: '',
    story: { title: 'The Currency Desk', kicker: 'Financial Markets and Institutions, Unit 12', company: 'Great Lakes Community Bank', team: 'Currency Desk',
      from: '', fromTitle: '',
      dek: 'Customers of Great Lakes Community Bank travel and do business abroad, and each of them needs to know what a dollar is worth in another currency. You staff the bank’s currency desk. Work out whether the yen is cheap, then run, month by month, a year of the trade that went wrong in August 2024.',
      whatBox: '',
      stepsLine: 'Ten short steps. Each calculation shows a worked example in the same table you fill in. In step 6 you move through a year one month at a time.' },
    steps: STEPS, quiz: QUIZ, walk: null, buildTasks, taskView, judgeTask, helpText, praise, selfAnswer, selfWrong,
    note: { title: 'Your reply to Travis', label: 'Your reply to Travis', minWords: 30, receiptHeading: 'Reply to Travis: is the yen cheap at 150 to the dollar?',
      prompt: 'Travis texts: “The yen is cheap. A dollar buys 150 of them!” Reply in at least 30 words, using something you worked out on this desk.' },
    // For tests and the lesson check (not used by the engine).
    CARRY, BIGMAC, carryAt, carrySim, linesFor, EXAMPLES, NEWS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
