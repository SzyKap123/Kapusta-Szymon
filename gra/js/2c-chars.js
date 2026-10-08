'use strict';
// ================= Postacie (patrzą w prawo, +x) =================
function drawWeapon(g, id) {
  const ink = '#0b1018';
  g.lineWidth = 1.6; g.strokeStyle = ink;
  if (id === 'blaster') {
    g.fillStyle = LG(g, 0, -4, 0, 4, [[0, '#5a6880'], [1, '#232c3c']]); rrect(g, 6, -3.5, 22, 7, 2.5); g.fill(); g.stroke();
    g.fillStyle = '#3ef0ff'; g.fillRect(12, -1, 12, 2);
    g.fillStyle = '#1a2230'; rrect(g, 26, -2.5, 5, 5, 1.5); g.fill(); g.stroke();
  } else if (id === 'rifle') {
    g.fillStyle = LG(g, 0, -4, 0, 4, [[0, '#4e5e48'], [1, '#1d2619']]); rrect(g, 2, -4, 34, 8, 2.5); g.fill(); g.stroke();
    g.fillStyle = '#2a3326'; rrect(g, 14, 3, 6, 8, 1.5); g.fill(); g.stroke();
    g.fillStyle = '#8dff6a'; g.fillRect(8, -1.2, 20, 2.4);
    g.fillStyle = '#151b14'; rrect(g, 34, -2.5, 7, 5, 1.5); g.fill(); g.stroke();
  } else if (id === 'shotgun') {
    g.fillStyle = LG(g, 0, -6, 0, 6, [[0, '#6a5a44'], [1, '#2a2218']]); rrect(g, 4, -5.5, 30, 11, 3); g.fill(); g.stroke();
    g.fillStyle = '#20232a'; rrect(g, 20, -5, 16, 4.5, 2); g.fill(); g.stroke(); rrect(g, 20, .5, 16, 4.5, 2); g.fill(); g.stroke();
    g.fillStyle = '#ffb627'; g.fillRect(8, -1, 10, 2);
  } else if (id === 'rail') {
    g.fillStyle = LG(g, 0, -4, 0, 4, [[0, '#4a3a66'], [1, '#1a1228']]); rrect(g, 2, -3.5, 42, 7, 2.5); g.fill(); g.stroke();
    for (let x = 14; x < 40; x += 6) { g.fillStyle = '#c77dff'; rrect(g, x, -5.5, 3, 11, 1.2); g.fill(); g.stroke(); }
    g.fillStyle = '#e8d4ff'; g.fillRect(6, -1, 6, 2);
  } else if (id === 'rocket') {
    g.fillStyle = LG(g, 0, -7, 0, 7, [[0, '#6a7480'], [1, '#262c34']]); rrect(g, -6, -6.5, 44, 13, 5); g.fill(); g.stroke();
    g.fillStyle = '#ff6b3d'; rrect(g, 34, -6.5, 6, 13, 2); g.fill(); g.stroke();
    g.fillStyle = '#ffd23c'; g.fillRect(4, -6.5, 4, 13);
    g.fillStyle = '#12161c'; g.beginPath(); g.arc(40, 0, 3.5, 0, TAU); g.fill();
  }
}
function sprPlayer(wid, hero) {
  const H = HEROES[hero] || HEROES.assault, A = H.armor, V = H.visor;
  return sprite(100, 100, g => {
    const ink = '#0b1018';
    // plecak
    g.fillStyle = LG(g, -20, -10, -8, 10, [[0, '#3a4658'], [1, '#1a212c']]); rrect(g, -21, -11, 13, 22, 4); g.fill(); g.lineWidth = 1.8; g.strokeStyle = ink; g.stroke();
    g.fillStyle = V; g.fillRect(-19, -6, 2.5, 12);
    // barki
    g.fillStyle = LG(g, -8, -16, 8, 16, [[0, A[0]], [.55, A[1]], [1, A[2]]]); ell(g, -1, 0, 11, 16.5); g.fill(); g.lineWidth = 2; g.stroke();
    g.strokeStyle = V; g.lineWidth = 2; g.beginPath(); g.arc(-1, 0, 13, -1.9, -1.2); g.stroke(); g.beginPath(); g.arc(-1, 0, 13, 1.2, 1.9); g.stroke();
    // ręce
    g.strokeStyle = ink; g.lineWidth = 7.5; g.beginPath(); g.moveTo(0, -12); g.lineTo(12, -2); g.moveTo(0, 12); g.lineTo(11, 5); g.stroke();
    g.strokeStyle = '#c3d0e2'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -12); g.lineTo(12, -2); g.moveTo(0, 12); g.lineTo(11, 5); g.stroke();
    g.save(); g.translate(2, 3); drawWeapon(g, wid); g.restore();
    g.fillStyle = '#2a3344'; g.beginPath(); g.arc(12, -2, 3, 0, TAU); g.arc(11, 5, 3, 0, TAU); g.fill();
    // hełm
    g.fillStyle = RG(g, -2, -4, 1, 1, 0, 11, [[0, '#ffffff'], [.5, '#c9d6e8'], [1, '#55627a']]); g.beginPath(); g.arc(1, 0, 10.5, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = ink; g.stroke();
    g.strokeStyle = '#0e2a33'; g.lineWidth = 6; g.beginPath(); g.arc(1, 0, 7.5, -1, 1); g.stroke();
    g.strokeStyle = V; g.lineWidth = 3.6; g.beginPath(); g.arc(1, 0, 7.5, -.95, .95); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.2; g.beginPath(); g.arc(1, 0, 8.2, -.8, -.3); g.stroke();
    g.fillStyle = V; g.fillRect(-7, -1, 5, 2);
    if (hero === 'medic') { g.fillStyle = '#ff4d6d'; g.fillRect(-6, -9, 2, 6); g.fillRect(-8, -7, 6, 2); }
    if (hero === 'engineer') { g.fillStyle = '#2a2a2a'; g.fillRect(-4, -12, 6, 3); }
  });
}
function shade(g, cx, cy, r, c0, c1, c2) { return RG(g, cx - r * .35, cy - r * .4, r * .05, cx, cy, r, [[0, c0], [.55, c1], [1, c2]]); }

function sprCrawler(p) {
  return sprite(56, 56, g => {
    g.lineWidth = 1.6; g.strokeStyle = '#0a0d08';
    g.fillStyle = shade(g, -9, 0, 11, p.light, p.main, p.dark); ell(g, -9, 0, 11, 8.5); g.fill(); g.stroke();
    g.strokeStyle = hexA(p.acc, .9); g.lineWidth = 1.8;
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(-9 + i * 4.5, 0, 1.5, 7, 0, 0, TAU); g.stroke(); }
    g.strokeStyle = '#0a0d08'; g.lineWidth = 1.6;
    g.fillStyle = shade(g, 2, 0, 7, p.light, p.main, p.dark); ell(g, 2, 0, 7, 7); g.fill(); g.stroke();
    g.fillStyle = shade(g, 10, 0, 6, p.main, p.dark, '#0a0d08'); ell(g, 10, 0, 6, 5.5); g.fill(); g.stroke();
    g.strokeStyle = p.dark; g.lineWidth = 2.4; g.beginPath(); g.moveTo(14, -3); g.quadraticCurveTo(20, -5, 20, 0); g.moveTo(14, 3); g.quadraticCurveTo(20, 5, 20, 0); g.stroke();
    g.fillStyle = p.eye; g.beginPath(); g.arc(13, -2.5, 1.7, 0, TAU); g.arc(13, 2.5, 1.7, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; ell(g, -12, -3.5, 4, 2); g.fill();
  });
}
function sprDrone(p) {
  return sprite(60, 60, g => {
    const ink = '#0b0f16';
    g.strokeStyle = ink; g.lineWidth = 4; g.beginPath(); g.moveTo(-13, -13); g.lineTo(13, 13); g.moveTo(-13, 13); g.lineTo(13, -13); g.stroke();
    g.strokeStyle = p.dark; g.lineWidth = 2.4; g.stroke();
    for (const [x, y] of [[-13, -13], [13, -13], [-13, 13], [13, 13]]) { g.fillStyle = '#20262f'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); g.strokeStyle = ink; g.lineWidth = 1.5; g.stroke(); }
    g.fillStyle = shade(g, 0, 0, 12, p.light, p.main, p.dark); g.beginPath(); g.arc(0, 0, 11.5, 0, TAU); g.fill(); g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 7.5, 0, TAU); g.stroke();
    g.fillStyle = '#0b0f16'; g.beginPath(); g.arc(5, 0, 5, 0, TAU); g.fill();
    g.fillStyle = RG(g, 5, 0, 0, 5, 0, 4.2, [[0, '#ffffff'], [.35, p.eye], [1, hexA(p.eye, .6)]]); g.beginPath(); g.arc(5, 0, 4.2, 0, TAU); g.fill();
  });
}
function sprBomber(p) {
  return sprite(50, 50, g => {
    g.strokeStyle = '#120806'; g.lineWidth = 1.6;
    g.fillStyle = RG(g, -3, -3, 1, 0, 0, 14, [[0, '#fff2c0'], [.3, p.acc], [.8, '#8a1a10'], [1, '#3a0a06']]); g.beginPath(); g.arc(-2, 0, 13, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(60,0,0,.55)'; g.lineWidth = 1.3;
    for (let i = 0; i < 5; i++) { const a = rand(0, TAU); g.beginPath(); g.moveTo(-2, 0); g.quadraticCurveTo(-2 + Math.cos(a + .5) * 7, Math.sin(a + .5) * 7, -2 + Math.cos(a) * 12, Math.sin(a) * 12); g.stroke(); }
    g.fillStyle = shade(g, 12, 0, 5, p.light, p.main, p.dark); g.beginPath(); g.arc(12, 0, 5, 0, TAU); g.fill(); g.strokeStyle = '#120806'; g.stroke();
    g.fillStyle = p.eye; g.beginPath(); g.arc(14, -1.8, 1.3, 0, TAU); g.arc(14, 1.8, 1.3, 0, TAU); g.fill();
  });
}
function sprTankE(p) {
  return sprite(96, 96, g => {
    const ink = '#090b07';
    g.strokeStyle = ink; g.lineWidth = 2;
    g.fillStyle = shade(g, 22, 0, 12, p.light, p.main, p.dark); ell(g, 22, 0, 12, 13); g.fill(); g.stroke();
    g.fillStyle = '#e8e0c8'; g.beginPath(); g.moveTo(28, -9); g.lineTo(42, -16); g.lineTo(32, -4); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(28, 9); g.lineTo(42, 16); g.lineTo(32, 4); g.closePath(); g.fill(); g.stroke();
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(16, 0); g.quadraticCurveTo(14, s * 30, -14, s * 28); g.quadraticCurveTo(-34, s * 20, -32, 0); g.closePath();
      g.fillStyle = LG(g, 0, 0, -10, s * 30, [[0, p.light], [.4, p.main], [1, p.dark]]); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(10 - k * 13, s * 3); g.quadraticCurveTo(4 - k * 13, s * 18, -6 - k * 11, s * (24 - k * 2)); g.stroke(); }
      g.strokeStyle = ink; g.lineWidth = 2;
      g.fillStyle = p.acc; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(-4 - k * 9, s * 12, 2.4, 0, TAU); g.fill(); }
    }
    g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(16, 0); g.lineTo(-32, 0); g.stroke();
    g.fillStyle = p.eye; g.beginPath(); g.arc(28, -4, 2.2, 0, TAU); g.arc(28, 4, 2.2, 0, TAU); g.fill();
  });
}
function sprSniper(p) {
  return sprite(90, 90, g => {
    const ink = '#0b0f16';
    g.strokeStyle = ink; g.lineWidth = 5;
    for (const a of [2.2, -2.2, Math.PI]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); g.stroke(); }
    g.strokeStyle = p.dark; g.lineWidth = 3; for (const a of [2.2, -2.2, Math.PI]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); g.stroke(); }
    g.fillStyle = '#20262f'; g.strokeStyle = ink; g.lineWidth = 1.6; rrect(g, 6, -3, 34, 6, 2); g.fill(); g.stroke();
    g.fillStyle = p.acc; g.fillRect(36, -3, 4, 6);
    const hx = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; hx.push([Math.cos(a) * 13, Math.sin(a) * 11]); }
    poly(g, hx); g.fillStyle = LG(g, -13, -11, 13, 11, [[0, p.light], [.5, p.main], [1, p.dark]]); g.fill(); g.lineWidth = 2; g.strokeStyle = ink; g.stroke();
    g.fillStyle = '#0b0f16'; rrect(g, 2, -7, 10, 5, 2); g.fill();
    g.fillStyle = p.eye; g.beginPath(); g.arc(9, -4.5, 2, 0, TAU); g.fill();
  });
}
function sprQueen(p) {
  return sprite(200, 200, g => {
    const ink = '#0a0d08';
    for (const s of [-1, 1]) { // skrzydła
      g.fillStyle = 'rgba(200,255,240,.22)'; g.strokeStyle = 'rgba(180,255,230,.6)'; g.lineWidth = 1.5;
      ell(g, -22, s * 46, 44, 20, s * .5); g.fill(); g.stroke();
      ell(g, -40, s * 34, 36, 14, s * .9); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(180,255,230,.35)'; g.beginPath(); g.moveTo(0, s * 14); g.lineTo(-50, s * 62); g.moveTo(0, s * 12); g.lineTo(-70, s * 44); g.stroke();
    }
    g.strokeStyle = ink; g.lineWidth = 2.5;
    g.fillStyle = shade(g, -38, 0, 40, p.light, p.main, p.dark); ell(g, -38, 0, 40, 30); g.fill(); g.stroke();
    g.strokeStyle = hexA(p.acc, .85); g.lineWidth = 3.5;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-50 + i * 11, 0, 3, 26 - i * 2, 0, 0, TAU); g.stroke(); }
    g.strokeStyle = ink; g.lineWidth = 2.5;
    g.fillStyle = shade(g, 6, 0, 22, p.light, p.main, p.dark); ell(g, 6, 0, 22, 21); g.fill(); g.stroke();
    g.fillStyle = shade(g, 34, 0, 16, p.main, p.dark, ink); ell(g, 34, 0, 16, 15); g.fill(); g.stroke();
    g.fillStyle = '#f0e6c8';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(24, i * 6 - 3); g.lineTo(12 - Math.abs(i) * 3, i * 9); g.lineTo(24, i * 6 + 3); g.closePath(); g.fill(); g.stroke(); }
    g.strokeStyle = p.dark; g.lineWidth = 5; g.beginPath(); g.moveTo(44, -9); g.quadraticCurveTo(60, -14, 58, 0); g.moveTo(44, 9); g.quadraticCurveTo(60, 14, 58, 0); g.stroke();
    g.fillStyle = p.eye; for (const [x, y] of [[42, -6], [42, 6], [38, -10], [38, 10], [46, 0]]) { g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, -48, -12, 14, 6, -.2); g.fill();
  });
}
function sprColossus(p) {
  return sprite(220, 220, g => {
    const ink = '#050303';
    const plate = (x, y, r) => {
      const pts = []; const n = ri(6, 8); for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-.2, .2), rr = r * rand(.8, 1.05); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
      poly(g, pts); g.fillStyle = LG(g, x - r, y - r, x + r, y + r, [[0, '#6a4a40'], [1, '#1a0f0c']]); g.fill(); g.lineWidth = 2.5; g.strokeStyle = ink; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.08)'; poly(g, pts.slice(0, Math.ceil(n / 2)).concat([[x, y]])); g.fill();
    };
    g.save(); g.shadowColor = '#ff5a00'; g.shadowBlur = 30; g.fillStyle = '#ff6a00'; g.beginPath(); g.arc(-4, 0, 50, 0, TAU); g.fill(); g.restore();
    plate(-20, -26, 32); plate(-20, 26, 32); plate(-38, 0, 30); plate(10, -16, 28); plate(10, 16, 28);
    for (const s of [-1, 1]) plate(36, s * 52, 24);
    plate(30, 0, 24);
    g.strokeStyle = '#ffb000'; g.shadowColor = '#ff6a00'; g.shadowBlur = 12; g.lineWidth = 2.4;
    for (let k = 0; k < 7; k++) { g.beginPath(); let x = rand(-40, 20), y = rand(-30, 30); g.moveTo(x, y); for (let j = 0; j < 3; j++) { x += rand(-14, 14); y += rand(-14, 14); g.lineTo(x, y); } g.stroke(); }
    g.shadowBlur = 0;
    g.fillStyle = '#fff2a0'; g.beginPath(); g.arc(40, -7, 4, 0, TAU); g.arc(40, 7, 4, 0, TAU); g.fill();
  });
}
function sprWarden(p) {
  return sprite(200, 200, g => {
    const ink = '#0b0f16';
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4, x = Math.cos(a) * 44, y = Math.sin(a) * 44;
      g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.moveTo(0, 0); g.lineTo(x, y); g.stroke();
      g.strokeStyle = '#6a7a92'; g.lineWidth = 6; g.stroke();
      g.fillStyle = shade(g, x, y, 15, '#ffffff', p.main, p.dark); g.beginPath(); g.arc(x, y, 15, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = ink; g.stroke();
      g.fillStyle = '#1a2230'; rrect(g, x + 4, y - 3.5, 16, 7, 2); g.fill(); g.stroke();
      g.fillStyle = p.acc; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
    }
    const oc = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8; oc.push([Math.cos(a) * 36, Math.sin(a) * 36]); }
    poly(g, oc); g.fillStyle = LG(g, -36, -36, 36, 36, [[0, '#ffffff'], [.4, p.main], [1, p.dark]]); g.fill(); g.lineWidth = 3; g.strokeStyle = ink; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 27, 0, TAU); g.stroke();
    g.fillStyle = '#0b0f16'; g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.fill();
    g.fillStyle = RG(g, 0, 0, 0, 0, 0, 16, [[0, '#ffffff'], [.3, p.acc], [1, hexA(p.acc, .3)]]); g.beginPath(); g.arc(0, 0, 15, 0, TAU); g.fill();
    g.fillStyle = p.eye; g.beginPath(); g.arc(7, 0, 5, 0, TAU); g.fill();
  });
}
function buildSprites(bi) {
  const p = BIOMES[bi].pal;
  const s = { crawler: sprCrawler(p), drone: sprDrone(p), bomber: sprBomber(p), tank: sprTankE(p), sniper: sprSniper(p) };
  s.queen = sprQueen(BIOMES[0].pal); s.colossus = sprColossus(BIOMES[1].pal); s.warden = sprWarden(BIOMES[2].pal);
  return s;
}
const PSPR = {};
function playerSpr(hero, wid) { const k = hero + ':' + wid; return PSPR[k] || (PSPR[k] = sprPlayer(wid, hero)); }
function sprTurret() {
  return sprite(60, 60, g => {
    const ink = '#0b1018';
    g.fillStyle = '#20262f'; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; g.save(); g.rotate(a); rrect(g, 4, -3, 18, 6, 2); g.fill(); g.restore(); }
    g.fillStyle = LG(g, -12, -12, 12, 12, [[0, '#ffe9b0'], [.5, '#e0a640'], [1, '#7a5218']]); g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = ink; g.stroke();
    g.fillStyle = '#2a3344'; rrect(g, 4, -3.5, 22, 7, 2); g.fill(); g.stroke();
    g.fillStyle = '#ffb627'; g.beginPath(); g.arc(0, 0, 4.5, 0, TAU); g.fill();
  });
}
