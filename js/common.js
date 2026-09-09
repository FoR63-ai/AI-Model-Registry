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
    'moreInformation',
    'lastUpdated'
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
    moreInformation: 'More information',
    lastUpdated: 'Last updated'
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

  function normalizeModel(model) {
    const normalized = {};

    for (const field of FIELD_ORDER) {
      normalized[field] = String(model?.[field] ?? '').trim();
    }

    if (!normalized.id && normalized.modelName && normalized.organisation) {
      normalized.id = toModelId(normalized.modelName, normalized.organisation);
    }

    return normalized;
  }

  function cleanModelData(payload) {
    const data = normalizeModel(payload);

    for (const key of Object.keys(data)) {
      if (!data[key]) {
        delete data[key];
      }
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
    const m = normalizeModel(model);
    return normalize([
      m.modelName,
      m.organisation,
      m.modelStatus,
      m.aiTask,
      m.inputSpecification,
      m.outputSpecification,
      m.architecture,
      m.trainingDataOrigin,
      m.primaryPerformanceMetric,
      m.license,
      m.moreInformation
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

  function formatDate(value) {
    const text = String(value ?? '').trim();
    if (!text) return '—';
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return esc(text);
    // Force English regardless of the viewer's browser/OS locale — using
    // `undefined` here previously meant a Swedish-locale browser rendered
    // Swedish month names ("19 maj 2026") on an otherwise English site.
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // mode: 'add' (default) or 'update'. Both produce a prefilled GitHub issue
  // carrying the full model JSON; a maintainer applies the "approved" or
  // "update-approved" label to actually write it, per .github/workflows/approve-model.yml.
  function githubIssueUrl(model, config, mode) {
    const isUpdate = mode === 'update';
    const labels = encodeURIComponent(
      (isUpdate ? config.updateIssueLabels : config.issueLabels || []).join(',')
    );
    const title = encodeURIComponent(
      `${isUpdate ? 'Update model submission' : 'Model submission'}: ${model.modelName || model.id || 'new model'}`
    );
    const body = encodeURIComponent([
      isUpdate ? '## Proposed model update' : '## Proposed model submission',
      '',
      isUpdate
        ? `This updates the existing model \`${model.id}\`. A maintainer should apply the **update-approved** label to publish it.`
        : 'Please add the following file to data/models/. A maintainer should apply the **approved** label to publish it.',
      '',
      '```json',
      JSON.stringify(model, null, 2),
      '```'
    ].join('\n'));
    return `https://github.com/${config.owner}/${config.repo}/issues/new?labels=${labels}&title=${title}&body=${body}`;
  }

  // Deletion doesn't need the full JSON — just the id the workflow should
  // remove. A maintainer applies the "delete-approved" label to publish it.
  function deleteIssueUrl(model, config) {
    const labels = encodeURIComponent((config.deleteIssueLabels || []).join(','));
    const title = encodeURIComponent(`Delete request: ${model.modelName || model.id || 'model'}`);
    const body = encodeURIComponent([
      '## Proposed model deletion',
      '',
      `Model ID: ${model.id}`,
      `Model name: ${model.modelName || ''}`,
      '',
      `Please remove \`data/models/${model.id}.json\` from the registry. A maintainer should apply the **delete-approved** label to publish it.`,
      '',
      'Reason: _(edit this issue to add context)_'
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
    normalizeModel,
    cleanModelData,
    validateModel,
    buildSearchText,
    uniqueSorted,
    textOrDash,
    linkOrDash,
    formatDate,
    githubIssueUrl,
    deleteIssueUrl
  };
})();
