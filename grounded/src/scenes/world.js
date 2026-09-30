// A city imagined in pen and colored pencil on somebody's homework.
// Every wobble is fixed to the drawing, so the sketch never shimmers.
const C = Object.freeze({ ink: '#493629', paper: '#f4e8cf', blue: '#b09b7a', gold: '#b88746', soft: '#d6c5a5', green: '#88815d' });
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const phase = (p, a, b) => smooth((p - a) / (b - a));

function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const rng = seeded(221908);
const FAR_CITY = Array.from({ length: 29 }, (_, i) => ({ x: 132 + i * 27, y: 554 + Math.sin(i * .57) * 8, w: 17 + rng() * 20, h: 88 + rng() * 135, crown: rng() > .64 }));
const GARDENS = Array.from({ length: 30 }, (_, i) => ({ x: 125 + i * 25 + rng() * 9, y: 579 + Math.sin(i * .69) * 17, s: .35 + rng() * .35, kind: i % 3 }));
const STARS = Array.from({ length: 30 }, () => ({ x: 151 + rng() * 700, y: 95 + rng() * 276, r: .5 + rng() * .9 }));
const PEOPLE = Array.from({ length: 27 }, (_, i) => ({ x: 167 + rng() * 665, y: 573 + rng() * 51, s: .7 + rng() * .45, gold: i % 5 === 0 }));
const PENCIL = Array.from({ length: 80 }, () => ({ x: rng(), y: rng(), length: 5 + rng() * 19, tilt: rng() * 4 - 2 }));
const LEAF_LOOPS = Array.from({ length: 17 }, (_, i) => ({ x: Math.cos(i * 2.4) * (4 + rng() * 9), y: -30 + Math.sin(i * 2.4) * (5 + rng() * 9), rx: 3 + rng() * 5, ry: 2 + rng() * 4, angle: rng() * Math.PI }));
const scratch = (x, y) => Math.sin(x * 12.9898 + y * 4.1414);

// Eight separate cels: a short departure, a crossing, then a gentle arrival.
// The hull follows the canal perspective; nothing in the town is redrawn by time.
const BOAT_CELS = [
  { x: 651, y: 694, angle: -.01, wakes: [[-29, 3, -35, 5, -42, 4], [-20, 10, -28, 12, -35, 11]] },
  { x: 658, y: 693, angle: -.025, wakes: [[-27, 2, -36, 5, -47, 4], [-20, 10, -31, 13, -42, 12], [-34, 7, -40, 9, -47, 8]] },
  { x: 675, y: 691, angle: -.045, wakes: [[-26, 2, -41, 6, -56, 4], [-18, 10, -36, 15, -51, 13], [-35, 8, -45, 10, -54, 9]] },
  { x: 699, y: 687, angle: -.065, wakes: [[-26, 2, -43, 7, -61, 5], [-18, 10, -39, 16, -59, 14], [-38, 9, -49, 11, -59, 10]] },
  { x: 724, y: 681, angle: -.09, wakes: [[-26, 2, -44, 7, -64, 5], [-18, 10, -42, 16, -61, 14], [-40, 9, -50, 12, -61, 11]] },
  { x: 745, y: 674, angle: -.11, wakes: [[-27, 2, -42, 6, -56, 5], [-19, 10, -37, 15, -53, 13], [-37, 8, -44, 11, -52, 10]] },
  { x: 758, y: 669, angle: -.13, wakes: [[-28, 3, -39, 6, -49, 5], [-20, 10, -34, 14, -45, 12], [-33, 8, -39, 10, -45, 9]] },
  { x: 762, y: 667, angle: -.14, wakes: [[-29, 3, -37, 5, -44, 4], [-21, 10, -30, 12, -39, 11]] },
];

function sketchSegment(ctx, x1, y1, x2, y2, strength = 1) {
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy) || 1;
  const n = scratch(x1 + x2 * .11, y1 + y2 * .07);
  const roughness = Math.min(2.2, .25 + length * .021) * strength;
  const nx = -dy / length, ny = dx / length;
  ctx.moveTo(x1 - dx / length * .4, y1 - dy / length * .4);
  ctx.quadraticCurveTo(x1 + dx * .24 + nx * roughness * n, y1 + dy * .24 + ny * roughness * n, x1 + dx * .51 + nx * roughness * .4, y1 + dy * .51 + ny * roughness * .4);
  ctx.quadraticCurveTo(x1 + dx * .78 - nx * roughness * n, y1 + dy * .78 - ny * roughness * n, x2 + dx / length * .65, y2 + dy / length * .65);
}

function line(ctx, x1, y1, x2, y2, color = C.ink, width = .8) {
  ctx.strokeStyle = color; ctx.lineWidth = width * (1.05 + scratch(x1, y2) * .13);
  ctx.beginPath(); sketchSegment(ctx, x1, y1, x2, y2); ctx.stroke();
  if (width > .65 && Math.hypot(x2 - x1, y2 - y1) > 22) {
    const alpha = ctx.globalAlpha; ctx.globalAlpha *= .24; ctx.lineWidth = width * .65;
    ctx.beginPath(); sketchSegment(ctx, x1 + .9, y1 - .6, x2 + .3, y2 + .8, 1.5); ctx.stroke(); ctx.globalAlpha = alpha;
  }
}
function poly(ctx, points, fill = C.paper, stroke = C.ink, width = 1) {
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      sketchSegment(ctx, a[0], a[1], b[0], b[1]);
    }
    ctx.stroke();
    if (width >= .8) {
      const alpha = ctx.globalAlpha; ctx.globalAlpha *= .23; ctx.lineWidth = width * .6; ctx.beginPath();
      for (let i = 0; i < points.length; i++) { const a = points[i], b = points[(i + 1) % points.length]; sketchSegment(ctx, a[0] - .7, a[1] + .7, b[0] + .8, b[1] + .3, 1.3); }
      ctx.stroke(); ctx.globalAlpha = alpha;
    }
  }
}
function ellipse(ctx, x, y, rx, ry, fill, stroke = C.ink, width = .8) {
  ctx.beginPath();
  const steps = Math.max(16, Math.min(72, Math.round((rx + ry) / 5)));
  for (let i = 0; i <= steps; i++) {
    const a = i / steps * TAU, wobble = 1 + Math.sin(a * 7 + x) * .012 + Math.cos(a * 11 + y) * .008;
    const px = x + Math.cos(a) * rx * wobble, py = y + Math.sin(a) * ry * wobble;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  if (stroke && rx > 18 && width > .6) {
    const alpha = ctx.globalAlpha; ctx.globalAlpha *= .3;
    ctx.beginPath(); ctx.ellipse(x + 1.5, y - .7, rx + .8, Math.max(.1, ry - .5), .006, .2, TAU - .22); ctx.lineWidth = width * .6; ctx.stroke(); ctx.globalAlpha = alpha;
  }
}
function rect(ctx, x, y, w, h, fill = C.paper, stroke = C.ink, width = .8) {
  const lean = Math.min(1.25, h * .006) * scratch(x, y);
  poly(ctx, [[x + lean, y], [x + w + lean * .5, y + .3], [x + w, y + h], [x, y + h - .2]], fill, stroke, width);
}
function path(ctx, commands, fill, stroke = C.ink, width = .9) {
  ctx.beginPath(); commands(ctx);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke();
    if (width >= .7) {
      ctx.save(); ctx.translate(.8, -.65); ctx.globalAlpha *= .3; ctx.lineWidth = width * .63;
      ctx.beginPath(); commands(ctx); ctx.stroke(); ctx.restore();
    }
  }
}
function withAlpha(ctx, alpha, draw) {
  if (alpha <= .001) return;
  ctx.save(); ctx.globalAlpha *= alpha; draw(); ctx.restore();
}

function hatchRect(ctx, x, y, w, h, gap = 5, color = C.blue) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.beginPath();
  for (let i = -h; i < w; i += gap) { const wobble = scratch(i, y) * 1.4; ctx.moveTo(x + i + wobble, y + h + 2); ctx.quadraticCurveTo(x + i + h * .47, y + h * .52 + wobble, x + i + h + wobble, y - 2); }
  ctx.strokeStyle = color; ctx.lineWidth = .6; ctx.stroke(); ctx.restore();
}

function pencilPatch(ctx, x, y, w, h, color = C.blue, opacity = .4) {
  withAlpha(ctx, opacity, () => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.beginPath();
    for (const s of PENCIL) {
      const xx = x + s.x * w, yy = y + s.y * h;
      ctx.moveTo(xx - 3, yy + s.length * .4); ctx.quadraticCurveTo(xx + s.length * .3, yy + s.tilt, xx + s.length, yy - s.length * .42);
    }
    ctx.strokeStyle = color; ctx.lineWidth = .6; ctx.stroke(); ctx.restore();
  });
}

function arch(ctx, x, y, w, h, fill = C.soft, stroke = C.ink) {
  path(ctx, c => { c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); }, fill, stroke, .65);
}

function railing(ctx, x, y, w, slope = 0, h = 7) {
  line(ctx, x, y - h, x + w, y - h + slope, C.ink, .7);
  line(ctx, x, y - h + 2, x + w, y - h + 2 + slope, C.blue, .45);
  for (let i = 0; i <= w; i += 8) line(ctx, x + i, y + (i / w) * slope, x + i, y - h + (i / w) * slope, C.ink, .6);
}

function tree(ctx, x, y, size = 1, kind = 0, life = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  const foliage = life > .05 ? C.soft : C.paper;
  line(ctx, 0, 0, 0, -28, C.ink, 1.25);
  line(ctx, 0, -11, -9, -23, C.ink, .7); line(ctx, 0, -17, 8, -31, C.ink, .7);
  if (kind === 1) {
    path(ctx, c => { c.moveTo(-14, -13); c.bezierCurveTo(-9, -23, -8, -36, 0, -48); c.bezierCurveTo(8, -36, 9, -23, 14, -13); c.closePath(); }, foliage, C.ink, .8);
    for (let j = 0; j < 7; j++) { const yy = -17 - j * 4; line(ctx, -10 + j, yy + 2, 6 - j * .5, yy - 3, life > .05 ? C.green : C.blue, 1.7); }
  } else {
    path(ctx, c => { c.moveTo(-13, -17); c.bezierCurveTo(-22, -25, -15, -34, -11, -36); c.bezierCurveTo(-15, -47, 1, -51, 7, -43); c.bezierCurveTo(19, -45, 22, -34, 17, -27); c.bezierCurveTo(22, -19, 9, -13, 1, -17); c.bezierCurveTo(-3, -11, -9, -12, -13, -17); }, foliage, C.ink, .8);
    // Looping pencil marks deliberately wander across the foliage boundary.
    ctx.beginPath();
    for (const leaf of LEAF_LOOPS) {
      ctx.moveTo(leaf.x + Math.cos(leaf.angle) * leaf.rx, leaf.y + Math.sin(leaf.angle) * leaf.rx);
      ctx.ellipse(leaf.x, leaf.y, leaf.rx, leaf.ry, leaf.angle, 0, TAU * .84);
    }
    ctx.strokeStyle = life > .05 ? C.green : C.blue; ctx.lineWidth = 1.45; ctx.stroke();
    withAlpha(ctx, .4, () => {
      ctx.beginPath();
      for (let j = 0; j < 5; j++) { const leaf = LEAF_LOOPS[j * 3]; ctx.moveTo(leaf.x + 6, leaf.y); ctx.bezierCurveTo(leaf.x + 4, leaf.y - 6, leaf.x - 7, leaf.y - 4, leaf.x - 4, leaf.y + 5); }
      ctx.strokeStyle = C.ink; ctx.lineWidth = .75; ctx.stroke();
    });
    line(ctx, 0, -13, 2, -37, C.ink, .5);
  }
  ellipse(ctx, 0, 1, 8, 2, null, C.blue, .5);
  ctx.restore();
}

function planter(ctx, x, y, w, life, trees = true) {
  poly(ctx, [[x, y], [x + w, y], [x + w - 3, y + 5], [x + 3, y + 5]], C.paper, C.ink, .6);
  line(ctx, x + 2, y - 1, x + w - 2, y - 1, C.green, 2.5);
  if (trees && life > .02) {
    for (let i = 6; i < w - 4; i += 15) tree(ctx, x + i, y - 1, .24 + life * .12, Math.floor(i) % 2, life);
  }
}

function podium(ctx, x, y, w, h = 18, depth = 20) {
  poly(ctx, [[x, y], [x + depth, y - depth * .38], [x + w + depth, y - depth * .38], [x + w, y]], C.paper);
  rect(ctx, x, y, w, h, C.paper);
  poly(ctx, [[x + w, y], [x + w + depth, y - depth * .38], [x + w + depth, y + h - depth * .38], [x + w, y + h]], C.soft, C.ink, .75);
  line(ctx, x, y + 4, x + w, y + 4, C.blue, .6);
  line(ctx, x, y + h - 3, x + w, y + h - 3, C.blue, .55);
  for (let i = 8; i < w; i += 15) line(ctx, x + i, y + 5, x + i, y + h - 3, C.blue, .5);
}

function tower(ctx, x, base, w, h, life = 1, type = 0) {
  const y = base - h, d = w * .22;
  // Lit western face, etched eastern face, planted setbacks.
  poly(ctx, [[x + w, y], [x + w + d, y - d * .4], [x + w + d, base - d * .4], [x + w, base]], C.soft, C.ink, .9);
  rect(ctx, x, y, w, h, C.paper, C.ink, 1.1);
  pencilPatch(ctx, x + 2, y + 3, w - 4, h - 6, C.gold, .27);
  hatchRect(ctx, x + w + 1, y + 2, d - 2, h - d * .4, 6.3, C.blue);
  for (let yy = y + 8; yy < base - 6; yy += 9) line(ctx, x + w + 2, yy, x + w + d - 2, yy - d * .4, C.blue, .55);
  poly(ctx, [[x, y], [x + d, y - d * .4], [x + w + d, y - d * .4], [x + w, y]], C.paper, C.ink, .85);
  const columns = Math.max(2, Math.floor(w / 12));
  const step = w / columns;
  for (let i = 0; i < columns; i++) {
    const xx = x + step * i + step * .26;
    line(ctx, xx - 2, y + 10, xx - 2, base - 7, C.blue, .5);
    for (let yy = y + 13; yy < base - 8; yy += 15) {
      rect(ctx, xx, yy, step * .42, 7, (i + Math.floor(yy / 15)) % 5 === 0 && life > .4 ? C.gold : C.soft, null);
      line(ctx, xx, yy, xx + step * .42, yy, C.ink, .5);
    }
  }
  for (let yy = base - 25; yy > y + 30; yy -= 43) {
    rect(ctx, x - 4, yy, w + 9, 5, C.paper, C.ink, .7);
    line(ctx, x - 3, yy + 2, x + w + 4, yy + 2, C.blue, .5);
    if (life > .08) planter(ctx, x + 4, yy - 1, w - 8, life, true);
  }
  if (type === 1) {
    const inset = w * .16;
    rect(ctx, x + inset, y - 15, w - inset * 2, 15, C.paper, C.ink, .8);
    rect(ctx, x + inset * 1.8, y - 25, w - inset * 3.6, 10, C.paper, C.ink, .8);
    poly(ctx, [[x + w * .5 - 9, y - 25], [x + w * .5, y - 50], [x + w * .5 + 9, y - 25]], C.gold, C.ink, .8);
    line(ctx, x + w * .5, y - 49, x + w * .5, y - 63, C.ink, .8);
    ellipse(ctx, x + w * .5, y - 63, 1.8, 1.8, C.gold, C.ink, .55);
    for (let i = 1; i < 5; i++) line(ctx, x + inset + i * (w - inset * 2) / 5, y - 13, x + inset + i * (w - inset * 2) / 5, y - 3, C.blue, .65);
  } else {
    railing(ctx, x - 1, y, w + 2, 0, 6);
    planter(ctx, x + 4, y - 1, w - 8, life, true);
  }
  podium(ctx, x - 7, base, w + 14, 13, d);
}

function dome(ctx, x, y, w, h, life = 1, small = false) {
  const cx = x + w / 2;
  podium(ctx, x - 9, y + 25, w + 18, 14, 17);
  rect(ctx, x, y, w, 27, C.paper, C.ink, .85);
  const n = Math.floor(w / (small ? 15 : 21));
  for (let i = 0; i < n; i++) {
    const aw = w / n * .62, ax = x + (i + .19) * w / n;
    arch(ctx, ax, y + 6, aw, 19, C.soft);
    line(ctx, ax + aw * .5, y + 10, ax + aw * .5, y + 25, C.paper, .7);
  }
  path(ctx, c => { c.moveTo(x, y); c.bezierCurveTo(x, y - h * .7, cx - w * .26, y - h, cx, y - h); c.bezierCurveTo(cx + w * .26, y - h, x + w, y - h * .7, x + w, y); c.closePath(); }, C.paper, C.ink, 1.1);
  withAlpha(ctx, .1 + life * .11, () => path(ctx, c => { c.moveTo(x, y); c.bezierCurveTo(x, y - h * .7, cx - w * .26, y - h, cx, y - h); c.bezierCurveTo(cx + w * .26, y - h, x + w, y - h * .7, x + w, y); c.closePath(); }, C.blue, null));
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x, y - h * .7, cx - w * .26, y - h, cx, y - h); ctx.bezierCurveTo(cx + w * .26, y - h, x + w, y - h * .7, x + w, y); ctx.closePath(); ctx.clip();
  pencilPatch(ctx, x, y - h, w, h, C.gold, .34);
  hatchRect(ctx, x + w * .76, y - h, w * .24, h, 5.7, C.blue);
  ctx.restore();
  // Curved glazing ribs converge on the lantern.
  for (let i = 1; i < 10; i++) {
    const fraction = i / 10, bx = x + w * fraction;
    path(ctx, c => { c.moveTo(cx, y - h); c.bezierCurveTo(cx + (fraction - .5) * w * .85, y - h * .96, bx, y - h * .56, bx, y); }, null, C.ink, i === 5 ? .9 : .55);
  }
  for (let j = 1; j < 5; j++) {
    const t = j / 5, yy = y - h * (1 - t), half = w * .5 * Math.sqrt(1 - (1 - t) ** 2);
    path(ctx, c => { c.moveTo(cx - half, yy); c.quadraticCurveTo(cx, yy + h * .17 * t, cx + half, yy); }, null, C.blue, .6);
  }
  line(ctx, x - 4, y, x + w + 4, y, C.ink, 1.4);
  line(ctx, x - 4, y + 3, x + w + 4, y + 3, C.gold, 1.15);
  if (!small) {
    rect(ctx, cx - 10, y - h - 13, 20, 13, C.paper, C.ink, .85);
    poly(ctx, [[cx - 13, y - h - 13], [cx, y - h - 23], [cx + 13, y - h - 13]], C.gold, C.ink, .8);
    line(ctx, cx, y - h - 23, cx, y - h - 36, C.ink, .7);
    ellipse(ctx, cx, y - h - 36, 2, 2, C.gold, C.ink, .6);
    line(ctx, cx - 5, y - h - 11, cx - 5, y - h - 2, C.blue, .7);
    line(ctx, cx + 5, y - h - 11, cx + 5, y - h - 2, C.blue, .7);
  }
  if (life > .08) {
    for (let i = 0; i < 5; i++) tree(ctx, x + 15 + i * (w - 30) / 4, y - 1, small ? .21 : .33, i % 2, life);
  }
}

function skybridge(ctx, x1, y1, x2, y2, life) {
  const w = x2 - x1, slope = y2 - y1;
  poly(ctx, [[x1, y1], [x2, y2], [x2, y2 + 9], [x1, y1 + 9]], C.paper, C.ink, .85);
  line(ctx, x1, y1 + 5, x2, y2 + 5, C.blue, .6);
  railing(ctx, x1, y1, w, slope, 9);
  for (let i = 9; i < w - 5; i += 15) line(ctx, x1 + i, y1 + (i / w) * slope + 8, x1 + i + 8, y1 + ((i + 8) / w) * slope, C.blue, .5);
  if (life > .2) for (let i = 16; i < w - 10; i += 32) tree(ctx, x1 + i, y1 + (i / w) * slope, .24, 0, life);
}

function civicTower(ctx, x, base, life) {
  // A public library with generous, habitable setbacks.
  tower(ctx, x, base, 83, 221, life, 1);
  const y = base - 221;
  rect(ctx, x + 27, y + 35, 29, 57, C.paper, C.ink, 1);
  arch(ctx, x + 32, y + 40, 19, 45, C.blue);
  line(ctx, x + 41.5, y + 42, x + 41.5, y + 84, C.paper, .75);
  line(ctx, x + 33, y + 64, x + 50, y + 64, C.paper, .75);
  ellipse(ctx, x + 41.5, y + 18, 8, 8, C.paper, C.ink, .8);
  ellipse(ctx, x + 41.5, y + 18, 5.8, 5.8, null, C.gold, .7);
  line(ctx, x + 41.5, y + 18, x + 41.5, y + 13, C.ink, .7);
  line(ctx, x + 41.5, y + 18, x + 45, y + 20, C.ink, .7);
  for (let i = 0; i < 4; i++) rect(ctx, x - 10 + i * 3, base - 21 + i * 5, 103 - i * 6, 5, C.paper, C.ink, .6);
}

function lowHall(ctx, x, y, w, life) {
  podium(ctx, x - 7, y + 44, w + 14, 13, 14);
  rect(ctx, x, y, w, 44, C.paper, C.ink, .9);
  pencilPatch(ctx, x + 2, y + 2, w - 4, 41, C.blue, .24);
  for (let i = 8; i < w - 14; i += 20) arch(ctx, x + i, y + 10, 12, 31, C.soft);
  rect(ctx, x - 5, y - 5, w + 10, 6, C.paper, C.ink, .8);
  railing(ctx, x, y - 5, w, 0, 6);
  planter(ctx, x + 6, y - 6, w - 12, life);
}

function atmosphere(ctx, p) {
  withAlpha(ctx, .12 + p * .18, () => {
    ctx.save(); ctx.translate(526, 341); ctx.rotate(-.14);
    ellipse(ctx, 0, 0, 365, 227, null, C.gold, 1.05);
    ellipse(ctx, -3, 2, 362, 231, null, C.blue, .65);
    // Unfinished pencil arcs, as if the circle was drawn around a coffee mug.
    path(ctx, c => { c.ellipse(3, -2, 374, 235, .004, 3.3, 5.6); }, null, C.blue, .55);
    ctx.restore();
  });
  withAlpha(ctx, .36, () => {
    ellipse(ctx, 746, 191, 32, 31, null, C.gold, 1.15);
    for (let i = 0; i < 13; i++) {
      const a = i / 13 * TAU, r = 41 + Math.sin(i * 8) * 2;
      line(ctx, 746 + Math.cos(a) * r, 191 + Math.sin(a) * r, 746 + Math.cos(a) * (r + 9), 191 + Math.sin(a) * (r + 9), C.gold, 1.05);
    }
    for (let j = 0; j < 9; j++) line(ctx, 728 + j * 3.7, 171 + Math.abs(j - 4) * 2, 716 + j * 3.7, 211 - Math.abs(j - 4) * 2, C.gold, .55);
  });
  withAlpha(ctx, .24, () => {
    for (const s of STARS) { if (s.y > 180 && s.x < 700) continue; line(ctx, s.x - s.r, s.y, s.x + s.r, s.y, C.blue, .5); line(ctx, s.x, s.y - s.r, s.x, s.y + s.r, C.blue, .5); }
    // Long, nearly invisible cloud contours, rather than a sky wash.
    path(ctx, c => { c.moveTo(132, 257); c.bezierCurveTo(186, 253, 196, 263, 248, 257); c.bezierCurveTo(274, 251, 294, 252, 329, 252); }, null, C.blue, .65);
    path(ctx, c => { c.moveTo(719, 313); c.bezierCurveTo(770, 304, 807, 312, 887, 306); }, null, C.blue, .65);
    line(ctx, 184, 267, 263, 267, C.blue, .45); line(ctx, 759, 319, 909, 319, C.blue, .45);
  });
  withAlpha(ctx, phase(p, .2, .7) * .55, () => {
    for (const [x, y, s] of [[211, 279, 1], [228, 288, .7], [831, 278, .9], [853, 267, .7], [817, 260, .5]]) {
      path(ctx, c => { c.moveTo(x - 5 * s, y); c.quadraticCurveTo(x - 2 * s, y - 4 * s, x, y); c.quadraticCurveTo(x + 2 * s, y - 4 * s, x + 5 * s, y); }, null, C.ink, .65);
    }
  });
}

function island(ctx, life) {
  // Canal and promenade are drawn as long continuous contours.
  withAlpha(ctx, .15 + life * .5, () => {
    path(ctx, c => { c.moveTo(115, 610); c.bezierCurveTo(237, 585, 346, 604, 438, 641); c.bezierCurveTo(536, 681, 685, 679, 877, 613); c.bezierCurveTo(841, 662, 697, 709, 531, 705); c.bezierCurveTo(338, 702, 172, 643, 115, 610); c.closePath(); }, C.soft, null);
  });
  for (let j = 0; j < 7; j++) {
    const dy = j * 5;
    path(ctx, c => { c.moveTo(116 + j * 8, 620 + dy); c.bezierCurveTo(270, 658 + dy, 415, 708 + dy * .5, 586, 702 + dy * .35); c.bezierCurveTo(712, 696 + dy * .2, 805, 660 + dy, 879 - j * 5, 630 + dy); }, null, C.blue, j === 0 ? .85 : .35);
  }
  path(ctx, c => { c.moveTo(128, 592); c.bezierCurveTo(172, 548, 320, 533, 481, 544); c.bezierCurveTo(647, 534, 832, 553, 888, 596); c.lineTo(883, 616); c.bezierCurveTo(755, 674, 588, 680, 454, 656); c.bezierCurveTo(325, 632, 228, 615, 128, 609); c.closePath(); }, C.paper, C.ink, 1.05);
  path(ctx, c => { c.moveTo(128, 592); c.bezierCurveTo(254, 608, 332, 627, 454, 649); c.bezierCurveTo(590, 673, 757, 667, 888, 596); }, null, C.ink, .9);
  path(ctx, c => { c.moveTo(137, 588); c.bezierCurveTo(262, 603, 338, 620, 457, 642); c.bezierCurveTo(593, 666, 746, 657, 874, 597); }, null, C.blue, .6);
  for (let i = 0; i < 42; i++) {
    const t = i / 41, x = 164 + t * 683;
    const yy = 600 + Math.sin(t * Math.PI) * 61 - t * 3;
    line(ctx, x, yy, x, yy + 5, C.blue, .45);
  }
  // These pencil marks belong to the paper, not to a looping water effect.
  withAlpha(ctx, life * .7, () => {
    for (let i = 0; i < 22; i++) {
      const x = 221 + ((i * 83) % 567), y = 666 + Math.sin(i * 2.3) * 22;
      line(ctx, x, y, x + 10 + (i % 4) * 8, y, C.blue, .6);
    }
  });
  // Broad accessible steps to the waterside; the right flank is a ramp.
  for (let j = 0; j < 6; j++) poly(ctx, [[574 - j * 4, 647 + j * 4], [630 + j * 3, 647 + j * 4], [633 + j * 3, 651 + j * 4], [570 - j * 4, 651 + j * 4]], C.paper, C.ink, .6);
  path(ctx, c => { c.moveTo(787, 630); c.bezierCurveTo(812, 631, 825, 643, 823, 654); }, null, C.ink, .8);
  path(ctx, c => { c.moveTo(801, 625); c.bezierCurveTo(832, 627, 843, 646, 837, 653); }, null, C.ink, .8);
}

function person(ctx, x, y, s, gold = false) {
  ellipse(ctx, x, y - 7.5 * s, 1.35 * s, 1.35 * s, C.ink, null);
  line(ctx, x, y - 5.8 * s, x - .5 * s, y - 2.5 * s, gold ? C.gold : C.ink, 2 * s);
  line(ctx, x - .5 * s, y - 2.8 * s, x - 1.8 * s, y, C.ink, .8 * s);
  line(ctx, x - .5 * s, y - 2.8 * s, x + 1 * s, y, C.ink, .8 * s);
  line(ctx, x, y - 4.8 * s, x + 2 * s, y - 3.2 * s, C.ink, .7 * s);
}

function foreground(ctx, life) {
  // A low circular reading garden gives the architecture a human scale.
  ellipse(ctx, 402, 596, 68, 18, C.paper, C.ink, .8);
  ellipse(ctx, 402, 593, 65, 15, C.paper, C.blue, .6);
  ellipse(ctx, 402, 592, 48, 10, null, C.gold, .75);
  ellipse(ctx, 402, 592, 22, 5, C.soft, C.ink, .55);
  tree(ctx, 402, 589, .96, 0, life);
  for (const [x, y] of [[355, 590], [435, 599], [450, 586]]) {
    line(ctx, x, y, x + 13, y + 2, C.ink, 1.6);
    line(ctx, x + 2, y + 1, x + 2, y + 4, C.ink, .8); line(ctx, x + 11, y + 2, x + 11, y + 5, C.ink, .8);
  }
  for (const t of GARDENS) {
    if (t.x > 330 && t.x < 475) continue;
    tree(ctx, t.x, t.y, t.s, t.kind, life);
  }
  // Community orchard beds, scored paths, and four unfurled parasols.
  for (let j = 0; j < 4; j++) {
    const x = 647 + j * 35, y = 602 - j * 4;
    poly(ctx, [[x, y], [x + 20, y - 5], [x + 29, y], [x + 8, y + 5]], C.soft, C.ink, .55);
    for (let k = 0; k < 4; k++) line(ctx, x + 4 + k * 4, y, x + 9 + k * 4, y - 2, C.green, 1.4);
  }
  for (const [x, y] of [[199, 590], [247, 600], [521, 592], [822, 585]]) {
    line(ctx, x, y, x, y - 14, C.ink, .65);
    path(ctx, c => { c.moveTo(x - 10, y - 12); c.quadraticCurveTo(x, y - 28, x + 10, y - 12); c.quadraticCurveTo(x, y - 8, x - 10, y - 12); }, C.paper, C.ink, .7);
    line(ctx, x, y - 21, x, y - 11, C.gold, .75);
    ellipse(ctx, x, y - 1, 6, 2, null, C.blue, .45);
  }
  withAlpha(ctx, phase(life, .3, .95), () => {
    for (const human of PEOPLE) {
      if (human.x > 343 && human.x < 465 && human.y < 600) continue;
      person(ctx, human.x, human.y, human.s, human.gold);
    }
    // A cyclist and an adult with a child.
    ellipse(ctx, 534, 624, 3.4, 3.4, null, C.ink, .65); ellipse(ctx, 546, 624, 3.4, 3.4, null, C.ink, .65);
    poly(ctx, [[534, 624], [539, 618], [542, 624], [534, 624], [545, 618], [546, 624]], null, C.ink, .65);
    person(ctx, 540, 619, .8); person(ctx, 281, 617, 1); person(ctx, 286, 618, .65);
    line(ctx, 283, 614, 285, 614, C.ink, .65);
  });
}

function buildings(ctx, progress, detail = true) {
  const life = phase(progress, .24, .95);
  // The first layer is deliberately light: there is no hard skyline wall.
  withAlpha(ctx, .27 + progress * .12, () => {
    for (const b of FAR_CITY) {
      rect(ctx, b.x, b.y - b.h, b.w, b.h, C.paper, C.blue, .65);
      for (let xx = b.x + 4; xx < b.x + b.w - 2; xx += 5) line(ctx, xx, b.y - b.h + 7, xx, b.y - 4, C.blue, .4);
      if (b.crown) poly(ctx, [[b.x - 2, b.y - b.h], [b.x + b.w / 2, b.y - b.h - 11], [b.x + b.w + 2, b.y - b.h]], C.paper, C.blue, .6);
    }
  });
  // Rear neighborhood: roof allotments, a school, and the eastern greenhouse.
  tower(ctx, 676, 495, 49, 142, life, 0);
  tower(ctx, 764, 517, 42, 117, life, 0);
  tower(ctx, 219, 515, 46, 149, life, 0);
  skybridge(ctx, 253, 399, 330, 383, life);
  skybridge(ctx, 646, 411, 698, 420, life);
  tower(ctx, 303, 485, 56, 193, life, 1);
  civicTower(ctx, 548, 490, life);
  dome(ctx, 696, 493, 112, 70, life, true);
  skybridge(ctx, 354, 421, 555, 427, life);
  // Main conservatory and its public wings.
  lowHall(ctx, 190, 493, 99, life);
  lowHall(ctx, 508, 505, 156, life);
  dome(ctx, 280, 491, 226, 119, life, false);
  // Terraced western residence, framed by a tall orchard tree.
  tower(ctx, 137, 546, 56, 96, life, 0);
  lowHall(ctx, 679, 536, 122, life);
  tower(ctx, 821, 553, 37, 84, life, 0);
  lowHall(ctx, 249, 550, 81, life);
  lowHall(ctx, 507, 551, 93, life);
  if (detail) {
    hatchRect(ctx, 552, 501, 66, 4, 4, C.blue);
    // Fine contours carry the sectioned terrace down toward the canal.
    for (let j = 0; j < 3; j++) path(ctx, c => { c.moveTo(192 + j * 3, 559 + j * 5); c.bezierCurveTo(345, 550 + j * 5, 394, 562 + j * 5, 503, 570 + j * 5); }, null, C.blue, .5);
    for (let j = 0; j < 4; j++) line(ctx, 665 + j * 4, 561 + j * 5, 809 - j * 4, 561 + j * 5, C.blue, .55);
  }
}

function marginNotes(ctx, progress) {
  withAlpha(ctx, .2 + phase(progress, .2, .8) * .45, () => {
    ctx.save(); ctx.translate(727, 305); ctx.rotate(.045);
    ctx.font = '14px "Segoe Print", "Comic Sans MS", cursive'; ctx.fillStyle = C.ink;
    ctx.fillText('gardens up here, too', 0, 0); ctx.restore();
    path(ctx, c => { c.moveTo(747, 313); c.bezierCurveTo(727, 313, 714, 322, 713, 339); }, null, C.ink, .75);
    line(ctx, 713, 339, 709, 333, C.ink, .75); line(ctx, 713, 339, 718, 334, C.ink, .75);
    ctx.save(); ctx.translate(414, 746); ctx.rotate(-.025);
    ctx.font = '14px "Segoe Print", "Comic Sans MS", cursive'; ctx.fillStyle = C.ink;
    ctx.fillText('a little room to grow.', 0, 0);
    line(ctx, 2, 5, 155, 3, C.gold, .9); ctx.restore();
  });
}

function canalBoat(ctx, cel) {
  ctx.save(); ctx.translate(cel.x, cel.y); ctx.rotate(cel.angle);
  // Short, explicitly inked wakes stay attached to their own hull cel.
  for (const [x1, y1, cx, cy, x2, y2] of cel.wakes) {
    path(ctx, c => { c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2); }, null, C.blue, .85);
  }
  poly(ctx, [[-27, -4], [29, -4], [18, 4], [-16, 4]], C.paper, C.ink, 1.1);
  line(ctx, -22, 0, 23, 0, C.gold, 1.6);
  poly(ctx, [[-12, -15], [12, -15], [18, -4], [-17, -4]], C.paper, C.ink, .9);
  rect(ctx, -9, -12, 18, 5, C.soft, C.ink, .5);
  line(ctx, -3, -12, -3, -7, C.ink, .55);
  line(ctx, 4, -12, 4, -7, C.ink, .55);
  line(ctx, -13, -16, 13, -16, C.gold, 1.35);
  line(ctx, 21, -6, 21, -11, C.ink, .75);
  ellipse(ctx, 21, -12, 1.3, 1.3, C.gold, C.ink, .55);
  line(ctx, -12, 7, 15, 7, C.blue, .6);
  ctx.restore();
}

/** Draw the main city plate in 1000 × 800 logical coordinates.
 * The caller owns the canvas size, transform and clear. p selects one of eight cels.
 */
export function drawWorld(ctx, p, options = {}) {
  const frame = options.reducedMotion ? 7 : Number.isFinite(options.frame)
    ? Math.round(clamp(options.frame, 0, 7))
    : Math.round((Number.isFinite(p) ? clamp(p) : 0) * 7);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.translate(500, 410); ctx.rotate(-.009); ctx.translate(-500, -410);
  // The complete city is legible in cel one. Only the canal boat changes pose.
  atmosphere(ctx, 1);
  island(ctx, 1);
  buildings(ctx, 1);
  foreground(ctx, 1);
  canalBoat(ctx, BOAT_CELS[frame]);
  marginNotes(ctx, 1);
  ctx.restore();
}

/** A self-contained city vignette scaled to fit inside a painting or inset. */
export function drawCityMini(ctx, x, y, w, h, p = 1) {
  if (!(w > 0 && h > 0)) return;
  const progress = Number.isFinite(p) ? clamp(p) : 1;
  const scale = Math.min(w / 820, h / 540);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x + (w - 820 * scale) / 2, y + (h - 540 * scale) / 2);
  ctx.scale(scale, scale); ctx.translate(-100, -185);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  withAlpha(ctx, .17, () => ellipse(ctx, 520, 418, 338, 194, null, C.blue, .75));
  island(ctx, phase(progress, .35, .96));
  buildings(ctx, progress, false);
  foreground(ctx, phase(progress, .35, .96));
  ctx.restore();
}
