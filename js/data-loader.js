(function () {
  const config = window.REGISTRY_CONFIG || {};

  async function fetchJson(url, options) {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }

    return response.json();
  }

  function sortModels(models) {
    return models.slice().sort((a, b) => {
      const aName = String(a.modelName || a.id || '');
      const bName = String(b.modelName || b.id || '');
      return aName.localeCompare(bName);
    });
  }

  // Primary path: fetch the single aggregate index file (built by
  // scripts/build-index.mjs, kept up to date by
  // .github/workflows/approve-model.yml and rebuild-index.yml) as a plain
  // same-origin static file. This is one request, served by GitHub Pages —
  // no calls to api.github.com, so it isn't subject to that API's 60
  // requests/hour unauthenticated rate limit (shared per IP address, easy
  // to exhaust with many people on one workshop network).
  async function loadFromIndex() {
    const url = config.modelsIndexUrl || 'data/models.json';
    const models = await fetchJson(url);

    if (!Array.isArray(models) || !models.length) {
      throw new Error(`${url} did not contain a non-empty array of models.`);
    }

    return models;
  }

  // Fallback: the original approach, listing data/models/ via the GitHub
  // Contents API and fetching each file. Used only if the static index is
  // missing or fails to load, so the site still works — just with the old
  // rate-limit exposure — rather than breaking outright.
  async function loadFromGitHubApi() {
    const owner = config.owner;
    const repo = config.repo;
    const branch = config.branch || 'main';
    const modelsPath = config.modelsPath || 'data/models';

    if (!owner || !repo) {
      throw new Error('Missing repository configuration in js/config.js');
    }

    const listingUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${modelsPath}?ref=${branch}`;
    const files = await fetchJson(listingUrl);

    const jsonFiles = (Array.isArray(files) ? files : [])
      .filter((item) => item && item.type === 'file' && item.name.endsWith('.json'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!jsonFiles.length) {
      throw new Error(`No JSON files were found in ${modelsPath}.`);
    }

    return Promise.all(
      jsonFiles.map(async (file) => {
        const model = await fetchJson(file.download_url);
        model.__sourceFile = file.name;
        return model;
      })
    );
  }

  async function loadModels() {
    if (Array.isArray(window.MODELS) && window.MODELS.length) {
      return window.MODELS;
    }

    let models;
    try {
      models = await loadFromIndex();
    } catch (error) {
      console.warn('Falling back to the GitHub API for model data:', error);
      models = await loadFromGitHubApi();
    }

    window.MODELS = sortModels(models);
    return window.MODELS;
  }

  window.ModelRegistryData = { loadModels };
})();
