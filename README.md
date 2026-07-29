# Nori's Market — site + survey (one Vite app)

`/` → the market site · `/survey` → the community survey. Deploys to AWS Amplify.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173  (and /survey)
```

## Deploy (AWS Amplify)
1. Push this folder to a GitHub repo.
2. Amplify Console → **Create new app → Host web app → GitHub** → pick the repo/branch.
3. It auto-detects `amplify.yml` (build `npm run build`, output `dist`). **Save and deploy.**
4. **Rewrites and redirects** → add this rule so `/survey` resolves on refresh:
   - Source: `</^[^.]+$/>`  ·  Target: `/index.html`  ·  Type: **200 (Rewrite)**
5. **Custom domains** → add `nori-market.shop` (root) and `www` → redirect to root.

## Backend note
The survey POSTs to WordPress at `cms.nori-market.shop` (set `VITE_API_URL` in Amplify
env vars). Because the survey now lives at `nori-market.shop/survey`, set the CORS origin
in `wp-config.php` to:
```php
define('NORI_SURVEY_ORIGIN', 'https://nori-market.shop');
```
