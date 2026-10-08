'use strict';
// ================= Online: lobby, pokoje, synchronizacja, ranking =================
const NET = { room: null, db: null, user: null, uid: null, ok: false, tried: false, myPeer: null, lobbyPeers: [], gr: null, peers: [], code: null, host: false, mode: 'coop', li: 0, seenGo: null };
const MODE_NAMES = { coop: 'Kooperacja', pvp: 'Pojedynek PvP' };
const W_IDX = WEAPON_KEYS, T_IDX = Object.keys(EDEF), ST_IDX = ['move', 'aim', 'charge', 'stun', 'fuse', 'lock'];
const num = (v, d) => { const n = +v; return Number.isFinite(n) ? n : (d || 0); };
const okColor = c => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#ff6a1a';
function nick() { return (save.nick || '').trim().slice(0, 14) || 'Żołnierz'; }

async function initOnline() {
  if (NET.tried) return; NET.tried = true;
  const c = window.claude;
  if (!c || typeof c.use !== 'function') { NET.done = true; refreshOnlineUI(); return; }
  const [room, db, user] = await Promise.all([c.use('room').catch(() => null), c.use('db').catch(() => null), c.use('user').catch(() => null)]);
  NET.room = room; NET.db = db; NET.user = user;
  if (user) {
    try { NET.uid = await user.id(); } catch (e) {}
    if (!save.nick) { try { const n = await user.name(); if (n) { save.nick = n.split(' ')[0].slice(0, 14); persist(); } } catch (e) {} }
  }
  if (room) {
    room.onPeers(ch => {
      NET.lobbyPeers = ch.peers;
      const me = ch.peers.find(p => p.sameTab); if (me) NET.myPeer = me.peer;
      if (curScreen === 'sOnline') renderOpenRooms();
    }, () => { NET.ok = false; refreshOnlineUI(); });
    pushLobbyPresence();
  }
  NET.ok = !!room; NET.done = true;
  refreshOnlineUI();
}
function pushLobbyPresence() {
  if (!NET.room) return;
  const hosting = NET.gr && NET.host;
  NET.room.presence({ n: nick(), host: hosting ? { c: NET.code, m: NET.mode, l: NET.li, k: NET.peers.length || 1, o: G && G.net ? 0 : 1 } : null }).catch(() => {});
}

// ---------- pokoje ----------
function cleanCode(c) { return String(c || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); }
function newCode() { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
async function joinRoom(code, asHost) {
  if (!NET.room) return;
  code = cleanCode(code);
  if (!code) { toast('Wpisz kod pokoju'); return; }
  await leaveRoom();
  try { NET.gr = await NET.room.join('sz-' + code); }
  catch (e) { NET.gr = null; toast(e && e.code === 'limit_reached' ? 'Za dużo pokoi naraz – spróbuj za chwilę' : 'Nie udało się wejść do pokoju'); return; }
  NET.code = code; NET.host = !!asHost; NET.seenGo = null; NET.peers = [];
  const gr = NET.gr;
  gr.onPeers(ch => { if (gr !== NET.gr) return; NET.peers = ch.peers; onRoomPeers(); }, () => { if (gr !== NET.gr) return; toast('Utracono połączenie z pokojem'); NET.gr = null; if (!G || !G.net) { goMenu(); showOnline(); } });
  roomPresence();
  pushLobbyPresence();
  renderRoom(); show('sRoom');
}
async function leaveRoom() {
  const gr = NET.gr; NET.gr = null; NET.host = false; NET.peers = [];
  if (gr) { try { await gr.leave(); } catch (e) {} }
  pushLobbyPresence();
}
function roomPresence(extra) {
  if (!NET.gr) return;
  NET.gr.presence(Object.assign({ n: nick(), h: save.hero, host: NET.host ? 1 : null, m: NET.host ? NET.mode : null, l: NET.host ? NET.li : null }, extra || {})).catch(() => {});
}
function hostPeer() { return NET.peers.find(p => p.presence && p.presence.host === 1 && !p.sameTab); }
function onRoomPeers() {
  if (curScreen === 'sRoom') renderRoom();
  if (NET.host) { pushLobbyPresence(); return; }
  const h = hostPeer();
  if (h && h.presence.go && typeof h.presence.go === 'object') {
    const go = h.presence.go;
    if (go.id !== NET.seenGo && curScreen === 'sRoom') { NET.seenGo = go.id; startNetGame(go); }
  }
}
function hostStart() {
  if (!NET.host || !NET.gr) return;
  const others = NET.peers.filter(p => !p.sameTab).length;
  if (NET.mode === 'pvp' && others < 1) { toast('Pojedynek wymaga co najmniej 2 graczy'); return; }
  const go = { id: Date.now().toString(36) + ri(0, 999), s: (Math.random() * 1e9) >>> 0, m: NET.mode, l: NET.li, b: NET.mode === 'pvp' ? ri(0, 2) : LEVELS[NET.li].biome };
  NET.seenGo = go.id;
  roomPresence({ go });
  startNetGame(go);
}
function startNetGame(go) {
  const mode = go.m === 'pvp' ? 'pvp' : 'coop', li = clamp(num(go.l) | 0, 0, 8);
  ensureAudio(); resetInput();
  newGame(li, false, { mode, seed: num(go.s) >>> 0, biome: clamp(num(go.b) | 0, 0, 2), hero: save.hero });
  const p = G.player;
  if (mode === 'pvp') { const s = randomFreeSpot(40); p.x = s.x; p.y = s.y; }
  else { p.x = WW / 2 + rand(-80, 80); p.y = WH / 2 + rand(-80, 80); collideWorld(p); }
  p.nick = nick();
  G.cam.x = p.x; G.cam.y = p.y;
  G.net = makeNetSession(mode, String(go.id));
  G.feed = [];
  G.banner = mode === 'pvp' ? { title: 'Pojedynek', sub: 'Pierwszy do ' + G.pvp.target + ' eliminacji wygrywa', t: 2.6, max: 2.6 }
    : { title: 'Misja ' + (li + 1) + ' · drużyna', sub: BIOMES[G.bi].name, t: 2.4, max: 2.4 };
  G.waveDelay = 2.4;
  state = 'play'; show(null); music.intense = 0;
  pushLobbyPresence();
}
function backToRoom() {
  if (G && G.net) { G.net = null; }
  roomPresence({ gid: null, s: null, sh: null, ev: null, hi: null, en: null, wv: null, bm: null, dk: null });
  goMenu(); renderRoom(); show('sRoom'); pushLobbyPresence();
}

// ---------- sesja gry ----------
function makeNetSession(mode, gid) {
  const S = {
    host: NET.host, guest: !NET.host && mode === 'coop', mode, gid, seq: 0, ev: [], sh: [], hi: [], seen: {}, sendT: 0, lastHit: new Map(), dk: [0, null], prox: new Map(), hostPeer: null, lastEn: null,
    shot(w, x, y, a, multi, seed) { S.sh.push([++S.seq, W_IDX.indexOf(w), Math.round(x), Math.round(y), Math.round(a * 1000), multi, seed]); if (S.sh.length > 6) S.sh.shift(); },
    event(e) { S.ev.push([++S.seq].concat(e)); if (S.ev.length > 24) S.ev.shift(); },
    hit(id, dmg, burn) { S.hi.push([++S.seq, id, Math.round(dmg), burn || 0]); if (S.hi.length > 24) S.hi.shift(); S.lastHit.set(id, G.t); },
    pvpHit(peer, dmg) { S.hi.push([++S.seq, peer, Math.round(dmg)]); if (S.hi.length > 16) S.hi.shift(); },
    kill(e) { S.event(['k', e.id, Math.round(e.x), Math.round(e.y), T_IDX.indexOf(e.type)]); },
    died(killer) { S.dk = [S.dk[0] + 1, killer || null]; },
    tick(dt) { netTick(S, dt); }
  };
  return S;
}
function sendState(S) {
  const p = G.player;
  const flags = (p.dead ? 1 : 0) | (p.inv > 0 ? 2 : 0) | (p.moving ? 4 : 0);
  const o = { gid: S.gid, n: nick(), h: p.hero,
    s: [Math.round(p.x), Math.round(p.y), Math.round(p.aim * 100), Math.round(Math.max(0, p.hp)), Math.round(p.maxHp), flags, W_IDX.indexOf(p.weapons[p.wi]), G.pvp ? G.pvp.kills : 0],
    sh: S.sh.slice(), ev: S.ev.slice(), hi: S.hi.slice() };
  if (S.mode === 'pvp') o.dk = S.dk.slice();
  if (S.host && S.mode === 'coop') {
    o.en = G.enemies.slice(0, 40).map(e => [e.id, T_IDX.indexOf(e.type), Math.round(e.x), Math.round(e.y), Math.round(e.ang * 100), Math.round(clamp(e.hp / e.maxHp, 0, 1) * 100), Math.max(0, ST_IDX.indexOf(e.st)), Math.round(e.z || 0), e.burn > 0 ? 1 : 0]);
    o.wv = [G.wave, G.waves.length, G.queue.length + G.portals.length, G.over === 'win' ? 1 : G.over === 'lose' ? 2 : 0];
    o.bm = G.beams.map(b => [Math.round(b.x), Math.round(b.y), b.active ? 1 : 0].concat(b.angs.map(a => Math.round(a * 1000))));
  }
  let txt = JSON.stringify(o);
  while (txt.length > 3600 && (o.ev.length > 4 || (o.en && o.en.length > 8) || o.sh.length > 2)) {
    if (o.en && o.en.length > 8) o.en = o.en.slice(0, o.en.length - 4); else if (o.ev.length > 4) o.ev = o.ev.slice(2); else o.sh = o.sh.slice(1);
    txt = JSON.stringify(o);
  }
  NET.gr.presence(o).catch(() => {});
}
function remoteFor(pe) {
  let r = G.remotes.get(pe.peer);
  if (!r) {
    r = { peer: pe.peer, x: 0, y: 0, tx: 0, ty: 0, aim: 0, hp: 100, maxHp: 100, dead: false, inv: 0, vx: 0, vy: 0, r: 18, walk: 0, moving: false, kills: 0, init: false, nick: 'Gracz', hero: 'assault', wid: 'blaster' };
    G.remotes.set(pe.peer, r);
    const dk = pe.presence && Array.isArray(pe.presence.dk) ? num(pe.presence.dk[0]) : 0;
    G.net.seen[pe.peer] = { ev: 0, sh: 0, hi: 0, dk };
  }
  return r;
}
function netTick(S, dt) {
  const gr = NET.gr;
  if (!gr) { if (!G.over && S.mode !== 'solo') { G.over = 'lose'; G.overT = 0; G.netMsg = 'Utracono połączenie'; } return; }
  S.sendT -= dt;
  if (S.sendT <= 0) { S.sendT = .05; sendState(S); }
  const present = new Set();
  for (const pe of gr.peers()) {
    if (pe.sameTab) continue;
    const pr = pe.presence; if (!pr || pr.gid !== S.gid) continue;
    present.add(pe.peer);
    const r = remoteFor(pe), sn = S.seen[pe.peer];
    if (pr.host === 1) S.hostPeer = pe.peer;
    r.nick = String(pr.n || 'Gracz').slice(0, 16); r.hero = HEROES[pr.h] ? pr.h : 'assault';
    const s = pr.s;
    if (Array.isArray(s)) {
      r.tx = clamp(num(s[0]), 0, WW); r.ty = clamp(num(s[1]), 0, WH); r.aim = num(s[2]) / 100; r.hp = num(s[3]); r.maxHp = Math.max(1, num(s[4], 100));
      const f = num(s[5]) | 0; r.dead = !!(f & 1); r.inv = f & 2 ? 1 : 0; r.moving = !!(f & 4); r.wid = W_IDX[num(s[6]) | 0] || 'blaster'; r.kills = num(s[7]) | 0;
      if (!r.init) { r.x = r.tx; r.y = r.ty; r.init = true; }
    }
    if (Array.isArray(pr.sh)) for (const q of pr.sh) {
      if (!Array.isArray(q) || num(q[0]) <= sn.sh) continue; sn.sh = num(q[0]);
      const w = W_IDX[num(q[1]) | 0];
      if (w && !r.dead) { spawnShot(r, w, num(q[2]), num(q[3]), num(q[4]) / 1000, clamp(num(q[5]) | 0, 0, 3), num(q[6]) >>> 0, true); if (hyp(r.x - G.cam.x, r.y - G.cam.y) < 700) sfx(w); }
    }
    if (Array.isArray(pr.ev)) for (const q of pr.ev) {
      if (!Array.isArray(q) || num(q[0]) <= sn.ev) continue; sn.ev = num(q[0]);
      applyEvent(S, pe, q.slice(1));
    }
    if (Array.isArray(pr.hi)) for (const q of pr.hi) {
      if (!Array.isArray(q) || num(q[0]) <= sn.hi) continue; sn.hi = num(q[0]);
      if (S.mode === 'pvp') { if (q[1] === NET.myPeer && pAlive() && G.player.inv <= 0) hurtPlayer(clamp(num(q[2]), 0, 200), false, pe.peer); }
      else if (S.host) { const e = G.enemies.find(x => x.id === q[1]); if (e) hitEnemy(e, clamp(num(q[2]), 0, 5000), { remote: true, burnLv: clamp(num(q[3]) | 0, 0, 3) }); }
    }
    if (S.mode === 'pvp' && Array.isArray(pr.dk)) {
      const n = num(pr.dk[0]) | 0;
      if (n > sn.dk) {
        sn.dk = n;
        const byMe = pr.dk[1] === NET.myPeer;
        if (byMe) { G.pvp.kills++; save.stats.pvpKills++; G.banner = { title: 'Eliminacja!', sub: r.nick, t: 1.4, max: 1.4 }; sfx('kill'); }
        const killer = byMe ? 'Ty' : (G.remotes.get(pr.dk[1]) || {}).nick || '?';
        G.feed.push({ text: killer + ' → ' + r.nick, t: 5 });
        gibs(r.x, r.y, ['#c9d6e8', '#5b6a84', '#ff4d6d'], 20, 300); flash(r.x, r.y, 200, '#ff4d6d', .3);
      }
    }
    if (S.guest && pr.host === 1) applyHostState(S, pr);
  }
  for (const [k] of G.remotes) if (!present.has(k)) {
    G.remotes.delete(k);
    if (S.guest && k === S.hostPeer && !G.over) { G.over = 'lose'; G.overT = 0; G.netMsg = 'Gospodarz opuścił grę'; }
  }
  for (const r of G.remotes.values()) {
    const ox = r.x, oy = r.y, k = Math.min(1, dt * 12);
    if (hyp(r.tx - r.x, r.ty - r.y) > 300) { r.x = r.tx; r.y = r.ty; } else { r.x = lerp(r.x, r.tx, k); r.y = lerp(r.y, r.ty, k); }
    r.vx = (r.x - ox) / Math.max(dt, 1e-3); r.vy = (r.y - oy) / Math.max(dt, 1e-3);
    if (r.moving) r.walk += dt * 14;
  }
  if (G.feed) { for (const f of G.feed) f.t -= dt; G.feed = G.feed.filter(f => f.t > 0).slice(-4); }
  if (S.guest) updateProxies(S, dt);
}
function applyEvent(S, pe, e) {
  const fromHost = S.guest && pe.presence && pe.presence.host === 1;
  switch (e[0]) {
    case 'g': G.grenades.push({ x0: num(e[1]), y0: num(e[2]), x1: num(e[3]), y1: num(e[4]), t: 0, dur: .65, x: num(e[1]), y: num(e[2]), z: 0, mine: false }); break;
    case 't': placeTurret(clamp(num(e[1]), M, WW - M), clamp(num(e[2]), M, WH - M), false); break;
    case 'f': placeField(clamp(num(e[1]), M, WW - M), clamp(num(e[2]), M, WH - M), false); break;
  }
  if (!fromHost) return;
  switch (e[0]) {
    case 'e': fireFan(num(e[1]), num(e[2]), num(e[3]), clamp(num(e[4]) | 0, 0, 40), num(e[5]), clamp(num(e[6]), 50, 1200), clamp(num(e[7]), 0, 200), clamp(num(e[8]), 3, 14), okColor(e[9]), true); sfx('eshot'); break;
    case 'x': explode(num(e[1]), num(e[2]), clamp(num(e[3]), 10, 200), clamp(num(e[4]), 0, 200), 'enemy', okColor(e[5]), false, true); break;
    case 'h': G.hazards.push({ x: num(e[1]), y: num(e[2]), r: 55, temp: 5 }); break;
    case 'T': G.teles.push({ x: num(e[1]), y: num(e[2]), r: clamp(num(e[3]), 10, 200), t: 0, dur: clamp(num(e[4]), .1, 3), color: '#ff3d5a' }); break;
    case 'p': if (EDEF[e[1]]) { G.portals.push({ type: e[1], x: num(e[2]), y: num(e[3]), t: 0, dur: e[4] ? 2.2 : .9, boss: !!e[4], visual: true }); sfx('portal'); } break;
    case 'k': {
      const id = e[1], type = T_IDX[num(e[4]) | 0];
      const px = S.prox.get(id); if (px) { px.dead = true; S.prox.delete(id); }
      G.enemies = G.enemies.filter(x => !x.dead);
      if (type) { const mine = S.lastHit.has(id) && G.t - S.lastHit.get(id) < 1.5; enemyDeathFx(num(e[2]), num(e[3]), type, mine); if (mine && G.player.mods.vamp) healPlayer(G.player.mods.vamp); }
      break;
    }
    case 'b': if (EDEF[e[1]]) { G.banner = { title: EDEF[e[1]].name, sub: 'Boss nadchodzi', t: 3, max: 3, boss: true }; sfx('roar'); G.shake = 10; music.intense = 1; } break;
  }
}
function mkProxy(id, type, x, y) {
  const d = EDEF[type];
  return { id, type, d, x, y, tx: x, ty: y, vx: 0, vy: 0, kx: 0, ky: 0, r: d.r, hp: d.hp, maxHp: d.hp, ang: 0, t: 0, walk: rand(0, 6), flash: 0, st: 'move', stT: .3, touchCD: 0, burn: 0, orbCD: 0, hb: 0, z: 0, dead: false, proxy: true };
}
function applyHostState(S, pr) {
  if (Array.isArray(pr.en) && pr.en !== S.lastEn) {
    S.lastEn = pr.en;
    const ids = new Set();
    for (const q of pr.en) {
      if (!Array.isArray(q)) continue;
      const id = q[0]; ids.add(id);
      let e = S.prox.get(id);
      if (!e) { const type = T_IDX[num(q[1]) | 0]; if (!type) continue; e = mkProxy(id, type, num(q[2]), num(q[3])); S.prox.set(id, e); G.enemies.push(e); }
      e.tx = num(q[2]); e.ty = num(q[3]); e.ang = num(q[4]) / 100; e.hp = clamp(num(q[5]), 0, 100) / 100 * e.maxHp; e.st = ST_IDX[num(q[6]) | 0] || 'move'; e.z = num(q[7]); e.burn = q[8] ? 1 : 0;
    }
    for (const [id, e] of S.prox) if (!ids.has(id)) { S.prox.delete(id); e.dead = true; }
    G.enemies = G.enemies.filter(e => !e.dead);
  }
  if (Array.isArray(pr.wv)) {
    G.wave = num(pr.wv[0]) | 0; G.queue = new Array(clamp(num(pr.wv[2]) | 0, 0, 500));
    const ov = num(pr.wv[3]) | 0;
    if (ov === 1 && !G.over) win(); else if (ov === 2 && !G.over) { G.over = 'lose'; G.overT = 0; sfx('lose'); }
  }
  G.beams = Array.isArray(pr.bm) ? pr.bm.filter(Array.isArray).map(b => ({ x: num(b[0]), y: num(b[1]), active: !!b[2], angs: b.slice(3, 6).map(a => num(a) / 1000) })) : [];
  G.boss = G.enemies.find(e => e.d.boss) || null;
}
function updateProxies(S, dt) {
  const p = G.player;
  for (const e of G.enemies) {
    const ox = e.x, oy = e.y, k = Math.min(1, dt * 12);
    if (hyp(e.tx - e.x, e.ty - e.y) > 250) { e.x = e.tx; e.y = e.ty; } else { e.x = lerp(e.x, e.tx, k); e.y = lerp(e.y, e.ty, k); }
    e.vx = (e.x - ox) / Math.max(dt, 1e-3); e.vy = (e.y - oy) / Math.max(dt, 1e-3);
    if (Math.abs(e.vx) + Math.abs(e.vy) > 5) e.walk += dt * hyp(e.vx, e.vy) * .08;
    e.t += dt; e.flash -= dt; e.hb -= dt; e.touchCD -= dt; e.orbCD -= dt; e.jump = e.z > 5;
    if (pAlive() && !G.over && !e.jump && e.touchCD <= 0 && e.type !== 'drone' && e.type !== 'sniper' && hyp(p.x - e.x, p.y - e.y) < e.r + p.r - 2) { hurtPlayer((e.st === 'charge' ? e.d.dmg * 1.5 : e.d.dmg) * G.dmgMul); e.touchCD = .7; }
  }
  for (const b of G.beams) if (b.active) beamHit(b.x, b.y, b.angs, 22 * G.dmgMul * .9);
}

// ---------- ranking ----------
async function submitScore(fields) {
  if (!NET.db || !NET.uid) return;
  try {
    const ref = NET.db.doc('lb/' + NET.uid);
    const snap = await ref.get();
    const cur = snap.exists ? Object.assign({}, snap.data()) : {};
    const next = Object.assign({}, cur, { n: nick(), upd: Date.now() });
    for (const k of ['surv', 'survKills', 'pvpWins', 'pvpKills', 'stars']) if (fields[k] !== undefined) next[k] = Math.max(num(cur[k]), fields[k]);
    if (fields.daily !== undefined) { if (cur.dailyDay === fields.dailyDay) next.daily = Math.max(num(cur.daily), fields.daily); else { next.daily = fields.daily; next.dailyDay = fields.dailyDay; } }
    await ref.set(next);
  } catch (e) {}
}
async function loadRanking(tab) {
  const box = $('rankList');
  if (!NET.db) { box.innerHTML = '<p class="hint">Ranking działa po otwarciu gry w aplikacji Claude, gdy jesteś zalogowany.</p>'; return; }
  box.innerHTML = '<p class="hint">Wczytywanie…</p>';
  try {
    let q = NET.db.collection('lb');
    const field = tab === 'daily' ? 'daily' : tab === 'pvp' ? 'pvpWins' : 'surv';
    if (tab === 'daily') q = q.where('dailyDay', '==', todayKey());
    q = q.orderBy(field, 'desc').limit(25);
    const snap = await q.get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => num(r[field]) > 0);
    if (!rows.length) { box.innerHTML = '<p class="hint">Jeszcze nikt tu nie trafił. Zagraj i bądź pierwszy!</p>'; return; }
    const unit = tab === 'daily' ? 'pkt' : tab === 'pvp' ? 'wygr.' : 'fal';
    box.innerHTML = '';
    rows.forEach((r, i) => {
      const row = document.createElement('div'); row.className = 'rankRow cutbox' + (r.id === NET.uid ? ' me' : '');
      const pos = document.createElement('b'); pos.textContent = '#' + (i + 1);
      const nm = document.createElement('span'); nm.textContent = String(r.n || 'Gracz').slice(0, 16) + (r.id === NET.uid ? ' (ty)' : '');
      const val = document.createElement('em'); val.textContent = num(r[field]) + ' ' + unit;
      row.append(pos, nm, val); box.appendChild(row);
    });
  } catch (e) { box.innerHTML = '<p class="hint">Nie udało się wczytać rankingu. Spróbuj ponownie później.</p>'; }
}
