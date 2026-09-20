# SokoKuku 🐔

**Poultry Demand & Supply Aggregation Platform — Tanzania**

SokoKuku (Swahili: *Chicken Market*) is an asset-light platform that connects poultry buyers (hotels, restaurants, shops, supermarkets) with local farmers and suppliers. Field agents survey buyers on the ground, capturing demand data on their phones — even offline — while admins analyse the data and plan delivery routes from a web dashboard.

---

## Business Context

### The Problem

Poultry (eggs in trays of 30, broiler chickens) is one of Tanzania's most consumed proteins, yet the supply chain is fragmented:

- Buyers scramble daily to find reliable stock at fair prices.
- Farmers have no visibility into where demand is — they sell to middlemen at low margins.
- No single actor knows the true aggregate weekly demand across a city.

### The Approach

**Collect verified demand first. Prove transactions manually. Then build software around proven workflows.**

1. **Phase 1 (now):** Field agents survey buyers face-to-face and register farmers they meet in the field. All data feeds a central admin dashboard.
2. **Phase 2:** Match verified demand clusters with nearest suppliers, coordinate first deliveries manually.
3. **Phase 3:** Build ordering, payment, and logistics automation once volume justifies it.

### Products

| Product | Unit | Notes |
|---------|------|-------|
| Eggs | Tray of 30 | Graded (small / large / mixed) |
| Broiler chicken | Live bird (kg) | Preferred weight 1.5–2.5 kg |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Laravel 13 (PHP 8.4) |
| Auth | Laravel Sanctum (API token) |
| Database | SQLite (local dev) → MySQL (production) |
| Frontend | React 18 + Vite, Tailwind CSS v4 |
| PWA | vite-plugin-pwa + Workbox service worker |
| Offline storage | IndexedDB via `idb` |
| Maps | Leaflet.js + react-leaflet + OpenStreetMap |
| Geocoding | Nominatim API (free, no key required) |
| GPS | `watchPosition` (continuous, ≤15 m target) |
| Hosting | Evolution Hosting (shared PHP hosting) |

---

## Features

### Field Agent App (PWA — mobile-first)

#### 📋 Survey Tab — Buyer Survey
- Business name, type (hotel/restaurant/shop/supermarket/institution/other)
- Area, address, contact person & phone
- **GPS capture** — uses `watchPosition` for continuous acquisition; stops at ≤15 m accuracy or after 30 s (keeps best reading). Indicator: green ≤10 m / yellow ≤25 m / orange >25 m.
- **Reverse geocoding** — Nominatim converts coordinates to `place_name`, `ward`, `district` automatically.
- **Egg demand** — trays per purchase, frequency (chip picker + free text), price per tray, grade, current supplier.
- **Chicken demand** — birds per week, frequency, price per bird, preferred weight, current supplier.
- **Interest in supply** — three-state button: Interested / Maybe / Not interested.
- Marketing permission checkbox + notes.
- **Offline-first** — surveys are saved to IndexedDB if the network is unavailable. A yellow sync bar shows the pending count and lets agents sync manually. Sync also fires on `visibilitychange` (app comes to foreground) — iOS Safari workaround for the missing Background Sync API.
- Each survey carries an `offline_uuid` (UUID v4) — the server deduplicates on this field, so retrying a failed sync is always safe.

#### 🌾 Supplier Tab — Farmer Registration
- Farmer name, phone, area, address.
- GPS capture + reverse geocoding (same as above).
- Delivery capability: can deliver to buyer / buyer can collect.
- Products: Supplies Eggs (trays/week, price/tray, current stock) and/or Supplies Chicken (birds/week, price/bird, avg weight, current stock, next harvest date).
- Notes.

### Admin Dashboard (web)

#### Overview
- Total businesses surveyed, egg buyers (+ total trays/purchase), chicken buyers (+ total birds/week), interested prospects.
- Recent 10 visits table.

#### Businesses
- Filterable, paginated list (by area, type, product, interest level).
- Columns: Business, Type, Area, Ward, Eggs (trays + frequency), Chicken, Interest, Agent.
- **Export CSV** — includes ward, district, frequency columns.

#### Suppliers
- Filterable list of registered farmers (by area, district, product).
- Columns: Name, Phone, Area, District, Eggs/wk, Chickens/wk, Delivery capability, Agent.
- **Export CSV**.

#### Map
- Interactive Leaflet map with two toggleable layers:
  - **Buyers** — colour-coded by interest (green = interested, yellow = maybe, red = not interested).
  - **Suppliers** — blue markers.
- Popups with name, area, product summary.

#### Clusters
- Businesses grouped hierarchically by **district → ward** (populated by Nominatim during GPS capture).
- Shows business name chips + egg/chicken buyer counts per ward.
- Purpose: plan efficient delivery routes by geographic proximity.

#### Agents
- List of field agents with survey counts.
- Create new agent accounts (admin only).

---

## Database Schema

```
users
  id, name, email, phone, role (admin|field_agent), active, password

businesses
  id, name, type, contact_person, contact_phone, address, area
  latitude, longitude, gps_accuracy, gps_captured_at
  place_name, ward, district          ← from Nominatim
  field_agent_id → users

egg_demands
  id, business_id, buys_eggs, trays_per_purchase
  frequency (string, free text), price_per_tray, grade, current_supplier

chicken_demands
  id, business_id, buys_chicken, birds_per_week
  frequency (string, free text), price_per_bird
  preferred_weight_kg, current_supplier

survey_visits
  id, business_id, field_agent_id
  interested_in_supply (yes|maybe|no)
  marketing_permission, notes
  offline_uuid (unique), visited_at, synced_at

farmers
  id, name, phone, address, area
  latitude, longitude, gps_accuracy, gps_captured_at
  place_name, ward, district
  can_deliver, can_collect, notes
  field_agent_id → users

farmer_products
  id, farmer_id, product_type (egg|chicken)
  egg_trays_per_week, egg_price_per_tray
  chicken_birds_per_week, chicken_price_per_bird
  chicken_avg_weight_kg, current_stock, next_harvest_date
```

---

## API Routes

All routes are prefixed `/api`.

```
POST   /login                        ← public
GET    /me                           ← auth:sanctum
POST   /logout                       ← auth:sanctum
POST   /surveys                      ← auth:sanctum
POST   /surveys/batch                ← auth:sanctum (up to 50 per call)
POST   /farmers                      ← auth:sanctum

GET    /dashboard/stats              ← auth:sanctum + admin
GET    /dashboard/businesses         ← auth:sanctum + admin
GET    /dashboard/map                ← auth:sanctum + admin
GET    /dashboard/agents             ← auth:sanctum + admin
POST   /dashboard/agents             ← auth:sanctum + admin
GET    /dashboard/farmers            ← auth:sanctum + admin
GET    /dashboard/farmers/map        ← auth:sanctum + admin
```

The React SPA is served by a Laravel catch-all web route. All other paths return `resources/views/app.blade.php`.

---

## Local Development Setup

### Prerequisites

- PHP 8.4 (via [Laravel Herd](https://herd.laravel.com/) or any PHP manager)
- Composer 2
- Node.js 20+ and npm

### Steps

```bash
# 1. Clone
git clone https://github.com/olam-devs/sokokuku.git
cd sokokuku

# 2. Install PHP dependencies
composer install

# 3. Install JS dependencies
npm install

# 4. Environment
cp .env.example .env
php artisan key:generate
```

Edit `.env` — for local dev, SQLite is pre-configured:

```env
DB_CONNECTION=sqlite
# DB_DATABASE is auto-resolved to database/database.sqlite
```

```bash
# 5. Create DB and run migrations
touch database/database.sqlite
php artisan migrate --seed

# 6. Start servers (two terminals)
php artisan serve          # Laravel API on http://127.0.0.1:8000
npm run dev                # Vite dev server (proxy to Laravel)
```

Open http://127.0.0.1:8100 (Vite proxy) or the Herd domain if using Herd.

### Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sokokuku.co.tz | admin1234 |
| Field Agent | agent@sokokuku.co.tz | agent1234 |

---

## Production Deployment (Evolution Hosting — Shared PHP)

Shared hosting has no Node.js server, no supervisor, and no shell npm. The deployment strategy:

1. **Build React locally**
   ```bash
   npm run build
   # outputs to public/build/
   ```

2. **Upload via FTP/cPanel File Manager**
   - All PHP files (app, bootstrap, config, database, resources/views, routes, storage, public except build)
   - `public/build/` (compiled JS/CSS assets)
   - `composer.json`, `composer.lock`

3. **On the server (cPanel Terminal or SSH)**
   ```bash
   composer install --no-dev --optimize-autoloader
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

4. **Environment** — set `.env` on the server:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://sokokuku.co.tz

   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_DATABASE=your_db
   DB_USERNAME=your_user
   DB_PASSWORD=your_password

   SANCTUM_STATEFUL_DOMAINS=sokokuku.co.tz
   SESSION_DOMAIN=sokokuku.co.tz
   ```

5. **Document root** — point the domain to `public/` in cPanel.

6. **`.htaccess`** — already included in `public/.htaccess` for Apache URL rewriting.

---

## Project Roadmap

### V1 — Field Data Collection ✅ (current)
- [x] Agent login (Sanctum token)
- [x] Buyer survey with offline queue + sync
- [x] Farmer/supplier registration
- [x] GPS capture with accuracy indicator
- [x] Nominatim reverse geocoding (ward/district)
- [x] Admin dashboard: overview, businesses, suppliers, map, clusters
- [x] CSV export (businesses + suppliers)
- [x] iOS PWA support (apple-mobile-web-app meta tags, visibilitychange sync)

### V2 — Demand Matching
- [ ] Cluster demand totals and match with nearest farmer
- [ ] Demand vs. supply gap report per district/ward
- [ ] Agent notification: "Visit these 3 buyers this week"
- [ ] Farmer availability calendar (mark harvest dates)

### V3 — Order Coordination
- [ ] Admin creates a supply order: buyer ↔ farmer ↔ date ↔ quantity
- [ ] Agent confirms delivery on mobile
- [ ] Basic invoice/receipt generation (PDF)
- [ ] SMS notification to buyer and farmer (Africa's Talking API)

### V4 — Automation & Scale
- [ ] Buyer self-service portal (place standing orders)
- [ ] Farmer app: list available stock, see incoming orders
- [ ] Automated route optimisation (delivery batching by ward)
- [ ] Payment tracking (M-Pesa / Tigopesa integration)
- [ ] Analytics: price trends, seasonal demand, best-performing agents

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Offline-first IndexedDB queue | Field agents often work in areas with poor connectivity |
| `offline_uuid` deduplication | Safe retry — submitting the same survey twice is idempotent |
| `watchPosition` instead of `getCurrentPosition` | Continuous GPS acquisition achieves ≤15 m accuracy; one-shot often returns 50–200 m |
| Nominatim (OpenStreetMap) geocoding | Free, no API key, works well for Tanzanian ward/district boundaries |
| Free-text frequency field | Buyer purchasing patterns vary widely; predefined enums missed real-world patterns |
| `visibilitychange` sync trigger | iOS Safari has no Background Sync API; syncing when app is foregrounded is the reliable alternative |
| Laravel catch-all web route | Serves the React SPA from the same origin as the API — no CORS config needed, works on shared hosting |
| Build React locally, upload `public/build/` | Shared hosting has no Node.js; this keeps the server dependency footprint minimal |

---

## Repository Structure

```
sokokuku/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── SurveyController.php
│   │   │   ├── FarmerController.php
│   │   │   └── DashboardController.php
│   │   └── Middleware/
│   │       └── AdminMiddleware.php
│   └── Models/
│       ├── User.php, Business.php, EggDemand.php
│       ├── ChickenDemand.php, SurveyVisit.php
│       ├── Farmer.php, FarmerProduct.php
├── database/migrations/        ← full schema
├── database/seeders/           ← admin + agent seed users
├── resources/
│   ├── css/app.css             ← Tailwind v4 + .input component class
│   ├── js/
│   │   ├── app.jsx             ← React root, routing, AgentShell
│   │   ├── Pages/
│   │   │   ├── Login.jsx
│   │   │   ├── AgentSurvey.jsx
│   │   │   ├── AgentFarmer.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── Components/
│   │   │   ├── GPSCapture.jsx  ← reusable GPS widget
│   │   │   └── FrequencyInput.jsx ← chip picker + free text
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx
│   │   │   └── useGPS.js
│   │   └── lib/
│   │       ├── api.js          ← axios instance with Sanctum token
│   │       └── offlineQueue.js ← IndexedDB via idb
│   └── views/app.blade.php    ← SPA shell + iOS PWA meta tags
├── routes/
│   ├── api.php                 ← all /api routes
│   └── web.php                 ← catch-all → app.blade.php
└── vite.config.js              ← laravel + react + tailwind + PWA plugins
```

---

## License

Private — © 2026 Olamtec. All rights reserved.
