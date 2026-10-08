'use strict';
// ================= Kolekcja, skrzynie i nagrody =================
SCREENS.push('sColl', 'sCrate');
let collCat = 'skin', collSel = null;
const ICON = {};
function cosIcon(it) {
  const key = it.id + (['skin', 'visor', 'hat'].includes(it.cat) ? ':' + save.hero : '');
  if (ICON[key]) { const k = mk(112, 112); k.getContext('2d').drawImage(ICON[key], 0, 0); return k; }
  const c = mk(112, 112), g = c.getContext('2d'), col = it.col || RAR[it.r].col;
  g.translate(56, 56); g.lineCap = 'round'; g.lineJoin = 'round';
  if (it.cat === 'skin' || it.cat === 'hat' || it.cat === 'visor') {
    const look = { hero: save.hero, skin: it.cat === 'skin' ? it.id : 'sk_def', visor: it.cat === 'visor' ? it.id : 'vi_def', hat: it.cat === 'hat' ? it.id : 'ht_none' };
    const s = playerSpr(look, 'none'), sc = it.cat === 'visor' ? 3.4 : it.cat === 'hat' ? (['cowboy', 'wizard', 'wings', 'tophat', 'firecrown'].includes(it.kind) ? 2 : 2.7) : 2.3;
    g.rotate(-Math.PI / 2); g.drawImage(s.c, -50 * sc - (it.cat === 'skin' ? -2 : it.cat === 'visor' ? 10 : 2) * sc, -50 * sc, 100 * sc, 100 * sc);
  } else if (it.cat === 'trail') {
    const cols = it.rainbow ? RAINBOW : [col];
    for (let i = 0; i < 3; i++) {
      const y = -24 + i * 24, cc = cols[(i * 3) % cols.length];
      g.globalCompositeOperation = 'lighter'; g.drawImage(glowSpr(cc), 10, y - 14, 40, 28);
      g.strokeStyle = hexA(cc, .7); g.lineWidth = 9; g.beginPath(); g.moveTo(-40, y); g.lineTo(30, y); g.stroke();
      g.strokeStyle = it.dark ? '#2a0a3a' : '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, y); g.lineTo(30, y); g.stroke();
      g.globalCompositeOperation = 'source-over';
      if (it.spark) { g.fillStyle = it.spark; for (let k = 0; k < 4; k++) g.fillRect(-36 + k * 14, y + (k % 2 ? 7 : -9), 3, 3); }
    }
  } else if (it.cat === 'dash' || it.cat === 'kill') {
    g.globalCompositeOperation = 'lighter'; g.drawImage(glowSpr(col), -50, -50, 100, 100); g.globalCompositeOperation = 'source-over';
    if (it.cat === 'dash') { const s = playerSpr({ hero: save.hero }, 'blaster'); for (let i = 0; i < 3; i++) { g.globalAlpha = .25 + i * .3; g.drawImage(s.c, -70 + i * 22, -50, 100, 100); } g.globalAlpha = 1; }
    const shape = it.fx.startsWith('shape:') ? it.fx.slice(6) : it.fx === 'confetti' ? 'pixel' : it.fx === 'coins' ? 'coin' : null;
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + .3, d = it.cat === 'kill' ? 34 : 26 + (i % 3) * 6, q = { x: Math.cos(a) * d + (it.cat === 'dash' ? -10 : 0), y: Math.sin(a) * d, rot: a, size: 13, shape: shape || 'square', color: it.fx === 'confetti' ? RAINBOW[i % 10] : col, z: 0 };
      if (shape) drawShapeParticle(g, q, 1);
      else { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(q.x * .5, q.y * .5); g.lineTo(q.x, q.y); g.stroke(); }
    }
    if (it.fx === 'void') { g.fillStyle = '#05000a'; g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); }
    if (it.fx === 'bolt') { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(4, -44); g.lineTo(-8, -6); g.lineTo(6, -2); g.lineTo(-6, 40); g.stroke(); }
    if (it.fx === 'none') { g.strokeStyle = '#8ea3c4'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.moveTo(-15, 15); g.lineTo(15, -15); g.stroke(); }
  } else if (it.cat === 'pet') {
    if (it.kind === 'none') { g.strokeStyle = '#8ea3c4'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.moveTo(-15, 15); g.lineTo(15, -15); g.stroke(); }
    else { g.globalCompositeOperation = 'lighter'; g.drawImage(glowSpr(col), -40, -40, 80, 80); g.globalCompositeOperation = 'source-over'; const s = petSpr(it.id); g.drawImage(s.c, -48 * 2, -48 * 2, 96 * 2, 96 * 2); }
  } else if (it.cat === 'title') {
    g.fillStyle = hexA(RAR[it.r].col, .25); g.beginPath(); g.moveTo(-52, -18); g.lineTo(52, -18); g.lineTo(44, 0); g.lineTo(52, 18); g.lineTo(-52, 18); g.lineTo(-44, 0); g.closePath(); g.fill();
    g.strokeStyle = RAR[it.r].col; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#fff'; g.font = '700 15px "Chakra Petch", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const words = it.name.split(' '); if (words.length > 1 && it.name.length > 10) { g.font = '700 13px "Chakra Petch", sans-serif'; g.fillText(words.slice(0, Math.ceil(words.length / 2)).join(' '), 0, -6); g.fillText(words.slice(Math.ceil(words.length / 2)).join(' '), 0, 9); } else g.fillText(it.name, 0, 1);
  }
  ICON[key] = c;
  return cosIcon(it);
}
function srcText(it) { const a = ACHS.find(x => x.id === it.src); return a ? 'Achievement reward: ' + a.name : ''; }
function openColl() { ensureAudio(); show('sColl'); renderColl(); startPreview(); }
function renderColl() {
  $('shardVal').textContent = save.cos.shards;
  const own = COS_LIST.filter(it => owns(it.id)).length;
  $('collProg').textContent = own + ' / ' + COS_LIST.length;
  // skrzynie
  const cb = $('crateBox'); cb.innerHTML = '';
  for (const k of ['c', 'e', 'l']) {
    const C = CRATES[k], n = save.cos.crates[k] || 0;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'crateBtn'; b.style.setProperty('--cc', C.col);
    b.innerHTML = '<span class="box"></span><b>' + C.name.replace(' Crate', '') + '</b>' + (n ? '<span class="cnt">×' + n + '</span><small>Open</small>' : '<small><i class="coin" style="width:11px;height:11px"></i>' + C.price + '</small>');
    b.title = C.items + (C.items > 1 ? ' items' : ' item');
    b.addEventListener('click', () => {
      if (!n) { if (save.coins < C.price) { toast('Not enough coins for a ' + C.name); return; } save.coins -= C.price; save.cos.crates[k]++; persist(); refreshCoins(); }
      crateOpen(k);
    });
    cb.appendChild(b);
  }
  // kategorie
  const tabs = $('catTabs'); tabs.innerHTML = '';
  for (const c in COS_CATS) {
    const items = COS_LIST.filter(it => it.cat === c), got = items.filter(it => owns(it.id)).length, fresh = items.some(it => save.cos.seen[it.id] === 0);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (c === collCat ? ' on' : '');
    b.textContent = COS_CATS[c] + ' ' + got + '/' + items.length + (fresh ? ' •' : '');
    b.addEventListener('click', () => { collCat = c; collSel = null; sfx('click'); renderColl(); });
    tabs.appendChild(b);
  }
  // przedmioty
  const grid = $('itemGrid'); grid.innerHTML = '';
  const items = COS_LIST.filter(it => it.cat === collCat).sort((a, b) => (a.def ? -1 : 0) - (b.def ? -1 : 0) || RAR_KEYS.indexOf(a.r) - RAR_KEYS.indexOf(b.r));
  for (const it of items) {
    const has = owns(it.id), eq = save.cos.eq[it.cat] === it.id;
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'cItem' + (has ? '' : ' lock') + (eq ? ' eq' : save.cos.seen[it.id] === 0 ? ' new' : '') + (collSel === it.id ? ' sel' : '');
    b.style.setProperty('--rc', RAR[it.r].col);
    b.appendChild(cosIcon(it));
    const sp = document.createElement('span'); sp.textContent = has ? it.name : RAR[it.r].name; b.appendChild(sp);
    b.addEventListener('click', () => {
      collSel = it.id; sfx('click');
      if (has) { if (save.cos.seen[it.id] === 0) delete save.cos.seen[it.id]; save.cos.eq[it.cat] = it.id; persist(); roomPresence(); }
      renderColl();
    });
    grid.appendChild(b);
  }
  // szczegóły
  const d = $('detail'), it = COS[collSel] || COS[save.cos.eq[collCat]];
  d.innerHTML = ''; d.appendChild(cosIcon(it)); d.firstChild.style.cssText = 'width:44px;height:44px';
  const info = document.createElement('div');
  const has = owns(it.id);
  info.innerHTML = '<h4 style="color:' + RAR[it.r].col + '"></h4><p></p>';
  info.querySelector('h4').textContent = has ? it.name : '??? · ' + RAR[it.r].name;
  info.querySelector('p').textContent = has ? RAR[it.r].name + ' · ' + COS_CATS[it.cat] + (save.cos.eq[it.cat] === it.id ? ' · equipped' : ' · tap to equip') : it.src ? srcText(it) : 'Find it in a crate or buy it with shards.';
  d.appendChild(info);
  if (!has && !it.src) {
    const cost = RAR[it.r].shard, b = document.createElement('button'); b.type = 'button'; b.className = 'btn small primary';
    b.innerHTML = '<span class="price"><i class="shard" style="width:10px;height:13px"></i>' + cost + '</span>'; b.disabled = save.cos.shards < cost;
    b.addEventListener('click', () => { if (save.cos.shards < cost) return; save.cos.shards -= cost; save.cos.own[it.id] = 1; save.cos.eq[it.cat] = it.id; persist(); sfx('lvl'); toast('Unlocked: <b>' + it.name + '</b>'); renderColl(); });
    d.appendChild(b);
  }
  updateCrateDot();
}
// ---------- podgląd postaci ----------
let prevT = 0, prevBul = [], prevRun = false;
function startPreview() {
  if (prevRun) return; prevRun = true;
  const cv2 = $('prevCv'), g = cv2.getContext('2d');
  let last = performance.now();
  const step = now => {
    if (curScreen !== 'sColl') { prevRun = false; return; }
    requestAnimationFrame(step);
    const dt = Math.min(.05, (now - last) / 1000); last = now; prevT += dt;
    const W2 = cv2.width, H2 = cv2.height, e = save.cos.eq;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W2, H2);
    g.strokeStyle = 'rgba(110,200,255,.08)'; g.lineWidth = 1;
    for (let x = (prevT * 20) % 40; x < W2; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H2); g.stroke(); }
    for (let y = 0; y < H2; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W2, y); g.stroke(); }
    const cx = W2 * .36, cy = H2 * .56, aim = Math.sin(prevT * .7) * .5, sc = 2.6;
    // pociski
    if ((prevT % .35) < dt) { const tr = COS[e.trail]; prevBul.push({ x: cx + Math.cos(aim) * 80, y: cy + Math.sin(aim) * 80, a: aim, t: 0, tr, ri: ri(0, 9) }); }
    g.globalCompositeOperation = 'lighter';
    for (const b of prevBul) {
      b.t += dt; b.x += Math.cos(b.a) * 700 * dt; b.y += Math.sin(b.a) * 700 * dt;
      const col = b.tr && b.tr.rainbow ? RAINBOW[(b.ri + (prevT * 14 | 0)) % 10] : b.tr && b.tr.col ? b.tr.col : WEAPONS[save.weapons[save.weapons.length - 1]].color;
      g.globalAlpha = 1; g.drawImage(glowSpr(col), b.x - 24, b.y - 24, 48, 48);
      g.strokeStyle = col; g.lineWidth = 8; g.beginPath(); g.moveTo(b.x - Math.cos(b.a) * 40, b.y - Math.sin(b.a) * 40); g.lineTo(b.x, b.y); g.stroke();
      if (b.tr && b.tr.spark) { g.fillStyle = b.tr.spark; g.fillRect(b.x - Math.cos(b.a) * 30 + Math.sin(prevT * 30) * 6, b.y - Math.sin(b.a) * 30 + 6, 4, 4); }
    }
    prevBul = prevBul.filter(b => b.t < 1);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // cień + postać
    g.globalAlpha = .5; g.drawImage(SHADOW, cx - 60, cy + 10, 120, 50); g.globalAlpha = 1;
    const s = playerSpr(myLook(), save.weapons[save.weapons.length - 1]);
    g.save(); g.translate(cx, cy); g.rotate(aim); g.drawImage(s.c, -50 * sc, -50 * sc, 100 * sc, 100 * sc); g.restore();
    // zwierzak
    if (e.pet !== 'pe_none') {
      const px = cx - 110, py = cy - 60 + Math.sin(prevT * 3) * 8;
      g.globalCompositeOperation = 'lighter'; g.drawImage(glowSpr(COS[e.pet].col || '#fff'), px - 50, py - 50, 100, 100); g.globalCompositeOperation = 'source-over';
      g.globalAlpha = .4; g.drawImage(SHADOW, px - 26, py + 50, 52, 20); g.globalAlpha = 1;
      const ps = petSpr(e.pet); g.drawImage(ps.c, px - 48 * 2.2, py - 48 * 2.2, 96 * 2.2, 96 * 2.2);
    }
    // ksywka i tytuł
    const tt = COS[e.title];
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '18px "Russo One", sans-serif'; g.fillStyle = '#fff'; g.fillText(nick(), cx, 30);
    g.font = '600 13px "Chakra Petch", sans-serif'; g.fillStyle = RAR[tt.r].col; g.fillText(tt.name, cx, 50);
  };
  requestAnimationFrame(step);
}
// ---------- otwieranie skrzyń ----------
let crateRes = null;
function crateOpen(type) {
  const C = CRATES[type];
  if (!save.cos.crates[type]) return;
  show('sCrate');
  const box = $('bigCrate'); box.style.setProperty('--cc', C.col); box.className = 'bigCrate'; box.hidden = false;
  $('crKick').textContent = C.name + ' · tap to open';
  $('reveal').innerHTML = ''; $('crBtns').innerHTML = '';
  crateRes = null;
  box.onclick = () => {
    if (crateRes) return;
    crateRes = openCrate(type); if (!crateRes) return;
    sfx('roar'); box.classList.add('shake');
    setTimeout(() => {
      box.classList.remove('shake'); box.classList.add('boom'); sfx('boom');
      setTimeout(() => { box.hidden = true; showReveal(type); }, 330);
    }, 900);
  };
}
function showReveal(type) {
  const best = crateRes.reduce((m, r) => Math.max(m, RAR_KEYS.indexOf(r.it.r)), 0);
  $('crKick').textContent = best >= 3 ? 'Incredible!' : best >= 2 ? 'Great loot!' : 'Crate contents';
  sfx(best >= 3 ? 'win' : 'lvl');
  const rv = $('reveal');
  for (const r of crateRes) {
    const it = r.it, c = document.createElement('div'); c.className = 'rCard cutbox'; c.style.setProperty('--rc', RAR[it.r].col);
    c.appendChild(cosIcon(it));
    const h = document.createElement('h4'); h.textContent = it.name; c.appendChild(h);
    c.insertAdjacentHTML('beforeend', '<em>' + RAR[it.r].name + '</em><small>' + COS_CATS[it.cat] + (r.dup ? ' · duplicate: +' + r.shards + ' shards' : ' · new!') + '</small>');
    rv.appendChild(c);
  }
  const bt = $('crBtns'); bt.innerHTML = '';
  const add = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = label; b.addEventListener('click', () => { sfx('click'); fn(); }); bt.appendChild(b); };
  if (save.cos.crates[type] > 0) add('Open another (' + save.cos.crates[type] + ')', 'primary', () => crateOpen(type));
  else if (save.coins >= CRATES[type].price) add('Buy another · ' + CRATES[type].price, 'primary', () => { save.coins -= CRATES[type].price; save.cos.crates[type]++; persist(); crateOpen(type); });
  const first = crateRes.find(r => !r.dup);
  if (first) add('Equip ' + first.it.name, '', () => { save.cos.eq[first.it.cat] = first.it.id; delete save.cos.seen[first.it.id]; persist(); collCat = first.it.cat; collSel = first.it.id; openColl(); });
  add('Collection', 'ghost', () => openColl());
}
function updateCrateDot() { const n = cratesTotal(), d = $('crateDot'); d.hidden = !n; d.textContent = n; }
// ---------- nagrody ----------
function gameRewards(mode, won, waves) {
  if (mode === 'mission' && won) giveCrate(G.L.boss ? 'e' : 'c', 1, G.L.boss ? 'boss defeated' : 'mission complete');
  else if (mode === 'coop' && won) giveCrate('e', 1, 'co-op victory');
  else if (mode === 'pvp') giveCrate(won ? 'e' : 'c', 1, won ? 'duel won' : 'duel played');
  else if (mode === 'survival' && waves >= 5) { giveCrate('c', Math.min(3, Math.floor(waves / 5)), 'waves survived'); if (waves >= 15) giveCrate('e', 1, '15+ waves'); }
  else if (mode === 'daily' && save.daily.crate !== todayKey()) { save.daily.crate = todayKey(); giveCrate('e', 1, 'daily challenge'); }
}
function dailyGift() {
  if (save.cos.gift === todayKey()) return;
  save.cos.gift = todayKey(); giveCrate('c', 1, 'daily login gift');
}
$('bColl').addEventListener('click', () => { sfx('click'); openColl(); });
dailyGift();
unlockAchItems(); persist();
updateCrateDot();
