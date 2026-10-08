'use strict';
// ================= Ekrany i sterowanie =================
let state = 'menu', paused = false;
const $ = id => document.getElementById(id);
const SCREENS = ['sMenu', 'sLevels', 'sShop', 'sSet', 'sLvlUp', 'sPause', 'sResult'];
function show(id) { for (const s of SCREENS) $(s).hidden = s !== id; refreshCoins(); }
function refreshCoins() { $('mCoins').textContent = save.coins; document.querySelectorAll('.coinVal').forEach(e => e.textContent = save.coins); }
const touchSticks = { move: { id: null, ox: 0, oy: 0 }, aim: { id: null, ox: 0, oy: 0, t0: 0, max: 0 } };
function resetInput() { input.mx = input.my = input.ax = input.ay = 0; input.aiming = false; input.mouseDown = false; touchSticks.move.id = touchSticks.aim.id = null; }

// ---------- Menu ----------
function goMenu() { state = 'menu'; resetInput(); newGame(ri(0, 2) * 3, true); show('sMenu'); }
function buildLevels() {
  const box = $('biomes'); box.innerHTML = '';
  BIOMES.forEach((b, bi) => {
    const card = document.createElement('div'); card.className = 'biome cutbox';
    card.style.setProperty('--bg', b.css); card.style.setProperty('--acc', b.accent);
    let nodes = '';
    for (let k = 0; k < 3; k++) {
      const li = bi * 3 + k, L = LEVELS[li], locked = li > save.unlocked, st = save.stars[li];
      const stars = [0, 1, 2].map(i => svg('star', 'fill="' + (i < st ? '#ffc93c' : 'rgba(255,255,255,.18)') + '"')).join('');
      nodes += '<button type="button" class="node' + (L.boss ? ' boss' : '') + (li === save.unlocked ? ' cur' : '') + '" data-li="' + li + '"' + (locked ? ' disabled aria-label="Zablokowana"' : '') + '>' +
        (locked ? svg('lock', 'class="lock" style="color:#8ea3c4"') : '<b>' + (L.boss ? 'BOSS' : (li + 1)) + '</b><span class="stars">' + stars + '</span>') + '</button>';
    }
    card.innerHTML = '<h3>' + b.name + '</h3><p>' + b.sub + '</p><div class="nodes">' + nodes + '</div>';
    box.appendChild(card);
  });
  box.querySelectorAll('.node:not([disabled])').forEach(n => n.addEventListener('click', () => { sfx('click'); startLevel(+n.dataset.li); }));
}
function buildShop() {
  const wl = $('wList'); wl.innerHTML = '';
  for (const k of WEAPON_KEYS) {
    const w = WEAPONS[k], own = save.weapons.includes(k);
    const row = document.createElement('div'); row.className = 'item cutbox' + (own ? ' own' : '');
    const cvs = mk(144, 72); const g = cvs.getContext('2d'); g.scale(3, 3); g.translate(4, 12); g.lineJoin = 'round'; drawWeapon(g, k);
    g.globalCompositeOperation = 'lighter'; g.drawImage(glowSpr(w.color), 6, -10, 30, 20);
    row.appendChild(cvs);
    const dps = Math.round(w.dmg * w.pellets * w.rate);
    row.insertAdjacentHTML('beforeend', '<div><h4 style="color:' + w.color + '">' + w.name + '</h4><p>' + w.desc + '<br>Obrażenia/s: ' + dps + ' · Magazynek: ' + w.mag + '</p></div>');
    const b = document.createElement('button'); b.type = 'button';
    if (own) { b.className = 'btn small ghost'; b.disabled = true; b.innerHTML = '<span class="tag">Masz</span>'; }
    else { b.className = 'btn small primary'; b.innerHTML = '<span class="price"><i class="coin"></i>' + w.price + '</span>'; b.disabled = save.coins < w.price;
      b.addEventListener('click', () => { if (save.coins < w.price) return; save.coins -= w.price; save.weapons.push(k); persist(); sfx('coin'); buildShop(); refreshCoins(); }); }
    row.appendChild(b); wl.appendChild(row);
  }
  const ul = $('uList'); ul.innerHTML = '';
  for (const k of Object.keys(UPGRADES)) {
    const up = UPGRADES[k], lv = save.upg[k], max = lv >= up.max, cost = up.cost(lv);
    const row = document.createElement('div'); row.className = 'item cutbox';
    row.innerHTML = '<div class="ic">' + svg(up.icon) + '</div><div><h4>' + up.name + '</h4><p>' + up.desc + '</p><div class="pips">' + Array.from({ length: up.max }, (_, i) => '<i' + (i < lv ? ' class="on"' : '') + '></i>').join('') + '</div></div>';
    const b = document.createElement('button'); b.type = 'button';
    if (max) { b.className = 'btn small ghost'; b.disabled = true; b.innerHTML = '<span class="tag">Max</span>'; }
    else { b.className = 'btn small primary'; b.innerHTML = '<span class="price"><i class="coin"></i>' + cost + '</span>'; b.disabled = save.coins < cost;
      b.addEventListener('click', () => { if (save.coins < cost) return; save.coins -= cost; save.upg[k]++; persist(); sfx('coin'); buildShop(); refreshCoins(); }); }
    row.appendChild(b); ul.appendChild(row);
  }
}
let confirmReset = false;
function buildSettings() {
  const box = $('setList'); box.innerHTML = '';
  const rows = [
    ['quality', 'Grafika', 'Wysoka: dynamiczne światło i więcej efektów', v => v === 'high' ? 'Wysoka' : 'Niska', v => v === 'high' ? 'low' : 'high'],
    ['sfx', 'Efekty dźwiękowe', '', v => v ? 'Wł.' : 'Wył.', v => !v],
    ['music', 'Muzyka', '', v => v ? 'Wł.' : 'Wył.', v => !v],
    ['auto', 'Auto-strzał', 'Strzela sam do najbliższego wroga, gdy nie celujesz', v => v ? 'Wł.' : 'Wył.', v => !v]
  ];
  for (const [k, name, sub, lab, next] of rows) {
    const r = document.createElement('div'); r.className = 'setRow cutbox';
    r.innerHTML = '<span>' + name + (sub ? '<small>' + sub + '</small>' : '') + '</span>';
    const b = document.createElement('button'); b.type = 'button'; b.id = 'set-' + k;
    const on = save.settings[k] === true || save.settings[k] === 'high';
    b.className = 'btn small toggle' + (on ? ' on' : ''); b.textContent = lab(save.settings[k]);
    b.addEventListener('click', () => { save.settings[k] = next(save.settings[k]); persist(); sfx('click'); if (k === 'quality') resize(); buildSettings(); });
    r.appendChild(b); box.appendChild(r);
  }
  const r = document.createElement('div'); r.className = 'setRow cutbox';
  r.innerHTML = '<span>Postęp gry<small>Usuwa misje, monety i zakupy</small></span>';
  const c = document.createElement('div'); c.className = 'confirm';
  if (!confirmReset) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small ghost'; b.textContent = 'Wyczyść'; b.addEventListener('click', () => { confirmReset = true; buildSettings(); }); c.appendChild(b); }
  else {
    const y = document.createElement('button'); y.type = 'button'; y.className = 'btn small'; y.style.setProperty('--bg', '#c4142e'); y.textContent = 'Tak, usuń';
    y.addEventListener('click', () => { const st = save.settings; save = JSON.parse(JSON.stringify(DEF_SAVE)); save.settings = st; persist(); confirmReset = false; buildSettings(); refreshCoins(); });
    const n = document.createElement('button'); n.type = 'button'; n.className = 'btn small ghost'; n.textContent = 'Anuluj'; n.addEventListener('click', () => { confirmReset = false; buildSettings(); });
    c.appendChild(y); c.appendChild(n);
  }
  r.appendChild(c); box.appendChild(r);
}

// ---------- Rozgrywka ----------
function startLevel(li) {
  ensureAudio();
  const el = document.documentElement;
  if (el.requestFullscreen && !document.fullscreenElement && matchMedia('(pointer: coarse)').matches)
    el.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
  resetInput();
  newGame(li, false);
  G.banner = { title: 'Misja ' + (li + 1), sub: BIOMES[LEVELS[li].biome].name + (LEVELS[li].boss ? ' · walka z bossem' : ''), t: 2.4, max: 2.4 };
  G.waveDelay = 2.2;
  state = 'play'; show(null); music.intense = 0;
}
function openLevelUp() {
  state = 'levelup'; resetInput(); sfx('lvl');
  const p = G.player;
  const avail = PERKS.filter(k => (p.perkLv[k.id] || 0) < k.max);
  const choice = shuffle(avail.slice()).slice(0, 3);
  $('luTitle').textContent = 'Poziom ' + (p.lvl - G.pendingLvl + 1);
  const box = $('perks'); box.innerHTML = '';
  for (const k of choice) {
    const lv = p.perkLv[k.id] || 0;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'perk'; b.style.setProperty('--c', k.c);
    b.innerHTML = '<span class="pic">' + svg(k.icon) + '</span><h4>' + k.name + '</h4><p>' + k.desc + '</p><span class="lv">' + (lv ? 'Poz. ' + (lv + 1) + ' / ' + k.max : 'Nowe') + '</span>';
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
  box.innerHTML = Object.keys(p.perkLv).map(id => { const k = PERKS.find(x => x.id === id); return '<span>' + svg(k.icon) + k.name + ' ' + p.perkLv[id] + '</span>'; }).join('') || '<span>Brak ulepszeń – zbieraj kryształy doświadczenia</span>';
  show('sPause');
}
function finishLevel() {
  const won = G.over === 'win', li = G.li, p = G.player;
  let bonus = 0, stars = 0;
  if (won) {
    bonus = 120 + li * 50; stars = p.hp >= p.maxHp * .66 ? 3 : p.hp >= p.maxHp * .33 ? 2 : 1;
    save.stars[li] = Math.max(save.stars[li], stars);
    if (li === save.unlocked && li < 8) save.unlocked = li + 1;
  }
  save.coins += G.coins + bonus; persist();
  state = 'result'; resetInput();
  $('rKick').textContent = 'Misja ' + (li + 1) + ' · ' + G.B.name;
  $('rTitle').textContent = won ? (li === 8 ? 'Strefa oczyszczona!' : 'Misja ukończona') : 'Poległeś';
  $('rTitle').style.color = won ? '' : '#ff8aa0';
  $('rStars').innerHTML = won ? [0, 1, 2].map(i => svg('star', 'fill="' + (i < stars ? '#ffc93c' : 'rgba(255,255,255,.15)') + '"' + (i < stars ? ' style="filter:drop-shadow(0 0 10px rgba(255,200,60,.7))"' : ''))).join('') : '';
  const s = Math.floor(G.t);
  $('rStats').innerHTML = '<div><b>' + G.kills + '</b>Pokonani</div><div><b>' + p.lvl + '</b>Poziom</div><div><b>' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + '</b>Czas</div><div><b style="color:#ffe08a">+' + (G.coins + bonus) + '</b>Monety</div>';
  const btns = $('rBtns'); btns.innerHTML = '';
  const add = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = label; b.addEventListener('click', () => { sfx('click'); fn(); }); btns.appendChild(b); };
  if (won && li < 8) add('Następna misja', 'primary', () => startLevel(li + 1));
  add(won ? 'Powtórz' : 'Spróbuj ponownie', won && li < 8 ? '' : 'primary', () => startLevel(li));
  add('Zbrojownia', 'ghost', () => { goMenu(); buildShop(); show('sShop'); });
  add('Mapa misji', 'ghost', () => { goMenu(); buildLevels(); show('sLevels'); });
  show('sResult');
}

$('bPlay').addEventListener('click', () => { ensureAudio(); sfx('click'); buildLevels(); show('sLevels'); });
$('bShop').addEventListener('click', () => { ensureAudio(); sfx('click'); buildShop(); show('sShop'); });
$('bSet').addEventListener('click', () => { ensureAudio(); sfx('click'); confirmReset = false; buildSettings(); show('sSet'); });
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { sfx('click'); show('sMenu'); }));
$('bResume').addEventListener('click', () => { state = 'play'; show(null); });
$('bRestart').addEventListener('click', () => startLevel(G.li));
$('bQuit').addEventListener('click', () => { save.coins += G.coins; persist(); goMenu(); });

// ---------- Dotyk ----------
function hitBtn(b, x, y, k) { return hyp(x - b.x, y - b.y) < b.r * (k || 1.25); }
cv.addEventListener('touchstart', e => {
  e.preventDefault(); ensureAudio(); input.mouse = false;
  if (state !== 'play' || !G.player || G.over) return;
  const Lh = hudLayout();
  for (const t of e.changedTouches) {
    const x = t.clientX, y = t.clientY;
    if (hitBtn(Lh.pause, x, y, 1.5)) { pauseGame(); return; }
    if (hitBtn(Lh.dash, x, y)) { doDash(); continue; }
    if (hitBtn(Lh.gren, x, y)) { throwGrenade(); continue; }
    if (Math.abs(x - Lh.swap.x) < Lh.swap.w / 2 + 6 && Math.abs(y - Lh.swap.y) < Lh.swap.h / 2 + 6) { swapWeapon(); continue; }
    if (x < W * .42) { if (touchSticks.move.id === null) Object.assign(touchSticks.move, { id: t.identifier, ox: x, oy: y }); }
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
      if (s.max < .25 && performance.now() - s.t0 < 300 && G) G.autoT = .45; // stuknięcie = krótka seria w najbliższego wroga
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
  if (Math.abs(e.clientX - Lh.swap.x) < Lh.swap.w / 2 && Math.abs(e.clientY - Lh.swap.y) < Lh.swap.h / 2) { swapWeapon(); return; }
  if (e.button === 2) throwGrenade(); else input.mouseDown = true;
});
window.addEventListener('mouseup', () => { input.mouseDown = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  input.keys[e.code] = true;
  if (state === 'play') {
    if (e.code === 'Space' || e.code === 'ShiftLeft') { e.preventDefault(); doDash(); }
    if (e.code === 'KeyQ' || e.code === 'KeyG') throwGrenade();
    if (e.code === 'KeyE' || e.code === 'Tab') { e.preventDefault(); swapWeapon(); }
    if (e.code === 'Escape' || e.code === 'KeyP') pauseGame();
  } else if (state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) { state = 'play'; show(null); }
});
window.addEventListener('keyup', e => { input.keys[e.code] = false; });
window.addEventListener('blur', () => { input.keys = {}; input.mouseDown = false; if (state === 'play') pauseGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseGame(); last = performance.now(); });
window.addEventListener('resize', resize);

// ---------- Start ----------
initFx(); resize();
goMenu();
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const portrait = H > W && matchMedia('(pointer: coarse)').matches;
  if (!portrait && G) {
    if (state === 'menu' || state === 'play') update(dt);
    if (state === 'play') {
      if (G.pendingLvl > 0 && !G.over) openLevelUp();
      if (G.over && G.overT > (G.over === 'win' ? 1.6 : 1.4)) finishLevel();
      musicTick(G.bi);
    }
  }
  render();
}
requestAnimationFrame(frame);
window.__sz = { startLevel, get G() { return G; }, get state() { return state; } };
