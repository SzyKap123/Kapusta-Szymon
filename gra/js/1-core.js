'use strict';
// ================= Narzędzia =================
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[Math.floor(Math.random() * a.length)];
const hyp = Math.hypot;
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ================= Zapis =================
const SAVE_KEY = 'strefa0_v1';
const DEF_SAVE = { coins: 0, unlocked: 0, stars: [0, 0, 0, 0, 0, 0, 0, 0, 0], weapons: ['blaster'],
  upg: { hp: 0, dmg: 0, dash: 0, gren: 0, mag: 0 }, settings: { quality: 'high', sfx: true, music: true, auto: false } };
function loadSave() {
  const d = JSON.parse(JSON.stringify(DEF_SAVE));
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s === 'object') {
      Object.assign(d, s);
      d.upg = Object.assign({}, DEF_SAVE.upg, s.upg || {});
      d.settings = Object.assign({}, DEF_SAVE.settings, s.settings || {});
      if (!Array.isArray(d.stars) || d.stars.length < 9) d.stars = DEF_SAVE.stars.slice();
      if (!Array.isArray(d.weapons) || !d.weapons.length) d.weapons = ['blaster'];
    }
  } catch (e) {}
  return d;
}
let save = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

// ================= Dane gry =================
const WEAPONS = {
  blaster: { name: 'Blaster', desc: 'Niezawodny pistolet energetyczny.', price: 0, rate: 5, dmg: 20, spd: 950, mag: 16, reload: 1.0, spread: .04, pellets: 1, color: '#3ef0ff', r: 5, range: 720 },
  rifle: { name: 'Karabin Pulsacyjny', desc: 'Szybki ogień i duży magazynek.', price: 300, rate: 10, dmg: 13, spd: 1100, mag: 32, reload: 1.35, spread: .08, pellets: 1, color: '#8dff6a', r: 4, range: 740 },
  shotgun: { name: 'Rozpruwacz', desc: 'Plazmowa śrutówka – 7 pocisków naraz.', price: 450, rate: 1.6, dmg: 14, spd: 880, mag: 6, reload: 1.4, spread: .55, pellets: 7, color: '#ffb627', r: 4.5, range: 430 },
  rail: { name: 'Działo Szynowe', desc: 'Przebija wszystkich wrogów na linii.', price: 700, rate: 1.8, dmg: 75, spd: 1900, mag: 5, reload: 1.6, spread: 0, pellets: 1, pierce: 99, color: '#c77dff', r: 5, range: 1000 },
  rocket: { name: 'Wyrzutnia Burza', desc: 'Rakiety z wybuchem obszarowym.', price: 950, rate: 1.25, dmg: 42, spd: 640, mag: 4, reload: 1.9, spread: .02, pellets: 1, explode: 95, color: '#ff6b3d', r: 7, range: 760 }
};
const WEAPON_KEYS = Object.keys(WEAPONS);
const UPGRADES = {
  hp: { name: 'Pancerz', desc: '+20 maksymalnego zdrowia', max: 5, icon: 'shield', cost: l => 90 + l * 90 },
  dmg: { name: 'Moc broni', desc: '+10% obrażeń wszystkich broni', max: 5, icon: 'bolt', cost: l => 120 + l * 110 },
  dash: { name: 'Silnik zrywu', desc: '−12% czasu odnowienia zrywu', max: 4, icon: 'boot', cost: l => 100 + l * 100 },
  gren: { name: 'Ładownica', desc: '+1 granat na start misji', max: 3, icon: 'boom', cost: l => 130 + l * 120 },
  mag: { name: 'Magnes', desc: '+30% zasięgu zbierania', max: 3, icon: 'magnet', cost: l => 80 + l * 80 }
};
const PERKS = [
  { id: 'dmg', name: 'Ostre naboje', desc: '+20% obrażeń', icon: 'bolt', c: '#ffb627', max: 5 },
  { id: 'rate', name: 'Szybki spust', desc: '+15% szybkostrzelności', icon: 'rate', c: '#3ef0ff', max: 5 },
  { id: 'multi', name: 'Rozszczepienie', desc: '+1 pocisk w każdej salwie', icon: 'multi', c: '#8dff6a', max: 3 },
  { id: 'pierce', name: 'Przebicie', desc: 'Pociski przebijają +1 wroga', icon: 'pierce', c: '#c77dff', max: 3 },
  { id: 'bounce', name: 'Rykoszet', desc: 'Pociski odbijają się od przeszkód', icon: 'bounce', c: '#7fd8ff', max: 3 },
  { id: 'vamp', name: 'Wampiryzm', desc: 'Każde zabójstwo leczy 2 HP', icon: 'heart', c: '#ff4d6d', max: 3 },
  { id: 'hp', name: 'Nanopancerz', desc: '+30 maks. zdrowia i leczenie', icon: 'shield', c: '#8dff6a', max: 5 },
  { id: 'speed', name: 'Sprinter', desc: '+12% szybkości ruchu', icon: 'boot', c: '#3ef0ff', max: 3 },
  { id: 'orb', name: 'Satelita', desc: '+1 kula energii krążąca wokół ciebie', icon: 'orb', c: '#7fd8ff', max: 4 },
  { id: 'burn', name: 'Plazma', desc: 'Trafienia podpalają wrogów', icon: 'flame', c: '#ff7a2e', max: 3 },
  { id: 'chain', name: 'Łańcuch', desc: 'Szansa na piorun skaczący po wrogach', icon: 'chain', c: '#b9a6ff', max: 3 },
  { id: 'crit', name: 'Precyzja', desc: '+15% szansy na trafienie krytyczne ×2', icon: 'crit', c: '#ffe14d', max: 4 },
  { id: 'boom', name: 'Detonator', desc: 'Pokonani wrogowie wybuchają', icon: 'boom', c: '#ff6b3d', max: 2 },
  { id: 'magnet', name: 'Grawiton', desc: '+40% zasięgu zbierania', icon: 'magnet', c: '#8dff6a', max: 2 }
];
const BIOMES = [
  { name: 'Obca Dżungla', sub: 'Świecący las, w którym gnieździ się Rój.', accent: '#4dffd2', ebCol: '#e05cff', ambient: [140, 162, 196], amb2: '#4dffd2',
    css: 'radial-gradient(circle at 80% 0%, #1f8a6a, transparent 60%), linear-gradient(160deg, #0d2a24, #071512)',
    pal: { main: '#7cc63f', dark: '#2c5418', light: '#d4f58a', acc: '#b45cff', eye: '#ff3df2' } },
  { name: 'Pustkowia Magmy', sub: 'Pękająca skorupa i rzeki lawy.', accent: '#ff8a3d', ebCol: '#ff6a1a', ambient: [160, 124, 118], amb2: '#ff7a2e',
    css: 'radial-gradient(circle at 80% 0%, #a8381a, transparent 60%), linear-gradient(160deg, #2a1410, #0f0807)',
    pal: { main: '#4a2d28', dark: '#1a0d0b', light: '#9a5a44', acc: '#ff7a2e', eye: '#ffd23c' } },
  { name: 'Stacja Kriogeniczna', sub: 'Zamarznięta baza opanowana przez maszyny.', accent: '#7fd8ff', ebCol: '#5ad8ff', ambient: [122, 138, 182], amb2: '#7fd8ff',
    css: 'radial-gradient(circle at 80% 0%, #2a6aa8, transparent 60%), linear-gradient(160deg, #142236, #080e18)',
    pal: { main: '#cfdcec', dark: '#4a5b74', light: '#ffffff', acc: '#3ec9ff', eye: '#ff3d5a' } }
];
const EDEF = {
  crawler: { hp: 28, spd: 165, r: 15, dmg: 8, xp: 2 },
  drone: { hp: 36, spd: 120, r: 17, dmg: 9, xp: 3, hover: true },
  bomber: { hp: 22, spd: 200, r: 15, dmg: 26, xp: 2 },
  tank: { hp: 240, spd: 72, r: 30, dmg: 18, xp: 8 },
  sniper: { hp: 55, spd: 85, r: 19, dmg: 22, xp: 5 },
  queen: { hp: 2400, spd: 95, r: 56, dmg: 20, xp: 40, boss: true, name: 'Królowa Roju' },
  colossus: { hp: 3600, spd: 70, r: 60, dmg: 24, xp: 50, boss: true, name: 'Magmowy Kolos' },
  warden: { hp: 4800, spd: 85, r: 56, dmg: 22, xp: 60, boss: true, hover: true, name: 'Lodowy Strażnik' }
};
const BOSS_OF = ['queen', 'colossus', 'warden'];
function buildWaves(idx, boss) {
  const pool = [['crawler', 5]];
  if (idx >= 1) pool.push(['drone', 3]);
  if (idx >= 3) pool.push(['bomber', 2]);
  if (idx >= 4) pool.push(['tank', 1]);
  if (idx >= 6) pool.push(['sniper', 1.2]);
  const tot = pool.reduce((s, p) => s + p[1], 0);
  const n = boss ? 2 : 3 + (idx >= 4 ? 1 : 0);
  const waves = [];
  for (let w = 0; w < n; w++) {
    const count = 8 + idx * 2 + w * 4;
    const wave = [];
    for (let i = 0; i < count; i++) {
      let r = Math.random() * tot;
      for (const p of pool) { r -= p[1]; if (r <= 0) { wave.push(p[0]); break; } }
      if (wave.length <= i) wave.push('crawler');
    }
    waves.push(wave);
  }
  return waves;
}
const LEVELS = [];
for (let b = 0; b < 3; b++) for (let k = 0; k < 3; k++) LEVELS.push({ idx: b * 3 + k, biome: b, boss: k === 2 });

// ================= Ikony SVG =================
const ICONS = {
  bolt: '<path fill="currentColor" d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  rate: '<path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M4 6l6 6-6 6M12 6l6 6-6 6"/>',
  multi: '<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M3 12h15M3 12l13-7M3 12l13 7"/><circle cx="19" cy="12" r="2" fill="currentColor"/><circle cx="17" cy="4.5" r="2" fill="currentColor"/><circle cx="17" cy="19.5" r="2" fill="currentColor"/>',
  pierce: '<path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M2 12h19M15 6l6 6-6 6"/><path fill="none" stroke="currentColor" stroke-width="2" d="M8 6v12M12 8v8"/>',
  bounce: '<path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M2 18 8 6l6 12 6-12"/><path stroke="currentColor" stroke-width="2" d="M1 21h22"/>',
  heart: '<path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.3C.8 8 3.2 4.5 6.7 4.5c2.2 0 3.7 1.3 5.3 3.2 1.6-1.9 3.1-3.2 5.3-3.2 3.5 0 5.9 3.5 4.3 7.2C19.5 16.4 12 21 12 21z"/>',
  shield: '<path fill="currentColor" d="M12 2 4 5v6c0 5.2 3.4 9.3 8 11 4.6-1.7 8-5.8 8-11V5z"/><path fill="none" stroke="#0a1222" stroke-width="2" d="M8.5 12l2.5 2.5 4.5-5"/>',
  boot: '<path fill="currentColor" d="M5 3h6v7l6 2.5c2.4 1 4 2.6 4 5V20H3v-3h2z"/><path stroke="#0a1222" stroke-width="1.6" d="M11 13h3M11 16h5"/>',
  orb: '<circle cx="12" cy="12" r="4" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4.5" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(-25 12 12)"/><circle cx="20.5" cy="8" r="2" fill="currentColor"/>',
  flame: '<path fill="currentColor" d="M12 2c1.2 4.2 6.5 6.4 6.5 12.3A6.5 6.5 0 0 1 5.5 14.3c0-3 1.8-5 3-6.2 0 2 1 3.2 2.2 3.4C10.6 7.7 10.2 5 12 2z"/>',
  chain: '<path fill="currentColor" d="M8 1 3.5 12.5H9L6.5 23 18 9h-6l3-8z"/>',
  crit: '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
  boom: '<path fill="currentColor" d="M12 1l2.2 5.6L20 4l-2.4 5.8L23 12l-5.4 2.2L20 20l-5.8-2.4L12 23l-2.2-5.4L4 20l2.4-5.8L1 12l5.4-2.2L4 4l5.8 2.6z"/>',
  magnet: '<path fill="none" stroke="currentColor" stroke-width="3.4" d="M5 3v9a7 7 0 0 0 14 0V3"/><path stroke="#0a1222" stroke-width="3.6" d="M3.2 7h3.6M17.2 7h3.6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2.4" d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  star: '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z"/>'
};
const svg = (name, extra) => '<svg viewBox="0 0 24 24" ' + (extra || '') + '>' + ICONS[name] + '</svg>';

// ================= Dźwięk =================
let AC = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
const sfxLast = {};
function ensureAudio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = .7; master.connect(AC.destination);
      sfxBus = AC.createGain(); sfxBus.connect(master);
      musBus = AC.createGain(); musBus.gain.value = .5; musBus.connect(master);
      noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
}
function tone(type, f0, f1, vol, dur, delay, bus) {
  const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + .02);
}
function noise(vol, dur, f0, f1, type, delay, bus) {
  const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = type || 'lowpass';
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
}
function sfx(k) {
  if (!AC || !save.settings.sfx) return;
  const now = AC.currentTime;
  if (sfxLast[k] && now - sfxLast[k] < .045) return;
  sfxLast[k] = now;
  switch (k) {
    case 'blaster': tone('square', 900, 260, .05, .08); break;
    case 'rifle': tone('sawtooth', 700, 180, .035, .06); noise(.03, .04, 3000, 800, 'highpass'); break;
    case 'shotgun': noise(.16, .22, 2400, 200); tone('square', 160, 50, .08, .15); break;
    case 'rail': tone('sawtooth', 1800, 90, .07, .3); tone('sine', 300, 1200, .05, .15); break;
    case 'rocket': noise(.12, .35, 900, 120); tone('triangle', 200, 80, .06, .3); break;
    case 'hit': tone('square', 520, 300, .025, .04); break;
    case 'kill': noise(.07, .12, 1800, 300); tone('triangle', 380, 90, .05, .12); break;
    case 'boom': noise(.35, .6, 1100, 60); tone('sine', 110, 35, .3, .5); break;
    case 'xp': tone('sine', 1100 + Math.random() * 400, 1700, .03, .08); break;
    case 'coin': tone('square', 1400, 1400, .025, .05); tone('square', 2100, 2100, .025, .08, .05); break;
    case 'hurt': tone('sawtooth', 220, 70, .12, .25); noise(.08, .15, 1200, 200); break;
    case 'dash': noise(.09, .2, 600, 4000, 'bandpass'); break;
    case 'lvl': [0, 4, 7, 12].forEach((n, i) => tone('triangle', 440 * Math.pow(2, n / 12), 440 * Math.pow(2, n / 12), .07, .22, i * .07)); break;
    case 'heal': tone('sine', 500, 900, .06, .25); break;
    case 'click': tone('square', 600, 900, .03, .04); break;
    case 'portal': tone('sine', 200, 700, .025, .3); break;
    case 'roar': tone('sawtooth', 90, 40, .2, 1.1); noise(.15, 1, 500, 80); break;
    case 'eshot': tone('triangle', 520, 220, .025, .09); break;
    case 'laser': tone('sawtooth', 120, 140, .05, .25); break;
    case 'win': [0, 4, 7, 12, 16].forEach((n, i) => tone('square', 330 * Math.pow(2, n / 12), 330 * Math.pow(2, n / 12), .05, .3, i * .1)); break;
    case 'lose': [7, 3, 0, -5].forEach((n, i) => tone('triangle', 330 * Math.pow(2, n / 12), 330 * Math.pow(2, n / 12), .07, .35, i * .16)); break;
    case 'empty': tone('square', 200, 180, .03, .05); break;
  }
}
// prosta muzyka: bas + arpeggio w molowej pentatonice
const music = { next: 0, step: 0, intense: 0 };
const ROOTS = [[45, 45, 41, 43], [40, 40, 43, 38], [42, 42, 38, 45]];
function mfreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }
function musicTick(biome) {
  if (!AC || !save.settings.music) return;
  if (music.next < AC.currentTime) music.next = AC.currentTime + .05;
  const stepDur = .125;
  while (music.next < AC.currentTime + .2) {
    const s = music.step, bar = Math.floor(s / 16) % 4, root = ROOTS[biome][bar];
    const d = music.next - AC.currentTime;
    if (s % 4 === 0) tone('sawtooth', mfreq(root - 12), mfreq(root - 12), .06, .22, d, musBus);
    if (s % 8 === 4) noise(.05 + music.intense * .03, .09, 1600, 400, 'lowpass', d, musBus);
    if (s % 2 === 1) noise(.012, .03, 8000, 6000, 'highpass', d, musBus);
    if (s % 2 === 0 && (s % 16 < 12 || music.intense)) {
      const sc = [0, 3, 5, 7, 10, 12, 15];
      tone('triangle', mfreq(root + 12 + sc[(s * 3 + bar) % sc.length]), mfreq(root + 12 + sc[(s * 3 + bar) % sc.length]), .018, .16, d, musBus);
    }
    music.next += stepDur; music.step++;
  }
}
