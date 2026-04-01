import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const modelsDir = path.join(root, 'data', 'models');

const fieldOrder = [
  'id',
  'modelName',
  'organisation',
  'modelStatus',
  'aiTask',
  'inputSpecification',
  'outputSpecification',
  'architecture',
  'trainingDataOrigin',
  'primaryPerformanceMetric',
  'license',
  'accessLink',
  'moreInformation'
];

// ✅ Endast dessa är obligatoriska nu
const requiredFields = ['modelName', 'organisation', 'aiTask'];

function toModelId(name, org) {
  return `${name}-${org}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const filenames = (await fs.readdir(modelsDir))
  .filter((name) => name.endsWith('.json'))
  .sort();

const seenIds = new Set();

if (!filenames.length) {
  throw new Error('No model JSON files were found in data/models.');
}

for (const filename of filenames) {
  const fullPath = path.join(modelsDir, filename);
  const raw = await fs.readFile(fullPath, 'utf8');

  let model;
  try {
    model = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${filename}: invalid JSON (${e.message})`);
  }

  // ✅ Generera ID om saknas
  if (!model.id) {
    if (model.modelName && model.organisation) {
      model.id = toModelId(model.modelName, model.organisation);
    } else {
      throw new Error(`${filename}: cannot generate id (missing modelName or organisation).`);
    }
  }

  // ✅ Required fields (endast 3)
  for (const field of requiredFields) {
    if (typeof model[field] !== 'string' || !model[field].trim()) {
      throw new Error(`${filename}: missing or empty required field "${field}".`);
    }
  }

  // ✅ Ta bort tomma fält (optional cleanup)
  Object.keys(model).forEach((key) => {
    if (model[key] === '') {
      delete model[key];
    }
  });

  // ✅ Kontrollera att inga okända fält finns
  for (const field of Object.keys(model)) {
    if (!fieldOrder.includes(field)) {
      throw new Error(`${filename}: unexpected field "${field}".`);
    }
  }

  // ✅ ID-format
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(model.id)) {
    throw new Error(`${filename}: invalid id "${model.id}".`);
  }

  // ✅ Unika ID:n
  if (seenIds.has(model.id)) {
    throw new Error(`${filename}: duplicate model id "${model.id}".`);
  }
  seenIds.add(model.id);

  // ✅ (valfritt) skriv tillbaka städad JSON
  const ordered = {};
  for (const key of fieldOrder) {
    if (model[key] !== undefined) {
      ordered[key] = model[key];
    }
  }

  await fs.writeFile(fullPath, JSON.stringify(ordered, null, 2) + '\n', 'utf8');
}

console.log(`Validated ${filenames.length} model file(s) in data/models.`);
