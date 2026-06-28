# Richdos Gaming Website

Richdos Gaming is a multi-page browser game portal with account/progression, inventory/shop systems, moderation/staff tools, messaging, updates, and LAN-sharing support.

## Features

- Multi-page game hub with quick access links
- Account progression (rank points, credits, levels)
- Inventory, profile pics, tags, shop, and streak systems
- Messaging with profanity filtering
- AI auto-moderation mute for bullying in messages
- Staff tools (owner/admin/mod/helper roles)
- Report panel and help ticket system
- Shared LAN APIs via PowerShell server

## Project Structure

- `index.html` - main hub
- `games/` - game pages
- `player-system.js` - shared account/game/staff logic
- `music-system.js` - adaptive background music
- `run-lan-server.ps1` - local/LAN API server
- `smoke-tests.ps1` - quick validation checks
- `.github/workflows/deploy-pages.yml` - GitHub Pages auto-deploy workflow

## Run Locally (Single PC)

Open the main page directly:

```powershell
Start-Process "D:\simple-shooter\index.html"
```

Or run `start-local-game.bat`.

## Run on LAN (Shared in House/Wi-Fi)

1. Start server:

```powershell
Set-Location D:\simple-shooter
.\run-lan-server.ps1 -Port 5501
```

2. Keep terminal open.
3. Open from another device using your LAN URL (example):

`http://192.168.5.155:5501/`

## Optional Firewall Rule (if LAN clients cannot connect)

Run as Administrator:

```powershell
Set-Location D:\simple-shooter
.\enable-lan-firewall.ps1
```

Or run `enable-lan-firewall-admin.bat`.

## Public HTTPS (Temporary Tunnel)

Use Cloudflare tunnel while your PC/server is running:

1. Start LAN server (`run-lan-server.ps1`).
2. Install cloudflared once:

```powershell
winget install --id Cloudflare.cloudflared -e
```

3. Start public tunnel:

```powershell
Set-Location D:\simple-shooter
.\start-public-https.ps1
```

## Permanent Free Website (GitHub Pages)

This repo already includes a Pages workflow.

1. Push project to GitHub (`main` branch).
2. In GitHub repo, open `Settings -> Pages`.
3. Set source to `GitHub Actions`.
4. Wait for workflow to complete.
5. Site URL format:

`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Important Hosting Note

GitHub Pages is static hosting.

Works on Pages:

- HTML/CSS/JS pages
- game navigation and front-end UI

Does not run on Pages:

- PowerShell API backend (`run-lan-server.ps1`)
- LAN shared API endpoints (`/api/accounts`, `/api/rooms`, moderation endpoints)

To keep backend features online, migrate API endpoints to a cloud backend (for example: Cloudflare Workers, Supabase, or Firebase).

## Smoke Test

Run quick checks:

```powershell
Set-Location D:\simple-shooter
powershell -ExecutionPolicy Bypass -File .\smoke-tests.ps1
```

## License

No license file is currently included. Add one if you plan to distribute publicly.
