#!/usr/bin/env node
/**
 * Builder for src/data/bridge-files-stable.json.
 *
 * Single source of truth: gemini-bridge/{server,gemini-session,supabase-logger,config}.ts
 * Output: src/data/bridge-files-stable.json (4 string keys, JSON-stringified)
 *
 * +gemini-3.1-setup-fix: this script now ALSO computes a sha256 bundle hash
 * over the canonical source files and rewrites the BUNDLE_HASH placeholder in
 * supabase-logger.ts so the running bridge can prove what is live (independent
 * of BUILD_VERSION which is a hand-edited string).
 *
 * The previous bundle is preserved at src/data/bridge-files-stable-prev.json
 * before the new bundle is written, so the Manual Rollback button keeps
 * pointing at the last-known-good build.
 *
 * This script REPLACES the +logs-N string-patcher pattern. From now on, the
 * bundle is a deterministic function of the source files. Drift is detectable.
 *
 * Usage:
 *   node scripts/build-stable-bundle.mjs                              # build (no version assertion)
 *   node scripts/build-stable-bundle.mjs --version 2026-04-25-stable+gemini-3.1-setup-fix
 *                                                                    # build, assert BUILD_VERSION matches
 *   node scripts/build-stable-bundle.mjs --check                     # exit non-zero if committed bundle != current source
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "gemini-bridge");
const BUNDLE_PATH = path.join(ROOT, "src/data/bridge-files-stable.json");
const PREV_BUNDLE_PATH = path.join(ROOT, "src/data/bridge-files-stable-prev.json");

// RUNTIME_FILES: the bridge code that actually runs on the VPS. These — and
// ONLY these — feed into BUNDLE_HASH so the runtime fingerprint is decoupled
// from packaging churn. The VPS deploy-agent's hardcoded whitelist matches.
const RUNTIME_FILES = [
  "server.ts",
  "gemini-session.ts",
  "supabase-logger.ts",
  "config.ts",
  "transcript-persist.ts",
];

// EXTRA_FILES: shipped in the manifest for UI consumption (e.g. the
// "Update Deploy Agent" download) but DELIBERATELY EXCLUDED from BUNDLE_HASH.
// Bumping deploy-agent.ts must NOT change the bridge's runtime fingerprint.
const EXTRA_FILES = [
  "deploy-agent.ts",
];

const ALL_FILES = [...RUNTIME_FILES, ...EXTRA_FILES];

function parseArgs(argv) {
  const args = { check: false, version: null, allowExtraOnly: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--check") args.check = true;
    else if (argv[i] === "--allow-extra-only") args.allowExtraOnly = true;
    else if (argv[i] === "--version") args.version = argv[++i];
  }
  return args;
}

function readSourceFiles() {
  const out = {};
  for (const name of ALL_FILES) {
    const p = path.join(SOURCE_DIR, name);
    if (!fs.existsSync(p)) throw new Error(`source file missing: ${p}`);
    const content = fs.readFileSync(p, "utf8");
    if (!content.trim()) throw new Error(`source file empty: ${p}`);
    out[name] = content;
  }
  return out;
}

function extractBuildVersion(loggerSrc) {
  const m = loggerSrc.match(/export\s+const\s+BUILD_VERSION\s*=\s*"([^"]+)"/);
  if (!m) throw new Error(`BUILD_VERSION literal not found in supabase-logger.ts`);
  return m[1];
}

function validate(files, expectedVersion) {
  // 1. All 4 files present, non-empty (already enforced in readSourceFiles).
  // 2. BUILD_VERSION matches --version arg if provided.
  const actualVersion = extractBuildVersion(files["supabase-logger.ts"]);
  if (expectedVersion && actualVersion !== expectedVersion) {
    throw new Error(
      `BUILD_VERSION mismatch: source has "${actualVersion}", --version arg is "${expectedVersion}". ` +
      `Update gemini-bridge/supabase-logger.ts before re-running.`,
    );
  }
  // 3. deploy-agent whitelist sanity check — verify the agent references each
  // RUNTIME file by name (the agent's own filename is correctly absent from
  // its self-whitelist by design).
  const agentSrc = files["deploy-agent.ts"];
  if (agentSrc) {
    for (const name of RUNTIME_FILES) {
      if (!agentSrc.includes(name)) {
        console.warn(
          `[warn] deploy-agent.ts does not reference "${name}" — verify the agent's filename whitelist.`,
        );
      }
    }
  }
  return actualVersion;
}

function serialize(files) {
  // Match the existing JSON shape: 2-space indent + trailing newline.
  return JSON.stringify(files, null, 2) + "\n";
}

// +gemini-3.1-setup-fix: compute a deterministic content hash over the
// source files, then rewrite the BUNDLE_HASH placeholder in supabase-logger.ts
// inside the in-memory `files` map (NOT on disk).
//
// Two-pass: hash the canonical (placeholder) text first so the hash is stable
// across rebuilds, then patch the placeholder with that hash.
const PLACEHOLDER = "__BUNDLE_HASH_PLACEHOLDER__";

// INVARIANT: BUNDLE_HASH is computed over RUNTIME_FILES ONLY. Do NOT include
// deploy-agent.ts or any EXTRA_FILES — the runtime fingerprint must stay
// stable across deploy-agent-only updates so we can verify what's actually
// running on the VPS. If you "fix" this to include all files, you will
// destroy the observability the bridge relies on.
function computeBundleHash(files) {
  const h = crypto.createHash("sha256");
  for (const name of RUNTIME_FILES) {
    h.update(name);
    h.update("\0");
    h.update(files[name]);
    h.update("\0");
  }
  return h.digest("hex").slice(0, 16); // short, easy to compare in logs
}

function injectBundleHash(files, hash) {
  const logger = files["supabase-logger.ts"];
  if (!logger.includes(PLACEHOLDER)) {
    // Already patched (e.g. local edit). Replace any existing BUNDLE_HASH literal.
    const replaced = logger.replace(
      /export\s+const\s+BUNDLE_HASH\s*=\s*"[^"]*"/,
      `export const BUNDLE_HASH = "${hash}"`,
    );
    if (replaced === logger) {
      throw new Error(
        `BUNDLE_HASH placeholder/literal not found in supabase-logger.ts — cannot inject hash.`,
      );
    }
    files["supabase-logger.ts"] = replaced;
    return;
  }
  files["supabase-logger.ts"] = logger.replaceAll(PLACEHOLDER, hash);
}

function readPreviousBundleHash(bundlePath) {
  if (!fs.existsSync(bundlePath)) return null;
  try {
    const prev = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
    const logger = prev["supabase-logger.ts"] ?? "";
    const m = logger.match(/export\s+const\s+BUNDLE_HASH\s*=\s*"([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = readSourceFiles();
  const version = validate(files, args.version);

  // Hash the canonical (placeholder) form so the hash is purely a function of
  // the source content, not of the previous build.
  const bundleHash = computeBundleHash(files);

  // +pr2-native-ctx-compression: refuse to write a no-op bundle. If the new
  // BUNDLE_HASH equals the previous one, no source file under gemini-bridge/
  // changed since the last build — shipping it would only bump the version
  // label (this is exactly what caused the 2026-04-26-stable+pr2-ctxcompress
  // -telemetry no-op deploy). --check mode is excluded; that path is meant
  // to detect drift, not enforce change.
  if (!args.check && !args.allowExtraOnly) {
    const prevHash = readPreviousBundleHash(BUNDLE_PATH);
    if (prevHash && prevHash === bundleHash) {
      console.error(
        `[build] ABORT: computed BUNDLE_HASH ${bundleHash} is identical to ` +
        `the previous bundle. No RUNTIME file under gemini-bridge/ changed ` +
        `since the last build. If you intended to ship a deploy-agent-only ` +
        `update (or any EXTRA_FILES change), re-run with --allow-extra-only. ` +
        `Otherwise, edit the runtime source you intend to ship. Refusing to ` +
        `write a no-op bundle.`,
      );
      process.exit(3);
    }
  }

  injectBundleHash(files, bundleHash);

  const next = serialize(files);

  if (args.check) {
    if (!fs.existsSync(BUNDLE_PATH)) {
      console.error(`[check] bundle missing: ${BUNDLE_PATH}`);
      process.exit(2);
    }
    const current = fs.readFileSync(BUNDLE_PATH, "utf8");
    if (current === next) {
      console.log(`[check] OK — bundle matches source (BUILD_VERSION=${version}, BUNDLE_HASH=${bundleHash})`);
      process.exit(0);
    }
    // Identify which file(s) differ to make the error actionable.
    let currentParsed;
    try {
      currentParsed = JSON.parse(current);
    } catch {
      console.error(`[check] FAIL — committed bundle is not valid JSON.`);
      process.exit(1);
    }
    const drifted = [];
    for (const name of ALL_FILES) {
      if ((currentParsed[name] ?? "") !== files[name]) {
        const a = (currentParsed[name] ?? "").length;
        const b = files[name].length;
        drifted.push(`${name} (committed=${a} chars, source=${b} chars)`);
      }
    }
    console.error(`[check] FAIL — bundle differs from source:`);
    for (const d of drifted) console.error(`  - ${d}`);
    console.error(`Run: node scripts/build-stable-bundle.mjs --version ${version}`);
    process.exit(1);
  }

  // Preserve the previous bundle so Manual Rollback keeps pointing at the
  // last-known-good build.
  if (fs.existsSync(BUNDLE_PATH)) {
    const prev = fs.readFileSync(BUNDLE_PATH, "utf8");
    fs.writeFileSync(PREV_BUNDLE_PATH, prev);
    console.log(`[build] preserved previous bundle -> ${PREV_BUNDLE_PATH}`);
  }

  fs.writeFileSync(BUNDLE_PATH, next);
  console.log(`[build] wrote ${BUNDLE_PATH} (BUILD_VERSION=${version}, BUNDLE_HASH=${bundleHash})`);
  for (const name of RUNTIME_FILES) {
    console.log(`  - ${name}: ${files[name].length} chars [runtime]`);
  }
  for (const name of EXTRA_FILES) {
    console.log(`  - ${name}: ${files[name].length} chars [extra, not in hash]`);
  }
  console.log(
    `[build] expected bridge_boot row will report ` +
    `metadata.build_version="${version}" AND metadata.bundle_hash="${bundleHash}". ` +
    `Both must match before continuing past Phase 0.`,
  );
}

main();
