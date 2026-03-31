(function () {
  const config = window.REGISTRY_CONFIG || {};

  async function fetchJson(url) {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
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

  async function loadModels() {
    if (Array.isArray(window.MODELS) && window.MODELS.length) {
      return window.MODELS;
    }

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

    const models = await Promise.all(
      jsonFiles.map(async (file) => {
        const model = await fetchJson(file.download_url);
        model.__sourceFile = file.name;
        return model;
      })
    );

    window.MODELS = sortModels(models);
    return window.MODELS;
  }

  window.ModelRegistryData = { loadModels };
})();
