(async function () {
  const { esc, textOrDash, linkOrDash } = window.ModelRegistryUtils;

  function getId() {
    return new URLSearchParams(location.search).get('id');
  }

  function row(label, valueHtml) {
    return `<dt>${esc(label)}</dt><dd>${valueHtml}</dd>`;
  }

  function show(html) {
    document.getElementById('app').innerHTML = html;
  }

  function showError(title, message) {
    document.title = title;
    show(`<h1>${esc(title)}</h1><p>${esc(message)}</p>`);
  }

  function renderModel(model) {
    document.title = `${model.modelName || model.id || 'Model'} – Detail`;
    show(`
      <h1>${esc(model.modelName || 'Untitled model')}</h1>
      <div class="meta">
        ${esc(model.id || '')}${model.organisation ? ` • ${esc(model.organisation)}` : ''}${model.modelStatus ? ` • ${esc(model.modelStatus)}` : ''}
      </div>
      <dl>
        ${row('Model name', textOrDash(model.modelName))}
        ${row('Organisation', textOrDash(model.organisation))}
        ${row('Model status', textOrDash(model.modelStatus))}
        ${row('AI task', textOrDash(model.aiTask))}
        ${row('Input specification', textOrDash(model.inputSpecification))}
        ${row('Output specification', textOrDash(model.outputSpecification))}
        ${row('Architecture', textOrDash(model.architecture))}
        ${row('Training data origin', textOrDash(model.trainingDataOrigin))}
        ${row('Primary performance metric', textOrDash(model.primaryPerformanceMetric))}
        ${row('License', textOrDash(model.license))}
        ${row('Access link', linkOrDash(model.accessLink))}
        ${row('More information', textOrDash(model.moreInformation))}
      </dl>
      <hr style="margin:24px 0; border:none; border-top:1px solid #dbe2ea;" />
      <h2>Raw JSON</h2>
      <pre>${esc(JSON.stringify(model, null, 2))}</pre>
    `);
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
