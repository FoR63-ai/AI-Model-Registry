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
    openIssue: document.getElementById('openIssue'),
    submitToApi: document.getElementById('submitToApi')
  };

  function openModal() {
    els.modal.classList.add('open');
    els.modal.setAttribute('aria-hidden', 'false');
    syncPreview();
  }

  function closeModal() {
    els.modal.classList.remove('open');
    els.modal.setAttribute('aria-hidden', 'true');
  }

  function getPayload() {
    const formData = new FormData(els.form);
    const payload = {};
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

  async function submitToApi() {
    const validation = syncPreview();
    if (!validation.valid) return;

    if (!config.submitEndpoint) {
      renderErrors(['Automatic submission is not enabled yet. Either configure window.REGISTRY_CONFIG.submitEndpoint or use “Open GitHub issue”.']);
      return;
    }

    els.submitToApi.disabled = true;
    els.submitToApi.textContent = 'Submitting...';
    try {
      const response = await fetch(config.submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data)
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || `Submission failed with status ${response.status}`);
      }

      renderErrors([]);
      alert('Submission received. A pull request should now be open for review.');
      closeModal();
      els.form.reset();
      syncPreview();
    } catch (error) {
      renderErrors([error.message || String(error)]);
    } finally {
      els.submitToApi.disabled = false;
      els.submitToApi.textContent = 'Submit for review';
    }
  }

  els.open?.addEventListener('click', openModal);
  els.close?.addEventListener('click', closeModal);
  els.modal?.addEventListener('click', (event) => {
    if (event.target === els.modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.modal.classList.contains('open')) closeModal();
  });
  els.form?.addEventListener('input', syncPreview);
  els.form?.addEventListener('submit', (event) => event.preventDefault());
  els.copyJson?.addEventListener('click', async () => {
    const validation = syncPreview();
    await copyText(JSON.stringify(validation.data, null, 2));
  });
  els.downloadJson?.addEventListener('click', () => {
    const validation = syncPreview();
    downloadJson(`${validation.data.id || 'model-submission'}.json`, validation.data);
  });
  els.submitToApi?.addEventListener('click', submitToApi);
  syncPreview();
})();
