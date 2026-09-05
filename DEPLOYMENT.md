# StudyStride · Vercel Deployment Guide

StudyStride is a modern study companion designed to run seamlessly as a standalone application. It supports **local-first storage out-of-the-box** (zero configuration needed) and optional **PostgreSQL cloud sync** via Vercel Serverless and Drizzle ORM.

---

## 🚀 Quick Deploy to Vercel

### Step 1: Push to GitHub

Initialize the repository and push to your GitHub account:

```bash
# Inside the studystride directory
git init
git add .
git commit -m "Initial commit: StudyStride ready for Vercel"
git branch -M main
git remote add origin https://github.com/mvrajasree/StudyStride.git
git push -u origin main
```

### Step 2: Import into Vercel

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** → **"Project"**.
3. Select your `mvrajasree/StudyStride` GitHub repository and click **Import**.
4. If you pushed the entire folder structure or parent folder, set **Root Directory**: `studystride`. If you pushed the `studystride` directory itself as the git root, leave Root Directory as `./`.
5. Vercel automatically detects the configuration:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm run vercel-build`
   - **Output Directory**: `dist/public`
6. Click **Deploy**.

Within 1–2 minutes, your StudyStride instance will be live!

---

## 🗄️ Optional: Connecting PostgreSQL (Neon / Supabase / Vercel Postgres)

StudyStride works immediately without a database, saving all subjects, study logs, quizzes, streaks, and syllabus progress in your browser (`localStorage`).

If you want cross-device synchronization, you can connect a free PostgreSQL database:

### 1. Create a Free PostgreSQL Database
- **Option A: Neon (Recommended)**: Create a free serverless PostgreSQL database at [neon.tech](https://neon.tech).
- **Option B: Supabase**: Create a free PostgreSQL database at [supabase.com](https://supabase.com).
- **Option C: Vercel Postgres**: Add a Postgres storage database from your Vercel project dashboard.

### 2. Add the Environment Variable in Vercel
In your Vercel Project dashboard:
1. Go to **Settings** → **Environment Variables**.
2. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: Your connection string (e.g. `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`)
3. Redeploy your project.

### 3. Run Migrations (One-time)
To create the database tables in your cloud database, run from your local terminal with your connection string:

```bash
DATABASE_URL="postgresql://user:password@host/db?sslmode=require" npm run db:push
```

---

## ⚙️ Architecture & Features

- **Decoupled Standalone Mode**: No external proprietary dependencies required.
- **Vercel Serverless Function**: API routes (`/api/trpc`) run on Node.js serverless functions using Express.
- **Client**: Fast Vite + React 19 single-page app with Framer Motion micro-animations, Tailwind CSS, Lucide icons, and Sonner notifications.
- **Workspace & Profile Settings**: Click the settings icon in the sidebar profile card to customize your name, degree program, semester, and workspace sync key.
