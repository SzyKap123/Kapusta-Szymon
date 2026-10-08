'use strict';
// ================= Pętla aktualizacji =================
const input = { mx: 0, my: 0, ax: 0, ay: 0, aiming: false, mouse: false, mouseX: 0, mouseY: 0, mouseDown: false, keys: {} };

function targetsList() { return G.mode === 'pvp' ? [...G.remotes.values()].filter(r => !r.dead && r.inv <= 0) : G.enemies; }
function nearestEnemy(x, y, maxD, cone, dir) {
  let best = null, bd = maxD;
  for (const e of targetsList()) {
    if (e.dead) continue;
    const d = hyp(e.x - x, e.y - y); if (d >= bd) continue;
    if (cone && Math.abs(angDiff(dir, Math.atan2(e.y - y, e.x - x))) > cone) continue;
    bd = d; best = e;
  }
  return best;
}
function updatePlayer(dt) {
  const p = G.player; if (!p) return;
  if (p.dead) {
    if ((G.mode === 'coop' || G.mode === 'pvp') && !G.over) { p.respawnT -= dt; if (p.respawnT <= 0) respawnPlayer(); }
    return;
  }
  if (G.over === 'lose') return;
  p.fury = Math.max(0, p.fury - dt); p.abCD -= dt;
  if (p.fury > 0 && Math.random() < dt * 20) part({ x: p.x + rand(-14, 14), y: p.y + rand(-14, 14), vy: -50, life: .4, size: 6, color: '#ff6b3d', type: 'fire' });
  if (G.mode === 'pvp' && G.t - p.lastHurtT > 4) p.hp = Math.min(p.maxHp, p.hp + 10 * dt);
  for (const f of G.fields) if (hyp(f.x - p.x, f.y - p.y) < f.r) { p.hp = Math.min(p.maxHp, p.hp + 9 * dt); break; }
  const k = input.keys;
  let mx = input.mx, my = input.my;
  if (k.KeyW || k.ArrowUp) my -= 1; if (k.KeyS || k.ArrowDown) my += 1; if (k.KeyA || k.ArrowLeft) mx -= 1; if (k.KeyD || k.ArrowRight) mx += 1;
  const m = hyp(mx, my); if (m > 1) { mx /= m; my /= m; }
  const speed = 235 * p.mods.speed;
  p.moving = m > .12;
  if (p.dashT > 0) {
    p.dashT -= dt; p.vx = Math.cos(p.dashDir) * 800; p.vy = Math.sin(p.dashDir) * 800;
    p.ghostT -= dt; if (p.ghostT <= 0) { p.ghostT = .025; p.ghosts.push({ x: p.x, y: p.y, a: p.aim, life: .22 }); }
  } else { const a = Math.min(1, dt * 14); p.vx = lerp(p.vx, p.moving ? mx * speed : 0, a); p.vy = lerp(p.vy, p.moving ? my * speed : 0, a); }
  p.x += p.vx * dt; p.y += p.vy * dt; collideWorld(p);
  if (p.moving || p.dashT > 0) p.walk += dt * hyp(p.vx, p.vy) * .06;
  // celowanie
  let fire = false, aimA = null;
  if (input.aiming && hyp(input.ax, input.ay) > .25) {
    aimA = Math.atan2(input.ay, input.ax); fire = true;
    const t = nearestEnemy(p.x, p.y, 620, .26, aimA); if (t) aimA += angDiff(aimA, Math.atan2(t.y - p.y, t.x - p.x)) * .6;
  } else if (input.mouse) {
    const w = screenToWorld(input.mouseX, input.mouseY); aimA = Math.atan2(w.y - p.y, w.x - p.x); fire = input.mouseDown;
  }
  if (aimA === null && (save.settings.auto || G.autoT > 0)) {
    const t = nearestEnemy(p.x, p.y, 560); if (t && los(p.x, p.y, t.x, t.y)) { aimA = Math.atan2(t.y - p.y, t.x - p.x); fire = true; }
  }
  if (G.autoT > 0) G.autoT -= dt;
  if (aimA !== null) p.aim += angDiff(p.aim, aimA) * Math.min(1, dt * 30);
  else if (p.moving) p.aim += angDiff(p.aim, Math.atan2(my, mx)) * Math.min(1, dt * 10);
  p.firing = fire && !G.over;
  p.fireCD -= dt; p.kick = Math.max(0, p.kick - dt * 8); p.inv -= dt; p.dashCD -= dt;
  if (p.reloadT > 0) { p.reloadT -= dt; if (p.reloadT <= 0) { p.reloadT = 0; p.ammo[p.weapons[p.wi]] = curW(p).mag; sfx('click'); } }
  if (p.firing) playerShoot(p);
  if (k.KeyR) startReload(p);
  p.hpShow = lerp(p.hpShow, p.hp, Math.min(1, dt * 3));
  // lawa
  let inLava = false; for (const h of G.hazards) if (hyp(h.x - p.x, h.y - p.y) < h.r) { inLava = true; break; }
  if (inLava && p.dashT <= 0) { p.lavaT -= dt; if (Math.random() < dt * 15) part({ x: p.x + rand(-10, 10), y: p.y, vy: -80, life: .4, size: 8, color: '#ff7a2e', type: 'fire' }); if (p.lavaT <= 0) { p.lavaT = .3; hurtPlayer(6, true); pop(p.x, p.y - 30, '-6', '#ff9a3d', 13); sfx('hit'); } }
  // satelity
  if (p.mods.orbs) {
    p.orbAng += dt * 3.2;
    for (let i = 0; i < p.mods.orbs; i++) {
      const a = p.orbAng + i * TAU / p.mods.orbs, ox = p.x + Math.cos(a) * 72, oy = p.y + Math.sin(a) * 72;
      if (G.mode === 'pvp') { for (const r of G.remotes.values()) if (!r.dead && (r.orbCD || 0) <= G.t && hyp(r.x - ox, r.y - oy) < 29) { r.orbCD = G.t + .4; G.net && G.net.pvpHit(r.peer, 9); sparks(ox, oy, '#9ae8ff', 4, 200); } continue; }
      for (const e of G.enemies) if (!e.dead && e.orbCD <= 0 && hyp(e.x - ox, e.y - oy) < e.r + 11) { e.orbCD = .35; hitEnemy(e, 14 * dmgScale(), { noProc: true, color: '#9ae8ff', kx: Math.cos(a + 1.57) * 120, ky: Math.sin(a + 1.57) * 120 }); sparks(ox, oy, '#9ae8ff', 4, 200); }
    }
  }
  for (const gh of p.ghosts) gh.life -= dt;
  p.ghosts = p.ghosts.filter(g => g.life > 0);
}

function updateBullets(dt) {
  for (const b of G.pb) {
    b.life -= dt;
    const sp = hyp(b.vx, b.vy), steps = Math.max(1, Math.ceil(sp * dt / 14));
    for (let s = 0; s < steps && !b.dead; s++) {
      b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
      if (b.x < M || b.y < M || b.x > WW - M || b.y > WH - M) {
        if (b.bounce > 0) { b.bounce--; if (b.x < M || b.x > WW - M) b.vx *= -1; else b.vy *= -1; b.x = clamp(b.x, M, WW - M); b.y = clamp(b.y, M, WH - M); }
        else { b.dead = true; sparks(b.x, b.y, b.color, 5, 200); if (b.explode) explode(b.x, b.y, b.explode, b.dmg, 'player', '#ff8a3d', false, b.remote); }
        break;
      }
      const pr = propAt(b.x, b.y, b.r * .5);
      if (pr) {
        if (pr.kind === 'barrel') { pr.hp -= b.dmg; if (pr.hp <= 0 && !pr.fuse) pr.fuse = .05; }
        if (b.bounce > 0 && pr.kind !== 'barrel') {
          const n = propNormal(pr, b.x, b.y), dot = b.vx * n[0] + b.vy * n[1];
          b.vx -= 2 * dot * n[0]; b.vy -= 2 * dot * n[1]; b.bounce--; b.x += n[0] * 6; b.y += n[1] * 6; sparks(b.x, b.y, b.color, 4, 180);
        } else {
          b.dead = true; sparks(b.x, b.y, b.color, 6, 240, Math.atan2(-b.vy, -b.vx), 1);
          if (b.explode) explode(b.x, b.y, b.explode, b.dmg, 'player', '#ff8a3d', false, b.remote);
        }
        break;
      }
      if (G.mode === 'pvp') {
        if (b.remote) { const p = G.player; if (pAlive() && b.owner !== 'me' && hyp(p.x - b.x, p.y - b.y) < p.r + b.r) { b.dead = true; sparks(b.x, b.y, b.color, 6, 240); if (b.explode) explode(b.x, b.y, b.explode, 0, 'player', '#ff8a3d', false, true); break; } continue; }
        for (const r of G.remotes.values()) {
          if (r.dead || b.hit.has(r.peer) || hyp(r.x - b.x, r.y - b.y) >= 18 + b.r) continue;
          const a = Math.atan2(b.vy, b.vx);
          if (b.explode) { b.dead = true; explode(b.x, b.y, b.explode, b.dmg, 'player', '#ff8a3d'); break; }
          if (r.inv <= 0) { G.net && G.net.pvpHit(r.peer, b.dmg); pop(r.x, r.y - 30, Math.round(b.dmg), '#ffffff', 15); sfx('hit'); }
          sparks(b.x, b.y, b.color, 6, 260, a, .7);
          if (b.pierce > 0) { b.pierce--; b.hit.add(r.peer); } else { b.dead = true; break; }
        }
        continue;
      }
      for (const e of G.enemies) {
        if (e.dead || e.jump || b.hit.has(e.id)) continue;
        if (Math.abs(e.x - b.x) > e.r + b.r || Math.abs(e.y - b.y) > e.r + b.r) continue;
        if (hyp(e.x - b.x, e.y - b.y) < e.r + b.r) {
          const a = Math.atan2(b.vy, b.vx);
          if (b.explode) { b.dead = true; explode(b.x, b.y, b.explode, b.dmg, 'player', '#ff8a3d', false, b.remote); break; }
          if (!b.remote) hitEnemy(e, b.dmg, { kx: Math.cos(a) * 90, ky: Math.sin(a) * 90, turret: b.turret });
          sparks(b.x, b.y, b.color, 5, 260, a, .7);
          if (b.pierce > 0) { b.pierce--; b.hit.add(e.id); } else { b.dead = true; break; }
        }
      }
    }
    if (!b.dead && b.life <= 0) { b.dead = true; if (b.explode) explode(b.x, b.y, b.explode, b.dmg, 'player', '#ff8a3d', false, b.remote); }
    if (b.rocket && !b.dead && Math.random() < .7) part({ x: b.x - b.vx * .02, y: b.y - b.vy * .02, vx: rand(-20, 20), vy: rand(-20, 20), life: .5, size: 8, color: '#55505a', type: 'smoke', grow: 30 });
  }
  G.pb = G.pb.filter(b => !b.dead);
  const p = G.player;
  for (const b of G.eb) {
    b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.life <= 0 || b.x < M || b.y < M || b.x > WW - M || b.y > WH - M) { b.dead = true; continue; }
    const pr = propAt(b.x, b.y, b.r * .4); if (pr) { b.dead = true; sparks(b.x, b.y, b.color, 5, 160); continue; }
    if (pAlive() && !G.over && hyp(p.x - b.x, p.y - b.y) < b.r + p.r * .7) { if (p.dashT <= 0 && p.inv <= 0) { b.dead = true; hurtPlayer(b.dmg); sparks(b.x, b.y, b.color, 8, 220); } }
  }
  G.eb = G.eb.filter(b => !b.dead);
}

function updateWorld(dt) {
  const p = G.player;
  // granaty
  for (const g of G.grenades) {
    g.t += dt; const k = Math.min(1, g.t / g.dur);
    g.x = lerp(g.x0, g.x1, k); g.y = lerp(g.y0, g.y1, k); g.z = Math.sin(k * Math.PI) * 110;
    if (k >= 1) { g.dead = true; explode(g.x, g.y, 135, g.mine ? 95 * dmgScale() : 0, 'player', '#ff9a3d', false, !g.mine); }
  }
  // wieżyczki i pola leczące
  for (const t of G.turrets) {
    t.life -= dt; t.cd -= dt;
    const tg = G.mode === 'pvp' ? (t.mine ? nearestEnemy(t.x, t.y, 520) : null) : nearestEnemy(t.x, t.y, 520);
    if (tg) { t.aim += angDiff(t.aim, Math.atan2(tg.y - t.y, tg.x - t.x)) * Math.min(1, dt * 12);
      if (t.cd <= 0 && los(t.x, t.y, tg.x, tg.y)) { t.cd = .22; const a = t.aim + rand(-.05, .05), sp = 1000;
        G.pb.push({ x: t.x + Math.cos(a) * 24, y: t.y + Math.sin(a) * 24, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .6, dmg: t.mine ? 11 * dmgScale() : 0, r: 4, color: '#ffb627', pierce: 0, bounce: 0, explode: 0, hit: new Set(), remote: !t.mine, owner: t.mine ? 'me' : 'x', turret: true });
        flash(t.x, t.y, 50, '#ffb627', .06); sfx('rifle'); } }
    if (t.life <= 0) { t.dead = true; sparks(t.x, t.y, '#ffb627', 12, 200); smoke(t.x, t.y, 4, '#3a3a44', 14); }
  }
  G.turrets = G.turrets.filter(t => !t.dead);
  for (const f of G.fields) { f.life -= dt; if (Math.random() < dt * 20) { const a = rand(0, TAU), d = rand(0, f.r); part({ x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d, vy: -40, life: .6, size: 3, color: '#8dff6a', type: 'dot' }); } }
  G.fields = G.fields.filter(f => f.life > 0);
  G.grenades = G.grenades.filter(g => !g.dead);
  // beczki
  for (const b of G.props) if (b.kind === 'barrel' && b.fuse) { b.fuse -= dt; if (b.fuse <= 0) { b.gone = true; save.stats.barrels++; explode(b.x, b.y, 120, 70, 'world', '#ff6a1a'); } }
  if (G.props.some(b => b.gone)) G.props = G.props.filter(b => !b.gone);
  // portale
  for (const po of G.portals) {
    po.t += dt;
    if (Math.random() < dt * 30) { const a = rand(0, TAU), r = po.boss ? 90 : 40; part({ x: po.x + Math.cos(a) * r, y: po.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 2, vy: -Math.sin(a) * r * 2, life: .4, size: 3, color: G.B.accent, type: 'spark', drag: 0 }); }
    if (po.t >= po.dur) {
      po.done = true;
      if (po.visual) { flash(po.x, po.y, po.boss ? 400 : 160, G.B.accent, .3); sparks(po.x, po.y, G.B.accent, po.boss ? 40 : 12, 300); continue; }
      const e = mkEnemy(po.type, po.x, po.y); G.enemies.push(e); if (e.d.boss) G.boss = e;
      flash(po.x, po.y, po.boss ? 400 : 160, G.B.accent, .3); sparks(po.x, po.y, G.B.accent, po.boss ? 40 : 12, 300);
      if (po.boss) { G.shake = 14; explode(po.x, po.y, 100, 0, 'enemy', G.B.accent, true); }
    }
  }
  G.portals = G.portals.filter(po => !po.done);
  // ostrzeżenia
  for (const t of G.teles) { t.t += dt; if (t.t >= t.dur) { t.dead = true; if (t.done) t.done(); } }
  G.teles = G.teles.filter(t => !t.dead);
  // tymczasowa lawa
  for (const h of G.hazards) if (h.temp !== undefined) h.temp -= dt;
  G.hazards = G.hazards.filter(h => h.temp === undefined || h.temp > 0);
  // znajdźki
  if (p) {
    const magR = 110 * (1 + .3 * save.upg.mag) * p.mods.magnet;
    for (const k of G.pickups) {
      k.t += dt; k.life -= dt;
      const d = hyp(p.x - k.x, p.y - k.y);
      if ((k.pull && pAlive()) || (d < magR && pAlive())) {
        k.pull = true; const a = Math.atan2(p.y - k.y, p.x - k.x), s = 380 + (k.t * 60); k.vx = lerp(k.vx, Math.cos(a) * s, Math.min(1, dt * 10)); k.vy = lerp(k.vy, Math.sin(a) * s, Math.min(1, dt * 10));
      } else { k.vx *= Math.max(0, 1 - dt * 5); k.vy *= Math.max(0, 1 - dt * 5); }
      k.x += k.vx * dt; k.y += k.vy * dt;
      if (d < p.r + 10 && pAlive()) {
        k.dead = true;
        if (k.type === 'xp') { addXp(k.v); sfx('xp'); }
        else if (k.type === 'coin') { G.coins += k.v; sfx('coin'); }
        else if (k.type === 'hp') { healPlayer(k.v); sfx('heal'); }
        else if (k.type === 'gren') { p.grenades++; pop(p.x, p.y - 34, '+1 granat', '#ffb627', 14); sfx('heal'); }
      }
      if (k.life <= 0) k.dead = true;
    }
    G.pickups = G.pickups.filter(k => !k.dead);
  }
  // cząsteczki
  for (const q of G.parts) {
    q.life -= dt; const dr = Math.max(0, 1 - q.drag * dt);
    q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= dr; q.vy *= dr;
    if (q.grav) { q.vz -= q.grav * dt; q.z += q.vz * dt; if (q.z < 0) { q.z = 0; q.vz *= -.35; q.vx *= .6; q.vy *= .6; q.vr *= .5; } }
    q.rot += q.vr * dt; q.size = Math.max(.5, q.size + q.grow * dt);
  }
  G.parts = G.parts.filter(q => q.life > 0);
  for (const q of G.pops) { q.life -= dt; q.y += q.vy * dt; q.vy *= Math.max(0, 1 - dt * 3); }
  G.pops = G.pops.filter(q => q.life > 0);
  for (const f of G.flashes) f.life -= dt; G.flashes = G.flashes.filter(f => f.life > 0);
  for (const b of G.bolts) b.life -= dt; G.bolts = G.bolts.filter(b => b.life > 0);
  // atmosfera
  const view = viewRect();
  const nAmb = save.settings.quality === 'high' ? 40 : 15;
  while (G.amb.length < nAmb) G.amb.push({ x: rand(view.x0, view.x1), y: rand(view.y0, view.y1), vx: rand(-15, 15), vy: G.bi === 1 ? rand(-50, -20) : G.bi === 2 ? rand(30, 60) : rand(-12, 12), ph: rand(0, 6), life: rand(3, 8) });
  for (const a of G.amb) {
    a.life -= dt; a.ph += dt * 2; a.x += (a.vx + (G.bi === 0 ? Math.sin(a.ph) * 20 : G.bi === 2 ? Math.sin(a.ph) * 25 : 0)) * dt; a.y += a.vy * dt;
    if (a.x < view.x0 - 50 || a.x > view.x1 + 50 || a.y < view.y0 - 50 || a.y > view.y1 + 50) a.life = 0;
  }
  G.amb = G.amb.filter(a => a.life > 0);
  // lawa bulgocze
  if (G.bi === 1 && Math.random() < dt * 8) {
    const h = pick(G.hazards); if (h && h.x > view.x0 && h.x < view.x1 && h.y > view.y0 && h.y < view.y1) { part({ x: h.x + rand(-h.r, h.r) * .6, y: h.y + rand(-h.r, h.r) * .6, vy: -30, life: .6, size: rand(3, 6), color: '#ffd060', type: 'dot' }); }
  }
}

function updateCamera(dt) {
  const c = G.cam, p = G.player;
  c.z = clamp(Math.min(W / 840, H / 470), .5, 1.7);
  let tx, ty;
  if (p) { tx = p.x + Math.cos(p.aim) * 70; ty = p.y + Math.sin(p.aim) * 50; }
  else { tx = WW / 2 + Math.cos(G.t * .07) * 700; ty = WH / 2 + Math.sin(G.t * .11) * 420; }
  const k = p ? Math.min(1, dt * 6) : 1;
  c.x = lerp(c.x, tx, k); c.y = lerp(c.y, ty, k);
  const hw = W / 2 / c.z, hh = H / 2 / c.z;
  const mg = p ? 260 : 0; c.x = clamp(c.x, hw - mg, WW - hw + mg); c.y = clamp(c.y, hh - mg, WH - hh + mg);
  if (WW < hw * 2) c.x = WW / 2; if (WH < hh * 2) c.y = WH / 2;
  G.shake = Math.max(0, G.shake - dt * 30); G.hurtV = Math.max(0, G.hurtV - dt * 1.5);
}
function viewRect() { const c = G.cam, hw = W / 2 / c.z, hh = H / 2 / c.z; return { x0: c.x - hw, y0: c.y - hh, x1: c.x + hw, y1: c.y + hh }; }
function screenToWorld(sx, sy) { const c = G.cam; return { x: (sx - W / 2) / c.z + c.x, y: (sy - H / 2) / c.z + c.y }; }

function update(dt) {
  if (!G) return;
  dt *= G.slow; G.t += dt;
  if (G.slow < 1 && !G.bossDeath && G.over !== 'lose') G.slow = Math.min(1, G.slow + dt * 2);
  if (!G.demo) {
    updatePlayer(dt);
    if (G.net) G.net.tick(dt);
    updateWaves(dt);
    if (!(G.net && G.net.guest)) { G.beams.length = 0; updateEnemies(dt); }
    updateBullets(dt);
    if (G.mode === 'pvp') pvpCheck();
  }
  updateWorld(dt);
  updateCamera(dt);
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  if (G.over) G.overT += dt / Math.max(.3, G.slow);
}
function pvpCheck() {
  if (G.over) return;
  const P = G.pvp, rem = [...G.remotes.values()];
  const best = rem.reduce((m, r) => Math.max(m, r.kills || 0), 0);
  if (P.kills >= P.target) { G.over = 'win'; G.overT = 0; sfx('win'); }
  else if (best >= P.target) { G.over = 'lose'; G.overT = 0; sfx('lose'); }
  else if (G.t >= P.endAt) { G.over = P.kills >= best && rem.length ? 'win' : 'lose'; G.overT = 0; sfx(G.over === 'win' ? 'win' : 'lose'); }
}
