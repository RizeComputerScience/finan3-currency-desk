/* The Currency Desk, step-by-step version (2026-11-19). Every step the student sees, as data: the question, the boxes and
   picks, the worked example in the page's words, a hint, the answer, the feedback written for each wrong answer, and which
   graded record of config.js the step completes. No DOM here, so tests/lesson_test.js loads it in Node.
   Terms come only from ../../w12/TAUGHT.md. */
(function (root) {
  'use strict';
  const C = root.DESK, h = () => root.DeskEngine.h;

  // ---------------- formatting ----------------
  const yen = (x) => (x < 0 ? '−¥' : '¥') + Math.abs(Math.round(x)).toLocaleString('en-US');
  const usd0 = (x) => (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('en-US');
  const usd2 = (x) => (x < 0 ? '−$' : '$') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const r1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
  const SHOW = { yen, usd: usd2, usd0, rate: r1 };

  // ---------------- reading what a student types ----------------
  // Accepts 45000, 45,000, ¥45,000, 45000 yen, $8.57, −105,000 (any minus sign), (105,000).
  function parse(s) {
    const t = String(s == null ? '' : s).replace(/[¥￥]/g, '').replace(/\s*(yen|jpy|dollars?|usd|yen per dollar|per dollar)\s*$/i, '').trim();
    if (!t) return NaN; return h().parseMoney(t);
  }
  // Tolerances match config.js's judge, so anything a box accepts also verifies on the receipt.
  const TOL = { yen: (v) => Math.max(1, 0.0002 * Math.abs(v)), usd: () => 0.006, usd0: () => 0.6, rate: () => 0.6 };
  const PH = { yen: '¥', usd: '$', usd0: '$', rate: 'yen per $' };

  /* A box: { type:'box', id, label, calc (printed under the box), kind, answer, wrong: [[value, message], ...] }.
     judgeBox returns { ok, msg }. A message names the specific slip; a near miss gets a near-miss message. */
  function judgeBox(b, raw) {
    const v = parse(raw);
    if (raw == null || String(raw).trim() === '') return { ok: false, empty: true, msg: 'Type a number in this box.' };
    if (!isFinite(v)) return { ok: false, msg: b.kind === 'usd' || b.kind === 'usd0' ? 'Type a dollar amount, like 8.25.' : b.kind === 'rate' ? 'Type a number of yen per dollar, like 120.5.' : 'Type a number of yen, like 45,000.' };
    const tol = TOL[b.kind](b.answer);
    if (Math.abs(v - b.answer) <= tol) return { ok: true };
    for (const [w, msg] of b.wrong || []) if (isFinite(w) && Math.abs(v - w) <= Math.max(tol, Math.abs(w) * 0.0005)) return { ok: false, msg };
    if (b.answer < 0 && Math.abs(v + b.answer) <= tol) return { ok: false, msg: b.signMsg || 'Right size, wrong sign. A loss takes a minus sign, like −50,000.' };
    if (b.kind === 'usd' && Math.abs(v - b.answer) < 0.5) return { ok: false, msg: 'Keep the cents: round to two decimal places, like $8.57, not to the whole dollar.' };
    if (Math.abs(v - b.answer) <= 0.01 * Math.abs(b.answer)) return { ok: false, msg: 'Close. Check the arithmetic and round only at the end.' };
    return { ok: false, msg: b.otherMsg || `Not yet. Work it as the line under the box says: ${b.calc}.` };
  }
  // A pick: { type:'pick', id, ask, options: [[value, label, messageIfWrong]], answer }.
  function judgePick(p, v) { const o = p.options.find((x) => x[0] === v); return { ok: v === p.answer, msg: o && v !== p.answer ? o[2] : '' }; }

  // ---------------- the steps ----------------
  // rec: the record in config.js the step completes (a record is done when all of its steps are). pic: the picture's name.
  function build(tasks) {
    const T = (id) => tasks.find((t) => t.id === id);
    const cv = T('convert'), ap = T('apple'), bm = T('bigmac'), ca = T('carry'), be = T('breakeven');
    const S = [];

    // 1. Change money (seeded numbers, config.js convert)
    S.push({ id: 'money', rec: 'convert', name: 'Change money', pic: 'counter',
      ask: `Your friend Travis is flying to Tokyo. He changes <b>${usd0(cv.D)}</b> at your desk, where a dollar buys <b>${cv.R} yen</b>. How many yen does he get? And what is a <b>${yen(cv.Y)}</b> dinner in Tokyo in dollars?`,
      items: [
        { type: 'box', id: 'yen', label: 'Yen Travis gets', calc: `${usd0(cv.D)} × ${cv.R}`, kind: 'yen', answer: cv.D * cv.R,
          wrong: [[cv.D / cv.R, `That divides. Dollars into yen: multiply, ${usd0(cv.D)} × ${cv.R}. Each dollar becomes ${cv.R} yen.`], [cv.D, `That is still ${usd0(cv.D)}. Each dollar buys ${cv.R} yen, so multiply.`], [cv.R, `That is what one dollar buys. Travis has ${usd0(cv.D)}: multiply by ${cv.R}.`]] },
        { type: 'box', id: 'usd', label: `The ${yen(cv.Y)} dinner, in dollars`, calc: `${yen(cv.Y)} ÷ ${cv.R}`, kind: 'usd', answer: cv.Y / cv.R,
          wrong: [[cv.Y * cv.R, `That multiplies. Yen into dollars: divide, ${yen(cv.Y)} ÷ ${cv.R}. It takes ${cv.R} yen to make a dollar.`], [cv.Y, `That is the price in yen. Divide by ${cv.R} to get dollars.`], [cv.R / cv.Y, `Flip it: the yen price goes first, ${yen(cv.Y)} ÷ ${cv.R}.`]] }],
      worked: { title: 'The page’s example, at 150 yen per dollar', lines: [['$300 into yen', '$300 × 150', '¥45,000'], ['A ¥1,200 lunch in dollars', '¥1,200 ÷ 150', '$8.00']], note: 'To change dollars into yen, multiply. To change yen into dollars, divide.' },
      hint: 'Dollars into yen: multiply by the rate. Yen into dollars: divide by the rate.',
      answer: `${usd0(cv.D)} × ${cv.R} = ${yen(cv.D * cv.R)}. ${yen(cv.Y)} ÷ ${cv.R} = ${usd2(cv.Y / cv.R)}.`,
      praise: `Right. ${usd0(cv.D)} becomes ${yen(cv.D * cv.R)}, and the dinner costs ${usd2(cv.Y / cv.R)}. Multiply to go into yen, divide to come back.`,
      say: ['travis', 'happy', `${yen(cv.D * cv.R)}. That is a lot of yen.`] });

    // 2. Which got stronger? (the page's real rates, shown both ways; completes config.js convert with step 1)
    S.push({ id: 'stronger', rec: 'convert', name: 'Which got stronger?', pic: 'board2',
      ask: 'Each change below is shown two ways: how many yen one dollar bought, and how many dollars ¥10,000 bought. Which currency got stronger?',
      items: [
        { type: 'pick', id: 'a', ask: 'January 3, 2022 to July 10, 2024', both: [['A dollar bought', '115.27 yen', '161.73 yen'], ['¥10,000 bought', '$86.75', '$61.83']], answer: 'usd',
          options: [['usd', 'The dollar', ''], ['jpy', 'The yen', 'Look at both lines. A dollar bought more yen (115.27, then 161.73), and ¥10,000 bought fewer dollars ($86.75, then $61.83). The dollar got stronger; the yen got weaker.']] },
        { type: 'pick', id: 'b', ask: 'July 10 to August 5, 2024', both: [['A dollar bought', '161.73 yen', '143.95 yen'], ['¥10,000 bought', '$61.83', '$69.47']], answer: 'jpy',
          options: [['usd', 'The dollar', 'The number of yen fell: a dollar bought fewer yen (161.73, then 143.95), and ¥10,000 bought more dollars ($61.83, then $69.47). The yen got stronger.'], ['jpy', 'The yen', '']] }],
      worked: { title: 'The page’s rule', text: 'When a dollar buys more yen, the dollar is stronger and the yen weaker. When a dollar buys fewer yen, the dollar is weaker and the yen stronger.' },
      hint: 'Ask what one unit buys. If ¥10,000 buys more dollars than before, the yen got stronger.',
      answer: 'First the dollar (it bought more yen). Then the yen (¥10,000 bought more dollars).',
      praise: 'Right. A bigger number of yen per dollar means a stronger dollar. In the four weeks to August 5, 2024, the yen rose 12%: ¥10,000 went from $61.83 to $69.47.' });

    // 3. The apple (config.js apple)
    S.push({ id: 'apple', rec: 'apple', name: 'The apple', pic: 'apple',
      ask: `Travis texts from Tokyo: an apple costs <b>${yen(ap.yen)}</b>. At home it costs <b>${usd2(ap.usd)}</b>, and a dollar buys <b>${ap.R} yen</b>. Where is the apple cheaper, and by how much?`,
      items: [
        { type: 'box', id: 'tokyo', label: 'Tokyo apple, in dollars', calc: `${yen(ap.yen)} ÷ ${ap.R}`, kind: 'usd', answer: ap.tokyo,
          wrong: [[ap.yen, `That is the price in yen. Divide by ${ap.R} so you compare dollars with dollars.`], [ap.yen * ap.R, `Yen into dollars: divide, ${yen(ap.yen)} ÷ ${ap.R}.`], [ap.R / ap.yen, `Flip it: ${yen(ap.yen)} ÷ ${ap.R}.`]] },
        { type: 'pick', id: 'city', ask: 'Where is the apple cheaper?', answer: 'chicago',
          options: [['chicago', 'Chicago', ''], ['tokyo', 'Tokyo', `Compare dollars with dollars: the Tokyo apple costs $1.33 and the Chicago apple $1.00. A bigger number of yen does not make a lower price.`]] },
        { type: 'box', id: 'gap', label: 'How much cheaper, in dollars', calc: 'higher dollar price − lower dollar price', kind: 'usd', answer: ap.gap,
          wrong: [[ap.tokyo, 'That is the Tokyo price. Subtract the Chicago price, $1.00.'], [ap.yen - ap.usd, 'That subtracts dollars from yen. Use the two dollar prices.'], [ap.tokyo + ap.usd, 'Subtract the lower price from the higher one.'], [ap.usd, 'That is the Chicago price. Subtract it from the Tokyo price in dollars.']] }],
      worked: { title: 'The page’s lunch, priced both places', lines: [['A ¥1,200 lunch in dollars', '¥1,200 ÷ 150', '$8.00'], ['The same lunch in Chicago', 'given', '$12.00'], ['Tokyo is cheaper by', '$12.00 − $8.00', '$4.00']], },
      hint: 'Change ¥200 into dollars first (divide by 150), then compare it with $1.00.',
      answer: '¥200 ÷ 150 = $1.33. Chicago is cheaper. $1.33 − $1.00 = $0.33.',
      praise: 'Right. The Tokyo apple costs $1.33, so Chicago is cheaper by $0.33. A price of 200 yen sounds high only because a yen is a small unit.',
      say: ['travis', 'worried', 'Huh. $1.33. So 150 yen to the dollar doesn’t make anything cheap.'] });

    // 4. The Big Mac (config.js bigmac; the page's table, July 1, 2026)
    S.push({ id: 'bigmac', rec: 'bigmac', name: 'The Big Mac', pic: 'burger',
      ask: `The Big Mac test prices one burger in both countries. On ${C.BIGMAC.date}, a Big Mac cost <b>${yen(bm.jp)}</b> in Japan and <b>${usd2(bm.us)}</b> in the U.S., and a dollar bought <b>${bm.R} yen</b>. Was the yen cheap?`,
      items: [
        { type: 'box', id: 'jpusd', label: 'Japan’s Big Mac, in dollars', calc: `${yen(bm.jp)} ÷ ${bm.R}`, kind: 'usd', answer: bm.jpUsd,
          wrong: [[bm.jp, `That is the price in yen. Divide by ${bm.R}.`], [bm.jp * bm.R, `Divide, don’t multiply: ${yen(bm.jp)} ÷ ${bm.R}.`], [bm.us, `That is the U.S. price. Change ${yen(bm.jp)} into dollars: ${yen(bm.jp)} ÷ ${bm.R}.`]] },
        { type: 'box', id: 'equal', label: 'Rate at which both burgers cost the same (yen per dollar)', calc: `${yen(bm.jp)} ÷ ${usd2(bm.us)}`, kind: 'rate', answer: bm.implied,
          wrong: [[bm.R, `That is the market rate. This box asks for the rate at which ${usd2(bm.us)} buys exactly one ${yen(bm.jp)} Big Mac: ${yen(bm.jp)} ÷ ${usd2(bm.us)}.`], [bm.us / bm.jp, `Flip it: yen first, ${yen(bm.jp)} ÷ ${usd2(bm.us)}.`], [bm.jp * bm.us, `Divide, don’t multiply: ${yen(bm.jp)} ÷ ${usd2(bm.us)}.`]] },
        { type: 'pick', id: 'verdict', ask: 'Compare that rate with the market’s 162.1. By the Big Mac test, the yen was', answer: 'under',
          options: [['under', 'Cheap (undervalued)', ''], ['over', 'Expensive (overvalued)', `Japan’s Big Mac cost $3.08, about half the $6.22 one. The market gave 162 yen per dollar, about twice the 80 that would make the burgers cost the same. That makes the yen cheap by this test: undervalued.`]] }],
      worked: { title: 'The page’s euro row, same day', lines: [['Euro-area Big Mac in dollars', '€6.19 ÷ 0.874 (a dollar bought 0.874 euros)', '$7.08'], ['The U.S. Big Mac', 'given', '$6.22']], note: 'Same move as the yen: local price ÷ local money per dollar. $7.08 is more than $6.22, so by this test the euro was expensive, or in the page’s word, overvalued.' },
      hint: 'The first box is the apple again: yen ÷ yen per dollar. For the second, ask how many yen per dollar would let $6.22 buy exactly one ¥500 burger.',
      answer: `¥500 ÷ ${bm.R} = $3.08. ¥500 ÷ $6.22 = 80.4 yen per dollar. The market gave 162, about twice as many: undervalued.`,
      praise: `Right. At about 80 yen per dollar the burgers would cost the same, but the market gave ${bm.R}. What made the yen cheap was 162 against 80; the 162 alone told you nothing.`,
      say: ['travis', 'happy', 'So by the burger the yen really is cheap. Just not because of the 150.'] });

    // 5. Who moves the yen? (config.js q1, answer 0: dollars paid more, investors bought dollars, the yen fell)
    S.push({ id: 'float', rec: 'q1', name: 'Who moves the yen?', pic: 'float',
      ask: 'The yen floats: no government fixes its price; buyers and sellers set it. When more people want to buy yen than to sell it, the yen gets stronger. For each, does the yen get stronger or weaker?',
      items: [
        { type: 'pick', id: 'car', ask: 'A Japanese carmaker changes the dollars from its U.S. sales into yen, to pay its workers in Japan.', answer: 'up', move: -3,
          options: [['up', 'Stronger', ''], ['down', 'Weaker', 'The carmaker sells dollars and buys yen. More buying of yen makes the yen stronger, so a dollar buys fewer yen.']] },
        { type: 'pick', id: 'rates', ask: '2022: dollars in a U.S. account earn more than 4% a year, and yen in Japan earn almost nothing. Investors sell yen to buy dollars.', answer: 'down', move: 8,
          options: [['up', 'Stronger', 'The investors are selling yen. More selling than buying makes the yen weaker. From January to October 2022 a dollar went from about 115 yen to about 150.'], ['down', 'Weaker', '']] },
        { type: 'pick', id: 'mof', ask: 'Japan’s government sells dollars and buys yen to stop the yen getting weaker, as it did in 2022 and 2024.', answer: 'up', move: -4,
          options: [['up', 'Stronger', ''], ['down', 'Weaker', 'The government is buying yen. More buying makes the yen stronger. Japan did this to stop the yen getting weaker so fast.']] }],
      worked: { title: 'The page’s example', text: 'A Japanese carmaker that sells cars in America and pays its workers in Japan has to sell dollars and buy yen. When more people want to buy yen than to sell yen, those who hold yen can ask more dollars for each one, so the yen gets stronger.' },
      hint: 'Ask one thing: is someone buying yen or selling yen? Buying makes it stronger; selling makes it weaker.',
      answer: 'Carmaker: stronger (it buys yen). 2022 investors: weaker (they sell yen). Japan’s government: stronger (it buys yen).',
      praise: 'Right. Nobody fixes the yen’s price. In 2022 dollars paid far more interest, so investors bought dollars and the yen got weaker: a dollar bought about 115 yen in January and about 150 in October.' });

    // 6. What a peg is (config.js q2, answer 0: buyers and sellers set the yen; China's central rate and 2% band)
    S.push({ id: 'peg', rec: 'q2', name: 'What a peg is', pic: 'peg',
      ask: 'A peg holds a currency at a set price by promising to buy and sell it there. Your bank in Hong Kong can always buy U.S. dollars from its central bank, the Monetary Authority, for 7.85 Hong Kong dollars each, and always sell them to it for 7.75.',
      items: [
        { type: 'pick', id: 'buy', ask: 'You want to buy U.S. dollars. Another bank asks 7.90 Hong Kong dollars each. What do you pay?', answer: 'hk', mark: 7.85,
          options: [['mkt', '7.90', 'You never have to pay 7.90. The Monetary Authority sells U.S. dollars to any bank for 7.85, so no bank pays more.'], ['hk', '7.85', '']] },
        { type: 'pick', id: 'sell', ask: 'You want to sell U.S. dollars. Another bank offers 7.70 each. What do you get?', answer: 'hk', mark: 7.75,
          options: [['mkt', '7.70', 'You never have to take 7.70. The Monetary Authority buys U.S. dollars from any bank for 7.75, so no bank accepts less.'], ['hk', '7.75', '']] },
        { type: 'pick', id: 'cny', ask: 'China lets its money, the yuan, trade only within 2% of a central rate it sets each morning. Today’s is 7.00 yuan to the dollar. Can the yuan trade at 7.20 today?', answer: 'no',
          options: [['yes', 'Yes', 'Not today. The yuan may trade only within 2% of the central rate: 7.00 × 0.98 = 6.86 to 7.00 × 1.02 = 7.14.'], ['no', 'No', '']] }],
      worked: { title: 'The page’s two promises', text: 'Any bank can always buy U.S. dollars from it for 7.85 Hong Kong dollars each, so no bank will pay anyone more. Any bank can always sell U.S. dollars to it for 7.75, so no bank will accept less. Those two promises keep the market price between 7.75 and 7.85.' },
      hint: 'A peg is a promise to buy and sell at set prices. Nobody pays more than the price the Monetary Authority sells at, or takes less than the price it buys at.',
      answer: 'Pay 7.85. Take 7.75. The yuan cannot reach 7.20 today: 2% either side of 7.00 is 6.86 to 7.14.',
      praise: 'Right. A peg holds because the central bank promises to buy and sell at set prices. The yen has no such promise: buyers and sellers set it every second.' });

    // 7. A stronger dollar (config.js q3, answer 0: the student and Toyota)
    S.push({ id: 'winners', rec: 'q3', name: 'A stronger dollar', pic: 'winners',
      ask: 'The dollar rises 10% against the yen: a dollar that bought 150 yen now buys 165. Who gains and who loses?',
      items: [
        { type: 'pick', id: 'tractor', ask: 'A Michigan company that sells $50,000 tractors to farmers in Japan', answer: 'lose', after: 'A $50,000 tractor cost a Japanese farmer ¥7,500,000 at 150. At 165 it costs ¥8,250,000.',
          options: [['gain', 'Gains', 'Its tractor now costs Japanese farmers more yen: ¥7,500,000 at 150, ¥8,250,000 at 165. Fewer farmers can buy it.'], ['lose', 'Loses', '']] },
        { type: 'pick', id: 'student', ask: 'An American student spending a semester in Tokyo', answer: 'gain', after: 'Each $1,000 she changes brings ¥165,000 instead of ¥150,000.',
          options: [['gain', 'Gains', ''], ['lose', 'Loses', 'She spends dollars in Japan. Each $1,000 she changes now brings ¥165,000 instead of ¥150,000.']] },
        { type: 'pick', id: 'toyota', ask: 'Toyota, which sells cars in America and pays its workers in Japan', answer: 'gain', after: 'Each $30,000 it earns in America changes into ¥4,950,000 instead of ¥4,500,000.',
          options: [['gain', 'Gains', ''], ['lose', 'Loses', 'Toyota earns dollars and spends yen. Each $30,000 it earns in America now changes into ¥4,950,000 instead of ¥4,500,000.']] }],
      worked: { title: 'The page’s example', text: 'A stronger dollar hurts Americans who sell abroad: a $50,000 Michigan tractor cost a Japanese farmer ¥5,750,000 at 115 yen to the dollar and ¥8,100,000 at 162. It helps an American student in Tokyo, and Toyota, which sells cars in America, because each dollar brings them more yen.' },
      hint: 'Ask who holds dollars and needs yen (they gain), and who needs buyers paying in yen (they lose).',
      answer: 'The tractor maker loses. The student and Toyota gain.',
      praise: 'Right. A stronger dollar helps whoever changes dollars into yen, and hurts Americans who sell abroad.' });

    // 8. Ken's trade by hand (config.js carry rows: the held year's close-out at 142)
    S.push({ id: 'byhand', rec: 'carry', name: 'Ken’s trade by hand', pic: 'flow',
      ask: 'Your colleague Ken runs a carry trade: he borrows where interest is low and earns where it is high. He borrows <b>¥15,000,000</b> in Japan at 0.1%, changes it at 150 into <b>$100,000</b>, and earns <b>5%</b> on it in a U.S. account. Suppose a year later a dollar buys <b>142 yen</b>.',
      items: [
        { type: 'box', id: 'usd', label: 'His dollars after a year', calc: '$100,000 × 1.05', kind: 'usd0', answer: ca.usd,
          wrong: [[100000, 'That leaves out the year’s interest: $100,000 × 1.05.'], [5000, 'That is only the interest. Add it to the $100,000.'], [100000 * 0.95, 'Interest adds: $100,000 × 1.05.']] },
        { type: 'box', id: 'back', label: 'Yen his dollars change into at 142', calc: 'his dollars after a year × 142', kind: 'yen', answer: ca.back,
          wrong: [[ca.usd * 150, 'That uses 150, the rate when he started. A year later a dollar buys 142: $105,000 × 142.'], [100000 * 142, 'Use his dollars after a year, $105,000.'], [ca.usd / 142, 'Dollars into yen: multiply, $105,000 × 142.']] },
        { type: 'given', label: 'Yen he owes the bank', calc: '¥15,000,000 plus 0.1%', value: '¥15,015,000' },
        { type: 'box', id: 'gain', label: 'His gain or loss, in yen', calc: 'yen he gets − yen he owes', kind: 'yen', answer: ca.answer,
          signMsg: 'He gets back less than he owes, so this is a loss. Type it with a minus sign: −105,000.',
          wrong: [[ca.usd * 150 - ca.owe, 'That is the year at 150. At 142, subtract: ¥14,910,000 − ¥15,015,000.'], [ca.back - 15000000, 'He owes the interest too: subtract ¥15,015,000, not ¥15,000,000.'], [ca.back, 'That is the yen he gets. Subtract the ¥15,015,000 he owes.']] }],
      worked: { title: 'The page’s trade, a year later at 140', lines: [['Borrow at almost 0%', 'given', '¥150,000'], ['Change at 150', '¥150,000 ÷ 150', '$1,000'], ['A year at 5%', '$1,000 × 1.05', '$1,050'], ['Change back at 140', '$1,050 × 140', '¥147,000'], ['Gain or loss', '¥147,000 − ¥150,000', '−¥3,000']], note: 'The risk is the last step: if a dollar buys fewer yen by then, the dollars may not repay the loan.' },
      hint: 'Grow the dollars by 5%, change them back at 142, then subtract what he owes.',
      answer: '$100,000 × 1.05 = $105,000. $105,000 × 142 = ¥14,910,000. ¥14,910,000 − ¥15,015,000 = −¥105,000.',
      praise: 'Right. He earned $5,000 of interest and still lost ¥105,000, because the yen got stronger: at 142 his dollars change into fewer yen than he owes. At 150 the same year would have made ¥735,000.',
      say: ['ken', 'smug', '142? Never happens. I have collected the interest every month since 2022. Free money.'] });

    // 9. The yen trade (the game; completes config.js carry with step 8; the result goes in the record's value)
    S.push({ id: 'game', rec: 'carry', name: 'The yen trade', pic: 'game', game: true,
      ask: 'Now you run Ken’s trade for a year, a month at a time. Each month, hold to collect another month of interest, or cash out and keep your gain. Ken never cashes out.' });

    // 10. How far can the yen rise? (config.js breakeven: the rate box and "about 5%")
    S.push({ id: 'howfar', rec: 'breakeven', name: 'How far can the yen rise?', pic: 'howfar',
      ask: `A stronger yen means a dollar buys fewer yen, so the rate falls from 150. The trade ends the year with <b>${usd0(be.usd)}</b> and owes <b>${yen(be.owe)}</b>. At what rate is the gain gone?`,
      items: [
        { type: 'box', id: 'rate', label: 'Yen per dollar at which the gain is gone', calc: `${yen(be.owe)} ÷ ${usd0(be.usd)}`, kind: 'rate', answer: be.be,
          wrong: [[be.usd / be.owe, `Flip it: yen first, ${yen(be.owe)} ÷ ${usd0(be.usd)}.`], [150, 'That is about 150, where the trade began and still gains. Divide by the dollars at the end of the year: ¥15,015,000 ÷ $105,000.'], [142, 'That is the rate in Ken’s bad year, where he lost ¥105,000. Find the rate where the dollars repay the loan exactly: ¥15,015,000 ÷ $105,000.']] },
        { type: 'pick', id: 'pct', ask: 'A dollar bought 150 yen when the trade began. About how far could the yen rise before the year’s gain was gone?', answer: 'p5', engine: true,
          options: [['p01', 'About 0.1%', '0.1% is the interest on the yen loan. From 150 to 143 is a move of 7 yen, and 7 is about 5% of 150.'], ['p5', 'About 5%', ''], ['p20', 'About 20%', 'Too far: if the yen rose 20%, a dollar would buy only about 125 yen, deep in a loss. From 150 to 143 is 7 yen, about 5%.'], ['any', 'By any amount: the interest is already earned', 'The interest is earned in dollars, but the loan is in yen. A stronger yen turns the dollars into fewer yen, and below 143 they no longer repay the loan.']] }],
      worked: { title: 'The page’s trade', lines: [['Owed to the bank', 'given', '¥150,000'], ['Dollars after a year', 'given', '$1,050'], ['Rate at which they match', '¥150,000 ÷ $1,050', '142.86']], note: 'At 142.86 yen to the dollar, the ¥150,000 that was worth $1,000 is worth $1,050: the yen has risen 5%, the size of the interest gap.' },
      hint: 'Divide the yen owed by the dollars you have. Then compare that rate with 150: how many yen is it, out of 150?',
      answer: '¥15,015,000 ÷ $105,000 = 143.0 yen per dollar. From 150 to 143 is 7 yen, about 5%.',
      praise: 'Right. The yen can rise about 5%, the size of the interest gap, before the year’s gain is gone. The trade pays for as long as the yen rises by less than that, and loses fast when it jumps. From 2022 to mid-2024 the yen weakened instead, from about 115 to about 162 yen per dollar, so the trade paid for years. Then, from July 10 to August 5, 2024, the yen rose 12%.',
      say: ['ken', 'worried', 'About 5%. In August 2024 it rose more than twice that in a few weeks.'] });

    // 11. A coin that promises $1 (config.js q4, answer 0: the cash and bonds behind it; taught here, not on the page)
    S.push({ id: 'coin', rec: 'q4', name: 'A coin that promises $1', pic: 'coin',
      ask: 'A <b>stablecoin</b> is a digital coin that a company promises is always worth $1. Like Hong Kong’s promise, it is a peg: the company holds cash and short-term government bonds, its reserve, and pays $1 for each coin handed back.',
      items: [
        { type: 'pick', id: 'what', ask: 'What holds the coin at $1?', answer: 0, quiz: 3,
          options: [[0, 'Cash and bonds in its reserve', ''], [1, 'A Fed guarantee', 'The Fed does not stand behind stablecoins. The coin is worth $1 only while people trust the cash and bonds the company holds.'], [2, 'Its computer code', 'Code records who owns each coin. The price comes from buyers and sellers, who pay $1 only while they trust the reserve behind it.'], [3, 'Bitcoin’s price', 'Bitcoin’s price floats. A stablecoin’s $1 rests on the cash and bonds its company holds.']] },
        { type: 'pick', id: 'svb', ask: 'March 2023: Silicon Valley Bank failed with $3.3 billion of the reserve behind USDC, a stablecoin, stuck inside (about 8% of its reserve). Holders doubted the reserve. What happened to USDC?', answer: 'fell',
          options: [['held', 'Stayed at $1', 'A promise holds only while people believe the reserve is there. Holders sold coins for less than $1, and USDC fell to about 86 cents.'], ['fell', 'Fell below $1', '']] }],
      worked: { title: 'The page’s peg', text: 'Hong Kong’s Monetary Authority promises to sell U.S. dollars to any bank for 7.85 Hong Kong dollars each, so no bank will pay anyone more. A stablecoin company makes the same kind of promise about its coin, and backs it with its reserve.' },
      hint: 'A peg is only as strong as what stands behind the promise. Ask what the company would pay out with.',
      answer: 'The cash and bonds in its reserve. When holders doubted it, USDC fell below $1.',
      praise: 'Right. USDC fell to about 86 cents. It was back to $1 on March 13, after regulators said every depositor at the bank would be repaid. A stablecoin is a peg run by a company.' });

    // 12. Reply to Travis (config.js note)
    S.push({ id: 'reply', rec: 'note', name: 'Your reply to Travis', pic: 'reply', note: true,
      ask: 'Travis texts: “The yen is cheap. A dollar buys 150 of them!” Reply to him in at least 30 words, using something you worked out here.',
      hint: 'A good reply says what the 150 does and does not tell you, and compares one thing priced in dollars in both places. The apple and the Big Mac point different ways, and that is fine: either way, the 150 alone tells you nothing.' });
    return S;
  }

  // Which steps complete each record of config.js.
  const RECS = ['convert', 'apple', 'bigmac', 'q1', 'q2', 'q3', 'carry', 'breakeven', 'q4', 'note'];
  const stepsOf = (steps, rec) => steps.filter((s) => s.rec === rec).map((s) => s.id);

  /* The record a finished step writes, in config.js's shape, from what the student typed and picked (vals: id -> value).
     Rows are the student's own entries; the judge in config.js accepts anything a box here accepts (tests/lesson_test.js). */
  function recordFor(rec, vals, ride) {
    const v = (k) => (vals[k] == null ? null : String(vals[k]));
    if (rec === 'convert') return { rows: [v('money.yen'), v('money.usd')] };
    if (rec === 'apple') return { rows: [v('apple.tokyo'), v('apple.gap')], choice: 'chicago' };
    if (rec === 'bigmac') return { rows: [v('bigmac.equal'), v('bigmac.jpusd')], choice: 'under' };
    if (rec === 'carry') return { rows: [v('byhand.back'), null, v('byhand.gain')], value: ride || null };
    if (rec === 'breakeven') return { rows: [null, null, v('howfar.rate')], choice: 'p5' };
    if (rec === 'q1' || rec === 'q2' || rec === 'q3' || rec === 'q4') return { choice: String(C.quiz[{ q1: 0, q2: 1, q3: 2, q4: 3 }[rec]].answer) };
    return {};
  }

  // The text on the first screen and in the game (rule 59: say what this is, what you will do, and what earns credit).
  const START = {
    kicker: 'Financial Markets and Institutions, Unit 12',
    lede: 'Practice for the Unit 12 page “Why Is a Dollar Worth 150 Yen?” You work at a bank’s currency desk in Chicago. Your friend Travis is flying to Tokyo, and Ken, at the next desk, borrows yen cheaply to earn more interest in dollars.',
    plan: 'In 12 short steps you change money, judge whether the yen is cheap, see what moves a currency, then run Ken’s yen trade for a year and decide when to get out.',
    credit: 'Reach the end and download your receipt for full credit, 60 points. Wrong answers, hints and losing money in the trade never cost points.',
  };
  const GAME = {
    rule: 'If the yen gets stronger, a dollar buys fewer yen and your gain shrinks.',
    credit: 'Cashing out early, holding to the end and losing money all earn full credit.',
  };

  /* 2026-11-19: the receipt prints twelve steps, and the rubric grades twelve steps (all twelve 60, six or more 30), while the
     receipt's data carries config.js's ten records. A step counts once its record is done, so verify.html counts the same
     steps from any receipt, old or new; a pair (steps 1 and 2, steps 8 and 9) counts when both are finished. */
  const stepsFromRecords = (steps, recDone) => steps.filter((s) => recDone(s.rec)).length;
  const pointsForSteps = (n, total, pts) => (n >= total ? pts : n >= total / 2 ? pts / 2 : 0);

  root.LESSON = { build, RECS, stepsOf, recordFor, judgeBox, judgePick, parse, START, GAME, SHOW, PH, stepsFromRecords, pointsForSteps, fmt: { yen, usd0, usd2, r1 } };
})(typeof window !== 'undefined' ? window : globalThis);
