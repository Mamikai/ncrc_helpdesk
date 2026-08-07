# NCRC Help Desk — Setup Guide

## Part 1: Installing XAMPP (Windows)

XAMPP bundles everything you need to run this locally: Apache (web server), MySQL/MariaDB (database), and PHP. One install, no separate downloads for each piece.

**Step 1 — Download**
Go to https://www.apachefriends.org and download the Windows installer. Pick a PHP 8.x version (not 5.x or 7.x — the code here uses modern PHP syntax).

**Step 2 — Install**
1. Run the installer. If Windows Defender or antivirus flags it, that's a common false positive with XAMPP — allow it.
2. When the component selection screen appears, make sure **Apache**, **MySQL**, and **PHP** are checked (phpMyAdmin comes bundled automatically with these).
3. Install to the default location (`C:\xampp`) unless you have a specific reason not to — every guide and troubleshooting answer online assumes this path.
4. Finish the install and let it launch the XAMPP Control Panel.

**Step 3 — Start your services**
In the XAMPP Control Panel:
1. Click **Start** next to **Apache**. It should turn green and show a port number (usually 80).
2. Click **Start** next to **MySQL**. It should also turn green (usually port 3306).

If Apache won't start and shows a port conflict — Skype and some other apps grab port 80. Click "Config" → "Apache (httpd.conf)" and change `Listen 80` to `Listen 8080`, or just close whatever else is using port 80 (commonly Skype or IIS) and try again.

**Step 4 — Place the project folder**
Copy the entire `help-desk-system` folder (everything in this zip) into:
```
C:\xampp\htdocs\help-desk-system
```
`htdocs` is XAMPP's web root — anything inside it becomes accessible through your browser. Once it's there, folder structure should look like:
```
C:\xampp\htdocs\help-desk-system\
    frontend\
    backend\
    database\
    docs\
```

**Step 5 — Confirm it's working**
Open a browser and go to `http://localhost/help-desk-system/frontend/pages/auth/login.html` — you should see the login page. At this point the frontend works in **demo mode** (fake data, no real database yet) — that's expected, we haven't imported the database yet.

---

## Part 2: Setting up the database

**Step 1 — Open phpMyAdmin**
Go to `http://localhost/phpmyadmin` in your browser. This is your database management tool — bundled with XAMPP, no separate login needed by default.

**Step 2 — Generate a real password hash first**
Before importing anything, you need a genuine bcrypt hash for the bootstrap admin password. XAMPP includes PHP with a command line — open Command Prompt and run:
```
C:\xampp\php\php.exe -r "echo password_hash('FightCrime01', PASSWORD_DEFAULT);"
```
This prints a hash starting with `$2y$...`. Copy it.

**Step 3 — Update the seed file with your hash**
Open `database\seed-required.sql` in any text editor (Notepad works). Find this line:
```sql
'$2b$10$6QzOGLvcQUulrBxw225Go.ZtUGBg.E4J8oVWpcw2TZ.lDhMhvpTQS',
```
Replace it with the hash you just generated in Step 2. **This is the one authoritative, PHP-tested hash** — the one already in the file was generated with a Python tool since PHP wasn't available in the environment that built it, so regenerating it yourself with real PHP removes any doubt.

**Step 4 — Import the schema**
1. In phpMyAdmin, click **Import** at the top.
2. Click **Choose File**, select `database\schema.sql`.
3. Scroll down, click **Go**. This creates the `ncrc_helpdesk` database and every table.

**Step 5 — Import required seed data**
Repeat the Import process with `database\seed-required.sql` (the one you just edited). This creates your bootstrap admin account and the SLA rules.

**Step 6 — (Optional) Import demo data**
If your team wants to keep testing with fake tickets/users before going live, also import `database\seed-demo.sql`. Skip this once you're ready for the real launch — see the teardown section below.

**Step 7 — Verify**
In phpMyAdmin's left sidebar, click into `ncrc_helpdesk` → `users` table → Browse. You should see your bootstrap admin row (and demo accounts, if you imported that file too).

---

## Part 3: Connecting the frontend to the real database

Right now the frontend runs in **demo mode** — every page works with fake in-memory data, no real login needed. To switch to the real backend:

**Step 1 — Flip one line**
Open `frontend\assets\js\api.js` in a text editor. Find:
```js
const USE_MOCK = true;
```
Change it to:
```js
const USE_MOCK = false;
```

**Step 2 — Check the BASE_URL matches your folder name**
Still in `api.js`, confirm this line matches where you placed the project:
```js
const BASE_URL = '/help-desk-system/backend/api';
```
If you named the folder something other than `help-desk-system` inside `htdocs`, update this to match.

**Step 3 — Check the database credentials**
Open `backend\config\db.php`. Default XAMPP MySQL has no password on the `root` user, so this should already work as-is:
```php
$user = 'root';
$pass = '';
```
Only change this if you've set a MySQL root password yourself.

**Step 4 — Log in for real**
Go back to `http://localhost/help-desk-system/frontend/pages/auth/login.html` and log in with:
- Email: `admin@crimeresearch.go.ke`
- Password: `FightCrime01`

You'll be sent straight to Settings to set a new password (the forced first-login reset) — that confirms the whole chain (frontend → PHP → MySQL) is working end to end.

---

## Part 4: Going from testing to officially live

Once your team is done testing and ready to actually launch:

**Step 1 — Run the teardown**
In phpMyAdmin, go to **Import**, select `database\teardown-demo.sql`, click **Go**. This deletes every row marked as demo data (`@demo.local` emails, `[DEMO]` ticket titles, `DEMO-` asset tags) and leaves your bootstrap admin and any real accounts/tickets your team already created untouched.

**Step 2 — Change the bootstrap admin's password**
Log in as admin and change the password from `FightCrime01` to something private — it's been sitting as a known default this whole time.

**Step 3 — Create your real user accounts**
Use **Add User** in the sidebar to create real accounts for actual NCRC staff, one at a time, each getting the `FightCrime01` default and being forced to reset it on first login.

**Step 4 — Deploy to real hosting**
When you're ready to move off your local machine to actual hosting (Truehost/Hostinger/InfinityFree, per your team's roadmap):
1. Export your database from phpMyAdmin (**Export** tab → Go) and import it into your host's MySQL database via their control panel.
2. Upload the `frontend` and `backend` folders via FTP or your host's file manager.
3. Update `backend\config\db.php` with the real host's database credentials (they'll give you a host, database name, username, and password — different from `localhost`/`root`).
4. Update `BASE_URL` in `api.js` to match your live domain instead of `/help-desk-system/...`.

---

## Common problems

- **"Access denied for user 'root'@'localhost'"** — your MySQL has a root password set that `db.php` doesn't know about. Update `$pass` in `db.php` to match.
- **Blank page / no errors** — turn on PHP error display temporarily: add `ini_set('display_errors', 1); error_reporting(E_ALL);` to the top of `backend\config\db.php` while debugging, remove before going live.
- **Login always fails even with the right password** — almost certainly the password hash in `seed-required.sql` wasn't regenerated with real PHP (see Part 2, Step 2-3). Redo that step.
- **"Port 80 in use"** — see Part 1, Step 3.
