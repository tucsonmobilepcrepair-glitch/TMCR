# Squarespace Scheduling Install

## What to Paste in Squarespace

Add a Code Block where you want the scheduler to appear, then paste this:

```html
<div id="tmcr-scheduler"></div>
<script src="https://YOUR-BACKEND-DOMAIN.com/scheduler-widget.js"></script>
```

Replace `https://YOUR-BACKEND-DOMAIN.com` with the public URL where `server.js` is hosted.

## Local Test Version

While testing on this computer, this version works when the backend is running with `npm start`:

```html
<div id="tmcr-scheduler"></div>
<script src="http://127.0.0.1:8765/scheduler-widget.js"></script>
```

That local URL is only for your machine. Website visitors cannot use `127.0.0.1`.

## Backend Hosting Note

Squarespace can display the scheduler, but it cannot run the Node backend. The backend should be hosted publicly on Render and connected to a Neon Postgres database. Once it is hosted, the same backend URL serves both:

- `/scheduler-widget.js`
- `/api/bookings`
- `/api/availability`

## Current Backend Command

Run locally with:

```powershell
npm start
```

When `DATABASE_URL` is not set, the backend stores bookings locally in `data/bookings.json`. When `DATABASE_URL` is set, it automatically uses Neon/Postgres instead.

## Neon Setup

1. Create a free Neon project.
2. Copy the pooled connection string from Neon.
3. It should look similar to:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

4. Save that value as `DATABASE_URL` in your Render web service environment variables.

The server creates the `bookings` table automatically the first time it starts.

## Render Setup

1. Push this folder to a GitHub repository.
2. Create a new Render Web Service from that repository.
3. Use these settings:

```text
Build Command: npm install
Start Command: npm start
```

4. Add this environment variable:

```text
DATABASE_URL=your_neon_connection_string
```

5. Deploy, then use your Render URL in Squarespace:

```html
<div id="tmcr-scheduler"></div>
<script src="https://YOUR-RENDER-APP.onrender.com/scheduler-widget.js"></script>
```
