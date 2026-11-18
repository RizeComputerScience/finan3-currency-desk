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
  // carryAt(m) from config.js is the one source of every month's numbers. A ride is { month, closedAt } with closedAt null
  // while the trade is open, a month 1..11 if the student closed early, or 12 when the year ended with the trade held.
  const at = (m) => C.carryAt(m);
  function closeResult(k) { const r = at(k); return { month: k, rate: r.rate, gainYen: r.gainYen, gainUsd: r.gainUsd, usd: r.usd, owe: r.owe, back: r.back }; }
  const rideValue = (closedAt) => (closedAt >= 12 ? 'held' : 'closed:' + closedAt);
  function parseRideValue(v) { const s = String(v || ''); if (s === 'held') return 12; const m = s.match(/^closed:(\d{1,2})$/); return m ? Math.min(12, Math.max(1, +m[1])) : null; }
  const NEWS = [
    'Day one. Your $100,000 sits in a U.S. account paying 5% a year, and you owe a bank in Japan ¥15,000,000 at 0.1%.',
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
    'Everyone who borrowed yen rushes to repay at once, and all that buying pushes the yen up. A dollar buys 142 yen.',
  ];
  // The ending's two sentences, for the student who held and for the one who closed.
  function rideEnding(closedAt) {
    const held = at(12);
    if (closedAt >= 12) return `You held all twelve months. Changing $105,000 back at 142 gives less than the ¥15,015,000 you owe.`;
    const r = closeResult(closedAt);
    return `You closed in month ${closedAt} and kept ${yenSigned(r.gainYen)}, about ${usd0(r.gainUsd)}. A trader who held on to the end lost ${yen(-held.gainYen)}.`;
  }
  function rideReceiptLine(closedAt) {
    if (closedAt == null) return 'Carry trade: not run yet';
    if (closedAt >= 12) return `Carry trade: held all 12 months, ${yenSigned(at(12).gainYen)}`;
    return `Carry trade: closed in month ${closedAt}, ${yenSigned(closeResult(closedAt).gainYen)}`;
  }
  // The ending a player compares with a friend: where they got out against the best possible exit (month 9, the top).
  const gains = () => Array.from({ length: 12 }, (_, i) => at(i + 1).gainYen);
  const BEST = gains().indexOf(Math.max(...gains())) + 1;
  function exitVerdict(k) {
    const best = at(BEST).gainYen, g = at(k).gainYen, pct = Math.round(100 * g / best), mo = (n) => n + (n === 1 ? ' month' : ' months');
    if (k >= 12) return `You held to the end and lost ${yen(-g)}. The best exit was month ${BEST}, at ${yenSigned(best)}.`;
    if (k === BEST) return `You got out at the top. Month ${BEST} was the best possible exit, at ${yenSigned(best)}.`;
    if (k < BEST) return `You got out ${mo(BEST - k)} before the top and kept ${pct}% of the best possible gain.`;
    return `You got out ${mo(k - BEST)} after the top, as the yen turned, and kept ${pct}% of the best possible gain.`;
  }
  function shareText(k) {
    if (k >= 12) return `I held the yen carry trade for all 12 months and lost ${yen(-at(12).gainYen)}. Can you get out in time?`;
    return `I rode the yen carry trade and got out in month ${k} with ${yenSigned(at(k).gainYen)}. Holding to the end lost ${yen(-at(12).gainYen)}. Can you beat me?`;
  }
  function challengeLine(k) {
    if (k >= 12) return `A friend held the yen trade to the end and lost ${yen(-at(12).gainYen)}. Can you get out in time?`;
    return `A friend got out of the yen trade in month ${k} with ${yenSigned(at(k).gainYen)}. Can you beat that?`;
  }
  // Praise for the close-out table, by path. Both keep version 1's facts: $5,000 of interest, 150 to 142, August 5, 2024.
  function carryPraise(t, closedAt) {
    const loss = yen(-t.answer), lossUsd = usd0(-t.answer / t.R);
    const tail = 'For nine months the trade paid every month. In the last three, a yen that strengthened from 150 to 142 per dollar took the whole gain and more. On August 5, 2024, the same thing happened to many traders at once, when a dollar fell to about 144 yen.';
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
    { id: 'tractor', name: 'A Michigan company selling tractors in Europe', after: 'Its $100,000 tractor now costs 10% more in euros, so European farmers may buy elsewhere.', happy: false },
    { id: 'student', name: 'An American student spending a semester in Tokyo', after: 'Each $1,000 she changes now buys 10% more yen.', happy: true },
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
    if (s.has('tractor')) return 'The tractors now cost more in euros, which hurts the tractor company. Tap it again to take it out.';
    return s.has('student') ? 'The student is right. One more wins: who earns dollars in the U.S. and spends yen at home?' : 'Toyota is right. One more wins: who spends dollars in Japan?';
  }

  // ---------------- every sentence above a first control (rule 28: at most about 40 words) ----------------
  const PROMPTS = {
    start: 'Borrow ¥15,000,000 at almost no interest, earn 5% in dollars, and choose each month whether to cash out. Traders made money this way for years, until August 2024.',
    trip: 'Taking Unit 12? Take the whole trip from Chicago to Tokyo: ten stops, then your receipt. Finish all ten for full points. A wrong answer never costs points.',
    q1: 'In January 2022 a dollar bought 115 yen. By October it bought 150.',
    convert: (t) => `You hand over ${usd0(t.D)}. The board says ${t.R} yen per dollar. How many yen do you get?`,
    convertMeal: (t) => `In Tokyo, a meal costs ${yen(t.Y)}. What does it cost in dollars?`,
    apple: (t) => `An apple costs ${yen(t.yen)} in Tokyo and ${usd2(t.usd)} in Chicago. A dollar buys ${t.R} yen. Where is the apple cheaper, and by how much in dollars?`,
    bigmac: (t) => `On ${C.BIGMAC.date}, a Big Mac cost ${yen(t.jp)} in Japan and ${usd2(t.us)} in the U.S. A dollar bought ${t.R} yen. What exchange rate would make the two burgers cost the same?`,
    q2: 'Nobody fixes how many yen a dollar buys. Send these orders into the market and watch the yen, Hong Kong’s dollar and China’s yuan.',
    carryDay1: 'You borrow yen where interest is almost free and earn 5% in dollars. Make the trade in three taps.',
    carryRide: 'Every month, hold the trade or close it and keep what you have.',
    carryLedger: 'Work out the year for a trader who held to the end. Change the dollars back at 142 and repay the loan.',
    breakeven: (t) => `You ended the year with ${usd0(t.usd)} and owed ${yen(t.owe)}. At what rate would your dollars repay the loan exactly, with nothing left over?`,
    q3: 'The dollar rises 10% against the euro and the yen. Tap everyone who is happy.',
    q4: 'Hong Kong keeps its peg by selling U.S. dollars from its reserve. A stablecoin is a peg run by a company.',
    note: 'A friend texts you: “The yen is cheap. A dollar buys 150 of them!” Answer your friend in three sentences, using something you worked out on this trip.',
  };
  const MARKET_NOTES = {
    mof: 'Japan’s government sells dollars and buys yen to slow the fall, as it did in 2022 and 2024.',
    hk: 'Hong Kong has held its dollar between 7.75 and 7.85 since 2005. At 7.85 the Hong Kong Monetary Authority sells U.S. dollars from its reserve.',
    cn: 'China’s central bank sets a central rate each morning, and the yuan may move only 2% from it.',
    sketch: 'These moves are a sketch. The real market trades more than $9 trillion of currencies a day.',
  };
  const USDC = 'In March 2023, $3.3 billion of USDC’s reserves were stuck at Silicon Valley Bank. The coin fell to about 86 cents, and it was back to $1 on March 13, after regulators said every depositor would be repaid.';

  root.JOURNEY = { STOPS, notesFor, DIAL, burgerUsd, dialSnap, dialBalanced, tilt, SWISS, ORDERS, MARKET, playMarket,
    closeResult, BEST, exitVerdict, shareText, challengeLine, rideValue, parseRideValue, NEWS, rideEnding, rideReceiptLine, carryPraise, BE, beSnap, HISTORY_NOTES,
    PEOPLE, happyChoice, happyFeedback, PROMPTS, MARKET_NOTES, USDC, fmt: { yen, yenSigned, usd0, usd2, r1 } };
})(typeof window !== 'undefined' ? window : globalThis);
