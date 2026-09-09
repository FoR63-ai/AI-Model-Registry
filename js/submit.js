(function () {
  const config = window.REGISTRY_CONFIG || {};
  const {
    FIELD_ORDER,
    validateModel,
    toModelId,
    githubIssueUrl,
    esc
  } = window.ModelRegistryUtils;

  const els = {
    open: document.getElementById('openSubmit'),
    close: document.getElementById('closeSubmit'),
    modal: document.getElementById('submitModal'),
    form: document.getElementById('submitForm'),
    errors: document.getElementById('submitErrors'),
    openIssue: document.getElementById('openIssue'),
    title: document.getElementById('submitTitle'),
    idField: document.querySelector('#submitForm [name="id"]')
  };

  // 'add' (default) or 'update' — set by openForEdit(), read by
  // updateSubmitLink() to build the right kind of prefilled GitHub issue.
  let mode = 'add';

  function getPayload() {
    const payload = {};
    const formData = new FormData(els.form);

    FIELD_ORDER.forEach((field) => {
      const value = String(formData.get(field) || '').trim();
      if (value) payload[field] = value;
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
      <ul>${errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
    `;
  }

  function updateSubmitLink() {
    const validation = validateModel(getPayload(), window.MODELS || []);
    renderErrors(validation.errors);

    if (validation.valid) {
      els.openIssue.href = githubIssueUrl(validation.data, config, mode);
      els.openIssue.style.pointerEvents = 'auto';
      els.openIssue.style.opacity = '1';
    } else {
      els.openIssue.href = '#';
      els.openIssue.style.pointerEvents = 'none';
      els.openIssue.style.opacity = '0.6';
    }

    return validation;
  }

  function fillForm(model) {
    FIELD_ORDER.forEach((field) => {
      const input = els.form.querySelector(`[name="${field}"]`);
      if (input) input.value = model[field] || '';
    });
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isEdit = mode === 'update';

    if (els.title) {
      els.title.textContent = isEdit ? 'Edit model JSON' : 'Create a new model JSON';
    }
    if (els.openIssue) {
      els.openIssue.textContent = isEdit ? 'Save changes' : 'Submit model';
    }
    if (els.idField) {
      els.idField.readOnly = isEdit;
    }
  }

  function openModal(prefillModel) {
    els.form.reset();

    if (prefillModel) {
      setMode('update');
      fillForm(prefillModel);
    } else {
      setMode('add');
    }

    els.modal.showModal();
    updateSubmitLink();
  }

  function closeModal() {
    els.modal.close();

    // Drop ?edit=... from the URL so a refresh or re-opening "Submit model"
    // doesn't re-trigger edit mode.
    if (new URLSearchParams(location.search).has('edit')) {
      const url = new URL(location.href);
      url.searchParams.delete('edit');
      history.replaceState(null, '', url);
    }
  }

  els.open?.addEventListener('click', () => openModal());
  els.close?.addEventListener('click', closeModal);

  els.modal?.addEventListener('click', (e) => {
    if (e.target === els.modal) closeModal();
  });

  els.form?.addEventListener('input', updateSubmitLink);

  els.openIssue?.addEventListener('click', (e) => {
    const validation = updateSubmitLink();
    if (!validation.valid) e.preventDefault();
  });

  // Public API: app.js calls this once model data has loaded, when the
  // page was opened as index.html?edit=<id>.
  window.ModelRegistrySubmit = { openForEdit: openModal };
})();
