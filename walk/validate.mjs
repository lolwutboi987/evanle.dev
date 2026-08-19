#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const walkDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.dirname(walkDirectory);
const storyPath = path.join(walkDirectory, "story.js");
const gamePath = path.join(walkDirectory, "game.js");
const indexPath = path.join(walkDirectory, "index.html");
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
  return Boolean(condition);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function checkStringArray(value, label) {
  if (!check(Array.isArray(value) && value.length > 0, `${label} must be a non-empty array.`)) {
    return;
  }

  value.forEach((entry, index) => {
    check(isNonEmptyString(entry), `${label}[${index}] must be a non-empty string.`);
  });
}

function endingIdentity(ending) {
  if (isNonEmptyString(ending?.id)) return ending.id;
  return JSON.stringify(ending);
}

function validateEnding(ending, label) {
  if (!check(ending && typeof ending === "object" && !Array.isArray(ending), `${label} must return an ending object.`)) {
    return;
  }

  for (const field of ["id", "title", "subtitle", "finalLine"]) {
    check(isNonEmptyString(ending[field]), `${label} ending.${field} must be a non-empty string.`);
  }
  checkStringArray(ending.lines, `${label} ending.lines`);
}

function extractDomIds(source) {
  const ids = new Set();
  const patterns = [
    /\bgetElementById\s*\(\s*(["'`])([^"'`]+)\1\s*\)/g,
    /\bquerySelector(?:All)?\s*\(\s*(["'`])#([A-Za-z][\w:.-]*)\1\s*\)/g,
    /(?:^|[^\w$])\$\s*\(\s*(["'`])([A-Za-z][\w:.-]*)\1\s*\)/gm,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) ids.add(match[2]);
  }
  return ids;
}

function extractHtmlIds(source) {
  const ids = [];
  for (const match of source.matchAll(/\bid\s*=\s*(["'])([^"']+)\1/gi)) {
    ids.push(match[2]);
  }
  return ids;
}

function extractLocalReferences(htmlSource, gameSource) {
  const references = [];

  for (const match of htmlSource.matchAll(/\b(?:src|href|poster)\s*=\s*(["'])([^"']+)\1/gi)) {
    references.push({ reference: match[2].trim(), from: indexPath });
  }

  for (const match of htmlSource.matchAll(/\bsrcset\s*=\s*(["'])([^"']+)\1/gi)) {
    for (const candidate of match[2].split(",")) {
      const reference = candidate.trim().split(/\s+/, 1)[0];
      if (reference) references.push({ reference, from: indexPath });
    }
  }

  const importPattern = /\b(?:import|export)\s+(?:[^"'`]*?\s+from\s+)?(["'])([^"']+)\1|\bimport\s*\(\s*(["'])([^"']+)\3\s*\)/g;
  for (const match of gameSource.matchAll(importPattern)) {
    const reference = match[2] ?? match[4];
    if (reference?.startsWith("./") || reference?.startsWith("../")) {
      references.push({ reference, from: gamePath });
    }
  }

  return references;
}

function resolveLocalReference(reference, from) {
  if (
    !reference ||
    reference.startsWith("#") ||
    reference.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(reference)
  ) {
    return null;
  }

  const withoutQueryOrHash = reference.split(/[?#]/, 1)[0];
  if (!withoutQueryOrHash) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(withoutQueryOrHash);
  } catch {
    failures.push(`Invalid URL encoding in local reference "${reference}" from ${path.basename(from)}.`);
    return null;
  }

  return decoded.startsWith("/")
    ? path.resolve(repositoryRoot, `.${decoded}`)
    : path.resolve(path.dirname(from), decoded);
}

async function readRequiredFile(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    failures.push(`Cannot read ${path.relative(repositoryRoot, filePath)}: ${error.message}`);
    return "";
  }
}

async function validateStory() {
  let story;
  try {
    story = await import(pathToFileURL(storyPath).href);
  } catch (error) {
    failures.push(`Cannot import walk/story.js as an ES module: ${error.message}`);
    return;
  }

  const { CHAPTERS, AMBIENT_LINES, deriveEnding } = story;
  if (!check(Array.isArray(CHAPTERS), "story.js must export CHAPTERS as an array.")) return;
  check(CHAPTERS.length === 5, `CHAPTERS must contain exactly 5 chapters; found ${CHAPTERS.length}.`);

  const chapterIds = CHAPTERS.map((chapter) => chapter?.id);
  const validChapterIds = chapterIds.filter(isNonEmptyString);
  check(validChapterIds.length === CHAPTERS.length, "Every chapter must have a non-empty string id.");
  check(new Set(validChapterIds).size === validChapterIds.length, "Chapter ids must be unique.");

  const allChoiceIds = [];
  const representativeFlags = [];
  const paletteFields = ["sky", "horizon", "sidewalk", "shadow", "light", "accent"];

  CHAPTERS.forEach((chapter, chapterIndex) => {
    const label = `CHAPTERS[${chapterIndex}]${isNonEmptyString(chapter?.id) ? ` (${chapter.id})` : ""}`;
    if (!check(chapter && typeof chapter === "object" && !Array.isArray(chapter), `${label} must be an object.`)) {
      return;
    }

    for (const field of ["id", "title", "subtitle", "weather"]) {
      check(isNonEmptyString(chapter[field]), `${label}.${field} must be a non-empty string.`);
    }
    for (const field of ["year", "age"]) {
      check(Number.isFinite(chapter[field]), `${label}.${field} must be a finite number.`);
    }
    checkStringArray(chapter.intro, `${label}.intro`);
    checkStringArray(chapter.outro, `${label}.outro`);

    if (check(chapter.palette && typeof chapter.palette === "object" && !Array.isArray(chapter.palette), `${label}.palette must be an object.`)) {
      for (const field of paletteFields) {
        check(isNonEmptyString(chapter.palette[field]), `${label}.palette.${field} must be a non-empty string.`);
      }
    }

    const encounter = chapter.encounter;
    if (!check(encounter && typeof encounter === "object" && !Array.isArray(encounter), `${label}.encounter must be an object.`)) {
      return;
    }
    check(Number.isFinite(encounter.x), `${label}.encounter.x must be a finite number.`);
    for (const field of ["speaker", "prompt"]) {
      check(isNonEmptyString(encounter[field]), `${label}.encounter.${field} must be a non-empty string.`);
    }
    checkStringArray(encounter.lines, `${label}.encounter.lines`);

    if (!check(Array.isArray(encounter.choices), `${label}.encounter.choices must be an array.`)) return;
    check(encounter.choices.length === 2, `${label}.encounter.choices must contain exactly 2 choices; found ${encounter.choices.length}.`);

    const localChoiceIds = [];
    encounter.choices.forEach((choice, choiceIndex) => {
      const choiceLabel = `${label}.encounter.choices[${choiceIndex}]`;
      if (!check(choice && typeof choice === "object" && !Array.isArray(choice), `${choiceLabel} must be an object.`)) {
        return;
      }
      for (const field of ["id", "label", "reply", "flag"]) {
        check(isNonEmptyString(choice[field]), `${choiceLabel}.${field} must be a non-empty string.`);
      }
      if (isNonEmptyString(choice.id)) {
        localChoiceIds.push(choice.id);
        allChoiceIds.push(choice.id);
      }
    });
    check(new Set(localChoiceIds).size === localChoiceIds.length, `${label} choice ids must be unique.`);

    const representativeFlag = encounter.choices.find((choice) => isNonEmptyString(choice?.flag))?.flag;
    if (representativeFlag) representativeFlags.push(representativeFlag);
  });

  check(new Set(allChoiceIds).size === allChoiceIds.length, "Choice ids must be unique across all chapters.");

  if (check(AMBIENT_LINES && typeof AMBIENT_LINES === "object" && !Array.isArray(AMBIENT_LINES), "story.js must export AMBIENT_LINES as an object.")) {
    for (const chapterId of validChapterIds) {
      checkStringArray(AMBIENT_LINES[chapterId], `AMBIENT_LINES.${chapterId}`);
    }
  }

  if (!check(typeof deriveEnding === "function", "story.js must export deriveEnding as a function.")) return;
  if (!check(representativeFlags.length === CHAPTERS.length, "Each chapter must contribute a representative memory flag for ending validation.")) return;

  const midCount = Math.ceil(representativeFlags.length / 2);
  const cases = [
    ["low-memory", new Set()],
    ["mid-memory", new Set(representativeFlags.slice(0, midCount))],
    ["high-memory", new Set(representativeFlags)],
  ];
  const endings = [];
  for (const [label, flags] of cases) {
    try {
      const ending = deriveEnding(flags);
      validateEnding(ending, `deriveEnding(${label})`);
      endings.push(endingIdentity(ending));
    } catch (error) {
      failures.push(`deriveEnding(${label}) threw: ${error.message}`);
    }
  }
  if (endings.length === cases.length) {
    check(new Set(endings).size === cases.length, "deriveEnding must produce distinct endings for representative low-, mid-, and high-memory flag sets.");
  }
}

async function validateDomAndAssets() {
  const [gameSource, indexSource] = await Promise.all([
    readRequiredFile(gamePath),
    readRequiredFile(indexPath),
  ]);
  if (!gameSource || !indexSource) return;

  const referencedIds = extractDomIds(gameSource);
  check(referencedIds.size > 0, "No literal DOM ids were found in game.js; the validator cannot verify the game/index.html contract.");

  const htmlIds = extractHtmlIds(indexSource);
  const htmlIdSet = new Set(htmlIds);
  for (const id of referencedIds) {
    check(htmlIdSet.has(id), `index.html is missing DOM id "${id}" referenced by game.js.`);
  }
  const duplicateHtmlIds = [...new Set(htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index))];
  for (const id of duplicateHtmlIds) failures.push(`index.html contains duplicate DOM id "${id}".`);

  const references = extractLocalReferences(indexSource, gameSource);
  const checkedTargets = new Set();
  for (const { reference, from } of references) {
    const target = resolveLocalReference(reference, from);
    if (!target || checkedTargets.has(target)) continue;
    checkedTargets.add(target);

    const relativeTarget = path.relative(repositoryRoot, target);
    if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
      failures.push(`Local reference "${reference}" from ${path.basename(from)} resolves outside the repository.`);
      continue;
    }

    try {
      await stat(target);
    } catch {
      failures.push(`Missing local asset "${reference}" from ${path.relative(repositoryRoot, from)} (expected ${relativeTarget}).`);
    }
  }
}

await validateStory();
await validateDomAndAssets();

if (failures.length > 0) {
  console.error(`Walk validation failed with ${failures.length} issue${failures.length === 1 ? "" : "s"}:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Walk validation passed: story structure, endings, DOM ids, and local assets are valid.");
}
