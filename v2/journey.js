/* The Currency Desk, version 2: the journey's logic and words (no DOM). Built 2026-11-18.
   config.js and desk-engine.js are version 1's files, unchanged: they keep the steps, the judging, the receipt payload and
   the verifier. This file adds what version 2 needs on top: the stops of the trip, the carry-trade ride with the choice to
   close early, the Big Mac dial, the market simulation, the strong-dollar postcards, and every sentence the student reads
   that is not already in config.js. tests/journey_test.js loads it in Node. */
(function (root) {
  'use strict';
  const C = root.DESK;

  // ---------------- formatting ----------------
  const yen = (x) => (x < 0 ? '−¥' : '¥') + Math.abs(Math.round(x)).toLocaleString('en-US');
  const yenSigned = (x) => (x > 0 ? '+' : '') + yen(x);
  const usd0 = (x) => (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('en-US');
  const usd2 = (x) => (x < 0 ? '−$' : '$') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const r1 = (x) => String(Math.round(x * 10) / 10);

  // ---------------- the stops ----------------
  // One stop per version 1 step, same ids and order. `scene` names the drawing; `sky` is the chapter's light.
  const STOPS = [
    { id: 'q1', place: 'Departures', title: 'Why Did the Board Change?', scene: 'board', sky: 'day' },
    { id: 'convert', place: 'Exchange counter', title: 'Change Your Money', scene: 'counter', sky: 'day' },
    { id: 'apple', place: 'Fruit stand', title: 'The Apple', scene: 'fruit', sky: 'night' },
    { id: 'bigmac', place: 'Burger counter', title: 'The Big Mac', scene: 'burger', sky: 'night' },
    { id: 'q2', place: 'The market', title: 'Who Sets the Price?', scene: 'market', sky: 'night' },
    { id: 'carry', place: 'Trading floor', title: 'The Carry Trade', scene: 'floor', sky: 'deep' },
    { id: 'breakeven', place: 'Trading floor', title: 'How Far Can the Yen Rise?', scene: 'floor', sky: 'deep' },
    { id: 'q3', place: 'Postcards', title: 'Who Is Happy?', scene: 'postcards', sky: 'dawn' },
    { id: 'q4', place: 'A coin', title: 'A Coin That Promises $1', scene: 'coin', sky: 'dawn' },
    { id: 'note', place: 'Home', title: 'Write Home', scene: 'postcard', sky: 'dawn' },
  ];

  // ---------------- step 2: the counter ----------------
  // Notes the clerk counts out: ten-thousand-yen and thousand-yen notes (remainder under ¥1,000 shown as coins).
  function notesFor(y) { const big = Math.floor(y / 10000), small = Math.floor((y - big * 10000) / 1000); return { big, small, rest: y - big * 10000 - small * 1000 }; }

  // ---------------- step 4: the Big Mac dial ----------------
  const DIAL = { min: 60, max: 180, market: C.BIGMAC.jpRate, target: C.BIGMAC.jp / C.BIGMAC.us, snap: 1.5 };
  const burgerUsd = (rate) => C.BIGMAC.jp / rate;               // Japan's ¥500 burger in dollars at this rate
  const dialSnap = (rate) => (Math.abs(rate - DIAL.target) <= DIAL.snap ? DIAL.target : rate);
  const dialBalanced = (rate) => Math.abs(rate - DIAL.target) < 0.05;
  // Beam tilt in degrees: positive tips toward the dearer burger's side (the American one when the Japanese is cheaper).
  const tilt = (a, b) => Math.max(-14, Math.min(14, 40 * (b - a) / Math.max(a, b)));
  const SWISS = { local: C.BIGMAC.ch, us: C.BIGMAC.us, market: C.BIGMAC.chRate, target: C.BIGMAC.ch / C.BIGMAC.us };

  // ---------------- step 5: the market ----------------
  // A sketch, not data: each order moves the yen by a set amount; Japan's government steps in once when the yen passes 156.
  const ORDERS = [
    { id: 'tourists', who: 'Tourists', what: 'buy yen for a trip to Tokyo', side: 'buy', move: -0.6 },
    { id: 'carmaker', who: 'A Japanese carmaker', what: 'changes its U.S. sales into yen', side: 'buy', move: -1.4 },
    { id: 'fundA', who: 'A fund', what: 'sells yen to buy dollars that pay 5%', side: 'sell', move: 2.6 },
    { id: 'fundB', who: 'A bank’s traders', what: 'sell yen to buy dollars that pay 5%', side: 'sell', move: 3.0 },
    { id: 'fundC', who: 'A hedge fund', what: 'sells yen to buy dollars that pay 5%', side: 'sell', move: 3.4 },
  ];
  const MARKET = { start: 150, line: 156, intervene: -5, hkLink: 7.80, hkLo: 7.75, hkHi: 7.85, hkPerYen: 0.02, cnPerYen: 0.3, cnBand: 2 };
  // Play a sequence of order ids. Returns each state after each order: the yen, whether Japan stepped in, Hong Kong's rate and
  // its defender's reserve (100 = full), and the yuan's distance from the central rate in percent (clamped to the 2% band).
  function playMarket(ids) {
    let yenR = MARKET.start, stepped = false, hk = MARKET.hkLink, reserve = 100, cn = 0; const out = [];
    for (const id of ids) {
      const o = ORDERS.find((x) => x.id === id); if (!o) continue;
      yenR += o.move; let mof = false;
      if (!stepped && yenR > MARKET.line) { stepped = true; mof = true; yenR += MARKET.intervene; }
      const hkWant = hk + o.move * MARKET.hkPerYen;
      if (hkWant > MARKET.hkHi) { reserve = Math.max(20, reserve - 100 * (hkWant - MARKET.hkHi) / 0.25); hk = MARKET.hkHi; } else hk = Math.max(MARKET.hkLo, hkWant);
      cn = Math.max(-MARKET.cnBand, Math.min(MARKET.cnBand, cn + o.move * MARKET.cnPerYen));
      out.push({ id, yen: Math.round(yenR * 10) / 10, mof, hk: Math.round(hk * 1000) / 1000, reserve: Math.round(reserve), cn: Math.round(cn * 100) / 100, hkDefends: hkWant > MARKET.hkHi });
    }
    return out;
  }

  // ---------------- step 6: the ride ----------------
  // Every ride gets its own year, from a seed. What never changes: a dollar buys 142 yen at the end of month 12, so holding to
  // the end always turns $105,000 into ¥14,910,000 against ¥15,015,000 owed, a loss of ¥105,000 (version 1's verified
  // figures, the graded ledger and the key). What changes: small wobbles in the calm months (a dollar buys 149.7 to 151.4
  // yen, so every calm month still shows a gain), the month the yen turns (after month 6 to 10), and the shape of the slide.
  // config.js's carryAt(m, rate) computes every number; version 1's fixed path (150 for nine months, then 149, 147, 142)
  // stays in config.js as the reference year that core_test.js checks.
  function rng32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const newSeed = () => (Math.floor(Math.random() * 2147483646) + 1);
  const SHAPES = ['cliff', 'steady', 'stairs'];
  function makePath(seed) {
    const r = rng32((seed >>> 0) ^ 0x9E3779B9), rates = [], r1 = (x) => Math.round(x * 10) / 10;
    const turn = 6 + Math.floor(r() * 5);                         // the last calm month: 6, 7, 8, 9 or 10
    let drift = 0;
    for (let m = 1; m <= turn; m++) { drift = Math.max(-0.3, Math.min(1.4, drift + (r() - 0.4) * 0.6)); rates.push(r1(150 + drift)); }
    const shape = SHAPES[Math.floor(r() * SHAPES.length)], n = 12 - turn, start = rates[turn - 1], drop = start - 142;
    // Cumulative share of the drop reached at the end of each slide month; the last is always 1 (142 exactly).
    const cum = [];
    for (let i = 1; i < n; i++) {
      const x = i / n, f = shape === 'cliff' ? 0.35 * x * x + 0.05 * r() : shape === 'stairs' ? (x < 0.5 ? 0.45 : 0.6) + 0.1 * r() : x * (0.85 + 0.2 * r());
      cum.push(Math.max(cum.length ? cum[cum.length - 1] + 0.04 : 0.06, Math.min(0.92, f)));
    }
    cum.push(1);
    cum.forEach((f, i) => rates.push(i === cum.length - 1 ? 142 : Math.max(142.6, r1(start - drop * f))));
    // A false alarm in a calm month (Japan buys yen, the yen firms a little), in about half the years with a late turn.
    const alarm = turn >= 8 && r() < 0.5 ? 3 + Math.floor(r() * (turn - 4)) : 0;
    if (alarm) rates[alarm - 1] = r1(Math.max(149.7, rates[alarm - 1] - 0.4));
    return { seed: seed >>> 0, turn, shape, alarm, rates };
  }
  const REF = { seed: 0, turn: 9, shape: 'reference', alarm: 0, rates: C.CARRY.path.slice() };   // version 1's year
  const rateAt = (m, path) => (m === 0 ? C.CARRY.start : (path || REF).rates[m - 1]);
  function closeResult(k, path) { const r = C.carryAt(k, rateAt(k, path)); return { month: k, rate: r.rate, gainYen: r.gainYen, gainUsd: r.gainUsd, usd: r.usd, owe: r.owe, back: r.back }; }
  const bestExit = (path) => { let b = 1; for (let m = 2; m <= 12; m++) if (closeResult(m, path).gainYen > closeResult(b, path).gainYen) b = m; return b; };
  // The receipt's value field: 'held' or 'closed:<month>', then ':<seed in base 36>' (version 1's judge ignores it).
  const rideValue = (closedAt, seed) => (closedAt >= 12 ? 'held' : 'closed:' + closedAt) + (seed ? ':' + (seed >>> 0).toString(36) : '');
  function parseRide(v) { const m = String(v || '').match(/^(held|closed:(\d{1,2}))(?::([0-9a-z]{1,7}))?$/); if (!m) return null; const k = m[1] === 'held' ? 12 : Math.min(12, Math.max(1, +m[2])); return { k, seed: m[3] ? parseInt(m[3], 36) : 0 }; }
  const parseRideValue = (v) => { const p = parseRide(v); return p ? p.k : null; };
  const pathOf = (seed) => (seed ? makePath(seed) : REF);
  // The ticker: one line a month, of the kinds of news that came before August 2024 (FACTS.md).
  const CALM = ['Your interest arrives. A dollar buys {r} yen.', 'Another quiet month. A dollar buys {r} yen.', 'More traders run the same trade: borrow yen, buy dollars. A dollar buys {r} yen.', 'Borrowing yen still costs almost nothing. A dollar buys {r} yen.', 'Your pile keeps growing. A dollar buys {r} yen.'];
  function newsFor(m, path) {
    path = path || REF; const r = String(rateAt(m, path)), f = (t) => t.replace('{r}', r);
    if (m === 0) return 'Day one. Your $100,000 sits in a U.S. account paying 5% a year, and you owe a bank in Japan ¥15,000,000 at 0.1%.';
    if (m === 12) return 'Everyone who borrowed yen rushes to repay at once, and all that buying pushes the yen up. A dollar buys 142 yen.';
    if (m === path.alarm) return f('Japan’s government buys yen to slow its fall, as it did in 2024. A dollar buys {r} yen.');
    if (m === path.turn) return f('Japan’s central bank hints that it will raise its interest rate. A dollar buys {r} yen.');
    if (m === path.turn + 1) return f('Japan’s central bank raises its rate. Some traders start buying back yen to repay their loans. A dollar buys {r} yen.');
    if (m > path.turn) return f('More traders buy back yen to repay their loans, and the yen keeps rising. A dollar buys {r} yen.');
    return f(CALM[(m + (path.seed % 5)) % CALM.length]);
  }
  const NEWS = Array.from({ length: 13 }, (_, m) => newsFor(m, REF));
  const mo = (n) => n + (n === 1 ? ' month' : ' months');
  function rideEnding(closedAt, path) {
    const held = closeResult(12, path);
    if (closedAt >= 12) return `You held all twelve months. Changing $105,000 back at 142 gives less than the ¥15,015,000 you owe.`;
    const r = closeResult(closedAt, path);
    return `You closed in month ${closedAt} and kept ${yenSigned(r.gainYen)}, about ${usd0(r.gainUsd)}. A trader who held on to the end lost ${yen(-held.gainYen)}.`;
  }
  function rideReceiptLine(closedAt, path) {
    if (closedAt == null) return 'Carry trade: not run yet';
    if (closedAt >= 12) return `Carry trade: held all 12 months, ${yenSigned(closeResult(12, path).gainYen)}`;
    return `Carry trade: closed in month ${closedAt}, ${yenSigned(closeResult(closedAt, path).gainYen)}`;
  }
  // The ending a player compares with a friend: where they got out against this year's best exit.
  function exitVerdict(k, path) {
    const B = bestExit(path), best = closeResult(B, path).gainYen, g = closeResult(k, path).gainYen, pct = Math.round(100 * g / best);
    if (k >= 12) return `You held to the end and lost ${yen(-g)}. This year’s best exit was month ${B}, at ${yenSigned(best)}.`;
    if (k === B) return `You got out at the top. Month ${B} was this year’s best exit, at ${yenSigned(best)}.`;
    if (k < B) return `You got out ${mo(B - k)} before the top and kept ${pct}% of the best possible gain.`;
    if (g < 0) return `You got out ${mo(k - B)} after the top, too late, and lost ${yen(-g)}. Holding to the end would have lost ¥105,000.`;
    return `You got out ${mo(k - B)} after the top, as the yen rose, and kept ${pct}% of the best possible gain.`;
  }
  function shareText(k, path) {
    const B = bestExit(path), g = closeResult(k, path).gainYen;
    if (k >= 12) return `I held the yen carry trade too long and lost ${yen(-g)}. Bet you can’t time it:`;
    if (k === B) return `I made ${yen(g)} on the yen carry trade and got out at the exact top. Bet you can’t:`;
    if (g < 0) return `I got out of the yen carry trade too late and lost ${yen(-g)}. Bet you can do better:`;
    return `I made ${yen(g)} on the yen carry trade and got out ${mo(Math.abs(B - k))} ${k < B ? 'before' : 'after'} the top. Beat me:`;
  }
  function challengeLine(k, path) {
    const g = closeResult(k, path).gainYen;
    if (k >= 12) return `A friend held this yen trade to the end and lost ${yen(-g)}. Same year. Can you beat it?`;
    return `A friend got out of this yen trade in month ${k} with ${yenSigned(g)}. Same year. Can you beat it?`;
  }
  // Praise for the close-out table. It keeps version 1's facts ($5,000 of interest, a loss of ¥105,000, August 5, 2024) and
  // describes this year's path.
  function carryPraise(t, closedAt, path) {
    path = path || REF; const loss = yen(-t.answer), lossUsd = usd0(-t.answer / t.R), start = rateAt(path.turn, path);
    const W = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    const tail = `For ${W[path.turn]} months the trade paid every month. In the last ${['', 'month', 'two months', 'three months', 'four months', 'five months', 'six months'][12 - path.turn]}, a yen that strengthened from ${start} to 142 per dollar took the whole gain and more. On August 5, 2024, the same thing happened to many traders at once, when a dollar fell to about 144 yen.`;
    if (closedAt == null || closedAt >= 12) return `Right. You earned ${usd0(5000)} of interest and still lost ${loss}, about ${lossUsd}. ${tail}`;
    return `Right. Holding to the end earned ${usd0(5000)} of interest and still lost ${loss}, about ${lossUsd}. ${tail}`;
  }

  // ---------------- step 7: break-even slider ----------------
  const BE = { min: 135, max: 155, at: (rate) => C.carryAt(12, rate).gainYen, zero: C.carryAt(12).owe / C.carryAt(12).usd, snap: 0.3 };
  const beSnap = (rate) => (Math.abs(rate - BE.zero) <= BE.snap ? BE.zero : rate);
  // The real history (FRED DEXJPUS and the sources in w12/sources/FACTS.md). Dates are ISO; `y` is the label's rate.
  const HISTORY_NOTES = [
    { date: '2022-01-03', y: 115.27, text: 'January 2022: about 115' },
    { date: '2022-09-22', y: 142.16, text: 'September 2022: Japan buys yen', mof: true },
    { date: '2022-10-20', y: 149.82, text: 'October 2022: about 150' },
    { date: '2024-04-29', y: 156.71, text: 'April and May 2024: Japan buys yen', mof: true },
    { date: '2024-07-10', y: 161.73, text: 'July 10, 2024: about 162' },
    { date: '2024-07-31', y: 150.38, text: 'July 31, 2024: Japan’s central bank raises its rate to 0.25%' },
    { date: '2024-08-05', y: 143.95, text: 'August 5, 2024: about 144. Japan’s Nikkei 225 falls 12.4%, its worst day since 1987' },
  ];

  // ---------------- step 8: who is happy ----------------
  // The three postcards map onto version 1's four options, so the receipt records the same choice index.
  const PEOPLE = [
    { id: 'tractor', who: 'linda', name: 'A Michigan company selling tractors in Europe', after: 'Its $100,000 tractor now costs 10% more in euros, so European farmers may buy elsewhere.', says: 'Our $100,000 tractor just got 10% dearer in euros. French farmers may buy elsewhere.', happy: false },
    { id: 'student', who: 'maya', name: 'An American student spending a semester in Tokyo', after: 'Each $1,000 she changes now buys 10% more yen.', says: 'Every $1,000 I change now buys 10% more yen. Sushi night!', happy: true },
    { id: 'toyota', name: 'Toyota selling cars in the U.S.', after: 'Each $30,000 car it sells in the U.S. now changes into 10% more yen.', happy: true },
  ];
  function happyChoice(set) {
    const s = new Set(set), has = (k) => s.has(k);
    if (has('student') && has('toyota') && !has('tractor')) return 0;
    if (has('tractor') && !has('student') && !has('toyota')) return 1;
    if (has('tractor') && has('student') && has('toyota')) return 2;
    if (has('tractor') && has('student') && !has('toyota')) return 3;
    return null;
  }
  function happyFeedback(set) {
    const s = new Set(set);
    if (!s.size) return 'Tap everyone who is happy, then check.';
    const q = C.quiz[2], i = happyChoice(set);
    if (i != null) return q.why[i];
    if (s.has('tractor')) return 'The tractors now cost more in euros, which hurts the tractor company. Switch it to Hurt.';
    return s.has('student') ? 'The student is right. One more wins: who earns dollars in the U.S. and spends yen at home?' : 'Toyota is right. One more wins: who spends dollars in Japan?';
  }

  // ---------------- step 5: what sets each price (sorted onto the three currencies) ----------------
  const SORT_CHIPS = [['free', 'Buyers and sellers, every second'], ['fix', 'A central rate each morning, 2% band'], ['peg', 'A defender selling U.S. dollars at 7.85']];
  const SORT_KEY = { yen: 'free', cn: 'fix', hk: 'peg' };
  const SORT_WHY = {
    yen: 'The yen moved with every order you sent, and nobody fixed it: buyers and sellers did.',
    cn: 'The yuan stopped at the edge of its band, 2% from the central rate China’s central bank sets each morning.',
    hk: 'Hong Kong’s dollar stuck at 7.85 because its defender sold U.S. dollars from its reserve.',
  };
  function judgeSort(placed) {
    const right = Object.keys(SORT_KEY).filter((g) => placed[g] === SORT_KEY[g]), wrong = Object.keys(SORT_KEY).filter((g) => placed[g] && placed[g] !== SORT_KEY[g]);
    return { ok: right.length === 3, right, wrong, msg: wrong.length ? SORT_WHY[wrong[0]] + ' Its label goes back to the pile; place it again.' : '' };
  }
  const SORT_DONE = 'Hong Kong’s dollar is pegged: its defender holds the band.';
  // ---------------- step 9: what holds the coin up (version 1's four options, as short labels, same order) ----------------
  const COIN_SUPPORTS = ['The cash and bonds in its vault', 'A Fed guarantee', 'Its computer code', 'Bitcoin’s price'];
  const COIN_ASK = 'What holds the coin up at $1? Tap it.';

  // ---------------- the people on the trip: who says what, and when ----------------
  const NAMES = { dana: 'Dana, exchange clerk', sato: 'Mrs. Sato, fruit seller', travis: 'Travis, on your flight', ken: 'Ken, yen trader', linda: 'Linda, Michigan tractor maker', maya: 'Maya, student in Tokyo' };
  const LINES = {
    q1: ['travis', 'shocked', 'In January 2022 a dollar got you 115 yen. By October it got 150. What happened?'],
    q1After: ['travis', 'happy', 'So everyone wanted dollars. Good for me: more yen for my trip.'],
    convert: ['dana', 'happy', 'Dollars times the rate gives you yen. The man before you got ¥45,000 for $300.'],
    convertAfter: (t) => ['dana', 'happy', `${yen(t.yen)} for your ${usd0(t.D)}. Have a good flight.`],
    sato: ['sato', 'happy', 'Apples! ¥200 each.'],
    apple: ['travis', 'smug', 'A dollar buys 150 yen, so yen are cheap. This apple has to be a bargain.'],
    appleAfter: ['travis', 'worried', 'Huh. $1.33. So 150 yen to the dollar doesn’t make anything cheap.'],
    bigmac: ['travis', 'happy', 'A Big Mac for ¥500? That’s about three bucks!'],
    bigmacAfter: ['travis', 'smug', 'So by the burger, the yen really is undervalued. I’m having two.'],
    q2: ['ken', 'smug', 'I’m Ken. I trade yen. Nobody sets this price. A carmaker bringing U.S. sales home has to buy yen, and buying pushes the yen up. Send these orders in.'],
    q2Mof: ['ken', 'shocked', 'Japan’s government just stepped in and bought yen. It did that in 2022 and 2024.'],
    q2Sort: ['ken', 'flat', 'Three currencies, three systems. Put each label on the one it runs.'],
    q2After: ['ken', 'happy', 'Floating, pegged, managed. Now let me show you my favorite trade.'],
    day1: ['ken', 'smug', 'Borrow yen almost free, earn 5% in dollars. I’ve run this since 2022. Free money.'],
    danger: ['ken', 'flat', 'The interest is locked in. The only thing that can hurt you is the yen getting stronger before you change back. Never happens.'],
    breakeven: ['ken', 'flat', 'How far could the yen have risen before we lost money? I never worked it out.'],
    breakevenAfter: ['ken', 'worried', 'About 5%. In August 2024 it rose more than that in a few weeks.'],
    note: ['travis', 'smug', 'The yen is cheap. A dollar buys 150 of them!'],
  };
  // Ken on the trading floor, every month. He always holds to the end.
  function kenSays(m, path, youOut) {
    path = path || REF; const CALM = ['Told you. Free money.', 'Another month of interest for doing nothing.', 'Everyone on this floor runs the same trade.', 'Borrowing yen costs nothing. Why would you stop?'];
    if (m === 0) return ['ken', 'smug', LINES.day1[2]];
    if (m === 12) return ['ken', 'shocked', 'Everyone is buying back yen at once. I need to make some calls.'];
    if (m === path.alarm) return ['ken', 'flat', 'Japan bought yen again. They always back off.'];
    if (m === path.turn) return ['ken', 'smug', 'The Bank of Japan has hinted before. I’m staying in.'];
    if (m === path.turn + 1) return ['ken', 'flat', 'A blip. Hold your nerve.'];
    if (m > path.turn) return ['ken', 'worried', 'Everyone is buying back yen. I’m fine. Probably.'];
    if (youOut) return ['ken', 'smug', `Cashed out? I just collected another month. Rookie.`];
    return ['ken', 'smug', CALM[(m + (path.seed % 4)) % 4]];
  }
  function kenEnding(k, path) {
    const B = bestExit(path), g = closeResult(k, path).gainYen;
    if (k >= 12) return ['ken', 'worried', 'We both rode it down. I said free money. I was wrong.'];
    if (k === B) return ['ken', 'shocked', `You got out at the very top with ${yenSigned(g)}? I lost ¥105,000. Lunch is on you.`];
    if (g < 0) return ['ken', 'worried', 'Late, but not as late as me. I lost ¥105,000.'];
    if (k < B) return ['ken', 'worried', `I laughed when you left. Then I lost ¥105,000. You kept ${yenSigned(g)}.`];
    return ['ken', 'flat', `You got out after the top but before me. You kept ${yenSigned(g)}; I lost ¥105,000.`];
  }
  // What the next month could bring, so holding is a judgment: the same rate, or a yen two yen stronger.
  function nextMonthCases(m, path) { const r = rateAt(m, path); return { rate: r, stay: C.carryAt(m + 1, r).gainYen, dropRate: Math.round((r - 2) * 10) / 10, drop: C.carryAt(m + 1, r - 2).gainYen }; }
  // Day one, worked: the trade's two ends.
  const DANGER = { stay: C.carryAt(12, 150), fall: C.carryAt(12, 142) };

  // ---------------- every sentence above a first control (rule 28: at most about 40 words) ----------------
  const PROMPTS = {
    start: 'Borrow ¥15,000,000 at almost no interest, earn 5% in dollars, and choose each month whether to cash out. Traders made money this way for years, until August 2024.',
    trip: 'Taking Unit 12? Take the whole trip from Chicago to Tokyo. Reaching the end earns full credit.',
    q1: 'In 2022 the Fed raised its rate above 4%, as you saw in Unit 3. Japan kept its rate below zero. Where does an investor’s money go?',
    convert: (t) => `You hand over ${usd0(t.D)}. The board says ${t.R} yen per dollar. How many yen do you get?`,
    convertMeal: (t) => `In Tokyo, a meal costs ${yen(t.Y)}. What does it cost in dollars?`,
    apple: (t) => `An apple costs ${yen(t.yen)} in Tokyo and ${usd2(t.usd)} in Chicago. A dollar buys ${t.R} yen. Where is the apple cheaper, and by how much in dollars?`,
    bigmac: (t) => `On ${C.BIGMAC.date}, a Big Mac cost ${yen(t.jp)} in Japan and ${usd2(t.us)} in the U.S. A dollar bought ${t.R} yen. What exchange rate would make the two burgers cost the same?`,
    q2: 'Send the orders in and watch three currencies react.',
    carryDay1: 'Make Ken’s favorite trade in three taps, then see how the year can end.',
    carryEnd: 'Ken held to the end. Compare your year with his.',
    carryRide: 'Each month, hold or cash out.',
    carryLedger: 'Work out the year for a trader who held to the end. Change the dollars back at 142 and repay the loan.',
    breakeven: (t) => `You ended the year with ${usd0(t.usd)} and owed ${yen(t.owe)}. At what rate would your dollars repay the loan exactly, with nothing left over?`,
    q3: 'The dollar rises 10% against the euro and the yen. Mark each one Happy or Hurt.',
    q4: 'Hong Kong keeps its peg by selling U.S. dollars from its reserve. A stablecoin is a peg run by a company.',
    note: 'Travis texts you from Tokyo. Answer him in three sentences, using something you worked out on this trip.',
  };
  const MARKET_NOTES = {
    mof: 'Japan’s government sells dollars and buys yen to slow the fall, as it did in 2022 and 2024.',
    hk: 'Held between 7.75 and 7.85 since 2005. At 7.85 the Hong Kong Monetary Authority sells U.S. dollars from its reserve.',
    cn: 'China’s central bank sets a central rate each morning; the yuan may move only 2% from it.',
    sketch: 'These moves are a sketch. The real market trades more than $9 trillion of currencies a day.',
    sketchShort: '(a sketch: the real market trades more than $9 trillion a day)',
  };
  const USDC = 'In March 2023, $3.3 billion of USDC’s reserves were stuck at Silicon Valley Bank. The coin fell to about 86 cents, and it was back to $1 on March 13, after regulators said every depositor would be repaid.';

  root.JOURNEY = { STOPS, notesFor, DIAL, burgerUsd, dialSnap, dialBalanced, tilt, SWISS, ORDERS, MARKET, playMarket,
    closeResult, bestExit, makePath, pathOf, newSeed, rateAt, REF, newsFor, parseRide, exitVerdict, shareText, challengeLine, rideValue, parseRideValue, NEWS, rideEnding, rideReceiptLine, carryPraise, BE, beSnap, HISTORY_NOTES,
    NAMES, LINES, kenSays, kenEnding, nextMonthCases, DANGER, PEOPLE, happyChoice, happyFeedback, SORT_CHIPS, SORT_KEY, SORT_WHY, judgeSort, SORT_DONE, COIN_SUPPORTS, COIN_ASK, PROMPTS, MARKET_NOTES, USDC, fmt: { yen, yenSigned, usd0, usd2, r1 } };
})(typeof window !== 'undefined' ? window : globalThis);
