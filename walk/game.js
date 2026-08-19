import { CHAPTERS, AMBIENT_LINES, deriveEnding } from "./story.js";
import { createAudioSystem } from "./audio.js";

const $ = (id) => document.getElementById(id);
const ui = {
  root: $("gameRoot"), canvas: $("gameCanvas"), loading: $("loadingScreen"),
  progress: $("loadingProgress"), loadingText: $("loadingText"), title: $("titleScreen"),
  start: $("startButton"), continue: $("continueButton"), hud: $("gameHud"),
  chapter: $("chapterLabel"), year: $("yearLabel"), memories: $("memoryCount"),
  dialogue: $("dialoguePanel"), speaker: $("speakerName"), text: $("dialogueText"),
  choices: $("choiceList"), pauseMenu: $("pauseMenu"), pause: $("pauseButton"),
  resume: $("resumeButton"), restart: $("restartButton"), sound: $("soundToggle"),
  motion: $("motionToggle"), left: $("moveLeft"), right: $("moveRight"),
  interact: $("interactButton"), status: $("gameStatus"), transcript: $("transcriptLog"),
};

const ctx = ui.canvas.getContext("2d", { alpha: false });
const audio = createAudioSystem();
const SAVE_KEY = "tlwh-save-v1";
const WORLD = 4200;
const STEP = 1 / 60;
const ROMAN = ["I", "II", "III", "IV", "V"];
const TAU = Math.PI * 2;
const keys = { left: false, right: false };
const particles = [];

let width = 1280;
let height = 720;
let dpr = 1;
let state = freshState();
let last = performance.now();
let accumulator = 0;
let camera = 0;
let previousX = state.x;
let footstepDistance = 0;
let frameHandle = 0;

function freshState() {
  return {
    mode: "title", chapter: 0, x: 180, flags: new Set(), encountered: false,
    paused: false, dialogue: false, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    sound: true, tick: 0, ambientIndex: 0, chapterStarted: false,
  };
}

function chapter() { return CHAPTERS[state.chapter]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function seeded(n) {
  const x = Math.sin(n * 91.173 + state.chapter * 417.31) * 43758.5453;
  return x - Math.floor(x);
}

function announce(text) {
  ui.status.textContent = text;
}

function log(text, label = "Story") {
  const li = document.createElement("li");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  li.append(strong, document.createTextNode(text));
  ui.transcript.append(li);
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 1, chapter: state.chapter, x: state.x, flags: [...state.flags],
      encountered: state.encountered, reduced: state.reduced, sound: state.sound,
    }));
  } catch { announce("Progress could not be saved on this device."); }
}

function readSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!data || data.version !== 1 || !Number.isInteger(data.chapter) || data.chapter < 0 || data.chapter >= CHAPTERS.length) return null;
    return data;
  } catch { return null; }
}

function restore(data) {
  state = freshState();
  state.mode = "playing";
  state.chapter = data.chapter;
  state.x = clamp(Number(data.x) || 180, 100, WORLD - 120);
  state.flags = new Set(Array.isArray(data.flags) ? data.flags : []);
  state.encountered = Boolean(data.encountered);
  state.reduced = Boolean(data.reduced);
  state.sound = data.sound !== false;
  enterChapter(false);
}

function setVisible(element, visible) {
  if (!element) return;
  element.hidden = !visible;
  element.classList.toggle("is-visible", visible);
}

function updateHud() {
  const c = chapter();
  ui.chapter.textContent = `${ROMAN[state.chapter]} · ${c.title}`;
  ui.year.textContent = `${c.year} · age ${c.age}`;
  ui.memories.textContent = [...state.flags].filter((f) => f.startsWith("stop_")).length;
  ui.sound.setAttribute("aria-pressed", String(!state.sound));
  ui.sound.setAttribute("aria-label", state.sound ? "Mute sound" : "Enable sound");
  ui.motion.setAttribute("aria-pressed", String(state.reduced));
  document.body.dataset.reducedMotion = String(state.reduced);
}

function showTitle() {
  state.mode = "title";
  setVisible(ui.loading, false);
  setVisible(ui.title, true);
  setVisible(ui.hud, false);
  setVisible(ui.dialogue, false);
  const saved = readSave();
  ui.continue.hidden = !saved;
  ui.root.setAttribute("aria-busy", "false");
  ui.start.focus();
  announce("The Long Way Home is ready. Begin a new walk or continue a saved one.");
}

function newGame(event) {
  state = freshState();
  state.mode = "playing";
  localStorage.removeItem(SAVE_KEY);
  ui.transcript.replaceChildren();
  setVisible(ui.title, false);
  setVisible(ui.hud, true);
  audio.start(event).catch?.(() => {});
  audio.setEnabled(true, event);
  enterChapter(true);
}

function enterChapter(showIntro = true) {
  const c = chapter();
  state.mode = "playing";
  state.paused = false;
  state.dialogue = false;
  state.chapterStarted = true;
  previousX = state.x;
  camera = clamp(state.x - width * 0.38, 0, WORLD - width);
  makeParticles();
  updateHud();
  setVisible(ui.title, false);
  setVisible(ui.hud, true);
  setVisible(ui.pauseMenu, false);
  setVisible(ui.dialogue, false);
  audio.setChapter(state.chapter);
  log(`${c.year}, age ${c.age}. ${c.subtitle}. ${c.intro.join(" ")}`, c.title);
  announce(`${c.title}, ${c.year}. Walk right. Press E near the glowing memory.`);
  if (showIntro) {
    showMessage(`${c.title} · ${c.year}`, c.intro.join(" "), [{ label: "Walk on", action: closeDialogue }]);
  }
  save();
}

function showMessage(speaker, text, choices) {
  state.dialogue = true;
  keys.left = keys.right = false;
  ui.speaker.textContent = speaker;
  ui.text.textContent = text;
  ui.choices.replaceChildren();
  choices.forEach((choice, i) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.dataset.choice = String(i);
    const num = document.createElement("span");
    num.className = "choice-number";
    num.textContent = String(i + 1);
    const label = document.createElement("span");
    label.textContent = choice.label;
    button.append(num, label);
    button.addEventListener("click", choice.action);
    ui.choices.append(button);
  });
  setVisible(ui.dialogue, true);
  ui.choices.querySelector("button")?.focus();
  announce(`${speaker}. ${text}`);
}

function closeDialogue() {
  state.dialogue = false;
  setVisible(ui.dialogue, false);
  ui.canvas.focus();
}

function openEncounter() {
  if (state.encountered || state.dialogue || state.paused || state.mode !== "playing") return;
  const e = chapter().encounter;
  const distance = Math.abs(state.x - e.x * WORLD);
  if (distance > 260) {
    const ambient = AMBIENT_LINES[chapter().id] || [];
    if (ambient.length) announce(ambient[state.ambientIndex++ % ambient.length]);
    return;
  }
  audio.interact();
  showMessage(e.speaker, `${e.prompt} ${e.lines.join(" ")}`, e.choices.map((choice) => ({
    label: choice.label,
    action: () => choose(choice),
  })));
  log(`${e.prompt} ${e.lines.join(" ")}`, e.speaker);
}

function choose(choice) {
  state.flags.add(choice.flag);
  state.encountered = true;
  audio.interact();
  log(`${choice.label} — ${choice.reply}`, "You");
  updateHud();
  save();
  showMessage(chapter().encounter.speaker, choice.reply, [{ label: "Keep walking", action: closeDialogue }]);
}

function completeChapter() {
  if (state.dialogue || state.mode !== "playing") return;
  if (!state.encountered) {
    choose(chapter().encounter.choices[1]);
    return;
  }
  const c = chapter();
  audio.transition();
  log(c.outro.join(" "), "Road");
  if (state.chapter === CHAPTERS.length - 1) {
    finishGame();
    return;
  }
  showMessage("The road remembers", c.outro.join(" "), [{
    label: "Step into the next year",
    action: () => {
      state.chapter += 1;
      state.x = 160;
      state.encountered = false;
      closeDialogue();
      enterChapter(true);
    },
  }]);
}

function finishGame() {
  state.mode = "ending";
  const ending = deriveEnding(state.flags);
  audio.ending();
  localStorage.removeItem(SAVE_KEY);
  log(`${ending.subtitle} ${ending.lines.join(" ")} ${ending.finalLine}`, ending.title);
  showMessage(ending.title, `${ending.subtitle} ${ending.lines.join(" ")} ${ending.finalLine}`, [
    { label: "Walk it again", action: (event) => newGame(event) },
    { label: "Return to evanle.dev", action: () => { location.href = "../"; } },
  ]);
  announce(`${ending.title}. ${ending.finalLine}`);
}

function togglePause(force) {
  if (state.mode !== "playing" || state.dialogue) return;
  state.paused = typeof force === "boolean" ? force : !state.paused;
  keys.left = keys.right = false;
  setVisible(ui.pauseMenu, state.paused);
  if (state.paused) {
    audio.suspend();
    ui.resume.focus();
    announce("Paused. The road waits.");
  } else {
    audio.resume();
    ui.canvas.focus();
    last = performance.now();
    announce("Walk resumed.");
  }
}

function restartChapter() {
  state.x = 160;
  state.encountered = false;
  for (const choice of chapter().encounter.choices) state.flags.delete(choice.flag);
  closeDialogue();
  enterChapter(true);
}

function update(dt) {
  if (state.mode !== "playing" || state.paused || state.dialogue) return;
  previousX = state.x;
  const direction = Number(keys.right) - Number(keys.left);
  if (direction) {
    const speed = state.reduced ? 270 : 320;
    state.x = clamp(state.x + direction * speed * dt, 80, WORLD - 80);
    footstepDistance += Math.abs(state.x - previousX);
    if (footstepDistance > 72) { audio.step(); footstepDistance = 0; }
  }
  const targetCamera = clamp(state.x - width * 0.38, 0, Math.max(0, WORLD - width));
  camera += (targetCamera - camera) * (state.reduced ? 1 : 0.1);
  updateParticles(dt, direction);
  state.tick += 1;
  if (state.x > WORLD - 135) completeChapter();
}

function makeParticles() {
  particles.length = 0;
  const weather = chapter().weather.toLowerCase();
  const count = state.reduced ? 18 : weather.includes("rain") ? 140 : weather.includes("snow") ? 100 : 55;
  for (let i = 0; i < count; i++) particles.push({
    x: seeded(i + 10) * width, y: seeded(i + 80) * height,
    z: 0.4 + seeded(i + 140), speed: 20 + seeded(i + 210) * 110,
    drift: -20 + seeded(i + 310) * 40,
  });
}

function updateParticles(dt, direction) {
  if (state.reduced) return;
  const rain = chapter().weather.toLowerCase().includes("rain");
  for (const p of particles) {
    p.y += p.speed * dt * (rain ? 3.3 : 0.7);
    p.x += (p.drift - direction * 12 * p.z) * dt;
    if (p.y > height + 20) { p.y = -20; p.x = seeded(p.x + state.tick) * width; }
    if (p.x < -30) p.x = width + 20;
    if (p.x > width + 30) p.x = -20;
  }
}

function resize() {
  const rect = ui.canvas.getBoundingClientRect();
  width = Math.max(320, rect.width);
  height = Math.max(240, rect.height);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  ui.canvas.width = Math.round(width * dpr);
  ui.canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  makeParticles();
}

function gradient(top, bottom, y0 = 0, y1 = height) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top); g.addColorStop(1, bottom); return g;
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const c = chapter();
  ctx.fillStyle = gradient(c.palette.sky, c.palette.horizon, 0, height * 0.68);
  ctx.fillRect(0, 0, width, height);
  drawSky(c);
  drawParallax(c);
  drawStreet(c);
  drawLandmarks(c);
  drawCharacter(c);
  drawWeather(c);
  drawVignette(c);
}

function drawSky(c) {
  const night = c.id.includes("neon") || c.id.includes("rain");
  if (night) {
    ctx.fillStyle = "rgba(245,235,198,.7)";
    for (let i = 0; i < 42; i++) {
      const x = (seeded(i) * width + camera * 0.015) % width;
      const y = seeded(i + 50) * height * 0.42;
      ctx.globalAlpha = 0.25 + seeded(i + 90) * 0.55;
      ctx.fillRect(x, y, seeded(i + 2) > .8 ? 2 : 1, 1);
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "rgba(255,242,196,.48)";
    ctx.beginPath(); ctx.arc(width * .78, height * .17, Math.max(25, width * .035), 0, TAU); ctx.fill();
  }
}

function drawParallax(c) {
  const horizon = height * .42;
  ctx.fillStyle = c.palette.shadow;
  ctx.globalAlpha = .34;
  ctx.beginPath(); ctx.moveTo(0, horizon + 25);
  for (let x = 0; x <= width + 80; x += 80) {
    const world = x + camera * .12;
    ctx.lineTo(x, horizon - 30 - seeded(Math.floor(world / 80)) * 110);
    ctx.lineTo(x + 70, horizon - 30 - seeded(Math.floor(world / 80) + 1) * 90);
  }
  ctx.lineTo(width, horizon + 80); ctx.lineTo(0, horizon + 80); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  const offset = -(camera * .55) % 210;
  for (let i = -2; i < Math.ceil(width / 210) + 2; i++) {
    const x = offset + i * 210;
    const seed = Math.floor((camera * .55 + x) / 210);
    const h = height * (.23 + seeded(seed) * .16);
    ctx.fillStyle = i % 3 === 0 ? shade(c.palette.shadow, 10) : c.palette.shadow;
    ctx.fillRect(x, horizon - h + 95, 205, h);
    ctx.fillStyle = "rgba(255,207,119,.38)";
    for (let wx = x + 22; wx < x + 190; wx += 38) {
      for (let wy = horizon - h + 120; wy < horizon + 60; wy += 38) {
        if (seeded(wx * .07 + wy * .03) > .48) ctx.fillRect(wx, wy, 15, 10);
      }
    }
    ctx.fillStyle = "rgba(16,20,26,.58)";
    ctx.fillRect(x + 12, horizon + 18, 62, 77);
    ctx.fillRect(x + 84, horizon + 8, 106, 87);
    ctx.strokeStyle = "rgba(245,226,180,.32)"; ctx.lineWidth = 2;
    ctx.strokeRect(x + 92, horizon + 18, 88, 48);
  }
}

function drawStreet(c) {
  const curbY = height * .67;
  ctx.fillStyle = shade(c.palette.shadow, -12);
  ctx.fillRect(0, curbY, width, height - curbY);
  ctx.fillStyle = c.palette.sidewalk;
  ctx.beginPath(); ctx.moveTo(0, height * .5); ctx.lineTo(width, height * .5);
  ctx.lineTo(width, height * .83); ctx.lineTo(0, height * .9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(c.palette.sidewalk, -24);
  ctx.beginPath(); ctx.moveTo(0, height * .83); ctx.lineTo(width, height * .78);
  ctx.lineTo(width, height * .84); ctx.lineTo(0, height * .93); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(30,34,38,.23)"; ctx.lineWidth = 1;
  const slab = 210;
  let start = -(camera % slab);
  for (let x = start; x < width + slab; x += slab) {
    ctx.beginPath(); ctx.moveTo(x, height * .51); ctx.lineTo(x + 16, height * .84); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, height * .66); ctx.lineTo(width, height * .64); ctx.stroke();
  // hairline cracks make the street feel drawn rather than tiled
  ctx.strokeStyle = "rgba(42,42,38,.18)";
  for (let i = 0; i < 18; i++) {
    const x = ((seeded(i + state.chapter * 50) * WORLD - camera) + WORLD) % WORLD;
    if (x < -30 || x > width + 30) continue;
    const y = height * (.57 + seeded(i + 8) * .24);
    ctx.beginPath(); ctx.moveTo(x - 15, y); ctx.lineTo(x, y + 8); ctx.lineTo(x + 12, y - 2); ctx.lineTo(x + 24, y + 9); ctx.stroke();
  }
  if (c.weather.toLowerCase().includes("rain")) {
    ctx.fillStyle = "rgba(130,180,205,.18)";
    for (let i = 0; i < 7; i++) {
      const x = seeded(i + 700) * width;
      ctx.beginPath(); ctx.ellipse(x, height * (.72 + seeded(i + 710) * .18), 75 + seeded(i) * 80, 8, -.04, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,190,94,.14)"; ctx.fillRect(x - 2, height * .55, 5, height * .27); ctx.fillStyle = "rgba(130,180,205,.18)";
    }
  }
}

function drawLandmarks(c) {
  const encounterX = c.encounter.x * WORLD - camera;
  drawTree(encounterX - 130, c);
  drawLamp(encounterX + 110, c);
  drawStar(encounterX, height * .735, c);
  // Bench and postal box anchor the recurring block.
  const benchX = encounterX - 330;
  ctx.fillStyle = shade(c.palette.shadow, 8);
  ctx.fillRect(benchX, height * .61, 120, 12); ctx.fillRect(benchX + 12, height * .62, 8, 55); ctx.fillRect(benchX + 99, height * .62, 8, 55);
  ctx.strokeStyle = "rgba(248,225,180,.35)"; ctx.strokeRect(benchX, height * .61, 120, 12);
  if (Math.abs(state.x - c.encounter.x * WORLD) < 300 && !state.encountered && state.mode === "playing") {
    ctx.save();
    const pulse = state.reduced ? 1 : 1 + Math.sin(state.tick * .08) * .08;
    ctx.translate(encounterX, height * .56); ctx.scale(pulse, pulse);
    ctx.fillStyle = c.palette.light; ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU); ctx.fill();
    ctx.fillStyle = "#16191e"; ctx.font = "700 15px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("E", 0, 1);
    ctx.fillStyle = "rgba(12,15,20,.86)"; ctx.fillRect(-88, 39, 176, 31);
    ctx.fillStyle = "#fff7dc"; ctx.font = "700 12px ui-monospace, monospace"; ctx.fillText("REMEMBER", 0, 55);
    ctx.restore();
  }
}

function drawTree(x, c) {
  const winter = c.id.includes("winter");
  if (winter) {
    ctx.strokeStyle = "rgba(65,69,70,.35)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, height * .58); ctx.lineTo(x, height * .5); ctx.stroke();
    return;
  }
  ctx.strokeStyle = shade(c.palette.shadow, -5); ctx.lineCap = "round";
  ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(x, height * .59); ctx.quadraticCurveTo(x - 3, height * .43, x + 9, height * .29); ctx.stroke();
  ctx.lineWidth = 7;
  for (let i = 0; i < 7; i++) {
    const angle = -2.7 + i * .43;
    ctx.beginPath(); ctx.moveTo(x + 6, height * .4); ctx.lineTo(x + Math.cos(angle) * (80 + i * 5), height * .34 + Math.sin(angle) * 70); ctx.stroke();
  }
  const autumn = c.id.includes("autumn");
  ctx.fillStyle = autumn ? c.palette.accent : shade(c.palette.accent, 10);
  for (let i = 0; i < 34; i++) {
    const a = seeded(i + 400) * TAU, r = 25 + seeded(i + 430) * 115;
    ctx.globalAlpha = .45 + seeded(i + 470) * .5;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, height * .31 + Math.sin(a) * r * .55, 11 + seeded(i) * 15, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLamp(x, c) {
  const baseY = height * .68;
  ctx.strokeStyle = shade(c.palette.shadow, -18); ctx.lineWidth = 7; ctx.lineCap = "butt";
  ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, height * .34); ctx.stroke();
  ctx.fillStyle = shade(c.palette.shadow, -18); ctx.fillRect(x - 18, height * .335, 36, 10); ctx.fillRect(x - 5, baseY, 10, 15);
  const glow = ctx.createRadialGradient(x, height * .365, 0, x, height * .365, 118);
  glow.addColorStop(0, "rgba(255,210,115,.42)"); glow.addColorStop(1, "rgba(255,210,115,0)");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, height * .365, 118, 0, TAU); ctx.fill();
  ctx.fillStyle = c.palette.light; ctx.beginPath(); ctx.arc(x, height * .36, 12, 0, TAU); ctx.fill();
}

function drawStar(x, y, c) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.08);
  ctx.strokeStyle = c.id.includes("rain") ? "#d8bc43" : "#5c84aa";
  ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.beginPath();
  const points = state.chapter === 4 ? 9 : 8;
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points, r = i % 2 ? 18 : 43;
    const px = Math.cos(a) * r, py = Math.sin(a) * r * .42;
    if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.stroke(); ctx.restore();
}

function drawCharacter(c) {
  const sx = state.x - camera;
  const ground = height * .735;
  const walking = Math.abs(state.x - previousX) > .05;
  const phase = walking && !state.reduced ? state.tick * .22 : 0;
  const ageScale = .88 + state.chapter * .035;
  const bob = walking && !state.reduced ? Math.abs(Math.sin(phase)) * 3 : 0;
  ctx.save(); ctx.translate(sx, ground - bob); ctx.scale(ageScale, ageScale);
  ctx.fillStyle = "rgba(12,15,18,.28)"; ctx.beginPath(); ctx.ellipse(0, 11, 42, 9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#171a20"; ctx.lineWidth = 10; ctx.lineCap = "round";
  const leg = Math.sin(phase) * 17;
  ctx.beginPath(); ctx.moveTo(-5, -45); ctx.lineTo(-7 + leg, -4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -45); ctx.lineTo(7 - leg, -4); ctx.stroke();
  ctx.fillStyle = state.chapter === 0 ? "#304f4c" : state.chapter === 2 ? "#382d47" : "#27333c";
  ctx.beginPath(); ctx.moveTo(-23, -105); ctx.quadraticCurveTo(0, -118, 23, -105); ctx.lineTo(17, -45); ctx.lineTo(-17, -45); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#171a20"; ctx.lineWidth = 8;
  const arm = Math.sin(phase + Math.PI) * 13;
  ctx.beginPath(); ctx.moveTo(-19, -96); ctx.lineTo(-30 + arm, -56); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(19, -96); ctx.lineTo(30 - arm, -56); ctx.stroke();
  ctx.fillStyle = "#bf8d6d"; ctx.beginPath(); ctx.arc(0, -129, 18, 0, TAU); ctx.fill();
  ctx.fillStyle = "#1a1b20"; ctx.beginPath(); ctx.arc(-2, -136, 18, Math.PI, TAU); ctx.lineTo(17, -129); ctx.closePath(); ctx.fill();
  if (state.chapter === 4) {
    ctx.strokeStyle = "rgba(235,235,226,.75)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -129, 13, Math.PI * 1.08, Math.PI * 1.9); ctx.stroke();
  }
  ctx.restore();
}

function drawWeather(c) {
  if (state.reduced) return;
  const weather = c.weather.toLowerCase();
  ctx.save();
  if (weather.includes("rain")) {
    ctx.strokeStyle = "rgba(198,220,232,.38)"; ctx.lineWidth = 1;
    for (const p of particles) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 7, p.y + 22 * p.z); ctx.stroke(); }
  } else if (weather.includes("snow")) {
    ctx.fillStyle = "rgba(247,247,240,.78)";
    for (const p of particles) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 + p.z * 2, 0, TAU); ctx.fill(); }
  } else {
    ctx.fillStyle = c.id.includes("autumn") ? "rgba(153,77,56,.58)" : "rgba(234,220,165,.32)";
    for (const p of particles) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.y * .02); ctx.fillRect(-3, -1, 7, 3); ctx.restore(); }
  }
  ctx.restore();
}

function drawVignette(c) {
  const g = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .28, width / 2, height / 2, Math.max(width, height) * .74);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(3,5,9,.43)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,247,221,.025)";
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
}

function shade(hex, amount) {
  const value = parseInt(hex.slice(1), 16);
  const r = clamp((value >> 16) + amount, 0, 255);
  const g = clamp(((value >> 8) & 255) + amount, 0, 255);
  const b = clamp((value & 255) + amount, 0, 255);
  return `rgb(${r},${g},${b})`;
}

function loop(now) {
  accumulator += Math.min((now - last) / 1000, .2);
  last = now;
  let steps = 0;
  while (accumulator >= STEP && steps++ < 5) { update(STEP); accumulator -= STEP; }
  if (steps >= 5) accumulator = 0;
  draw();
  frameHandle = requestAnimationFrame(loop);
}

function setHeld(button, key) {
  const on = (event) => { event.preventDefault(); keys[key] = true; button.setPointerCapture?.(event.pointerId); };
  const off = (event) => { event.preventDefault(); keys[key] = false; };
  button.addEventListener("pointerdown", on);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture", "pointerleave"]) button.addEventListener(type, off);
}

function bind() {
  ui.start.addEventListener("click", newGame);
  ui.continue.addEventListener("click", (event) => {
    audio.start(event).catch?.(() => {});
    const saved = readSave(); if (saved) restore(saved); else newGame(event);
  });
  ui.pause.addEventListener("click", () => togglePause());
  ui.resume.addEventListener("click", () => togglePause(false));
  ui.restart.addEventListener("click", restartChapter);
  ui.interact.addEventListener("click", openEncounter);
  ui.sound.addEventListener("click", (event) => {
    state.sound = !state.sound; audio.setEnabled(state.sound, event); updateHud(); save();
  });
  ui.motion.addEventListener("click", () => { state.reduced = !state.reduced; updateHud(); makeParticles(); save(); });
  setHeld(ui.left, "left"); setHeld(ui.right, "right");
  addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key) && state.mode !== "title") event.preventDefault();
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = true;
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = true;
    if (!event.repeat && ["e", "E", " ", "Enter"].includes(event.key) && !state.dialogue) openEncounter();
    if (!event.repeat && event.key === "Escape") togglePause();
    if (state.dialogue && !event.repeat && (event.key === "1" || event.key === "2")) ui.choices.children[Number(event.key) - 1]?.click();
  });
  addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = false;
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = false;
  });
  addEventListener("blur", () => { keys.left = keys.right = false; if (state.mode === "playing" && !state.dialogue) togglePause(true); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state.mode === "playing" && !state.dialogue) togglePause(true); last = performance.now(); });
  new ResizeObserver(resize).observe(ui.canvas);
}

function boot() {
  bind(); resize(); updateHud();
  const art = new Image();
  let done = false;
  const ready = () => {
    if (done) return; done = true; ui.progress.value = 100; ui.loadingText.textContent = "The road remembers.";
    setTimeout(showTitle, 220);
  };
  art.onload = ready; art.onerror = ready; art.src = "assets/the-long-way-home.png";
  setTimeout(ready, 1800);
  frameHandle = requestAnimationFrame(loop);
}

boot();
