'use strict';
// ================= Wrogowie =================
function fireEB(x, y, a, spd, dmg, r, color, life) {
  G.eb.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg, r: r || 7, color: color || G.B.ebCol, life: life || 4 });
}
function fireFan(x, y, a0, n, step, spd, dmg, r, color, fromNet) {
  for (let i = 0; i < n; i++) fireEB(x, y, a0 + (i - (n - 1) / 2) * step, spd, dmg, r, color);
  if (!fromNet && G.net && G.net.host) G.net.event(['e', Math.round(x), Math.round(y), +a0.toFixed(3), n, +step.toFixed(4), spd, Math.round(dmg), r, color]);
  if (!fromNet) sfx('eshot');
}
function steerVec(e, ax, ay) {
  // omijanie przeszkód i rozpychanie
  let dx = ax, dy = ay;
  for (const p of G.props) {
    if (Math.abs(p.x - e.x) > p.br + e.r + 50 || Math.abs(p.y - e.y) > p.br + e.r + 50) continue;
    let nx, ny, d;
    if (p.shape === 'c') { nx = e.x - p.x; ny = e.y - p.y; d = hyp(nx, ny) - p.r; }
    else { const cx = clamp(e.x, p.x - p.w / 2, p.x + p.w / 2), cy = clamp(e.y, p.y - p.h / 2, p.y + p.h / 2); nx = e.x - cx; ny = e.y - cy; d = hyp(nx, ny); }
    const L = hyp(nx, ny) || 1; nx /= L; ny /= L;
    const lim = e.r + 42;
    if (d < lim) {
      const s = (lim - d) / lim;
      let tx = -ny, ty = nx; if (tx * ax + ty * ay < 0) { tx = -tx; ty = -ty; }
      dx += nx * s * 1.2 + tx * s * 1.4; dy += ny * s * 1.2 + ty * s * 1.4;
    }
  }
  const L = hyp(dx, dy) || 1;
  return [dx / L, dy / L];
}
function updateEnemies(dt) {
  const me = G.player;
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.t += dt; e.flash -= dt; e.hb -= dt; e.touchCD -= dt; e.orbCD -= dt; e.strafeT -= dt;
    if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = rand(1, 3); }
    if (e.burn > 0) {
      e.burn -= dt; e.burnT -= dt;
      if (Math.random() < dt * 20) part({ x: e.x + rand(-e.r, e.r) * .6, y: e.y + rand(-e.r, e.r) * .6, vy: -60, life: .4, size: rand(5, 10), color: '#ff7a2e', type: 'fire', grow: -10 });
      if (e.burnT <= 0) { e.burnT = .35; hitEnemy(e, 5 * e.burnLv * dmgScale(), { noProc: true, color: '#ffa060' }); if (e.dead) continue; }
    }
    for (const h of G.hazards) if (hyp(h.x - e.x, h.y - e.y) < h.r && !e.d.hover) { e.lavaT = (e.lavaT || 0) - dt; if (e.lavaT <= 0) { e.lavaT = .4; hitEnemy(e, 8, { noProc: true, color: '#ffa060' }); } break; }
    if (e.dead) continue;
    const p = nearestActor(e.x, e.y), alive = !!p && !G.over;
    const tx = alive ? p.x : e.x + Math.cos(e.t) * 50, ty = alive ? p.y : e.y + Math.sin(e.t) * 50;
    const dx = tx - e.x, dy = ty - e.y, dist = hyp(dx, dy) || 1, toA = Math.atan2(dy, dx);
    let wx = 0, wy = 0, spd = e.d.spd * G.spdMul;
    if (e.d.boss) { const r = bossUpdate(e, dt, dist, toA, p); wx = r[0]; wy = r[1]; spd = r[2]; }
    else switch (e.type) {
      case 'crawler': { const a = toA + Math.sin(e.t * 5 + e.id) * .45; wx = Math.cos(a); wy = Math.sin(a); e.ang = a; break; }
      case 'bomber':
        if (e.st === 'fuse') { e.stT -= dt; spd = 0; if (e.stT <= 0) { e.blew = true; e.dead = true; explode(e.x, e.y, 85, e.d.dmg * G.dmgMul, 'enemy', '#ff6a1a'); G.kills++; } }
        else { wx = dx / dist; wy = dy / dist; e.ang = toA; if (alive && dist < 58) { e.st = 'fuse'; e.stT = .45; } }
        break;
      case 'drone': {
        const want = 300;
        let fx = dx / dist, fy = dy / dist;
        if (dist < want - 60) { fx = -fx; fy = -fy; } else if (dist < want + 60) { fx = 0; fy = 0; }
        wx = fx + Math.cos(toA + Math.PI / 2) * e.strafe * .8; wy = fy + Math.sin(toA + Math.PI / 2) * e.strafe * .8;
        e.ang = toA; e.cd -= dt;
        if (e.st === 'charge') { e.stT -= dt; spd *= .3; if (e.stT <= 0) { e.st = 'move'; const n = G.li >= 4 ? 3 : 1; fireFan(e.x + Math.cos(toA) * 14, e.y + Math.sin(toA) * 14, toA, n, .22, 300, e.d.dmg * G.dmgMul, 7, G.B.ebCol); sfx('eshot'); } }
        else if (alive && e.cd <= 0 && dist < 520) { if (los(e.x, e.y, tx, ty)) { e.st = 'charge'; e.stT = .4; e.cd = rand(1.5, 2.3); } else e.cd = .3; }
        break;
      }
      case 'tank':
        e.cd -= dt;
        if (e.st === 'aim') { e.stT -= dt; spd = 0; e.ang = lerp(e.ang, e.ang + angDiff(e.ang, toA), .05); if (e.stT <= 0) { e.st = 'charge'; e.stT = .8; } }
        else if (e.st === 'charge') {
          e.stT -= dt; wx = Math.cos(e.ang); wy = Math.sin(e.ang); spd = 560;
          if (Math.random() < dt * 30) smoke(e.x - wx * 20, e.y - wy * 20, 1, '#5a4a3a', 14);
          if (e.stT <= 0 || e.bonk) { if (e.bonk) { e.st = 'stun'; e.stT = 1; G.shake = Math.max(G.shake, 6); sparks(e.x + wx * 30, e.y + wy * 30, '#ffd28a', 14, 300); } else { e.st = 'move'; e.cd = rand(2.5, 4); } e.bonk = false; }
        } else if (e.st === 'stun') { e.stT -= dt; spd = 0; if (e.stT <= 0) { e.st = 'move'; e.cd = rand(2, 3.5); } }
        else { wx = dx / dist; wy = dy / dist; e.ang = toA; if (alive && e.cd <= 0 && dist < 420 && los(e.x, e.y, tx, ty)) { e.st = 'aim'; e.stT = .75; e.ang = toA; } }
        break;
      case 'sniper': {
        e.cd -= dt;
        if (e.st === 'aim' || e.st === 'lock') {
          e.stT -= dt; spd = 0;
          if (e.st === 'aim') { e.ang += angDiff(e.ang, toA) * Math.min(1, dt * 5); if (e.stT <= 0) { e.st = 'lock'; e.stT = .28; } }
          else if (e.stT <= 0) { e.st = 'move'; e.cd = rand(2.6, 3.6); fireFan(e.x + Math.cos(e.ang) * 36, e.y + Math.sin(e.ang) * 36, e.ang, 1, 0, 980, e.d.dmg * G.dmgMul, 6, '#ff3d5a'); sfx('rail'); flash(e.x, e.y, 90, '#ff3d5a', .1); }
        } else {
          const want = 520;
          let fx = dx / dist, fy = dy / dist; if (dist < want - 80) { fx = -fx; fy = -fy; } else if (dist < want + 80) { fx = 0; fy = 0; }
          wx = fx + Math.cos(toA + 1.57) * e.strafe * .5; wy = fy + Math.sin(toA + 1.57) * e.strafe * .5; e.ang = toA;
          if (alive && e.cd <= 0 && dist < 760) { if (los(e.x, e.y, tx, ty)) { e.st = 'aim'; e.stT = 1.1; } else e.cd = .4; }
        }
        break;
      }
    }
    if (e.dead) continue;
    if (wx || wy) { const s = steerVec(e, wx, wy); wx = s[0]; wy = s[1]; }
    const k = Math.min(1, dt * 7);
    e.vx = lerp(e.vx, wx * spd, k); e.vy = lerp(e.vy, wy * spd, k);
    e.x += (e.vx + e.kx) * dt; e.y += (e.vy + e.ky) * dt;
    const kd = Math.max(0, 1 - dt * 7); e.kx *= kd; e.ky *= kd;
    const ox = e.x, oy = e.y;
    if (!e.jump) { const hit = collideWorld(e); if (hit && e.st === 'charge' && hyp(ox - e.x, oy - e.y) > 1.5) e.bonk = true; }
    if (wx || wy) e.walk += dt * spd * .08;
    if (pAlive() && !G.over && !e.jump && e.touchCD <= 0 && hyp(me.x - e.x, me.y - e.y) < e.r + me.r - 2 && e.type !== 'drone' && e.type !== 'sniper') {
      hurtPlayer((e.st === 'charge' ? e.d.dmg * 1.5 : e.d.dmg) * G.dmgMul); e.touchCD = .7;
    }
    if (alive && p.turret && e.touchCD <= 0 && hyp(p.x - e.x, p.y - e.y) < e.r + p.r) { p.life -= 1.5; e.touchCD = .7; }
  }
  // rozpychanie
  const es = G.enemies;
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
    const a = es[i], b = es[j]; if (a.dead || b.dead) continue;
    const dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r; if (Math.abs(dx) > m || Math.abs(dy) > m) continue;
    const d = hyp(dx, dy); if (d >= m || d < .01) continue;
    const wa = a.d.boss ? .05 : b.d.boss ? .95 : .5, push = (m - d);
    a.x -= dx / d * push * wa; a.y -= dy / d * push * wa; b.x += dx / d * push * (1 - wa); b.y += dy / d * push * (1 - wa);
  }
  G.enemies = es.filter(e => !e.dead);
}

// ================= Bossowie =================
const BOSS_PATS = { queen: ['chase', 'spiral', 'summon', 'leap', 'chase', 'spiral', 'leap'], colossus: ['chase', 'slam', 'burst', 'summon', 'slam', 'burst'], warden: ['beams', 'shards', 'summon', 'nova', 'beams', 'shards'] };
const PAT_DUR = { chase: 2.2, spiral: 3.4, summon: 1.4, leap: 2.2, slam: 3.2, burst: 2.4, beams: 5.2, shards: 2.6, nova: 2.2 };
function tele(x, y, r, dur, done, color) { G.teles.push({ x, y, r, t: 0, dur, done, color: color || '#ff3d5a' }); if (G.net && G.net.host) G.net.event(['T', Math.round(x), Math.round(y), r, +dur.toFixed(2)]); }
function bossUpdate(e, dt, dist, toA, tgt) {
  const p = tgt || { x: e.x + 1, y: e.y, vx: 0, vy: 0 }, me = G.player, enr = e.hp < e.maxHp * .5 ? 1.3 : 1, ldt = dt * enr;
  if (!G.boss) G.boss = e;
  if (!e.pat || e.el >= PAT_DUR[e.pat]) {
    const list = BOSS_PATS[e.type]; e.pi = (e.pi + 1) % list.length; e.pat = list[e.pi]; e.el = 0; e.did = 0; e.cd = 0; e.beams = null;
  }
  const prev = e.el; e.el += ldt; const el = e.el, at = t => prev < t && el >= t;
  const col = G.B.ebCol, dm = e.d.dmg * G.dmgMul;
  let mv = 0, spd = e.d.spd;
  e.ang += angDiff(e.ang, toA) * Math.min(1, dt * 3);
  switch (e.pat) {
    case 'chase': mv = 1; break;
    case 'spiral':
      mv = .15; e.cd -= ldt;
      if (e.cd <= 0) { e.cd = .085; e.spin += .31; fireFan(e.x, e.y, e.spin + TAU / 3, 3, TAU / 3, 210, dm * .45, 8, col); sfx('eshot'); }
      break;
    case 'summon':
      if (at(.2)) { const n = 3 + Math.floor(G.li / 3); const types = e.type === 'queen' ? ['crawler'] : e.type === 'colossus' ? ['bomber', 'crawler'] : ['drone', 'drone', 'sniper'];
        for (let i = 0; i < n; i++) { const a = rand(0, TAU); const x = clamp(e.x + Math.cos(a) * 130, M + 40, WW - M - 40), y = clamp(e.y + Math.sin(a) * 130, M + 40, WH - M - 40); openPortal(types[i % types.length], x, y); } }
      break;
    case 'leap':
      if (at(.01)) { e.tx = p.x; e.ty = p.y; e.jx = e.x; e.jy = e.y; tele(e.tx, e.ty, 120, .9 / enr); }
      if (el > .9 && el < 1.3) { const k = (el - .9) / .4; e.jump = true; e.x = lerp(e.jx, e.tx, k); e.y = lerp(e.jy, e.ty, k); e.z = Math.sin(k * Math.PI) * 120; }
      if (at(1.3)) { e.jump = false; e.z = 0; collideWorld(e); explode(e.x, e.y, 120, dm * 1.2, 'enemy', '#b6ff4d'); fireFan(e.x, e.y, Math.PI, 18, TAU / 18, 240, dm * .45, 8, col); }
      break;
    case 'slam':
      mv = .25;
      for (const t of [.1, 1, 1.9]) if (at(t)) { const x = p.x + (p.vx || 0) * .5, y = p.y + (p.vy || 0) * .5; tele(x, y, 95, .85, () => { explode(x, y, 95, dm, 'enemy', '#ff6a1a'); G.hazards.push({ x, y, r: 55, temp: 5 }); if (G.net && G.net.host) G.net.event(['h', Math.round(x), Math.round(y)]); }); }
      break;
    case 'burst':
      for (const [t, off] of [[.2, 0], [.9, .5], [1.6, 0]]) if (at(t)) { fireFan(e.x, e.y, off / 20 * TAU + Math.PI, 20, TAU / 20, 220, dm * .5, 10, '#ff8a1a'); sfx('eshot'); G.shake = Math.max(G.shake, 4); }
      break;
    case 'beams': {
      mv = .1;
      if (!e.beams) { const n = enr > 1 ? 3 : 2; e.beams = []; for (let k = 0; k < n; k++) e.beams.push(toA + k * TAU / n + .5); e.bdir = Math.random() < .5 ? 1 : -1; }
      const active = el > .9;
      if (active) for (let k = 0; k < e.beams.length; k++) e.beams[k] += ldt * .75 * e.bdir;
      G.beams.push({ x: e.x, y: e.y, angs: e.beams.slice(), active, w: active ? 1 : el / .9 });
      if (active) beamHit(e.x, e.y, e.beams, dm * .9);
      if (active && Math.random() < dt * 4) sfx('laser');
      break;
    }
    case 'shards':
      mv = .4; e.cd -= ldt;
      if (e.cd <= 0) { e.cd = .5; fireFan(e.x, e.y, toA, 5, .14, 430, dm * .5, 7, '#9ae8ff'); sfx('eshot'); }
      break;
    case 'nova':
      for (const [t, off] of [[.1, 0], [.8, .5], [1.5, 0]]) if (at(t)) { fireFan(e.x, e.y, off / 28 * TAU + Math.PI, 28, TAU / 28, 190, dm * .5, 9, '#7fd8ff'); sfx('eshot'); }
      break;
  }
  if (e.jump) return [0, 0, 0];
  let wx = Math.cos(toA) * mv, wy = Math.sin(toA) * mv;
  if (e.type === 'warden' && dist < 200) { wx = -Math.cos(toA) * .6; wy = -Math.sin(toA) * .6; }
  return [wx, wy, spd * enr];
}
function beamHit(bx, by, angs, dmg) {
  const p = G.player; if (!pAlive() || G.over) return;
  for (const a of angs) {
    const vx = Math.cos(a), vy = Math.sin(a), px = p.x - bx, py = p.y - by, along = px * vx + py * vy;
    if (along > 0 && along < 1100 && Math.abs(px * vy - py * vx) < 16 + p.r * .6) hurtPlayer(dmg);
  }
}
