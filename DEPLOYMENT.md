# 🚀 CITYSYNC Deployment Guide

CITYSYNC can be deployed to the cloud or on-premise in under 3 minutes using any of the following methods.

---

## ⚡ Option 1: Render.com (Recommended — 100% Free Cloud Hosting)

Render connects directly to your GitHub repository and automatically builds and deploys your changes whenever you push to `main`.

### Step-by-Step Instructions:
1. Go to **[https://render.com](https://render.com)** and sign in with your GitHub account.
2. Click **"New +"** in the top navigation bar and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and select `siddharthtomar150-bit/CITYSYNC`.
4. Configure the service settings:
   - **Name:** `citysync`
   - **Language:** `Python 3`
   - **Region:** Any (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch:** `main`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Click **"Create Web Service"**.
6. Render will automatically build the application and provide you with a live public URL (e.g., `https://citysync.onrender.com`).

---

## ⚡ Option 2: Railway.app (Alternative Free Cloud Hosting)

1. Go to **[https://railway.app](https://railway.app)** and log in with GitHub.
2. Click **"New Project"** ➔ **"Deploy from GitHub repo"**.
3. Select `siddharthtomar150-bit/CITYSYNC`.
4. Railway will automatically detect the `Dockerfile` or `railway.json`.
5. Under Settings ➔ Networking, click **"Generate Domain"** to get your public live URL.

---

## 🐳 Option 3: Local or VPS Docker Deployment

If you want to run the containerized application on a VPS (DigitalOcean, AWS EC2, Linode) or locally:

```bash
# Clone the repository
git clone https://github.com/siddharthtomar150-bit/CITYSYNC.git
cd CITYSYNC

# Build and run with Docker Compose
docker compose up -d --build

# Verify container health
docker compose ps
```

The application will be live at `http://localhost:8000` (or `http://YOUR_SERVER_IP:8000`).

To stop:
```bash
docker compose down
```

---

## 🐧 Option 4: Linux VPS (Ubuntu / Debian Systemd Service)

```bash
# 1. Update and install dependencies
sudo apt update && sudo apt install -y python3-pip python3-venv git

# 2. Clone repository
git clone https://github.com/siddharthtomar150-bit/CITYSYNC.git /opt/citysync
cd /opt/citysync

# 3. Setup Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 4. Create Systemd Service
sudo bash -c 'cat > /etc/systemd/system/citysync.service <<EOF
[Unit]
Description=CITYSYNC Smart City Intelligence Platform
After=network.target

[Service]
User=root
WorkingDirectory=/opt/citysync
Environment="PYTHONPATH=/opt/citysync/backend"
ExecStart=/opt/citysync/.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF'

# 5. Start and enable service
sudo systemctl daemon-reload
sudo systemctl enable citysync
sudo systemctl start citysync
```

---

## 🔒 Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | HTTP port used by uvicorn |
| `ENVIRONMENT` | `production` | Environment mode (`development` / `production`) |
| `SIMULATION_AUTO_START` | `true` | Starts background telemetry simulation on boot |
| `SIMULATION_INTERVAL_SECONDS` | `4` | Telemetry cycle generation frequency (in seconds) |
