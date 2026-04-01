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
    openIssue: document.getElementById('openIssue')
  };

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
      els.openIssue.href = githubIssueUrl(validation.data, config);
      els.openIssue.style.pointerEvents = 'auto';
      els.openIssue.style.opacity = '1';
    } else {
      els.openIssue.href = '#';
      els.openIssue.style.pointerEvents = 'none';
      els.openIssue.style.opacity = '0.6';
    }

    return validation;
  }

  function openModal() {
    els.modal.showModal();
    updateSubmitLink();
  }

  function closeModal() {
    els.modal.close();
  }

  els.open?.addEventListener('click', openModal);
  els.close?.addEventListener('click', closeModal);

  els.modal?.addEventListener('click', (e) => {
    if (e.target === els.modal) closeModal();
  });

  els.form?.addEventListener('input', updateSubmitLink);

  els.openIssue?.addEventListener('click', (e) => {
    const validation = updateSubmitLink();
    if (!validation.valid) e.preventDefault();
  });

})();
