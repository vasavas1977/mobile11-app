/**
 * Gemini Bridge Deploy Agent
 * 
 * Lightweight Deno HTTP server that receives file deployments
 * and restarts the bridge service.
 * 
 * Runs on port 3101, independently from the bridge (port 3100).
 * 
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write --allow-run deploy-agent.ts
 * 
 * Required env:
 *   DEPLOY_TOKEN - shared secret for authorization
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

const DEPLOY_TOKEN = Deno.env.get("DEPLOY_TOKEN");
const DEPLOY_DIR = "/opt/gemini-bridge";
const PORT = 3101;
const AGENT_VERSION = Deno.env.get("DEPLOY_AGENT_VERSION") || `local-${Date.now()}`;
const STARTED_AT = Date.now();

// +identity-fix-1: Supabase REST endpoint for direct deploy-receipt logging.
// Uses service-role key already injected for the bridge process.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh ArrayBuffer-backed view so SubtleCrypto's strict
  // BufferSource type accepts it under Deno's strict TS settings.
  const view = new Uint8Array(bytes.byteLength);
  view.set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", view.buffer);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Atomically write text to `path` by writing to a temp file in the same
 * directory, then renaming. Rename within a single filesystem is atomic on
 * POSIX, so readers never see a partial/truncated file.
 */
async function atomicWriteTextFile(path: string, content: string): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf("/")) || ".";
  const tmp = `${dir}/.${path.split("/").pop()}.tmp.${crypto.randomUUID()}`;
  try {
    await Deno.writeTextFile(tmp, content);
    await Deno.rename(tmp, path);
  } catch (err) {
    try { await Deno.remove(tmp); } catch { /* ignore */ }
    throw err;
  }
}

/**
 * Fail-open POST of a single voice_bridge_logs row. Errors are logged but
 * never propagated — observability must not block deploy success/failure.
 */
async function postDeployReceipt(row: Record<string, unknown>): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[Deploy Agent] receipt: SUPABASE_URL or SERVICE_ROLE_KEY missing, skipping");
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/voice_bridge_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify([row]),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn(`[Deploy Agent] receipt POST failed status=${res.status} ${txt.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn(`[Deploy Agent] receipt POST error: ${(err as Error).message}`);
  }
}

if (!DEPLOY_TOKEN) {
  console.error("[Deploy Agent] DEPLOY_TOKEN not set in environment");
  Deno.exit(1);
}

console.log(`[Deploy Agent] Starting on port ${PORT} version=${AGENT_VERSION}`);
console.log(`[Deploy Agent] Deploy directory: ${DEPLOY_DIR}`);

Deno.serve({ port: PORT }, async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // Health check (now reports version + uptime + last deployed bridge file mtime)
  if (url.pathname === "/health" && req.method === "GET") {
    let bridgeServerMtime: string | null = null;
    try {
      const stat = await Deno.stat(`${DEPLOY_DIR}/server.ts`);
      bridgeServerMtime = stat.mtime?.toISOString() ?? null;
    } catch {
      bridgeServerMtime = null;
    }
    return Response.json({
      status: "ok",
      service: "deploy-agent",
      port: PORT,
      version: AGENT_VERSION,
      uptime_s: Math.round((Date.now() - STARTED_AT) / 1000),
      bridge_server_ts_mtime: bridgeServerMtime,
    });
  }

  // +identity-fix-1: /self-update — atomically replaces deploy-agent.ts on
  // disk and exits so systemd respawns into the new code. Same DEPLOY_TOKEN
  // gate as /deploy; no new attack surface vs. existing arbitrary-write.
  if (url.pathname === "/self-update" && req.method === "POST") {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${DEPLOY_TOKEN}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const body = await req.json();
      const source = typeof body.source === "string" ? body.source : "";
      const expected = typeof body.expected_sha256 === "string" ? body.expected_sha256 : null;

      if (!source || source.length < 2048 || source.length > 200_000) {
        return Response.json({ error: `Invalid source size: ${source.length}` }, { status: 400 });
      }
      if (!source.includes("Deno.serve") || !source.includes('"/deploy"')) {
        return Response.json({ error: "Source failed sanity check (missing Deno.serve or /deploy route)" }, { status: 400 });
      }

      const newSha = await sha256Hex(new TextEncoder().encode(source));
      if (expected && expected !== newSha) {
        return Response.json({ error: `sha256 mismatch: expected=${expected} actual=${newSha}` }, { status: 400 });
      }

      const targetPath = `${DEPLOY_DIR}/deploy-agent.ts`;
      await atomicWriteTextFile(targetPath, source);
      console.log(`[Deploy Agent] /self-update wrote ${source.length} bytes sha256=${newSha.slice(0,16)}`);

      await postDeployReceipt({
        call_sid: null, cid: null, caller_number: null, did_number: null,
        level: "stage",
        stage: "agent_self_update",
        message: `Deploy agent self-update applied (${source.length} bytes)`,
        elapsed_ms: null,
        metadata: {
          success: true,
          new_sha256: newSha,
          byte_size: source.length,
          old_agent_version: AGENT_VERSION,
          restart_policy_assumed: "systemd",
          deploy_dir: DEPLOY_DIR,
        },
        created_at: new Date().toISOString(),
      });

      // Schedule exit AFTER response flushes. systemd Restart=always respawns.
      setTimeout(() => {
        console.log("[Deploy Agent] /self-update exiting for respawn");
        Deno.exit(0);
      }, 500);

      return Response.json({
        ok: true,
        sha256: newSha,
        byte_size: source.length,
        will_exit_in_ms: 500,
        old_agent_version: AGENT_VERSION,
      });
    } catch (err) {
      console.error("[Deploy Agent] /self-update error:", err);
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  // Deploy endpoint
  if (url.pathname === "/deploy" && req.method === "POST") {
    // Validate token
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${DEPLOY_TOKEN}`) {
      console.log("[Deploy Agent] Unauthorized deploy attempt");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const files = body.files as Record<string, string>;

      if (!files || typeof files !== "object" || Object.keys(files).length === 0) {
        return Response.json({ error: "No files provided" }, { status: 400 });
      }

      // Whitelist allowed filenames
      const allowedFiles = new Set([
        "server.ts",
        "config.ts",
        "gemini-session.ts",
        "supabase-logger.ts",
        "bridge-logger.ts",
        "transcript-persist.ts",
      ]);

      const written: string[] = [];
      const skipped: string[] = [];

      for (const [name, content] of Object.entries(files)) {
        if (!allowedFiles.has(name)) {
          console.log(`[Deploy Agent] Skipping non-whitelisted file: ${name}`);
          skipped.push(name);
          continue;
        }

        const filePath = `${DEPLOY_DIR}/${name}`;
        await Deno.writeTextFile(filePath, content);
        console.log(`[Deploy Agent] Written: ${filePath} (${content.length} bytes)`);
        written.push(name);
      }

      if (written.length === 0) {
        return Response.json({ error: "No valid files to deploy", skipped }, { status: 400 });
      }

      // +identity-fix-1: compute per-file SHA-256 of what we just wrote, then
      // a 16-char manifest hash = sha256(sorted "name:hash" lines). This is
      // the source of truth for "what payload was actually shipped this deploy".
      const fileHashes: Record<string, string> = {};
      for (const name of written) {
        try {
          const bytes = await Deno.readFile(`${DEPLOY_DIR}/${name}`);
          fileHashes[name] = await sha256Hex(bytes);
        } catch (err) {
          console.warn(`[Deploy Agent] hash read failed for ${name}: ${err}`);
          fileHashes[name] = "unreadable";
        }
      }
      const manifestLines = Object.keys(fileHashes)
        .sort()
        .map((n) => `${n}:${fileHashes[n]}`)
        .join("\n");
      const manifestHash = (
        await sha256Hex(new TextEncoder().encode(manifestLines))
      ).slice(0, 16);
      console.log(`[Deploy Agent] manifest_hash=${manifestHash} files=${written.length}`);

      // +identity-fix-1: atomically publish manifest hash for the bridge to
      // pick up on its next boot via /opt/gemini-bridge/.deploy.env.
      try {
        await atomicWriteTextFile(
          `${DEPLOY_DIR}/.deploy.env`,
          `BRIDGE_MANIFEST_HASH=${manifestHash}\n`,
        );
      } catch (err) {
        console.warn(`[Deploy Agent] .deploy.env write failed: ${err}`);
        // do not abort — bridge will still boot, just with fallback hash
      }

      // Restart the bridge service
      console.log("[Deploy Agent] Restarting gemini-bridge service...");
      const cmd = new Deno.Command("systemctl", {
        args: ["restart", "gemini-bridge"],
      });
      const result = await cmd.output();

      const restartSuccess = result.code === 0;
      const stderrText = restartSuccess
        ? ""
        : new TextDecoder().decode(result.stderr);

      // +identity-fix-1: emit deploy_agent_restart receipt on BOTH paths
      // (success and failure) so "did Deploy actually fire?" is one SQL
      // query. Fail-open — never abort deploy on logging error.
      await postDeployReceipt({
        call_sid: null,
        cid: null,
        caller_number: null,
        did_number: null,
        level: restartSuccess ? "stage" : "error",
        stage: "deploy_agent_restart",
        message: restartSuccess
          ? `Deploy applied: ${written.length} file(s)`
          : `Deploy restart failed (exit ${result.code})`,
        elapsed_ms: null,
        metadata: {
          success: restartSuccess,
          restart_exit_code: result.code,
          restart_stderr: restartSuccess ? null : stderrText.slice(0, 500),
          files_written: written,
          files_skipped: skipped,
          file_hashes: fileHashes,
          manifest_hash: manifestHash,
          agent_version: AGENT_VERSION,
          deploy_dir: DEPLOY_DIR,
        },
        created_at: new Date().toISOString(),
      });

      if (!restartSuccess) {
        console.error(`[Deploy Agent] Restart failed: ${stderrText}`);
        return Response.json({
          deployed: written,
          skipped,
          restart: false,
          manifest_hash: manifestHash,
          error: `Service restart failed: ${stderrText}`,
        }, { status: 500 });
      }

      console.log(`[Deploy Agent] Deploy complete. Files: ${written.join(", ")}`);

      return Response.json({
        deployed: written,
        skipped,
        restart: true,
        manifest_hash: manifestHash,
        file_hashes: fileHashes,
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      console.error("[Deploy Agent] Deploy error:", err);
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  return Response.json({ error: "Not found" }, { status: 404 });
});
