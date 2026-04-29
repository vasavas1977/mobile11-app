import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: require admin role ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Get deploy config from secrets ---
    const deployToken = Deno.env.get("DEPLOY_TOKEN");
    const rawDeployUrl = Deno.env.get("BRIDGE_DEPLOY_URL");

    if (!deployToken || !rawDeployUrl) {
      return new Response(
        JSON.stringify({
          error: "Deploy not configured. Set DEPLOY_TOKEN and BRIDGE_DEPLOY_URL secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize: accept bare IP/host, host:port, or full URL.
    let bridgeDeployUrl = rawDeployUrl.trim();
    if (!/^https?:\/\//i.test(bridgeDeployUrl)) {
      bridgeDeployUrl = `http://${bridgeDeployUrl}`;
    }
    try {
      const u = new URL(bridgeDeployUrl);
      if (!u.port) u.port = "3101";
      if (u.pathname === "/" || u.pathname === "") u.pathname = "/deploy";
      bridgeDeployUrl = u.toString();
    } catch {
      return new Response(
        JSON.stringify({ error: `Invalid BRIDGE_DEPLOY_URL: ${rawDeployUrl}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Forward files to VPS deploy agent ---
    const body = await req.json();
    const { files, action, agentSource, expected_sha256 } = body;

    // +identity-fix-1: one-click remote agent self-update path. Forwards the
    // shipped deploy-agent.ts source to the VPS /self-update endpoint.
    if (action === "self_update_agent") {
      if (typeof agentSource !== "string" || agentSource.length < 2048) {
        return new Response(
          JSON.stringify({ error: "agentSource missing or too small" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Build /self-update URL from BRIDGE_DEPLOY_URL host:port
      let selfUpdateUrl = bridgeDeployUrl;
      try {
        const u = new URL(bridgeDeployUrl);
        u.pathname = "/self-update";
        selfUpdateUrl = u.toString();
      } catch {
        return new Response(
          JSON.stringify({ error: "Could not derive /self-update URL" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[deploy-bridge] Admin ${user.email} self-updating deploy agent at ${selfUpdateUrl} (${agentSource.length} bytes)`);

      const upRes = await fetch(selfUpdateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deployToken}`,
        },
        body: JSON.stringify({ source: agentSource, expected_sha256 }),
        signal: AbortSignal.timeout(15000),
      });
      const upData = await upRes.json().catch(() => ({}));
      console.log("[deploy-bridge] self-update response:", upRes.status, upData);
      return new Response(
        JSON.stringify(upData),
        { status: upRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!files || typeof files !== "object") {
      return new Response(
        JSON.stringify({ error: "No files provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[deploy-bridge] Admin ${user.email} deploying ${Object.keys(files).length} files to ${bridgeDeployUrl}`);

    const deployRes = await fetch(bridgeDeployUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deployToken}`,
      },
      body: JSON.stringify({ files }),
      signal: AbortSignal.timeout(30000),
    });

    const deployData = await deployRes.json();

    if (!deployRes.ok) {
      console.error(`[deploy-bridge] VPS returned ${deployRes.status}:`, deployData);
      return new Response(
        JSON.stringify({ error: "Deploy failed", details: deployData }),
        { status: deployRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedFiles = Object.keys(files);
    const skippedFiles = Array.isArray(deployData?.skipped) ? deployData.skipped : [];
    const deployedFiles = Array.isArray(deployData?.deployed) ? deployData.deployed : [];
    const missingFiles = requestedFiles.filter((name) => !deployedFiles.includes(name));

    // deploy-agent.ts ships in the snapshot for the "Update Deploy Agent"
    // download flow but the VPS deploy-agent's whitelist refuses to overwrite
    // itself — this is by design. Treat it as a benign skip, not a partial
    // deploy failure. Any OTHER skipped/missing file is still a hard failure.
    const benignSkips = new Set(["deploy-agent.ts"]);
    const realMissing = missingFiles.filter((name) => !benignSkips.has(name));
    const realSkipped = skippedFiles.filter((name: string) => !benignSkips.has(name));

    if (realMissing.length > 0 || realSkipped.length > 0) {
      const message = `VPS deploy agent is outdated and skipped required file(s): ${[...new Set([...realMissing, ...realSkipped])].join(", ")}. Update deploy-agent.ts on the VPS, restart the deploy agent, then retry.`;
      console.error("[deploy-bridge] Partial deploy detected:", {
        requestedFiles,
        deployedFiles,
        skippedFiles,
        missingFiles,
      });
      return new Response(
        JSON.stringify({
          error: message,
          details: {
            requestedFiles,
            deployedFiles,
            skippedFiles,
            missingFiles,
            deployAgentOutdated: true,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[deploy-bridge] Deploy success:", deployData);

    return new Response(
      JSON.stringify(deployData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[deploy-bridge] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
