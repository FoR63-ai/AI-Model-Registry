window.ModelRegistryUtils = (function () {
  const FIELD_ORDER = [
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

  const FIELD_LABELS = {
    id: 'ID',
    modelName: 'Model name',
    organisation: 'Organisation',
    modelStatus: 'Model status',
    aiTask: 'AI task',
    inputSpecification: 'Input specification',
    outputSpecification: 'Output specification',
    architecture: 'Architecture',
    trainingDataOrigin: 'Training data origin',
    primaryPerformanceMetric: 'Primary performance metric',
    license: 'License',
    accessLink: 'Access link',
    moreInformation: 'More information'
  };

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalize(value) {
    return String(value ?? '').toLowerCase().trim();
  }

  function slugify(value) {
    return String(value ?? '')
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function toModelId(modelName, organisation) {
    const org = slugify(organisation).slice(0, 24);
    const name = slugify(modelName).slice(0, 48);
    const joined = [org, name].filter(Boolean).join('-');
    return joined || `model-${Date.now()}`;
  }

  function validateModel(payload, existingModels) {
    const errors = [];
    const data = {};
    const seenIds = new Set((existingModels || []).map((m) => String(m.id || '').trim()).filter(Boolean));

    for (const field of FIELD_ORDER) {
      const value = String(payload?.[field] ?? '').trim();
      data[field] = value;
      if (!value) {
        errors.push(`${FIELD_LABELS[field]} is required.`);
      }
    }

    if (data.accessLink && !/^https?:\/\//i.test(data.accessLink) && data.accessLink.toLowerCase() !== 'n/a') {
      errors.push('Access link must start with http:// or https://, or be N/A.');
    }

    if (!data.id && data.modelName && data.organisation) {
      data.id = toModelId(data.modelName, data.organisation);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(data.id || '')) {
      errors.push('ID may only contain letters, numbers, and hyphens.');
    }

    if (seenIds.has(data.id)) {
      errors.push(`A model with id "${data.id}" already exists.`);
    }

    return { valid: errors.length === 0, errors, data };
  }

  function buildSearchText(model) {
    return normalize([
      model.modelName,
      model.organisation,
      model.modelStatus,
      model.aiTask,
      model.inputSpecification,
      model.outputSpecification,
      model.architecture,
      model.trainingDataOrigin,
      model.primaryPerformanceMetric,
      model.license,
      model.moreInformation
    ].filter(Boolean).join(' '));
  }

  function uniqueSorted(values) {
    return [...new Set(values.map((v) => String(v ?? '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  function textOrDash(value) {
    const text = String(value ?? '').trim();
    if (!text || text.toLowerCase() === 'n/a') return '<span class="muted">—</span>';
    return esc(text);
  }

  function linkOrDash(value) {
    const text = String(value ?? '').trim();
    if (!text || text.toLowerCase() === 'n/a') return '<span class="muted">—</span>';
    return `<a href="${esc(text)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  function githubIssueUrl(model, config) {
    const labels = encodeURIComponent((config.issueLabels || []).join(','));
    const title = encodeURIComponent(`Model submission: ${model.modelName}`);
    const body = encodeURIComponent([
      '## Proposed model submission',
      '',
      'Please review the following model metadata.',
      '',
      '```json',
      JSON.stringify(model, null, 2),
      '```'
    ].join('\n'));
    return `https://github.com/${config.owner}/${config.repo}/issues/new?labels=${labels}&title=${title}&body=${body}`;
  }

  return {
    FIELD_ORDER,
    FIELD_LABELS,
    esc,
    normalize,
    slugify,
    toModelId,
    validateModel,
    buildSearchText,
    uniqueSorted,
    textOrDash,
    linkOrDash,
    downloadJson,
    copyText,
    githubIssueUrl
  };
})();
