// Quick sanity test for the conversion logic used in settings-converter.html.
// Run with: node tools/test-converter.js
"use strict";

const fs = require("fs");
const path = require("path");

// --- copy of the logic from settings-converter.html ---
const ID_RENAMES = {
  "anuppuccin-accent-toggle": "neoppuccin-accent-toggle",
  "anuppuccin-theme-accents": "neoppuccin-theme-accents",
  "anuppuccin-theme-dark": "neoppuccin-theme-dark",
  "anuppuccin-theme-light": "neoppuccin-theme-light",
  "anuppuccin-light-theme-accents": "neoppuccin-light-theme-accents",
};
const EXTENDED_KEEP = { "anp-theme-ext-amoled": true };

function convert(text) {
  const data = JSON.parse(text);
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("The JSON must be an object of settings.");
  }
  const out = {};
  const dropped = [];
  const renamed = [];
  let converted = 0;
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("anuppuccin-theme-settings-extended@@")) {
      const extId = key.slice("anuppuccin-theme-settings-extended@@".length);
      if (EXTENDED_KEEP[extId]) {
        const newKey = "neoppuccin-theme-settings@@" + extId;
        out[newKey] = value;
        renamed.push([key, newKey]);
        converted++;
      } else {
        dropped.push(key);
      }
      continue;
    }
    if (key.startsWith("anuppuccin-theme-settings@@")) {
      const id = key.slice("anuppuccin-theme-settings@@".length);
      const newId = ID_RENAMES[id] || id;
      const newKey = "neoppuccin-theme-settings@@" + newId;
      out[newKey] = value;
      converted++;
      if (newId !== id) renamed.push([key, newKey]);
      continue;
    }
    out[key] = value;
  }
  return { out, dropped, renamed, converted };
}
// --- end copy ---

// The user's example export (trimmed to the interesting keys)
const example = {
  "anuppuccin-theme-settings@@anp-decoration-toggle": true,
  "anuppuccin-theme-settings@@anp-highlight-custom": "anp-highlight-mauve",
  "anuppuccin-theme-settings@@anp-active-line": "anp-no-highlight",
  "anuppuccin-theme-settings-extended@@anp-theme-ext-dark": true,
  "anuppuccin-theme-settings-extended@@catppuccin-theme-extended": "ctp-material-mint-light",
  "anuppuccin-theme-settings-extended@@catppuccin-theme-dark-extended": "ctp-atom-dark",
  "anuppuccin-theme-settings-extended@@anp-theme-ext-amoled": false,
  "anuppuccin-theme-settings@@anuppuccin-accent-toggle": true,
  "anuppuccin-theme-settings@@anuppuccin-theme-accents": "ctp-accent-lavender",
  "anuppuccin-theme-settings@@anuppuccin-theme-dark": "ctp-tokyo-night",
  "anuppuccin-theme-settings@@anuppuccin-theme-light": "ctp-latte",
  "anuppuccin-theme-settings@@anuppuccin-light-theme-accents": "ctp-accent-light-yellow",
  "anuppuccin-theme-settings@@anp-layout-select": "anp-border-layout",
  "anuppuccin-theme-settings@@anp-border-padding": 10,
  "anuppuccin-theme-settings@@anp-callout-select": "anp-callout-sleek",
  "anuppuccin-theme-settings@@anp-custom-checkboxes": true,
  "anuppuccin-theme-settings@@bold-weight": "500",
  "anuppuccin-theme-settings@@tag-radius": 0.4,
  "anuppuccin-theme-settings@@anp-theme-ext-amoled": false,
  "some-other-plugin@@some-setting": "untouched",
};

const result = convert(JSON.stringify(example, null, 2));

let failures = 0;
function check(cond, msg) {
  if (cond) console.log("  ✓ " + msg);
  else { console.log("  ✗ FAIL: " + msg); failures++; }
}

console.log("Converted:", result.converted, "| Renamed:", result.renamed.length, "| Dropped:", result.dropped.length);

check(result.out["neoppuccin-theme-settings@@anp-decoration-toggle"] === true, "plain setting converted");
check(result.out["neoppuccin-theme-settings@@neoppuccin-accent-toggle"] === true, "anuppuccin-accent-toggle renamed");
check(result.out["neoppuccin-theme-settings@@neoppuccin-theme-accents"] === "ctp-accent-lavender", "anuppuccin-theme-accents renamed");
check(result.out["neoppuccin-theme-settings@@neoppuccin-theme-dark"] === "ctp-tokyo-night", "anuppuccin-theme-dark renamed");
check(result.out["neoppuccin-theme-settings@@neoppuccin-theme-light"] === "ctp-latte", "anuppuccin-theme-light renamed");
check(result.out["neoppuccin-theme-settings@@neoppuccin-light-theme-accents"] === "ctp-accent-light-yellow", "anuppuccin-light-theme-accents renamed");
check(result.out["neoppuccin-theme-settings@@anp-theme-ext-amoled"] === false, "extended amoled moved to core section");
check(result.out["neoppuccin-theme-settings@@anp-layout-select"] === "anp-border-layout", "layout setting converted");
check(result.out["some-other-plugin@@some-setting"] === "untouched", "foreign plugin settings untouched");
check(!("neoppuccin-theme-settings-extended@@anp-theme-ext-dark" in result.out), "extended dark toggle dropped");
check(!("neoppuccin-theme-settings-extended@@catppuccin-theme-extended" in result.out), "extended colorscheme dropped");
check(!("neoppuccin-theme-settings-extended@@catppuccin-theme-dark-extended" in result.out), "extended dark colorscheme dropped");
check(result.dropped.length === 3, "3 settings reported as dropped, got " + result.dropped.length);
check(result.renamed.length === 6, "6 settings reported as renamed, got " + result.renamed.length);
check(Object.keys(result.out).length === 16, "16 settings in output (17 mapped, one duplicate target), got " + Object.keys(result.out).length);

// Round-trip: output must re-parse as valid JSON
JSON.parse(JSON.stringify(result.out, null, 2));
check(true, "output is valid JSON");

console.log(failures === 0 ? "\nAll checks passed ✔" : "\n" + failures + " check(s) FAILED ✘");
process.exit(failures === 0 ? 0 : 1);
