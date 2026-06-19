# Lighthouse Worker

The Lighthouse worker is an optional fallback runtime for custom Lighthouse
analysis. The MVP uses Google PageSpeed Insights instead, so this worker is only
needed if we later require private URLs, custom Chrome/Lighthouse flags, or
quota independence from Google APIs.

## Local Docker Run

Build the worker image:

```bash
docker build -f Dockerfile.worker -t sustainable-web-analyzer-worker .
```

Run it locally:

```bash
docker run --rm \
  -p 8080:8080 \
  -e SECRET_KEY=local-worker-secret \
  -e ANALYSIS_WORKER_TOKEN=local-worker-token \
  sustainable-web-analyzer-worker
```

Check health:

```bash
curl http://localhost:8080/api/health
```

Run an authenticated analysis:

```bash
curl -X POST http://localhost:8080/api/analyze \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer local-worker-token' \
  -d '{"url":"https://example.com","monthly_visits":10000}'
```

## Worker Environment

Set these variables on the worker hosting platform:

```bash
FLASK_ENV=production
SECRET_KEY=<long-random-value>
INLINE_ANALYSIS_ENABLED=true
ANALYSIS_PROVIDER=local
LIGHTHOUSE_ENABLED=true
BROWSER_ANALYSIS_ENABLED=true
REQUIRE_ANALYSIS_AUTH=true
ANALYSIS_WORKER_TOKEN=<shared-worker-token>
```

Do not set `ANALYSIS_WORKER_URL` on the worker. That variable is only for the
Vercel app facade. If it is set on the worker, the worker will proxy instead of
running Lighthouse inline.

## Vercel Environment

Set these variables on Vercel:

```bash
FLASK_ENV=production
SECRET_KEY=<long-random-value>
INLINE_ANALYSIS_ENABLED=false
ANALYSIS_PROVIDER=worker
ANALYSIS_WORKER_URL=https://<worker-hostname>
ANALYSIS_WORKER_TOKEN=<shared-worker-token>
WORKER_REQUEST_TIMEOUT=290
```

## Hosting Options

Any container platform with enough CPU and memory can run this worker. Good
first choices are Render, Fly.io, Railway, or Google Cloud Run.

Minimum practical runtime:

- 1 GB RAM for small pages.
- 2 GB RAM for more reliable Lighthouse runs.
- Request timeout at least 300 seconds.
- One or two web workers to avoid running too many Chromium instances at once.

## Deploy Flow

1. Deploy the worker container using `Dockerfile.worker`.
2. Set the worker environment variables.
3. Open `https://<worker-hostname>/api/health`.
4. Run the authenticated `curl` analysis above against the worker URL.
5. Set `ANALYSIS_WORKER_URL` and `ANALYSIS_WORKER_TOKEN` on Vercel.
6. Open the Vercel app and run an analysis from the UI.
