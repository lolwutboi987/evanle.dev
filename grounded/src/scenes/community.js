import { drawHouse } from './painting.js';

// Community notebook drawings. All coordinates use the chapter's 1000 × 800 viewBox.
const C = {
  ink: '#493629', paper: '#f4e8cf', blue: '#b09b7a', gold: '#b88746',
  soft: '#d6c5a5', green: '#88815d', red: '#ad6952',
};
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
const cel = (p, options) => options.reducedMotion ? 7
  : Number.isFinite(options.frame) ? Math.round(clamp(options.frame, 0, 7))
    : Math.min(7, Math.floor(clamp(p) * 8));

// These are drawings, not interpolated transforms. Feet, chairs and the room
// stay registered while one gesture passes from maker to listener.
const MAYA_ARMS = [
  [[20, -140], [31, -116], [21, -98]],
  [[20, -140], [33, -116], [32, -99]],
  [[20, -140], [37, -119], [47, -105]],
  [[20, -140], [37, -122], [60, -119]],
  [[20, -140], [34, -122], [65, -129]],
  [[20, -140], [34, -122], [65, -129]],
  [[20, -140], [34, -122], [65, -129]],
  [[20, -140], [34, -122], [65, -129]],
];
const LISTENER_ARMS = [
  [[20, -140], [31, -116], [21, -98]],
  [[20, -140], [31, -116], [21, -98]],
  [[20, -140], [31, -116], [21, -98]],
  [[20, -140], [31, -116], [21, -98]],
  [[20, -140], [31, -116], [21, -98]],
  [[20, -140], [32, -119], [33, -111]],
  [[20, -140], [34, -124], [48, -120]],
  [[20, -140], [37, -127], [57, -133]],
];
const INSPECTION_POSES = [
  { grip: [18, -91], elbow: [-25, -111], angle: -.18, hand: [34, -92], reach: [34, -113] },
  { grip: [20, -99], elbow: [-24, -113], angle: -.1, hand: [42, -102], reach: [36, -117] },
  { grip: [21, -106], elbow: [-23, -115], angle: -.04, hand: [48, -113], reach: [38, -122] },
  { grip: [21, -110], elbow: [-22, -116], angle: 0, hand: [51, -117], reach: [40, -124] },
  { grip: [21, -110], elbow: [-22, -116], angle: 0, hand: [50, -96], reach: [39, -117] },
  { grip: [21, -110], elbow: [-22, -116], angle: 0, hand: [55, -103], reach: [39, -117] },
  { grip: [21, -110], elbow: [-22, -116], angle: 0, hand: [49, -106], reach: [39, -118] },
  { grip: [21, -110], elbow: [-22, -116], angle: 0, hand: [53, -114], reach: [41, -122] },
];

// Coordinate-based pencil pressure: the same line always has the same wobble.
// No frame counters or randomness, so these sketches remain still as you read.
function pencilTrace(ctx, points, close, offset = 0) {
  ctx.beginPath();
  ctx.moveTo(points[0][0] + offset, points[0][1] - offset * .6);
  const segments = points.length - 1 + Number(close);
  for (let i = 0; i < segments; i++) {
    const a = points[i % points.length], b = points[(i + 1) % points.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const length = Math.hypot(dx, dy) || 1;
    const bend = Math.min(2.8, length * .024) * Math.sin(i * 3.17 + a[0] * .013 + a[1] * .021 + .7);
    const nx = -dy / length, ny = dx / length;
    ctx.bezierCurveTo(
      a[0] + dx * .3 + nx * bend + offset,
      a[1] + dy * .3 + ny * bend - offset * .5,
      a[0] + dx * .72 - nx * bend * .8 + offset * .5,
      a[1] + dy * .72 - ny * bend * .8 + offset,
      b[0] + offset * .35, b[1] - offset * .3,
    );
  }
  if (close) ctx.closePath();
}

function path(ctx, points, { fill, stroke = C.ink, width = 1, close = false, alpha = 1 } = {}) {
  if (!points.length) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  pencilTrace(ctx, points, close);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width * (.94 + Math.sin(points[0][0] * .019 + points[0][1] * .033) * .12);
    ctx.stroke();
    // An imperfect second pass reads as pencil rather than a vector outline.
    if (width >= .85 && width < 5 && stroke !== C.paper) {
      ctx.globalAlpha *= .27;
      ctx.lineWidth = Math.max(.48, width * .58);
      pencilTrace(ctx, points, close, 1.25);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function line(ctx, x, y, x2, y2, color = C.ink, width = 1, alpha = 1) {
  path(ctx, [[x, y], [x2, y2]], { stroke: color, width, alpha });
}
function ellipse(ctx, x, y, rx, ry, fill, stroke = C.ink, width = 1, rotation = 0) {
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke();
    if (rx > 4) {
      ctx.globalAlpha *= .35; ctx.lineWidth = Math.max(.5, width * .6);
      ctx.beginPath();
      ctx.ellipse(x + .8, y - .6, rx * 1.045, ry * .96, rotation + .025, -.18, Math.PI * 1.8);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function bezier(ctx, pts, color = C.ink, width = 1, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.bezierCurveTo(...pts.slice(2)); ctx.stroke();
  if (width >= .8 && color !== C.paper) {
    ctx.globalAlpha *= .25; ctx.lineWidth = Math.max(.45, width * .5);
    ctx.beginPath(); ctx.moveTo(pts[0] + .6, pts[1] - 1);
    ctx.bezierCurveTo(pts[2] - 1.2, pts[3] + 2, pts[4] + 1.4, pts[5] - 1, pts[6] + 1, pts[7] + .5);
    ctx.stroke();
  }
  ctx.restore();
}
function hatch(ctx, x, y, w, h, spacing = 7, color = C.ink, alpha = 0.25) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = color; ctx.lineWidth = .68; ctx.globalAlpha *= alpha;
  // Uneven, slightly curved strokes retain the warmth of a shaded notebook.
  for (let i = -h, n = 0; i < w; i += spacing * (1 + Math.sin(n++ * 2.6) * .16)) {
    const shift = Math.sin(n * 1.8) * 1.5;
    ctx.beginPath(); ctx.moveTo(x + i + shift, y + h + 2);
    ctx.bezierCurveTo(x + i + h * .2 + 1, y + h * .7, x + i + h * .44 - 1, y + h * .35, x + i + h * .65, y - 2);
    ctx.stroke();
  }
  ctx.restore();
}
function polygonHatch(ctx, points, fill, spacing = 7, alpha = .22) {
  path(ctx, points, { fill, close: true, width: 1.1 });
  ctx.save(); ctx.beginPath(); ctx.moveTo(...points[0]);
  points.slice(1).forEach(pt => ctx.lineTo(...pt)); ctx.closePath(); ctx.clip();
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  hatch(ctx, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), spacing, C.ink, alpha);
  ctx.restore();
}
function layer(ctx, alpha, paint) { ctx.save(); ctx.globalAlpha *= clamp(alpha); paint(); ctx.restore(); }

function house(ctx, x, y, s, reverse = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(reverse ? -s : s, s);
  path(ctx, [[0, 0], [0, -76], [92, -76], [92, 0]], { fill: C.paper, close: true, width: 1.2 });
  polygonHatch(ctx, [[92, 0], [92, -76], [116, -98], [116, -15]], C.soft, 6, .25);
  path(ctx, [[-13, -74], [45, -119], [104, -74]], { fill: C.soft, close: true, width: 1.4 });
  polygonHatch(ctx, [[45, -119], [72, -137], [131, -96], [104, -74]], C.blue, 6, .25);
  line(ctx, 45, -110, 90, -77, C.paper, .8); line(ctx, 47, -102, 79, -78, C.paper, .8);
  path(ctx, [[63, -119], [63, -142], [73, -148], [81, -144], [81, -129]], { fill: C.paper, close: true });
  line(ctx, 73, -148, 73, -131);
  path(ctx, [[38, 0], [38, -43], [58, -43], [58, 0]], { fill: C.blue, close: true });
  line(ctx, 54, -25, 54, -22, C.paper, 1.5);
  [[13, -60], [68, -60]].forEach(([wx, wy]) => {
    path(ctx, [[wx, wy], [wx + 16, wy], [wx + 16, wy + 20], [wx, wy + 20]], { fill: C.blue, close: true });
    line(ctx, wx + 8, wy, wx + 8, wy + 20, C.paper); line(ctx, wx, wy + 9, wx + 16, wy + 9, C.paper);
  });
  for (let r = 0; r < 5; r++) line(ctx, 5, -31 + r * 7, 28, -31 + r * 7, C.ink, .55, .35);
  line(ctx, -7, 3, 99, 3, C.ink, .9); line(ctx, 5, 8, 86, 8, C.ink, .6, .3);
  ctx.restore();
}

function settlement(ctx, variant = 0) {
  layer(ctx, .58, () => {
    bezier(ctx, [67, 389, 261, 325, 595, 385, 942, 329], C.blue, 1);
    bezier(ctx, [113, 397, 330, 369, 569, 414, 920, 367], C.ink, .6, .35);
    house(ctx, 113, 359, .61);
    house(ctx, 342, 343, .48);
    house(ctx, 758, 356, .69);
    house(ctx, 910, 371, .48, true);
    line(ctx, 163, 272, 350, 293, C.ink, .65, .55);
    line(ctx, 350, 293, 723, 273, C.ink, .65, .55);
    line(ctx, 723, 273, 920, 310, C.ink, .65, .55);
    [350, 723].forEach(x => { line(ctx, x, 265, x, 370); line(ctx, x - 8, 278, x + 8, 278); });
    // A useful, unremarkable electric tractor beside the garden.
    ctx.save(); ctx.translate(699, 375); ctx.scale(.68, .68);
    ellipse(ctx, 0, 0, 19, 19, C.paper, C.ink, 1.4);
    ellipse(ctx, 0, 0, 11, 11, C.soft);
    ellipse(ctx, 66, 3, 12, 12, C.paper, C.ink, 1.4);
    ellipse(ctx, 66, 3, 5, 5, C.soft);
    path(ctx, [[-10, -23], [12, -27], [15, -44], [37, -43], [41, -24], [75, -22], [78, -9], [22, -6]], { fill: C.green, close: true });
    line(ctx, 24, -41, 24, -18); line(ctx, 58, -24, 58, -39); line(ctx, 55, -39, 61, -39);
    for (let k = 0; k < 5; k++) line(ctx, 47 + k * 5, -18, 47 + k * 5, -11, C.paper, .8);
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      bezier(ctx, [92 + i * 25, 423, 287, 397 + i * 10, 395, 405 + i * 11, 421 + i * 24, 439], C.ink, .7, .45);
    }
  });
  if (variant) layer(ctx, .3, () => { line(ctx, 586, 353, 586, 253); line(ctx, 558, 264, 614, 264); });
}

function leaf(ctx, x, y, scale, angle, color = C.green) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  path(ctx, [[0, 0], [-9, -7], [-11, -18], [-5, -20], [-1, -14], [4, -6]], { fill: color, stroke: C.ink, width: .8, close: true });
  line(ctx, 0, 1, -6, -15, C.paper, .85, .8);
  line(ctx, -2, -6, -8, -9, C.ink, .55, .45);
  line(ctx, -4, -10, 0, -12, C.ink, .55, .4);
  ctx.restore();
}
function garden(ctx, x, y, rows = 3) {
  for (let row = 0; row < rows; row++) {
    const yy = y + row * 25;
    path(ctx, [[x, yy], [x + 185, yy - 10], [x + 166, yy + 7], [x - 17, yy + 17]], { fill: C.soft, stroke: C.ink, width: .7, close: true, alpha: .6 });
    for (let col = 0; col < 8; col++) {
      const xx = x + col * 23 - row * 3;
      const gy = yy - col * 1.2;
      line(ctx, xx, gy + 5, xx, gy - 10, C.ink, .7);
      leaf(ctx, xx, gy, .63, -.6); leaf(ctx, xx, gy - 1, .64, 1.2);
      if ((row + col) % 3 === 0) ellipse(ctx, xx - 2, gy - 9, 3.5, 4, C.gold, C.ink, .6);
    }
  }
}

function canopy(ctx, amount = 1) {
  layer(ctx, amount, () => {
    // Twin trunks and a hand-built pergola make a spacious shared room.
    polygonHatch(ctx, [[807, 444], [815, 329], [825, 261], [842, 185], [852, 153], [863, 158], [852, 247], [840, 327], [843, 442]], C.soft, 7, .22);
    bezier(ctx, [831, 304, 807, 267, 797, 229, 745, 198], C.ink, 2);
    bezier(ctx, [843, 245, 873, 213, 885, 185, 899, 163], C.ink, 1.8);
    bezier(ctx, [820, 355, 825, 305, 845, 225, 851, 177], C.ink, .8, .6);
    path(ctx, [[72, 410], [76, 219], [111, 185], [268, 172], [425, 174]], { stroke: C.ink, width: 2 });
    line(ctx, 86, 410, 88, 225, C.ink, .8);
    path(ctx, [[79, 218], [428, 184], [707, 182], [830, 197]], { stroke: C.ink, width: 1.5 });
    path(ctx, [[94, 219], [122, 234], [385, 204], [713, 205], [817, 215]], { stroke: C.ink, width: .8, alpha: .55 });
    for (let i = 0; i < 12; i++) {
      const x = 104 + i * 60;
      line(ctx, x, 203 - Math.sin(i / 3) * 24, x + 29, 221 - Math.sin(i / 3) * 18, C.ink, .65, .6);
    }
    // Sparse etched foliage; deterministic clusters keep the silhouette open.
    for (let i = 0; i < 73; i++) {
      const t = i / 72, x = 99 + t * 811;
      const y = 177 - Math.sin(t * Math.PI) * 42 + Math.sin(i * 2.47) * 24;
      const s = .65 + (Math.sin(i * 3.7) + 1) * .3;
      leaf(ctx, x, y, s, Math.sin(i * 1.33) * 2.3, i % 5 === 0 ? C.gold : C.green);
      if (i % 3 === 0) bezier(ctx, [x - 6, y + 11, x + 12, y + 14, x + 14, y - 7, x + 20, y - 14], C.ink, .65, .5);
    }
  });
}

function ground(ctx) {
  layer(ctx, .42, () => {
    bezier(ctx, [77, 650, 342, 719, 694, 721, 930, 641], C.ink, .8);
    bezier(ctx, [98, 664, 345, 737, 781, 723, 919, 671], C.ink, .65);
    for (let i = 0; i < 42; i++) {
      const x = 84 + (i * 113) % 829;
      const y = 485 + (i * 47) % 219;
      line(ctx, x, y, x + 10 + (i % 6) * 4, y - 2, C.ink, .55, .6);
    }
  });
  // Tiny margin-doodle flowers grow out of the same pencil marks as the yard.
  layer(ctx, .65, () => {
    [[98, 563, .8], [858, 651, .9], [178, 684, .6], [899, 529, .7]].forEach(([x, y, s]) => {
      bezier(ctx, [x, y, x + 4 * s, y - 8 * s, x - 2 * s, y - 16 * s, x, y - 23 * s], C.ink, .8);
      for (let j = 0; j < 5; j++) {
        const a = j * Math.PI * .4;
        ellipse(ctx, x + Math.cos(a) * 4 * s, y - 24 * s + Math.sin(a) * 4 * s, 3 * s, 2 * s, C.paper, C.ink, .6, a);
      }
      ellipse(ctx, x, y - 24 * s, 2 * s, 2 * s, C.gold, null);
      line(ctx, x + s, y - 8 * s, x + 7 * s, y - 13 * s, C.green, 1.5);
    });
  });
}

function head(ctx, x, y, s, facing = 1, hair = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * facing * 1.045, s * 1.025);
  path(ctx, [[-11, -21], [1, -25], [11, -18], [12, -8], [17, -2], [12, 1], [11, 10], [4, 15], [-7, 11], [-12, 1]], { fill: C.paper, close: true, width: 1.1 });
  if (hair === 0) polygonHatch(ctx, [[-13, 3], [-15, -12], [-10, -25], [3, -29], [14, -20], [10, -14], [0, -17], [-5, -8], [-7, 7]], C.ink, 4, .2);
  if (hair === 1) {
    path(ctx, [[-13, 11], [-19, -9], [-13, -25], [2, -30], [13, -19], [10, -15], [-1, -15], [-6, -4], [-9, 10], [-5, 24], [-19, 29]], { fill: C.blue, close: true });
    line(ctx, -13, -14, -13, 15, C.paper, .7, .6);
  }
  if (hair === 2) {
    path(ctx, [[-14, -6], [-15, -18], [-9, -25], [1, -29], [11, -23], [14, -15], [3, -19], [-4, -13]], { fill: C.soft, close: true });
    line(ctx, -8, -24, -10, -13, C.ink, .7, .5);
    line(ctx, 3, -25, 0, -18, C.ink, .7, .5);
  }
  line(ctx, 7, -6, 10, -6, C.ink, 1.1); line(ctx, 8, 5, 12, 5, C.ink, .6);
  bezier(ctx, [-7, -4, 0, -7, 1, 5, -6, 5], C.ink, .6);
  line(ctx, 4, 1, 8, 0, C.red, 2.2, .26);
  line(ctx, 2, 3, 5, 2, C.red, .7, .4);
  // A few stray hairs and an unfinished contour soften the profile.
  bezier(ctx, [-12, -22, -18, -28, -17, -31, -14, -33], C.ink, .7, .6);
  bezier(ctx, [-9, -24, -8, -34, -2, -32, -1, -29], C.ink, .6, .55);
  ctx.restore();
}

function arm(ctx, points, color, width = 14) {
  path(ctx, points, { stroke: C.ink, width: width + 1.6 });
  path(ctx, points, { stroke: color, width });
  const a = points[points.length - 2], b = points[points.length - 1];
  const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy) || 1;
  line(ctx, b[0] - dx / length * 7, b[1] - dy / length * 7, b[0] + dx / length * 7, b[1] + dy / length * 7, C.ink, 8.8);
  line(ctx, b[0] - dx / length * 7, b[1] - dy / length * 7, b[0] + dx / length * 7, b[1] + dy / length * 7, C.paper, 7);
}

function openPalm(ctx, wrist, angle) {
  ctx.save(); ctx.translate(...wrist); ctx.rotate(angle);
  path(ctx, [[-4, 3], [3, 3], [10, 0], [13, -4], [11, -6], [7, -2], [2, -2], [3, -7], [0, -8], [-3, -3]], { fill: C.paper, close: true, width: .7 });
  line(ctx, 6, 0, 11, -3, C.ink, .55);
  line(ctx, 4, 1, 9, -1, C.ink, .5);
  ctx.restore();
}

function clipboard(ctx, pose, frame) {
  ctx.save(); ctx.translate(...pose.grip); ctx.rotate(pose.angle);
  path(ctx, [[0, -5], [31, -5], [31, 38], [0, 38]], { fill: C.blue, close: true, width: 1.1 });
  path(ctx, [[4, 1], [27, 1], [27, 33], [4, 33]], { fill: C.paper, close: true, width: .7 });
  for (let i = 0; i < 5; i++) line(ctx, 7, 7 + i * 4, 23, 7 + i * 4, C.ink, .5, .7);
  ellipse(ctx, 15, 0, 4, 2, C.gold, C.ink, .7);
  if (frame >= 4) line(ctx, 18, 22, 21, 25, C.red, .9);
  if (frame >= 5) line(ctx, 21, 25, 26, 18, C.red, .9);
  // The fingers overlap the edge at the wrist that anchors the whole board.
  path(ctx, [[-4, 1], [2, 2], [4, -1], [1, -3], [-3, -3]], { fill: C.paper, close: true, width: .65 });
  ctx.restore();
}

function standing(ctx, x, foot, s, { facing = 1, color = C.blue, hair = 0, pose = 'rest', skirt = false, bag = false, gesture = null } = {}) {
  ctx.save(); ctx.translate(x, foot); ctx.scale(s * facing, s);
  ellipse(ctx, 5, 4, 32, 4, C.soft, null);
  if (skirt) {
    polygonHatch(ctx, [[-20, -90], [18, -89], [34, -30], [-32, -28]], color, 7, .23);
    path(ctx, [[-18, -29], [-16, -4], [-27, 0], [-27, 4], [-9, 4], [-5, -29]], { fill: C.paper, close: true });
    path(ctx, [[9, -29], [13, -4], [9, 2], [11, 5], [29, 5], [21, -4], [21, -29]], { fill: C.paper, close: true });
  } else {
    polygonHatch(ctx, [[-20, -91], [1, -88], [0, -44], [-8, -4], [-25, -4], [-23, -45]], C.ink, 7, .2);
    polygonHatch(ctx, [[1, -89], [22, -89], [24, -45], [34, -5], [16, -4], [2, -41]], C.blue, 6, .3);
    path(ctx, [[-25, -7], [-9, -6], [-8, 3], [-34, 3], [-34, -1]], { fill: C.ink, close: true });
    path(ctx, [[16, -7], [32, -7], [44, -1], [44, 4], [15, 4]], { fill: C.ink, close: true });
  }
  path(ctx, [[-20, -150], [-8, -157], [9, -156], [23, -147], [23, -110], [27, -85], [-23, -86], [-20, -122]], { fill: color, close: true, width: 1.3 });
  hatch(ctx, -17, -142, 9, 51, 5, C.ink, .25);
  line(ctx, -2, -151, 2, -125, C.ink, .7); line(ctx, 2, -125, 4, -88, C.ink, .65, .6);
  line(ctx, -16, -102, -4, -106, C.ink, .7); line(ctx, 10, -117, 20, -114, C.ink, .7);
  path(ctx, [[-7, -155], [-6, -169], [5, -169], [8, -156], [0, -149]], { fill: C.paper, close: true });
  head(ctx, 1, -179, 1, 1, hair);
  if (gesture) {
    arm(ctx, gesture.far || [[-18, -141], [-28, -112], [-26, -86]], color, 13);
    if (gesture.inspection) clipboard(ctx, gesture.inspection, gesture.frame);
    arm(ctx, gesture.near, color, 13);
    if (gesture.palm !== undefined) openPalm(ctx, gesture.near[2], gesture.palm);
    if (gesture.inspection) {
      const [hx, hy] = gesture.near[2];
      line(ctx, hx + 4, hy - 8, hx - 8, hy + 11, C.ink, 1.2);
      line(ctx, hx + 3, hy - 7, hx - 5, hy + 6, C.gold, .65);
    }
  } else if (pose === 'open') {
    arm(ctx, [[-18, -143], [-34, -110], [-54, -126]], color, 13);
    arm(ctx, [[20, -140], [34, -116], [65, -129]], color, 13);
    line(ctx, 60, -132, 69, -137, C.ink, .65);
  } else if (pose === 'point') {
    arm(ctx, [[-17, -141], [-28, -114], [-5, -105]], color, 13);
    arm(ctx, [[19, -141], [37, -116], [65, -135]], color, 13);
    line(ctx, 64, -136, 79, -144, C.ink, 1);
  } else if (pose === 'folded') {
    arm(ctx, [[-17, -141], [-25, -110], [20, -116]], color, 13);
    arm(ctx, [[20, -141], [30, -115], [-12, -117]], color, 13);
  } else if (pose === 'carry') {
    arm(ctx, [[-18, -140], [-24, -106], [-17, -86]], color, 13);
    arm(ctx, [[18, -141], [29, -110], [22, -90]], color, 13);
    path(ctx, [[-20, -94], [25, -96], [26, -57], [-19, -54]], { fill: C.paper, close: true });
    path(ctx, [[-14, -87], [18, -88], [19, -63], [-13, -61]], { stroke: C.gold, close: true });
    bezier(ctx, [-9, -67, -4, -84, 8, -68, 14, -77], C.blue, 1.8);
  } else {
    arm(ctx, [[-18, -141], [-28, -112], [-26, -86]], color, 13);
    arm(ctx, [[20, -140], [31, -116], [21, -98]], color, 13);
  }
  if (bag) {
    line(ctx, -15, -150, 22, -85, C.gold, 2);
    polygonHatch(ctx, [[13, -96], [35, -94], [38, -64], [13, -67]], C.gold, 5, .2);
  }
  ctx.restore();
}

function seated(ctx, x, y, s, { color = C.green, facing = 1, hair = 2, drawing = false } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * facing, s);
  line(ctx, -26, -31, -32, 10, C.ink, 2); line(ctx, 21, -31, 29, 10, C.ink, 2);
  path(ctx, [[-35, -35], [28, -35], [32, -29], [-32, -29]], { fill: C.gold, close: true });
  polygonHatch(ctx, [[-21, -45], [17, -49], [39, -36], [41, 4], [25, 4], [22, -24], [-10, -23]], C.blue, 7, .3);
  path(ctx, [[24, 1], [39, 1], [53, 8], [52, 13], [25, 11]], { fill: C.ink, close: true });
  path(ctx, [[-19, -104], [-7, -111], [11, -105], [17, -76], [21, -44], [-23, -41], [-26, -74]], { fill: color, close: true });
  hatch(ctx, -23, -97, 10, 46, 5, C.ink, .25);
  path(ctx, [[-7, -109], [-8, -123], [2, -126], [8, -109]], { fill: C.paper, close: true });
  head(ctx, -2, -137, .95, 1, hair);
  arm(ctx, [[-20, -95], [-29, -67], [drawing ? 31 : 9, drawing ? -72 : -54]], color, 12);
  arm(ctx, [[12, -98], [26, -74], [drawing ? 55 : 29, drawing ? -92 : -60]], color, 12);
  if (drawing) line(ctx, 48, -98, 66, -82, C.ink, 1.2);
  ctx.restore();
}

function painting(ctx, x, y, s = 1, visibility = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  path(ctx, [[-45, 243], [-9, 55], [-5, -12], [3, -12], [8, 56], [53, 243]], { stroke: C.ink, width: 3 });
  line(ctx, 28, 131, 79, 237, C.ink, 2);
  path(ctx, [[-68, 19], [70, 10], [77, 178], [-64, 187]], { fill: C.gold, close: true, width: 1.5 });
  path(ctx, [[-60, 27], [62, 20], [68, 169], [-57, 177]], { fill: C.paper, close: true, width: .9 });
  layer(ctx, visibility, () => {
    ctx.save(); ctx.beginPath(); ctx.moveTo(-60, 27); ctx.lineTo(62, 20); ctx.lineTo(68, 169); ctx.lineTo(-57, 177); ctx.closePath(); ctx.clip();
    // Maya's identical house, willow, and empty threshold recur in both scenes.
    // Keep its landscape proportions inside the taller, gently tilted mount.
    ctx.transform(1, -7 / 122, 3 / 150, 1, -60, 27);
    drawHouse(ctx, 0, 34, 122, 76.25, { warm: false, progress: 1 });
    ctx.restore();
  });
  line(ctx, -76, 187, 87, 176, C.ink, 4);
  line(ctx, -75, 185, 87, 174, C.gold, 2.5);
  ctx.restore();
}

function worktable(ctx, x, y, width = 155, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  path(ctx, [[0, 0], [width, -13], [width + 36, 9], [29, 25]], { fill: C.paper, close: true, width: 1.2 });
  path(ctx, [[29, 25], [width + 36, 9], [width + 36, 16], [29, 32]], { fill: C.gold, close: true });
  line(ctx, 34, 31, 38, 96, C.ink, 3); line(ctx, width + 26, 18, width + 20, 84, C.ink, 3);
  line(ctx, 8, 10, 4, 73, C.ink, 2); line(ctx, 5, 65, width + 21, 69, C.ink, 1.5);
  ctx.restore();
}
function supplies(ctx, px, py, scale = 1) {
  ctx.save(); ctx.translate(px, py); ctx.scale(scale, scale);
  const x = 0, y = 0;
  ellipse(ctx, x, y, 20, 10, C.gold, C.ink, .9, -.1);
  ellipse(ctx, x + 8, y - 2, 5, 3, C.paper, C.ink, .7);
  [[-10, -2, C.blue], [-3, 4, C.red], [4, 5, C.green]].forEach(([dx, dy, color]) => ellipse(ctx, x + dx, y + dy, 3, 2, color, null));
  path(ctx, [[x + 39, y - 19], [x + 56, y - 20], [x + 55, y + 3], [x + 41, y + 4]], { fill: C.soft, close: true });
  for (let i = 0; i < 4; i++) line(ctx, x + 44 + i * 3, y - 9, x + 38 + i * 6, y - 39 + i * 3, C.ink, 1.3);
  line(ctx, x + 77, y + 2, x + 115, y - 7, C.ink, 2); line(ctx, x + 78, y + 5, x + 109, y - 1, C.gold, 2);
  ctx.restore();
}
function mug(ctx, x, y) {
  ellipse(ctx, x + 1, y + 6, 11, 3, null, C.gold, .65);
  bezier(ctx, [x + 7, y - 9, x + 20, y - 16, x + 17, y + 5, x + 7, y], C.ink, 1.2);
  path(ctx, [[x - 8, y - 14], [x - 7, y + 1], [x - 3, y + 5], [x + 6, y + 4], [x + 9, y - 14]], { fill: C.paper, close: true, width: 1 });
  ellipse(ctx, x, y - 14, 8.5, 3.3, C.blue, C.ink, .8, -.04);
  bezier(ctx, [x - 2, y - 21, x - 9, y - 30, x + 7, y - 29, x + 1, y - 40], C.ink, .7, .33);
}

/** Maya offers the work; a listener answers after her hand has opened. */
export function drawWitness(ctx, p, options = {}) {
  const frame = cel(p, options);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ground(ctx);
  settlement(ctx);
  canopy(ctx);
  garden(ctx, 114, 451, 3); garden(ctx, 762, 428, 2);
  // Far edge of the circle: differing responses are visible in posture.
  standing(ctx, 356, 499, .78, { color: C.soft, hair: 2, pose: 'folded' });
  standing(ctx, 707, 490, .81, { facing: -1, color: C.green, hair: 0, pose: 'carry' });
  painting(ctx, 499, 308, 1.04);
  standing(ctx, 221, 600, .99, { color: C.blue, hair: 1, skirt: true,
    gesture: { near: LISTENER_ARMS[frame], ...(frame >= 6 ? { palm: -.25 } : {}) } });
  standing(ctx, 802, 610, 1.06, { facing: -1, color: C.soft, hair: 2, pose: 'folded' });
  // Maya, with sleeves rolled and the physical marks of making near her.
  standing(ctx, 622, 584, 1.09, { facing: -1, color: C.gold, hair: 1, skirt: true,
    gesture: { near: MAYA_ARMS[frame], ...(frame >= 2 ? { palm: [0, 0, .28, -.06, -.25, -.25, -.25, -.25][frame] } : {}) } });
  worktable(ctx, 350, 574, 172, .94);
  path(ctx, [[382, 571], [433, 566], [454, 580], [402, 588]], { fill: C.paper, close: true, width: .7 });
  bezier(ctx, [393, 578, 407, 565, 430, 591, 443, 577], C.blue, 1);
  supplies(ctx, 473, 568, .59);
  mug(ctx, 371, 572);
  seated(ctx, 285, 668, 1.05, { color: C.green, hair: 2 });
  seated(ctx, 717, 679, 1.1, { color: C.blue, facing: -1, hair: 0 });
  // Small personal work waits at the foot of the gathering.
  path(ctx, [[775, 631], [828, 619], [842, 669], [787, 683]], { fill: C.paper, close: true, width: 1.2 });
  path(ctx, [[782, 637], [824, 628], [834, 663], [792, 674]], { stroke: C.gold, close: true });
  bezier(ctx, [793, 659, 798, 635, 823, 650, 825, 645], C.red, 1.7);
  line(ctx, 182, 574, 166, 661, C.ink, 2); line(ctx, 160, 663, 175, 666, C.ink, 2);
  line(ctx, 173, 617, 187, 619, C.ink, 1.1);
  ctx.restore();
}

function wheelchair(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // A normal working chair and a person in active conversation, not a symbol.
  line(ctx, -21, -89, -17, -20, C.ink, 3);
  line(ctx, -17, -20, 48, -16, C.ink, 3);
  line(ctx, 45, -16, 59, 17, C.ink, 2.3);
  line(ctx, -20, -63, 8, -64, C.ink, 2.2);
  seated(ctx, 0, 0, 1, { color: C.blue, facing: 1, hair: 0, drawing: true });
  ellipse(ctx, -15, -3, 31, 31, C.paper, C.ink, 1.6);
  ellipse(ctx, -15, -3, 26, 26, null, C.blue, 1.2);
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5;
    line(ctx, -15, -3, -15 + Math.cos(a) * 27, -3 + Math.sin(a) * 27, C.ink, .65, .7);
  }
  ellipse(ctx, -15, -3, 4, 4, C.gold, C.ink, .8);
  ellipse(ctx, 55, 23, 7, 7, C.soft, C.ink, 1.2);
  line(ctx, 35, 11, 57, 9, C.ink, 2); line(ctx, 55, 9, 55, 18, C.ink, 1.6);
  ctx.restore();
}

function ledger(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  path(ctx, [[0, 0], [46, -5], [67, 9], [19, 16]], { fill: C.paper, close: true });
  for (let i = 0; i < 5; i++) {
    line(ctx, 9 + i * 3, 2 + i * 2, 44 + i * 3, -2 + i * 2, C.ink, .55, .6);
  }
  ctx.restore();
}

function rearFence(ctx) {
  // Every post and rail is built from the first cel. The enclosure belongs to
  // the place; it does not stretch, sprout pickets or close on people's bodies.
  const back = [[96, 406], [226, 390], [415, 392], [623, 384], [894, 399]];
  layer(ctx, .62, () => {
    for (let i = 0; i < back.length - 1; i++) {
      const a = back[i], b = back[i + 1];
      line(ctx, a[0], a[1] - 33, b[0], b[1] - 33, C.ink, 1.3);
      line(ctx, a[0], a[1] - 7, b[0], b[1] - 7, C.ink, 1.3);
      const n = Math.ceil((b[0] - a[0]) / 28);
      for (let k = 0; k < n; k++) {
        const u = k / n, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
        line(ctx, x, y + 6, x, y - 46, C.ink, 2);
      }
    }
  });
}

function foregroundFence(ctx) {
  const top = 450;
  layer(ctx, .9, () => {
    const left = 101, right = 920;
    [[left, top, 137, 696], [right, top - 7, 888, 696]].forEach(([ax, ay, bx, by]) => {
      for (let k = 0; k < 7; k++) {
        const u = k / 6, x = ax + (bx - ax) * u, y = ay + (by - ay) * u, h = 41 + u * 44;
        path(ctx, [[x - 3, y + 9], [x - 3, y - h], [x, y - h - 7], [x + 4, y - h], [x + 4, y + 10]], { fill: C.paper, close: true, width: .9 });
      }
      line(ctx, ax, ay - 33, bx, by - 62, C.ink, 2); line(ctx, ax, ay - 8, bx, by - 20, C.ink, 2);
    });
    // A fixed, clear opening makes the procedural boundary the moving subject.
    const panels = [[136, 407], [659, 890]];
    panels.forEach(([a, b]) => {
      for (let x = a; x <= b; x += 24) {
        const y = 704 - Math.abs(x - 500) * .035;
        path(ctx, [[x - 3, y + 10], [x - 3, y - 88], [x, y - 95], [x + 4, y - 88], [x + 4, y + 10]], { fill: C.paper, close: true, width: 1 });
      }
      line(ctx, a, 641, b, 643, C.ink, 2.7); line(ctx, a, 681, b, 683, C.ink, 2.7);
      line(ctx, a, 639, b, 641, C.paper, 1);
    });
  });
}

/** A community's authorship rule becomes an apparatus of inspection. */
export function drawBoundary(ctx, p, options = {}) {
  const frame = cel(p, options), inspection = INSPECTION_POSES[frame];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ground(ctx);
  layer(ctx, .63, () => settlement(ctx, 1));
  canopy(ctx, .47);
  layer(ctx, .65, () => { garden(ctx, 158, 431, 2); garden(ctx, 759, 427, 2); });
  // The rear boundary sits behind the makers and the framed painting.
  rearFence(ctx);
  // Recognizable continuity with the gathering, now pulled apart by procedure.
  standing(ctx, 239, 512, .83, { color: C.green, hair: 2, pose: 'carry', facing: 1 });
  standing(ctx, 775, 514, .86, { color: C.soft, hair: 1, pose: 'folded', facing: -1, skirt: true });
  painting(ctx, 555, 299, .86, 1);
  if (frame >= 6) {
    // An inspection string crosses the image; no claim that tools are immoral.
    path(ctx, [[502, 336], [616, 450], [616, 465], [501, 351]], { fill: C.paper, close: true, width: .7 });
    for (let i = 0; i < 9; i++) line(ctx, 509 + i * 12, 347 + i * 12, 513 + i * 12, 348 + i * 12, C.red, 1.1);
    path(ctx, [[536, 467], [555, 465], [556, 494], [537, 496]], { fill: C.paper, close: true });
    ellipse(ctx, 546, 480, 5, 5, null, C.red, 1);
  }
  // A neighbour raises a rigid board, compares the work, and makes one mark.
  // Both hands are authored in local figure coordinates; the supporting wrist
  // is the clipboard's origin, so paper and arm cannot drift apart.
  standing(ctx, 647, 596, 1.08, { facing: -1, color: C.soft, hair: 2,
    gesture: {
      far: [[-18, -141], inspection.elbow, inspection.grip],
      near: [[20, -140], inspection.reach, inspection.hand],
      inspection, frame,
    } });
  wheelchair(ctx, 318, 619, 1.08);
  worktable(ctx, 359, 540, 169, 1);
  ledger(ctx, 393, 534, 1.1); ledger(ctx, 430, 550, .83);
  supplies(ctx, 496, 533, .57);
  // Articulated access tool: visibly attached to the desk, held by its user.
  path(ctx, [[383, 553], [379, 516], [403, 486], [425, 504], [439, 526]], { stroke: C.ink, width: 3 });
  path(ctx, [[383, 553], [379, 516], [403, 486], [425, 504], [439, 526]], { stroke: C.blue, width: 1.6 });
  [[379, 516], [403, 486], [425, 504]].forEach(([x, y]) => ellipse(ctx, x, y, 4, 4, C.gold, C.ink, .8));
  line(ctx, 435, 519, 447, 537, C.ink, 1.5);
  path(ctx, [[374, 550], [390, 549], [390, 558], [374, 560]], { fill: C.ink, close: true });
  // An ordinary computer remains in use beside the ledger.
  path(ctx, [[448, 521], [439, 485], [482, 480], [490, 516]], { fill: C.soft, close: true });
  path(ctx, [[449, 512], [444, 490], [477, 486], [483, 509]], { fill: C.paper, close: true, width: .6 });
  for (let i = 0; i < 4; i++) line(ctx, 449 + i, 494 + i * 4, 471 + i, 491 + i * 4, C.blue, .7);
  path(ctx, [[448, 521], [490, 516], [507, 528], [460, 534]], { fill: C.soft, close: true });
  for (let i = 0; i < 3; i++) line(ctx, 454 + i * 4, 522 + i * 3, 488 + i * 4, 518 + i * 3, C.ink, .6, .6);
  standing(ctx, 744, 642, .91, { facing: -1, color: C.gold, hair: 1, skirt: true, pose: 'carry' });
  // Unfinished frames wait with their makers; one small work turns away.
  path(ctx, [[195, 557], [244, 570], [225, 640], [177, 626]], { fill: C.paper, close: true, width: 1.4 });
  path(ctx, [[201, 568], [234, 577], [219, 629], [187, 621]], { stroke: C.gold, close: true });
  bezier(ctx, [198, 613, 201, 574, 219, 619, 225, 589], C.blue, 1.7);
  line(ctx, 183, 628, 225, 569, C.ink, .7, .45);
  path(ctx, [[820, 544], [866, 535], [878, 604], [830, 614]], { fill: C.soft, close: true });
  line(ctx, 826, 550, 871, 599, C.ink, .9); line(ctx, 862, 542, 835, 607, C.ink, .9);
  foregroundFence(ctx);
  ctx.restore();
}
