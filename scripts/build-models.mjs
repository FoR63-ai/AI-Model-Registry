import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const modelsDir = path.join(root, 'data', 'models');
const generatedDir = path.join(root, 'data', 'generated');
const schemaPath = path.join(root, 'schema', 'model.schema.json');

const fieldOrder = [
  'id','modelName','organisation','modelStatus','aiTask','inputSpecification','outputSpecification',
  'architecture','trainingDataOrigin','primaryPerformanceMetric','license','accessLink','moreInformation'
];

function validateModel(model, schema) {
  const required = schema.required || [];
  for (const field of required) {
    if (typeof model[field] !== 'string' || !model[field].trim()) {
      throw new Error(`Missing or empty required field: ${field}`);
    }
  }
  for (const field of Object.keys(model)) {
    if (!fieldOrder.includes(field)) {
      throw new Error(`Unexpected field: ${field}`);
    }
  }
}

const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));
const filenames = (await fs.readdir(modelsDir)).filter((name) => name.endsWith('.json')).sort();
const models = [];
const seen = new Set();

for (const filename of filenames) {
  const fullPath = path.join(modelsDir, filename);
  const model = JSON.parse(await fs.readFile(fullPath, 'utf8'));
  validateModel(model, schema);
  if (seen.has(model.id)) {
    throw new Error(`Duplicate model id found: ${model.id}`);
  }
  seen.add(model.id);
  models.push(Object.fromEntries(fieldOrder.map((field) => [field, model[field]])));
}

await fs.mkdir(generatedDir, { recursive: true });
await fs.writeFile(path.join(generatedDir, 'models.json'), JSON.stringify({ models }, null, 2) + '\n');
await fs.writeFile(path.join(generatedDir, 'models.js'), 'window.MODELS = ' + JSON.stringify(models, null, 2) + ';\n');

console.log(`Built ${models.length} model(s).`);
