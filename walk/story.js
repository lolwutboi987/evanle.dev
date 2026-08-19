const chapter = (data) => Object.freeze({
  ...data,
  palette: Object.freeze(data.palette),
  intro: Object.freeze(data.intro),
  encounter: Object.freeze({
    ...data.encounter,
    lines: Object.freeze(data.encounter.lines),
    choices: Object.freeze(data.encounter.choices.map(Object.freeze)),
  }),
  outro: Object.freeze(data.outro),
});

export const CHAPTERS = Object.freeze([
  chapter({
    id: "spring-1956",
    year: 1956,
    age: 8,
    title: "Eight Points",
    subtitle: "A spring morning before the bell",
    palette: { sky: "#b9d8cf", horizon: "#efd7a1", sidewalk: "#b8ad97", shadow: "#62665b", light: "#f2ad4e", accent: "#477b69" },
    weather: "Cool sun after overnight rain",
    intro: [
      "The sidewalk is only six houses long when you are eight.",
      "Rain pearls on the new plane tree. The bakery vents warm yeast through its screen door.",
      "One amber streetlight has forgotten to switch off. Beneath it, Mr. Vale is drawing a star around a chip in the curb.",
    ],
    encounter: {
      x: 0.27,
      speaker: "Mr. Vale",
      prompt: "The school bell is close. Mr. Vale holds out the blue chalk.",
      lines: [
        "My granddaughter visits today. I told her to turn at the brightest star.",
        "I have seven points and a stiff knee. Do you have time for the eighth?",
      ],
      choices: [
        { id: "finish-star", label: "Kneel and finish the star", reply: "Your point comes out crooked. Mr. Vale calls it the one that makes the others believable.", flag: "stop_finish_star" },
        { id: "catch-bell", label: "Run before the bell", reply: "You hear chalk scratch behind you, then Mr. Vale calls, “Made it eight!”", flag: "rush_school_bell" },
      ],
    },
    outro: [
      "At the corner you look back. Blue chalk burns briefly in the amber pool.",
      "Then the bell rings, and the whole block becomes the way home.",
    ],
  }),
  chapter({
    id: "rain-1965",
    year: 1965,
    age: 17,
    title: "Last Bus",
    subtitle: "Rain turns every window into a second street",
    palette: { sky: "#596774", horizon: "#8b7767", sidewalk: "#716f6a", shadow: "#282f38", light: "#e8a24b", accent: "#6c9fb2" },
    weather: "Steady evening rain",
    intro: [
      "The plane tree reaches the second floor now. The bakery is a laundromat, its round windows turning shirts through blue light.",
      "Rain has erased the old chalk, but somebody has drawn the star again in yellow grease pencil.",
      "The amber lamp makes every drop look slow. Mara waits under it with one suitcase and no umbrella.",
    ],
    encounter: {
      x: 0.43,
      speaker: "Mara",
      prompt: "Your bus rounds the far corner. Mara watches it, too.",
      lines: [
        "My train leaves at nine. Everyone keeps telling me leaving is brave.",
        "Could somebody admit it can also be frightening? Just once?",
      ],
      choices: [
        { id: "miss-bus", label: "Let the bus go; tell the truth", reply: "You say, “Of course it is.” Her shoulders drop half an inch. You share the long walk to the station.", flag: "stop_walk_mara" },
        { id: "take-bus", label: "Wish her luck and catch it", reply: "She smiles like a person holding a door. Through the wet glass, you see her step onto the yellow star.", flag: "rush_last_bus" },
      ],
    },
    outro: [
      "The bus—or your shoes—carries you onward through the rain.",
      "By morning the star will be pale, but not quite gone.",
    ],
  }),
  chapter({
    id: "neon-1977",
    year: 1977,
    age: 29,
    title: "Open Late",
    subtitle: "The city has learned to stay awake",
    palette: { sky: "#17192b", horizon: "#493044", sidewalk: "#49444d", shadow: "#10111a", light: "#efa94e", accent: "#ed5fa6" },
    weather: "Warm night with a dry electric wind",
    intro: [
      "Neon from the all-night pharmacy paints the pavement pink. A pay phone occupies the place where the sapling's guard once stood.",
      "The tree is broad enough to hide the amber lamp until its leaves move.",
      "Beside the faded star, a delivery cyclist gathers oranges escaping from a split paper sack.",
    ],
    encounter: {
      x: 0.58,
      speaker: "Niko",
      prompt: "Your apartment phone will ring at ten. You promised this time you would answer.",
      lines: [
        "Third spill tonight. The city keeps rolling even when the bag doesn't.",
        "He laughs, but one orange is already nearing the storm drain.",
      ],
      choices: [
        { id: "gather-oranges", label: "Stop and gather the oranges", reply: "You make a net with your coat. Niko draws a tiny chalk star on the replacement bag: “So it knows the route.”", flag: "stop_gather_oranges" },
        { id: "make-call", label: "Hurry home for the call", reply: "You toe the last orange out of the gutter without breaking stride. Niko salutes with it.", flag: "rush_promised_call" },
      ],
    },
    outro: [
      "Upstairs, a phone rings somewhere—yours or someone else's.",
      "Below, the amber light steadies itself against the neon.",
    ],
  }),
  chapter({
    id: "autumn-1991",
    year: 1991,
    age: 43,
    title: "Small Detour",
    subtitle: "Your child knows a longer way",
    palette: { sky: "#9aa8a1", horizon: "#c88755", sidewalk: "#968b78", shadow: "#4f5149", light: "#e3a044", accent: "#9f4f3f" },
    weather: "Bright autumn wind",
    intro: [
      "The pharmacy is closing. Its letters have left clean ghosts on the brick.",
      "Roots lift one paving slab like the corner of a book. Leaves spin around the same amber lamp.",
      "Your child, Kit, stops at a chalk star you do not remember drawing.",
    ],
    encounter: {
      x: 0.69,
      speaker: "Kit",
      prompt: "Dinner is late. Kit has found a stub of blue chalk in the tree grate.",
      lines: [
        "This point washed away.",
        "If we fix it, will the person coming home know where to turn?",
      ],
      choices: [
        { id: "draw-with-kit", label: "Sit on the curb and draw", reply: "Kit adds too many points. You leave every one. A neighbor slows, then smiles as if recognizing an address.", flag: "stop_draw_with_kit" },
        { id: "promise-tomorrow", label: "Promise to come back tomorrow", reply: "Kit pockets the chalk. At home, you find a small star on your coat sleeve anyway.", flag: "rush_home_with_kit" },
      ],
    },
    outro: [
      "You take Kit's hand where the roots have broken the pavement.",
      "For once, the safest path is not the straight one.",
    ],
  }),
  chapter({
    id: "winter-2026",
    year: 2026,
    age: 78,
    title: "The Last Slab",
    subtitle: "Demolition morning",
    palette: { sky: "#d7d9d6", horizon: "#b8afa6", sidewalk: "#aaa69e", shadow: "#666b6d", light: "#dc9a3e", accent: "#4f7180" },
    weather: "Light snow, melting on contact",
    intro: [
      "A fence runs the length of the block. The shops are empty squares, each window marked for removal.",
      "The plane tree is gone, but its roots have left a map in the concrete. The amber lamp glows in daylight for the last time.",
      "On the final unbroken slab, a fresh blue star waits beneath a dusting of snow.",
    ],
    encounter: {
      x: 0.82,
      speaker: "Leena, site foreman",
      prompt: "The excavator idles. Leena offers you a hard hat and one quiet minute.",
      lines: [
        "We found this under the loose slab: a biscuit tin full of chalk ends and notes.",
        "Different handwriting, seventy years of it. Your crooked eighth point is in the oldest photograph.",
        "Nobody preserved the star. They kept making it again. The new walkway plan leaves a place for that.",
      ],
      choices: [
        { id: "leave-a-note", label: "Add a note to the tin", reply: "You write: “Take the long way when someone is waiting.” Leena seals it for the new cornerstone.", flag: "stop_leave_note" },
        { id: "give-chalk", label: "Give the chalk to a waiting child", reply: "The child kneels outside the fence. By the time the excavator starts, the star has nine points.", flag: "rush_pass_chalk" },
      ],
    },
    outro: [
      "Concrete breaks. The light clicks off. Neither sound is an ending.",
      "Across the street, blue chalk touches down on a clean piece of pavement.",
    ],
  }),
]);

export const AMBIENT_LINES = Object.freeze({
  "spring-1956": Object.freeze(["A screen door claps shut.", "Pigeons inspect the rain-dark curb.", "The amber lamp hums though morning has arrived."]),
  "rain-1965": Object.freeze(["A bus exhales at the next stop.", "Laundry circles behind fogged glass.", "Yellow chalk shines where the rain cannot quite reach."]),
  "neon-1977": Object.freeze(["The pharmacy sign loses an N, then finds it.", "A pay-phone receiver knocks softly in the wind.", "Leaves open and close around the amber light."]),
  "autumn-1991": Object.freeze(["Dry leaves chase one another uphill.", "A hand-painted CLOSING sign curls at the corners.", "Blue chalk dust catches in the roots."]),
  "winter-2026": Object.freeze(["Snow vanishes on the machine's warm hood.", "The fenced-off lamp keeps its small amber weather.", "Someone across the street tests a piece of chalk."]),
});

const ENDINGS = Object.freeze({
  kept: Object.freeze({
    id: "the-light-we-kept",
    title: "The Light We Kept",
    subtitle: "You stopped often enough to become part of the place.",
    lines: Object.freeze(["The new sidewalk opens in spring.", "People pause at the inlaid blue star without knowing every name beneath it.", "They do not need to. A way home is made by whoever leaves room for the next person."]),
    finalLine: "The streetlight is new. The light is still amber.",
  }),
  learned: Object.freeze({
    id: "the-long-way-home",
    title: "The Long Way Home",
    subtitle: "Some days you stopped. Some days the world pulled you on.",
    lines: Object.freeze(["The tin holds both kinds of day without judgment.", "When the new path opens, you walk it slowly once, then turn back for someone behind you.", "That small return is enough to change the length of the road."]),
    finalLine: "Home was never the shortest distance.",
  }),
  open: Object.freeze({
    id: "one-more-minute",
    title: "One More Minute",
    subtitle: "You spent a lifetime arriving. There is still time to notice.",
    lines: Object.freeze(["The child across the street offers you the chalk.", "This time nothing is ringing, leaving, or late.", "You add one crooked point and hand it back."]),
    finalLine: "The long way begins here.",
  }),
});

function normalizeFlags(flags) {
  if (flags instanceof Set) return flags;
  if (Array.isArray(flags)) return new Set(flags);
  if (flags && typeof flags === "object") {
    return new Set(Object.entries(flags).filter(([, value]) => Boolean(value)).map(([key]) => key));
  }
  return new Set();
}

export function deriveEnding(flags) {
  const chosen = normalizeFlags(flags);
  const stops = [...chosen].filter((flag) => flag.startsWith("stop_")).length;
  if (stops >= 4) return ENDINGS.kept;
  if (stops >= 2) return ENDINGS.learned;
  return ENDINGS.open;
}
