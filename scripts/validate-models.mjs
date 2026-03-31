import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const modelsDir = path.join(root, 'data', 'models');
const schemaPath = path.join(root, 'schema', 'model.schema.json');

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

const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));
const required = new Set(schema.required || []);
const filenames = (await fs.readdir(modelsDir)).filter((name) => name.endsWith('.json')).sort();
const seenIds = new Set();

if (!filenames.length) {
  throw new Error('No model JSON files were found in data/models.');
}

for (const filename of filenames) {
  const fullPath = path.join(modelsDir, filename);
  const model = JSON.parse(await fs.readFile(fullPath, 'utf8'));

  for (const field of required) {
    if (typeof model[field] !== 'string' || !model[field].trim()) {
      throw new Error(`${filename}: missing or empty required field "${field}".`);
    }
  }

  for (const field of Object.keys(model)) {
    if (!fieldOrder.includes(field)) {
      throw new Error(`${filename}: unexpected field "${field}".`);
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(model.id)) {
    throw new Error(`${filename}: invalid id "${model.id}".`);
  }

  if (seenIds.has(model.id)) {
    throw new Error(`${filename}: duplicate model id "${model.id}".`);
  }
  seenIds.add(model.id);
}

console.log(`Validated ${filenames.length} model file(s) in data/models.`);
