import { drawCityMini } from './world.js';

// All artwork is drawn in a 1000 × 800 coordinate space. The small irregularities
// are seeded by geometry, so a still scroll position is always a still drawing.
const C = {
  ink: '#493629',
  paper: '#f4e8cf',
  blue: '#b09b7a',
  gold: '#b88746',
  soft: '#d6c5a5',
  green: '#88815d',
  red: '#ad6952',
};
const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
// Every moving drawing is one of eight authored poses. A pose can be held for
// any length of time without changing its geometry or pigment density.
const celIndex = (p, options) => options.reducedMotion ? 7
  : Math.round(clamp(Number.isFinite(options.frame) ? options.frame / 7 : p) * 7);
const noise = (i, seed = 0) => {
  const n = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453123;
  return n - Math.floor(n);
};

// Each pencil stroke wanders independently, but never changes between frames.
function penSegment(ctx, x1, y1, x2, y2, seed = 0, weight = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const steps = Math.max(2, Math.min(26, Math.ceil(length / 19)));
  const amplitude = Math.min(1.25, length * .035) * weight;
  const nx = length ? -dy / length : 0;
  const ny = length ? dx / length : 0;
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const wobble = i === steps ? 0 : (noise(i, seed + x1 * .013 + y2 * .023) - .5) * amplitude * 2;
    ctx.lineTo(x1 + dx * t + nx * wobble, y1 + dy * t + ny * wobble);
  }
}

function path(ctx, points, fill, stroke = C.ink, width = 1, close = true) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke; ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 1; i < points.length; i++) penSegment(ctx, ...points[i - 1], ...points[i], i * 11);
    if (close) penSegment(ctx, ...points[points.length - 1], ...points[0], 41);
    ctx.stroke();
    if (width >= .85) {
      ctx.save(); ctx.globalAlpha *= .2; ctx.lineWidth *= .55;
      ctx.beginPath();
      for (let i = 1; i < points.length; i++) {
        penSegment(ctx, points[i - 1][0] - .8, points[i - 1][1] + .7, points[i][0] + .9, points[i][1] - .8, i * 19, 1.7);
      }
      ctx.stroke(); ctx.restore();
    }
  }
}

function line(ctx, x1, y1, x2, y2, color = C.ink, width = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  penSegment(ctx, x1, y1, x2, y2, x1 * .03 + y1 * .07);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  if (width >= 1 && Math.hypot(x2 - x1, y2 - y1) > 18) {
    ctx.globalAlpha *= .18;
    ctx.lineWidth *= .65;
    ctx.beginPath();
    penSegment(ctx, x1 + .9, y1 + 1, x2 - .6, y2 - .7, 73, 1.6);
    ctx.stroke();
  }
  ctx.restore();
}

function oval(ctx, x, y, rx, ry, fill, stroke = null, width = 1, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke();
    if (rx > 10) {
      ctx.save(); ctx.globalAlpha *= .3; ctx.lineWidth *= .65;
      ctx.beginPath(); ctx.ellipse(x + 1, y - .5, rx * 1.035, ry * .975, rotation + .025, -.12, TAU - .27); ctx.stroke();
      ctx.restore();
    }
  }
}

function roughLine(ctx, x1, y1, x2, y2, color = C.ink, width = 1, seed = 1) {
  line(ctx, x1, y1, x2, y2, color, width, 0.85);
  line(ctx, x1 + noise(seed) * 2 - 1, y1 - 1.1, x2 - 0.8, y2 + noise(seed + 5) * 2,
    color, width * 0.45, 0.24);
}

function hatch(ctx, x, y, w, h, spacing = 8, color = C.ink, alpha = 0.17, reverse = false) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let d = -h, i = 0; d <= w + h; d += spacing * (.7 + noise(i++, w) * .65)) {
    const endY = y + noise(i, h) * Math.min(h * .15, 8);
    penSegment(ctx, x + d, y + h, x + d + (reverse ? -h * 0.65 : h * 0.65), endY, i * 3, .8);
  }
  ctx.stroke();
  ctx.restore();
}

function roughRect(ctx, x, y, w, h, color = C.ink, width = .85) {
  path(ctx, [[x - .6, y], [x + w, y + .7], [x + w + .5, y + h], [x, y + h - .4]], null, color, width);
}

function pencilWash(ctx, points, color, seed = 1, count = 90) {
  ctx.save();
  const inheritedAlpha = ctx.globalAlpha;
  path(ctx, points, null, null); ctx.clip();
  const xs = points.map(point => point[0]);
  const ys = points.map(point => point[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  ctx.strokeStyle = color;
  for (let i = 0; i < count; i++) {
    const xx = minX + noise(i, seed) * (maxX - minX);
    const yy = minY + noise(i, seed + 5) * (maxY - minY);
    ctx.beginPath();
    penSegment(ctx, xx, yy, xx + 9 + noise(i, seed + 9) * 34, yy - 5 - noise(i, seed + 2) * 9, i);
    ctx.lineWidth = .5 + noise(i, seed + 3) * 1.6;
    ctx.globalAlpha = inheritedAlpha * (.07 + noise(i, seed + 4) * .13);
    ctx.stroke();
  }
  ctx.restore();
}

function tape(ctx, x, y, w, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  path(ctx, [[-w / 2, -9], [w / 2 - 3, -10], [w / 2, -5], [w / 2 - 2, 0], [w / 2 + 1, 4],
    [w / 2 - 2, 9], [-w / 2, 10], [-w / 2 + 2, 4], [-w / 2 - 1, -1]], 'rgba(214,197,165,.7)', 'rgba(184,135,70,.28)', .65);
  hatch(ctx, -w / 2, -8, w, 16, 4, C.gold, .11);
  line(ctx, -w / 2 + 5, 7, w / 2 - 5, 6, C.paper, .6, .65);
  ctx.restore();
}

function paperSpeckle(ctx, x, y, w, h, count = 100, seed = 1) {
  ctx.save();
  ctx.fillStyle = C.ink;
  ctx.globalAlpha *= 0.1;
  for (let i = 0; i < count; i++) {
    const px = x + noise(i, seed) * w;
    const py = y + noise(i + count, seed) * h;
    ctx.fillRect(px, py, noise(i + 600, seed) > 0.7 ? 1.4 : 0.65, 0.65);
  }
  ctx.restore();
}

function constructionCross(ctx, x, y, size = 8) {
  line(ctx, x - size, y, x + size, y, C.ink, 0.65, 0.27);
  line(ctx, x, y - size, x, y + size, C.ink, 0.65, 0.27);
  oval(ctx, x, y, 2.4, 2.4, null, 'rgba(73,54,41,.23)', 0.65);
}

function loosePaper(ctx, x, y, w, h, angle, painter) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.translate(-w / 2, -h / 2);
  path(ctx, [[6, 10], [w + 7, 5], [w + 3, h + 11], [2, h + 7]], 'rgba(73,54,41,.075)', null);
  path(ctx, [[0, 2], [w - 3, 0], [w, h - 4], [1, h]], C.paper, 'rgba(73,54,41,.4)', 0.85);
  paperSpeckle(ctx, 0, 0, w, h, 65, w + h);
  if (painter) painter(ctx, w, h);
  ctx.restore();
}

// Painter receives a clipped 640 × 400 surface inside a tangible, mitred frame.
function framed(ctx, x, y, w, h, angle, painter, { light = false, unfinished = false, sheet = false } = {}) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.translate(-w / 2, -h / 2);
  path(ctx, [[8, 10], [w + 7, 9], [w + 7, h + 11], [9, h + 12]], 'rgba(73,54,41,.065)', null);
  if (sheet) {
    path(ctx, [[-2, 3], [w - 3, -1], [w + 2, h - 20], [w - 18, h + 2], [1, h - 2]], C.paper, 'rgba(73,54,41,.55)', .85);
    // A folded corner and a faint margin make this an object from a notebook.
    path(ctx, [[w - 19, h + 1], [w - 20, h - 22], [w + 1, h - 20]], C.soft, 'rgba(73,54,41,.45)', .65);
    line(ctx, 17, 9, 17, h - 13, C.red, .65, .3);
    for (let j = 0; j < 14; j++) line(ctx, 4, 23 + j * 29, 15, 23 + j * 29, C.blue, .7, .24);
    paperSpeckle(ctx, 1, 1, w - 2, h - 2, 260, 67);
  } else {
  path(ctx, [[0, 0], [w, -1], [w + .7, h], [-1, h + 1]], light ? C.paper : C.soft, C.ink, 1.35);
  path(ctx, [[0, 0], [w, 0], [w - 21, 20], [21, 20]], 'rgba(244,232,207,.78)', C.ink, 0.8);
  path(ctx, [[0, 0], [21, 20], [21, h - 20], [0, h]], 'rgba(176,155,122,.2)', C.ink, 0.7);
  path(ctx, [[w, 0], [w, h], [w - 21, h - 20], [w - 21, 20]], 'rgba(73,54,41,.15)', C.ink, 0.7);
  path(ctx, [[0, h], [21, h - 20], [w - 21, h - 20], [w, h]], 'rgba(73,54,41,.12)', C.ink, 0.8);
  roughRect(ctx, 7, 6, w - 13, h - 14, 'rgba(73,54,41,.5)', .75);
  roughRect(ctx, 14, 13, w - 27, h - 25, 'rgba(73,54,41,.25)', .55);
  hatch(ctx, 0, h - 19, w, 19, 5, C.ink, 0.19);
  hatch(ctx, w - 18, 0, 18, h, 7, C.gold, 0.22);
  for (let i = 0; i < 9; i++) {
    const px = 30 + noise(i, w) * (w - 60);
    line(ctx, px, 9, px + 13 + noise(i, h) * 20, 9.6, C.ink, 0.5, 0.4);
    line(ctx, px - 8, h - 8, px + 11, h - 8.3, C.ink, 0.5, 0.3);
  }
  }
  ctx.save();
  ctx.translate(26, 26);
  ctx.scale((w - 52) / 640, (h - 52) / 400);
  ctx.beginPath();
  ctx.rect(0, 0, 640, 400);
  ctx.clip();
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, 640, 400);
  painter(ctx);
  if (unfinished) {
    ctx.globalAlpha *= 0.5;
    for (let i = 0; i < 13; i++) {
      const py = 23 + i * 27;
      line(ctx, 3, py, 19 + noise(i, 7) * 9, py + 1, C.ink, 0.65, 0.6);
    }
  }
  ctx.restore();
  if (sheet) {
    line(ctx, 27, 25, w - 47, 24, C.ink, .6, .3);
    line(ctx, 24, 34, 26, h - 32, C.ink, .6, .3);
    line(ctx, 32, h - 23, w - 35, h - 25, C.ink, .6, .25);
    tape(ctx, 49, 9, 73, -.27);
    tape(ctx, w - 50, 7, 65, .22);
    tape(ctx, w - 9, h - 77, 50, 1.25);
  } else roughRect(ctx, 25, 25, w - 50, h - 50, C.ink, .9);
  ctx.restore();
}

function clouds(ctx, warm) {
  ctx.save();
  ctx.strokeStyle = warm ? 'rgba(184,135,70,.38)' : 'rgba(176,155,122,.45)';
  ctx.lineWidth = 0.65;
  const groups = [[25, 80, 160], [226, 54, 99], [385, 112, 174], [24, 136, 87]];
  for (const [x, y, w] of groups) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + w * .18, y + 5, x + w * .21, y - 16, x + w * .38, y - 11);
    ctx.bezierCurveTo(x + w * .57, y - 32, x + w * .69, y - 12, x + w * .72, y - 7);
    ctx.bezierCurveTo(x + w * .9, y - 11, x + w * .85, y + 4, x + w, y);
    ctx.stroke();
    line(ctx, x + w * .2, y + 6, x + w * .87, y + 6, ctx.strokeStyle, 0.5, 0.55);
  }
  ctx.restore();
}

function willow(ctx, warm = false, p = 1) {
  ctx.save();
  const inheritedAlpha = ctx.globalAlpha;
  const trunk = [[158, 284], [165, 250], [160, 213], [164, 178], [155, 138], [163, 162],
    [174, 137], [169, 179], [185, 147], [176, 189], [175, 225], [175, 253], [184, 285]];
  path(ctx, trunk, warm ? 'rgba(184,135,70,.15)' : 'rgba(176,155,122,.16)', C.ink, 1.1);
  for (let i = 0; i < 7; i++) {
    line(ctx, 163 + i * 2, 274 - i * 3, 169 + i, 180 + i * 7, C.ink, .55, .5);
  }
  const branchEnds = [[79, 133], [94, 106], [116, 94], [143, 82], [171, 91], [200, 93],
    [226, 113], [247, 145], [119, 153], [211, 147]];
  branchEnds.forEach(([bx, by], i) => {
    ctx.beginPath();
    ctx.moveTo(168, 185 + i % 3 * 6);
    ctx.quadraticCurveTo(165 + (bx - 165) * .2, by - 30, bx, by + 8);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = i % 3 === 0 ? 1 : .7;
    ctx.stroke();
  });
  for (let i = 0; i < 72; i++) {
    const u = i / 71;
    const bx = 76 + u * 170;
    const by = 94 + Math.pow((u - .49) * 2, 2) * 44 + noise(i, 3) * 23;
    const length = (32 + noise(i, 8) * 102) * (.8 + p * .2);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.bezierCurveTo(bx - 12, by + length * .3, bx + 9, by + length * .75, bx - 4, by + length);
    ctx.strokeStyle = i % 4 === 0 ? C.ink : warm ? C.gold : C.blue;
    ctx.globalAlpha = inheritedAlpha * (i % 4 === 0 ? .58 : .55);
    ctx.lineWidth = i % 4 === 0 ? .65 : 1.4;
    ctx.stroke();
    for (let j = 0; j < 6; j++) {
      const yy = by + j * length / 6;
      const xx = bx - 4 + Math.sin(j + i) * 3;
      line(ctx, xx, yy, xx - 4 + j % 2 * 8, yy + 8, warm ? C.gold : C.ink, .7, .65);
    }
  }
  ctx.globalAlpha = inheritedAlpha * .75;
  for (let i = 0; i < 18; i++) {
    const tx = 146 + noise(i, 20) * 61;
    const ty = 284 + noise(i, 31) * 11;
    line(ctx, tx, ty, tx + 17, ty - 3, C.ink, .5, .7);
  }
  ctx.restore();
}

function flower(ctx, x, y, size, gold = false) {
  line(ctx, x, y, x + size * .3, y - size * 3, C.ink, .7, .7);
  line(ctx, x + .5, y - size, x - size * 1.1, y - size * 1.8, C.blue, .9, .9);
  const fx = x + size * .3;
  const fy = y - size * 3;
  for (let i = 0; i < 5; i++) {
    const a = i * TAU / 5 + (noise(i, x) - .5) * .18;
    const petal = .85 + noise(i, y) * .3;
    oval(ctx, fx + Math.cos(a) * size * .75, fy + Math.sin(a) * size * .75,
      size * .75 * petal, size * .45, gold ? C.gold : C.red, null, .5, a);
  }
  oval(ctx, fx, fy, size * .35, size * .35, C.paper, C.ink, .45);
}

function person(ctx, x, y, scale, dress, lean = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(scale, scale);
  oval(ctx, 0, -38, 5.5, 6.8, C.paper, C.ink, .85);
  ctx.beginPath();
  ctx.moveTo(-5, -39);
  ctx.quadraticCurveTo(-5, -48, 3, -44);
  ctx.quadraticCurveTo(8, -43, 5, -36);
  ctx.fillStyle = C.ink;
  ctx.fill();
  path(ctx, [[-5, -30], [5, -30], [8, -11], [-8, -11]], dress, C.ink, .8);
  line(ctx, -4, -11, -5, 0, C.ink, 2);
  line(ctx, 4, -11, 6, 0, C.ink, 2);
  line(ctx, -5, -26, -12, -15, C.ink, 1.5);
  line(ctx, 5, -26, 13, -18, C.ink, 1.5);
  ctx.restore();
}

/** Draw the recurring painting on any rectangular surface. */
export function drawHouse(ctx, x = 0, y = 0, w = 640, h = 400, options = {}) {
  const warm = Boolean(options.warm);
  const sketch = Boolean(options.sketch);
  const progress = clamp(options.progress ?? 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(w / 640, h / 400);
  ctx.beginPath();
  ctx.rect(0, 0, 640, 400);
  ctx.clip();
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, 640, 400);
  if (!sketch) {
    const sky = ctx.createLinearGradient(0, 0, 0, 330);
    sky.addColorStop(0, warm ? 'rgba(184,135,70,.12)' : 'rgba(176,155,122,.09)');
    sky.addColorStop(.8, 'rgba(244,232,207,0)');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 330);
  }
  paperSpeckle(ctx, 0, 0, 640, 400, 220, 12);
  clouds(ctx, warm);
  oval(ctx, 509, 82, warm ? 38 : 31, warm ? 38 : 31,
    sketch ? null : warm ? 'rgba(184,135,70,.53)' : 'rgba(184,135,70,.33)', C.gold, .9);
  oval(ctx, 509, 82, warm ? 43 : 35, warm ? 43 : 35, null, 'rgba(184,135,70,.35)', .6);
  if (!sketch) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(509, 82, warm ? 38 : 31, warm ? 38 : 31, 0, 0, TAU); ctx.clip();
    pencilWash(ctx, [[464, 36], [554, 36], [554, 128], [464, 128]], C.gold, 23, 80);
    ctx.restore();
  }
  if (warm) {
    for (let i = 0; i < 18; i++) {
      const a = i * TAU / 18 + (noise(i, 15) - .5) * .055;
      const rayLength = 54 + i % 2 * 6 + noise(i, 17) * 5;
      line(ctx, 509 + Math.cos(a) * 48, 82 + Math.sin(a) * 48,
        509 + Math.cos(a) * rayLength, 82 + Math.sin(a) * rayLength, C.gold, .75, .6);
    }
  }
  path(ctx, [[0, 253], [42, 240], [75, 247], [116, 228], [159, 240], [214, 224],
    [259, 239], [314, 232], [368, 243], [437, 231], [494, 239], [567, 215], [640, 233], [640, 400], [0, 400]],
  sketch ? null : 'rgba(176,155,122,.1)', 'rgba(73,54,41,.27)', .7);
  path(ctx, [[0, 286], [123, 273], [204, 286], [292, 276], [392, 295], [482, 279], [640, 269],
    [640, 400], [0, 400]], sketch ? null : 'rgba(214,197,165,.15)', 'rgba(73,54,41,.45)', .75);

  // The long, slightly converging ground strokes keep the house lonely and small.
  for (let i = 0; i < 148; i++) {
    const gx = noise(i, 52) * 660 - 10;
    const gy = 275 + noise(i, 55) * 127;
    const len = 4 + noise(i, 4) * (gy - 240) * .42;
    line(ctx, gx, gy, gx + len, gy - 2 - len * .06, C.ink, .45 + noise(i, 56) * .35,
      sketch ? .14 : .21 + noise(i, 50) * .18);
    if (i % 3 === 0) line(ctx, gx + len * .2, gy, gx + len * .5, gy - 6, C.blue, .5, .4);
  }
  if (sketch) ctx.globalAlpha *= .65;
  willow(ctx, warm, progress);

  // Roof, front gable, and the receding side are separate planes.
  path(ctx, [[291, 183], [382, 101], [459, 84], [538, 156], [461, 184]],
    sketch ? null : 'rgba(176,155,122,.34)', C.ink, 1.3);
  path(ctx, [[291, 183], [382, 101], [461, 184], [461, 294], [291, 288]],
    sketch ? C.paper : warm ? 'rgba(244,232,207,.96)' : 'rgba(244,232,207,.8)', C.ink, 1.2);
  path(ctx, [[461, 184], [538, 156], [538, 267], [461, 294]],
    sketch ? C.paper : 'rgba(176,155,122,.22)', C.ink, 1.1);
  path(ctx, [[281, 188], [382, 92], [469, 182], [461, 190], [382, 111], [292, 192]],
    C.paper, C.ink, 1.2);
  path(ctx, [[382, 92], [459, 76], [548, 155], [539, 163], [458, 88], [390, 106]],
    sketch ? C.paper : 'rgba(176,155,122,.34)', C.ink, 1.1);
  if (!sketch) {
    pencilWash(ctx, [[391, 103], [458, 88], [538, 158], [467, 183]], C.blue, 47, 90);
    pencilWash(ctx, [[462, 190], [538, 165], [538, 268], [462, 294]], C.gold, 17, 75);
    pencilWash(ctx, [[293, 193], [458, 194], [458, 289], [293, 286]], C.blue, 57, 80);
  }
  // Chimney: tiny offsets make the perspective read at phone size.
  path(ctx, [[466, 102], [466, 65], [482, 61], [488, 66], [488, 120]], C.soft, C.ink, .85);
  path(ctx, [[463, 65], [481, 60], [492, 64], [475, 70]], C.paper, C.ink, .7);
  line(ctx, 476, 70, 476, 109, C.ink, .6, .7);
  for (let k = 0; k < 4; k++) line(ctx, 467, 74 + k * 8, 476, 77 + k * 8, C.ink, .45, .6);
  if (warm) {
    ctx.beginPath();
    ctx.moveTo(479, 58);
    ctx.bezierCurveTo(468, 46, 492, 45, 485, 30);
    ctx.bezierCurveTo(477, 16, 494, 18, 493, 4);
    ctx.strokeStyle = 'rgba(176,155,122,.48)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  for (let i = 0; i < 10; i++) {
    const yy = 191 + i * 9;
    roughLine(ctx, 294, yy, 458, yy + 4, C.ink, .55, i);
    line(ctx, 464, yy + 5, 535, yy - 22, C.ink, .5, .42);
  }
  for (let yy = 134; yy < 182; yy += 8) {
    const half = (yy - 105) * .87;
    line(ctx, 383 - half, yy, 382 + half, yy, C.ink, .45, .37);
  }
  // Individually etched roof seams, clipped to its triangular face.
  ctx.save();
  path(ctx, [[391, 103], [458, 88], [538, 158], [467, 183]], null, null);
  ctx.clip();
  hatch(ctx, 380, 88, 173, 104, 5, C.ink, .33, true);
  for (let i = 0; i < 6; i++) line(ctx, 400, 105 + i * 13, 546, 127 + i * 13, C.ink, .7, .48);
  ctx.restore();
  // Empty threshold is the visual anchor shared by every version.
  path(ctx, [[355, 219], [386, 220], [386, 291], [354, 290]], warm ? 'rgba(184,135,70,.72)' : C.ink, C.ink, 1.1);
  path(ctx, [[350, 215], [391, 216], [391, 292], [386, 293], [386, 221], [355, 220], [355, 292], [350, 291]],
    C.paper, C.ink, .75);
  line(ctx, 370, 221, 370, 289, C.ink, .7, warm ? .5 : .15);
  if (warm) {
    path(ctx, [[369, 225], [382, 225], [382, 250], [369, 250]], 'rgba(244,232,207,.28)', C.ink, .65);
    oval(ctx, 379, 261, 1.1, 1.1, C.ink);
  } else {
    line(ctx, 358, 229, 358, 288, C.blue, .7, .44);
    line(ctx, 358, 290, 382, 291, C.blue, 1, .5);
  }
  path(ctx, [[345, 292], [391, 294], [406, 302], [335, 300]], C.soft, C.ink, .8);
  path(ctx, [[335, 300], [406, 302], [415, 307], [328, 305]], C.paper, C.ink, .65);

  const windows = [[308, 217, 23, 31], [411, 220, 25, 32], [370, 151, 23, 27]];
  for (const [wx, wy, ww, wh] of windows) {
    ctx.fillStyle = warm ? 'rgba(184,135,70,.53)' : 'rgba(176,155,122,.35)';
    ctx.fillRect(wx, wy, ww, wh);
    roughRect(ctx, wx, wy, ww, wh, C.ink, .85);
    roughRect(ctx, wx - 3, wy - 3, ww + 6, wh + 6, C.ink, .65);
    line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, C.ink, .75);
    line(ctx, wx, wy + wh * .48, wx + ww, wy + wh * .48, C.ink, .75);
    line(ctx, wx - 4, wy + wh + 4, wx + ww + 5, wy + wh + 4, C.ink, 1);
    if (!warm) line(ctx, wx + 3, wy + 4, wx + ww - 3, wy + wh - 4, C.paper, .8, .7);
  }
  path(ctx, [[489, 207], [513, 198], [513, 231], [489, 240]], warm ? 'rgba(184,135,70,.65)' : C.blue, C.ink, .85);
  line(ctx, 501, 203, 501, 235, C.ink, .65);
  line(ctx, 489, 223, 513, 214, C.ink, .65);
  hatch(ctx, 295, 251, 46, 36, 4, C.ink, .19);
  if (!warm) {
    // Hairline cracks and untended grass, never a horror-house caricature.
    path(ctx, [[443, 266], [439, 273], [443, 278], [438, 287]], null, C.ink, .6, false);
    for (let i = 0; i < 25; i++) {
      const gx = 268 + noise(i, 31) * 296;
      const gy = 287 + noise(i, 32) * 22;
      line(ctx, gx, gy, gx - 4 + noise(i, 34) * 7, gy - 6 - noise(i, 36) * 10, C.ink, .7, .63);
    }
  }
  if (warm) {
    path(ctx, [[353, 308], [390, 308], [464, 400], [274, 400]], 'rgba(184,135,70,.14)', 'rgba(184,135,70,.45)', .8);
    for (let i = 0; i < 36; i++) {
      const side = i % 2 ? 1 : -1;
      const yy = 300 + noise(i, 91) * 82;
      const xx = 373 + side * (42 + (yy - 300) * .55 + noise(i, 16) * 55);
      flower(ctx, xx, yy, 1.1 + noise(i, 9) * 1.1, i % 3 === 0);
    }
    person(ctx, 367, 336, .97, C.blue, -.025);
    person(ctx, 408, 340, .94, C.red, .03);
    person(ctx, 391, 348, .62, C.gold, -.1);
    line(ctx, 379, 320, 386, 330, C.ink, 1.1);
    line(ctx, 396, 321, 397, 331, C.ink, 1.1);
    // One small open gate gives the reimagined scene a clear invitation.
    for (let i = 0; i < 6; i++) {
      const fx = 503 + i * 16;
      line(ctx, fx, 315, fx, 283 - i * .7, C.ink, 1.2, .75);
    }
    line(ctx, 500, 297, 595, 293, C.ink, 1.2, .75);
    line(ctx, 500, 308, 595, 304, C.ink, 1.1, .75);
  }
  if (sketch || progress < .98) {
    ctx.save();
    ctx.globalAlpha *= .3;
    ctx.setLineDash([4, 5]);
    line(ctx, 245, 294, 583, 294, C.ink, .7);
    line(ctx, 383, 55, 383, 328, C.ink, .65);
    line(ctx, 275, 200, 548, 153, C.ink, .65);
    ctx.restore();
    constructionCross(ctx, 382, 102, 9);
    constructionCross(ctx, 291, 289, 7);
    constructionCross(ctx, 537, 267, 7);
  }
  ctx.restore();
}

function paintBrush(ctx, x, y, angle = -.7, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  path(ctx, [[-3, 116], [-4, -34], [3, -34], [2, 116], [0, 123]], C.red, C.ink, .9);
  line(ctx, -1, -24, -1, 109, C.paper, .7, .7);
  path(ctx, [[-5, -33], [4, -33], [5, -57], [-5, -57]], C.soft, C.ink, .8);
  for (let i = 0; i < 5; i++) line(ctx, -4, -38 - i * 3, 4, -38 - i * 3, C.ink, .5, .6);
  ctx.beginPath();
  ctx.moveTo(-5, -57);
  ctx.bezierCurveTo(-7, -67, -2, -77, -1, -83);
  ctx.bezierCurveTo(3, -71, 7, -65, 5, -57);
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.fill();
  for (let i = 0; i < 4; i++) line(ctx, -3 + i * 2, -59, -1 + i * .5, -74, C.gold, .45, .8);
  ctx.restore();
}

function brushHand(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(-.16);
  // A wrist, cupped palm, bent index, and three separately articulated fingers.
  ctx.beginPath();
  ctx.moveTo(45, 102);
  ctx.lineTo(-3, 112);
  ctx.bezierCurveTo(-6, 84, -15, 75, -21, 61);
  ctx.bezierCurveTo(-25, 51, -30, 36, -24, 28);
  ctx.bezierCurveTo(-20, 22, -15, 23, -11, 29);
  ctx.lineTo(-3, 42);
  ctx.bezierCurveTo(-1, 24, -8, 8, -5, -1);
  ctx.bezierCurveTo(-3, -10, 5, -11, 9, -4);
  ctx.lineTo(24, 27);
  ctx.bezierCurveTo(38, 25, 49, 32, 51, 42);
  ctx.bezierCurveTo(57, 61, 43, 76, 45, 102);
  ctx.closePath();
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.3;
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-14, 42);
  ctx.bezierCurveTo(-4, 54, 7, 62, 18, 59);
  ctx.bezierCurveTo(26, 56, 29, 48, 20, 43);
  ctx.lineTo(9, 37);
  ctx.moveTo(25, 29);
  ctx.bezierCurveTo(15, 27, 10, 30, 13, 36);
  ctx.moveTo(38, 36);
  ctx.bezierCurveTo(30, 32, 23, 35, 24, 41);
  ctx.moveTo(47, 43);
  ctx.bezierCurveTo(38, 39, 32, 44, 34, 51);
  ctx.moveTo(44, 55);
  ctx.bezierCurveTo(33, 55, 30, 58, 32, 64);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = .85;
  ctx.stroke();
  oval(ctx, 2, -1, 3, 6, null, 'rgba(73,54,41,.65)', .6, -.3);
  line(ctx, -1, 85, 36, 77, C.ink, .7, .45);
  line(ctx, 2, 90, 34, 84, C.ink, .6, .32);
  for (let i = 0; i < 8; i++) line(ctx, 37 - i * 1.3, 96 - i * 5, 44 - i * .3, 91 - i * 5, C.blue, .7, .6);
  // Shirt cuff closes the drawing instead of cutting a bare wrist abruptly.
  path(ctx, [[-8, 101], [46, 91], [54, 117], [-1, 125]], C.soft, C.ink, 1.2);
  line(ctx, -5, 109, 48, 99, C.ink, .65, .6);
  ctx.restore();
}

function holdingHand(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(30, 99);
  ctx.lineTo(-26, 103);
  ctx.bezierCurveTo(-23, 71, -36, 66, -42, 47);
  ctx.bezierCurveTo(-46, 30, -43, 7, -37, -8);
  ctx.bezierCurveTo(-34, -17, -27, -17, -23, -9);
  ctx.lineTo(-16, 17);
  ctx.bezierCurveTo(-5, 16, 9, 12, 20, 9);
  ctx.bezierCurveTo(39, 4, 52, 3, 57, 9);
  ctx.bezierCurveTo(61, 15, 54, 20, 45, 21);
  ctx.lineTo(21, 29);
  ctx.bezierCurveTo(49, 20, 66, 19, 67, 28);
  ctx.bezierCurveTo(68, 35, 50, 41, 34, 44);
  ctx.bezierCurveTo(58, 36, 67, 36, 67, 44);
  ctx.bezierCurveTo(66, 52, 47, 57, 31, 61);
  ctx.bezierCurveTo(48, 56, 57, 54, 56, 62);
  ctx.bezierCurveTo(54, 72, 32, 75, 30, 99);
  ctx.closePath();
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.25;
  ctx.fill(); ctx.stroke();
  oval(ctx, -30, -3, 4, 7, null, 'rgba(73,54,41,.65)', .7, -.15);
  ctx.beginPath();
  ctx.moveTo(-23, 23);
  ctx.bezierCurveTo(-15, 35, -20, 48, -12, 61);
  ctx.moveTo(-7, 46);
  ctx.bezierCurveTo(0, 42, 5, 40, 17, 41);
  ctx.moveTo(-12, 64);
  ctx.bezierCurveTo(0, 67, 11, 70, 23, 66);
  ctx.strokeStyle = 'rgba(73,54,41,.65)';
  ctx.lineWidth = .7;
  ctx.stroke();
  for (let i = 0; i < 8; i++) line(ctx, -33 + i * 1.2, 57 + i * 4, -23 + i * .8, 51 + i * 4, C.ink, .6, .25);
  path(ctx, [[-29, 91], [33, 89], [39, 119], [-28, 121]], C.blue, C.ink, 1.1);
  line(ctx, -27, 99, 33, 97, C.paper, .8, .75);
  hatch(ctx, -25, 104, 60, 14, 5, C.ink, .18);
  ctx.restore();
}

function pencilNotes(ctx, x, y, width = 90, seed = 1) {
  ctx.save();
  ctx.strokeStyle = 'rgba(73,54,41,.28)';
  ctx.lineWidth = .65;
  for (let row = 0; row < 4; row++) {
    ctx.beginPath();
    let xx = x + noise(row, seed) * 3;
    const yy = y + row * 8 + noise(row, seed + 1) * 1.8;
    const rowWidth = width * (.63 + noise(row, seed + 4) * .37);
    ctx.moveTo(xx, yy);
    for (let i = 0; i < 17; i++) {
      const nextX = xx + rowWidth / 17;
      const baseline = yy + Math.sin(i * .38 + row) * 1.8;
      ctx.quadraticCurveTo(xx + 1, baseline - 2 - noise(i + row * 30, seed) * 3, nextX, baseline);
      if (i % 5 === 4) ctx.moveTo(nextX + 2.5, baseline + .5);
      xx = nextX;
    }
    ctx.stroke();
  }
  if (seed % 2 === 0) roughLine(ctx, x - 2, y + 12, x + width * .64, y + 10, C.ink, .6, seed);
  ctx.restore();
}

// Use the same coordinate system as framed(), including for hands overlapping
// its edge. There is no independent hand drift when an object is angled.
function onFrame(ctx, x, y, w, h, angle, painter) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.translate(-w / 2, -h / 2);
  painter(ctx);
  ctx.restore();
}

// The brush and its gripping fingers form one rigid pose. x/y locate the actual
// bristle tip, so deposited marks and contact poses share the exact same point.
function workingHand(ctx, tipX, tipY, angle = 0, scale = .92) {
  const brushAngle = -.7;
  const brushTipX = -1 * Math.cos(brushAngle) + 83 * Math.sin(brushAngle);
  const brushTipY = -1 * Math.sin(brushAngle) - 83 * Math.cos(brushAngle);
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.translate(-brushTipX, -brushTipY);
  paintBrush(ctx, 0, 0, brushAngle, 1);
  brushHand(ctx, 16, 14, .94);
  ctx.restore();
}

function finalGrass(ctx, frame) {
  const strokes = [
    [[541, 350], [541, 350]],
    [[541, 350], [545, 343]],
    [[541, 350], [552, 339]],
    [[541, 350], [558, 346]],
  ];
  for (let i = 0; i < Math.min(4, frame); i++) {
    const [[x1, y1], [x2, y2]] = strokes[i];
    line(ctx, x1, y1, x2, y2, C.ink, 1.65);
    if (i) line(ctx, x1 + 1, y1 - 1, x2 - 1, y2 + 2, C.gold, .85);
  }
}

export function drawOpening(ctx, p, options = {}) {
  const frame = celIndex(p, options);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Marginal doodles and scratched-out notes around a taped homework sheet.
  pencilNotes(ctx, 469, 110, 128, 22);
  path(ctx, [[632, 99], [636, 111], [649, 113], [638, 120], [639, 133],
    [630, 125], [619, 130], [623, 117], [616, 108], [629, 109]], null, C.gold, .9);
  line(ctx, 476, 148, 564, 147, C.ink, .8, .24);
  constructionCross(ctx, 886, 632, 11);
  loosePaper(ctx, 119, 463, 190, 139, -.2, (c, w, h) => {
    c.globalAlpha *= .7;
    drawHouse(c, 11, 8, w - 22, h - 27, { sketch: true });
    line(c, 15, h - 12, 87, h - 12, C.ink, .65, .3);
  });
  loosePaper(ctx, 174, 132, 203, 139, .13, (c) => {
    constructionCross(c, 80, 69, 42);
    oval(c, 80, 69, 29, 29, null, C.gold, 1.1);
    oval(c, 80, 69, 35, 34, null, 'rgba(73,54,41,.23)', .6);
    pencilNotes(c, 130, 68, 51, 8);
    line(c, 80, 34, 150, 20, C.ink, .6, .4);
  });
  framed(ctx, 236, 180, 651, 449, -.035, c => {
    drawHouse(c, 0, 0, 640, 400, { progress: 1 });
    finalGrass(c, frame);
  }, { sheet: true });
  // Spare gestural leaf and pigment studies remain visibly separate artifacts.
  for (let i = 0; i < 8; i++) {
    const yy = 293 + i * 13;
    line(ctx, 154, yy, 139 - i * 1.4, yy - 16, C.ink, .8, .5);
    line(ctx, 154, yy, 167 + i, yy - 15, C.ink, .8, .5);
  }
  ctx.beginPath();
  ctx.moveTo(154, 291); ctx.quadraticCurveTo(165, 339, 150, 397);
  ctx.strokeStyle = 'rgba(73,54,41,.6)'; ctx.lineWidth = 1; ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(290 + i * 36, 685);
    ctx.rotate(-.07 + i * .04);
    ctx.fillStyle = [C.blue, C.gold, C.red][i];
    ctx.globalAlpha *= .72;
    for (let j = 0; j < 5; j++) ctx.fillRect(-11 + j * .5, -5 + j * 2.2, 26 - j * 1.1, 1.5);
    ctx.restore();
  }
  pencilNotes(ctx, 411, 681, 96, 4);
  // Approach, contact, three individual grass strokes, inspect, lift, rest.
  // No in-between transforms are generated: each of these is a finished cel.
  const poses = [
    [534, 332, -.13], [541, 350, -.06], [545, 343, -.035],
    [552, 339, .015], [558, 346, .08], [559, 346, .13],
    [573, 328, .18], [603, 346, .24],
  ];
  const [tipX, tipY, angle] = poses[frame];
  onFrame(ctx, 236, 180, 651, 449, -.035, c => {
    workingHand(c, 26 + tipX * 599 / 640, 26 + tipY * 397 / 400, angle, .88);
  });
  ctx.restore();
}

export function drawArchive(ctx, p, options = {}) {
  const frame = celIndex(p, options);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Underlaid drafts preserve the chain from someone else's unfinished canvas
  // to Maya's own house study, without relying on any words inside the artwork.
  loosePaper(ctx, 107, 202, 260, 207, -.13, (c, w, h) => {
    drawHouse(c, 12, 14, w - 24, h - 42, { sketch: true });
    pencilNotes(c, 21, h - 22, 86, 12);
  });
  loosePaper(ctx, 547, 441, 320, 227, .14, (c, w, h) => {
    drawHouse(c, 14, 17, w - 28, h - 44, { sketch: true });
    roughLine(c, 27, h - 13, 117, h - 13, C.ink, .6, 4);
  });
  // Open cloth-bound sketchbook, with a softly curved gutter.
  ctx.save();
  ctx.translate(355, 546);
  ctx.rotate(-.09);
  path(ctx, [[-180, -47], [-10, -38], [11, -42], [194, -50], [184, 117], [8, 120], [-12, 117], [-184, 109]],
    C.blue, C.ink, 1.4);
  path(ctx, [[-174, -52], [-14, -43], [0, -36], [0, 109], [-20, 107], [-175, 103]], C.paper, C.ink, .8);
  path(ctx, [[0, -36], [14, -44], [184, -52], [178, 105], [13, 107], [0, 112]], C.paper, C.ink, .8);
  for (let i = 0; i < 4; i++) {
    line(ctx, -174, 104 + i * 2, -17, 109 + i * 2, C.ink, .4, .5);
    line(ctx, 16, 109 + i * 2, 180, 104 + i * 2, C.ink, .4, .5);
  }
  ctx.beginPath();
  ctx.moveTo(0, -36); ctx.bezierCurveTo(-8, 14, -7, 67, 0, 109);
  ctx.strokeStyle = 'rgba(73,54,41,.45)'; ctx.lineWidth = 1; ctx.stroke();
  pencilNotes(ctx, -156, -16, 103, 54);
  pencilNotes(ctx, -156, 34, 121, 41);
  pencilNotes(ctx, -154, 77, 88, 40);
  ctx.save();
  ctx.translate(17, -21);
  drawHouse(ctx, 0, 0, 143, 100, { sketch: true });
  ctx.restore();
  path(ctx, [[130, 106], [130, 135], [140, 130], [148, 138], [148, 105]], C.red, C.ink, .65);
  ctx.restore();

  framed(ctx, 293, 155, 583, 401, .025, c => {
    drawHouse(c, 0, 0, 640, 400, { progress: .75 });
    // A revision remains legible as a revision: old pencil is retained while
    // each new stroke is added at its final pigment density, never wiped in.
    line(c, 22, 40, 204, 40, C.ink, .55, .18);
    line(c, 57, 11, 57, 210, C.ink, .55, .18);
    constructionCross(c, 57, 40, 7);
    if (frame >= 1) {
      path(c, [[282, 170], [380, 77], [479, 166]], null, C.red, .9, false);
      constructionCross(c, 380, 77, 7);
      line(c, 267, 155, 304, 127, C.ink, .8);
      path(c, [[297, 129], [304, 127], [301, 135]], null, C.ink, .8, false);
    }
    if (frame >= 2) {
      line(c, 339, 103, 358, 111, C.red, 1.35);
      line(c, 342, 115, 355, 100, C.red, 1.35);
      line(c, 407, 102, 426, 113, C.red, 1.35);
      line(c, 410, 116, 423, 99, C.red, 1.35);
    }
    if (frame >= 3) {
      path(c, [[282, 194], [382, 110], [465, 194]], null, C.ink, 1.3, false);
      line(c, 298, 196, 342, 156, C.gold, 1.6);
      line(c, 399, 130, 447, 178, C.gold, 1.6);
    }
    if (frame >= 4) {
      hatch(c, 463, 248, 43, 24, 3.8, C.ink, .43);
      for (let i = 0; i < 9; i++) line(c, 426 + i * 7, 304, 420 + i * 7, 310, C.blue, .85);
    }
    if (frame >= 5) {
      [[28, C.blue], [59, C.gold], [90, C.red]].forEach(([x, color], i) => {
        for (let j = 0; j < 5; j++) line(c, x, 337 + j * 3, x + 23 - j, 334 + j * 3, color, 2.1);
        line(c, x, 355, x + 16, 355, C.ink, .65);
        if (i === 1) path(c, [[x + 3, 361], [x + 7, 365], [x + 16, 356]], null, C.ink, .9, false);
      });
    }
    if (frame >= 6) {
      pencilNotes(c, 21, 15, 112, 59);
      path(c, [[26, 66], [33, 70], [41, 58]], null, C.ink, 1, false);
      line(c, 50, 65, 104, 64, C.ink, .7);
      pencilNotes(c, 553, 317, 60, 17);
    }
    if (frame >= 7) {
      oval(c, 71, 344, 19, 16, null, C.red, 1.1, -.17);
      path(c, [[550, 374], [559, 382], [577, 359]], null, C.red, 1.4, false);
      pencilNotes(c, 480, 381, 56, 33);
    }
  }, { unfinished: true });
  // Palette: irregular, thumb-holed, with layered dry pigment.
  ctx.save();
  ctx.translate(844, 635);
  ctx.rotate(-.3);
  ctx.beginPath();
  ctx.moveTo(-70, 8);
  ctx.bezierCurveTo(-83, -28, -47, -60, -7, -54);
  ctx.bezierCurveTo(43, -48, 72, -5, 48, 20);
  ctx.bezierCurveTo(22, 50, -19, 29, -41, 30);
  ctx.bezierCurveTo(-64, 39, -67, 22, -70, 8);
  ctx.fillStyle = 'rgba(214,197,165,.7)'; ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke();
  oval(ctx, 27, 9, 11, 15, C.paper, C.ink, .85, -.5);
  [[-45,-14,C.blue], [-21,-31,C.gold], [5,-25,C.red], [-30,8,C.ink]].forEach(([x,y,col], i) => {
    for (let j = 0; j < 4; j++) oval(ctx, x + j * 1.5, y + j * .5, 11 - j, 7, col, null, .5, i);
    line(ctx, x - 5, y - 3, x + 8, y - 1, C.paper, .65, .6);
  });
  ctx.restore();
  paintBrush(ctx, 698, 643, -.93, .95);
  paintBrush(ctx, 737, 660, -1.07, .78);
  constructionCross(ctx, 911, 241, 9);
  ctx.restore();
}

export function drawPerception(ctx, p, options = {}) {
  // reveal is the amount of the warm reconstruction visible, from the right.
  // Manual comparison owns this state entirely; scroll and time cannot alter it.
  const reveal = Math.round(clamp(options.reveal ?? .5) * 8) / 8;
  const split = 640 * (1 - reveal);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.save();
  ctx.setLineDash([2, 7]);
  line(ctx, 125, 126, 907, 126, C.ink, .7, .24);
  line(ctx, 125, 687, 907, 687, C.ink, .7, .24);
  ctx.restore();
  constructionCross(ctx, 153, 126, 8);
  constructionCross(ctx, 887, 687, 8);
  framed(ctx, 151, 169, 747, 495, -.013, c => {
    drawHouse(c, 0, 0, 640, 400, { progress: 1 });
    c.save();
    c.beginPath(); c.rect(split, 0, 640 - split, 400); c.clip();
    drawHouse(c, 0, 0, 640, 400, { warm: true });
    c.restore();
    if (reveal > .005 && reveal < .995) {
      line(c, split, 0, split, 400, C.paper, 5);
      line(c, split, 0, split, 400, C.gold, 1.3);
      oval(c, split, 199, 13, 13, C.paper, C.gold, 1.1);
      path(c, [[split - 4, 195], [split - 8, 199], [split - 4, 203]], null, C.ink, .9, false);
      path(c, [[split + 4, 195], [split + 8, 199], [split + 4, 203]], null, C.ink, .9, false);
    }
  }, { light: true });
  // Fleeting visual echoes show that these two views occupy one physical object.
  oval(ctx, 512, 106, 33, 9, null, 'rgba(73,54,41,.23)', .75);
  oval(ctx, 512, 106, 6.5, 6.5, null, C.gold, .9);
  line(ctx, 485, 107, 467, 100, C.ink, .65, .3);
  line(ctx, 539, 107, 557, 100, C.ink, .65, .3);
  ctx.restore();
}

function coverPainting(ctx) {
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, 640, 400); ctx.clip();
  const bottom = 418;
  // The selected remove state is a complete, opaque physical cover in every
  // cel. Its lower paper edge is beyond the aperture, including at the corners.
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, 640, 400);
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(640, -6); ctx.lineTo(640, bottom - 10);
  ctx.bezierCurveTo(536, bottom + 3, 452, bottom - 7, 339, bottom);
  ctx.bezierCurveTo(243, bottom + 7, 115, bottom - 5, 0, bottom + 1);
  ctx.closePath();
  ctx.fillStyle = C.paper; ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();
  paperSpeckle(ctx, 0, 0, 640, bottom, 170, 72);
  for (let i = 0; i < 8; i++) {
    const xx = 22 + i * 84;
    ctx.beginPath();
    ctx.moveTo(xx, 0);
    ctx.bezierCurveTo(xx - 7, bottom * .3, xx + 13, bottom * .7, xx + 3, bottom - 4);
    ctx.strokeStyle = i % 2 ? 'rgba(176,155,122,.23)' : 'rgba(73,54,41,.1)';
    ctx.lineWidth = i % 2 ? 4 : 1; ctx.stroke();
  }
  line(ctx, 17, 12, 626, 12, C.ink, .6, .25);
  ctx.restore();
}

export function drawDaughter(ctx, p, options = {}) {
  const choice = options.choice ?? null;
  // A covered work is a settled response: the drawing hand has withdrawn and
  // neither the hidden signature nor the physical pose advances underneath it.
  const frame = choice === 'remove' ? 7 : celIndex(p, options);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Children's early color studies are quieter than the finished offering.
  loosePaper(ctx, 145, 187, 207, 155, -.19, (c, w, h) => {
    c.globalAlpha *= .7;
    drawCityMini(c, 13, 14, w - 26, h - 29, .7);
  });
  loosePaper(ctx, 676, 481, 218, 168, .14, (c) => {
    for (let i = 0; i < 5; i++) {
      const yy = 40 + i * 21;
      roughLine(c, 23, yy, 181 - i * 8, yy - 4, [C.blue, C.gold, C.red, C.ink, C.blue][i], 4, i);
    }
  });
  const fx = 218;
  const fy = 161;
  const fw = 642;
  const fh = 455;
  const angle = -.02;
  framed(ctx, fx, fy, fw, fh, angle, c => {
    drawCityMini(c, 0, 0, 640, 400, 1);
    // The little brush irregularities distinguish a made object from a window.
    c.save();
    c.globalAlpha *= .28;
    for (let i = 0; i < 24; i++) {
      const xx = 15 + noise(i, 48) * 610;
      const yy = 14 + noise(i, 49) * 373;
      line(c, xx, yy, xx + 2 + noise(i, 41) * 5, yy - 1, i % 3 ? C.blue : C.gold, .65);
    }
    c.restore();
    // The author signs this one city once. Strokes stay at their final opacity
    // after the brush has passed; no signature or hand oscillates in a loop.
    if (frame >= 2) oval(c, 592, 377, .85, .85, C.red);
    if (frame >= 3) path(c, [[592, 377], [597, 364]], null, C.red, 1.2, false);
    if (frame >= 4) path(c, [[597, 364], [602, 377], [607, 365], [612, 377]], null, C.red, 1.2, false);
    if (frame >= 5) line(c, 590, 381, 616, 380, C.red, .8);
    if (choice === 'remove') coverPainting(c);
  }, { light: true });
  onFrame(ctx, fx, fy, fw, fh, angle, c => {
    // Receiving hand: its thumb wraps the actual local lower edge, not an
    // independently calculated world position.
    holdingHand(c, 438, fh - 5, .94);
    if (choice === 'remove') return;
    if (frame === 1) {
      // An extended forefinger indicates the maker's corner before touching it.
      c.save();
      c.translate(584, 418);
      c.rotate(-.12);
      brushHand(c, 0, 0, .69);
      c.restore();
    } else if (frame >= 2) {
      const poses = [
        [592, 377, -.17], [597, 364, -.11], [612, 377, -.035],
        [616, 380, .035], [622, 354, .12], [638, 372, .22],
      ];
      const [tipX, tipY, wrist] = poses[frame - 2];
      workingHand(c, 26 + tipX * (fw - 52) / 640,
        26 + tipY * (fh - 52) / 400, wrist, .69);
    }
  });
  // Scattered worn pencils make authorship visible even if the painting is covered.
  paintBrush(ctx, 447, 686, -1.31, .7);
  line(ctx, 354, 711, 514, 686, C.gold, 4, .8);
  line(ctx, 356, 709, 514, 684, C.ink, .6, .6);
  path(ctx, [[353, 708], [341, 713], [355, 713]], C.paper, C.ink, .7);
  constructionCross(ctx, 886, 164, 7);
  ctx.restore();
}
