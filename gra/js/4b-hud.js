'use strict';
// ================= HUD =================
function panel(x, y, w, h, cut) {
  cut = cut || 8;
  ctx.beginPath(); ctx.moveTo(x + cut, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - cut); ctx.lineTo(x + w - cut, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + cut); ctx.closePath();
  ctx.fillStyle = 'rgba(8,14,28,.72)'; ctx.fill(); ctx.strokeStyle = 'rgba(110,200,255,.3)'; ctx.lineWidth = 1; ctx.stroke();
}
function bar(x, y, w, h, k, c0, c1, ghost) {
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x, y, w, h);
  if (ghost !== undefined && ghost > k) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x, y, w * clamp(ghost, 0, 1), h); }
  ctx.fillStyle = LG(ctx, x, y, x, y + h, [[0, c0], [1, c1]]); ctx.fillRect(x, y, w * clamp(k, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, y, w * clamp(k, 0, 1), Math.max(1, h * .3));
}
const HUD_ICON = {
  dash: { d: 'M2 12h8M8 6l6 6-6 6M14 6l6 6-6 6', stroke: true },
  gren: { d: 'M12 8a7 7 0 1 0 .01 0zM10 2h5v4h-5zM15 3.5h4v2h-4z' },
  fury: { d: 'M12 2c1.2 4.2 6.5 6.4 6.5 12.3A6.5 6.5 0 0 1 5.5 14.3c0-3 1.8-5 3-6.2 0 2 1 3.2 2.2 3.4C10.6 7.7 10.2 5 12 2z' },
  turret: { d: 'M3 21h18v-3H3zM6 18l2.5-7h7l2.5 7zM11 11V8h10v3z' },
  heal: { d: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z' }
};
const HUD_P2D = {};
function hudIcon(name, x, y, size, color) {
  const ic = HUD_ICON[name]; if (!ic || typeof Path2D === 'undefined') return;
  const p2 = HUD_P2D[name] || (HUD_P2D[name] = new Path2D(ic.d)), s = size / 24;
  ctx.save(); ctx.translate(x - 12 * s, y - 12 * s); ctx.scale(s, s);
  if (ic.stroke) { ctx.strokeStyle = color; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(p2); }
  else { ctx.fillStyle = color; ctx.fill(p2); }
  ctx.restore();
}
function roundBtn(b, label, sub, active, color, charge) {
  const u = U;
  ctx.globalAlpha = active ? 1 : .5;
  ctx.fillStyle = 'rgba(8,14,28,.6)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = active ? color : 'rgba(255,255,255,.3)'; ctx.lineWidth = 2.5 * u; ctx.stroke();
  if (charge !== undefined && charge < 1) { ctx.strokeStyle = color; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 3 * u, -Math.PI / 2, -Math.PI / 2 + TAU * charge); ctx.stroke(); }
  if (HUD_ICON[label]) hudIcon(label, b.x, b.y - (sub ? 5 * u : 0), b.r * (sub ? .9 : 1.05), active ? '#ffffff' : '#8a96aa');
  else ctext(label, b.x, b.y - (sub ? 4 * u : 0), Math.round(13 * u * Math.min(1, 5.5 / label.length)), active ? '#ffffff' : '#aab', 'center', FD);
  if (sub) ctext(sub, b.x, b.y + b.r * .52, Math.round(10.5 * u), color, 'center', FU);
  ctx.globalAlpha = 1;
}
function stick(x, y, r, dx, dy, col, act) {
  ctx.globalAlpha = act ? .85 : .4;
  ctx.fillStyle = 'rgba(8,14,28,.45)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(160,220,255,.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(x, y, r * .72, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  const kx = x + dx * r, ky = y + dy * r;
  ctx.fillStyle = RG(ctx, kx - r * .12, ky - r * .12, 1, kx, ky, r * .42, [[0, '#ffffff'], [.5, col], [1, hexA(col, .5)]]);
  ctx.beginPath(); ctx.arc(kx, ky, r * .42, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
}
function drawHUD(now) {
  const p = G.player, Lh = hudLayout(), u = Lh.u;
  if (!p) return;
  // zdrowie
  const x = safe.l + 14 * u, y = safe.t + 12 * u, bw = 200 * u;
  panel(x, y, bw + 56 * u, 50 * u);
  ctx.fillStyle = '#ff4d6d'; ctx.save(); ctx.translate(x + 20 * u, y + 18 * u); ctx.scale(u * .75, u * .75);
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -8, -14, 0, -6); ctx.bezierCurveTo(8, -14, 14, -2, 0, 8); ctx.fill(); ctx.restore();
  bar(x + 36 * u, y + 11 * u, bw, 14 * u, p.hp / p.maxHp, p.hp < p.maxHp * .3 ? '#ff6a6a' : '#7dff8a', p.hp < p.maxHp * .3 ? '#c4142e' : '#1f9a4a', p.hpShow / p.maxHp);
  ctext(Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp), x + 36 * u + bw / 2, y + 18.5 * u, Math.round(11 * u), '#ffffff', 'center', FU);
  ctext('LV ' + p.lvl, x + 20 * u, y + 38 * u, Math.round(11 * u), '#3ef0ff', 'center', FD);
  bar(x + 36 * u, y + 34 * u, bw, 7 * u, p.xp / p.xpNext, '#9ffcff', '#1aa6d6');
  // monety + pauza
  const pz = Lh.pause;
  ctx.fillStyle = 'rgba(8,14,28,.7)'; ctx.beginPath(); ctx.arc(pz.x, pz.y, pz.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(110,200,255,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#e8f2ff'; ctx.fillRect(pz.x - 6 * u, pz.y - 7 * u, 4 * u, 14 * u); ctx.fillRect(pz.x + 2 * u, pz.y - 7 * u, 4 * u, 14 * u);
  const cxp = Lh.coins.x;
  ctext(String(save.coins + G.coins), cxp - 18 * u, pz.y, Math.round(18 * u), '#ffe08a', 'right', FD);
  ctx.fillStyle = RG(ctx, cxp - 9 * u, pz.y - 3 * u, 0, cxp - 7 * u, pz.y, 8 * u, [[0, '#fff6c4'], [.5, '#ffc93c'], [1, '#b8741a']]); ctx.beginPath(); ctx.arc(cxp - 7 * u, pz.y, 8 * u, 0, TAU); ctx.fill();
  // fala / boss
  if (G.boss && !G.boss.dead) {
    const b = G.boss, w = Math.min(400 * u, W * .36), bx = W / 2 - w / 2, by = safe.t + 30 * u;
    ctext(b.d.name.toUpperCase(), W / 2, by - 12 * u, Math.round(15 * u), '#ff8aa0', 'center', FD);
    bar(bx, by, w, 12 * u, b.hp / b.maxHp, '#ff6a8a', '#a0102e');
    ctx.strokeStyle = 'rgba(255,120,150,.5)'; ctx.lineWidth = 1; ctx.strokeRect(bx - .5, by - .5, w + 1, 12 * u + 1);
  } else if (G.mode === 'pvp') {
    const P = G.pvp, rem = [...G.remotes.values()].sort((a, b) => (b.kills || 0) - (a.kills || 0)), lead = rem[0];
    const left = Math.max(0, P.endAt - G.t), mm = Math.floor(left / 60), ss = Math.floor(left % 60);
    ctext('KILLS ' + P.kills + ' / ' + P.target, W / 2, safe.t + 22 * u, Math.round(17 * u), '#ffffff', 'center', FD);
    ctext((lead ? 'Leader: ' + (P.kills >= (lead.kills || 0) ? 'You' : (lead.nick || 'Player') + ' (' + (lead.kills || 0) + ')') + ' · ' : 'Waiting for rivals · ') + mm + ':' + String(ss).padStart(2, '0'), W / 2, safe.t + 42 * u, Math.round(12 * u), '#ffb0bd', 'center', FU);
  } else if (G.endless && G.wave >= 0) {
    ctext('WAVE ' + (G.wave + 1), W / 2, safe.t + 22 * u, Math.round(17 * u), '#ffffff', 'center', FD);
    ctext('Score: ' + G.score + (G.mode === 'daily' ? ' · Daily Challenge' : ''), W / 2, safe.t + 42 * u, Math.round(12 * u), '#ffe08a', 'center', FU);
  } else if (G.wave >= 0) {
    const left = G.enemies.length + G.portals.length + G.queue.length;
    ctext('WAVE ' + Math.min(G.wave + 1, G.waves.length) + '/' + G.waves.length, W / 2, safe.t + 22 * u, Math.round(17 * u), '#ffffff', 'center', FD);
    ctext(left ? 'Enemies: ' + left : 'Area clear', W / 2, safe.t + 42 * u, Math.round(12 * u), left ? '#ff9aae' : '#8dff6a', 'center', FU);
  }
  // baner
  if (G.banner) {
    const b = G.banner, k = b.t / b.max, a = Math.min(1, (1 - k) * 6, k * 4);
    ctx.globalAlpha = a;
    const by = H * .3, slide = (1 - Math.min(1, (1 - k) * 5)) * 60;
    ctx.fillStyle = b.boss ? 'rgba(80,0,20,.55)' : 'rgba(0,20,40,.5)'; ctx.fillRect(0, by - 34 * u, W, 68 * u);
    ctx.fillStyle = b.boss ? '#ff4d6d' : G.B.accent; ctx.fillRect(0, by - 34 * u, W, 2); ctx.fillRect(0, by + 34 * u - 2, W, 2);
    ctext(b.title.toUpperCase(), W / 2 + slide, by - 6 * u, Math.round((b.boss ? 34 : 30) * u), '#ffffff', 'center', FD);
    ctext(b.sub, W / 2 - slide, by + 20 * u, Math.round(13 * u), b.boss ? '#ff9aae' : G.B.accent, 'center', FU);
    ctx.globalAlpha = 1;
  }
  // drużyna
  if (G.mode === 'coop' && G.remotes.size) {
    let yy = y + 58 * u;
    for (const r of G.remotes.values()) {
      panel(x, yy, 150 * u, 22 * u, 5);
      ctext((r.nick || 'Player').slice(0, 12), x + 8 * u, yy + 11 * u, Math.round(11 * u), r.dead ? '#8ea3c4' : '#ffffff', 'left', FU);
      bar(x + 88 * u, yy + 8 * u, 54 * u, 6 * u, r.dead ? 0 : r.hp / (r.maxHp || 100), '#7dff8a', '#1f9a4a');
      yy += 26 * u;
    }
  }
  if (G.feed && G.feed.length) { let fy = safe.t + 70 * u; for (const f of G.feed) { ctx.globalAlpha = Math.min(1, f.t); ctext(f.text, W - safe.r - 16 * u, fy, Math.round(12 * u), '#ffd0d8', 'right', FU); fy += 16 * u; } ctx.globalAlpha = 1; }
  if (G.over) return;
  if (p.dead) {
    ctext(G.mode === 'pvp' || G.mode === 'coop' ? 'RESPAWN IN ' + Math.ceil(Math.max(0, p.respawnT)) : '', W / 2, H * .55, Math.round(26 * u), '#ffffff', 'center', FD);
    return;
  }
  const touch = !input.pad && (!input.mouse || matchMedia('(pointer: coarse)').matches);
  // sterowanie
  if (touch) {
    const mv = touchSticks.move, am = touchSticks.aim;
    if (mv.id !== null) stick(mv.ox, mv.oy, Lh.move.r, input.mx, input.my, '#cfe6ff', true); else stick(Lh.move.x, Lh.move.y, Lh.move.r, 0, 0, '#cfe6ff', false);
    if (am.id !== null) stick(am.ox, am.oy, Lh.aim.r, input.ax, input.ay, '#ffb627', true); else stick(Lh.aim.x, Lh.aim.y, Lh.aim.r, 0, 0, '#ffb627', false);
  }
  const dk = p.dashCD <= 0 ? 1 : 1 - p.dashCD / (2.2 * (1 - .12 * save.upg.dash));
  roundBtn(Lh.dash, 'dash', input.pad ? 'A' : touch ? '' : 'SPACE', p.dashCD <= 0, '#3ef0ff', dk);
  roundBtn(Lh.gren, 'gren', '×' + p.grenades, p.grenades > 0, '#ffb627');
  const HH = HEROES[p.hero], ak = p.abCD <= 0 ? 1 : 1 - p.abCD / HH.cd;
  roundBtn(Lh.abil, { assault: 'fury', engineer: 'turret', medic: 'heal' }[p.hero], p.abCD > 0 ? Math.ceil(p.abCD) + 's' : (input.pad ? 'X' : touch ? '' : 'F'), p.abCD <= 0, HH.visor, ak);
  // broń
  const s = Lh.swap, w = curW(p), id = p.weapons[p.wi];
  ctx.save(); ctx.translate(s.x - s.w / 2, s.y - s.h / 2);
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(s.w, 0); ctx.lineTo(s.w, s.h - 8); ctx.lineTo(s.w - 8, s.h); ctx.lineTo(0, s.h); ctx.lineTo(0, 8); ctx.closePath();
  ctx.fillStyle = 'rgba(8,14,28,.72)'; ctx.fill(); ctx.strokeStyle = hexA(w.color, .7); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  ctext(w.name.toUpperCase(), s.x - s.w / 2 + 10 * u, s.y - 7 * u, Math.round(11 * u), w.color, 'left', FD);
  const am = p.ammo[id];
  ctext(p.reloadT > 0 ? 'RELOADING' : am + ' / ' + w.mag, s.x - s.w / 2 + 10 * u, s.y + 9 * u, Math.round(11 * u), p.reloadT > 0 ? '#ffb627' : '#e8f2ff', 'left', FU);
  if (p.weapons.length > 1) ctext('⇄', s.x + s.w / 2 - 14 * u, s.y, Math.round(18 * u), '#ffffff', 'center', FU);
}
