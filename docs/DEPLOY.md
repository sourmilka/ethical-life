# Deployment Guide — Free Tier

Deploy BarterPay for **$0/month** using:

| Service | Free Tier | What it does |
|---------|-----------|-------------|
| **Render.com** | 750 hrs/mo web service + unlimited static sites | Hosts the API server + dashboard |
| **Supabase** | 500 MB database + 1 GB storage | PostgreSQL database + file storage |
| **Upstash** | 10K commands/day | Redis for caching & rate limiting |

> **Note**: Render free tier spins down after 15 min of inactivity. First request after sleep takes ~30-60 seconds.

---

## Step 1: Create Supabase Project (Database + File Storage)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **New Project**
   - Name: `ethical-life`
   - Region: pick closest to you (e.g., `East US`)
   - Password: generate a strong one and **save it**
3. Wait for the project to provision (~2 min)

### Get Database URL

4. Go to **Settings → Database**
5. Under **Connection string → URI**, copy the connection string
   - It looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - Make sure the **Session mode (port 5432)** is selected (not Transaction mode 6543) — Prisma needs direct connections
   - Replace `[YOUR-PASSWORD]` with the password you set in step 2
6. **Save this** — you'll need it as `DATABASE_URL`

### Set up File Storage

7. Go to **Storage** (left sidebar)
8. Click **New Bucket**
   - Name: `media`
   - **Public bucket**: ✅ ON (so uploaded images are publicly accessible)
9. Go to **Settings → API → S3 Access Keys**
   - Click **Generate new key**
   - **Save both the Access Key ID and Secret Access Key**
10. Your storage values:
    - `S3_ENDPOINT` = `https://<project-ref>.supabase.co/storage/v1/s3`
    - `S3_BUCKET` = `media`
    - `S3_REGION` = your project's region (e.g., `us-east-1`)
    - `S3_ACCESS_KEY` = the Access Key ID from step 9
    - `S3_SECRET_KEY` = the Secret Access Key from step 9
    - `S3_PUBLIC_URL` = `https://<project-ref>.supabase.co/storage/v1/object/public/media`

> Find your `<project-ref>` in **Settings → General → Reference ID**

---

## Step 2: Create Upstash Redis

1. Go to **https://upstash.com** → Sign up (free)
2. Click **Create Database**
   - Name: `ethical-life`
   - Region: same as your Supabase project
   - Type: **Regional**
   - TLS/SSL: ✅ Enabled
3. After creation, go to **Details**
4. Copy the **Redis URL** (starts with `rediss://`)
5. **Save this** — you'll need it as `REDIS_URL`

---

## Step 3: Deploy to Render.com

### Option A: Blueprint (Recommended — One Click)

1. Go to **https://render.com** → Sign up with GitHub
2. Click **New → Blueprint**
3. Connect your GitHub repo: **sourmilka/ethical-life**
4. Render will detect `render.yaml` and create both services
5. Fill in the environment variables when prompted (see below)

### Option B: Manual Setup

If the Blueprint doesn't work, create the services manually:

#### Server (Web Service)

1. Go to **Render Dashboard → New → Web Service**
2. Connect repo: `sourmilka/ethical-life`
3. Settings:
   - **Name**: `ethical-life-server`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm ci && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma db push --skip-generate && node dist/index.js`
   - **Plan**: Free
4. Add environment variables (see Section below)

#### Dashboard (Static Site)

1. Go to **Render Dashboard → New → Static Site**
2. Connect repo: `sourmilka/ethical-life`
3. Settings:
   - **Name**: `ethical-life-dashboard`
   - **Root Directory**: `dashboard`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
4. Add **Redirect/Rewrite rule**:
   - Source: `/*`, Destination: `/index.html`, Action: **Rewrite**
   - *(This is essential for React Router to work)*
5. Add environment variable:
   - `VITE_API_URL` = `https://ethical-life-server.onrender.com/api`

---

## Step 4: Environment Variables

### Server Environment Variables

Set these in **Render → ethical-life-server → Environment**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(from Supabase Step 1.5)* |
| `REDIS_URL` | *(from Upstash Step 2.4)* |
| `JWT_ACCESS_SECRET` | *(click "Generate" in Render, or run `openssl rand -base64 32`)* |
| `JWT_REFRESH_SECRET` | *(click "Generate" in Render — different from above)* |
| `CORS_ORIGIN` | `https://ethical-life-dashboard.onrender.com` |
| `PLATFORM_DOMAIN` | `onrender.com` |
| `S3_BUCKET` | `media` |
| `S3_REGION` | *(your Supabase region, e.g., `us-east-1`)* |
| `S3_ACCESS_KEY` | *(from Supabase Step 1.9)* |
| `S3_SECRET_KEY` | *(from Supabase Step 1.9)* |
| `S3_ENDPOINT` | `https://<project-ref>.supabase.co/storage/v1/s3` |
| `S3_PUBLIC_URL` | `https://<project-ref>.supabase.co/storage/v1/object/public/media` |

### Dashboard Environment Variable

Set in **Render → ethical-life-dashboard → Environment**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://ethical-life-server.onrender.com/api` |

---

## Step 5: Verify Deployment

1. Wait for both services to finish building (~5-10 min)
2. Check **ethical-life-server**: visit `https://ethical-life-server.onrender.com/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`
3. Check **ethical-life-dashboard**: visit `https://ethical-life-dashboard.onrender.com/dashboard/register`
   - Should show the registration page
4. Register your first account and you're live!

---

## Troubleshooting

### Server won't start
- Check **Render → Logs** for error messages
- Most common: wrong `DATABASE_URL` format or missing env vars
- The start command runs `prisma db push` which creates tables automatically

### Dashboard shows blank page
- Check browser console (F12) for errors
- Most likely: `VITE_API_URL` not set → the dashboard can't reach the API
- After changing `VITE_API_URL`, you must **re-deploy** the static site (Render → Manual Deploy)

### CORS errors in browser
- Make sure `CORS_ORIGIN` on the server matches the dashboard URL **exactly**
- Include `https://` and **no trailing slash**

### File uploads fail
- Verify S3 credentials are correct
- Check that the Supabase bucket `media` exists and is set to **public**
- Check server logs for S3 errors

### Slow first load
- Normal on Render free tier — the server sleeps after 15 min and takes ~30s to wake up
- Subsequent requests are fast

---

## Updating the App

After making code changes locally:

```bash
git add .
git commit -m "your change description"
git push origin master
```

Render auto-deploys on every push to `master`.

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Render Web Service (server) | **$0** |
| Render Static Site (dashboard) | **$0** |
| Supabase (database + storage) | **$0** |
| Upstash Redis | **$0** |
| **Total** | **$0/month** |

### Free Tier Limits

- **Render**: 750 hrs/mo (enough for 1 service running 24/7), spins down after 15 min idle
- **Supabase**: 500 MB database, 1 GB storage, 2 GB bandwidth, 2 projects
- **Upstash**: 10,000 commands/day (the app gracefully falls back if Redis is unavailable)
