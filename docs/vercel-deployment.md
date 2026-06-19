# Vercel Deployment

This project is deployable on Vercel as the public web app and API facade.
The MVP uses Google's PageSpeed Insights API as the Lighthouse provider, so
Vercel does not need Chromium or a dedicated worker for the first release.

## Runtime Shape

- Vercel serves the Flask app from the top-level `app.py` entrypoint.
- Do not add `app.py` under the `functions` key in `vercel.json`: Vercel
  validates Python function patterns there against files inside `/api`.
- `/api/analyze` validates user input and calls PageSpeed Insights when
  `ANALYSIS_PROVIDER=pagespeed`.
- Resource, sustainability, and economic estimates are derived from the
  Lighthouse network data returned by PageSpeed Insights.
- A dedicated worker remains available later by setting
  `ANALYSIS_PROVIDER=worker` and `ANALYSIS_WORKER_URL`.
- Local development can still run local Lighthouse by setting
  `ANALYSIS_PROVIDER=local` and leaving `INLINE_ANALYSIS_ENABLED=true`.

## Required Vercel Environment Variables

- `FLASK_ENV=production`
- `SECRET_KEY`: long random value used by Flask.
- `ANALYSIS_PROVIDER=pagespeed`
- `PAGESPEED_API_KEY`: optional for trials, recommended for automated usage.
- `PAGESPEED_STRATEGY=desktop`
- `PAGESPEED_LOCALE=it`
- `PAGESPEED_CACHE_TTL=86400`
- `PAGESPEED_CACHE_MAX_ENTRIES=128`
- `INLINE_ANALYSIS_ENABLED=false`
- `REQUIRE_ANALYSIS_AUTH=false`

PageSpeed Insights can be called without a key, but anonymous calls are more
likely to hit `429 Too Many Requests`. Use a real `PAGESPEED_API_KEY` for
automated analysis traffic.

## Optional Worker Environment Variables

- `FLASK_ENV=production`
- `SECRET_KEY`: long random value used by Flask.
- `ANALYSIS_PROVIDER=local`
- `INLINE_ANALYSIS_ENABLED=true`
- `LIGHTHOUSE_ENABLED=true`
- `BROWSER_ANALYSIS_ENABLED=true`
- `ANALYSIS_WORKER_TOKEN`: same value used by Vercel.
- `REQUIRE_ANALYSIS_AUTH=true`

## When A Worker Is Required

PageSpeed Insights is the easiest MVP path because Google runs Lighthouse for
us. A worker becomes useful later if we need private URLs, custom Lighthouse
flags, controlled Chrome versions, or quota independence from Google APIs.

## First Deploy Checklist

1. Deploy this repository to Vercel.
2. Set the environment variables above.
3. Call `/api/health` and verify `analysis_provider` is `pagespeed`.
4. Run one known URL through the UI and verify the returned
   `web_vitals.analyzer_type` is `pagespeed_insights`.
5. Add caching before opening the app to broad public usage.
