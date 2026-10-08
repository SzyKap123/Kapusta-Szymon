'use strict';
// ================= Rysowanie =================
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, U = 1, LM = null, LMC = null, VIG = null, VIGR = null;
const LMS = .4;
const safe = { t: 0, r: 0, b: 0, l: 0 };
const FD = '"Russo One", "Arial Black", Impact, sans-serif', FU = '"Chakra Petch", "Segoe UI", sans-serif';
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, save.settings.quality === 'high' ? 2 : 1.25);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  const cs = getComputedStyle(document.getElementById('probe'));
  safe.t = parseFloat(cs.paddingTop) || 0; safe.r = parseFloat(cs.paddingRight) || 0; safe.b = parseFloat(cs.paddingBottom) || 0; safe.l = parseFloat(cs.paddingLeft) || 0;
  U = clamp(Math.min(H / 420, W / 820), .72, 1.45) * ({ s: .85, m: 1, l: 1.18 }[save.settings.ui] || 1);
  LM = mk(Math.ceil(W * LMS), Math.ceil(H * LMS)); LMC = LM.getContext('2d');
  VIG = mk(W, H); let g = VIG.getContext('2d');
  g.fillStyle = RG(g, W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.6)']]); g.fillRect(0, 0, W, H);
  VIGR = mk(W, H); g = VIGR.getContext('2d');
  g.fillStyle = RG(g, W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .7, [[0, 'rgba(255,0,40,0)'], [1, 'rgba(255,20,50,.75)']]); g.fillRect(0, 0, W, H);
}
function hudLayout() {
  const L = hudLayoutRaw();
  if (save.settings.lefty) for (const k of ['aim', 'move', 'dash', 'gren', 'abil']) L[k].x = W - L[k].x;
  return L;
}
function hudLayoutRaw() {
  const u = U;
  const aim = { x: W - safe.r - 118 * u, y: H - safe.b - 108 * u, r: 62 * u };
  return {
    u, aim, move: { x: safe.l + 125 * u, y: H - safe.b - 108 * u, r: 62 * u },
    dash: { x: W - safe.r - 250 * u, y: H - safe.b - 52 * u, r: 34 * u },
    gren: { x: W - safe.r - 248 * u, y: H - safe.b - 140 * u, r: 28 * u },
    abil: { x: W - safe.r - 178 * u, y: H - safe.b - 212 * u, r: 31 * u },
    swap: { x: W - safe.r - 150 * u, y: safe.t + 30 * u, w: 178 * u, h: 38 * u },
    pause: { x: W - safe.r - 32 * u, y: safe.t + 30 * u, r: 20 * u },
    coins: { x: W - safe.r - 260 * u, y: safe.t + 30 * u }
  };
}
function ctext(s, x, y, size, color, align, font, stroke) {
  ctx.font = size + 'px ' + (font || FD); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  if (stroke !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size * .2); ctx.strokeStyle = stroke || 'rgba(0,0,0,.65)'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#060a13'; ctx.fillRect(0, 0, W, H);
  if (!G) return;
  const c = G.cam, z = c.z, shk = save.settings.shake ? G.shake : 0, sx = (Math.random() - .5) * shk, sy = (Math.random() - .5) * shk;
  const v = viewRect(), now = G.t;
  ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (W / 2 + sx) - c.x * DPR * z, DPR * (H / 2 + sy) - c.y * DPR * z);
  // podłoże
  const gx = clamp(Math.floor(v.x0), 0, WW - 1), gy = clamp(Math.floor(v.y0), 0, WH - 1), gw = Math.min(WW - gx, Math.ceil(v.x1 - v.x0) + 2), gh = Math.min(WH - gy, Math.ceil(v.y1 - v.y0) + 2);
  ctx.drawImage(G.ground, gx, gy, gw, gh, gx, gy, gw, gh);
  const inView = (x, y, r) => x + r > v.x0 && x - r < v.x1 && y + r > v.y0 && y - r < v.y1;
  // tymczasowa lawa
  for (const h of G.hazards) if (h.temp !== undefined && inView(h.x, h.y, h.r)) {
    ctx.globalAlpha = Math.min(1, h.temp); ctx.fillStyle = RG(ctx, h.x, h.y, 0, h.x, h.y, h.r, [[0, '#ffd060'], [.5, '#ff6a00'], [1, 'rgba(120,20,0,0)']]);
    ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  // znajdźki (ciało)
  for (const k of G.pickups) {
    if (!inView(k.x, k.y, 20)) continue;
    const bob = Math.sin(k.t * 5) * 3, blink = k.life < 5 && Math.sin(k.t * 20) > 0;
    if (blink) continue;
    shadowAt(ctx, k.x, k.y + 6, 9, 4, .4);
    if (k.type === 'coin') {
      const sw = Math.abs(Math.cos(k.t * 5)) * 8 + 1;
      ctx.fillStyle = '#8a5a10'; ell(ctx, k.x, k.y - 6 + bob + 1.5, sw, 8); ctx.fill();
      ctx.fillStyle = RG(ctx, k.x - 2, k.y - 9 + bob, 0, k.x, k.y - 6 + bob, 8, [[0, '#fff6c4'], [.5, '#ffc93c'], [1, '#c07a10']]); ell(ctx, k.x, k.y - 6 + bob, sw, 8); ctx.fill();
    } else if (k.type === 'hp') {
      ctx.fillStyle = '#e8fff0'; rrect(ctx, k.x - 10, k.y - 16 + bob, 20, 20, 5); ctx.fill(); ctx.strokeStyle = '#1a3a24'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#2ed06a'; ctx.fillRect(k.x - 2.5, k.y - 13 + bob, 5, 14); ctx.fillRect(k.x - 7, k.y - 8.5 + bob, 14, 5);
    } else if (k.type === 'gren') {
      ctx.fillStyle = RG(ctx, k.x - 3, k.y - 10 + bob, 1, k.x, k.y - 6 + bob, 9, [[0, '#8a9a70'], [1, '#2a3320']]); ctx.beginPath(); ctx.arc(k.x, k.y - 6 + bob, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffb627'; ctx.fillRect(k.x - 2, k.y - 17 + bob, 4, 4);
    }
  }
  // cienie
  const p = G.player;
  for (const e of G.enemies) if (inView(e.x, e.y, e.r * 2)) {
    const hov = e.d.hover ? 16 : 4, zf = e.z ? 1 - e.z / 300 : 1;
    shadowAt(ctx, e.x + 4, e.y + hov + e.r * .3, e.r * 1.15 * zf, e.r * .6 * zf, e.d.hover ? .35 : .5);
  }
  if (pAlive()) shadowAt(ctx, p.x + 3, p.y + 8, 22, 12, .55);
  for (const b of G.props) if (b.kind === 'barrel' && inView(b.x, b.y, 30)) shadowAt(ctx, b.x + 5, b.y + 9, 22, 13, .55);
  for (const g of G.grenades) shadowAt(ctx, g.x, g.y + 4, 9, 5, .45);
  for (const r of G.remotes.values()) if (!r.dead && inView(r.x, r.y, 40)) shadowAt(ctx, r.x + 3, r.y + 8, 22, 12, .55);
  // pola leczące
  for (const f of G.fields) {
    const a = Math.min(1, f.life * 2);
    ctx.globalAlpha = .18 * a; ctx.fillStyle = '#8dff6a'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
    ctx.globalAlpha = .7 * a; ctx.strokeStyle = '#8dff6a'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -now * 30; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
  // posortowane obiekty
  const list = [];
  for (const pr of G.props) if (inView(pr.x, pr.y, pr.br + 30)) list.push({ y: pr.sy, k: 0, o: pr });
  for (const e of G.enemies) if (inView(e.x, e.y, e.r * 2)) list.push({ y: e.y + (e.z ? 100 : 0), k: 1, o: e });
  if (pAlive()) list.push({ y: p.y, k: 2, o: p });
  for (const r of G.remotes.values()) if (!r.dead && inView(r.x, r.y, 40)) list.push({ y: r.y, k: 3, o: r });
  for (const t of G.turrets) if (inView(t.x, t.y, 30)) list.push({ y: t.y, k: 4, o: t });
  if (pAlive() && p.pet && p.cos.pet !== 'pe_none') list.push({ y: p.pet.y + 30, k: 5, o: p.pet, id: p.cos.pet });
  for (const r of G.remotes.values()) if (!r.dead && r.pet && r.cos && COS[r.cos.pet] && r.cos.pet !== 'pe_none') list.push({ y: r.pet.y + 30, k: 5, o: r.pet, id: r.cos.pet });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) {
    if (it.k === 0) { const pr = it.o; drawSpr(ctx, pr.spr, pr.x, pr.y + (pr.shape === 'r' ? 5 : pr.kind === 'rock' ? pr.r * .16 : pr.kind === 'crystal' ? -14 : pr.kind === 'spire' ? -6 : 0)); if (pr.fuse) { ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, pr.x, pr.y, 30, '#ff3d1a', .8); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; } }
    else if (it.k === 1) drawEnemy(it.o, now);
    else if (it.k === 2) drawPlayer(it.o, now);
    else if (it.k === 3) drawRemote(it.o, now);
    else if (it.k === 5) { const pe = it.o, bob = Math.sin(pe.t * 3) * 3; shadowAt(ctx, pe.x, pe.y + 22, 10, 5, .4); drawSpr(ctx, petSpr(it.id), pe.x, pe.y - 6 + bob, 0, 1 + Math.sin(pe.t * 6) * .04); }
    else { shadowAt(ctx, it.o.x + 2, it.o.y + 6, 16, 9, .5); drawSpr(ctx, TURRET_SPR, it.o.x, it.o.y, it.o.aim); }
  }
  ctx.globalAlpha = 1;
  // cząsteczki (oświetlane)
  for (const q of G.parts) {
    if (q.type !== 'chunk' && q.type !== 'smoke') continue;
    const a = clamp(q.life / q.max, 0, 1);
    if (q.type === 'smoke') { ctx.globalAlpha = a * .5; ctx.drawImage(glowSpr(q.color), q.x - q.size, q.y - q.size, q.size * 2, q.size * 2); }
    else { ctx.globalAlpha = Math.min(1, a * 2); ctx.save(); ctx.translate(q.x, q.y - q.z); ctx.rotate(q.rot); ctx.fillStyle = q.color; ctx.fillRect(-q.size / 2, -q.size / 2, q.size, q.size * .7); ctx.restore(); }
  }
  ctx.globalAlpha = 1;
  // granaty w locie
  for (const g of G.grenades) { ctx.fillStyle = RG(ctx, g.x - 2, g.y - g.z - 3, 1, g.x, g.y - g.z, 7, [[0, '#9aaa80'], [1, '#2a3320']]); ctx.beginPath(); ctx.arc(g.x, g.y - g.z, 6.5, 0, TAU); ctx.fill(); }
  // korony drzew
  for (const pr of G.props) if (pr.canopy && inView(pr.x, pr.y, pr.cr)) {
    const near = p && hyp(p.x - pr.x, p.y - pr.y + 30) < pr.cr * .9;
    ctx.globalAlpha = near ? .38 : .97; drawSpr(ctx, pr.canopy, pr.x, pr.y - 30 + Math.sin(now * .8 + pr.x) * 1.5);
  }
  ctx.globalAlpha = 1;
  // ===== oświetlenie =====
  if (save.settings.quality === 'high' && LM) drawLighting(v, now);
  // ===== emisja (addytywnie) =====
  ctx.globalCompositeOperation = 'lighter';
  for (const l of G.lights) if (l.c && inView(l.x, l.y, 60) && G.bi === 1 && l.r < 140) glowAt(ctx, l.x, l.y, 40, '#ff6a1a', .3 + Math.sin(now * 2 + l.f) * .1);
  for (const pr of G.props) if (pr.glow && inView(pr.x, pr.y, 80)) glowAt(ctx, pr.x, pr.y - 16, 70, pr.glow, .38 + Math.sin(now * 1.7 + pr.x) * .1);
  for (const h of G.hazards) if (!h.river && h.temp === undefined && inView(h.x, h.y, h.r * 1.5)) glowAt(ctx, h.x, h.y, h.r * 1.5, '#ff6a1a', .45 + Math.sin(now * 2 + h.x) * .12);
  for (const h of G.hazards) if (h.temp !== undefined && inView(h.x, h.y, h.r * 1.5)) glowAt(ctx, h.x, h.y, h.r * 1.6, '#ff6a1a', .6 * Math.min(1, h.temp));
  // portale
  for (const po of G.portals) {
    const k = po.t / po.dur, R = (po.boss ? 90 : 38) * Math.min(1, k * 2.5);
    glowAt(ctx, po.x, po.y, R * 2.2, G.B.accent, .7);
    ctx.globalAlpha = .9; ctx.strokeStyle = G.B.accent; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(po.x, po.y, R * (1 - i * .25), R * .55 * (1 - i * .25), 0, now * (3 + i) + i, now * (3 + i) + i + 4.2); ctx.stroke(); }
    glowAt(ctx, po.x, po.y, R * .8, '#ffffff', k);
  }
  // ostrzeżenia
  for (const t of G.teles) {
    const k = t.t / t.dur;
    ctx.globalAlpha = .35 + .3 * Math.sin(now * 20); ctx.fillStyle = hexA(t.color, .28); ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, TAU); ctx.fill();
    ctx.globalAlpha = .9; ctx.strokeStyle = t.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, TAU); ctx.stroke();
    ctx.fillStyle = hexA(t.color, .5); ctx.beginPath(); ctx.arc(t.x, t.y, t.r * k, 0, TAU); ctx.fill();
  }
  // linie celowania wrogów
  for (const e of G.enemies) {
    if (e.type === 'tank' && e.st === 'aim') { ctx.globalAlpha = .5 + .4 * Math.sin(now * 25); ctx.strokeStyle = '#ff3d5a'; ctx.lineWidth = e.r * 1.6; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.ang) * 420, e.y + Math.sin(e.ang) * 420); ctx.globalAlpha = .18; ctx.stroke(); ctx.globalAlpha = .7; ctx.lineWidth = 2; ctx.stroke(); }
    if (e.type === 'sniper' && (e.st === 'aim' || e.st === 'lock')) {
      const lock = e.st === 'lock'; ctx.globalAlpha = lock ? (Math.sin(now * 60) > 0 ? 1 : .3) : .55; ctx.strokeStyle = '#ff3d5a'; ctx.lineWidth = lock ? 3 : 1.5;
      ctx.beginPath(); ctx.moveTo(e.x + Math.cos(e.ang) * 36, e.y + Math.sin(e.ang) * 36); ctx.lineTo(e.x + Math.cos(e.ang) * 1000, e.y + Math.sin(e.ang) * 1000); ctx.stroke();
      glowAt(ctx, e.x + Math.cos(e.ang) * 38, e.y + Math.sin(e.ang) * 38, 14, '#ff3d5a', .9);
    }
    if (e.type === 'drone' && e.st === 'charge') glowAt(ctx, e.x + Math.cos(e.ang) * 10, e.y + Math.sin(e.ang) * 10, 10 + (.4 - e.stT) * 50, G.B.ebCol, .9);
    if (e.type === 'bomber') glowAt(ctx, e.x - 2, e.y, e.st === 'fuse' ? 50 : 26, '#ff5a1a', e.st === 'fuse' ? .9 : .4 + Math.sin(now * 6 + e.id) * .15);
    const ex = e.x + Math.cos(e.ang) * e.r * .6, ey = e.y + Math.sin(e.ang) * e.r * .6 - (e.z || 0);
    glowAt(ctx, ex, ey, e.r * (e.d.boss ? .9 : .7), G.B.pal.eye, .55);
    if (e.burn > 0) glowAt(ctx, e.x, e.y, e.r * 2, '#ff6a1a', .35);
  }
  // promienie Strażnika
  for (const bm of G.beams) for (const a of bm.angs) {
    const x2 = bm.x + Math.cos(a) * 1100, y2 = bm.y + Math.sin(a) * 1100;
    if (!bm.active) { ctx.globalAlpha = .4 + .3 * Math.sin(now * 30); ctx.strokeStyle = '#7fd8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bm.x, bm.y); ctx.lineTo(x2, y2); ctx.stroke(); continue; }
    ctx.lineCap = 'round';
    for (const [w, col, al] of [[44, '#3ec9ff', .25], [24, '#7fd8ff', .55], [9, '#ffffff', .95]]) { ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = w + Math.sin(now * 40) * 2; ctx.beginPath(); ctx.moveTo(bm.x, bm.y); ctx.lineTo(x2, y2); ctx.stroke(); }
    ctx.lineCap = 'butt';
  }
  // pociski gracza
  for (const b of G.pb) {
    if (!inView(b.x, b.y, 40)) continue;
    const sp = hyp(b.vx, b.vy), tl = Math.min(b.rail ? 90 : 30, sp * .03), ux = b.vx / sp, uy = b.vy / sp;
    ctx.lineCap = 'round';
    const bc = b.tr && b.tr.rainbow ? RAINBOW[(b.ri + (now * 14 | 0)) % RAINBOW.length] : b.color;
    ctx.globalAlpha = .6; ctx.strokeStyle = bc; ctx.lineWidth = b.r * 2.2; ctx.beginPath(); ctx.moveTo(b.x - ux * tl, b.y - uy * tl); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.globalAlpha = 1; ctx.strokeStyle = b.tr && b.tr.dark ? '#2a0a3a' : '#ffffff'; ctx.lineWidth = b.r * .9; ctx.beginPath(); ctx.moveTo(b.x - ux * tl * .6, b.y - uy * tl * .6); ctx.lineTo(b.x, b.y); ctx.stroke();
    glowAt(ctx, b.x, b.y, b.r * 4.5, bc, .7);
  }
  ctx.lineCap = 'butt';
  // pociski wrogów
  for (const b of G.eb) {
    if (!inView(b.x, b.y, 30)) continue;
    glowAt(ctx, b.x, b.y, b.r * 3.6, b.color, .85);
    ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * .55, 0, TAU); ctx.fill();
  }
  // znajdźki – poświata
  for (const k of G.pickups) {
    if (!inView(k.x, k.y, 20)) continue;
    const bob = Math.sin(k.t * 5) * 3;
    if (k.type === 'xp') {
      glowAt(ctx, k.x, k.y - 6 + bob, 16, '#6dffb0', .8);
      ctx.globalAlpha = 1; ctx.fillStyle = '#d8ffe8'; ctx.save(); ctx.translate(k.x, k.y - 6 + bob); ctx.rotate(k.t * 3); ctx.fillRect(-3, -3, 6, 6); ctx.restore();
    } else if (k.type === 'coin') glowAt(ctx, k.x, k.y - 6 + bob, 14, '#ffc93c', .35);
    else if (k.type === 'hp') glowAt(ctx, k.x, k.y - 6 + bob, 26, '#2ed06a', .4);
  }
  // satelity i duchy zrywu
  if (pAlive()) {
    for (let i = 0; i < p.mods.orbs; i++) { const a = p.orbAng + i * TAU / p.mods.orbs, ox = p.x + Math.cos(a) * 72, oy = p.y + Math.sin(a) * 72; glowAt(ctx, ox, oy, 26, '#7fd8ff', .9); glowAt(ctx, ox, oy, 8, '#ffffff', 1); }
    for (const gh of p.ghosts) { ctx.globalAlpha = gh.life * 1.4; drawSpr(ctx, playerSpr(p.look, p.weapons[p.wi]), gh.x, gh.y, gh.a); }
    glowAt(ctx, p.x + Math.cos(p.aim) * 7, p.y + Math.sin(p.aim) * 7, 12, '#3ef0ff', .7);
    if (p.dashCD <= 0) glowAt(ctx, p.x - Math.cos(p.aim) * 15, p.y - Math.sin(p.aim) * 15, 8, '#3ef0ff', .6);
  }
  for (const g of G.grenades) glowAt(ctx, g.x, g.y - g.z - 5, 12, '#ff3d1a', Math.sin(now * 30) > 0 ? 1 : .3);
  // błyskawice
  for (const b of G.bolts) {
    ctx.globalAlpha = b.life / .18; ctx.lineJoin = 'round';
    for (const [w, col] of [[7, '#7a5cff'], [2.5, '#ffffff']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); b.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); }
  }
  // cząsteczki addytywne
  for (const q of G.parts) {
    const a = clamp(q.life / q.max, 0, 1);
    if (q.type === 'spark') { ctx.globalAlpha = a; ctx.strokeStyle = q.color; ctx.lineWidth = q.size; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * .03, q.y - q.vy * .03); ctx.stroke(); }
    else if (q.type === 'dot') glowAt(ctx, q.x, q.y, q.size * (.5 + a * .5) * 2, q.color, a);
    else if (q.type === 'fire') glowAt(ctx, q.x, q.y - q.z, q.size * 1.6, q.color, a * .9);
    else if (q.type === 'implode') { ctx.globalAlpha = a; ctx.strokeStyle = q.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * a, 0, TAU); ctx.stroke(); glowAt(ctx, q.x, q.y, q.size * a * .8, '#6a1aff', a * .6); }
    else if (q.type === 'ring') { ctx.globalAlpha = a; ctx.strokeStyle = q.color; ctx.lineWidth = 6 * a + 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.4 - a * .9), 0, TAU); ctx.stroke(); }
  }
  ctx.lineCap = 'butt';
  // atmosfera
  for (const a of G.amb) {
    const al = Math.min(1, a.life) * (.5 + .5 * Math.sin(a.ph * 2));
    if (G.bi === 0) glowAt(ctx, a.x, a.y, 9, a.ph % 2 > 1 ? '#c8ff6a' : '#6dffd8', al * .9);
    else if (G.bi === 1) glowAt(ctx, a.x, a.y, 5, '#ffa040', al);
  }
  for (const o of [G.player, ...G.remotes.values()]) if (o && !o.dead && o.pet && o.cos && COS[o.cos.pet] && o.cos.pet !== 'pe_none') glowAt(ctx, o.pet.x, o.pet.y - 6, 22, COS[o.cos.pet].col || '#ffffff', .35);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  for (const q of G.parts) if (q.type === 'shape') drawShapeParticle(ctx, q, clamp(q.life / q.max * 1.5, 0, 1));
  ctx.globalAlpha = 1;
  if (G.bi === 2) { ctx.fillStyle = '#ffffff'; for (const a of G.amb) { ctx.globalAlpha = Math.min(1, a.life) * .7; ctx.beginPath(); ctx.arc(a.x, a.y, 1.6 + (a.ph % 1.5), 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  // paski życia wrogów i liczby
  for (const e of G.enemies) if (e.hb > 0 && !e.d.boss && inView(e.x, e.y, 40)) {
    const w = Math.max(30, e.r * 2), x = e.x - w / 2, y = e.y - e.r - 14;
    ctx.globalAlpha = Math.min(1, e.hb * 2); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = '#ff4d6d'; ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }
  ctx.globalAlpha = 1;
  if (p && p.reloadT > 0 && G.over !== 'lose') {
    const k = 1 - p.reloadT / curW(p).reload; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#ffb627'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 30, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
  }
  for (const r of G.remotes.values()) if (!r.dead && inView(r.x, r.y, 60)) {
    const enemy = G.mode === 'pvp', w = 44, x = r.x - w / 2, y = r.y - 40;
    ctext(r.nick || 'Player', r.x, y - 10, 12, enemy ? '#ffb0bd' : '#bfffd0', 'center', FU);
    if (r.cos && COS[r.cos.title]) ctext(COS[r.cos.title].name, r.x, y - 23, 9, RAR[COS[r.cos.title].r].col, 'center', FU);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 1, y - 1, w + 2, 7);
    ctx.fillStyle = enemy ? '#ff4d6d' : '#7dff8a'; ctx.fillRect(x, y, w * clamp(r.hp / (r.maxHp || 100), 0, 1), 5);
  }
  if (G.mode !== 'mission' && G.mode !== 'demo' && pAlive() && G.net) { ctext(nick(), G.player.x, G.player.y - 50, 12, '#bfefff', 'center', FU); const tt = COS[G.player.cos.title]; if (tt) ctext(tt.name, G.player.x, G.player.y - 63, 9, RAR[tt.r].col, 'center', FU); }
  for (const q of G.pops) { ctx.globalAlpha = clamp(q.life * 2.5, 0, 1); ctext(q.text, q.x, q.y, q.size * (q.life > .6 ? 1 + (q.life - .6) * 3 : 1), q.color); }
  ctx.globalAlpha = 1;
  // ===== ekran =====
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.drawImage(VIG, 0, 0, W, H);
  if (G.hurtV > 0) { ctx.globalAlpha = G.hurtV; ctx.drawImage(VIGR, 0, 0, W, H); ctx.globalAlpha = 1; }
  if (p && p.hp < p.maxHp * .3 && G.over !== 'lose') { ctx.globalAlpha = .25 + .2 * Math.sin(now * 6); ctx.drawImage(VIGR, 0, 0, W, H); ctx.globalAlpha = 1; }
  if (!G.demo && (state === 'play' || state === 'paused' || state === 'levelup')) drawHUD(now);
}

function drawLighting(v, now) {
  const g = LMC, c = G.cam, s = c.z * LMS, ox = c.x - W / 2 / c.z, oy = c.y - H / 2 / c.z;
  const amb = G.B.ambient, boost = G.demo ? 1.12 : G.mods.has('dark') ? .45 : 1;
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.fillStyle = 'rgb(' + Math.min(255, amb[0] * boost | 0) + ',' + Math.min(255, amb[1] * boost | 0) + ',' + Math.min(255, amb[2] * boost | 0) + ')';
  g.fillRect(0, 0, LM.width, LM.height);
  g.globalCompositeOperation = 'lighter';
  const L = (x, y, r, col, a) => {
    const X = (x - ox) * s, Y = (y - oy) * s, R = r * s;
    if (X + R < 0 || Y + R < 0 || X - R > LM.width || Y - R > LM.height) return;
    g.globalAlpha = clamp(a, 0, 1); g.drawImage(lightSpr(col), X - R, Y - R, R * 2, R * 2);
  };
  for (const l of G.lights) L(l.x, l.y, l.r * (1 + Math.sin(now * 2.2 + l.f) * .06), l.c, l.a);
  const p = G.player;
  if (pAlive()) {
    L(p.x, p.y, 300, '#c8d8ff', .75);
    g.globalAlpha = .9; g.save(); g.translate((p.x - ox) * s, (p.y - oy) * s); g.rotate(p.aim); g.drawImage(CONE, 0, -128 * s * 2.4, 256 * s * 2.4, 256 * s * 2.4); g.restore();
  }
  if (G.demo) { L(c.x, c.y, 700, '#a0b0d0', .5); }
  for (const r of G.remotes.values()) if (!r.dead) L(r.x, r.y, 260, '#c8d8ff', .6);
  for (const t of G.turrets) L(t.x, t.y, 120, '#ffb627', .4);
  for (const f of G.fields) L(f.x, f.y, f.r * 1.6, '#8dff6a', .45 * Math.min(1, f.life));
  for (const f of G.flashes) L(f.x, f.y, f.r, f.c, f.life / f.max);
  for (const b of G.pb) L(b.x, b.y, 70, b.color, .5);
  for (const b of G.eb) L(b.x, b.y, 60, b.color, .55);
  for (const po of G.portals) L(po.x, po.y, po.boss ? 300 : 140, G.B.accent, .9);
  for (const k of G.pickups) if (k.type === 'xp') L(k.x, k.y, 40, '#6dffb0', .4);
  for (const q of G.parts) if (q.type === 'fire') L(q.x, q.y, q.size * 4, '#ff8a3d', .4 * q.life / q.max);
  for (const bm of G.beams) if (bm.active) for (const a of bm.angs) for (let d = 60; d < 1100; d += 160) L(bm.x + Math.cos(a) * d, bm.y + Math.sin(a) * d, 120, '#7fd8ff', .6);
  for (const e of G.enemies) { L(e.x, e.y, e.r * 3, G.B.pal.eye, .25); if (e.burn > 0) L(e.x, e.y, 90, '#ff6a1a', .5); }
  if (G.bi === 0) for (const a of G.amb) L(a.x, a.y, 40, '#9affd0', .35);
  for (const h of G.hazards) if (h.temp !== undefined) L(h.x, h.y, h.r * 3, '#ff6a1a', Math.min(1, h.temp) * .8);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.drawImage(LM, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const z = c.z, sx = 0, sy = 0;
  ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (W / 2 + sx) - c.x * DPR * z, DPR * (H / 2 + sy) - c.y * DPR * z);
}

function drawPlayer(p, now) {
  const spr = playerSpr(p.look, p.weapons[p.wi]);
  // stopy
  const sw = Math.sin(p.walk) * (p.moving ? 7 : 0), fa = p.moving ? Math.atan2(p.vy, p.vx) : p.aim;
  const px = Math.cos(fa + 1.57), py = Math.sin(fa + 1.57), fx = Math.cos(fa), fy = Math.sin(fa);
  ctx.fillStyle = '#1a2130';
  for (const s of [-1, 1]) { ell(ctx, p.x + px * 7 * s + fx * sw * s, p.y + py * 7 * s + fy * sw * s, 6, 4.5, fa); ctx.fill(); }
  const kick = p.kick * 4;
  const blink = p.inv > 0 && Math.sin(now * 40) > 0 && G.over !== 'win';
  ctx.globalAlpha = blink ? .5 : 1;
  drawSpr(ctx, spr, p.x - Math.cos(p.aim) * kick, p.y - Math.sin(p.aim) * kick, p.aim);
  ctx.globalAlpha = 1;
}
function drawEnemy(e, now) {
  const spr = G.spr[e.type];
  let x = e.x, y = e.y - (e.z || 0), sc = 1 + (e.z || 0) / 260;
  if (e.d.hover) y -= 6 + Math.sin(now * 4 + e.id) * 3;
  if (e.type === 'bomber') sc *= 1 + Math.sin(now * (e.st === 'fuse' ? 40 : 8)) * (e.st === 'fuse' ? .15 : .06);
  if (e.type === 'tank' && e.st === 'stun') { ctx.fillStyle = '#ffe14d'; for (let i = 0; i < 3; i++) { const a = now * 5 + i * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 22, y - 30 + Math.sin(a) * 6, 3, 0, TAU); ctx.fill(); } }
  // nogi
  if (e.type === 'crawler' || e.type === 'tank' || e.type === 'queen' || e.type === 'bomber') {
    const n = e.type === 'bomber' ? 2 : 3, L = e.r * (e.type === 'bomber' ? .9 : 1.15), ca = Math.cos(e.ang), sa = Math.sin(e.ang);
    ctx.strokeStyle = e.type === 'queen' ? '#1a2a10' : G.B.pal.dark; ctx.lineWidth = e.r * .14 + 1.2; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
      const off = (i - (n - 1) / 2) * e.r * .5, sw = Math.sin(e.walk + i * 2 + (s > 0 ? Math.PI : 0)) * e.r * .25;
      const bx = x + ca * off, by = y + sa * off, kx = bx - sa * s * L * .7 + ca * (sw + e.r * .15), ky = by + ca * s * L * .7 + sa * (sw + e.r * .15);
      const tx = bx - sa * s * L * 1.1 + ca * sw * 1.4, ty = by + ca * s * L * 1.1 + sa * sw * 1.4;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(kx, ky); ctx.lineTo(tx, ty); ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  drawSpr(ctx, spr, x, y, e.ang, sc);
  if (e.type === 'drone') { ctx.globalAlpha = .35; ctx.fillStyle = '#d8e4f0'; const ca = Math.cos(e.ang), sa = Math.sin(e.ang); for (const [a, b] of [[-13, -13], [13, -13], [-13, 13], [13, 13]]) { ell(ctx, x + a * ca - b * sa, y + a * sa + b * ca, 8, 8); ctx.fill(); } ctx.globalAlpha = 1; }
  if (e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .75; drawSpr(ctx, spr, x, y, e.ang, sc); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
}
function drawRemote(r, now) {
  const spr = playerSpr(r.look || r.hero || 'assault', r.wid || 'blaster');
  const fa = r.moving ? Math.atan2(r.vy, r.vx) : r.aim, sw = Math.sin(r.walk) * (r.moving ? 7 : 0);
  const px = Math.cos(fa + 1.57), py = Math.sin(fa + 1.57), fx = Math.cos(fa), fy = Math.sin(fa);
  ctx.fillStyle = '#1a2130';
  for (const s of [-1, 1]) { ell(ctx, r.x + px * 7 * s + fx * sw * s, r.y + py * 7 * s + fy * sw * s, 6, 4.5, fa); ctx.fill(); }
  ctx.globalAlpha = r.inv > 0 && Math.sin(now * 40) > 0 ? .5 : 1;
  drawSpr(ctx, spr, r.x, r.y, r.aim);
  ctx.globalAlpha = 1;
  if (G.mode === 'pvp') { ctx.strokeStyle = 'rgba(255,77,109,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x, r.y + 6, 24, 12, 0, 0, TAU); ctx.stroke(); }
  else { ctx.strokeStyle = 'rgba(125,255,138,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x, r.y + 6, 24, 12, 0, 0, TAU); ctx.stroke(); }
}
