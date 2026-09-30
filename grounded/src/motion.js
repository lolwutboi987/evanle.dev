// Authored exposure sheets. Scroll selects a drawing; it never interpolates one.
// Irregular holds make each action read as a decision, not a looping idle cycle.
export const MAX_DRAWING_FPS = 8;
export const REVEAL_STEPS = Object.freeze(Array.from({ length: 9 }, (_, i) => i / 8));

function scene(id, labels, holds, comparison = false) {
  return Object.freeze({
    id,
    frames: Object.freeze(labels.map((label, index) => Object.freeze({
      label, at: holds[index], p: index / (labels.length - 1),
      ...(comparison ? { reveal: REVEAL_STEPS[index] } : {}),
    }))),
  });
}

export const SCENES = Object.freeze([
  scene('opening', [
    'Inspect the edge', 'Set the brush', 'Pull the first blade', 'Turn the bristles',
    'Finish the grass', 'Check the mark', 'Lift clear', 'Rest the hand',
  ], [0, .14, .26, .38, .46, .58, .70, .82]),
  scene('world', [
    'At the landing', 'Leaving the quay', 'Finding the current', 'Across the canal',
    'Following the bend', 'Easing toward home', 'Almost alongside', 'A quiet arrival',
  ], [0, .12, .22, .34, .47, .61, .72, .83]),
  scene('archive', [
    'First house study', 'Find the roofline', 'Cross out the trial', 'Redraw the eave',
    'Add shadow hatching', 'Test the pigment', 'Annotate the revision', 'Circle the chosen study',
  ], [0, .16, .30, .39, .49, .60, .72, .83]),
  scene('perception', [
    'Maya’s original', 'A little comfort', 'The first substitution', 'An altered encounter',
    'Two versions', 'More of the message lost', 'The house becomes a home', 'Almost no trace',
    'Caretaker’s version',
  ], [0, .13, .22, .31, .40, .49, .58, .67, .78], true),
  scene('witness', [
    'Gathered and listening', 'Maya lifts her forearm', 'Her hand turns outward', 'She offers the work',
    'Her open palm settles', 'A listener starts to answer', 'The listener opens a hand', 'A shared exchange holds',
  ], [0, .17, .27, .38, .48, .60, .73, .84]),
  scene('boundary', [
    'Clipboard at rest', 'The record rises', 'The board levels', 'Comparing the painting',
    'Pencil touches paper', 'The assessment is marked', 'An inspection strip appears', 'The assessment holds',
  ], [0, .17, .28, .38, .50, .61, .72, .82]),
  scene('daughter', [
    'Hold the offering', 'Indicate the corner', 'Set the brush', 'Sign the first stroke',
    'Complete the signature', 'Add the underline', 'Lift the brush', 'Present the finished city',
  ], [0, .12, .22, .33, .43, .54, .65, .78]),
]);

const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export function getFrame(sceneIndex, progress, { reducedMotion = false } = {}) {
  const frames = SCENES[sceneIndex].frames;
  const t = clamp(progress);
  const index = reducedMotion ? frames.length - 1 : frames.findLastIndex(frame => t >= frame.at);
  return { ...frames[index], index };
}

export function quantizeReveal(reveal) {
  return REVEAL_STEPS[Math.round(clamp(reveal) * (REVEAL_STEPS.length - 1))];
}

export function resolveDrawing(sceneIndex, progress, { reducedMotion = false, reveal = null, choice = null } = {}) {
  let frame = getFrame(sceneIndex, progress, { reducedMotion });
  if (sceneIndex === 3) {
    const comparison = quantizeReveal(reveal ?? (reducedMotion ? .5 : frame.reveal));
    const index = Math.round(comparison * 8);
    frame = { ...SCENES[sceneIndex].frames[index], index };
  }
  return {
    scene: sceneIndex, frame: frame.index, p: frame.p, label: frame.label,
    ...(sceneIndex === 3 ? { reveal: frame.reveal } : {}),
    choice: sceneIndex === 6 && ['keep', 'remove'].includes(choice) ? choice : null,
  };
}

// All reachable illustration states, including every comparison and ending.
// The frame-review harness renders this same list at full and mobile sizes.
export const REVIEW_STATES = Object.freeze(SCENES.flatMap((item, sceneIndex) =>
  item.frames.flatMap((frame, index) => (sceneIndex === 6 ? [null, 'keep', 'remove'] : [null]).map(choice =>
    Object.freeze({ scene: sceneIndex, frame: index, label: frame.label, choice,
      ...(frame.reveal !== undefined ? { reveal: frame.reveal } : {}) }),
  )),
));
