(function () {
  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.json();
  }

  async function loadModels() {
    if (Array.isArray(window.MODELS) && window.MODELS.length) {
      return window.MODELS;
    }

    try {
      const registry = await fetchJson('data/generated/models.json');
      if (Array.isArray(registry.models)) {
        window.MODELS = registry.models;
        return window.MODELS;
      }
    } catch (_) {
      // Fallback to generated JS or already-loaded static bundle.
    }

    if (Array.isArray(window.MODELS) && window.MODELS.length) {
      return window.MODELS;
    }

    throw new Error('No model data was available. Run scripts/build-models.mjs to regenerate the bundle.');
  }

  window.ModelRegistryData = { loadModels };
})();
