'use strict';
// ================= Grafika: pomocnicze =================
const WW = 2400, WH = 1600, M = 50;
const SS = 2; // supersampling sprite'ów
function sprite(w, h, fn) {
  const c = mk(Math.ceil(w * SS), Math.ceil(h * SS)), g = c.getContext('2d');
  g.scale(SS, SS); g.translate(w / 2, h / 2); g.lineJoin = 'round'; g.lineCap = 'round';
  fn(g);
  return { c, w, h };
}
function drawSpr(g, s, x, y, rot, sc) {
  if (!rot && (!sc || sc === 1)) { g.drawImage(s.c, x - s.w / 2, y - s.h / 2, s.w, s.h); return; }
  g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (sc && sc !== 1) g.scale(sc, sc);
  g.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h); g.restore();
}
function rrect(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
function poly(g, pts, dx, dy) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] + (dx || 0), p[1] + (dy || 0)) : g.moveTo(p[0] + (dx || 0), p[1] + (dy || 0))); g.closePath(); }
function LG(g, x0, y0, x1, y1, st) { const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(s => gr.addColorStop(s[0], s[1])); return gr; }
function RG(g, x0, y0, r0, x1, y1, r1, st) { const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1); st.forEach(s => gr.addColorStop(s[0], s[1])); return gr; }

const GC = {}, LC = {};
function glowSpr(color) {
  let c = GC[color]; if (c) return c;
  c = mk(64, 64); const g = c.getContext('2d');
  g.fillStyle = RG(g, 32, 32, 0, 32, 32, 32, [[0, hexA(color, 1)], [.16, hexA(color, .8)], [.42, hexA(color, .24)], [1, hexA(color, 0)]]);
  g.fillRect(0, 0, 64, 64); return GC[color] = c;
}
function lightSpr(color) {
  let c = LC[color]; if (c) return c;
  c = mk(128, 128); const g = c.getContext('2d');
  g.fillStyle = RG(g, 64, 64, 0, 64, 64, 64, [[0, hexA(color, 1)], [.3, hexA(color, .7)], [.65, hexA(color, .22)], [1, hexA(color, 0)]]);
  g.fillRect(0, 0, 128, 128); return LC[color] = c;
}
function glowAt(g, x, y, r, color, a) { g.globalAlpha = a === undefined ? 1 : a; g.drawImage(glowSpr(color), x - r, y - r, r * 2, r * 2); }
let SHADOW = null, CONE = null;
function initFx() {
  SHADOW = mk(64, 64); const s = SHADOW.getContext('2d');
  s.fillStyle = RG(s, 32, 32, 0, 32, 32, 32, [[0, 'rgba(0,0,0,.75)'], [.55, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]); s.fillRect(0, 0, 64, 64);
  CONE = mk(256, 256); const c = CONE.getContext('2d');
  c.fillStyle = RG(c, 0, 128, 0, 0, 128, 256, [[0, 'rgba(255,250,235,.95)'], [.4, 'rgba(255,245,220,.5)'], [1, 'rgba(255,240,210,0)']]);
  c.beginPath(); c.moveTo(0, 128); c.arc(0, 128, 256, -.42, .42); c.closePath(); c.fill();
}
function shadowAt(g, x, y, rx, ry, a) { g.globalAlpha = a === undefined ? .55 : a; g.drawImage(SHADOW, x - rx, y - ry, rx * 2, ry * 2); }

// ================= Przeszkody (sprite'y) =================
function sprRock(r, pal) {
  const n = ri(8, 11), pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-.18, .18), rr = r * rand(.82, 1.06); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * .86]); }
  const hgt = r * .32;
  return sprite(r * 2 + 16, r * 2 + hgt + 20, g => {
    g.translate(0, -hgt / 2);
    poly(g, pts, 0, hgt); g.fillStyle = pal.side; g.fill(); g.lineWidth = 2; g.strokeStyle = pal.edge; g.stroke();
    for (let i = 0; i < n; i++) { // pionowe krawędzie
      const p = pts[i]; if (p[1] < 0) continue;
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] + hgt); g.stroke();
    }
    poly(g, pts); g.fillStyle = LG(g, -r, -r, r * .8, r, [[0, pal.top1], [1, pal.top2]]); g.fill();
    // fasety
    const cxp = rand(-r * .2, r * .1), cyp = rand(-r * .25, 0);
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], lit = (a[0] + b[0]) < 0 && (a[1] + b[1]) < r * .3;
      g.beginPath(); g.moveTo(cxp, cyp); g.lineTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.closePath();
      g.fillStyle = lit ? 'rgba(255,255,255,' + rand(.05, .14) + ')' : 'rgba(0,0,0,' + rand(.05, .18) + ')'; g.fill();
    }
    poly(g, pts); g.lineWidth = 2.2; g.strokeStyle = pal.edge; g.stroke();
    g.save(); poly(g, pts); g.clip();
    g.strokeStyle = pal.hi; g.lineWidth = 2.5; g.beginPath();
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; if (a[1] + b[1] < 0 && a[0] + b[0] < r * .5) { g.moveTo(a[0] * .96, a[1] * .96 + 1.5); g.lineTo(b[0] * .96, b[1] * .96 + 1.5); } }
    g.stroke();
    if (pal.moss) for (let i = 0; i < 26; i++) { g.fillStyle = hexA(pick(pal.moss), rand(.4, .85)); ell(g, rand(-r * .7, r * .3), rand(-r * .8, -r * .1), rand(3, 9), rand(2, 6)); g.fill(); }
    if (pal.glow) { g.strokeStyle = pal.glow; g.shadowColor = pal.glow; g.shadowBlur = 8; g.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) { g.beginPath(); let x = rand(-r * .5, r * .5), y = rand(-r * .5, r * .4); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += rand(-10, 10); y += rand(-10, 10); g.lineTo(x, y); } g.stroke(); }
      g.shadowBlur = 0; }
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1;
    for (let k = 0; k < 2; k++) { g.beginPath(); let x = rand(-r * .4, r * .4), y = rand(-r * .4, r * .3); g.moveTo(x, y); for (let j = 0; j < 3; j++) { x += rand(-9, 9); y += rand(-9, 9); g.lineTo(x, y); } g.stroke(); }
    g.restore();
  });
}
function sprTrunk() {
  return sprite(70, 70, g => {
    g.strokeStyle = '#2a1c14'; g.lineWidth = 7;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rand(-.3, .3); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a + .3) * 18, Math.sin(a + .3) * 18, Math.cos(a) * 30, Math.sin(a) * 28); g.stroke(); }
    g.fillStyle = RG(g, -6, -6, 2, 0, 0, 22, [[0, '#6b4a33'], [1, '#2a1a10']]); g.beginPath(); g.arc(0, 0, 21, 0, TAU); g.fill();
    g.strokeStyle = '#1a100a'; g.lineWidth = 2; g.stroke();
  });
}
function sprCanopy(R) {
  const blobs = [];
  for (let i = 0; i < 10; i++) { const a = rand(0, TAU), d = rand(0, R * .5); blobs.push([Math.cos(a) * d, Math.sin(a) * d * .9, rand(R * .32, R * .52)]); }
  blobs.sort((a, b) => a[1] - b[1]);
  return sprite(R * 2.3, R * 2.3, g => {
    for (const b of blobs) { g.fillStyle = '#071a12'; g.beginPath(); g.arc(b[0], b[1], b[2] + 3, 0, TAU); g.fill(); }
    for (const b of blobs) {
      g.fillStyle = RG(g, b[0] - b[2] * .4, b[1] - b[2] * .45, 1, b[0], b[1], b[2], [[0, '#4fb86a'], [.45, '#24733f'], [1, '#0e3a24']]);
      g.beginPath(); g.arc(b[0], b[1], b[2], 0, TAU); g.fill();
    }
    for (let i = 0; i < 140; i++) {
      const a = rand(0, TAU), d = rand(0, R * .85), x = Math.cos(a) * d, y = Math.sin(a) * d;
      g.fillStyle = (x + y < 0) ? 'rgba(160,240,150,.28)' : 'rgba(0,30,15,.3)';
      ell(g, x, y, rand(2, 5), rand(1, 2.5), rand(0, TAU)); g.fill();
    }
    for (let i = 0; i < 12; i++) {
      const a = rand(0, TAU), d = rand(R * .1, R * .8);
      g.fillStyle = 'rgba(125,255,216,.25)'; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 5, 0, TAU); g.fill();
      g.fillStyle = '#c8fff0'; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 1.8, 0, TAU); g.fill();
    }
  });
}
function sprCrystal(col, col2) {
  const shards = [];
  const n = ri(4, 6);
  for (let i = 0; i < n; i++) shards.push({ a: -Math.PI / 2 + rand(-1.1, 1.1), L: rand(22, 40), w: rand(6, 10), bx: rand(-8, 8), by: rand(-2, 8) });
  shards.sort((a, b) => b.L - a.L);
  return sprite(100, 100, g => {
    g.translate(0, 14);
    g.fillStyle = '#1c1830'; ell(g, 0, 6, 22, 11); g.fill();
    g.fillStyle = '#2c2648'; ell(g, -2, 3, 18, 8); g.fill();
    for (const s of shards) {
      const c = Math.cos(s.a), sn = Math.sin(s.a), px = -sn, py = c;
      const bx = s.bx, by = s.by, tx = bx + c * s.L, ty = by + sn * s.L * .8;
      const mx = bx + c * s.L * .72, my = by + sn * s.L * .72 * .8;
      const L = [[bx + px * s.w * .6, by + py * s.w * .6], [mx + px * s.w, my + py * s.w], [tx, ty], [mx, my], [bx, by]];
      const Rr = [[bx - px * s.w * .6, by - py * s.w * .6], [mx - px * s.w, my - py * s.w], [tx, ty], [mx, my], [bx, by]];
      poly(g, L); g.fillStyle = LG(g, bx, by, tx, ty, [[0, hexA(col2, 1)], [.6, col], [1, '#ffffff']]); g.fill();
      poly(g, Rr); g.fillStyle = LG(g, bx, by, tx, ty, [[0, '#120c28'], [.7, hexA(col2, 1)], [1, col]]); g.fill();
      g.strokeStyle = 'rgba(10,6,24,.8)'; g.lineWidth = 1.4;
      poly(g, [L[0], L[1], L[2], Rr[1], Rr[0]]); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(bx, by); g.lineTo(mx, my); g.lineTo(tx, ty); g.stroke();
    }
  });
}
function sprBarrel() {
  return sprite(48, 54, g => {
    g.translate(0, -3);
    g.fillStyle = '#5a0f0c'; ell(g, 0, 6, 17, 15); g.fill();
    g.fillStyle = RG(g, -6, -6, 1, 0, 0, 17, [[0, '#ff7a64'], [.5, '#d9301f'], [1, '#7a120c']]); ell(g, 0, 0, 17, 15); g.fill();
    g.strokeStyle = '#2e2e38'; g.lineWidth = 3.2; g.stroke();
    g.strokeStyle = '#9aa0b0'; g.lineWidth = 1.2; ell(g, 0, 0, 15.5, 13.5); g.stroke();
    g.strokeStyle = 'rgba(40,0,0,.5)'; g.lineWidth = 1.5; ell(g, 0, 0, 10, 8.5); g.stroke();
    g.fillStyle = '#ffd23c'; g.beginPath(); g.moveTo(0, -7); g.lineTo(7, 5); g.lineTo(-7, 5); g.closePath(); g.fill();
    g.strokeStyle = '#1a1206'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#1a1206'; g.fillRect(-.9, -3, 1.8, 4.5); g.fillRect(-.9, 2.5, 1.8, 1.5);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 13, 11, 0, 3.6, 4.6); g.stroke();
  });
}
function sprSpire() {
  return sprite(76, 90, g => {
    g.translate(0, 6);
    const hex = (r, dy) => { const p = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; p.push([Math.cos(a) * r, Math.sin(a) * r * .8 + dy]); } return p; };
    poly(g, hex(28, 10)); g.fillStyle = '#0d0710'; g.fill();
    poly(g, hex(28, 0)); g.fillStyle = LG(g, -28, -20, 28, 20, [[0, '#4a2f5e'], [1, '#150b1c']]); g.fill(); g.strokeStyle = '#06030a'; g.lineWidth = 2; g.stroke();
    poly(g, hex(18, -10)); g.fillStyle = LG(g, -18, -26, 18, 6, [[0, '#7a4fa0'], [1, '#22132e']]); g.fill(); g.stroke();
    poly(g, hex(9, -20)); g.fillStyle = LG(g, -9, -28, 9, -12, [[0, '#c9a3ff'], [1, '#4a2f6e']]); g.fill(); g.stroke();
    g.strokeStyle = '#ff7a2e'; g.shadowColor = '#ff6a1a'; g.shadowBlur = 8; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-20, 6); g.lineTo(-10, -2); g.lineTo(-12, -12); g.moveTo(14, 8); g.lineTo(8, -4); g.stroke(); g.shadowBlur = 0;
  });
}
function sprCrate(w, h) {
  return sprite(w + 16, h + 26, g => {
    g.translate(0, -5);
    g.fillStyle = '#18202c'; rrect(g, -w / 2, -h / 2 + 10, w, h, 5); g.fill();
    g.fillStyle = LG(g, -w / 2, -h / 2, w / 2, h / 2, [[0, '#7b8ea6'], [1, '#3e4c60']]); rrect(g, -w / 2, -h / 2, w, h, 5); g.fill();
    g.strokeStyle = '#121822'; g.lineWidth = 2.2; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-w / 2 + 4, h / 2 - 5); g.lineTo(-w / 2 + 4, -h / 2 + 4); g.lineTo(w / 2 - 5, -h / 2 + 4); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.35)'; rrect(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 3); g.stroke();
    g.save(); rrect(g, -w / 2, -h / 2, w, h, 5); g.clip();
    g.fillStyle = 'rgba(255,200,40,.85)'; g.fillRect(w / 2 - 14, -h / 2, 14, h);
    g.fillStyle = '#141414'; for (let y = -h / 2 - 14; y < h / 2; y += 12) { g.beginPath(); g.moveTo(w / 2 - 14, y); g.lineTo(w / 2, y + 7); g.lineTo(w / 2, y + 13); g.lineTo(w / 2 - 14, y + 6); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 4; i++) { ell(g, rand(-w / 2, w / 4), rand(-h / 2, -h / 4), rand(8, 18), rand(4, 8)); g.fill(); }
    g.restore();
    g.fillStyle = 'rgba(15,22,32,.6)'; g.font = '700 11px "Chakra Petch", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('S-0 · ' + ri(10, 99), -7, 2);
    g.fillStyle = '#9fb0c6'; for (const [x, y] of [[-w / 2 + 5, -h / 2 + 5], [w / 2 - 19, -h / 2 + 5], [-w / 2 + 5, h / 2 - 5], [w / 2 - 19, h / 2 - 5]]) { g.beginPath(); g.arc(x, y, 1.8, 0, TAU); g.fill(); }
  });
}
function sprTank() {
  return sprite(76, 76, g => {
    g.translate(0, -2);
    g.fillStyle = '#10161f'; g.beginPath(); g.arc(0, 7, 29, 0, TAU); g.fill();
    g.fillStyle = LG(g, -28, -28, 28, 28, [[0, '#a9b7c9'], [1, '#3b4658']]); g.beginPath(); g.arc(0, 0, 29, 0, TAU); g.fill();
    g.strokeStyle = '#0d121a'; g.lineWidth = 2; g.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.fillStyle = '#2a3342'; g.beginPath(); g.arc(Math.cos(a) * 24.5, Math.sin(a) * 24.5, 2.2, 0, TAU); g.fill(); }
    g.fillStyle = RG(g, -5, -6, 1, 0, 0, 19, [[0, '#ffffff'], [.25, '#aef3ff'], [.6, '#2ec6ff'], [1, '#0a3a5c']]); g.beginPath(); g.arc(0, 0, 19, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(220,250,255,.8)'; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 14, 3.5, 4.5); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(rand(-10, 10), rand(-10, 10), rand(.8, 2), 0, TAU); g.fill(); }
  });
}
