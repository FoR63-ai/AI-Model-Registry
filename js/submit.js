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
      const value = String(formData.get(field) || '').trim();
      if (value) {
        payload[field] = value;
      }
    });

    if (!payload.id && payload.modelName && payload.organisation) {
      payload.id = toModelId(payload.modelName, payload.organisation);
      const idInput = els.form.querySelector('[name="id"]');
      if (idInput && !idInput.value.trim()) {
        idInput.value = payload.id;
      }
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
    els.errors.innerHTML = `
      <strong>Please fix the following:</strong>
      <ul>${errors.map((error) => `<li>${esc(error)}</li>`).join('')}</ul>
    `;
  }

  function setActionState(validation) {
    const valid = Boolean(validation?.valid);

    els.copyJson.disabled = !valid;
    els.downloadJson.disabled = !valid;

    if (valid) {
      els.openIssue.href = githubIssueUrl(validation.data, config);
      els.openIssue.setAttribute('aria-disabled', 'false');
      els.openIssue.style.pointerEvents = 'auto';
      els.openIssue.style.opacity = '1';
    } else {
      els.openIssue.href = '#';
      els.openIssue.setAttribute('aria-disabled', 'true');
      els.openIssue.style.pointerEvents = 'none';
      els.openIssue.style.opacity = '0.65';
    }
  }

  function syncPreview() {
    const validation = validateModel(getPayload(), window.MODELS || []);
    els.preview.textContent = JSON.stringify(validation.data, null, 2);
    renderErrors(validation.errors);
    setActionState(validation);
    return validation;
  }

  function openModal() {
    if (!els.modal.open) {
      els.modal.showModal();
    }
    syncPreview();
    const firstField = els.form?.querySelector('input, textarea, select');
    if (firstField) firstField.focus();
  }

  function closeModal() {
    if (els.modal.open) {
      els.modal.close();
    }
  }

  els.open?.addEventListener('click', openModal);
  els.close?.addEventListener('click', closeModal);

  els.modal?.addEventListener('click', (event) => {
    if (event.target === els.modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.modal?.open) {
      closeModal();
    }
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

  els.openIssue?.addEventListener('click', (event) => {
    const validation = syncPreview();
    if (!validation.valid) {
      event.preventDefault();
    }
  });

  syncPreview();
})();
