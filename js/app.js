(async function () {
  const { esc, normalize, buildSearchText, uniqueSorted } = window.ModelRegistryUtils;

  const els = {
    q: document.getElementById('q'),
    org: document.getElementById('org'),
    status: document.getElementById('status'),
    sort: document.getElementById('sort'),
    clear: document.getElementById('clear'),
    count: document.getElementById('count'),
    rows: document.getElementById('rows'),
    emptyState: document.getElementById('emptyState')
  };

  function sortItems(items) {
    const sortMode = els.sort.value;
    const sorter = {
      name_asc: (a, b) => (a.modelName || '').localeCompare(b.modelName || ''),
      name_desc: (a, b) => (b.modelName || '').localeCompare(a.modelName || ''),
      org_asc: (a, b) => (a.organisation || '').localeCompare(b.organisation || ''),
      org_desc: (a, b) => (b.organisation || '').localeCompare(a.organisation || ''),
      status_asc: (a, b) => (a.modelStatus || '').localeCompare(b.modelStatus || ''),
      status_desc: (a, b) => (b.modelStatus || '').localeCompare(a.modelStatus || '')
    }[sortMode] || (() => 0);

    return items.slice().sort(sorter);
  }

  function populateFilters(models) {
    uniqueSorted(models.map((model) => model.organisation)).forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      els.org.appendChild(option);
    });

    uniqueSorted(models.map((model) => model.modelStatus)).forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      els.status.appendChild(option);
    });
  }

  function render(models) {
    const query = normalize(els.q.value);
    const org = els.org.value;
    const status = els.status.value;

    let items = models.filter((model) => {
      if (org && (model.organisation || '') !== org) return false;
      if (status && (model.modelStatus || '') !== status) return false;
      if (query && !model.__searchText.includes(query)) return false;
      return true;
    });

    items = sortItems(items);

    els.count.textContent = `${items.length} model(s)`;
    els.emptyState.hidden = items.length > 0;

    els.rows.innerHTML = items.map((model) => `
      <tr>
        <td>
          <a href="detail.html?id=${encodeURIComponent(model.id)}"><strong>${esc(model.modelName || model.id)}</strong></a>
          <div class="muted">${esc(model.id || '')}</div>
        </td>
        <td>${esc(model.organisation || '')}</td>
        <td>${model.modelStatus ? `<span class="badge">${esc(model.modelStatus)}</span>` : ''}</td>
        <td>${esc(model.aiTask || '')}</td>
        <td>${esc(model.primaryPerformanceMetric || '')}</td>
        <td>${esc(model.license || '')}</td>
      </tr>
    `).join('');
  }

  function wire(models) {
    els.q.addEventListener('input', () => render(models));
    els.org.addEventListener('change', () => render(models));
    els.status.addEventListener('change', () => render(models));
    els.sort.addEventListener('change', () => render(models));
    els.clear.addEventListener('click', () => {
      els.q.value = '';
      els.org.value = '';
      els.status.value = '';
      els.sort.value = 'name_asc';
      render(models);
    });
  }

  try {
    const models = (await window.ModelRegistryData.loadModels()).map((model) => ({
      ...model,
      __searchText: buildSearchText(model)
    }));

    window.MODELS = models;
    populateFilters(models);
    wire(models);
    render(models);
  } catch (error) {
    console.error(error);
    els.count.textContent = 'Unable to load models';
    els.rows.innerHTML = `<tr><td colspan="6" class="empty">${esc(error.message)}</td></tr>`;
  }
})();
