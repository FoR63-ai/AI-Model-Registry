(async function () {
  const { esc, textOrDash, linkOrDash } = window.ModelRegistryUtils;

  function getId() {
    return new URLSearchParams(location.search).get('id');
  }

  function row(label, valueHtml) {
    return `<div class="label">${esc(label)}</div><div class="value">${valueHtml}</div>`;
  }

  function show(html) {
    document.getElementById('app').innerHTML = html;
  }

  function showError(title, message) {
    document.title = title;
    document.getElementById('metaHint').textContent = '';
    show(`<h1>${esc(title)}</h1><p>${esc(message)}</p><p class="muted">Tip: open <code>index.html</code> and click a model name.</p>`);
  }

  function renderModel(model) {
    document.title = `${model.modelName || model.id || 'Model'} – Detail`;
    document.getElementById('metaHint').textContent = [
      model.id ? `ID: ${model.id}` : '',
      model.organisation ? `Organisation: ${model.organisation}` : '',
      model.modelStatus ? `Status: ${model.modelStatus}` : ''
    ].filter(Boolean).join(' • ');

    show(
      `<h1>${esc(model.modelName || 'Untitled model')}</h1>` +
      `<div class="muted">${model.id ? `<span class="badge">${esc(model.id)}</span>` : ''}${model.modelStatus ? ` &nbsp;•&nbsp; <span class="badge">${esc(model.modelStatus)}</span>` : ''}</div>` +
      `<div class="grid">` +
        row('Model name', textOrDash(model.modelName)) +
        row('Organisation', textOrDash(model.organisation)) +
        row('Model status', textOrDash(model.modelStatus)) +
        row('AI task', textOrDash(model.aiTask)) +
        row('Input specification', textOrDash(model.inputSpecification)) +
        row('Output specification', textOrDash(model.outputSpecification)) +
        row('Architecture', textOrDash(model.architecture)) +
        row('Training data origin', textOrDash(model.trainingDataOrigin)) +
        row('Primary performance metric', textOrDash(model.primaryPerformanceMetric)) +
        row('License', textOrDash(model.license)) +
        row('Access link', linkOrDash(model.accessLink)) +
        row('More information', textOrDash(model.moreInformation)) +
      `</div><hr /><details><summary style="cursor:pointer;">Show raw JSON</summary><pre>${esc(JSON.stringify(model, null, 2))}</pre></details>`
    );
  }

  try {
    const id = getId();
    if (!id) {
      showError('Not found', 'Missing query parameter: ?id=...');
      return;
    }
    const models = await window.ModelRegistryData.loadModels();
    const model = models.find((entry) => String(entry.id) === String(id));
    if (!model) {
      showError('Not found', `No model found for id="${id}".`);
      return;
    }
    renderModel(model);
  } catch (error) {
    console.error(error);
    showError('Error', error.message || String(error));
  }
})();
