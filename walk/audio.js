const CHAPTERS = [
  { root: 174.61, chord: [0, 7, 12], motif: [12, 7, 14, 9], rain: 0.09 },
  { root: 196.0, chord: [0, 3, 10], motif: [10, 15, 12, 7], rain: 0.13 },
  { root: 146.83, chord: [0, 5, 12], motif: [12, 17, 14, 9], rain: 0.18 },
  { root: 220.0, chord: [0, 4, 11], motif: [11, 16, 14, 19], rain: 0.07 },
];

const semitone = (root, offset) => root * (2 ** (offset / 12));

/**
 * Small, asset-free Web Audio system. Creating this object is silent: the
 * AudioContext is not constructed until start/resume is called from a gesture.
 */
export function createAudioSystem(options = {}) {
  const scope = typeof window === "undefined" ? null : window;
  const doc = typeof document === "undefined" ? null : document;
  const AudioContextClass = scope?.AudioContext || scope?.webkitAudioContext;
  const maxVoices = Math.max(4, Math.min(24, Number(options.maxVoices) || 14));
  const volume = Math.max(0, Math.min(1, Number(options.volume) || 0.62));

  let wantedEnabled = options.enabled !== false;
  let context = null;
  let master = null;
  let musicBus = null;
  let effectsBus = null;
  let rainGain = null;
  let noiseBuffer = null;
  let rainSource = null;
  let scheduler = 0;
  let nextBeat = 0;
  let beat = 0;
  let chapterIndex = 0;
  let stepCount = 0;
  let interactionCount = 0;
  let gestureInProgress = false;
  let manuallySuspended = false;
  let resumeAfterVisibility = false;
  const voices = [];

  const markGesture = (event) => {
    if (event.isTrusted === false) return;
    gestureInProgress = true;
    queueMicrotask(() => { gestureInProgress = false; });
  };

  const gestureEvents = ["pointerdown", "touchend", "keydown"];
  gestureEvents.forEach((name) => scope?.addEventListener(name, markGesture, true));

  function isGesture(event) {
    return event?.isTrusted === true
      || gestureInProgress
      || scope?.navigator?.userActivation?.isActive === true;
  }

  function ramp(param, target, duration = 0.12) {
    if (!context || !param) return;
    const now = context.currentTime;
    try {
      if (typeof param.cancelAndHoldAtTime === "function") {
        param.cancelAndHoldAtTime(now);
      } else {
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
      }
      param.linearRampToValueAtTime(target, now + Math.max(0.01, duration));
    } catch { /* A closed context is simply silent. */ }
  }

  function makeNoiseBuffer() {
    const length = Math.floor(context.sampleRate * 2);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let seed = 0x51f15e;
    let previous = 0;
    for (let i = 0; i < length; i += 1) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      const white = ((seed >>> 0) / 0xffffffff) * 2 - 1;
      previous = previous * 0.985 + white * 0.015;
      channel[i] = white * 0.35 + previous * 1.6;
    }
    return buffer;
  }

  function forgetVoice(voice) {
    const index = voices.indexOf(voice);
    if (index >= 0) voices.splice(index, 1);
    voice.nodes.forEach((node) => {
      try { node.disconnect(); } catch { /* already disconnected */ }
    });
  }

  function retireVoice(voice, quickly = false) {
    if (voice.retired || !context) return;
    voice.retired = true;
    const now = context.currentTime;
    ramp(voice.gain.gain, 0, quickly ? 0.025 : 0.08);
    voice.sources.forEach((source) => {
      try { source.stop(now + (quickly ? 0.03 : 0.09)); } catch { /* ended */ }
    });
  }

  function trackVoice(sources, gain, nodes) {
    while (voices.length >= maxVoices) retireVoice(voices.shift(), true);
    const voice = { sources, gain, nodes, retired: false };
    voices.push(voice);
    let remaining = sources.length;
    sources.forEach((source) => {
      source.addEventListener("ended", () => {
        remaining -= 1;
        if (remaining === 0) forgetVoice(voice);
      }, { once: true });
    });
    return voice;
  }

  function ready() {
    return wantedEnabled && context?.state === "running" && !doc?.hidden;
  }

  function playChime(frequency, when = context?.currentTime || 0, duration = 0.8, level = 0.055) {
    if (!ready()) return false;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, when);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.997, when + duration);
      filter.type = "lowpass";
      filter.frequency.value = 2600;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(level, when + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      oscillator.connect(filter).connect(gain).connect(effectsBus);
      oscillator.start(when);
      oscillator.stop(when + duration + 0.03);
      trackVoice([oscillator], gain, [oscillator, filter, gain]);
      return true;
    } catch { return false; }
  }

  function playPad(when = context?.currentTime || 0, long = false) {
    if (!ready()) return false;
    try {
      const chapter = CHAPTERS[chapterIndex];
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      const oscillators = chapter.chord.map((offset, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = index === 0 ? "sine" : "triangle";
        oscillator.frequency.value = semitone(chapter.root / 2, offset);
        oscillator.detune.value = (index - 1) * 3;
        oscillator.connect(filter);
        return oscillator;
      });
      const duration = long ? 8.5 : 6.2;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(720 + chapterIndex * 90, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(long ? 0.052 : 0.035, when + 1.7);
      gain.gain.setValueAtTime(long ? 0.052 : 0.035, when + duration - 2.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      filter.connect(gain).connect(musicBus);
      oscillators.forEach((oscillator) => {
        oscillator.start(when);
        oscillator.stop(when + duration + 0.04);
      });
      trackVoice(oscillators, gain, [...oscillators, filter, gain]);
      return true;
    } catch { return false; }
  }

  function scheduleMusic() {
    if (!ready()) return;
    const horizon = context.currentTime + 0.45;
    const chapter = CHAPTERS[chapterIndex];
    while (nextBeat < horizon) {
      if (beat % 4 === 0) playPad(nextBeat);
      if (beat % 8 === 6) {
        const note = chapter.motif[Math.floor(beat / 8) % chapter.motif.length];
        playChime(semitone(chapter.root, note), nextBeat, 1.15, 0.025);
      }
      beat += 1;
      nextBeat += 1.35;
    }
  }

  function startScheduler() {
    if (!context || scheduler) return;
    nextBeat = Math.max(nextBeat, context.currentTime + 0.05);
    scheduler = scope?.setInterval(scheduleMusic, 180) || 0;
    scheduleMusic();
  }

  function stopScheduler() {
    if (scheduler) scope?.clearInterval(scheduler);
    scheduler = 0;
  }

  function setupGraph() {
    master = context.createGain();
    musicBus = context.createGain();
    effectsBus = context.createGain();
    rainGain = context.createGain();
    const rainFilter = context.createBiquadFilter();
    noiseBuffer = makeNoiseBuffer();

    master.gain.value = 0;
    musicBus.gain.value = 0.32;
    effectsBus.gain.value = 0.5;
    rainGain.gain.value = CHAPTERS[chapterIndex].rain;
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 1350;
    musicBus.connect(master);
    effectsBus.connect(master);
    rainGain.connect(rainFilter).connect(master);
    master.connect(context.destination);

    rainSource = context.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;
    rainSource.connect(rainGain);
    rainSource.start();
  }

  async function start(event) {
    if (!wantedEnabled || !AudioContextClass) return false;
    try {
      if (!context) {
        if (!isGesture(event)) return false;
        context = new AudioContextClass({ latencyHint: "interactive" });
        setupGraph();
      }
      if (context.state === "suspended") await context.resume();
      if (context.state !== "running") return false;
      manuallySuspended = false;
      ramp(master.gain, volume, 0.45);
      startScheduler();
      return true;
    } catch { return false; }
  }

  async function setEnabled(value, event) {
    wantedEnabled = Boolean(value);
    if (!wantedEnabled) {
      stopScheduler();
      ramp(master?.gain, 0, 0.18);
      return false;
    }
    if (!context) return start(event);
    return resume(event);
  }

  function setChapter(index) {
    const numeric = Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0;
    chapterIndex = Math.max(0, Math.min(CHAPTERS.length - 1, numeric));
    if (context && rainGain) ramp(rainGain.gain, CHAPTERS[chapterIndex].rain, 1.8);
    if (ready()) {
      nextBeat = context.currentTime + 0.08;
      playPad(nextBeat, true);
    }
    return chapterIndex;
  }

  function step() {
    if (!ready() || !noiseBuffer) return false;
    try {
      const now = context.currentTime;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
      source.buffer = noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.value = 165 + (stepCount % 3) * 24;
      filter.Q.value = 0.65;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.075, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      if (panner) {
        panner.pan.value = stepCount % 2 ? 0.15 : -0.15;
        source.connect(filter).connect(gain).connect(panner).connect(effectsBus);
      } else source.connect(filter).connect(gain).connect(effectsBus);
      const offset = (stepCount * 0.173) % 1.75;
      stepCount += 1;
      source.start(now, offset, 0.13);
      source.stop(now + 0.14);
      trackVoice([source], gain, [source, filter, gain, ...(panner ? [panner] : [])]);
      return true;
    } catch { return false; }
  }

  function interact() {
    if (!ready()) return false;
    const chapter = CHAPTERS[chapterIndex];
    const note = chapter.motif[interactionCount % chapter.motif.length];
    interactionCount += 1;
    return playChime(semitone(chapter.root, note), context.currentTime, 0.72, 0.06);
  }

  function transition() {
    if (!ready()) return false;
    const when = context.currentTime;
    playPad(when, true);
    playChime(semitone(CHAPTERS[chapterIndex].root, 19), when + 0.3, 1.5, 0.045);
    return true;
  }

  function ending() {
    if (!ready()) return false;
    const root = CHAPTERS[chapterIndex].root;
    [0, 7, 12, 16].forEach((note, index) => {
      playChime(semitone(root, note), context.currentTime + index * 0.34, 1.8, 0.048);
    });
    playPad(context.currentTime, true);
    return true;
  }

  async function suspend() {
    manuallySuspended = true;
    stopScheduler();
    if (!context || context.state !== "running") return true;
    try {
      ramp(master.gain, 0, 0.06);
      await context.suspend();
      return true;
    } catch { return false; }
  }

  async function resume(event) {
    if (!wantedEnabled || doc?.hidden) return false;
    if (!context) return start(event);
    try {
      if (context.state === "suspended") await context.resume();
      if (context.state !== "running") return false;
      manuallySuspended = false;
      nextBeat = context.currentTime + 0.05;
      ramp(master.gain, volume, 0.35);
      startScheduler();
      return true;
    } catch { return false; }
  }

  function onVisibilityChange() {
    if (!context) return;
    if (doc.hidden) {
      resumeAfterVisibility = wantedEnabled && context.state === "running" && !manuallySuspended;
      stopScheduler();
      ramp(master.gain, 0, 0.04);
      context.suspend().catch(() => {});
    } else if (resumeAfterVisibility && wantedEnabled && !manuallySuspended) {
      resumeAfterVisibility = false;
      resume().catch(() => {});
    }
  }

  doc?.addEventListener("visibilitychange", onVisibilityChange);

  return {
    get enabled() { return wantedEnabled; },
    start,
    setEnabled,
    setChapter,
    step,
    interact,
    transition,
    ending,
    suspend,
    resume,
    // Small aliases keep the module easy to integrate without adding another layer.
    footstep: step,
    ambience: setChapter,
    choice: interact,
    setMuted(value, event) { return setEnabled(!value, event); },
    toggle(event) { return setEnabled(!wantedEnabled, event); },
    stop: suspend,
  };
}
