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

  const REQUIRED_FIELDS = ['modelName', 'organisation', 'aiTask'];

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
    return [org, name].filter(Boolean).join('-') || `model-${Date.now()}`;
  }

  function cleanModelData(payload) {
    const data = {};

    for (const field of FIELD_ORDER) {
      const value = String(payload?.[field] ?? '').trim();
      if (value) {
        data[field] = value;
      }
    }

    if (!data.id && data.modelName && data.organisation) {
      data.id = toModelId(data.modelName, data.organisation);
    }

    return data;
  }

  function validateModel(payload, existingModels) {
    const errors = [];
    const data = cleanModelData(payload);

    const existingIds = new Set(
      (existingModels || [])
        .map((model) => String(model?.id || '').trim())
        .filter(Boolean)
    );

    for (const field of REQUIRED_FIELDS) {
      if (!String(data[field] || '').trim()) {
        errors.push(`${FIELD_LABELS[field]} is required.`);
      }
    }

    if (!data.id) {
      errors.push('ID could not be generated. Please provide Model name and Organisation, or enter an ID manually.');
    }

    if (data.accessLink && !/^https?:\/\//i.test(data.accessLink) && data.accessLink.toLowerCase() !== 'n/a') {
      errors.push('Access link must start with http:// or https://, or be N/A.');
    }

    if (data.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(data.id)) {
      errors.push('ID may only contain letters, numbers, and hyphens.');
    }

    const submittedId = String(payload?.id ?? '').trim();
    const isExplicitUpdate = Boolean(submittedId);

    if (data.id && existingIds.has(data.id) && !isExplicitUpdate) {
      errors.push(`A model with id "${data.id}" already exists. Enter its ID explicitly if this is an update.`);
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
    return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  function textOrDash(value) {
    const text = String(value ?? '').trim();
    return !text || text.toLowerCase() === 'n/a' ? '—' : esc(text);
  }

  function linkOrDash(value) {
    const text = String(value ?? '').trim();
    if (!text || text.toLowerCase() === 'n/a') return '—';
    return `<a href="${esc(text)}" target="_blank" rel="noopener">${esc(text)}</a>`;
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
    const isUpdate = Boolean(model.id && config.existingIds && config.existingIds.includes(model.id));
    const title = encodeURIComponent(
      isUpdate
        ? `Model update: ${model.modelName || model.id || 'existing model'}`
        : `Model submission: ${model.modelName || model.id || 'new model'}`
    );

    const body = encodeURIComponent([
      isUpdate ? '## Proposed model update' : '## Proposed model submission',
      '',
      'Please add or update the following file in data/models/',
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
    REQUIRED_FIELDS,
    esc,
    normalize,
    slugify,
    toModelId,
    cleanModelData,
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
