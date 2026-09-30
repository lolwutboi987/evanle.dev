import { drawWorld } from './scenes/world.js';
import { drawOpening, drawArchive, drawPerception, drawDaughter } from './scenes/painting.js';
import { drawWitness, drawBoundary } from './scenes/community.js';
import { MAX_DRAWING_FPS, SCENES, resolveDrawing } from './motion.js';

const canvas = document.querySelector('#scene');
const stage = document.querySelector('.visual-stage');
const context = canvas.getContext('2d');
const chapters = [...document.querySelectorAll('.chapter')];
const navigation = document.querySelector('.story-nav');
const chapterLinks = [...navigation.querySelectorAll('a')];
const chapterLabel = document.querySelector('#current-chapter');
const progress = document.querySelector('.reading-progress > div');
const plateName = document.querySelector('#plate-name');
const plateNumber = document.querySelector('#plate-number');
const coda = document.querySelector('.coda');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const painters = [drawOpening, drawWorld, drawArchive, drawPerception, drawWitness, drawBoundary, drawDaughter];
const plates = [
  ['An unfinished work', 'I'],
  ['Everything we wished for', 'II'],
  ['The hand that hesitates', 'III'],
  ['One painting. Two realities.', 'IV'],
  ['The First Witness', 'V'],
  ['The cost of belonging', 'VI'],
  ['Her own voice', 'VII'],
];

let layout = [];
let viewportHeight = window.innerHeight;
let sceneLead = 0;
let codaTop = Infinity;
let documentHeight = 1;
let frame = 0;
let drawingTimer = 0;
let lastDrawingTime = -Infinity;
let lastDrawingKey = '';
let drawingCount = 0;
let layoutDirty = true;
let activeChapter = -1;
let lockedPosition = null;
let choice = null;
let reveal = null;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const pageY = () => lockedPosition?.y ?? window.scrollY;

function measure() {
  const scrollY = pageY();
  viewportHeight = window.innerHeight;
  const anchorOffset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  // An anchor must reach its own scene, including a pixel of rounding tolerance.
  sceneLead = Math.max(viewportHeight * 0.16, anchorOffset) + 1;
  layout = chapters.map((chapter) => {
    const box = chapter.getBoundingClientRect();
    return { top: box.top + scrollY, height: Math.max(box.height, 1) };
  });
  codaTop = coda.getBoundingClientRect().top + scrollY;
  documentHeight = Math.max(document.documentElement.scrollHeight, codaTop + coda.offsetHeight);

  const bounds = stage.getBoundingClientRect();
  const style = getComputedStyle(stage);
  const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const captionHeight = stage.querySelector('.plate-caption').offsetHeight;
  const availableWidth = Math.max(1, bounds.width - paddingX);
  const availableHeight = Math.max(1, bounds.height - paddingY - captionHeight - 16);
  const width = Math.min(availableWidth, availableHeight * 1.25);
  const height = width * 0.8;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.max(1, Math.round(width * density));
  const pixelHeight = Math.max(1, Math.round(height * density));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    lastDrawingKey = '';
  }
  layoutDirty = false;
}

function drawingForScroll(index, scrollY) {
  const chapter = layout[index];
  const start = Math.max(0, chapter.top - sceneLead);
  const end = index + 1 < layout.length
    ? layout[index + 1].top - sceneLead
    : codaTop - viewportHeight * .5;
  return resolveDrawing(index, clamp((scrollY - start) / Math.max(1, end - start)), {
    reducedMotion: motionPreference.matches, reveal, choice,
  });
}

function updateChapter(index) {
  if (index === activeChapter) return;
  activeChapter = index;
  chapterLinks.forEach((link, linkIndex) => {
    if (linkIndex === index) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  chapterLabel.textContent = String(index).padStart(2, '0');
  plateName.textContent = plates[index][0];
  plateNumber.textContent = `PLATE ${plates[index][1]}`;
}

function render(now) {
  frame = 0;
  if (document.hidden) return;
  if (layoutDirty) measure();
  const scrollY = pageY();
  const boundaries = layout.slice(1).map((chapter) => chapter.top - sceneLead);
  const index = boundaries.filter((boundary) => scrollY >= boundary).length;
  const drawing = drawingForScroll(index, scrollY);
  const key = `${index}:${drawing.frame}:${drawing.reveal ?? ''}:${drawing.choice ?? ''}`;
  progress.style.transform = `scaleX(${clamp(scrollY / Math.max(1, documentHeight - viewportHeight))})`;
  // A clean cut to the closing passage, never a faint, dissolving illustration.
  stage.style.visibility = scrollY + viewportHeight * .5 >= codaTop ? 'hidden' : 'visible';
  if (!context || key === lastDrawingKey) return;
  const remaining = 1000 / MAX_DRAWING_FPS - (now - lastDrawingTime);
  if (lastDrawingKey && !motionPreference.matches && remaining > 0) {
    if (!drawingTimer) drawingTimer = setTimeout(() => {
      drawingTimer = 0;
      requestRender();
    }, remaining);
    return;
  }

  // One complete drawing per exposure. No transform tween or double exposure.
  updateChapter(index);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.setTransform(canvas.width / 1000, 0, 0, canvas.height / 800, 0, 0);
  painters[index](context, drawing.p, {
    frame: drawing.frame, reveal: drawing.reveal, choice: drawing.choice,
    reducedMotion: motionPreference.matches,
  });
  context.restore();
  lastDrawingKey = key;
  lastDrawingTime = now;
  drawingCount++;
  canvas.dataset.scene = SCENES[index].id;
  canvas.dataset.frame = String(drawing.frame);
  canvas.dataset.drawingCount = String(drawingCount);
  if (index === 3 && reveal === null) {
    perception.value = String(drawing.reveal * 100);
    describePerception(drawing.reveal * 100);
  }
}

function requestRender(remeasure = false) {
  layoutDirty ||= remeasure;
  if (!frame && !document.hidden) frame = requestAnimationFrame(render);
}

window.addEventListener('scroll', () => requestRender(), { passive: true });
window.addEventListener('resize', () => requestRender(true), { passive: true });
window.addEventListener('hashchange', () => requestRender());
window.addEventListener('popstate', () => requestRender());
window.addEventListener('pageshow', () => requestRender(true));
document.addEventListener('visibilitychange', () => {
  if (document.hidden && drawingTimer) {
    clearTimeout(drawingTimer);
    drawingTimer = 0;
  }
  if (document.hidden && frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else if (!document.hidden) requestRender(true);
});
motionPreference.addEventListener('change', () => { lastDrawingKey = ''; requestRender(); });
const resizeObserver = new ResizeObserver(() => requestRender(true));
[stage, ...chapters, coda].forEach((element) => resizeObserver.observe(element));
document.fonts?.ready.then(() => { lastDrawingKey = ''; requestRender(true); });

const perception = document.querySelector('#perception');
function describePerception(comfortable) {
  perception.setAttribute('aria-valuetext', `${comfortable}% Caretaker’s version, ${100 - comfortable}% Maya’s original`);
}
function updatePerception() {
  const comfortable = Number(perception.value);
  reveal = comfortable / 100;
  describePerception(comfortable);
  requestRender();
}
perception.addEventListener('input', updatePerception);
document.querySelector('.perception-control').hidden = false;
describePerception(Number(perception.value));

const choices = document.querySelector('.choices');
const choiceButtons = [...choices.querySelectorAll('[data-choice]')];
const choiceResult = document.querySelector('.choice-result');
const initialResult = choiceResult.innerHTML;
const resetChoice = document.querySelector('.reset-choice');
choices.hidden = false;
choiceButtons.forEach((button) => button.addEventListener('click', () => {
  choice = button.dataset.choice;
  choiceButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  const result = document.createElement('p');
  result.textContent = choice === 'keep'
    ? 'Let it remain: protect her voice, even if people leave.'
    : 'Take it down: decide what others may see, as Caretaker did.';
  choiceResult.replaceChildren(result);
  resetChoice.hidden = false;
  requestRender();
}));
resetChoice.addEventListener('click', () => {
  choice = null;
  choiceButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
  choiceResult.innerHTML = initialResult;
  resetChoice.hidden = true;
  choiceButtons[0].focus({ preventScroll: true });
  requestRender();
});

const notes = document.querySelector('#notes');
const closeNotes = notes.querySelector('.close-notes');
let notesOpener = null;
let savedBodyStyle = null;
const lockProperties = ['position', 'top', 'left', 'right', 'width', 'overflow'];

function lockPage() {
  lockedPosition = { x: window.scrollX, y: window.scrollY };
  savedBodyStyle = Object.fromEntries(lockProperties.map((property) => [property, document.body.style[property]]));
  Object.assign(document.body.style, {
    position: 'fixed', top: `-${lockedPosition.y}px`, left: '0', right: '0', width: '100%', overflow: 'hidden',
  });
}

function unlockPage() {
  if (!lockedPosition) return;
  const position = lockedPosition;
  Object.assign(document.body.style, savedBodyStyle);
  lockedPosition = null;
  const scrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(position.x, position.y);
  notesOpener?.focus({ preventScroll: true });
  document.documentElement.style.scrollBehavior = scrollBehavior;
  requestRender(true);
}

document.querySelectorAll('.notes-open').forEach((button) => button.addEventListener('click', () => {
  if (notes.open) return;
  notesOpener = button;
  const note = button.dataset.note ? document.getElementById(`note-${button.dataset.note}`) : null;
  if (note) note.open = true;
  lockPage();
  notes.showModal();
  (note?.querySelector('summary') ?? closeNotes).focus({ preventScroll: true });
  requestAnimationFrame(() => {
    if (!notes.open) return;
    notes.scrollTop = note ? note.getBoundingClientRect().top - notes.getBoundingClientRect().top + notes.scrollTop - 24 : 0;
  });
}));
closeNotes.addEventListener('click', () => notes.close());
notes.addEventListener('cancel', (event) => {
  event.preventDefault();
  notes.close();
});
notes.addEventListener('close', unlockPage);
let startedOnBackdrop = false;
function outsideNotes(event) {
  const bounds = notes.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
}
notes.addEventListener('pointerdown', (event) => { startedOnBackdrop = event.target === notes && outsideNotes(event); });
notes.addEventListener('click', (event) => {
  if (startedOnBackdrop && event.target === notes && outsideNotes(event)) notes.close();
  startedOnBackdrop = false;
});

navigation.hidden = false;
requestRender(true);
