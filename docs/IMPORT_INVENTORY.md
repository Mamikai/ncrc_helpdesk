# Real Asset Inventory Import Guide — NCRC Help Desk

## Current Status ✓

Your production database is ready:
- **1** Bootstrap Admin account
- **0** Demo accounts (removed)
- **0** Demo tickets (removed)
- **11** Real assets (loaded from inventory audit)
- **15** Departments (required)
- **3** SLA rules (required)

---

## How the System Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Frontend (Browser)                                      │
│     frontend/pages/auth/login.html                          │
│     USE_MOCK = false ← Real API enabled                    │
└──────────────────┬──────────────────────────────────────────┘
                   │ (login, list assets, etc.)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Backend API (PHP)                                       │
│     backend/api/assets/list.php                            │
│     Queries the database via PDO connection                │
└──────────────────┬──────────────────────────────────────────┘
                   │ (SELECT * FROM assets)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Database (MySQL/MariaDB)                               │
│     ncrc_helpdesk database                                 │
│     assets table (11 rows with real equipment)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Setup (What You Did)

### Step 1: Import Schema
- **File**: `database/schema.sql`
- **What it creates**: Tables, indexes, foreign keys
- **Via phpMyAdmin**: Import → Choose File → schema.sql → Go
- **Result**: Empty database structure ready for data

### Step 2: Import Required Seed
- **File**: `database/seed-required.sql`
- **What it contains**: 
  - 1 Bootstrap admin (email: admin@crimeresearch.go.ke)
  - 3 SLA rules (high: 1-4h, medium: 4-24h, low: 24-72h)
  - 15 Departments (predefined NCRC structure)
- **Via phpMyAdmin**: Import → Choose File → seed-required.sql → Go
- **Safety**: This file can be imported multiple times without creating duplicates

### Step 3: Run Demo Teardown (Optional)
- **File**: `database/teardown-demo.sql`
- **What it removes**: Only demo users/tickets/announcements
- **What it KEEPS**: All assets (production data)
- **Via phpMyAdmin**: Import → Choose File → teardown-demo.sql → Go
- **When to run**: Before launching to production (demo accounts won't be visible)

### Step 4: Import Real Inventory
- **File**: `database/seed-inventory.sql`
- **What it contains**: 11 real assets from your official audit
  - Servers (monitors, CPU, keyboards)
  - Network switches & routers
  - WiFi access points
  - UPS systems
- **Via phpMyAdmin**: Import → Choose File → seed-inventory.sql → Go
- **Already done**: ✓ Your 11 assets are in the database

### Asset Status Vocabulary

The workbook has 12 sheets. Its populated status columns contain **Working**, **Require Servicing**, **Faulty**, **Faulty and not serviceable**, **Not serviceable.**, **Obsolete**, and **Obsolete and not rechargeable**. The application normalizes these to **Working**, **Requires Servicing**, **Faulty**, **Faulty and Not Serviceable**, **Not Serviceable**, **Obsolete**, and **Obsolete and Not Rechargeable**, while retaining **Serviceable**, **In Store**, and **Decommissioned** for normal asset operations.

If the database was imported before these statuses were added, run
`database/migration-add-asset-statuses.sql` once in phpMyAdmin. This also adds
representative IDLE-sheet devices so every new status can be tested. New database
installs receive the same status values directly from `database/schema.sql`; run
`database/seed-idle-assets.sql` when those representative rows are needed.

---

## Verify Everything Connects

### Test 1: Check Backend Connection
Open your terminal and run:
```bash
php backend/config/db.php
```
If it returns no error, the backend can talk to the database.

### Test 2: Check Frontend → Backend
1. Open browser: `http://localhost/help-desk-system/frontend/pages/auth/login.html`
2. Log in with:
   - Email: `admin@crimeresearch.go.ke`
   - Password: `FightCrime01` (you'll be forced to change it)
3. Go to **Assets** page
4. **Should see**: All 11 assets from your inventory

### Test 3: Check Assets Are Showing
In phpMyAdmin:
1. Click into `ncrc_helpdesk` → `assets` table
2. Click **Browse**
3. **Should see 11 rows** with real asset data

The inventory status filter includes every status supported by the database:
**Working**, **Serviceable**, **Requires Servicing**, **In Store**, **Faulty**,
**Faulty and Not Serviceable**, **Not Serviceable**, **Obsolete**,
**Obsolete and Not Rechargeable**, and **Decommissioned**.

### Test 4: Verify Database Backups
Make a copy of the entire `ncrc_helpdesk` database:
1. In phpMyAdmin, click `ncrc_helpdesk` database
2. Click **Export** tab
3. Click **Go** 
4. Save the file as `ncrc_helpdesk_backup_YYYYMMDD.sql` somewhere safe
5. Keep this as your emergency recovery copy

---

## The Files Structure (Clean Code)

```
database/
├── schema.sql               ← Creates empty tables
├── seed-required.sql        ← Admin + SLA rules (rerunnable)
├── seed-inventory.sql       ← Real assets (11 items)
├── seed-demo.sql            ← Demo data (don't use in production)
└── teardown-demo.sql        ← Removes only @demo.local rows

frontend/
└── assets/js/api.js         ← USE_MOCK = false (enabled)

backend/
└── config/db.php            ← Connection settings (unchanged)
                               $user = 'root', $pass = ''
```

---

## Deployment Sequence (When Going Live to Real Server)

### Before Moving to Production
1. ✓ Schema imported
2. ✓ Required seed imported
3. ✓ Real inventory imported
4. ✓ Demo teardown run (if you used demo data)
5. ✓ Backend PHP verified
6. ✓ Frontend connects to real API
7. ✓ All 11 assets visible on dashboard
8. Change bootstrap admin password immediately

### When Moving to Real Hosting
1. Export entire database from phpMyAdmin (`ncrc_helpdesk`)
2. Upload via FTP:
   - `frontend/` folder
   - `backend/` folder
   - Keep `database/` scripts as backup in docs
3. On real host: Import database export
4. Update `backend/config/db.php` with host credentials
5. Update `BASE_URL` in `frontend/assets/js/api.js` to your domain

---

## Troubleshooting

### "Assets not showing on dashboard"
1. Check: Is `USE_MOCK = false` in `api.js`?
2. Check: Can you log in? (Try admin/FightCrime01)
3. Check: Go to phpMyAdmin → `assets` table → Browse. Are 11 rows there?

### "Cannot log in / blank page"
1. Check: `backend/config/db.php` has correct credentials
2. Check: MySQL server is running (XAMPP Control Panel → MySQL green)
3. Check: Database `ncrc_helpdesk` exists (phpMyAdmin left sidebar)

### "Want to reset and start over"
1. Export current database as backup
2. Delete `ncrc_helpdesk` database in phpMyAdmin
3. Import `schema.sql` fresh
4. Import `seed-required.sql`
5. Import `seed-inventory.sql`
6. Done!

---

## Summary: Everything is Connected

```
✓ Database schema      → Tables ready
✓ Required data       → Admin + SLA rules + departments loaded
✓ Real inventory      → 11 assets from official audit loaded
✓ Frontend API flag   → USE_MOCK = false (live mode)
✓ Backend connection  → db.php unchanged, using root@localhost
✓ Code is clean       → No manual entries, all from SQL files
```

**Your system is production-ready.** 

Next: Change the bootstrap admin password and create real staff accounts via the admin interface.
