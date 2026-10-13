# Upflit — Creative Portfolio & Studio Website

A bold creative-studio website with an orange-to-red editorial design and a protected **Admin Panel** at `/admin` where you can edit content, images, pricing, typography and colors. Built with **Next.js (App Router)**, **PostgreSQL** and **Drizzle ORM**.

- Public site: hero, featured work, all projects (with category filters), project pages, services, pricing, about, process, testimonials, FAQ, contact form.
- Admin Panel: Dashboard, Portfolio Projects, Categories, Portfolio Layout, Services, Pricing, Hero Editor, Page Sections, Media Library, Typography, Colors & Appearance, FAQs, Testimonials, Contact Information, Social Links, Navigation & Footer, SEO, Logo & Favicon, Inquiries, Account & Security.
- Every save goes to the database. A success message only appears after the server confirms the save.

---

## 1. Run it locally (Windows Command Prompt)

**You need:** [Node.js 20+](https://nodejs.org) and [PostgreSQL](https://www.postgresql.org/download/windows/) (the installer includes pgAdmin).

1. Create an empty database called `app_db`. In pgAdmin: right-click *Databases → Create → Database*. Or in a terminal:
   ```
   psql -U postgres -c "CREATE DATABASE app_db;"
   ```
2. Create your `.env` file:
   ```
   copy .env.example .env
   ```
   If your PostgreSQL password isn't `postgres`, edit `DATABASE_URL` in `.env`.
3. Install and start:
   ```
   npm install
   npm run dev
   ```
4. Open **http://localhost:3000** for the website and **http://localhost:3000/admin** for the Admin Panel.

That's all. You don't need to run a migration command: **the app creates its tables and adds starter content automatically** the first time it runs (`src/db/init.ts`). The website and admin run from the same `npm run dev` process.

**First login:** if `ADMIN_PASSWORD` is empty in `.env`, sign in with `admin@upflit.com` / `upflit-admin`, then change it right away in **Account & Security**. The login page shows this reminder until you change the default password.

> If PostgreSQL isn't running, the website still loads with default content and shows a small "Database not connected" notice. Saving in the admin needs the database.

### Useful scripts
| Command | What it does |
|---|---|
| `npm run dev` | Starts the dev server (site + admin + API) |
| `npm run build` | Creates the production build |
| `npm run start` | Starts the production server (after build) |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` | Optional: sync the schema with drizzle-kit (uses `drizzle.config.json`) |

---

## 2. Using the Admin Panel

- **Hero Editor:** upload, replace or remove the hero image. Set width, height, zoom, focal point and offset **separately for Desktop, Tablet and Mobile** while watching a live device preview. You can also change the headline, buttons, gradient, spacing and how the background word layers with the image. Use **Save Changes**, **Cancel** or **Reset to default**.
- **Portfolio Projects:** create, edit, delete, publish/unpublish and feature projects. Drag rows (or use ↑/↓) to reorder; the new order saves straight away.
  - Drop images onto the cover or gallery areas to upload them. Drag gallery thumbnails to reorder them.
  - Select any image to open the **Image size editor**. It has aspect presets (16:9 thumbnails, A-series flyers, 1:1 logos, 4:5 social, 3:1 banners, Original, Custom), Cover/Contain/Stretch, zoom, horizontal/vertical position, click-to-set focal point, display width, fixed height, border radius, background color and reset. Each image keeps its own settings, and original files are never changed.
- **Portfolio Layout:** choose *Uniform Grid* (all cards the same size) or *Flexible Preview* (masonry). You can also set desktop/tablet/mobile columns, card ratio, frame height, spacing, cropping, title position and hover effect.
- **Categories:** add, rename, reorder, hide or delete categories, and set each category's default image ratio.
- **Pricing:** set name, price, BDT/USD, deliverables, revisions, delivery time, add-ons, button text, featured status, visibility and order. The pricing buttons open an inquiry form with that package already selected. No payments are processed.
- **Typography:** Poppins (default), Space Grotesk, Inter, Manrope. Hero, section and body sizes, weight and letter-spacing all stay within safe limits.
- **Colors & Appearance:** brand colors, gradient, corner radius, button style, animations on/off and speed, grain texture and cursor style. Visitors who have "reduced motion" turned on never see motion.
- **Media Library:** uploads are saved **in PostgreSQL**, so they survive restarts and redeploys. You don't need separate file storage.

Demo projects are marked **Concept** on the site. Replace them with your own work.

---

## 3. Deploy to Render (recommended)

The repository includes a `render.yaml` blueprint that sets up a web service and a PostgreSQL database.

1. Push this project to GitHub or GitLab.
2. In Render: **New + → Blueprint**, then pick your repository.
3. When asked, enter a strong **`ADMIN_PASSWORD`**. Render fills in `DATABASE_URL` and generates `SESSION_SECRET` for you.
4. Deploy. Tables and starter content are created on the first request. The health check is at `/api/health`.

**Manual setup (without the blueprint):** create a PostgreSQL database and a Node web service with:
- Build command: `npm ci && npm run build`
- Start command: `npm run start` (Next.js uses Render's `PORT` automatically)
- Environment variables:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Use the *Internal* URL on Render. For external hosts add `?sslmode=require` |
| `SESSION_SECRET` | ✅ | Long random string (32+ chars) |
| `ADMIN_EMAIL` | optional | First admin email (default `admin@upflit.com`) |
| `ADMIN_PASSWORD` | ✅ in production | First admin password. Only used when no admin exists yet |
| `SITE_URL` | optional | e.g. `https://upflit.com`, used for social share links |
| `DATABASE_SSL` | optional | `true` to force SSL |
| `INSECURE_COOKIES` | optional | `true` only if you serve production over plain HTTP |

**Images:** uploads are stored in the database, so you don't need a persistent disk or S3. Back up the database to back up your media.

**Routing:** every page is server-rendered by Next.js, so refreshing or linking directly to `/work/your-project` or `/admin` works.

> **Netlify / Vercel:** these also work as standard Next.js deployments. Set the same environment variables and point `DATABASE_URL` at a hosted PostgreSQL (Neon, Supabase or Render).

---

## 4. Project structure

```
src/
  app/                 pages (/, /work, /work/[slug], /admin) and API routes
    api/admin/...      protected CRUD, reorder, upload, settings
    api/inquiries      public contact form endpoint
    api/media/[id]     serves uploaded images from the database
  components/site/     public website components (Hero, Sections, Header…)
  components/admin/    Admin Panel modules, Image editor, Hero editor
  db/schema.ts         Drizzle tables (7 small tables)
  db/init.ts           auto table creation + first-run seed
  lib/                 settings model & validation, auth, data access, theme
public/                logo & favicon files (brand/), demo images
```

**Brand files:** `public/brand/logo-light.svg`, `logo-dark.svg`, `logo-mark.svg`, `logo-mark-light.svg`, `logo-mark-dark.svg`, plus `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png`.

### Resetting demo content
To start again from the starter content, drop the tables and restart the app:
```
psql -U postgres -d app_db -c "DROP TABLE settings, categories, projects, items, media, inquiries, admin_users;"
```
