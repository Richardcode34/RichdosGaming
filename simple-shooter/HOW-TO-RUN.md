# Richdos Gaming Website - How To Run

## Fastest local run (this PC only)
Use this when only your own computer needs to play.

```powershell
Start-Process "D:\simple-shooter\index.html"
```

Or double-click `start-local-game.bat`.

## LAN run (other people in your house)
Use this when phones/laptops on the same Wi-Fi should connect and share leaderboard data.

1. Start the LAN server:

```powershell
Set-Location D:\simple-shooter
.\run-lan-server.ps1 -Port 5501
```

2. Keep that terminal open.
3. Open this URL on other devices:

`http://192.168.5.155:5501/`

4. Everyone should use a different player name.
5. Open `Leaderboard` from the site menu to see shared rankings.

## Important: Windows Firewall step
If other devices cannot connect, add the firewall allow rule once.

Run PowerShell as **Administrator**, then run:

```powershell
Set-Location D:\simple-shooter
.\enable-lan-firewall.ps1
```

One-click option (recommended):

- Double-click `enable-lan-firewall-admin.bat`
- Click **Yes** on the Windows admin popup

Manual command (admin):

```powershell
New-NetFirewallRule -DisplayName "Richdos Gaming LAN 5501" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5501 -Profile Private
```

## Notes
- Direct file launch is local-only and does not share leaderboard across devices.
- Shared leaderboard works when everyone is using the LAN URL from the same running server.
- `run-lan-server.ps1` serves the folder where the script is located, so it is path-portable.

## Finish Everything In One Click
If you want to complete all remaining setup checks quickly:

- Double-click `finish-setup.bat`

This will:
- start the LAN server if needed,
- request admin permission for firewall setup,
- print your current LAN URL to share.

## Public HTTPS Link (outside your house)
If you want people anywhere to use your site with HTTPS:

1. Keep LAN server running:

```powershell
Set-Location D:\simple-shooter
.\run-lan-server.ps1 -Port 5501
```

2. Install Cloudflare tunnel tool one time:

```powershell
winget install --id Cloudflare.cloudflared -e
```

3. Start secure public link:

```powershell
Set-Location D:\simple-shooter
.\start-public-https.ps1
```

4. Share the `https://...trycloudflare.com` link printed in terminal.

Notes:
- Keep both terminals open while people are connected.
- This is secure HTTPS and works globally.
- Language selector is available in Account page for international users.

## Permanent Free Website (GitHub Pages)
Use this if you want a stable public website URL that stays online.

1. Create a GitHub repository and upload this full folder.
2. Keep the workflow file in this project:

	`.github/workflows/deploy-pages.yml`

3. Push to branch `main`.
4. In GitHub, open your repo:
	- `Settings -> Pages`
	- Source: `GitHub Actions`
5. Wait for the deploy workflow to finish.
6. Your site URL will be:

	`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Important backend note
GitHub Pages is static hosting.

- Pages/UI/music/game links work.
- PowerShell API features from `run-lan-server.ps1` do not run on GitHub Pages.

Features like shared LAN leaderboard, moderation API, room APIs, and server-side resets require a real backend (for example Cloudflare Workers, Supabase, or Firebase).
