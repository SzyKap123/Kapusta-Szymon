'use strict';
// ================= Stan gry =================
let G = null, eid = 0;
const SPR_CACHE = {};
function getSprites(bi) { return SPR_CACHE[bi] || (SPR_CACHE[bi] = buildSprites(bi)); }

function newGame(li, demo) {
  const L = LEVELS[li], bi = L.biome, map = genMap(bi);
  G = {
    L, li, bi, B: BIOMES[bi], demo: !!demo, t: 0, spr: getSprites(bi),
    ground: map.ground, gctx: map.ground.getContext('2d'), props: map.props, hazards: map.hazards, lights: map.lights,
    enemies: [], pb: [], eb: [], parts: [], pops: [], pickups: [], portals: [], grenades: [], flashes: [], bolts: [], teles: [], beams: [], amb: [],
    waves: demo ? [] : buildWaves(li, L.boss), wave: -1, queue: [], spawnT: 0, waveDelay: 1.2, banner: null, boss: null,
    kills: 0, coins: 0, over: null, overT: 0, slow: 1, shake: 0, hurtV: 0,
    hpMul: 1 + li * .22, dmgMul: 1 + li * .12, cap: 18 + li * 2,
    cam: { x: WW / 2, y: WH / 2, z: 1 }
  };
  if (!demo) G.player = makePlayer(); else G.player = null;
  G.cam.x = WW / 2; G.cam.y = WH / 2;
  return G;
}
function makePlayer() {
  const up = save.upg;
  const p = {
    x: WW / 2, y: WH / 2, vx: 0, vy: 0, r: 18, hp: 100 + up.hp * 20, maxHp: 100 + up.hp * 20, hpShow: 100 + up.hp * 20,
    aim: 0, walk: 0, moving: false, weapons: WEAPON_KEYS.filter(k => save.weapons.includes(k)), wi: 0, ammo: {}, reloadT: 0, fireCD: 0,
    dashCD: 0, dashT: 0, dashDir: 0, inv: 1.2, grenades: 2 + up.gren, xp: 0, lvl: 1, xpNext: 12, kick: 0, firing: false, ghostT: 0, ghosts: [],
    mods: { dmg: 1, rate: 1, multi: 0, pierce: 0, bounce: 0, vamp: 0, speed: 1, orbs: 0, burn: 0, chain: 0, crit: .05, boom: 0, magnet: 1 },
    perkLv: {}, orbAng: 0, lavaT: 0, regen: 0
  };
  p.wi = Math.max(0, p.weapons.length - 1);
  for (const k of p.weapons) p.ammo[k] = WEAPONS[k].mag;
  return p;
}
const curW = p => WEAPONS[p.weapons[p.wi]];
const dmgScale = () => G.player.mods.dmg * (1 + .1 * save.upg.dmg);

// ================= Cząsteczki =================
function part(o) {
  const cap = save.settings.quality === 'high' ? 700 : 250;
  if (G.parts.length > cap) G.parts.shift();
  G.parts.push(Object.assign({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: .5, max: .5, size: 3, color: '#ffffff', type: 'dot', grav: 0, drag: 3, rot: 0, vr: 0, grow: 0 }, o, { max: o.life || .5 }));
}
function sparks(x, y, color, n, spd, ang, spread) {
  for (let i = 0; i < n; i++) {
    const a = ang === undefined ? rand(0, TAU) : ang + rand(-spread, spread), s = rand(spd * .3, spd);
    part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.15, .4), size: rand(1.5, 3), color, type: 'spark', drag: 4 });
  }
}
function gibs(x, y, colors, n, spd) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(spd * .3, spd);
    part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(80, 260), z: 2, grav: 700, life: rand(.5, 1.1), size: rand(2.5, 6), color: pick(colors), type: 'chunk', drag: 1.5, rot: rand(0, TAU), vr: rand(-12, 12) });
  }
}
function smoke(x, y, n, col, size) {
  for (let i = 0; i < n; i++) part({ x: x + rand(-10, 10), y: y + rand(-10, 10), vx: rand(-40, 40), vy: rand(-50, 10), life: rand(.6, 1.3), size: rand(size * .6, size), color: col || '#3a3a44', type: 'smoke', drag: 1.5, grow: rand(20, 50) });
}
function decal(x, y, kind, color, size) {
  const g = G.gctx;
  if (kind === 'scorch') {
    g.globalAlpha = .55; g.drawImage(SHADOW, x - size, y - size * .8, size * 2, size * 1.6);
    g.globalAlpha = .35; g.fillStyle = '#000'; for (let i = 0; i < 8; i++) { const a = rand(0, TAU), d = rand(size * .3, size); g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, rand(2, 6), 0, TAU); g.fill(); }
  } else {
    g.globalAlpha = .55; g.fillStyle = color;
    for (let i = 0; i < 9; i++) { const a = rand(0, TAU), d = rand(0, size); g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, rand(2, size * .45), 0, TAU); g.fill(); }
  }
  g.globalAlpha = 1;
}
function pop(x, y, text, color, size) { G.pops.push({ x: x + rand(-8, 8), y, text, color: color || '#fff', size: size || 15, life: .7, vy: -70 }); }
function flash(x, y, r, color, life) { G.flashes.push({ x, y, r, c: color, life, max: life }); }

// ================= Kolizje =================
function pushOut(e, p) {
  if (p.shape === 'c') {
    const dx = e.x - p.x, dy = e.y - p.y, d = hyp(dx, dy), m = e.r + p.r;
    if (d < m) { if (d < .01) { e.x += m; return true; } e.x = p.x + dx / d * m; e.y = p.y + dy / d * m; return true; }
    return false;
  }
  const hx = p.w / 2, hy = p.h / 2, nx = clamp(e.x, p.x - hx, p.x + hx), ny = clamp(e.y, p.y - hy, p.y + hy);
  const dx = e.x - nx, dy = e.y - ny, d2 = dx * dx + dy * dy;
  if (d2 >= e.r * e.r) return false;
  if (d2 < 1e-4) {
    const ox = hx + e.r - Math.abs(e.x - p.x), oy = hy + e.r - Math.abs(e.y - p.y);
    if (ox < oy) e.x += e.x > p.x ? ox : -ox; else e.y += e.y > p.y ? oy : -oy;
  } else { const d = Math.sqrt(d2); e.x += dx / d * (e.r - d); e.y += dy / d * (e.r - d); }
  return true;
}
function collideWorld(e) {
  let hit = false;
  for (const p of G.props) { if (Math.abs(p.x - e.x) > p.br + e.r + 2 || Math.abs(p.y - e.y) > p.br + e.r + 2) continue; if (pushOut(e, p)) hit = true; }
  const ox = e.x, oy = e.y;
  e.x = clamp(e.x, M + e.r, WW - M - e.r); e.y = clamp(e.y, M + e.r, WH - M - e.r);
  return hit || ox !== e.x || oy !== e.y;
}
function propAt(x, y, pad) {
  for (const p of G.props) {
    if (p.shape === 'c') { if (hyp(x - p.x, y - p.y) < p.r + pad) return p; }
    else if (Math.abs(x - p.x) < p.w / 2 + pad && Math.abs(y - p.y) < p.h / 2 + pad) return p;
  }
  return null;
}
function propNormal(p, x, y) {
  if (p.shape === 'c') { const d = hyp(x - p.x, y - p.y) || 1; return [(x - p.x) / d, (y - p.y) / d]; }
  const dx = (x - p.x) / (p.w / 2), dy = (y - p.y) / (p.h / 2);
  return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
}
function los(ax, ay, bx, by) {
  const d = hyp(bx - ax, by - ay), n = Math.ceil(d / 22);
  for (let i = 1; i < n; i++) { const t = i / n; if (propAt(ax + (bx - ax) * t, ay + (by - ay) * t, 0)) return false; }
  return true;
}
function freeSpot(x, y, r) { return x > M + r && y > M + r && x < WW - M - r && y < WH - M - r && !propAt(x, y, r + 6); }

// ================= Gracz =================
function playerShoot(p) {
  const id = p.weapons[p.wi], w = WEAPONS[id];
  if (p.reloadT > 0 || p.fireCD > 0) return;
  if (p.ammo[id] <= 0) { startReload(p); return; }
  p.ammo[id]--; p.fireCD = 1 / (w.rate * p.mods.rate);
  const multi = p.mods.multi, n = w.pellets + multi * (w.pellets > 1 ? 2 : 1);
  const fan = w.pellets > 1 ? w.spread + multi * .08 : .13 * (n - 1);
  const mx = p.x + Math.cos(p.aim) * 32 + Math.cos(p.aim + 1.57) * 5, my = p.y + Math.sin(p.aim) * 32 + Math.sin(p.aim + 1.57) * 5;
  const dm = w.dmg * dmgScale();
  for (let i = 0; i < n; i++) {
    const a = p.aim + (n > 1 ? -fan / 2 + fan * i / (n - 1) : 0) + rand(-w.spread / 2, w.spread / 2) * (w.pellets > 1 ? .35 : 1);
    const sp = w.spd * rand(.95, 1.05);
    G.pb.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (w.range || 750) / sp, dmg: dm, r: w.r, color: w.color,
      pierce: (w.pierce || 0) + p.mods.pierce, bounce: p.mods.bounce, explode: w.explode || 0, hit: new Set(), rail: id === 'rail', rocket: id === 'rocket' });
  }
  p.kick = 1;
  flash(mx, my, 70, w.color, .07);
  part({ x: mx, y: my, life: .07, size: 18, color: w.color, type: 'dot' });
  part({ x: p.x, y: p.y, vx: Math.cos(p.aim + 1.9) * rand(80, 140), vy: Math.sin(p.aim + 1.9) * rand(80, 140), vz: 120, z: 8, grav: 600, life: .6, size: 2.5, color: '#e8c060', type: 'chunk', drag: 3, rot: rand(0, 3), vr: 15 });
  if (id === 'shotgun' || id === 'rocket') G.shake = Math.max(G.shake, 4);
  if (id === 'rail') G.shake = Math.max(G.shake, 3);
  sfx(id);
  if (p.ammo[id] <= 0) startReload(p);
}
function startReload(p) { const w = curW(p); if (p.reloadT > 0 || p.ammo[p.weapons[p.wi]] >= w.mag) return; p.reloadT = w.reload; sfx('empty'); }
function swapWeapon() { const p = G.player; if (!p || p.weapons.length < 2) return; p.wi = (p.wi + 1) % p.weapons.length; p.reloadT = 0; p.fireCD = .15; if (p.ammo[p.weapons[p.wi]] <= 0) startReload(p); sfx('click'); }
function doDash() {
  const p = G.player; if (!p || p.dashCD > 0 || G.over) return;
  p.dashDir = p.moving ? Math.atan2(p.vy, p.vx) : p.aim;
  p.dashT = .2; p.inv = Math.max(p.inv, .3); p.dashCD = 2.2 * (1 - .12 * save.upg.dash);
  smoke(p.x, p.y, 4, '#8aa0c0', 14); sfx('dash');
}
function throwGrenade() {
  const p = G.player; if (!p || p.grenades <= 0 || G.over) return;
  p.grenades--;
  let tx = p.x + Math.cos(p.aim) * 300, ty = p.y + Math.sin(p.aim) * 300, best = 480;
  for (const e of G.enemies) { const d = hyp(e.x - p.x, e.y - p.y); if (d < best && Math.abs(angDiff(p.aim, Math.atan2(e.y - p.y, e.x - p.x))) < .8) { best = d; tx = e.x; ty = e.y; } }
  tx = clamp(tx, M + 10, WW - M - 10); ty = clamp(ty, M + 10, WH - M - 10);
  G.grenades.push({ x0: p.x, y0: p.y, x1: tx, y1: ty, t: 0, dur: .65, x: p.x, y: p.y, z: 0 });
  sfx('click');
}
function hurtPlayer(dmg, raw) {
  const p = G.player; if (!p || G.over === 'lose') return;
  if (!raw && (p.inv > 0 || p.dashT > 0)) return;
  p.hp -= dmg; G.hurtV = Math.min(1, G.hurtV + (raw ? .15 : .7));
  if (!raw) { p.inv = .55; G.shake = Math.max(G.shake, 7); sfx('hurt'); pop(p.x, p.y - 30, '-' + Math.round(dmg), '#ff4d6d', 17); }
  if (p.hp <= 0) {
    p.hp = 0; G.over = 'lose'; G.overT = 0; G.slow = .3;
    gibs(p.x, p.y, ['#c9d6e8', '#3ef0ff', '#5b6a84'], 26, 320); flash(p.x, p.y, 300, '#3ef0ff', .5); smoke(p.x, p.y, 10, '#2a3040', 30);
    sfx('lose');
  }
}
function healPlayer(v) { const p = G.player; if (!p) return; const before = p.hp; p.hp = Math.min(p.maxHp, p.hp + v); if (p.hp - before >= 1) pop(p.x, p.y - 34, '+' + Math.round(p.hp - before), '#8dff6a', 15); }
function addXp(v) {
  const p = G.player; p.xp += v;
  while (p.xp >= p.xpNext) { p.xp -= p.xpNext; p.lvl++; p.xpNext = Math.round(p.xpNext * 1.22 + 5); G.pendingLvl = (G.pendingLvl || 0) + 1; }
}
function applyPerk(id) {
  const p = G.player, m = p.mods;
  p.perkLv[id] = (p.perkLv[id] || 0) + 1;
  switch (id) {
    case 'dmg': m.dmg += .2; break; case 'rate': m.rate += .15; break; case 'multi': m.multi++; break;
    case 'pierce': m.pierce++; break; case 'bounce': m.bounce++; break; case 'vamp': m.vamp += 2; break;
    case 'hp': p.maxHp += 30; p.hp = Math.min(p.maxHp, p.hp + 30); break; case 'speed': m.speed += .12; break;
    case 'orb': m.orbs++; break; case 'burn': m.burn++; break; case 'chain': m.chain++; break; case 'crit': m.crit += .15; break;
    case 'boom': m.boom++; break; case 'magnet': m.magnet += .4; break;
  }
}

// ================= Walka =================
function hitEnemy(e, dmg, o) {
  if (e.dead) return;
  o = o || {};
  const p = G.player;
  let crit = false;
  if (!o.noProc && p && Math.random() < p.mods.crit) { dmg *= 2; crit = true; }
  e.hp -= dmg; e.flash = .09; e.hb = 2.2;
  if (o.kx) { const k = e.d.boss ? .1 : e.type === 'tank' ? .35 : 1; e.kx += o.kx * k; e.ky += o.ky * k; }
  pop(e.x, e.y - e.r - 8, Math.round(dmg) + (crit ? '!' : ''), crit ? '#ffe14d' : (o.color || '#ffffff'), crit ? 20 : 14);
  if (!o.noProc && p) {
    if (p.mods.burn) { e.burn = 2.5; e.burnLv = p.mods.burn; }
    if (p.mods.chain && Math.random() < .14 + .1 * p.mods.chain) chainFrom(e, dmg * .6);
  }
  if (e.hp <= 0) killEnemy(e);
  else sfx('hit');
}
function chainFrom(e, dmg) {
  let cur = e; const hit = new Set([e.id]);
  for (let j = 0; j < 1 + G.player.mods.chain; j++) {
    let best = null, bd = 230;
    for (const o of G.enemies) { if (o.dead || hit.has(o.id)) continue; const d = hyp(o.x - cur.x, o.y - cur.y); if (d < bd) { bd = d; best = o; } }
    if (!best) break;
    const pts = [[cur.x, cur.y]];
    for (let k = 1; k < 6; k++) { const t = k / 6; pts.push([lerp(cur.x, best.x, t) + rand(-14, 14), lerp(cur.y, best.y, t) + rand(-14, 14)]); }
    pts.push([best.x, best.y]);
    G.bolts.push({ pts, life: .18 });
    flash(best.x, best.y, 90, '#b9a6ff', .15);
    hit.add(best.id); hitEnemy(best, dmg, { noProc: true, color: '#d6ccff' }); cur = best;
  }
}
function killEnemy(e) {
  if (e.dead) return;
  e.dead = true; G.kills++;
  const pal = G.B.pal, big = e.d.boss;
  const cols = G.bi === 2 ? ['#cfdcec', '#4a5b74', '#3ec9ff', '#20262f'] : G.bi === 1 ? ['#4a2d28', '#ff7a2e', '#1a0d0b', '#ffd23c'] : [pal.main, pal.dark, pal.light, pal.acc];
  gibs(e.x, e.y, cols, big ? 60 : 10 + e.r * .4, big ? 500 : 260);
  sparks(e.x, e.y, G.B.accent, big ? 40 : 8, big ? 600 : 300);
  flash(e.x, e.y, e.r * 6, G.B.accent, .2);
  decal(e.x, e.y, G.bi === 2 ? 'scorch' : 'splat', G.bi === 0 ? '#2a4a10' : '#1a0d0b', e.r * 1.4);
  sfx('kill');
  const p = G.player;
  if (p) {
    const nx = Math.min(5, e.d.xp);
    for (let i = 0; i < nx; i++) dropPickup('xp', e.x, e.y, e.d.xp / nx);
    if (Math.random() < .38 || big) for (let i = 0; i < (big ? 25 : ri(1, 2)); i++) dropPickup('coin', e.x, e.y, 2 + Math.floor(G.li / 2));
    if (Math.random() < .035) dropPickup('hp', e.x, e.y, 25);
    if (Math.random() < .025) dropPickup('gren', e.x, e.y, 1);
    if (p.mods.vamp) healPlayer(p.mods.vamp);
    if (p.mods.boom && !big) explode(e.x, e.y, 60 + 15 * p.mods.boom, 18 * p.mods.boom * dmgScale(), 'player', G.B.accent, true);
  }
  if (e.type === 'bomber' && !e.blew) explode(e.x, e.y, 70, 28, 'player', '#ff8a3d');
  if (big) { G.boss = null; G.bossDeath = { x: e.x, y: e.y, t: 0 }; G.slow = .35; music.intense = 0; }
}
function explode(x, y, R, dmg, src, col, small) {
  col = col || '#ff8a3d';
  if (src !== 'enemy') for (const e of G.enemies) {
    if (e.dead) continue;
    const d = hyp(e.x - x, e.y - y);
    if (d < R + e.r) { const a = Math.atan2(e.y - y, e.x - x); hitEnemy(e, dmg * (1 - .45 * d / (R + e.r)), { noProc: true, kx: Math.cos(a) * 260, ky: Math.sin(a) * 260, color: '#ffc080' }); }
  }
  const p = G.player;
  if (src !== 'player' && p && !G.over) { const d = hyp(p.x - x, p.y - y); if (d < R + p.r) hurtPlayer(dmg * (1 - .4 * d / (R + p.r))); }
  for (const b of G.props) if (b.kind === 'barrel' && !b.fuse && hyp(b.x - x, b.y - y) < R + 17) b.fuse = .12;
  flash(x, y, R * 3.4, '#ffb060', small ? .2 : .35);
  part({ x, y, life: .22, size: R * 1.5, color: '#fff0c0', type: 'dot' });
  const nf = small ? 6 : 12;
  for (let i = 0; i < nf; i++) { const a = rand(0, TAU), s = rand(R * .8, R * 2.2); part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.25, .5), size: rand(R * .25, R * .5), color: pick([col, '#ffb000', '#ff5a00']), type: 'fire', drag: 5, grow: -20 }); }
  sparks(x, y, '#ffd28a', small ? 8 : 18, R * 6);
  smoke(x, y, small ? 4 : 9, '#2c2622', R * .7);
  gibs(x, y, ['#3a2a22', '#1a1412', '#5a4a3a'], small ? 4 : 8, 300);
  part({ x, y, life: .35, size: R, color: '#ffe0a0', type: 'ring' });
  decal(x, y, 'scorch', '#000', R * .8);
  G.shake = Math.max(G.shake, small ? 4 : R / 9);
  sfx('boom');
}
function dropPickup(type, x, y, v) {
  const a = rand(0, TAU), s = rand(60, 200);
  G.pickups.push({ type, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, v, t: rand(0, 6), pull: false, life: type === 'xp' || type === 'coin' ? 40 : 25 });
}

// ================= Fale i portale =================
function openPortal(type, x, y, boss) {
  if (x === undefined) {
    const p = G.player;
    for (let k = 0; k < 40; k++) {
      const a = rand(0, TAU), d = rand(380, 680); x = clamp(p.x + Math.cos(a) * d, M + 60, WW - M - 60); y = clamp(p.y + Math.sin(a) * d, M + 60, WH - M - 60);
      if (freeSpot(x, y, 36) && hyp(x - p.x, y - p.y) > 300) break;
    }
  }
  G.portals.push({ type, x, y, t: 0, dur: boss ? 2.2 : .9, boss: !!boss });
  sfx('portal');
}
function mkEnemy(type, x, y) {
  const d = EDEF[type], hp = d.hp * (d.boss ? 1 + G.li * .04 : G.hpMul);
  const p = G.player;
  return { id: ++eid, type, d, x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: d.r, hp, maxHp: hp, ang: p ? Math.atan2(p.y - y, p.x - x) : 0, t: 0, walk: rand(0, 6),
    flash: 0, cd: rand(1.2, 2.2), st: 'move', stT: 0, touchCD: 0, burn: 0, burnT: 0, burnLv: 0, orbCD: 0, hb: 0, strafe: Math.random() < .5 ? 1 : -1, strafeT: rand(1, 3),
    pi: -1, pat: null, patT: 0, el: 0, z: 0, spin: 0, dead: false };
}
function updateWaves(dt) {
  if (G.over || G.demo) return;
  if (G.bossDeath) {
    const b = G.bossDeath; b.t += dt / G.slow;
    if (b.t < 1.4 && Math.random() < dt * 14) explode(b.x + rand(-60, 60), b.y + rand(-60, 60), rand(50, 90), 0, 'world', '#ffb000', true);
    if (b.t >= 1.6) { G.bossDeath = null; G.slow = 1; win(); }
    return;
  }
  const alive = G.enemies.length + G.portals.length;
  if (G.queue.length) {
    G.spawnT -= dt;
    if (G.spawnT <= 0 && G.enemies.length < G.cap) { openPortal(G.queue.shift()); G.spawnT = rand(.35, .8); }
    return;
  }
  if (alive > 0 || G.boss) return;
  G.waveDelay -= dt;
  if (G.waveDelay > 0) return;
  G.wave++;
  if (G.wave < G.waves.length) {
    G.queue = shuffle(G.waves[G.wave].slice()); G.spawnT = .8; G.waveDelay = 1.6;
    G.banner = { title: 'Fala ' + (G.wave + 1) + ' / ' + G.waves.length, sub: G.queue.length + ' wrogów nadciąga', t: 2.2, max: 2.2 };
  } else if (G.L.boss && !G.bossSpawned) {
    G.bossSpawned = true;
    const type = BOSS_OF[G.bi], p = G.player;
    let x = WW / 2, y = WH / 2; const a = Math.atan2(WH / 2 - p.y, WW / 2 - p.x);
    for (let k = 0; k < 30; k++) { x = clamp(p.x + Math.cos(a + rand(-1, 1)) * 420, M + 90, WW - M - 90); y = clamp(p.y + Math.sin(a + rand(-1, 1)) * 420, M + 90, WH - M - 90); if (freeSpot(x, y, 70)) break; }
    openPortal(type, x, y, true);
    G.banner = { title: EDEF[type].name, sub: 'Boss nadchodzi', t: 3, max: 3, boss: true };
    sfx('roar'); G.shake = 10; music.intense = 1;
  } else win();
}
function win() {
  if (G.over) return;
  G.over = 'win'; G.overT = 0; sfx('win');
  for (const k of G.pickups) k.pull = true;
}
