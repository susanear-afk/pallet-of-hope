# 🧡 The Giving Pallet Foundation — Full Stack Setup

## Project Structure

```
pallet-of-hope/          ← Frontend (HTML/CSS/JS)
  index.html             ← Homepage
  apply.html             ← Application form
  css/style.css
  js/main.js
  js/apply.js

pallet-of-hope-backend/  ← Backend (Node.js / Express)
  server.js              ← Main server
  admin/index.html       ← Admin dashboard
  data/applications.json ← All submitted applications (auto-created)
  uploads/               ← Uploaded documents (auto-created)
  .env.example           ← Copy to .env and fill in your values
```

---

## Quick Start (5 minutes)

### 1. Install Node.js
Download from https://nodejs.org (version 18 or higher)

### 2. Install dependencies
```bash
cd pallet-of-hope-backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in your email settings (see Email Setup below).

### 4. Start the server
```bash
node server.js
```

### 5. Open in browser
- **Website:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin
- **API:** http://localhost:3000/api

---

## Email Setup (Gmail Recommended)

1. Go to your Gmail account → Google Account Settings
2. Navigate to Security → 2-Step Verification (must be ON)
3. Go to Security → App Passwords
4. Create a new App Password for "Mail"
5. Copy the 16-character password into your `.env` file

```env
EMAIL_USER=your-foundation-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   ← your 16-char app password
ADMIN_EMAIL=you@email.com        ← where admin alerts go
```

If email is not configured, the server still works — applications are saved, emails are just skipped.

---

## Admin Dashboard Features

- **Dashboard** — stats overview + recent applications
- **All Applications** — filter by status, search by name/email
- **Approved** — list of approved families ready for pallet distribution
- **Waitlist** — families queued for next cycle
- **Application Detail Modal:**
  - Full contact, family, and personal statement
  - Document viewer
  - Scoring rubric (1–5 stars across 4 criteria = 20 points max)
  - Status update (Pending / Approved / Waitlisted / Declined)
  - Internal review notes

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/apply | Submit new application (multipart/form-data) |
| GET | /api/applications | List all applications (summary) |
| GET | /api/applications/:id | Get single application (full) |
| PATCH | /api/applications/:id/status | Update status + notes |
| GET | /api/stats | Dashboard statistics |

---

## Going Live (When Ready)

When you're ready to launch publicly:

1. **Host options:** Railway, Render, Heroku, DigitalOcean (all have free/cheap tiers)
2. **Replace JSON storage** with a real database (MongoDB Atlas is free and easy)
3. **Add admin authentication** — right now admin is open, needs a login
4. **Get a domain** — something like palletofhope.org
5. **SSL certificate** — free via Let's Encrypt / most hosts include this

---

## Support

Built with ❤️ for The Giving Pallet Foundation.
