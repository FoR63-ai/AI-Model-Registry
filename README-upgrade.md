# AI Model Registry – self-submission upgrade

This package upgrades the current static GitHub Pages site into a staged submission flow:

- **Stage 1:** users can click **Submit model**, fill in a form, validate metadata, download JSON, copy JSON, or open a prefilled GitHub issue.
- **Stage 2:** models are stored as individual JSON files in `data/models/`, validated against `schema/model.schema.json`, and bundled into `data/generated/models.js`.
- **Stage 3:** if you deploy a serverless endpoint and set `window.REGISTRY_CONFIG.submitEndpoint`, the same form can open an automated pull request in GitHub.

## What to replace in your repo

Replace or add these files:

- `index.html`
- `detail.html`
- `js/config.js`
- `js/data-loader.js`
- `js/app.js`
- `js/detail.js`
- `js/submit.js`
- `data/models/*.json`
- `data/generated/models.js`
- `schema/model.schema.json`
- `scripts/build-models.mjs`
- `scripts/validate-models.mjs`
- `.github/workflows/validate-models.yml`
- `api/submit-model.js` (only used if you deploy a serverless function)

## Quick start

1. Copy the files into the repo.
2. Commit and push.
3. GitHub Pages will keep working immediately.
4. Optional: deploy `api/submit-model.js` to Vercel/Netlify/Cloudflare Workers and set `window.REGISTRY_CONFIG.submitEndpoint` in `js/config.js`.

## Local development

Because the frontend fetches JSON files, run a local HTTP server instead of opening the files directly:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Rebuild generated models file

```bash
node scripts/build-models.mjs
```

## Validate all models

```bash
node scripts/validate-models.mjs
```

## How Stage 3 works

The serverless function:

1. validates the submission,
2. creates a branch,
3. writes `data/models/<id>.json`,
4. rebuilds `data/generated/models.js`,
5. opens a pull request.

To enable it, set environment variables in your serverless host:

- `GITHUB_TOKEN`
- `GITHUB_OWNER` (default `FoR63-ai`)
- `GITHUB_REPO` (default `AI-Model-Registry`)
- `GITHUB_BASE_BRANCH` (default `main`)
- `ALLOWED_ORIGIN` (optional, recommended)

## Notes

- The site works without any backend.
- The automated PR flow is optional.
- The form uses the same 12 metadata fields already present in the current registry, plus `moreInformation` and `id`.
