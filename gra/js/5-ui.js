'use strict';
// ================= Ekrany i sterowanie =================
let state = 'menu', curScreen = 'sMenu';
const $ = id => document.getElementById(id);
const SCREENS = ['sHelp', 'sMenu', 'sLevels', 'sShop', 'sSet', 'sLvlUp', 'sPause', 'sResult', 'sOnline', 'sRoom', 'sRank', 'sAch', 'sDaily'];
function show(id) { curScreen = id; for (const s of SCREENS) $(s).hidden = s !== id; refreshCoins(); }
function refreshCoins() { $('mCoins').textContent = save.coins; document.querySelectorAll('.coinVal').forEach(e => e.textContent = save.coins); }
const touchSticks = { move: { id: null, ox: 0, oy: 0 }, aim: { id: null, ox: 0, oy: 0, t0: 0, max: 0 } };
function resetInput() { input.mx = input.my = input.ax = input.ay = 0; input.aiming = false; input.mouseDown = false; touchSticks.move.id = touchSticks.aim.id = null; }
function toast(html) {
  const box = $('toast'), d = document.createElement('div'); d.innerHTML = html; box.appendChild(d);
  setTimeout(() => d.remove(), 3200);
}
function checkAch() {
  for (const a of ACHS) if (!save.ach[a.id] && a.test(save)) { save.ach[a.id] = 1; save.coins += a.reward; save.cos.crates.c++; toast('Achievement: <b>' + a.name + '</b> · +' + a.reward + ' coins and a crate'); sfx('lvl'); }
  for (const it of unlockAchItems()) toast('New item: <b>' + it.name + '</b>');
  persist(); refreshCoins(); if (typeof updateCrateDot === 'function') updateCrateDot();
}
const online = () => !!(G && G.net);

// ---------- Menu ----------
function goMenu() { state = 'menu'; resetInput(); newGame(ri(0, 2) * 3, true); show('sMenu'); refreshDailySub(); if (typeof updateCrateDot === 'function') updateCrateDot(); }
function refreshDailySub() { const d = dailySpec(); $('dailySub').textContent = d.names.join(' + '); }
function buildLevels() {
  const box = $('biomes'); box.innerHTML = '';
  BIOMES.forEach((b, bi) => {
    const card = document.createElement('div'); card.className = 'biome cutbox';
    card.style.setProperty('--bg', b.css); card.style.setProperty('--acc', b.accent);
    let nodes = '';
    for (let k = 0; k < 3; k++) {
      const li = bi * 3 + k, L = LEVELS[li], locked = li > save.unlocked, st = save.stars[li];
      const stars = [0, 1, 2].map(i => svg('star', 'fill="' + (i < st ? '#ffc93c' : 'rgba(255,255,255,.18)') + '"')).join('');
      nodes += '<button type="button" class="node' + (L.boss ? ' boss' : '') + (li === save.unlocked ? ' cur' : '') + '" data-li="' + li + '"' + (locked ? ' disabled aria-label="Locked"' : '') + '>' +
        (locked ? svg('lock', 'class="lock" style="color:#8ea3c4"') : '<b>' + (L.boss ? 'BOSS' : (li + 1)) + '</b><span class="stars">' + stars + '</span>') + '</button>';
    }
    card.innerHTML = '<h3>' + b.name + '</h3><p>' + b.sub + '</p><div class="nodes">' + nodes + '</div>';
    box.appendChild(card);
  });
  box.querySelectorAll('.node:not([disabled])').forEach(n => n.addEventListener('click', () => { sfx('click'); startLevel(+n.dataset.li); }));
}
let shopTab = 'w';
function buyRow(list, opts) {
  const row = document.createElement('div'); row.className = 'item cutbox' + (opts.own ? ' own' : '');
  row.appendChild(opts.icon);
  row.insertAdjacentHTML('beforeend', '<div><h4' + (opts.color ? ' style="color:' + opts.color + '"' : '') + '>' + opts.name + '</h4><p>' + opts.desc + '</p>' + (opts.pips || '') + '</div>');
  const b = document.createElement('button'); b.type = 'button';
  if (opts.tag) { b.className = 'btn small ghost'; b.disabled = !opts.onTag; b.innerHTML = '<span class="tag">' + opts.tag + '</span>'; if (opts.onTag) b.addEventListener('click', opts.onTag); }
  else { b.className = 'btn small primary'; b.innerHTML = '<span class="price"><i class="coin"></i>' + opts.price + '</span>'; b.disabled = save.coins < opts.price;
    b.addEventListener('click', () => { if (save.coins < opts.price) return; save.coins -= opts.price; opts.buy(); persist(); sfx('coin'); checkAch(); buildShop(); refreshCoins(); }); }
  row.appendChild(b); list.appendChild(row);
}
function buildShop() {
  document.querySelectorAll('#shopTabs .btn').forEach(b => b.classList.toggle('on', b.dataset.tab === shopTab));
  const wl = $('wList'); wl.innerHTML = '';
  if (shopTab === 'w') for (const k of WEAPON_KEYS) {
    const w = WEAPONS[k], own = save.weapons.includes(k);
    const cvs = mk(144, 72); const g = cvs.getContext('2d'); g.scale(3, 3); g.translate(4, 12); g.lineJoin = 'round'; drawWeapon(g, k);
    g.globalCompositeOperation = 'lighter'; g.drawImage(glowSpr(w.color), 6, -10, 30, 20);
    const dps = Math.round(w.dmg * w.pellets * w.rate);
    buyRow(wl, { icon: cvs, own, color: w.color, name: w.name, desc: w.desc + '<br>DPS: ' + dps + ' · Magazine: ' + w.mag, tag: own ? 'Owned' : null, price: w.price, buy: () => save.weapons.push(k) });
  }
  else for (const k of HERO_KEYS) {
    const h = HEROES[k], own = save.heroes.includes(k), sel = save.hero === k;
    const cvs = mk(144, 72); const g = cvs.getContext('2d'); const s = playerSpr(k, 'rifle'); g.drawImage(s.c, 72 - 46, 36 - 46, 92, 92);
    buyRow(wl, { icon: cvs, own, color: h.visor, name: h.name + ' · ' + h.ability, desc: h.desc, tag: sel ? 'Selected' : own ? 'Select' : null, price: h.price,
      onTag: own && !sel ? () => { save.hero = k; persist(); sfx('click'); buildShop(); } : null, buy: () => { save.heroes.push(k); save.hero = k; } });
  }
  const ul = $('uList'); ul.innerHTML = '';
  for (const k of Object.keys(UPGRADES)) {
    const up = UPGRADES[k], lv = save.upg[k], max = lv >= up.max;
    const ic = document.createElement('div'); ic.className = 'ic'; ic.innerHTML = svg(up.icon);
    buyRow(ul, { icon: ic, name: up.name, desc: up.desc, pips: '<div class="pips">' + Array.from({ length: up.max }, (_, i) => '<i' + (i < lv ? ' class="on"' : '') + '></i>').join('') + '</div>', tag: max ? 'Max' : null, price: up.cost(lv), buy: () => save.upg[k]++ });
  }
}
let confirmReset = false;
function buildSettings() {
  const box = $('setList'); box.innerHTML = '';
  const rows = [
    ['diff', 'Difficulty', 'Easy: weaker, slower-hitting enemies. Hard: tougher enemies, +25% coins', v => ({ easy: 'Easy', normal: 'Normal', hard: 'Hard' })[v], v => ({ easy: 'normal', normal: 'hard', hard: 'easy' })[v], v => v !== 'normal'],
    ['quality', 'Graphics', 'High: dynamic lighting and more effects. Low: smoother on older phones', v => v === 'high' ? 'High' : 'Low', v => v === 'high' ? 'low' : 'high', v => v === 'high'],
    ['ui', 'Interface size', 'Size of buttons and joysticks during play', v => ({ s: 'Small', m: 'Medium', l: 'Large' })[v], v => ({ s: 'm', m: 'l', l: 's' })[v], v => v !== 'm'],
    ['lefty', 'Left-handed controls', 'Swaps the joysticks: aim on the left, move on the right', v => v ? 'On' : 'Off', v => !v, v => v],
    ['auto', 'Auto-fire', 'Shoots the nearest enemy when you are not aiming', v => v ? 'On' : 'Off', v => !v, v => v],
    ['shake', 'Screen shake', 'Turn off if camera shaking is uncomfortable', v => v ? 'On' : 'Off', v => !v, v => v],
    ['vibe', 'Vibration', 'Phone buzzes when you take damage (supported phones only)', v => v ? 'On' : 'Off', v => !v, v => v],
    ['sfx', 'Sound effects', '', v => v ? 'On' : 'Off', v => !v, v => v],
    ['music', 'Music', '', v => v ? 'On' : 'Off', v => !v, v => v]
  ];
  for (const [k, name, sub, lab, next, isOn] of rows) {
    const r = document.createElement('div'); r.className = 'setRow cutbox';
    r.innerHTML = '<span>' + name + (sub ? '<small>' + sub + '</small>' : '') + '</span>';
    const b = document.createElement('button'); b.type = 'button'; b.id = 'set-' + k;
    const on = isOn(save.settings[k]);
    b.className = 'btn small toggle' + (on ? ' on' : ''); b.textContent = lab(save.settings[k]);
    b.addEventListener('click', () => { save.settings[k] = next(save.settings[k]); persist(); sfx('click'); if (k === 'quality' || k === 'ui') resize(); buildSettings(); });
    r.appendChild(b); box.appendChild(r);
  }
  const r = document.createElement('div'); r.className = 'setRow cutbox';
  r.innerHTML = '<span>Game progress<small>Erases missions, coins, purchases, items and achievements</small></span>';
  const c = document.createElement('div'); c.className = 'confirm';
  if (!confirmReset) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small ghost'; b.textContent = 'Reset'; b.addEventListener('click', () => { confirmReset = true; buildSettings(); }); c.appendChild(b); }
  else {
    const y = document.createElement('button'); y.type = 'button'; y.className = 'btn small'; y.style.setProperty('--bg', '#c4142e'); y.textContent = 'Yes, erase';
    y.addEventListener('click', () => { const st = save.settings, nk = save.nick; save = JSON.parse(JSON.stringify(DEF_SAVE)); save.settings = st; save.nick = nk; persist(); confirmReset = false; buildSettings(); refreshCoins(); });
    const n = document.createElement('button'); n.type = 'button'; n.className = 'btn small ghost'; n.textContent = 'Cancel'; n.addEventListener('click', () => { confirmReset = false; buildSettings(); });
    c.appendChild(y); c.appendChild(n);
  }
  r.appendChild(c); box.appendChild(r);
}
function buildAch() {
  const s = save.stats;
  const stats = [['Enemies defeated', s.kills], ['Bosses', s.bosses], ['Best survival', s.survBest + ' waves'], ['PvP kills', s.pvpKills], ['PvP wins', s.pvpWins], ['Co-op wins', s.coopWins], ['Games played', s.games], ['Coins earned', s.coinsEarned], ['Barrels blown', s.barrels], ['Deaths', s.deaths]];
  $('statGrid').innerHTML = stats.map(([k, v]) => '<div><b>' + v + '</b>' + k + '</div>').join('');
  const got = ACHS.filter(a => save.ach[a.id]).length;
  $('achCount').textContent = 'Achievements ' + got + ' / ' + ACHS.length;
  $('achList').innerHTML = ACHS.map(a => '<div class="achRow cutbox' + (save.ach[a.id] ? '' : ' locked') + '"><span class="ic">' + svg(save.ach[a.id] ? 'star' : 'lock', 'fill="currentColor"') + '</span><div><h4>' + a.name + '</h4><p>' + a.desc + '</p></div><span class="price"><i class="coin"></i>' + a.reward + '</span></div>').join('');
}
function showDaily() {
  const d = dailySpec();
  $('dKick').textContent = 'Daily Challenge · ' + d.key;
  $('dTitle').textContent = BIOMES[d.biome].name;
  $('dMods').innerHTML = d.names.map((n, i) => '<div class="mod cutbox"><b>' + n + '</b><span>' + d.descs[i] + '</span></div>').join('');
  $('dBest').textContent = save.daily.day === d.key && save.daily.best ? 'Your best today: ' + save.daily.best + ' pts' : 'Same map and modifiers for every player. Your score goes on the leaderboard.';
  show('sDaily');
}

// ---------- Online: ekrany ----------
function showOnline() { show('sOnline'); $('nickIn').value = save.nick; initOnline(); refreshOnlineUI(); }
function refreshOnlineUI() {
  const st = $('onlineStatus'); if (!st) return;
  const ok = NET.ok;
  st.textContent = !NET.done ? 'Connecting…' : ok ? 'Connected. Create a room or join your friends.' : 'Online play works in the Claude app for signed-in people you share this game with (Share menu). You can still play every other mode here.';
  for (const id of ['bHostCoop', 'bHostPvp', 'bJoin']) $(id).disabled = !ok;
  renderOpenRooms();
  const badge = $('onlineBadge'), n = NET.lobbyPeers.length;
  badge.hidden = !ok || n < 1; badge.textContent = n + ' online';
}
function renderOpenRooms() {
  const box = $('roomList'); if (!box) return;
  box.innerHTML = '';
  const rooms = NET.lobbyPeers.filter(p => !p.sameTab && p.presence && p.presence.host && typeof p.presence.host === 'object');
  $('onlineBadge').textContent = NET.lobbyPeers.length + ' online'; $('onlineBadge').hidden = !NET.ok || !NET.lobbyPeers.length;
  if (!rooms.length) { box.innerHTML = '<p class="hint">' + (NET.ok ? 'No open rooms. Create your own!' : 'Not available in this view.') + '</p>'; return; }
  for (const p of rooms) {
    const h = p.presence.host, code = cleanCode(h.c); if (!code) continue;
    const row = document.createElement('div'); row.className = 'roomRow cutbox';
    const a = document.createElement('b'); a.textContent = MODE_NAMES[h.m] || 'Game';
    const nm = document.createElement('span'); nm.textContent = String(p.presence.n || 'Player').slice(0, 16) + ' · ' + (h.m === 'pvp' ? 'arena' : 'mission ' + (clamp(num(h.l) | 0, 0, 8) + 1)) + ' · ' + clamp(num(h.k) | 0, 1, 9) + ' players' + (h.o ? '' : ' · in game');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small primary'; b.textContent = 'Join';
    b.addEventListener('click', () => { sfx('click'); joinRoom(code, false); });
    row.append(a, nm, b); box.appendChild(row);
  }
}
function renderRoom() {
  if (!NET.gr) return;
  const h = NET.host ? null : hostPeer();
  const mode = NET.host ? NET.mode : (h && h.presence.m) || 'coop';
  const li = NET.host ? NET.li : clamp(num(h && h.presence.l) | 0, 0, 8);
  $('roomTitle').textContent = (MODE_NAMES[mode] || 'Room');
  $('roomCode').textContent = NET.code.toUpperCase();
  const pl = $('plist'); pl.innerHTML = '';
  for (const p of NET.peers) {
    const pr = p.presence || {};
    const row = document.createElement('div'); row.className = 'prow cutbox';
    const dot = document.createElement('i'); dot.style.background = (HEROES[pr.h] || HEROES.assault).visor;
    const nm = document.createElement('span'); nm.textContent = String(pr.n || 'Player').slice(0, 16) + (p.sameTab ? ' (you)' : '');
    const tag = document.createElement('small'); tag.textContent = (pr.host === 1 ? 'host · ' : '') + (COS[pr.t] && COS[pr.t].cat === 'title' ? COS[pr.t].name + ' · ' : '') + (HEROES[pr.h] || HEROES.assault).name + (pr.gid ? ' · in game' : '');
    row.append(dot, nm, tag); pl.appendChild(row);
  }
  const ctl = $('roomCtl'); ctl.innerHTML = '';
  if (NET.host) {
    ctl.insertAdjacentHTML('beforeend', '<h3>Mode</h3>');
    const tabs = document.createElement('div'); tabs.className = 'tabs';
    for (const m of ['coop', 'pvp']) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (m === mode ? ' on' : ''); b.textContent = MODE_NAMES[m]; b.addEventListener('click', () => { NET.mode = m; roomPresence(); pushLobbyPresence(); renderRoom(); }); tabs.appendChild(b); }
    ctl.appendChild(tabs);
    if (mode === 'coop') {
      ctl.insertAdjacentHTML('beforeend', '<h3>Mission</h3>');
      const f = document.createElement('div'); f.className = 'field';
      const sel = document.createElement('select'); sel.id = 'missionSel';
      for (let i = 0; i <= save.unlocked; i++) { const o = document.createElement('option'); o.value = i; o.textContent = 'Mission ' + (i + 1) + ' · ' + BIOMES[LEVELS[i].biome].name + (LEVELS[i].boss ? ' (boss)' : ''); if (i === li) o.selected = true; sel.appendChild(o); }
      sel.addEventListener('change', () => { NET.li = +sel.value; roomPresence(); pushLobbyPresence(); });
      f.appendChild(sel); ctl.appendChild(f);
      ctl.insertAdjacentHTML('beforeend', '<p class="hint">More enemies spawn for each player. Fallen players respawn after 10 s if someone on the team survives.</p>');
    } else ctl.insertAdjacentHTML('beforeend', '<p class="hint">Free-for-all. First to 10 kills wins; matches last up to 5 minutes. You use your purchased weapons and hero ability.</p>');
    const go = document.createElement('button'); go.type = 'button'; go.className = 'btn primary'; go.textContent = 'Start'; go.addEventListener('click', () => { sfx('click'); hostStart(); });
    ctl.appendChild(go);
  } else {
    ctl.insertAdjacentHTML('beforeend', '<h3>Host settings</h3>');
    const p = document.createElement('p'); p.className = 'hint';
    p.textContent = h ? (MODE_NAMES[mode] + (mode === 'coop' ? ' · mission ' + (li + 1) + ' · ' + BIOMES[LEVELS[li].biome].name : '') + '. The game starts when the host presses Start.') : 'Waiting for the room host…';
    ctl.appendChild(p);
  }
  const hh = document.createElement('p'); hh.className = 'hint'; hh.textContent = 'Your hero: ' + HEROES[save.hero].name + ' (change it in the Armory).'; ctl.appendChild(hh);
}

// ---------- Rozgrywka ----------
function enterFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen && !document.fullscreenElement && matchMedia('(pointer: coarse)').matches)
    el.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
}
function beginPlay() { state = 'play'; show(null); music.intense = 0; save.stats.games++; }
function startLevel(li) {
  ensureAudio(); enterFullscreen(); resetInput();
  newGame(li, false, { mode: 'mission' });
  G.banner = { title: 'Mission ' + (li + 1), sub: BIOMES[LEVELS[li].biome].name + (LEVELS[li].boss ? ' · boss fight' : ''), t: 2.4, max: 2.4 };
  G.waveDelay = 2.2; beginPlay();
}
function startSurvival() {
  ensureAudio(); enterFullscreen(); resetInput();
  newGame(0, false, { mode: 'survival', biome: ri(0, 2) });
  G.banner = { title: 'Survival', sub: 'A boss arrives every 5 waves. How long can you last?', t: 2.6, max: 2.6 };
  G.waveDelay = 2.2; beginPlay();
}
function startDaily() {
  const d = dailySpec();
  ensureAudio(); enterFullscreen(); resetInput();
  newGame(0, false, { mode: 'daily', biome: d.biome, seed: d.seed, mods: d.mods });
  if (save.daily.day !== d.key) { save.daily.day = d.key; save.daily.best = 0; }
  save.daily.tries++;
  G.banner = { title: 'Daily Challenge', sub: d.names.join(' · '), t: 2.6, max: 2.6 };
  G.waveDelay = 2.2; beginPlay();
}
function restartCurrent() {
  if (G.mode === 'survival') startSurvival(); else if (G.mode === 'daily') startDaily(); else startLevel(G.li);
}
function openLevelUp() {
  state = 'levelup'; resetInput(); sfx('lvl');
  const p = G.player;
  const avail = PERKS.filter(k => (p.perkLv[k.id] || 0) < k.max);
  const choice = shuffle(avail.slice()).slice(0, 3);
  $('luTitle').textContent = 'Level ' + (p.lvl - G.pendingLvl + 1);
  $('luKick').textContent = online() ? 'Level up · the game keeps going!' : 'Level up';
  const box = $('perks'); box.innerHTML = '';
  for (const k of choice) {
    const lv = p.perkLv[k.id] || 0;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'perk'; b.style.setProperty('--c', k.c);
    b.innerHTML = '<span class="pic">' + svg(k.icon) + '</span><h4>' + k.name + '</h4><p>' + k.desc + '</p><span class="lv">' + (lv ? 'Lv ' + (lv + 1) + ' / ' + k.max : 'New') + '</span>';
    b.addEventListener('click', () => {
      applyPerk(k.id); G.pendingLvl--; sfx('click');
      if (G.pendingLvl > 0) openLevelUp(); else { state = 'play'; show(null); }
    });
    box.appendChild(b);
  }
  if (!choice.length) { G.pendingLvl = 0; healPlayer(30); state = 'play'; show(null); return; }
  show('sLvlUp');
}
function pauseGame() {
  if (state !== 'play') return;
  state = 'paused'; resetInput();
  const p = G.player, box = $('pausePerks');
  box.innerHTML = Object.keys(p.perkLv).map(id => { const k = PERKS.find(x => x.id === id); return '<span>' + svg(k.icon) + k.name + ' ' + p.perkLv[id] + '</span>'; }).join('') || '<span>No perks yet – collect XP crystals</span>';
  $('bRestart').hidden = online();
  $('bQuit').textContent = online() ? 'Leave game' : 'Quit';
  show('sPause');
}
function finishLevel() {
  const won = G.over === 'win', li = G.li, p = G.player, mode = G.mode;
  let bonus = 0, stars = 0, title, kick, stats;
  const s = Math.floor(G.t), time = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  if (mode === 'mission' || mode === 'coop') {
    if (won) {
      bonus = 120 + li * 50; stars = p.hp >= p.maxHp * .66 ? 3 : p.hp >= p.maxHp * .33 ? 2 : 1;
      if (mode === 'mission') { save.stars[li] = Math.max(save.stars[li], stars); if (li === save.unlocked && li < 8) save.unlocked = li + 1; }
      else { save.stats.coopWins++; stars = 0; }
    }
    kick = (mode === 'coop' ? 'Co-op · ' : '') + 'Mission ' + (li + 1) + ' · ' + G.B.name;
    title = won ? (li === 8 && mode === 'mission' ? 'Zone cleared!' : 'Mission complete') : (G.netMsg || 'You fell');
    stats = [[G.kills, 'Defeated'], [p.lvl, 'Level'], [time, 'Time']];
  } else if (mode === 'pvp') {
    const rem = [...G.remotes.values()], rank = 1 + rem.filter(r => (r.kills || 0) > G.pvp.kills).length;
    if (won) { save.stats.pvpWins++; bonus = 200; } else bonus = 40 + G.pvp.kills * 15;
    kick = 'PvP Duel'; title = G.netMsg || (won ? 'Victory!' : 'Place #' + rank);
    stats = [[G.pvp.kills, 'Kills'], [G.pvp.deaths, 'Deaths'], [time, 'Time']];
    submitScore({ pvpWins: save.stats.pvpWins, pvpKills: save.stats.pvpKills });
  } else {
    const waves = Math.max(0, G.wave);
    bonus = waves * 15;
    if (mode === 'survival') { save.stats.survBest = Math.max(save.stats.survBest, waves); submitScore({ surv: waves, survKills: G.kills }); }
    else { save.daily.best = Math.max(save.daily.best, G.score); submitScore({ daily: G.score, dailyDay: todayKey() }); }
    kick = mode === 'daily' ? 'Daily Challenge · ' + todayKey() : 'Survival · ' + G.B.name;
    title = 'You survived ' + waves + (waves === 1 ? ' wave' : ' waves');
    stats = [[G.score, 'Score'], [G.kills, 'Defeated'], [time, 'Time']];
  }
  if (mode !== 'pvp') bonus = Math.round(bonus * DIFF().coin);
  save.coins += G.coins + bonus; save.stats.coinsEarned += G.coins + bonus;
  gameRewards(mode, won, Math.max(0, G.wave));
  persist(); checkAch();
  state = 'result'; resetInput();
  $('rKick').textContent = kick;
  $('rTitle').textContent = title;
  $('rTitle').style.color = won || G.endless ? '' : '#ff8aa0';
  $('rStars').innerHTML = stars ? [0, 1, 2].map(i => svg('star', 'fill="' + (i < stars ? '#ffc93c' : 'rgba(255,255,255,.15)') + '"' + (i < stars ? ' style="filter:drop-shadow(0 0 10px rgba(255,200,60,.7))"' : ''))).join('') : '';
  $('rStats').innerHTML = stats.map(([v, k]) => '<div><b>' + v + '</b>' + k + '</div>').join('') + '<div><b style="color:#ffe08a">+' + (G.coins + bonus) + '</b>Coins</div>';
  const btns = $('rBtns'); btns.innerHTML = '';
  const add = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = label; b.addEventListener('click', () => { sfx('click'); fn(); }); btns.appendChild(b); };
  if (online()) {
    add('Back to room', 'primary', () => { if (NET.gr) backToRoom(); else { goMenu(); showOnline(); } });
    add('Menu', 'ghost', () => { leaveRoom(); G.net = null; goMenu(); });
  } else {
    if (mode === 'mission' && won && li < 8) add('Next mission', 'primary', () => startLevel(li + 1));
    add(won && mode === 'mission' ? 'Replay' : 'Play again', mode === 'mission' && won && li < 8 ? '' : 'primary', restartCurrent);
    if (G.endless) add('Leaderboard', 'ghost', () => { goMenu(); openRank(mode === 'daily' ? 'daily' : 'surv'); });
    add('Armory', 'ghost', () => { goMenu(); buildShop(); show('sShop'); });
    add('Menu', 'ghost', () => goMenu());
  }
  show('sResult');
}
let rankTab = 'surv';
function openRank(tab) { rankTab = tab || rankTab; document.querySelectorAll('#rankTabs .btn').forEach(b => b.classList.toggle('on', b.dataset.tab === rankTab)); show('sRank'); initOnline().then(() => loadRanking(rankTab)); loadRanking(rankTab); }

$('bPlay').addEventListener('click', () => { ensureAudio(); sfx('click'); buildLevels(); show('sLevels'); });
$('bSurv').addEventListener('click', () => { sfx('click'); startSurvival(); });
$('bDaily').addEventListener('click', () => { ensureAudio(); sfx('click'); showDaily(); });
$('bDailyGo').addEventListener('click', () => { sfx('click'); startDaily(); });
$('bOnline').addEventListener('click', () => { ensureAudio(); sfx('click'); showOnline(); });
$('bShop').addEventListener('click', () => { ensureAudio(); sfx('click'); buildShop(); show('sShop'); });
$('bAch').addEventListener('click', () => { ensureAudio(); sfx('click'); buildAch(); show('sAch'); });
$('bRank').addEventListener('click', () => { ensureAudio(); sfx('click'); openRank(); });
$('bSet').addEventListener('click', () => { ensureAudio(); sfx('click'); confirmReset = false; buildSettings(); show('sSet'); });
document.querySelectorAll('#shopTabs .btn').forEach(b => b.addEventListener('click', () => { shopTab = b.dataset.tab; sfx('click'); buildShop(); }));
document.querySelectorAll('#rankTabs .btn').forEach(b => b.addEventListener('click', () => { sfx('click'); openRank(b.dataset.tab); }));
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { sfx('click'); show('sMenu'); }));
$('nickIn').addEventListener('change', () => { save.nick = $('nickIn').value.replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 14); $('nickIn').value = save.nick; persist(); pushLobbyPresence(); roomPresence(); });
$('bHostCoop').addEventListener('click', () => { sfx('click'); NET.mode = 'coop'; NET.li = Math.min(save.unlocked, NET.li); joinRoom(newCode(), true); });
$('bHostPvp').addEventListener('click', () => { sfx('click'); NET.mode = 'pvp'; joinRoom(newCode(), true); });
$('bJoin').addEventListener('click', () => { sfx('click'); joinRoom($('codeIn').value, false); });
$('codeIn').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom($('codeIn').value, false); });
$('bLeaveRoom').addEventListener('click', () => { sfx('click'); leaveRoom(); showOnline(); });
$('bResume').addEventListener('click', () => { state = 'play'; show(null); });
let helpReturn = 'sMenu';
function showHelp(from) { helpReturn = from || 'sMenu'; show('sHelp'); }
$('bHelp').addEventListener('click', () => { sfx('click'); showHelp('sMenu'); });
$('bPauseHelp').addEventListener('click', () => { sfx('click'); showHelp('sPause'); });
$('bHelpOk').addEventListener('click', () => { sfx('click'); save.settings.help = true; persist(); show(helpReturn); });
$('sHelp').querySelector('[data-back]').addEventListener('click', e => { e.stopImmediatePropagation(); save.settings.help = true; persist(); show(helpReturn); }, true);
$('bRestart').addEventListener('click', () => restartCurrent());
$('bQuit').addEventListener('click', () => {
  save.coins += G.coins; persist();
  if (online()) { G.net = null; if (NET.gr) { backToRoom(); return; } }
  goMenu();
});

// ---------- Dotyk ----------
function hitBtn(b, x, y, k) { return hyp(x - b.x, y - b.y) < b.r * (k || 1.25); }
cv.addEventListener('touchstart', e => {
  e.preventDefault(); ensureAudio(); input.mouse = false; input.pad = false;
  if (state !== 'play' || !G.player || G.over) return;
  const Lh = hudLayout();
  for (const t of e.changedTouches) {
    const x = t.clientX, y = t.clientY;
    if (hitBtn(Lh.pause, x, y, 1.5)) { pauseGame(); return; }
    if (hitBtn(Lh.dash, x, y)) { doDash(); continue; }
    if (hitBtn(Lh.gren, x, y)) { throwGrenade(); continue; }
    if (hitBtn(Lh.abil, x, y)) { useAbility(); continue; }
    if (Math.abs(x - Lh.swap.x) < Lh.swap.w / 2 + 6 && Math.abs(y - Lh.swap.y) < Lh.swap.h / 2 + 6) { swapWeapon(); continue; }
    if (save.settings.lefty ? x > W * .58 : x < W * .42) { if (touchSticks.move.id === null) Object.assign(touchSticks.move, { id: t.identifier, ox: x, oy: y }); }
    else if (touchSticks.aim.id === null) Object.assign(touchSticks.aim, { id: t.identifier, ox: x, oy: y, t0: performance.now(), max: 0 });
  }
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  const Lh = hudLayout();
  for (const t of e.changedTouches) {
    for (const k of ['move', 'aim']) {
      const s = touchSticks[k]; if (s.id !== t.identifier) continue;
      const R = Lh[k].r; let dx = (t.clientX - s.ox) / R, dy = (t.clientY - s.oy) / R; const m = hyp(dx, dy);
      if (m > 1) { if (k === 'move') { s.ox = t.clientX - dx / m * R; s.oy = t.clientY - dy / m * R; } dx /= m; dy /= m; }
      if (k === 'move') { input.mx = dx; input.my = dy; } else { input.ax = dx; input.ay = dy; input.aiming = true; s.max = Math.max(s.max, hyp(dx, dy)); }
    }
  }
}, { passive: false });
const tEnd = e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (touchSticks.move.id === t.identifier) { touchSticks.move.id = null; input.mx = input.my = 0; }
    if (touchSticks.aim.id === t.identifier) {
      const s = touchSticks.aim;
      if (s.max < .25 && performance.now() - s.t0 < 300 && G) G.autoT = .45;
      s.id = null; input.ax = input.ay = 0; input.aiming = false;
    }
  }
};
cv.addEventListener('touchend', tEnd, { passive: false });
cv.addEventListener('touchcancel', tEnd, { passive: false });
// ---------- Mysz i klawiatura ----------
cv.addEventListener('mousemove', e => { if (matchMedia('(pointer: coarse)').matches) return; input.mouse = true; input.mouseX = e.clientX; input.mouseY = e.clientY; });
cv.addEventListener('mousedown', e => {
  if (matchMedia('(pointer: coarse)').matches) return;
  ensureAudio(); input.mouse = true; input.mouseX = e.clientX; input.mouseY = e.clientY;
  if (state !== 'play') return;
  const Lh = hudLayout();
  if (hitBtn(Lh.pause, e.clientX, e.clientY, 1.4)) { pauseGame(); return; }
  if (hitBtn(Lh.dash, e.clientX, e.clientY)) { doDash(); return; }
  if (hitBtn(Lh.gren, e.clientX, e.clientY)) { throwGrenade(); return; }
  if (hitBtn(Lh.abil, e.clientX, e.clientY)) { useAbility(); return; }
  if (Math.abs(e.clientX - Lh.swap.x) < Lh.swap.w / 2 && Math.abs(e.clientY - Lh.swap.y) < Lh.swap.h / 2) { swapWeapon(); return; }
  if (e.button === 2) throwGrenade(); else input.mouseDown = true;
});
window.addEventListener('mouseup', () => { input.mouseDown = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  input.keys[e.code] = true;
  if (state === 'play') {
    if (e.code === 'Space' || e.code === 'ShiftLeft') { e.preventDefault(); doDash(); }
    if (e.code === 'KeyQ' || e.code === 'KeyG') throwGrenade();
    if (e.code === 'KeyF') useAbility();
    if (e.code === 'KeyE' || e.code === 'Tab') { e.preventDefault(); swapWeapon(); }
    if (e.code === 'Escape' || e.code === 'KeyP') pauseGame();
  } else if (state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) { state = 'play'; show(null); }
});
window.addEventListener('keyup', e => { input.keys[e.code] = false; });
window.addEventListener('blur', () => { input.keys = {}; input.mouseDown = false; if (state === 'play' && !online()) pauseGame(); else resetInput(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play' && !online()) pauseGame(); last = performance.now(); });
window.addEventListener('resize', resize);

// ---------- Pad ----------
const padPrev = {};
let padNavT = 0;
function pollPad(dt) {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null; for (const x of list) if (x && x.connected) { gp = x; break; }
  if (!gp) { if (input.pad) { input.pad = false; input.mx = input.my = 0; input.aiming = false; input.ax = input.ay = 0; } return; }
  const dz = v => Math.abs(v) < .2 ? 0 : v, ax = gp.axes, btn = i => !!(gp.buttons[i] && gp.buttons[i].pressed), edge = i => btn(i) && !padPrev[i];
  const any = gp.buttons.some(b => b && b.pressed) || ax.some(v => Math.abs(v) > .4);
  if (any) input.pad = true;
  if (!input.pad) return;
  if (state === 'play' && G && G.player) {
    input.mx = dz(ax[0] || 0); input.my = dz(ax[1] || 0);
    const rx = dz(ax[2] || 0), ry = dz(ax[3] || 0), rt = gp.buttons[7] && gp.buttons[7].value > .3;
    if (hyp(rx, ry) > .3) { input.ax = rx; input.ay = ry; input.aiming = true; }
    else if (rt) { input.ax = Math.cos(G.player.aim); input.ay = Math.sin(G.player.aim); input.aiming = true; }
    else { input.aiming = false; input.ax = input.ay = 0; }
    if (edge(0) || edge(4)) doDash();
    if (edge(1) || edge(6)) throwGrenade();
    if (edge(2) || edge(5)) useAbility();
    if (edge(3)) swapWeapon();
    if (edge(9)) pauseGame();
  } else {
    // nawigacja po menu
    padNavT -= dt;
    const vert = dz(ax[1] || 0) || (btn(13) ? 1 : btn(12) ? -1 : 0), hor = dz(ax[0] || 0) || (btn(15) ? 1 : btn(14) ? -1 : 0);
    if ((Math.abs(vert) > .5 || Math.abs(hor) > .5) && padNavT <= 0) {
      padNavT = .22;
      const scr = curScreen ? $(curScreen) : null;
      const items = scr ? [...scr.querySelectorAll('button:not([disabled]), input, select')].filter(el => el.offsetParent !== null) : [];
      if (items.length) {
        const i = items.indexOf(document.activeElement), d = (vert || hor) > 0 ? 1 : -1;
        items[(i < 0 ? 0 : (i + d + items.length) % items.length)].focus();
      }
    }
    if (Math.abs(vert) < .3 && Math.abs(hor) < .3) padNavT = 0;
    if (edge(0) && document.activeElement && document.activeElement.click) document.activeElement.click();
    if (edge(1)) { const back = curScreen && $(curScreen).querySelector('[data-back], #bLeaveRoom, #bResume'); if (back) back.click(); }
    if (edge(9) && state === 'paused') { state = 'play'; show(null); }
  }
  for (let i = 0; i < gp.buttons.length; i++) padPrev[i] = btn(i);
}
window.addEventListener('gamepadconnected', () => toast('Controller connected'));

// ---------- Start ----------
initFx(); resize();
goMenu();
if (!save.settings.help) showHelp('sMenu');
setTimeout(initOnline, 300);
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  pollPad(dt);
  const portrait = H > W && matchMedia('(pointer: coarse)').matches;
  if (G && (!portrait || online())) {
    if (state === 'menu' || state === 'play' || (online() && (state === 'paused' || state === 'levelup' || state === 'result'))) update(dt);
    if (state === 'play') {
      if (G.pendingLvl > 0 && !G.over) openLevelUp();
      if (G.over && G.overT > (G.over === 'win' ? 1.6 : 1.4)) finishLevel();
      musicTick(G.bi);
    }
  }
  render();
}
requestAnimationFrame(frame);
window.__sz = { startLevel, startSurvival, startDaily, get G() { return G; }, get state() { return state; }, NET };
