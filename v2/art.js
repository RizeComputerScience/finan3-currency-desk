/* The Currency Desk v2: the drawings. Flat SVG in a travel-poster style: Chicago flag blue and red for the departure hall,
   Hiroshige's Prussian-blue night for Tokyo. No faces. Every backdrop is decorative (aria-hidden); every object that carries
   meaning gets a label where it is used. */
(function (root) {
  'use strict';
  const P = { night: '#13234F', night2: '#1C3266', deep: '#0C1736', sky: '#B3DDF2', sky2: '#8EC3E0', mid: '#4F7FAE', red: '#C8102E', red2: '#E5252B', lantern: '#F7C548', paper: '#FBF6EA', ink: '#0F1A33', mint: '#2FBF7F', neon: '#FF5FA2', cyan: '#5CE1E6', peach: '#FFD9C2' };
  // Deterministic "random" so drawings do not change between renders.
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const star6 = (cx, cy, r, fill) => { const pts = []; for (let i = 0; i < 12; i++) { const a = Math.PI / 6 * i - Math.PI / 2, rr = i % 2 ? r * 0.5 : r; pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); } return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`; };
  const svg = (vb, body, cls, extra) => `<svg class="${cls || ''}" viewBox="${vb}" preserveAspectRatio="${extra || 'xMidYMax slice'}" aria-hidden="true" focusable="false">${body}</svg>`;
  const vtext = (x, y, s, size, fill) => [...s].map((ch, i) => `<text x="${x}" y="${y + i * size * 1.05}" font-family="Dela Gothic One, sans-serif" font-size="${size}" fill="${fill}" text-anchor="middle">${ch}</text>`).join('');

  // ---------------- backdrops (1600 × 900) ----------------
  function chicagoFlag(x, y, w) {
    const h = w * 0.62, s = h / 6;
    return `<g transform="translate(${x} ${y})"><line x1="${w / 2}" y1="${-y}" x2="${w / 2}" y2="0" stroke="${P.night}" stroke-width="3"/><rect width="${w}" height="${h}" fill="#fff" stroke="${P.night}" stroke-width="4"/><rect y="${s}" width="${w}" height="${s}" fill="#7FC3E8"/><rect y="${4 * s}" width="${w}" height="${s}" fill="#7FC3E8"/>${[0, 1, 2, 3].map((i) => star6(w * (0.2 + 0.2 * i), h / 2, s * 0.62, P.red2)).join('')}</g>`;
  }
  function skyline(r, baseY, color, n, minH, maxH, x0, x1) {
    let out = '', x = x0;
    while (x < x1) { const w = 40 + r() * 90, h = minH + r() * (maxH - minH); out += `<rect x="${x.toFixed(0)}" y="${(baseY - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${color}"/>`; x += w + 4 + r() * 18; }
    return out;
  }
  function hall() {
    const r = rng(7);
    const willis = `<g fill="#2C4F82"><rect x="640" y="250" width="40" height="420"/><rect x="680" y="200" width="40" height="470"/><rect x="720" y="300" width="40" height="370"/><rect x="760" y="330" width="40" height="340"/><line x1="690" y1="200" x2="690" y2="120" stroke="#2C4F82" stroke-width="5"/><line x1="712" y1="200" x2="712" y2="135" stroke="#2C4F82" stroke-width="5"/></g>`;
    const hancock = `<g fill="#21406F"><polygon points="1040,670 1060,290 1120,290 1140,670"/><line x1="1075" y1="290" x2="1075" y2="215" stroke="#21406F" stroke-width="5"/><line x1="1105" y1="290" x2="1105" y2="225" stroke="#21406F" stroke-width="5"/><path d="M1056 360 L1124 460 M1124 360 L1056 460 M1052 480 L1128 580 M1128 480 L1052 580" stroke="${P.sky2}" stroke-width="4" opacity=".55"/></g>`;
    const plane = `<g transform="translate(250 190) rotate(-12)"><path d="M0 18 C 40 6, 160 4, 200 12 C 212 14, 214 22, 200 24 C 160 30, 40 30, 0 24 Z" fill="#fff"/><path d="M150 14 L 196 -22 L 206 -22 L 182 14 Z" fill="${P.red2}"/><path d="M80 20 L 40 60 L 56 60 L 120 22 Z" fill="#E8F2F8"/><circle cx="196" cy="17" r="3" fill="${P.night}"/></g>`;
    const clouds = [[180, 120, 120], [900, 90, 160], [1350, 150, 110]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="26" rx="13" fill="#fff" opacity=".7"/><rect x="${x + 30}" y="${y - 16}" width="${w * 0.5}" height="26" rx="13" fill="#fff" opacity=".7"/>`).join('');
    const mullions = Array.from({ length: 9 }, (_, i) => `<rect x="${i * 200 - 6}" y="60" width="12" height="640" fill="${P.night}"/>`).join('');
    return svg('0 0 1600 900', `<rect width="1600" height="900" fill="${P.sky}"/>${clouds}${skyline(r, 670, '#9CCBE6', 0, 120, 260, 0, 1600)}${willis}${hancock}${skyline(r, 670, '#6E9CC6', 0, 60, 200, 0, 1600)}${plane}
      <rect y="670" width="1600" height="30" fill="#5B87B4"/>${mullions}<rect y="0" width="1600" height="64" fill="${P.night}"/><rect y="690" width="1600" height="16" fill="${P.night}"/>
      <rect y="706" width="1600" height="194" fill="#E4DDCB"/><path d="M0 760 H1600 M0 820 H1600" stroke="#D3CAB4" stroke-width="3"/>${chicagoFlag(1250, 120, 200)}`, 'backdrop');
  }
  function street(variant) {
    const r = rng(variant === 'burger' ? 11 : variant === 'market' ? 23 : 5);
    const defs = `<defs><radialGradient id="glw"><stop offset="0" stop-color="${P.lantern}" stop-opacity=".55"/><stop offset="1" stop-color="${P.lantern}" stop-opacity="0"/></radialGradient><radialGradient id="glr"><stop offset="0" stop-color="#FF7A5C" stop-opacity=".6"/><stop offset="1" stop-color="#FF7A5C" stop-opacity="0"/></radialGradient><linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16244F"/><stop offset="1" stop-color="#0A1330"/></linearGradient></defs>`;
    let back = '';
    const bldg = (x, w, h, col) => { let o = `<rect x="${x}" y="${560 - h}" width="${w}" height="${h}" fill="${col}"/>`; for (let yy = 560 - h + 22; yy < 540; yy += 30) for (let xx = x + 12; xx < x + w - 18; xx += 26) if (r() < 0.42) o += `<rect x="${xx}" y="${yy}" width="12" height="16" fill="${r() < 0.8 ? P.lantern : '#9FD8FF'}" opacity="${(0.5 + r() * 0.45).toFixed(2)}"/>`; return o; };
    for (let x = -20; x < 1620;) { const w = 110 + r() * 150; back += bldg(+x.toFixed(0), +w.toFixed(0), 180 + r() * 300, r() < 0.5 ? '#0E1A3D' : '#172B5C'); x += w + 6; }
    // street-level shops: lit fronts, eaves, short indigo curtains
    let shops = '';
    const shopCols = ['#F7C548', '#FFB37A', '#9FD8FF', '#F7C548', '#FFD27A'];
    for (let k = 0, x = 0; x < 1600; k++) { const w = 190 + r() * 90; shops += `<rect x="${x}" y="560" width="${w}" height="170" fill="#0B1634"/><rect x="${x + 14}" y="600" width="${w - 28}" height="110" fill="${shopCols[k % 5]}" opacity=".5"/><rect x="${x + 8}" y="584" width="${w - 16}" height="16" fill="#1C2C5C"/>`;
      const n = 3 + Math.floor(r() * 3); for (let c = 0; c < n; c++) shops += `<rect x="${(x + 14 + c * (w - 28) / n + 2).toFixed(0)}" y="600" width="${((w - 28) / n - 4).toFixed(0)}" height="40" fill="${k % 2 ? P.night : '#7A1A2A'}"/><circle cx="${(x + 14 + (c + .5) * (w - 28) / n).toFixed(0)}" cy="618" r="6" fill="${P.paper}" opacity=".8"/>`;
      if (r() < 0.6) shops += `<g fill="#0A1430"><circle cx="${x + 40 + r() * (w - 80)}" cy="652" r="9"/><rect x="${x + 30 + r() * (w - 80)}" y="664" width="22" height="46" rx="8"/></g>`;
      x += w + 8; }
    // a string of paper lanterns
    const lan = (x, y, red) => `<circle cx="${x}" cy="${y}" r="38" fill="url(#${red ? 'glr' : 'glw'})"/><line x1="${x}" y1="${y - 26}" x2="${x}" y2="${y - 18}" stroke="#0A1230" stroke-width="2"/><rect x="${x - 9}" y="${y - 20}" width="18" height="5" fill="#0A1230"/><ellipse cx="${x}" cy="${y}" rx="15" ry="18" fill="${red ? P.red2 : P.lantern}"/><path d="M${x - 15} ${y - 5} H${x + 15} M${x - 15} ${y + 5} H${x + 15}" stroke="#0A1230" stroke-width="1" opacity=".35"/><rect x="${x - 9}" y="${y + 16}" width="18" height="5" fill="#0A1230"/>`;
    let lanterns = `<path d="M-20 470 Q 400 540 820 478 T 1640 490" stroke="#0A1230" stroke-width="3" fill="none"/>`;
    for (let k = 0; k < 14; k++) { const x = 40 + k * 118, t = x / 1640, y = 470 + 60 * Math.sin(Math.PI * ((x % 820) / 820)) * 0.9 + 26; lanterns += lan(x, Math.round(y), k % 3 !== 1); }
    // vending machines, glowing
    const vend = (x) => `<rect x="${x}" y="606" width="70" height="124" rx="4" fill="#E9F3FF"/><rect x="${x + 6}" y="614" width="58" height="62" fill="#BFE3FF"/>${[0, 1, 2].map((row) => [0, 1, 2, 3, 4].map((c) => `<rect x="${x + 9 + c * 11}" y="${618 + row * 20}" width="7" height="15" rx="2" fill="${['#E5252B', '#2FBF7F', '#F7C548', '#13234F', '#FF5FA2'][(c + row) % 5]}"/>`).join('')).join('')}<rect x="${x + 6}" y="684" width="58" height="10" fill="#13234F"/><circle cx="${x + 35}" cy="${668}" r="80" fill="url(#glw)" opacity=".5"/>`;
    const signs = variant === 'market' ? '' : `<g><rect x="150" y="300" width="64" height="250" rx="6" fill="#1a1030" stroke="${P.neon}" stroke-width="5"/>${vtext(182, 350, 'ラーメン', 46, P.neon)}</g><g><rect x="1520" y="330" width="64" height="210" rx="6" fill="#0b2030" stroke="${P.cyan}" stroke-width="5"/>${vtext(1552, 380, '営業中', 46, P.cyan)}</g>`;
    const wires = `<path d="M-10 120 Q 400 200 820 130 T 1620 150" stroke="#0A1230" stroke-width="4" fill="none"/><path d="M-10 160 Q 500 240 900 170 T 1620 200" stroke="#0A1230" stroke-width="3" fill="none"/><rect x="880" y="100" width="12" height="460" fill="#0A1230"/><rect x="850" y="120" width="72" height="8" fill="#0A1230"/>`;
    // the road, a crossing, a few walkers in silhouette, a bicycle
    let road = `<rect y="730" width="1600" height="170" fill="url(#road)"/>`;
    for (let k = 0; k < 9; k++) road += `<polygon points="${520 + k * 66},760 ${560 + k * 66},760 ${548 + k * 78},900 ${500 + k * 78},900" fill="${P.paper}" opacity=".16"/>`;
    const walker = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="0" cy="-58" r="10"/><rect x="-11" y="-46" width="22" height="40" rx="9"/><rect x="-9" y="-10" width="7" height="34" rx="3"/><rect x="2" y="-10" width="7" height="34" rx="3"/></g>`;
    const walkers = [[300, 860, 1.1], [380, 850, 1], [1090, 870, 1.15], [1200, 845, .95], [700, 840, .9]].map(([x, y, sc], i) => walker(x, y, sc, i % 2 ? '#060C22' : '#0A1430')).join('');
    const bike = `<g transform="translate(1340 868)" stroke="#060C22" stroke-width="5" fill="none"><circle cx="-26" cy="0" r="18"/><circle cx="26" cy="0" r="18"/><path d="M-26 0 L -6 -26 L 18 -26 L 26 0 M-6 -26 L 0 0 L 18 -26"/></g>`;
    const cat = `<g transform="translate(980 726)" fill="#060C22"><ellipse cx="0" cy="0" rx="18" ry="9"/><circle cx="16" cy="-8" r="7"/><path d="M12 -14 l3 -7 l3 7 Z M18 -14 l3 -7 l3 7 Z"/><path d="M-18 0 q -12 -4 -10 -18" stroke="#060C22" stroke-width="4" fill="none"/></g>`;
    return svg('0 0 1600 900', `${defs}<rect width="1600" height="900" fill="${P.night}"/><circle cx="1460" cy="120" r="58" fill="${P.paper}"/><g opacity=".5">${skyline(r, 560, P.night2, 0, 200, 420, 0, 1600)}</g>${back}${signs}${wires}${shops}${vend(60)}${vend(1440)}${lanterns}${road}${cat}${walkers}${bike}`, 'backdrop');
  }
  function floor() {
    const r = rng(31); let city = '';
    // three rows of towers, nearer rows darker and taller, with lit windows
    [[560, '#16285A', 60, 160, 0.30], [640, '#101E46', 110, 240, 0.26], [760, '#0A1534', 170, 360, 0.22]].forEach(([base, col, lo, hi, lit]) => {
      for (let x = -30; x < 1630;) { const w = 50 + r() * 110, hh = lo + r() * (hi - lo); city += `<rect x="${x.toFixed(0)}" y="${(base - hh).toFixed(0)}" width="${w.toFixed(0)}" height="${(900 - base + hh).toFixed(0)}" fill="${col}"/>`;
        for (let yy = base - hh + 12; yy < 900; yy += 22) for (let xx = x + 8; xx < x + w - 10; xx += 16) if (r() < lit) city += `<rect x="${xx.toFixed(0)}" y="${yy.toFixed(0)}" width="7" height="9" fill="${r() < 0.85 ? P.lantern : P.paper}" opacity="${(0.4 + r() * 0.5).toFixed(2)}"/>`;
        x += w + 3 + r() * 10; }
    });
    // Tokyo Tower: a red-and-white lattice tower, lit
    const T = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-70 400 L -8 0 L 8 0 L 70 400 Z" fill="${P.red2}"/><path d="M-50 270 L 50 270 L 54 296 L -54 296 Z M-24 120 L 24 120 L 27 140 L -27 140 Z" fill="${P.paper}"/><path d="M-60 330 L 0 20 L 60 330 M-40 330 L 0 150 L 40 330" stroke="#8A0F1A" stroke-width="3" fill="none" opacity=".6"/><rect x="-2" y="-90" width="4" height="92" fill="${P.paper}"/><path d="M-70 400 Q 0 340 70 400 Z" fill="${P.deep}"/><circle cx="0" cy="-90" r="4" fill="${P.red2}"/></g>`;
    const mullions = Array.from({ length: 5 }, (_, i) => `<rect x="${i * 400 - 7}" y="0" width="14" height="900" fill="#060D22"/>`).join('');
    return svg('0 0 1600 900', `<rect width="1600" height="900" fill="${P.deep}"/><rect y="380" width="1600" height="200" fill="#13245A" opacity=".55"/><circle cx="1380" cy="140" r="50" fill="${P.paper}" opacity=".92"/>${T(1130, 260)}${city}${mullions}<rect y="0" width="1600" height="26" fill="#060D22"/>`, 'backdrop');
  }
  function dawn() {
    const wing = `<path d="M-60 900 L 40 760 L 1380 690 L 1430 640 L 1452 642 L 1420 712 L 260 900 Z" fill="${P.night}"/><path d="M40 760 L 1380 690" stroke="#2B4A8A" stroke-width="5"/><rect x="430" y="770" width="190" height="62" rx="31" fill="#1C3266"/><rect x="600" y="780" width="26" height="42" rx="6" fill="#0A1230"/>`;
    const clouds = [[120, 520, 260], [700, 470, 340], [1240, 540, 280], [380, 600, 300]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="34" rx="17" fill="#fff" opacity=".8"/><rect x="${x + 40}" y="${y - 20}" width="${w * 0.45}" height="34" rx="17" fill="#fff" opacity=".8"/>`).join('');
    return svg('0 0 1600 900', `<rect width="1600" height="900" fill="#FFE6D5"/><rect y="380" width="1600" height="520" fill="${P.peach}"/><circle cx="1180" cy="420" r="110" fill="${P.red2}"/><rect y="430" width="1600" height="470" fill="#FFCBB0" opacity=".85"/>${clouds}${wing}`, 'backdrop');
  }
  const BACKDROPS = { hall, counter: hall, street, floor, dawn };

  // ---------------- money and objects ----------------
  // Stylized notes, deliberately unlike real banknotes: flat colour, a value, a currency mark, a sun or a star.
  function yenNote(v, w) { w = w || 120; const h = w * 0.5, big = v >= 10000; const fill = big ? '#D6B27A' : '#9DBFE3', edge = big ? '#9C7A42' : '#5E86B4';
    return `<svg viewBox="0 0 ${w} ${h}" class="note" aria-hidden="true"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="4" fill="${fill}" stroke="${edge}" stroke-width="2"/><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="3" fill="none" stroke="${edge}" stroke-width="1" opacity=".6"/><circle cx="${w * 0.72}" cy="${h / 2}" r="${h * 0.26}" fill="${P.red2}" opacity=".85"/><text x="10" y="${h * 0.42}" font-family="Big Shoulders Display" font-weight="800" font-size="${h * 0.32}" fill="${P.ink}">${v.toLocaleString('en-US')}</text><text x="10" y="${h * 0.82}" font-family="Dela Gothic One" font-size="${h * 0.3}" fill="${P.ink}">円</text></svg>`; }
  function usdNote(v, w) { w = w || 120; const h = w * 0.45;
    return `<svg viewBox="0 0 ${w} ${h}" class="note" aria-hidden="true"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="4" fill="#A9D2B0" stroke="#4E8A5C" stroke-width="2"/><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="3" fill="none" stroke="#4E8A5C" stroke-width="1" opacity=".6"/>${star6(w * 0.72, h / 2, h * 0.28, '#4E8A5C')}<text x="10" y="${h * 0.66}" font-family="Big Shoulders Display" font-weight="800" font-size="${h * 0.48}" fill="${P.ink}">$${v}</text></svg>`; }
  const apple = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><path d="M0 -6 C -26 -26, -46 0, -36 22 C -28 42, -10 46, 0 38 C 10 46, 28 42, 36 22 C 46 0, 26 -26, 0 -6 Z" fill="${P.red2}"/><path d="M-20 4 C -24 12, -22 20, -18 26" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35" fill="none"/><path d="M0 -6 C 0 -16, 2 -22, 6 -28" stroke="#5B3A1E" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M6 -24 C 18 -34, 30 -30, 32 -22 C 22 -16, 12 -18, 6 -24 Z" fill="${P.mint}"/></g>`;
  const burger = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><path d="M-46 -4 C -46 -40, 46 -40, 46 -4 Z" fill="#E7A33E"/><g fill="${P.paper}"><ellipse cx="-18" cy="-24" rx="3" ry="2"/><ellipse cx="4" cy="-30" rx="3" ry="2"/><ellipse cx="22" cy="-20" rx="3" ry="2"/><ellipse cx="-4" cy="-16" rx="3" ry="2"/></g><path d="M-50 -2 Q -38 6 -26 -2 Q -14 6 -2 -2 Q 10 6 22 -2 Q 34 6 50 -2 L 50 4 L -50 4 Z" fill="${P.mint}"/><rect x="-48" y="3" width="96" height="9" rx="3" fill="${P.lantern}"/><rect x="-48" y="11" width="96" height="14" rx="6" fill="#6B3A22"/><path d="M-46 25 H46 C 46 40, -46 40, -46 25 Z" fill="#E7A33E"/></g>`;
  const shirt = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><path d="M-18 -34 L -46 -22 L -58 4 L -38 12 L -32 0 L -32 40 L 32 40 L 32 0 L 38 12 L 58 4 L 46 -22 L 18 -34 C 12 -24, -12 -24, -18 -34 Z" fill="${P.cyan}"/>${star6(0, 8, 12, P.night)}</g>`;
  // A balance scale. Items sit in the pans; setScale() tilts the beam (positive degrees: right pan goes down).
  function scale(leftItem, rightItem, id) {
    return `<svg viewBox="0 0 600 340" class="scale" id="${id}" aria-hidden="true">
      <path d="M250 330 L 350 330 L 330 300 L 270 300 Z" fill="${P.paper}" opacity=".95"/><rect x="292" y="96" width="16" height="206" fill="${P.paper}" opacity=".95"/>
      <g class="beam"><rect x="80" y="86" width="440" height="12" rx="6" fill="${P.lantern}"/><circle cx="300" cy="92" r="16" fill="${P.lantern}"/><circle cx="300" cy="92" r="6" fill="${P.ink}"/></g>
      <g class="pan pan-l"><path d="M0 0 L -62 120 M0 0 L 62 120" stroke="${P.paper}" stroke-width="3"/><path d="M-82 120 H82 C 82 150, -82 150, -82 120 Z" fill="${P.paper}"/><g transform="translate(0 92)">${leftItem}</g></g>
      <g class="pan pan-r"><path d="M0 0 L -62 120 M0 0 L 62 120" stroke="${P.paper}" stroke-width="3"/><path d="M-82 120 H82 C 82 150, -82 150, -82 120 Z" fill="${P.paper}"/><g transform="translate(0 92)">${rightItem}</g></g>
      <g class="lock" opacity="0"><rect x="272" y="40" width="56" height="44" rx="8" fill="${P.red}"/><path d="M284 40 V 28 C 284 10, 316 10, 316 28 V 40" stroke="${P.red}" stroke-width="8" fill="none"/><text x="300" y="72" text-anchor="middle" font-family="Big Shoulders Display" font-weight="900" font-size="22" fill="#fff">¥ $</text></g>
    </svg>`;
  }
  function setScale(el, deg) {
    if (!el) return; const a = deg * Math.PI / 180, L = 220;
    el.querySelector('.beam').setAttribute('transform', `rotate(${deg} 300 92)`);
    el.querySelector('.pan-l').setAttribute('transform', `translate(${(300 - L * Math.cos(a)).toFixed(2)} ${(92 - L * Math.sin(a)).toFixed(2)})`);
    el.querySelector('.pan-r').setAttribute('transform', `translate(${(300 + L * Math.cos(a)).toFixed(2)} ${(92 + L * Math.sin(a)).toFixed(2)})`);
  }
  // The rate dial: an arc from min to max, a needle, a notch at the market rate.
  function dial(min, max, market, id, unit) {
    const A0 = -135, A1 = 135, ang = (v) => A0 + (A1 - A0) * (v - min) / (max - min), pt = (v, r) => { const a = (ang(v) - 90) * Math.PI / 180; return [120 + r * Math.cos(a), 120 + r * Math.sin(a)]; };
    let ticks = ''; const step = (max - min) / 12;
    for (let k = 0; k <= 12; k++) { const v = min + k * step, [x1, y1] = pt(v, 96), [x2, y2] = pt(v, k % 2 ? 104 : 110); ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${P.paper}" stroke-width="${k % 2 ? 2 : 3}"/>`; if (!(k % 2)) { const [tx, ty] = pt(v, 84); ticks += `<text x="${tx.toFixed(1)}" y="${(ty + 5).toFixed(1)}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="700" font-size="15" fill="${P.paper}">${+v.toFixed(2)}</text>`; } }
    const [mx, my] = pt(market, 116), [mx2, my2] = pt(market, 128);
    return `<svg viewBox="0 0 240 240" class="dial-svg" aria-hidden="true"><circle cx="120" cy="120" r="116" fill="${P.ink}"/>${ticks}<line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${mx2.toFixed(1)}" y2="${my2.toFixed(1)}" stroke="${P.lantern}" stroke-width="8" stroke-linecap="round"/><circle cx="120" cy="120" r="58" fill="${P.night2}" stroke="${P.paper}" stroke-width="3"/><g class="needle"><path d="M120 120 L 116 42 L 120 30 L 124 42 Z" fill="${P.lantern}"/></g><circle cx="120" cy="120" r="30" fill="${P.night}"/><text class="dial-val" x="120" y="127" text-anchor="middle" font-family="Big Shoulders Display" font-weight="900" font-size="22" fill="${P.paper}"></text><text x="120" y="190" text-anchor="middle" font-family="Atkinson Hyperlegible Next" font-size="11" fill="${P.paper}">${unit}</text></svg>`;
  }
  function setDial(el, v, min, max, dp) { const a = -135 + 270 * (v - min) / (max - min), k = Math.pow(10, dp == null ? 1 : dp); el.querySelector('.needle').setAttribute('transform', `rotate(${a.toFixed(2)} 120 120)`); el.querySelector('.dial-val').textContent = (Math.round(v * k) / k).toString(); }

  // Postcard pictures for "Who is happy?"
  const tractor = `<svg viewBox="0 0 200 120" aria-hidden="true"><rect width="200" height="120" fill="${P.sky}"/><rect y="92" width="200" height="28" fill="#7DBA6A"/><rect x="40" y="46" width="70" height="34" rx="4" fill="${P.red2}"/><rect x="100" y="24" width="40" height="56" rx="4" fill="${P.red2}"/><rect x="108" y="32" width="24" height="20" fill="${P.sky}"/><circle cx="62" cy="88" r="22" fill="${P.ink}"/><circle cx="62" cy="88" r="9" fill="${P.lantern}"/><circle cx="128" cy="94" r="14" fill="${P.ink}"/><circle cx="128" cy="94" r="5" fill="${P.lantern}"/><rect x="58" y="30" width="6" height="18" fill="${P.ink}"/></svg>`;
  const student = `<svg viewBox="0 0 200 120" aria-hidden="true"><rect width="200" height="120" fill="${P.night}"/><circle cx="160" cy="30" r="16" fill="${P.paper}"/><rect x="62" y="40" width="76" height="62" rx="10" fill="${P.lantern}"/><rect x="86" y="28" width="28" height="16" rx="5" fill="none" stroke="${P.lantern}" stroke-width="6"/><rect x="62" y="64" width="76" height="8" fill="${P.ink}" opacity=".25"/><circle cx="76" cy="108" r="6" fill="${P.ink}"/><circle cx="124" cy="108" r="6" fill="${P.ink}"/>${vtext(30, 46, '東京', 22, P.neon)}</svg>`;
  const car = `<svg viewBox="0 0 200 120" aria-hidden="true"><rect width="200" height="120" fill="#FFE6D5"/><rect y="96" width="200" height="24" fill="#B9B2A3"/><path d="M30 86 L 40 60 C 46 48, 60 42, 80 42 L 124 42 C 140 42, 150 50, 158 62 L 176 70 C 182 72, 184 78, 184 86 Z" fill="${P.night}"/><path d="M60 60 L 70 48 L 98 48 L 98 60 Z M104 60 L 104 48 L 126 48 C 134 48, 140 54, 144 60 Z" fill="${P.sky}"/><circle cx="66" cy="90" r="14" fill="${P.ink}"/><circle cx="66" cy="90" r="5" fill="#ddd"/><circle cx="150" cy="90" r="14" fill="${P.ink}"/><circle cx="150" cy="90" r="5" fill="#ddd"/></svg>`;
  const coinScene = `<svg viewBox="0 0 400 300" class="coin-svg" aria-hidden="true"><rect x="40" y="200" width="320" height="90" rx="8" fill="${P.night}"/><rect x="60" y="214" width="280" height="62" rx="6" fill="${P.night2}"/><circle cx="200" cy="245" r="20" fill="none" stroke="${P.lantern}" stroke-width="5"/><path d="M200 225 V 265 M180 245 H 220" stroke="${P.lantern}" stroke-width="4"/>
    <g class="stacks"><rect x="84" y="226" width="60" height="36" rx="3" fill="#A9D2B0"/><rect x="256" y="226" width="60" height="36" rx="3" fill="${P.paper}"/><text x="114" y="250" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="18" fill="${P.ink}">CASH</text><text x="286" y="250" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="18" fill="${P.ink}">BONDS</text></g>
    <rect x="186" y="120" width="28" height="80" fill="${P.paper}"/><rect x="160" y="190" width="80" height="12" fill="${P.paper}"/><g class="coin"><circle cx="200" cy="80" r="56" fill="${P.lantern}" stroke="#B88A1C" stroke-width="6"/><circle cx="200" cy="80" r="42" fill="none" stroke="#B88A1C" stroke-width="3"/><text x="200" y="98" text-anchor="middle" font-family="Big Shoulders Display" font-weight="900" font-size="50" fill="${P.ink}">$1</text></g></svg>`;

  // ---------------- people: flat poster busts with a mood (no detailed faces) ----------------
  const CAST = {
    dana: { bg: '#B3DDF2', skin: '#8D5A3B', cloth: P.night, hair: (m) => `<g fill="#1E120C">${[[-18, -30], [-6, -36], [8, -36], [20, -29], [-24, -18], [26, -17]].map(([x, y]) => `<circle cx="${60 + x}" cy="${62 + y}" r="11"/>`).join('')}</g>`, extra: `<rect x="70" y="112" width="20" height="9" rx="2" fill="${P.paper}"/><rect x="72" y="115" width="16" height="2" fill="${P.night}"/><path d="M44 104 L60 124 L76 104" fill="#E9F3FF"/>` },
    sato: { bg: P.lantern, skin: '#E8B98F', cloth: '#2F7D55', hair: () => `<path d="M33 60 C 33 30, 87 30, 87 60 C 80 46, 40 46, 33 60 Z" fill="#9AA3AE"/><circle cx="60" cy="30" r="10" fill="#9AA3AE"/>`, extra: `<path d="M42 104 h36 v40 h-36 Z" fill="${P.paper}" opacity=".9"/><path d="M30 52 C 30 40, 90 40, 90 52 L 90 46 C 80 30, 40 30, 30 46 Z" fill="${P.red2}"/>` },
    travis: { bg: '#9CD8B4', skin: '#F0C8A0', cloth: '#7A8696', hair: () => `<path d="M32 52 C 32 28, 88 28, 88 52 Z" fill="${P.red2}"/><rect x="76" y="47" width="26" height="7" rx="3" fill="${P.red2}"/><path d="M36 54 h 48" stroke="#5B2A14" stroke-width="5"/>`, extra: `<path d="M40 104 L 46 140 M80 104 L 74 140" stroke="#2B3A5C" stroke-width="7"/>` },
    ken: { bg: '#1C3266', skin: '#D9A77A', cloth: '#F3F1EA', hair: () => `<path d="M33 58 C 30 30, 70 22, 88 44 C 80 36, 50 38, 40 50 Z" fill="#111"/><path d="M33 58 C 32 44, 40 36, 52 34 C 44 44, 38 50, 33 58 Z" fill="#111"/>`, extra: `<path d="M56 104 L 64 104 L 62 140 L 58 140 Z" fill="${P.red2}"/><path d="M30 60 C 26 40, 94 40, 90 60" stroke="#222" stroke-width="4" fill="none"/><rect x="24" y="56" width="10" height="16" rx="4" fill="#222"/><path d="M30 70 Q 34 84 48 84" stroke="#222" stroke-width="3" fill="none"/>` },
  };
  CAST.linda = { bg: '#F7C548', skin: '#F2C9A6', cloth: '#2F6EA8', hair: () => `<path d="M32 66 C 28 36, 92 36, 88 66 C 84 50, 36 50, 32 66 Z" fill="#C9C2B8"/><path d="M30 50 C 30 34, 90 34, 90 50 Z" fill="${P.red2}"/><rect x="82" y="45" width="22" height="7" rx="3" fill="${P.red2}"/>`, extra: `<path d="M48 104 v36 M72 104 v36" stroke="#1F4C78" stroke-width="5"/>` };
  CAST.maya = { bg: '#FFB3C7', skin: '#B57A55', cloth: P.lantern, hair: () => `<path d="M30 74 C 24 34, 96 34, 90 74 C 92 54, 84 44, 60 42 C 36 44, 28 54, 30 74 Z" fill="#1A1A1A"/>`, extra: `<circle cx="52" cy="60" r="7" fill="none" stroke="#1A1A1A" stroke-width="2.5"/><circle cx="68" cy="60" r="7" fill="none" stroke="#1A1A1A" stroke-width="2.5"/><path d="M59 60 h2" stroke="#1A1A1A" stroke-width="2.5"/>` };
  function face(mood) {
    const brow = { happy: 'M48 52 l8 -2 M64 50 l8 2', smug: 'M48 51 l8 1 M64 48 l8 3', worried: 'M48 50 l8 3 M64 53 l8 -3', flat: 'M48 51 h8 M64 51 h8', shocked: 'M48 48 l8 -2 M64 46 l8 2' }[mood] || 'M48 51 h8 M64 51 h8';
    const mouth = { happy: 'M52 74 Q 60 81 68 74', smug: 'M52 75 Q 62 79 70 72', worried: 'M52 78 Q 60 72 68 78', flat: 'M53 76 h14', shocked: '' }[mood] || 'M53 76 h14';
    return `<path d="${brow}" stroke="#2A1A12" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="52" cy="60" r="3" fill="#2A1A12"/><circle cx="68" cy="60" r="3" fill="#2A1A12"/>${mood === 'shocked' ? '<ellipse cx="60" cy="76" rx="5" ry="6" fill="#2A1A12"/>' : `<path d="${mouth}" stroke="#2A1A12" stroke-width="2.6" stroke-linecap="round" fill="none"/>`}`;
  }
  function person(who, mood) {
    const c = CAST[who];
    return `<svg viewBox="0 0 120 140" class="person" aria-hidden="true"><circle cx="60" cy="70" r="60" fill="${c.bg}"/><path d="M14 140 C 16 108, 36 98, 60 98 C 84 98, 104 108, 106 140 Z" fill="${c.cloth}"/><rect x="52" y="84" width="16" height="18" fill="${c.skin}"/><circle cx="60" cy="62" r="27" fill="${c.skin}"/>${c.hair()}${c.extra}${face(mood)}</svg>`;
  }
  root.ART = { P, BACKDROPS, person, CAST, yenNote, usdNote, apple, burger, shirt, scale, setScale, dial, setDial, tractor, student, car, coinScene, star6, vtext };
})(window);
