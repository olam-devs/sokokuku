# SokoKuku — Claude Deploy Guidelines

Laravel 13 + React 19 + Vite 8 PWA for poultry demand aggregation.  
Live at: **https://sokokuku.olamtec.co.tz**

---

## Server Access

```
SSH:  ssh -p 22 olamtecc@vda6000.is.cc
      (uses ~/.ssh/id_ed25519 — no password prompt)
```

App root on server:
```
~/domains/sokokuku.olamtec.co.tz/public_html/
```
Document root (served by Apache): `public_html/` → forwarded to `public/` via `.htaccess`

---

## PHP

The server default PHP is 8.2. SokoKuku requires PHP 8.4.  
Always use the full path for PHP and Artisan on the server:

```bash
PHP84=/opt/alt/php84/usr/bin/php
$PHP84 artisan <command>

# Composer (server-wide):
$PHP84 /usr/local/bin/composer <command>
```

---

## Database

| Key      | Value                   |
|----------|-------------------------|
| Host     | localhost               |
| Database | `olamtecc_sokokuku`     |
| User     | `olamtecc_sokokuku`     |
| Engine   | InnoDB (forced in `config/database.php`) |

> The server's MySQL `default_storage_engine` is MyISAM.  
> `config/database.php` has `'engine' => 'InnoDB'` to override this — do NOT remove it.

---

## First-Time Deploy

```bash
ssh -p 22 olamtecc@vda6000.is.cc
cd ~/domains/sokokuku.olamtec.co.tz/public_html

PHP84=/opt/alt/php84/usr/bin/php

# 1. Pull latest code
git pull origin main

# 2. Install PHP dependencies
$PHP84 /usr/local/bin/composer install --no-dev --optimize-autoloader

# 3. Write .env (copy .env.example and fill in values)
cp .env.example .env
# Edit .env: set APP_KEY, DB credentials, APP_URL, etc.

# 4. Generate app key
$PHP84 artisan key:generate --force

# 5. Fix permissions
chmod -R 775 storage bootstrap/cache

# 6. Create storage symlink
$PHP84 artisan storage:link

# 7. Run migrations
$PHP84 artisan migrate --force --seed

# 8. Cache config/routes/views
$PHP84 artisan config:cache
$PHP84 artisan route:cache
$PHP84 artisan view:cache
```

Then build the React frontend locally and upload (see **Frontend Build** below).

---

## Routine Deploy (code updates)

```bash
ssh -p 22 olamtecc@vda6000.is.cc '
  PHP84=/opt/alt/php84/usr/bin/php
  APP=~/domains/sokokuku.olamtec.co.tz/public_html
  cd $APP
  git pull origin main
  $PHP84 /usr/local/bin/composer install --no-dev --optimize-autoloader
  $PHP84 artisan migrate --force
  $PHP84 artisan config:cache
  $PHP84 artisan route:cache
  $PHP84 artisan view:cache
'
```

Then rebuild and re-upload the frontend if React/Vite files changed.

---

## Frontend Build

Build runs **locally** (not on server — server hits thread limits with Rolldown).

Requirements: Node >=20.19.0 (Vite 8 minimum). If local Node is older, install
`@rolldown/binding-win32-x64-msvc` manually first:

```powershell
# Windows
npm install @rolldown/binding-win32-x64-msvc
npm run build
```

```bash
# Linux/Mac
npm install
npm run build
```

Upload built assets to server:

```bash
scp -P 22 -r public/build olamtecc@vda6000.is.cc:~/domains/sokokuku.olamtec.co.tz/public_html/public/
```

---

## SSL Certificates

**Current setup:** A single Let's Encrypt wildcard cert covers `*.olamtec.co.tz`, `olamtec.co.tz`,
and `sandbox.darasa.olamtec.co.tz` (3-level subdomains need explicit SANs — wildcards don't cover them).

**Cert location on server:** `~/.acme.sh/olamtec.co.tz_ecc/`  
**Renewal:** acme.sh renews automatically; next window ~2026-11-19.

### Re-issuing the wildcard cert

HTTP-01 challenges are blocked by LiteSpeed at server level. **Always use DNS-01 via the DA plugin:**

```bash
ssh -p 22 olamtecc@vda6000.is.cc

export DA_Api="https://olamtecc:<DA_PASS>@vda6000.is.cc:2222"
export DA_Api_Insecure=1

~/.acme.sh/acme.sh --issue --server letsencrypt \
  -d olamtec.co.tz \
  -d "*.olamtec.co.tz" \
  -d sandbox.darasa.olamtec.co.tz \
  --dns dns_da --force
```

Then deploy to DirectAdmin (this replaces the active cert for `olamtec.co.tz` and all subdomains):

```bash
export DirectAdmin_ENDPOINT="vda6000.is.cc:2222"
export DirectAdmin_USERNAME="olamtecc"
export DirectAdmin_KEY="<DA_PASS>"
export DirectAdmin_MAIN_DOMAIN="olamtec.co.tz"
~/.acme.sh/acme.sh --deploy -d olamtec.co.tz --deploy-hook directadmin
```

> **WARNING:** The deploy hook replaces the ENTIRE `olamtec.co.tz` cert. If the issued cert does not
> include all required subdomains, those subdomains will break. Always issue for `*.olamtec.co.tz`
> (not a subdomain-only cert) so all sites remain covered.

---

## DirectAdmin API (must be called FROM the server)

The DA control panel only accepts API calls from the server's own IP.  
Always SSH in first, then call the API:

```bash
ssh -p 22 olamtecc@vda6000.is.cc "curl -sk -4 -u 'olamtecc:<DA_PASS>' https://vda6000.is.cc:2222/CMD_API_..."
```

---

## Known Server Quirks

| Issue | Fix applied |
|-------|-------------|
| `default_storage_engine=MyISAM` causes InnoDB key-length errors | `config/database.php` sets `'engine' => 'InnoDB'` |
| Default PHP 8.2 too old | Use `/opt/alt/php84/usr/bin/php` |
| Vite 8/Rolldown panics on server (thread limits) | Build locally, SCP `public/build/` |
| Apache document root is `public_html/`, not `public_html/public/` | `public_html/.htaccess` rewrites to `public/` transparently |
| `Schema::defaultStringLength(191)` needed | Set in `AppServiceProvider::boot()` |
| HTTP-01 ACME challenge fails (LiteSpeed blocks it) | Use DNS-01 via `dns_da` acme.sh plugin |
| DA deploy hook replaces the whole domain cert | Always issue wildcard `*.olamtec.co.tz`, not subdomain-only |

---

## Environment Variables (.env)

Key variables to set on the server:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://sokokuku.olamtec.co.tz

DB_DATABASE=olamtecc_sokokuku
DB_USERNAME=olamtecc_sokokuku

SANCTUM_STATEFUL_DOMAINS=sokokuku.olamtec.co.tz
SESSION_DOMAIN=sokokuku.olamtec.co.tz
```
