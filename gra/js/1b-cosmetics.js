'use strict';
// ================= Kosmetyki: katalog, skrzynie, odłamki =================
const RAR = {
  c: { name: 'Zwykły', col: '#a9b8cc', w: 60, shard: 25, dup: 5 },
  r: { name: 'Rzadki', col: '#3ea0ff', w: 27, shard: 70, dup: 15 },
  e: { name: 'Epicki', col: '#b45cff', w: 10, shard: 200, dup: 40 },
  l: { name: 'Legendarny', col: '#ffb627', w: 2.6, shard: 550, dup: 110 },
  m: { name: 'Mityczny', col: '#ff4d6d', w: .4, shard: 1300, dup: 260 }
};
const RAR_KEYS = ['c', 'r', 'e', 'l', 'm'];
const COS_CATS = {
  skin: 'Pancerze', visor: 'Wizjery', hat: 'Nakrycia głowy', trail: 'Ślady pocisków', dash: 'Efekty zrywu', kill: 'Efekty eliminacji', pet: 'Zwierzaki', title: 'Tytuły'
};
const COS = {}, COS_LIST = [];
function addCos(cat, id, name, r, extra) { const it = Object.assign({ cat, id, name, r }, extra || {}); COS[id] = it; COS_LIST.push(it); }
// --- pancerze: [jasny, średni, ciemny, akcent], wzór
[
  ['sk_def', 'Standardowy', 'c', null, 'none', { def: true }],
  ['sk_grey', 'Szary rekrut', 'c', ['#e2e7ee', '#9aa4b2', '#4a5566', '#c8d0da'], 'none'],
  ['sk_sand', 'Piaskowy', 'c', ['#f4e3bc', '#c9a970', '#76592e', '#e8cf98'], 'none'],
  ['sk_forest', 'Leśny', 'c', ['#b8dcae', '#5e9454', '#28472a', '#88c07a'], 'none'],
  ['sk_navy', 'Granatowy', 'c', ['#b4c8ee', '#4a6aa8', '#18284f', '#7a9ad8'], 'none'],
  ['sk_brick', 'Ceglasty', 'c', ['#f6c0b0', '#c4644a', '#5e2414', '#e89478'], 'none'],
  ['sk_olive', 'Oliwkowy', 'c', ['#dfe2b0', '#8f9446', '#3e4214', '#bcc070'], 'none'],
  ['sk_graph', 'Grafitowy', 'c', ['#9aa0aa', '#4a4f58', '#1a1d22', '#70767f'], 'none'],
  ['sk_milk', 'Mleczny', 'c', ['#ffffff', '#e4e8ee', '#9aa4b2', '#f6f8fb'], 'trim'],
  ['sk_camoj', 'Kamuflaż dżungli', 'r', ['#9cc488', '#4e7a3a', '#22381a', '#2e4a20'], 'camo'],
  ['sk_camod', 'Kamuflaż pustyni', 'r', ['#f0dcae', '#c49c62', '#6e5028', '#9a7a48'], 'camo'],
  ['sk_camow', 'Kamuflaż zimowy', 'r', ['#ffffff', '#cfd8e2', '#7a8696', '#9aa6b6'], 'camo'],
  ['sk_tiger', 'Tygrys', 'r', ['#ffc070', '#f08a20', '#7a3a08', '#1a1008'], 'tiger'],
  ['sk_zebra', 'Zebra', 'r', ['#ffffff', '#e8e8e8', '#7a7a7a', '#141414'], 'tiger'],
  ['sk_carbon', 'Włókno węglowe', 'r', ['#6a707a', '#2a2e36', '#0e1014', '#3a404a'], 'carbon'],
  ['sk_dots', 'Retro kropki', 'r', ['#ffd0e0', '#ff7aa8', '#8a1a48', '#ffffff'], 'dots'],
  ['sk_honey', 'Plaster miodu', 'r', ['#ffe08a', '#f0a820', '#7a4a08', '#8a5a10'], 'hex'],
  ['sk_hazard', 'Strefa zagrożenia', 'e', ['#ffe14d', '#e8b400', '#5a4400', '#141414'], 'hazard'],
  ['sk_neon', 'Neonowy róż', 'e', ['#3a1a3a', '#24102a', '#0e0612', '#ff4dd8'], 'neon'],
  ['sk_toxic', 'Toksyk', 'e', ['#2a3a14', '#18240a', '#080e04', '#a6ff2e'], 'neon'],
  ['sk_flame', 'Płomień', 'e', ['#4a1a10', '#2a0e08', '#120404', '#ff8a1a'], 'flames'],
  ['sk_storm', 'Burza', 'e', ['#4a5a7a', '#28324a', '#10141e', '#9ae8ff'], 'bolt'],
  ['sk_ice', 'Lodowy kryształ', 'e', ['#ffffff', '#aee8ff', '#3a8ac0', '#e8fbff'], 'ice'],
  ['sk_blood', 'Krwawy księżyc', 'e', ['#ff8a8a', '#b4142e', '#3a040e', '#ffd0d0'], 'trim'],
  ['sk_ocean', 'Oceaniczny', 'e', ['#a0fff0', '#1ab8c8', '#063a5a', '#e0fffa'], 'waves'],
  ['sk_gold', 'Złoty wojownik', 'l', ['#fff6c4', '#ffc93c', '#8a5a08', '#fff'], 'gold'],
  ['sk_chrome', 'Chrom', 'l', ['#ffffff', '#b8c4d4', '#3a4454', '#fff'], 'chrome'],
  ['sk_galaxy', 'Galaktyka', 'l', ['#5a3aa8', '#2a1a5a', '#0a0620', '#ffffff'], 'stars'],
  ['sk_lava', 'Obsydian i lawa', 'l', ['#3a2a2a', '#1a1010', '#060202', '#ffb000'], 'lava'],
  ['sk_rainbow', 'Tęczowy pryzmat', 'm', ['#ffffff', '#ff8ad8', '#5a3aa8', '#fff'], 'rainbow'],
  ['sk_void', 'Pustka', 'm', ['#2a1a3a', '#0e0614', '#000000', '#c77dff'], 'void'],
  ['sk_cabbage', 'Kapusta królewska', 'm', ['#d8ffb0', '#6ac84a', '#1e5a1a', '#f4ffe0'], 'cabbage'],
  ['sk_boss', 'Łuska Królowej', 'l', ['#d4f58a', '#7cc63f', '#2c5418', '#b45cff'], 'hex', { src: 'boss1' }],
  ['sk_vet', 'Weteran Strefy', 'l', ['#e8e0c8', '#8a7a5a', '#3a3020', '#ffb627'], 'stripes', { src: 'k1000' }]
].forEach(([id, n, r, pal, pat, ex]) => addCos('skin', id, n, r, Object.assign({ pal, pat }, ex || {})));
// --- wizjery
[
  ['vi_def', 'Bohatera', 'c', null, { def: true }], ['vi_white', 'Biały', 'c', '#ffffff'], ['vi_green', 'Zielony', 'c', '#5dff8a'], ['vi_yellow', 'Żółty', 'c', '#ffe14d'],
  ['vi_red', 'Czerwony', 'r', '#ff3d5a'], ['vi_orange', 'Pomarańczowy', 'r', '#ff8a1a'], ['vi_purple', 'Fioletowy', 'r', '#b45cff'], ['vi_pink', 'Różowy', 'r', '#ff6ad8'],
  ['vi_gold', 'Złoty', 'e', '#ffc93c', { grad: ['#fff6c4', '#ffb000'] }], ['vi_lime', 'Neonowa limonka', 'e', '#b6ff2e', { grad: ['#efffb0', '#6ad800'] }], ['vi_frost', 'Szron', 'e', '#9ae8ff', { grad: ['#ffffff', '#3ec9ff'] }],
  ['vi_rainbow', 'Tęczowy', 'l', '#ff8ad8', { grad: ['#ff4d6d', '#ffe14d', '#5dff8a', '#3ef0ff', '#b45cff'] }], ['vi_fire', 'Ognisty', 'l', '#ff8a1a', { grad: ['#fff2a0', '#ff8a1a', '#ff2a1a'] }],
  ['vi_void', 'Czarna dziura', 'm', '#c77dff', { grad: ['#000000', '#2a0a3a', '#c77dff'] }]
].forEach(([id, n, r, col, ex]) => addCos('visor', id, n, r, Object.assign({ col }, ex || {})));
// --- nakrycia głowy
[
  ['ht_none', 'Brak', 'c', 'none', { def: true }], ['ht_cap', 'Czapka z daszkiem', 'c', 'cap'], ['ht_band', 'Opaska', 'c', 'band'], ['ht_ant', 'Antenka', 'c', 'antenna'], ['ht_bandana', 'Bandana', 'c', 'bandana'],
  ['ht_mohawk', 'Irokez', 'r', 'mohawk'], ['ht_viking', 'Rogi wikinga', 'r', 'viking'], ['ht_cat', 'Kocie uszy', 'r', 'cat'], ['ht_phones', 'Słuchawki', 'r', 'phones'], ['ht_cowboy', 'Kowbojski kapelusz', 'r', 'cowboy'], ['ht_top', 'Cylinder', 'r', 'tophat'],
  ['ht_crown', 'Korona', 'e', 'crown'], ['ht_halo', 'Aureola', 'e', 'halo'], ['ht_santa', 'Czapka Mikołaja', 'e', 'santa'], ['ht_devil', 'Diabelskie rogi', 'e', 'devil'], ['ht_wizard', 'Kapelusz czarodzieja', 'e', 'wizard'], ['ht_party', 'Czapeczka imprezowa', 'e', 'party'],
  ['ht_fire', 'Płonąca korona', 'l', 'firecrown'], ['ht_wings', 'Skrzydła anioła', 'l', 'wings'], ['ht_laurel', 'Złote laury', 'l', 'laurel'],
  ['ht_cabbage', 'Kapuściana głowa', 'm', 'cabbage'], ['ht_space', 'Kosmiczny klosz', 'm', 'space'],
  ['ht_skull', 'Czaszka bossa', 'l', 'skullh', { src: 'boss3' }]
].forEach(([id, n, r, kind, ex]) => addCos('hat', id, n, r, Object.assign({ kind }, ex || {})));
// --- ślady pocisków
[
  ['tr_def', 'Kolor broni', 'c', null, { def: true }], ['tr_white', 'Biały', 'c', '#ffffff'], ['tr_green', 'Zielony', 'c', '#5dff8a'], ['tr_blue', 'Niebieski', 'c', '#3ea0ff'],
  ['tr_red', 'Czerwony', 'r', '#ff3d5a'], ['tr_purple', 'Fioletowy', 'r', '#b45cff'], ['tr_pink', 'Różowy', 'r', '#ff6ad8'], ['tr_gold', 'Złoty', 'r', '#ffc93c'],
  ['tr_ice', 'Lodowe iskry', 'e', '#9ae8ff', { spark: '#ffffff' }], ['tr_fire', 'Ogniste iskry', 'e', '#ff6a1a', { spark: '#ffd060' }], ['tr_toxic', 'Toksyczny', 'e', '#a6ff2e', { spark: '#e8ff90' }],
  ['tr_rainbow', 'Tęcza', 'l', '#ff8ad8', { rainbow: true }], ['tr_stars', 'Gwiezdny pył', 'l', '#fff6c4', { spark: '#ffe14d', star: true }],
  ['tr_void', 'Czarna dziura', 'm', '#c77dff', { spark: '#6a1aff', dark: true }], ['tr_cabbage', 'Kapuściane liście', 'm', '#6ac84a', { spark: '#b8ff7a', leaf: true }]
].forEach(([id, n, r, col, ex]) => addCos('trail', id, n, r, Object.assign({ col }, ex || {})));
// --- efekty zrywu
[
  ['da_def', 'Standardowy', 'c', 'smoke', '#8aa0c0', { def: true }], ['da_dust', 'Kurz', 'c', 'smoke', '#c8a870'],
  ['da_spark', 'Iskry', 'r', 'spark', '#ffd28a'], ['da_bubble', 'Bąbelki', 'r', 'ring', '#7fd8ff'],
  ['da_fire', 'Ogień', 'e', 'fire', '#ff6a1a'], ['da_ice', 'Lód', 'e', 'shape:square', '#bfefff'], ['da_pixel', 'Pikselki', 'e', 'shape:pixel', '#5dff8a'],
  ['da_bolt', 'Błyskawica', 'l', 'bolt', '#b9a6ff'], ['da_heart', 'Serduszka', 'l', 'shape:heart', '#ff6ad8'],
  ['da_portal', 'Portal', 'm', 'portal', '#c77dff']
].forEach(([id, n, r, fx, col, ex]) => addCos('dash', id, n, r, Object.assign({ fx, col }, ex || {})));
// --- efekty eliminacji
[
  ['ki_none', 'Brak', 'c', 'none', '#ffffff', { def: true }], ['ki_spark', 'Iskry', 'c', 'spark', '#ffd28a'],
  ['ki_confetti', 'Konfetti', 'r', 'confetti', '#ffffff'], ['ki_smoke', 'Dymek', 'r', 'smoke', '#5a5a6a'],
  ['ki_hearts', 'Serca', 'e', 'shape:heart', '#ff6ad8'], ['ki_coins', 'Deszcz monet', 'e', 'coins', '#ffc93c'], ['ki_pixel', 'Pikseloza', 'e', 'shape:pixel', '#3ef0ff'],
  ['ki_bolt', 'Piorun', 'l', 'bolt', '#b9a6ff'], ['ki_fireworks', 'Fajerwerki', 'l', 'fireworks', '#ffe14d'],
  ['ki_void', 'Czarna dziura', 'm', 'void', '#c77dff'], ['ki_cabbage', 'Kapuściany wybuch', 'm', 'shape:leaf', '#6ac84a'],
  ['ki_stars', 'Gwiazdki', 'e', 'shape:star', '#ffe14d', { src: 'pvpwin' }]
].forEach(([id, n, r, fx, col, ex]) => addCos('kill', id, n, r, Object.assign({ fx, col }, ex || {})));
// --- zwierzaki
[
  ['pe_none', 'Brak', 'c', 'none', { def: true }], ['pe_orb', 'Kulka', 'c', 'orb', { col: '#3ef0ff' }],
  ['pe_cube', 'Kostka', 'r', 'cube', { col: '#ffb627' }], ['pe_drone', 'Mini-dron', 'r', 'drone', { col: '#9aa4b2' }], ['pe_fly', 'Świetlik', 'r', 'firefly', { col: '#c8ff6a' }],
  ['pe_bat', 'Nietoperz', 'e', 'bat', { col: '#6a4a8a' }], ['pe_jelly', 'Meduza', 'e', 'jelly', { col: '#ff8ad8' }], ['pe_cat', 'Kotodron', 'e', 'catbot', { col: '#e8eef6' }],
  ['pe_dragon', 'Smoczek', 'l', 'dragon', { col: '#ff6a3d' }], ['pe_ghost', 'Duszek', 'l', 'ghost', { col: '#e8f4ff' }],
  ['pe_colossus', 'Mini-Kolos', 'm', 'colossus', { col: '#ff8a1a' }], ['pe_cabbage', 'Kapustek', 'm', 'cabbage', { col: '#6ac84a' }],
  ['pe_star', 'Gwiazdeczka', 'l', 'star', { col: '#ffe14d', src: 'surv25' }]
].forEach(([id, n, r, kind, ex]) => addCos('pet', id, n, r, Object.assign({ kind }, ex || {})));
// --- tytuły
[
  ['ti_rookie', 'Rekrut', 'c', { def: true }], ['ti_private', 'Szeregowy', 'c'], ['ti_cadet', 'Kadet', 'c'], ['ti_scout', 'Zwiadowca', 'c'], ['ti_rookie2', 'Świeżak', 'c'], ['ti_gunner', 'Strzelec', 'c'],
  ['ti_bugs', 'Pogromca robali', 'r'], ['ti_corporal', 'Kapral chaosu', 'r'], ['ti_dodge', 'Mistrz uników', 'r'], ['ti_barrels', 'Pan beczek', 'r'], ['ti_sniper', 'Snajper z dżungli', 'r'], ['ti_medic', 'Polowy łapiduch', 'r'], ['ti_wrench', 'Złota rączka', 'r'],
  ['ti_ice', 'Lodowe serce', 'e'], ['ti_lava', 'Król lawy', 'e'], ['ti_storm', 'Burza', 'e'], ['ti_shadow', 'Cień', 'e'], ['ti_hunter', 'Łowca bossów', 'e'], ['ti_tank', 'Chodzący czołg', 'e'], ['ti_lucky', 'Szczęściarz', 'e'],
  ['ti_legend', 'Legenda Strefy', 'l'], ['ti_immortal', 'Nieśmiertelny', 'l'], ['ti_general', 'Generał', 'l'], ['ti_phantom', 'Widmo', 'l'],
  ['ti_baron', 'Kapuściany Baron', 'm'], ['ti_zero', 'Pacjent Zero', 'm'], ['ti_god', 'Bóg wojny', 'm'],
  ['ti_queen', 'Królobójca', 'e', { src: 'boss1' }], ['ti_swarm', 'Pogromca roju', 'l', { src: 'k1000' }], ['ti_perfect', 'Perfekcjonista', 'l', { src: 'stars' }], ['ti_glad', 'Gladiator', 'e', { src: 'pvp10' }], ['ti_team', 'Brat broni', 'e', { src: 'coop' }], ['ti_pyro', 'Piroman', 'r', { src: 'barrels' }]
].forEach(([id, n, r, ex]) => addCos('title', id, n, r, ex || {}));

const COS_DEF_EQ = { skin: 'sk_def', visor: 'vi_def', hat: 'ht_none', trail: 'tr_def', dash: 'da_def', kill: 'ki_none', pet: 'pe_none', title: 'ti_rookie' };
const CRATES = {
  c: { name: 'Zwykła skrzynia', price: 150, items: 1, w: { c: 60, r: 28, e: 9.5, l: 2.2, m: .3 }, col: '#7a8ca8' },
  e: { name: 'Elitarna skrzynia', price: 400, items: 2, w: { r: 66, e: 26, l: 7, m: 1 }, col: '#b45cff' },
  l: { name: 'Legendarna skrzynia', price: 1000, items: 3, w: { e: 64, l: 30, m: 6 }, col: '#ffb627' }
};
function ensureCos() {
  const d = { own: {}, eq: Object.assign({}, COS_DEF_EQ), shards: 0, crates: { c: 1, e: 0, l: 0 }, gift: '', seen: {} };
  save.cos = Object.assign(d, save.cos || {});
  save.cos.eq = Object.assign({}, COS_DEF_EQ, save.cos.eq || {});
  save.cos.crates = Object.assign({ c: 0, e: 0, l: 0 }, save.cos.crates || {});
  for (const it of COS_LIST) if (it.def) save.cos.own[it.id] = 1;
  for (const k in save.cos.eq) if (!COS[save.cos.eq[k]] || !save.cos.own[save.cos.eq[k]]) save.cos.eq[k] = COS_DEF_EQ[k];
}
ensureCos();
function owns(id) { return !!save.cos.own[id]; }
function unlockAchItems() {
  const got = [];
  for (const it of COS_LIST) if (it.src && save.ach[it.src] && !owns(it.id)) { save.cos.own[it.id] = 1; got.push(it); }
  return got;
}
function rollItem(weights) {
  let tot = 0; for (const k in weights) tot += weights[k];
  let x = Math.random() * tot, r = 'c';
  for (const k in weights) { x -= weights[k]; if (x <= 0) { r = k; break; } }
  const pool = COS_LIST.filter(it => it.r === r && !it.def && !it.src);
  return pick(pool);
}
// otwiera skrzynię, zwraca listę wyników {it, dup, shards}
function openCrate(type) {
  const C = CRATES[type]; if (!C || save.cos.crates[type] <= 0) return null;
  save.cos.crates[type]--;
  const out = [];
  for (let i = 0; i < C.items; i++) {
    const it = rollItem(C.w);
    if (owns(it.id)) { const s = RAR[it.r].dup; save.cos.shards += s; out.push({ it, dup: true, shards: s }); }
    else { save.cos.own[it.id] = 1; save.cos.seen[it.id] = 0; out.push({ it, dup: false }); }
  }
  persist();
  return out;
}
function giveCrate(type, n, why) { save.cos.crates[type] = (save.cos.crates[type] || 0) + (n || 1); persist(); if (why && typeof toast === 'function') toast('Nagroda: <b>' + CRATES[type].name + (n > 1 ? ' ×' + n : '') + '</b> · ' + why); }
function cratesTotal() { const c = save.cos.crates; return (c.c || 0) + (c.e || 0) + (c.l || 0); }
function myLook() { const e = save.cos.eq; return { hero: save.hero, skin: e.skin, visor: e.visor, hat: e.hat }; }
function myCos() { const e = save.cos.eq; return { trail: e.trail, dash: e.dash, kill: e.kill, pet: e.pet, title: e.title }; }
const RAINBOW = ['#ff4d6d', '#ff8a1a', '#ffe14d', '#a6ff2e', '#3effa0', '#3ef0ff', '#3ea0ff', '#7a5cff', '#c77dff', '#ff6ad8'];

// ---------- rysowanie wzorów pancerza (w układzie sprite'a gracza) ----------
function drawSkinPattern(g, sk) {
  const P = sk.pal, pat = sk.pat;
  withSeed(hashStr(sk.id), () => {
    switch (pat) {
      case 'camo': for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? P[2] : P[3]; ell(g, rand(-12, 10), rand(-17, 17), rand(3, 6), rand(2, 4), rand(0, 3)); g.fill(); } break;
      case 'tiger': g.strokeStyle = P[3]; g.lineWidth = 2.2; for (let y = -16; y <= 16; y += 5) { g.beginPath(); g.moveTo(-12, y); g.quadraticCurveTo(-4, y + rand(-4, 4), 4, y + rand(-2, 2)); g.stroke(); } break;
      case 'carbon': g.fillStyle = P[3]; for (let x = -12; x < 12; x += 3) for (let y = -18; y < 18; y += 3) if ((x + y) % 2 === 0) g.fillRect(x, y, 1.5, 1.5); break;
      case 'dots': g.fillStyle = P[3]; for (let x = -10; x < 12; x += 5) for (let y = -16; y < 18; y += 5) { g.beginPath(); g.arc(x + (y % 10 ? 2.5 : 0), y, 1.4, 0, TAU); g.fill(); } break;
      case 'hex': g.strokeStyle = hexA(P[3], .7); g.lineWidth = .8; for (let x = -12; x < 12; x += 5) for (let y = -18; y < 18; y += 4.4) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, px = x + (Math.round(y / 4.4) % 2 ? 2.5 : 0) + Math.cos(a) * 2.6, py = y + Math.sin(a) * 2.6; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.stroke(); } break;
      case 'hazard': g.fillStyle = P[3]; for (let k = -30; k < 30; k += 7) { g.beginPath(); g.moveTo(k, -18); g.lineTo(k + 3.5, -18); g.lineTo(k + 3.5 + 36, 18); g.lineTo(k + 36, 18); g.fill(); } break;
      case 'stripes': g.fillStyle = P[3]; g.fillRect(-12, -3, 24, 2.2); g.fillRect(-12, 1.5, 24, 1.2); break;
      case 'neon': case 'trim': g.strokeStyle = P[3]; g.lineWidth = 1.6; if (pat === 'neon') { g.shadowColor = P[3]; g.shadowBlur = 5; } ell(g, -1, 0, 9.6, 15); g.stroke(); g.beginPath(); g.moveTo(-8, -9); g.lineTo(4, -12); g.moveTo(-8, 9); g.lineTo(4, 12); g.stroke(); g.shadowBlur = 0; break;
      case 'flames': for (let i = 0; i < 6; i++) { const y = rand(-14, 14); g.fillStyle = i % 2 ? P[3] : '#ffd060'; g.beginPath(); g.moveTo(-12, y - 3); g.quadraticCurveTo(-2, y - 4, 6 + rand(0, 4), y); g.quadraticCurveTo(-2, y + 4, -12, y + 3); g.fill(); } break;
      case 'bolt': g.strokeStyle = P[3]; g.lineWidth = 1.4; g.shadowColor = P[3]; g.shadowBlur = 5; for (let i = 0; i < 2; i++) { g.beginPath(); let x = -11, y = rand(-12, 12); g.moveTo(x, y); while (x < 8) { x += rand(3, 6); y += rand(-5, 5); g.lineTo(x, y); } g.stroke(); } g.shadowBlur = 0; break;
      case 'ice': for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.55)' : 'rgba(120,200,255,.35)'; g.beginPath(); g.moveTo(rand(-12, 8), rand(-16, 16)); g.lineTo(rand(-12, 8), rand(-16, 16)); g.lineTo(rand(-12, 8), rand(-16, 16)); g.fill(); } break;
      case 'waves': g.strokeStyle = P[3]; g.lineWidth = 1.3; for (let y = -14; y <= 14; y += 5) { g.beginPath(); for (let x = -12; x <= 10; x += 2) g.lineTo(x, y + Math.sin(x * .7) * 1.5); g.stroke(); } break;
      case 'gold': g.strokeStyle = 'rgba(120,70,0,.6)'; g.lineWidth = .8; for (let k = 0; k < 3; k++) { ell(g, -1, 0, 4 + k * 3, 6 + k * 4); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.6)'; ell(g, -5, -7, 3, 6, -.4); g.fill(); break;
      case 'chrome': for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.7)' : 'rgba(40,50,70,.35)'; g.fillRect(-12 + i * 5, -18, 2.5, 36); } break;
      case 'stars': g.fillStyle = 'rgba(200,120,255,.35)'; ell(g, -4, -6, 7, 5); g.fill(); g.fillStyle = 'rgba(80,160,255,.3)'; ell(g, 2, 8, 6, 4); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 22; i++) g.fillRect(rand(-11, 9), rand(-16, 16), rand(.6, 1.4), rand(.6, 1.4)); break;
      case 'lava': g.strokeStyle = P[3]; g.lineWidth = 1.3; g.shadowColor = '#ff6a00'; g.shadowBlur = 6; for (let i = 0; i < 4; i++) { g.beginPath(); let x = rand(-11, 6), y = rand(-15, 15); g.moveTo(x, y); for (let k = 0; k < 3; k++) { x += rand(-5, 5); y += rand(-5, 5); g.lineTo(x, y); } g.stroke(); } g.shadowBlur = 0; break;
      case 'rainbow': RAINBOW.forEach((c, i) => { g.fillStyle = hexA(c, .75); g.fillRect(-12, -17 + i * 3.5, 24, 3.6); }); break;
      case 'void': g.fillStyle = '#fff'; for (let i = 0; i < 16; i++) g.fillRect(rand(-11, 9), rand(-16, 16), 1, 1); g.strokeStyle = P[3]; g.lineWidth = 1.5; g.shadowColor = P[3]; g.shadowBlur = 8; ell(g, -1, 0, 10, 15.5); g.stroke(); g.shadowBlur = 0; break;
      case 'cabbage': g.strokeStyle = P[3]; g.lineWidth = 1; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(-12, i * 2); g.quadraticCurveTo(-2, i * 5, 6, i * 6); g.stroke(); } g.strokeStyle = P[2]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-12, 0); g.lineTo(8, 0); g.stroke(); break;
    }
  });
}
// ---------- nakrycia głowy (środek hełmu w (1,0), patrzy w +x) ----------
function drawHat(g, kind, back) {
  const ink = '#0b1018';
  g.lineWidth = 1.5; g.strokeStyle = ink;
  if (back) { // elementy pod ciałem
    if (kind === 'wings') for (const s of [-1, 1]) {
      g.fillStyle = LG(g, -10, 0, -30, s * 26, [[0, '#ffffff'], [1, '#cfe6ff']]);
      g.beginPath(); g.moveTo(-8, s * 6); g.quadraticCurveTo(-26, s * 10, -34, s * 28); g.quadraticCurveTo(-20, s * 22, -16, s * 26); g.quadraticCurveTo(-14, s * 16, -8, s * 12); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(120,160,200,.6)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-10 - k * 5, s * (8 + k * 2)); g.lineTo(-18 - k * 5, s * (16 + k * 4)); g.stroke(); } g.strokeStyle = ink; g.lineWidth = 1.5;
    }
    return;
  }
  switch (kind) {
    case 'cap': g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(0, 0, 10.5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#b81a1a'; g.beginPath(); g.ellipse(10, 0, 7, 8.5, 0, -Math.PI / 2, Math.PI / 2); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill(); break;
    case 'band': g.strokeStyle = '#ff3d5a'; g.lineWidth = 3.4; g.beginPath(); g.arc(1, 0, 9.6, 0, TAU); g.stroke(); g.lineWidth = 2.4; g.beginPath(); g.moveTo(-8, 0); g.quadraticCurveTo(-14, -3, -18, -6); g.moveTo(-8, 1); g.quadraticCurveTo(-14, 4, -17, 8); g.stroke(); break;
    case 'antenna': g.strokeStyle = '#6a7484'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-2, -4); g.lineTo(-10, -16); g.stroke(); g.fillStyle = '#ff3d5a'; g.beginPath(); g.arc(-10, -16, 2.6, 0, TAU); g.fill(); break;
    case 'bandana': g.fillStyle = '#2a6ae8'; g.beginPath(); g.arc(1, 0, 10.5, Math.PI * .55, Math.PI * 1.45); g.lineTo(6, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-4 + (i % 2) * 3, -6 + i * 3, .9, 0, TAU); g.fill(); } g.fillStyle = '#2a6ae8'; g.beginPath(); g.moveTo(-9, -1); g.lineTo(-17, -5); g.lineTo(-15, 2); g.closePath(); g.fill(); g.stroke(); break;
    case 'mohawk': for (let i = 0; i < 6; i++) { const x = 8 - i * 3.6; g.fillStyle = i % 2 ? '#ff4dd8' : '#b45cff'; g.beginPath(); g.moveTo(x + 2, -2.4); g.lineTo(x - 3, 0); g.lineTo(x + 2, 2.4); g.closePath(); g.fill(); g.stroke(); } break;
    case 'viking': for (const s of [-1, 1]) { g.fillStyle = '#f4ead0'; g.beginPath(); g.moveTo(2, s * 8); g.quadraticCurveTo(4, s * 18, 12, s * 20); g.quadraticCurveTo(4, s * 14, 6, s * 7); g.closePath(); g.fill(); g.stroke(); } g.strokeStyle = '#8a6a3a'; g.lineWidth = 2.4; g.beginPath(); g.arc(1, 0, 9.5, 0, TAU); g.stroke(); break;
    case 'cat': for (const s of [-1, 1]) { g.fillStyle = '#2a2a34'; g.beginPath(); g.moveTo(-4, s * 4); g.lineTo(-1, s * 15); g.lineTo(5, s * 6); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ff8ad8'; g.beginPath(); g.moveTo(-2, s * 6); g.lineTo(-.5, s * 12); g.lineTo(3, s * 7); g.closePath(); g.fill(); } break;
    case 'phones': g.strokeStyle = '#2a2e38'; g.lineWidth = 3; g.beginPath(); g.moveTo(-1, -11); g.lineTo(-1, 11); g.stroke(); for (const s of [-1, 1]) { g.fillStyle = '#3ef0ff'; rrect(g, -5, s * 10 - 3, 9, 6, 2); g.fill(); g.stroke(); } break;
    case 'cowboy': g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(0, 0, 18, 16, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#6a4018'; g.beginPath(); g.ellipse(0, 0, 10, 8, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#2a1a0a'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 10.5, 8.5, 0, 0, TAU); g.stroke(); break;
    case 'tophat': g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#2a2a34'; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); g.strokeStyle = '#b81a1a'; g.lineWidth = 2.2; g.stroke(); break;
    case 'crown': case 'firecrown': {
      if (kind === 'firecrown') for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.fillStyle = i % 2 ? '#ff6a1a' : '#ffd060'; g.beginPath(); g.moveTo(Math.cos(a - .25) * 9, Math.sin(a - .25) * 9); g.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); g.lineTo(Math.cos(a + .25) * 9, Math.sin(a + .25) * 9); g.fill(); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.fillStyle = '#ffc93c'; g.beginPath(); g.moveTo(Math.cos(a - .3) * 8, Math.sin(a - .3) * 8); g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); g.lineTo(Math.cos(a + .3) * 8, Math.sin(a + .3) * 8); g.fill(); g.stroke(); }
      g.strokeStyle = '#ffc93c'; g.lineWidth = 3.4; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.stroke(); g.fillStyle = '#ff3d5a'; g.beginPath(); g.arc(8, 0, 1.8, 0, TAU); g.fill(); g.fillStyle = '#3ea0ff'; g.beginPath(); g.arc(-8, 0, 1.8, 0, TAU); g.fill(); break;
    }
    case 'halo': g.strokeStyle = '#ffe14d'; g.lineWidth = 2.6; g.shadowColor = '#ffe14d'; g.shadowBlur = 10; g.beginPath(); g.ellipse(-3, 0, 13, 13, 0, 0, TAU); g.stroke(); g.shadowBlur = 0; break;
    case 'santa': g.fillStyle = '#d81a2a'; g.beginPath(); g.arc(1, 0, 10.5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#d81a2a'; g.beginPath(); g.moveTo(-6, -6); g.quadraticCurveTo(-16, -2, -20, 8); g.lineTo(-6, 6); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3.2; g.beginPath(); g.arc(1, 0, 9.5, -1.2, 1.2); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-20, 8, 3.4, 0, TAU); g.fill(); break;
    case 'devil': for (const s of [-1, 1]) { g.fillStyle = '#d81a2a'; g.beginPath(); g.moveTo(3, s * 5); g.quadraticCurveTo(8, s * 12, 14, s * 11); g.quadraticCurveTo(9, s * 8, 7, s * 3); g.closePath(); g.fill(); g.stroke(); } break;
    case 'wizard': g.fillStyle = '#4a2a8a'; g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#6a3ab8'; g.beginPath(); g.arc(-2, 0, 9, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#ffe14d'; for (const [x, y] of [[-10, -8], [8, 9], [-6, 11], [10, -9]]) { g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2; g.lineTo(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2); g.lineTo(x + Math.cos(a + .63) * .9, y + Math.sin(a + .63) * .9); } g.fill(); } break;
    case 'party': RAINBOW.slice(0, 6).forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 10, i / 6 * TAU, (i + 1) / 6 * TAU); g.fill(); }); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 2.6, 0, TAU); g.fill(); break;
    case 'laurel': for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const a = Math.PI + s * (i * .42 + .3); g.fillStyle = i % 2 ? '#ffc93c' : '#e8a820'; ell(g, Math.cos(a) * 10, Math.sin(a) * 10, 3.6, 1.8, a + s * 1.2); g.fill(); g.stroke(); } break;
    case 'cabbage': for (let i = 6; i >= 0; i--) { g.fillStyle = i % 2 ? '#8ad86a' : '#5ab03a'; g.beginPath(); g.arc(Math.cos(i) * 2, Math.sin(i * 2) * 2, 6 + i * 1.6, 0, TAU); g.fill(); g.stroke(); } g.strokeStyle = 'rgba(230,255,200,.7)'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a + .5) * 8, Math.sin(a + .5) * 8, Math.cos(a) * 15, Math.sin(a) * 15); g.stroke(); } break;
    case 'space': g.fillStyle = 'rgba(160,220,255,.25)'; g.beginPath(); g.arc(1, 0, 15, 0, TAU); g.fill(); g.strokeStyle = 'rgba(220,245,255,.9)'; g.lineWidth = 1.6; g.stroke(); g.fillStyle = '#fff'; for (const [x, y] of [[-6, -8], [4, -10], [-9, 4], [8, 8]]) g.fillRect(x, y, 1.2, 1.2); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.4; g.beginPath(); g.arc(1, 0, 12, 3.6, 4.4); g.stroke(); break;
    case 'skullh': g.fillStyle = '#efe6d0'; g.beginPath(); g.arc(1, 0, 11.5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#1a1010'; g.beginPath(); g.arc(6, -4, 2.6, 0, TAU); g.arc(6, 4, 2.6, 0, TAU); g.fill(); for (const s of [-1, 1]) { g.fillStyle = '#efe6d0'; g.beginPath(); g.moveTo(-2, s * 8); g.lineTo(2, s * 18); g.lineTo(5, s * 9); g.closePath(); g.fill(); g.stroke(); } break;
  }
}
// ---------- zwierzaki ----------
const PET_SPR = {};
function petSpr(id) {
  if (PET_SPR[id]) return PET_SPR[id];
  const it = COS[id], c = it.col || '#3ef0ff', ink = '#0b1018';
  const s = sprite(48, 48, g => {
    g.lineWidth = 1.5; g.strokeStyle = ink;
    const shade = (r) => RG(g, -r * .35, -r * .4, 0, 0, 0, r, [[0, '#ffffff'], [.4, c], [1, hexA(c, .6)]]);
    switch (it.kind) {
      case 'orb': g.fillStyle = shade(8); g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill(); g.strokeStyle = hexA(c, .8); g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 0, 13, 5, -.4, 0, TAU); g.stroke(); break;
      case 'cube': g.fillStyle = c; g.beginPath(); g.moveTo(0, -9); g.lineTo(8, -4.5); g.lineTo(0, 0); g.lineTo(-8, -4.5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = hexA(c, .7); g.beginPath(); g.moveTo(-8, -4.5); g.lineTo(0, 0); g.lineTo(0, 9); g.lineTo(-8, 4.5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#7a4a08'; g.beginPath(); g.moveTo(8, -4.5); g.lineTo(0, 0); g.lineTo(0, 9); g.lineTo(8, 4.5); g.closePath(); g.fill(); g.stroke(); break;
      case 'drone': for (const [x, y] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) { g.fillStyle = 'rgba(220,230,240,.4)'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = shade(6); g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#ff3d5a'; g.beginPath(); g.arc(3, 0, 2, 0, TAU); g.fill(); break;
      case 'firefly': for (const s of [-1, 1]) { g.fillStyle = 'rgba(220,255,240,.5)'; ell(g, -1, s * 6, 6, 3.5, s * .4); g.fill(); g.stroke(); } g.fillStyle = '#3a3a2a'; ell(g, 4, 0, 4, 3.5); g.fill(); g.stroke(); g.fillStyle = shade(5); ell(g, -4, 0, 5.5, 4.5); g.fill(); g.stroke(); break;
      case 'bat': for (const s of [-1, 1]) { g.fillStyle = c; g.beginPath(); g.moveTo(0, s * 3); g.quadraticCurveTo(-4, s * 14, 2, s * 18); g.quadraticCurveTo(0, s * 12, -6, s * 10); g.quadraticCurveTo(-4, s * 6, -3, s * 3); g.closePath(); g.fill(); g.stroke(); } g.fillStyle = '#2a1a3a'; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#ff3d5a'; g.fillRect(2, -2.5, 1.6, 1.6); g.fillRect(2, 1, 1.6, 1.6); break;
      case 'jelly': g.strokeStyle = hexA(c, .8); g.lineWidth = 1.4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-3, -4 + i * 2); g.quadraticCurveTo(-10, -6 + i * 3, -16, -4 + i * 2.5); g.stroke(); } g.fillStyle = RG(g, 2, -2, 0, 0, 0, 9, [[0, '#ffffff'], [.5, hexA(c, .8)], [1, hexA(c, .3)]]); g.beginPath(); g.arc(0, 0, 8, -Math.PI / 2, Math.PI / 2); g.lineTo(-2, 8); g.lineTo(-2, -8); g.closePath(); g.fill(); g.strokeStyle = ink; g.lineWidth = 1.2; g.stroke(); break;
      case 'catbot': for (const s of [-1, 1]) { g.fillStyle = '#9aa4b2'; g.beginPath(); g.moveTo(-3, s * 4); g.lineTo(-1, s * 12); g.lineTo(4, s * 5); g.closePath(); g.fill(); g.stroke(); } g.fillStyle = shade(8); g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#0b1018'; rrect(g, 1, -5, 6, 10, 2); g.fill(); g.fillStyle = '#3ef0ff'; g.fillRect(3, -3, 1.6, 2); g.fillRect(3, 1, 1.6, 2); break;
      case 'dragon': for (const s of [-1, 1]) { g.fillStyle = '#ffb627'; g.beginPath(); g.moveTo(0, s * 3); g.quadraticCurveTo(-4, s * 15, -10, s * 14); g.lineTo(-6, s * 4); g.closePath(); g.fill(); g.stroke(); } g.fillStyle = c; ell(g, -2, 0, 9, 5); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-10, 0); g.lineTo(-17, -2); g.lineTo(-16, 2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = c; g.beginPath(); g.arc(7, 0, 4.5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(8, -2.5, 1.6, 1.6); g.fillRect(8, 1, 1.6, 1.6); break;
      case 'ghost': g.fillStyle = 'rgba(240,248,255,.9)'; g.beginPath(); g.arc(2, 0, 8, -Math.PI / 2, Math.PI / 2); for (let i = 0; i < 4; i++) g.lineTo(-10 + (i % 2) * 3, 8 - i * 5.3); g.lineTo(-10, -8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#1a1a2a'; g.beginPath(); g.arc(5, -3, 1.6, 0, TAU); g.arc(5, 3, 1.6, 0, TAU); g.fill(); break;
      case 'colossus': g.save(); g.shadowColor = '#ff6a00'; g.shadowBlur = 8; g.fillStyle = '#ff6a00'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); g.restore(); for (const [x, y, r] of [[-4, -4, 5], [-4, 4, 5], [3, -3, 4.5], [3, 3, 4.5], [7, 0, 4]]) { g.fillStyle = LG(g, x - r, y - r, x + r, y + r, [[0, '#6a4a40'], [1, '#1a0f0c']]); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = '#fff2a0'; g.fillRect(8, -2, 1.6, 1.6); g.fillRect(8, 1, 1.6, 1.6); break;
      case 'cabbage': for (let i = 4; i >= 0; i--) { g.fillStyle = i % 2 ? '#8ad86a' : '#5ab03a'; g.beginPath(); g.arc(0, 0, 4 + i * 1.6, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(4, -3, 2.2, 0, TAU); g.arc(4, 3, 2.2, 0, TAU); g.fill(); g.fillStyle = '#0b1018'; g.beginPath(); g.arc(5, -3, 1.1, 0, TAU); g.arc(5, 3, 1.1, 0, TAU); g.fill(); break;
      case 'star': g.fillStyle = RG(g, 0, 0, 0, 0, 0, 10, [[0, '#ffffff'], [.5, c], [1, '#ff8a1a']]); g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2; g.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(Math.cos(a + .63) * 4.2, Math.sin(a + .63) * 4.2); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#0b1018'; g.fillRect(-2.5, -1, 1.4, 2); g.fillRect(1, -1, 1.4, 2); break;
    }
  });
  return PET_SPR[id] = s;
}
// ---------- efekty ----------
function shapeParticles(x, y, shape, col, n, spd) {
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(spd * .3, spd); part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rand(.5, 1), size: rand(4, 7), color: col, type: 'shape', shape, drag: 2.5, rot: rand(0, TAU), vr: rand(-6, 6) }); }
}
function cosFx(fx, col, x, y, big) {
  const n = big ? 2 : 1;
  if (fx.startsWith('shape:')) { shapeParticles(x, y, fx.slice(6), col, 10 * n, 220); return; }
  switch (fx) {
    case 'spark': sparks(x, y, col, 14 * n, 380); break;
    case 'smoke': smoke(x, y, 4 * n, col, 16); break;
    case 'ring': for (let i = 0; i < 6 * n; i++) part({ x: x + rand(-14, 14), y: y + rand(-14, 14), vy: -50, life: rand(.4, .8), size: rand(5, 10), color: col, type: 'ring' }); break;
    case 'fire': for (let i = 0; i < 10 * n; i++) part({ x: x + rand(-8, 8), y: y + rand(-8, 8), vx: rand(-60, 60), vy: rand(-90, -20), life: rand(.3, .6), size: rand(6, 11), color: pick(['#ff6a1a', '#ffb000', '#ff3d1a']), type: 'fire', grow: -10 }); break;
    case 'bolt': { const pts = [[x, y - 80]]; for (let k = 1; k < 6; k++) pts.push([x + rand(-14, 14), y - 80 + k * 16]); pts.push([x, y]); G.bolts.push({ pts, life: .2 }); flash(x, y, 120, col, .15); sparks(x, y, col, 10, 260); break; }
    case 'portal': part({ x, y, life: .5, size: 26, color: col, type: 'ring' }); part({ x, y, life: .35, size: 14, color: '#ffffff', type: 'ring' }); break;
    case 'confetti': shapeParticles(x, y, 'pixel', null, 18 * n, 300); break;
    case 'coins': shapeParticles(x, y, 'coin', '#ffc93c', 10 * n, 240); break;
    case 'fireworks': for (let k = 0; k < 3; k++) { const c = pick(RAINBOW), ox = x + rand(-30, 30), oy = y + rand(-40, -10); sparks(ox, oy, c, 14, 260); flash(ox, oy, 60, c, .15); } break;
    case 'void': part({ x, y, life: .6, size: 40, color: '#c77dff', type: 'implode' }); for (let i = 0; i < 16; i++) { const a = rand(0, TAU), d = rand(30, 60); part({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.cos(a) * d * 3, vy: -Math.sin(a) * d * 3, life: .3, size: 2, color: '#c77dff', type: 'spark', drag: 0 }); } break;
  }
}
function killFx(id, x, y, big) { const it = COS[id]; if (!it || it.fx === 'none') return; cosFx(it.fx, it.col, x, y, big); }
function dashFx(id, x, y) { const it = COS[id] || COS.da_def; cosFx(it.fx, it.col, x, y, false); }
function drawShapeParticle(g, q, a) {
  g.save(); g.translate(q.x, q.y - (q.z || 0)); g.rotate(q.rot); g.globalAlpha = a;
  const s = q.size, col = q.color || pick(RAINBOW);
  if (!q.color) q.color = col;
  g.fillStyle = col;
  switch (q.shape) {
    case 'heart': g.beginPath(); g.moveTo(0, s * .5); g.bezierCurveTo(-s, -s * .2, -s * .5, -s, 0, -s * .35); g.bezierCurveTo(s * .5, -s, s, -s * .2, 0, s * .5); g.fill(); break;
    case 'star': g.beginPath(); for (let k = 0; k < 5; k++) { const an = k / 5 * TAU - Math.PI / 2; g.lineTo(Math.cos(an) * s * .7, Math.sin(an) * s * .7); g.lineTo(Math.cos(an + .63) * s * .3, Math.sin(an + .63) * s * .3); } g.fill(); break;
    case 'leaf': g.beginPath(); g.ellipse(0, 0, s * .8, s * .4, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(230,255,200,.8)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-s * .7, 0); g.lineTo(s * .7, 0); g.stroke(); break;
    case 'coin': g.fillStyle = '#ffc93c'; g.beginPath(); g.ellipse(0, 0, s * .5 * Math.abs(Math.cos(q.rot * 2)) + .5, s * .5, 0, 0, TAU); g.fill(); break;
    case 'square': g.globalAlpha = a * .8; g.fillRect(-s / 2, -s / 2, s, s); g.strokeStyle = '#fff'; g.lineWidth = .8; g.strokeRect(-s / 2, -s / 2, s, s); break;
    default: g.fillRect(-s / 2, -s / 2, s * .8, s * .8);
  }
  g.restore();
}
