(function () {
  const config = window.REGISTRY_CONFIG || {};
  const {
    FIELD_ORDER,
    validateModel,
    toModelId,
    downloadJson,
    copyText,
    githubIssueUrl,
    esc
  } = window.ModelRegistryUtils;

  const els = {
    open: document.getElementById('openSubmit'),
    close: document.getElementById('closeSubmit'),
    modal: document.getElementById('submitModal'),
    form: document.getElementById('submitForm'),
    errors: document.getElementById('submitErrors'),
    preview: document.getElementById('submitPreview'),
    copyJson: document.getElementById('copyJson'),
    downloadJson: document.getElementById('downloadJson'),
    openIssue: document.getElementById('openIssue')
  };

  function getPayload() {
    const payload = {};
    const formData = new FormData(els.form);

    FIELD_ORDER.forEach((field) => {
      payload[field] = String(formData.get(field) || '').trim();
    });

    if (!payload.id && payload.modelName && payload.organisation) {
      payload.id = toModelId(payload.modelName, payload.organisation);
      const idInput = els.form.querySelector('[name="id"]');
      if (idInput) idInput.value = payload.id;
    }

    return payload;
  }

  function renderErrors(errors) {
    if (!errors.length) {
      els.errors.classList.remove('open');
      els.errors.innerHTML = '';
      return;
    }

    els.errors.classList.add('open');
    els.errors.innerHTML = `<strong>Please fix the following:</strong><ul>${errors.map((error) => `<li>${esc(error)}</li>`).join('')}</ul>`;
  }

  function syncPreview() {
    const validation = validateModel(getPayload(), window.MODELS || []);
    els.preview.textContent = JSON.stringify(validation.data, null, 2);
    renderErrors(validation.errors);
    els.openIssue.href = githubIssueUrl(validation.data, config);
    return validation;
  }

  function openModal() {
    els.modal.showModal();
    syncPreview();
  }

  function closeModal() {
    els.modal.close();
  }

  els.open?.addEventListener('click', openModal);
  els.close?.addEventListener('click', closeModal);
  els.modal?.addEventListener('click', (event) => {
    const rect = els.modal.getBoundingClientRect();
    const inside = (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
    if (!inside) closeModal();
  });

  els.form?.addEventListener('input', syncPreview);
  els.form?.addEventListener('submit', (event) => event.preventDefault());

  els.copyJson?.addEventListener('click', async () => {
    const validation = syncPreview();
    if (!validation.valid) return;
    await copyText(JSON.stringify(validation.data, null, 2));
  });

  els.downloadJson?.addEventListener('click', () => {
    const validation = syncPreview();
    if (!validation.valid) return;
    downloadJson(`${validation.data.id || 'model'}.json`, validation.data);
  });

  syncPreview();
})();
