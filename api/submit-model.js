// Example Vercel/Netlify-style serverless function.
// Deploy this separately from GitHub Pages, then put its URL in js/config.js as submitEndpoint.

const FIELD_ORDER = [
  'id','modelName','organisation','modelStatus','aiTask','inputSpecification','outputSpecification',
  'architecture','trainingDataOrigin','primaryPerformanceMetric','license','accessLink','moreInformation'
];

function validateModel(payload) {
  const data = {};
  for (const field of FIELD_ORDER) {
    const value = String(payload?.[field] ?? '').trim();
    if (!value) {
      throw new Error(`Missing required field: ${field}`);
    }
    data[field] = value;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(data.id)) {
    throw new Error('Invalid id. Use only letters, numbers, and hyphens.');
  }
  if (!/^https?:\/\//i.test(data.accessLink) && data.accessLink.toLowerCase() !== 'n/a') {
    throw new Error('accessLink must start with http:// or https://, or be N/A.');
  }
  return data;
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Missing GITHUB_TOKEN environment variable.');

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(body.message || `GitHub API error ${response.status}`);
  }
  return body;
}

async function loadAllModels(owner, repo, branch) {
  const tree = await githubRequest(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  const modelFiles = (tree.tree || []).filter((item) => item.path?.startsWith('data/models/') && item.path.endsWith('.json'));
  const models = [];
  for (const item of modelFiles) {
    const file = await githubRequest(`/repos/${owner}/${repo}/contents/${item.path}?ref=${branch}`);
    const json = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    models.push(json);
  }
  models.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return models;
}

function buildModelsJs(models) {
  return 'window.MODELS = ' + JSON.stringify(models, null, 2) + ';\n';
}

function buildModelsJson(models) {
  return JSON.stringify({ models }, null, 2) + '\n';
}

async function createOrUpdateFile({ owner, repo, path, content, message, branch, sha }) {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  return githubRequest(`/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: encoded, branch, sha })
  });
}

async function getFileSha(owner, repo, path, ref) {
  try {
    const file = await githubRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);
    return file.sha;
  } catch (_) {
    return undefined;
  }
}

export default async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const owner = process.env.GITHUB_OWNER || 'FoR63-ai';
    const repo = process.env.GITHUB_REPO || 'AI-Model-Registry';
    const baseBranch = process.env.GITHUB_BASE_BRANCH || 'main';
    const model = validateModel(req.body || {});

    const existingModels = await loadAllModels(owner, repo, baseBranch);
    if (existingModels.some((entry) => String(entry.id) === String(model.id))) {
      throw new Error(`A model with id "${model.id}" already exists.`);
    }

    const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`);
    const branchName = `submission/${model.id}-${Date.now()}`;
    await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseRef.object.sha })
    });

    const updatedModels = [...existingModels, model].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const filePath = `data/models/${model.id}.json`;

    await createOrUpdateFile({
      owner, repo, path: filePath, branch: branchName,
      content: JSON.stringify(model, null, 2) + '\n',
      message: `Add model submission: ${model.id}`
    });

    const modelsJsPath = 'data/generated/models.js';
    const modelsJsonPath = 'data/generated/models.json';
    await createOrUpdateFile({
      owner, repo, path: modelsJsPath, branch: branchName,
      sha: await getFileSha(owner, repo, modelsJsPath, branchName),
      content: buildModelsJs(updatedModels),
      message: `Rebuild generated registry for ${model.id}`
    });
    await createOrUpdateFile({
      owner, repo, path: modelsJsonPath, branch: branchName,
      sha: await getFileSha(owner, repo, modelsJsonPath, branchName),
      content: buildModelsJson(updatedModels),
      message: `Rebuild generated registry JSON for ${model.id}`
    });

    const pr = await githubRequest(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: `Add model submission: ${model.modelName}`,
        head: branchName,
        base: baseBranch,
        body: [
          'Automated model submission.',
          '',
          '```json',
          JSON.stringify(model, null, 2),
          '```'
        ].join('\n')
      })
    });

    res.status(200).json({ ok: true, pullRequestUrl: pr.html_url, branch: branchName });
  } catch (error) {
    res.status(400).json({ error: error.message || String(error) });
  }
}
