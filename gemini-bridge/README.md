# Gemini Bridge — Self-Hosted Jambonz + Gemini Live Audio Proxy

Real-time WebSocket bridge between Jambonz and Google Gemini Live API for life-like AI voice calls with sub-second latency and barge-in support — all on a single VPS.

```
Caller → Your SBC → Jambonz (VPS:5060) → ws://localhost:3100 → Gemini Bridge ↔ Gemini Live API
                         │                                            │
                         │ RTP (40000-60000)                          │ REST
                         ▼                                            ▼
                    Media Server                                  Supabase DB
```

## VPS Specifications

| Concurrent Calls | CPU | RAM | Storage | Bandwidth |
|---|---|---|---|---|
| Up to 20 | 4 vCPUs | 8 GB | 80 GB SSD | 2 TB |
| Up to 50 | 8 vCPUs | 16 GB | 160 GB SSD | 4 TB |

- **OS**: Ubuntu 22.04 LTS
- **Network**: Public static IP
- **Recommended**: Hetzner CPX31 (~€15/mo), Vultr High Frequency ($48/mo), DigitalOcean Premium ($48/mo)

## Step-by-Step Deployment

### Step 1: Provision VPS and Basic Setup

```bash
ssh root@YOUR_VPS_IP

apt update && apt upgrade -y
hostnamectl set-hostname voice.yourdomain.com

adduser deploy
usermod -aG sudo deploy
```

### Step 2: DNS Records

Create A records pointing to your VPS IP:
- `voice.yourdomain.com` → VPS IP

### Step 3: Firewall Rules

```bash
sudo ufw allow 22/tcp           # SSH
sudo ufw allow 80/tcp           # HTTP (Let's Encrypt)
sudo ufw allow 443/tcp          # HTTPS (Jambonz admin)
sudo ufw allow 3000/tcp         # Jambonz API
sudo ufw allow 5060/udp         # SIP UDP
sudo ufw allow 5060/tcp         # SIP TCP
sudo ufw allow 5061/tcp         # SIP TLS
sudo ufw allow 8443/tcp         # Jambonz WSS
sudo ufw allow 40000:60000/udp  # RTP media
sudo ufw enable
```

### Step 4: Install Jambonz (Docker)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
apt install docker-compose-plugin -y

# Clone Jambonz
su - deploy
git clone https://github.com/jambonz/jambonz-infrastructure.git
cd jambonz-infrastructure/docker

# Configure
cp .env.example .env
nano .env
```

Key `.env` values:
```
JAMBONZ_ADMIN_PORT=3000
JWT_SECRET=<random-secret>
ENCRYPTION_SECRET=<random-secret>
JAMBONZ_DOMAIN=voice.yourdomain.com
```

```bash
docker compose up -d
docker compose ps
```

### Step 5: Configure Jambonz Admin

Open `http://YOUR_VPS_IP:3000`:

1. Set admin password on first login
2. **Carriers** → Add your SBC/switch IP as a SIP trunk gateway
3. **Phone Numbers** → Add your DIDs
4. **Applications** → Create "Gemini Live Bot":
   - Type: **WebSocket**
   - URL: `ws://localhost:3100` ← local, no TLS needed
5. **Phone Numbers** → Assign DIDs to "Gemini Live Bot"

### Step 6: Install Deno and Deploy Gemini Bridge

```bash
su - deploy

# Install Deno
curl -fsSL https://deno.land/install.sh | sh
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Deploy bridge files
sudo mkdir -p /opt/gemini-bridge
sudo chown deploy:deploy /opt/gemini-bridge
cd /opt/gemini-bridge
# Copy: server.ts, gemini-session.ts, supabase-logger.ts, config.ts
```

### Step 7: Configure Environment

```bash
cat > /opt/gemini-bridge/.env << 'EOF'
GOOGLE_CLOUD_API_KEY=your-google-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3100
GEMINI_VOICE=Aoede
# Phase 0 diagnostics (optional). Both must be set; bridge restart required to toggle.
# VOICE_DIAG=1
# VOICE_DIAG_SECRET=<same value as Supabase secret VOICE_DIAG_SECRET>
EOF

chmod 600 /opt/gemini-bridge/.env
```

### Step 8: Create systemd Service

```bash
sudo tee /etc/systemd/system/gemini-bridge.service << 'EOF'
[Unit]
Description=Gemini Bridge - Jambonz to Gemini Live Audio Proxy
After=network.target docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/gemini-bridge
EnvironmentFile=/opt/gemini-bridge/.env
ExecStart=/home/deploy/.deno/bin/deno run --allow-net --allow-env --allow-read server.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable gemini-bridge
sudo systemctl start gemini-bridge
```

### Step 9: Configure Your SBC

On your SBC/Softswitch, add a SIP trunk:
- **IP**: Your VPS public IP
- **Port**: 5060 (UDP/TCP) or 5061 (TLS)
- Route your DID(s) to this trunk

### Step 10: Verify

```bash
# Check Jambonz
docker compose ps

# Check Gemini Bridge
sudo systemctl status gemini-bridge
curl http://localhost:3100/health

# Watch logs during test call
sudo journalctl -u gemini-bridge -f
docker compose logs -f feature-server
```

## Port Summary

| Component | Port | Purpose |
|---|---|---|
| Jambonz SBC | 5060/5061 | SIP from your carrier SBC |
| Jambonz Admin | 3000 | Web dashboard |
| Jambonz WSS | 8443 | WebSocket (internal) |
| Gemini Bridge | 3100 | Audio proxy to Gemini |
| RTP | 40000-60000 | Voice media |

## How It Works

1. **Incoming call** → SBC routes SIP to Jambonz (port 5060)
2. **Jambonz** → Opens WebSocket to `ws://localhost:3100`, sends call metadata JSON
3. **Bridge** → Creates contact + conversation + call log in Supabase
4. **Bridge** → Opens Gemini Live WebSocket with system instruction + KB grounding
5. **Audio streaming** → Jambonz L16 PCM ↔ Gemini base64 PCM (bidirectional)
6. **Barge-in** → Gemini VAD triggers `interrupted` → bridge sends `killAudio` to Jambonz
7. **Escalation** → Transfer keywords detected → bridge sends `refer` for call transfer
8. **Hangup** → Call log updated with duration, transcript, and status

## Costs

- **Gemini Live API**: ~$0.05–0.15 per 5-minute call
- **VPS**: €15–48/month (Hetzner/Vultr/DigitalOcean)
- **Jambonz**: Free (self-hosted, open source)

## Remote bridge logs (admin visibility)

The bridge streams its lifecycle events into the Supabase `voice_bridge_logs`
table so admins can view them at `/admin/contact-center/bridge-logs`
(live tail + per-call filtering) without SSH-ing into the EC2 instance.

**Latency-safety guarantees:**
- `pushLog()` is a synchronous array push — never awaited on the audio path.
- Events are batched and POSTed every 2 s on a separate timer.
- Buffer is capped at 500 events; oldest dropped if Supabase is unreachable.
- Audio path keeps flowing even if Supabase goes down.

**Disable instantly without redeploying:** set env `BRIDGE_REMOTE_LOGS=off`
and restart the bridge. Logs older than 14 days are auto-deleted nightly.

## PR 5 / 5.1 — Manual VAD Drive (rollback)

`VAD_DRIVE_TURN_END=1` switches the bridge from server-VAD (Gemini owns turn
boundaries) to manual-drive (bridge owns boundaries via local VAD +
`activityStart` / `activityEnd`). The setup payload is chosen at boot from
this single flag, so the two authority modes can never be active at once.

Remote config is **not live in production** (`USE_REMOTE_CONFIG=0`, never
enabled in deploy). Therefore the only rollback path is an env change +
service restart on the VPS:

```bash
ssh deploy@voicebot.1-to-all.com
sed -i 's/^VAD_DRIVE_TURN_END=1/VAD_DRIVE_TURN_END=0/' /opt/gemini-bridge/.env
# or remove the line entirely
sudo systemctl restart gemini-bridge
sudo journalctl -u gemini-bridge -n 30 --no-pager | grep turn_control_mode
```

Expected within ~5s: a `bridge_boot` row in `voice_bridge_logs` with
`metadata.turn_control_mode = "auto-vad+local-energy-observe"` and
`setup_payload_shape` ending in `vad=auto-server`. Total rollback time:
under 1 minute.
