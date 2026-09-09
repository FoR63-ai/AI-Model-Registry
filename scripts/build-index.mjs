import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Builds data/models.json: a single aggregate file containing every model
// record. The site fetches this one static file directly (same-origin),
// instead of calling the GitHub Contents API to list data/models/ and then
// fetching each file — that API call is subject to a 60 requests/hour
// unauthenticated limit shared per IP address, which a workshop full of
// people on the same network can exhaust in minutes.
//
// Run manually with `npm run build-index`, or automatically by
// .github/workflows/approve-model.yml and
// .github/workflows/rebuild-index.yml whenever data/models/ changes.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const modelsDir = path.join(root, 'data', 'models');
const outFile = path.join(root, 'data', 'models.json');

const filenames = (await fs.readdir(modelsDir))
  .filter((name) => name.endsWith('.json'))
  .sort();

const models = [];

for (const filename of filenames) {
  const raw = await fs.readFile(path.join(modelsDir, filename), 'utf8');

  let model;
  try {
    model = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${filename}: invalid JSON (${e.message})`);
  }

  models.push(model);
}

models.sort((a, b) => {
  const aName = String(a.modelName || a.id || '');
  const bName = String(b.modelName || b.id || '');
  return aName.localeCompare(bName);
});

await fs.writeFile(outFile, JSON.stringify(models, null, 2) + '\n', 'utf8');

console.log(`Wrote ${models.length} model(s) to data/models.json`);
