'use strict';
// ================= Generowanie mapy =================
function bezierPts(p0, p1, p2, p3, step) {
  const out = [];
  for (let t = 0; t <= 1.0001; t += step) {
    const u = 1 - t;
    out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return out;
}
function strokePath(g, pts) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }

function genMap(bi) {
  const props = [], hazards = [], lights = [], rivers = [];
  const cxw = WW / 2, cyw = WH / 2;
  const free = (x, y, br) => x > M + br + 20 && y > M + br + 20 && x < WW - M - br - 20 && y < WH - M - br - 20 &&
    hyp(x - cxw, y - cyw) > br + 210 && props.every(p => hyp(p.x - x, p.y - y) > p.br + br + 60) && hazards.every(h => hyp(h.x - x, h.y - y) > h.r + br + 30);
  const place = (br, fn) => { for (let k = 0; k < 80; k++) { const x = rand(0, WW), y = rand(0, WH); if (free(x, y, br)) { fn(x, y); return true; } } return false; };
  const addC = (kind, x, y, r, spr, extra) => props.push(Object.assign({ kind, shape: 'c', x, y, r, br: r, spr, sy: y + r * .35 }, extra || {}));
  const addR = (kind, x, y, w, h, spr, extra) => props.push(Object.assign({ kind, shape: 'r', x, y, w, h, br: hyp(w, h) / 2, spr, sy: y + h / 2 }, extra || {}));

  // --- lawowe rzeki (Magma) jako łańcuch stref zagrożenia
  if (bi === 1) {
    const r1 = bezierPts([-40, rand(200, 420)], [WW * .3, rand(0, 600)], [WW * .65, rand(0, 600)], [WW + 40, rand(200, 420)], .004);
    const r2 = bezierPts([-40, WH - rand(200, 420)], [WW * .35, WH - rand(0, 600)], [WW * .7, WH - rand(0, 600)], [WW + 40, WH - rand(200, 420)], .004);
    for (const r of [r1, r2]) {
      rivers.push(r);
      let last = null;
      for (const p of r) {
        if (last && hyp(p[0] - last[0], p[1] - last[1]) < 26) continue;
        hazards.push({ x: p[0], y: p[1], r: 20, river: true }); last = p;
      }
      for (let i = 0; i < r.length; i += 28) lights.push({ x: r[i][0], y: r[i][1], r: 190, c: '#ff7a2e', a: .85, f: rand(0, 6) });
    }
    for (let i = 0; i < 6; i++) place(110, (x, y) => { const r = rand(55, 95); hazards.push({ x, y, r }); lights.push({ x, y, r: r * 2.8, c: '#ff8a3d', a: .9, f: rand(0, 6) }); });
  }

  if (bi === 0) {
    for (let i = 0; i < 9; i++) place(60, (x, y) => { const r = rand(32, 56); addC('rock', x, y, r, sprRock(r, { top1: '#6c7b84', top2: '#2b3840', side: '#1a2329', edge: '#0e151a', hi: 'rgba(200,240,255,.35)', moss: ['#3f8a4a', '#58a855', '#2d6b3a'] })); });
    for (let i = 0; i < 8; i++) place(50, (x, y) => { const R = rand(78, 112); addC('tree', x, y, 22, sprTrunk(), { canopy: sprCanopy(R), cr: R }); });
    for (let i = 0; i < 8; i++) place(30, (x, y) => { const col = Math.random() < .6 ? '#4dffd2' : '#c77dff'; addC('crystal', x, y, 20, sprCrystal(col, col === '#4dffd2' ? '#1a6a8a' : '#4a2a8a'), { glow: col }); lights.push({ x, y, r: 230, c: col, a: .9, f: rand(0, 6) }); });
  } else if (bi === 1) {
    for (let i = 0; i < 10; i++) place(60, (x, y) => { const r = rand(32, 58); addC('rock', x, y, r, sprRock(r, { top1: '#5a4440', top2: '#1d1413', side: '#110a09', edge: '#070404', hi: 'rgba(255,170,120,.3)', glow: '#ff7a2e' })); });
    for (let i = 0; i < 6; i++) place(34, (x, y) => { addC('spire', x, y, 26, sprSpire()); lights.push({ x, y, r: 120, c: '#ff6a1a', a: .5, f: rand(0, 6) }); });
  } else {
    for (let i = 0; i < 10; i++) place(80, (x, y) => { const w = ri(70, 130), h = ri(56, 84); addR('crate', x, y, w, h, sprCrate(w, h)); });
    for (let i = 0; i < 6; i++) place(34, (x, y) => { addC('tank', x, y, 28, sprTank(), { glow: '#3ec9ff' }); lights.push({ x, y, r: 220, c: '#3ec9ff', a: .9, f: rand(0, 6) }); });
  }
  const barrelSpr = sprBarrel();
  for (let i = 0; i < 6; i++) place(22, (x, y) => addC('barrel', x, y, 17, barrelSpr, { hp: 30 }));

  const ground = drawGround(bi, props, hazards, lights, rivers);
  return { ground, props, hazards, lights };
}

function drawGround(bi, props, hazards, lights, rivers) {
  const c = mk(WW, WH), g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  const blot = (cols, n, r0, r1, a) => { for (let i = 0; i < n; i++) { const x = rand(0, WW), y = rand(0, WH), r = rand(r0, r1); g.fillStyle = RG(g, x, y, 0, x, y, r, [[0, hexA(pick(cols), a)], [1, hexA(cols[0], 0)]]); g.fillRect(x - r, y - r, r * 2, r * 2); } };
  const speck = (cols, n, s0, s1, a0, a1) => { for (let i = 0; i < n; i++) { g.globalAlpha = rand(a0, a1); g.fillStyle = pick(cols); const s = rand(s0, s1); g.fillRect(rand(0, WW), rand(0, WH), s, s); } g.globalAlpha = 1; };

  if (bi === 0) {
    g.fillStyle = '#163029'; g.fillRect(0, 0, WW, WH);
    blot(['#1f4436', '#0f241c', '#2a5540', '#1b3a2d', '#33503a'], 80, 120, 380, .55);
    speck(['#2c5e43', '#0c1d16', '#3a7552', '#1c3d2d'], 9000, 1, 3.5, .35, .7);
    for (let k = 0; k < 3; k++) { // ścieżki
      const p = bezierPts([rand(0, WW), -50], [rand(0, WW), rand(0, WH)], [rand(0, WW), rand(0, WH)], [rand(0, WW), WH + 50], .01);
      [[110, 'rgba(70,58,38,.16)'], [72, 'rgba(84,68,42,.2)'], [40, 'rgba(96,78,50,.2)']].forEach(([w, col]) => { g.strokeStyle = col; g.lineWidth = w; strokePath(g, p); });
      for (const q of p) if (Math.random() < .5) { g.fillStyle = 'rgba(140,130,110,.35)'; ell(g, q[0] + rand(-30, 30), q[1] + rand(-30, 30), rand(2, 4), rand(1.5, 3)); g.fill(); }
    }
    for (let i = 0; i < 2200; i++) { // kępki trawy
      const x = rand(0, WW), y = rand(0, WH), n = ri(3, 6);
      for (let j = 0; j < n; j++) {
        g.strokeStyle = pick(['#3f8f5a', '#4fa86a', '#2f7048', '#5cbf74']); g.globalAlpha = rand(.5, .9); g.lineWidth = rand(1.2, 2);
        g.beginPath(); g.moveTo(x + j * 2 - n, y); g.quadraticCurveTo(x + j * 2 - n + rand(-3, 3), y - 6, x + j * 2 - n + rand(-6, 6), y - rand(7, 15)); g.stroke();
      }
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 380; i++) { g.fillStyle = hexA(pick(['#6a8a2a', '#8a7a2a', '#4a6a2a']), .6); ell(g, rand(0, WW), rand(0, WH), rand(3, 6), rand(1.5, 3), rand(0, TAU)); g.fill(); }
    for (let i = 0; i < 16; i++) { // świecące grzyby
      const x = rand(M + 40, WW - M - 40), y = rand(M + 40, WH - M - 40), col = Math.random() < .5 ? '#4dffd2' : '#c77dff';
      for (let j = 0; j < ri(3, 7); j++) {
        const mx = x + rand(-22, 22), my = y + rand(-16, 16), r = rand(3, 7);
        g.fillStyle = '#d9e8e0'; g.fillRect(mx - 1, my, 2, r * .8);
        g.fillStyle = RG(g, mx - r * .3, my - r * .3, 0, mx, my, r, [[0, '#ffffff'], [.3, col], [1, hexA(col, .4)]]); ell(g, mx, my, r, r * .75); g.fill();
      }
      g.fillStyle = RG(g, x, y, 0, x, y, 60, [[0, hexA(col, .22)], [1, hexA(col, 0)]]); g.fillRect(x - 60, y - 60, 120, 120);
      lights.push({ x, y, r: 150, c: col, a: .65, f: rand(0, 6) });
    }
  } else if (bi === 1) {
    g.fillStyle = '#1d1514'; g.fillRect(0, 0, WW, WH);
    blot(['#2a1d1b', '#110b0a', '#33241f', '#2a1610', '#3a2a24'], 80, 120, 380, .6);
    speck(['#3a2c28', '#0a0606', '#4a3a34', '#2a1a14', '#6a5a50'], 9000, 1, 3, .3, .65);
    for (let i = 0; i < 260; i++) { // pęknięcia
      let x = rand(0, WW), y = rand(0, WH); const pts = [[x, y]];
      for (let j = 0; j < ri(3, 7); j++) { x += rand(-40, 40); y += rand(-40, 40); pts.push([x, y]); }
      g.strokeStyle = '#090505'; g.lineWidth = rand(2, 4); strokePath(g, pts);
      if (Math.random() < .3) { g.strokeStyle = '#ff6a1a'; g.shadowColor = '#ff5a00'; g.shadowBlur = 10; g.lineWidth = 1.4; strokePath(g, pts); g.shadowBlur = 0; }
    }
    for (const r of rivers) {
      [[96, '#140705', 0], [72, '#3a0e04', 0], [52, '#c22e00', 30], [34, '#ff6a00', 24], [16, '#ffb000', 12], [5, '#fff3b0', 6]].forEach(([w, col, b]) => {
        g.strokeStyle = col; g.lineWidth = w; g.shadowColor = '#ff5a00'; g.shadowBlur = b; strokePath(g, r);
      });
      g.shadowBlur = 0;
      for (let i = 0; i < r.length; i += 3) { g.fillStyle = 'rgba(30,8,4,.75)'; ell(g, r[i][0] + rand(-14, 14), r[i][1] + rand(-14, 14), rand(4, 11), rand(3, 7), rand(0, 3)); g.fill(); }
    }
    for (const h of hazards) if (!h.river) {
      g.fillStyle = RG(g, h.x, h.y, h.r * .7, h.x, h.y, h.r * 1.35, [[0, 'rgba(20,6,4,.95)'], [1, 'rgba(20,6,4,0)']]); g.fillRect(h.x - h.r * 1.4, h.y - h.r * 1.4, h.r * 2.8, h.r * 2.8);
      g.shadowColor = '#ff5a00'; g.shadowBlur = 30;
      g.fillStyle = RG(g, h.x, h.y, 0, h.x, h.y, h.r, [[0, '#fff2a0'], [.3, '#ffb000'], [.7, '#ff5a00'], [1, '#8a1a00']]);
      g.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU, rr = h.r * rand(.9, 1.05); i ? g.lineTo(h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr) : g.moveTo(h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr); } g.closePath(); g.fill();
      g.shadowBlur = 0;
      for (let i = 0; i < 8; i++) { const a = rand(0, TAU), d = rand(0, h.r * .7); g.fillStyle = 'rgba(40,10,4,.7)'; ell(g, h.x + Math.cos(a) * d, h.y + Math.sin(a) * d, rand(5, 14), rand(3, 9), rand(0, 3)); g.fill(); }
    }
  } else {
    g.fillStyle = '#1b2431'; g.fillRect(0, 0, WW, WH);
    const P = 96;
    for (let y = 0; y < WH; y += P) for (let x = 0; x < WW; x += P) {
      g.fillStyle = pick(['#222d3c', '#1f2937', '#253142', '#202a39']); g.fillRect(x + 1, y + 1, P - 2, P - 2);
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x + 1, y + 1, P - 2, 2); g.fillRect(x + 1, y + 1, 2, P - 2);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 1, y + P - 3, P - 2, 2); g.fillRect(x + P - 3, y + 1, 2, P - 2);
      g.fillStyle = '#4a5a70'; for (const [a, b] of [[7, 7], [P - 7, 7], [7, P - 7], [P - 7, P - 7]]) { g.beginPath(); g.arc(x + a, y + b, 1.8, 0, TAU); g.fill(); }
      if (Math.random() < .08) { g.fillStyle = '#121822'; g.fillRect(x + 18, y + 18, P - 36, P - 36); g.fillStyle = '#2c3a4e'; for (let k = 22; k < P - 22; k += 7) g.fillRect(x + 20, y + k, P - 40, 3); }
    }
    for (let i = 0; i < 5; i++) {
      const x = rand(M, WW - 300), y = rand(M, WH - 120), w = rand(160, 300), h = rand(40, 80);
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalAlpha = .45; g.fillStyle = '#e8b400'; g.fillRect(x, y, w, h);
      g.fillStyle = '#111'; for (let k = -h; k < w; k += 28) { g.beginPath(); g.moveTo(x + k, y + h); g.lineTo(x + k + 14, y + h); g.lineTo(x + k + 14 + h, y); g.lineTo(x + k + h, y); g.fill(); }
      g.restore();
    }
    for (let i = 0; i < 12; i++) { // świetlne pasy w podłodze
      const vert = Math.random() < .5, x = rand(M + 60, WW - M - 260), y = rand(M + 60, WH - M - 260), L = rand(140, 260);
      g.strokeStyle = '#7fe6ff'; g.shadowColor = '#3ec9ff'; g.shadowBlur = 14; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, y); g.lineTo(vert ? x : x + L, vert ? y + L : y); g.stroke(); g.shadowBlur = 0;
      for (let k = 0; k <= L; k += 90) lights.push({ x: vert ? x : x + k, y: vert ? y + k : y, r: 110, c: '#3ec9ff', a: .55, f: rand(0, 6) });
    }
    g.globalAlpha = 1;
    blot(['#e8f4ff', '#cfe6ff'], 70, 60, 200, .28);
    speck(['#ffffff', '#cfe6ff'], 5000, 1, 2.5, .08, .3);
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
    for (let i = 0; i < 300; i++) { const x = rand(0, WW), y = rand(0, WH), a = rand(0, TAU), L = rand(8, 30); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  }
  // cienie przeszkód wypalone w podłożu
  for (const p of props) {
    if (p.kind === 'barrel') continue;
    const rx = p.shape === 'c' ? p.r * 1.25 : p.w * .62, ry = p.shape === 'c' ? p.r * .85 : p.h * .6;
    g.globalAlpha = .7; g.drawImage(SHADOW, p.x - rx + 10, p.y - ry + 16, rx * 2, ry * 2);
    if (p.canopy) { g.globalAlpha = .45; g.drawImage(SHADOW, p.x - p.cr + 30, p.y - p.cr * .8 + 40, p.cr * 2, p.cr * 1.6); }
  }
  g.globalAlpha = 1;
  // krawędź świata
  const edgeCol = ['#06120e', '#0a0505', '#0b111b'][bi];
  const e = 140;
  [[0, 0, WW, e, 0, 0, 0, e], [0, WH - e, WW, e, 0, WH, 0, WH - e], [0, 0, e, WH, 0, 0, e, 0], [WW - e, 0, e, WH, WW, 0, WW - e, 0]].forEach(([x, y, w, h, x0, y0, x1, y1]) => {
    g.fillStyle = LG(g, x0, y0, x1, y1, [[0, hexA(edgeCol, 1)], [.35, hexA(edgeCol, .85)], [1, hexA(edgeCol, 0)]]); g.fillRect(x, y, w, h);
  });
  const wallCol = ['#1f4a36', '#3a1810', '#3a4a60'][bi], wallHi = ['#3f8a5a', '#ff6a1a', '#7fd8ff'][bi];
  g.strokeStyle = wallCol; g.lineWidth = 10; g.strokeRect(M - 5, M - 5, WW - 2 * M + 10, WH - 2 * M + 10);
  g.strokeStyle = wallHi; g.globalAlpha = .55; g.lineWidth = 2; g.shadowColor = wallHi; g.shadowBlur = 10; g.strokeRect(M, M, WW - 2 * M, WH - 2 * M); g.shadowBlur = 0; g.globalAlpha = 1;
  return c;
}
