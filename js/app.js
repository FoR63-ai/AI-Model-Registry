(function () {
  const {
    normalize,
    esc,
    uniqueSorted,
    buildSearchText,
    normalizeModel
  } = window.ModelRegistryUtils;

  const { loadModels } = window.ModelRegistryData;

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

  let DATA = [];

  function populateFilters() {
    els.org.innerHTML = '<option value="">All</option>';
    els.status.innerHTML = '<option value="">All</option>';

    uniqueSorted(DATA.map((item) => item.organisation)).forEach((value) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      els.org.appendChild(opt);
    });

    uniqueSorted(DATA.map((item) => item.modelStatus)).forEach((value) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      els.status.appendChild(opt);
    });
  }

  function sortItems(items) {
    const sortValue = els.sort.value;

    const sorters = {
      name_asc: (a, b) => (a.modelName || '').localeCompare(b.modelName || ''),
      name_desc: (a, b) => (b.modelName || '').localeCompare(a.modelName || ''),
      org_asc: (a, b) => (a.organisation || '').localeCompare(b.organisation || ''),
      org_desc: (a, b) => (b.organisation || '').localeCompare(a.organisation || ''),
      status_asc: (a, b) => (a.modelStatus || '').localeCompare(b.modelStatus || ''),
      status_desc: (a, b) => (b.modelStatus || '').localeCompare(a.modelStatus || '')
    };

    return items.slice().sort(sorters[sortValue] || sorters.name_asc);
  }

  function render() {
    const q = normalize(els.q.value);
    const org = els.org.value;
    const status = els.status.value;

    let items = DATA.filter((model) => {
      if (org && model.organisation !== org) return false;
      if (status && model.modelStatus !== status) return false;
      if (q && !model.__searchText.includes(q)) return false;
      return true;
    });

    items = sortItems(items);

    els.count.textContent = `${items.length} model(s)`;

    els.rows.innerHTML = items.map((m) => `
      <tr>
        <td>
          <a href="detail.html?id=${encodeURIComponent(m.id)}">
            <strong>${esc(m.modelName || m.id || 'Untitled model')}</strong>
          </a>
          <div class="muted" style="padding-right:0;">${esc(m.id || '')}</div>
        </td>
        <td>${esc(m.organisation || '—')}</td>
        <td>${m.modelStatus ? `<span class="badge">${esc(m.modelStatus)}</span>` : '—'}</td>
        <td>${esc(m.aiTask || '—')}</td>
        <td>${esc(m.primaryPerformanceMetric || '—')}</td>
        <td>${esc(m.license || '—')}</td>
      </tr>
    `).join('');

    els.emptyState.hidden = items.length !== 0;
  }

  function wire() {
    els.q?.addEventListener('input', render);
    els.org?.addEventListener('change', render);
    els.status?.addEventListener('change', render);
    els.sort?.addEventListener('change', render);
    els.clear?.addEventListener('click', () => {
      els.q.value = '';
      els.org.value = '';
      els.status.value = '';
      els.sort.value = 'name_asc';
      render();
    });
  }

  async function init() {
    try {
      const models = await loadModels();

      DATA = models.map((model) => {
        const normalized = normalizeModel(model);
        return {
          ...normalized,
          __searchText: buildSearchText(normalized)
        };
      });

      window.MODELS = DATA;

      populateFilters();
      wire();
      render();
    } catch (error) {
      console.error(error);
      els.count.textContent = 'Failed to load models.';
      els.rows.innerHTML = `
        <tr>
          <td colspan="6">Could not load model data.</td>
        </tr>
      `;
      els.emptyState.hidden = true;
    }
  }

  init();
})();
