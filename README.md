# CNC Operating System

**Clinical Nursing Consultancy — Home Care Division**

A complete web-based operating system for managing all CNC clinical and operational functions. Runs in any browser, from any device, at any CNC site.

---

## Quick start (run on your computer in 2 minutes)

### Requirements
- [Node.js](https://nodejs.org) version 18 or higher (free download)
- Any modern web browser

### Step 1 — Install dependencies
Open a terminal / command prompt in this folder and run:
```
npm install
```

### Step 2 — Start the system
```
node server.js
```

You will see:
```
✅ CNC Operating System running at http://localhost:3000
   Default login: director@cnc.com / Director2026!
```

### Step 3 — Open in your browser
Go to: **http://localhost:3000**

---

## Login credentials (change these immediately in production)

| Role | Email | Password |
|------|-------|----------|
| Clinical Director | director@cnc.com | Director2026! |
| Supervisor A | supa@cnc.com | SupervisorA1! |
| Supervisor B | supb@cnc.com | SupervisorB1! |
| Practical Nurse | pnbrown@cnc.com | PN_Brown2026! |
| Practical Nurse | pndavis@cnc.com | PN_Davis2026! |
| Practical Nurse | pnrichards@cnc.com | PN_Rich2026! |

---

## What each role can access

| Feature | Director | Supervisor | Nurse |
|---------|----------|------------|-------|
| Dashboard | ✅ Full | ✅ Full | ✅ Own patients |
| EHR — view | ✅ All patients | ✅ All patients | ✅ Own patients only |
| EHR — add vitals/notes | ✅ | ✅ | ✅ |
| Register new patient | ✅ | ✅ | ❌ |
| Care plans | ✅ Create/edit | ✅ Create/edit | ✅ View only |
| 24-hour reports | ✅ | ✅ File + view | ❌ |
| Supervisory rounds | ✅ | ✅ Log + view | ❌ |
| Inventory | ✅ Full | ✅ Full | ✅ View only |
| Equipment rental | ✅ Full | ✅ Full | ❌ |
| Staff management | ✅ Full | ✅ View | ❌ |
| Incidents | ✅ Full | ✅ Log + close | ✅ Log only |
| Settings / user management | ✅ | ❌ | ❌ |

---

## Deploying to the internet (so nurses can access from any site)

### Option A — Render.com (free tier, recommended)
1. Create a free account at [render.com](https://render.com)
2. Click **New Web Service**
3. Connect to a GitHub repository containing this code, OR use **Upload files** (drag the whole cnc-app folder)
4. Set:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Environment variable:** `SESSION_SECRET` = any long random string (e.g. `cnc-jamaica-2026-xyz-abc-secret-key`)
5. Click **Deploy**
6. Your system will be live at a URL like `https://cnc-system.onrender.com`
7. Share that URL with all nurses and supervisors

### Option B — Railway.app (free tier)
1. Create account at [railway.app](https://railway.app)
2. New project → Deploy from GitHub or upload folder
3. Add environment variable `SESSION_SECRET`
4. Railway auto-detects Node.js and deploys

### Option C — On a local office computer (always-on)
If you have a computer in the office that stays on:
1. Install Node.js on that computer
2. Run `node server.js`
3. Note the computer's local IP address (e.g. 192.168.1.5)
4. Nurses on the same WiFi network access: `http://192.168.1.5:3000`
5. For internet access outside the office, use a service like [ngrok](https://ngrok.com) (free)

---

## Data storage
All data is stored in `data/db.json` — a simple JSON file on the server. This file is created automatically on first run with sample data.

**To back up your data:** copy `data/db.json` to a safe location daily.

**To reset to sample data:** delete `data/db.json` and restart the server.

---

## Adding new users
Only the Clinical Director account can add new users. Sign in as director, navigate to **Settings**, and use the user management section.

Or add them directly to `data/db.json` following the existing user format, using a SHA-256 hash of the password.

---

## Customising the system
All files are plain text — no compilation needed:
- **`server.js`** — all backend logic and API routes
- **`public/app.js`** — all frontend page logic
- **`public/app.css`** — all styles and colours
- **`public/index.html`** — main app shell
- **`public/login.html`** — login page
- **`data/db.json`** — all data (auto-created)

---

## Security notes for production
1. Change all default passwords immediately
2. Set a strong `SESSION_SECRET` environment variable
3. Use HTTPS (Render and Railway provide this automatically)
4. Back up `data/db.json` daily
5. Restrict access to the server — only share the URL with CNC staff

---

## Support
This system was built for Clinical Nursing Consultancy, Jamaica.
For modifications or support, share this codebase with a developer.
