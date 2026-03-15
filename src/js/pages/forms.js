/**
 * Forms Page — Dynamic Form Renderer
 * Works with server-rendered form-card.ejs (fields rendered by EJS).
 * Handles multi-step navigation, validation, conditional fields, and API submission.
 */
import '../../styles/pages/forms.css';

// ===== URL Params =====
const urlParams = new URLSearchParams(window.location.search);
const referrerSource = urlParams.get('source') || '';
const referrerProduct = urlParams.get('product') || '';

// ===== Elements =====
const form = document.getElementById('intakeForm');
const formCard = document.querySelector('.form-card');
const progressStep = document.getElementById('progressStep');
const progressFill = document.getElementById('progressFill');

if (!form) throw new Error('Form element #intakeForm not found');

// ===== State =====
let currentStep = 0;
let totalSteps = 0;
let isAnimating = false;
let steps = [];

// ===== Init =====

function init() {
  // Steps are server-rendered by form-card.ejs
  steps = Array.from(form.querySelectorAll('.form-step'));
  totalSteps = steps.length;

  if (totalSteps === 0) return;

  // Set up step navigation buttons
  form.querySelectorAll('.step-next').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!isAnimating && validateStep(currentStep)) {
        goToStep(currentStep + 1, 'forward');
      }
    });
  });

  form.querySelectorAll('.step-prev').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!isAnimating && currentStep > 0) {
        goToStep(currentStep - 1, 'back');
      }
    });
  });

  // Set up conditional fields
  initConditionalFields();

  // Set up phone auto-formatting
  initPhoneFormatters();

  // Clear errors on input
  initErrorClear();

  // Form submission
  form.addEventListener('submit', handleSubmit);

  // Update progress display
  updateProgress();
}

// ===== Step Navigation =====

function goToStep(next, direction) {
  if (isAnimating || next < 0 || next >= totalSteps) return;
  isAnimating = true;

  const current = steps[currentStep];
  const outClass = direction === 'forward' ? 'slide-out' : 'slide-out-back';

  current.style.animation = 'none';
  current.offsetHeight; // force reflow
  current.style.animation = '';
  current.classList.add(outClass);

  setTimeout(() => {
    current.classList.remove('active', outClass);

    currentStep = next;
    const nextStepEl = steps[currentStep];
    nextStepEl.classList.add('active');
    nextStepEl.style.animation = 'none';
    nextStepEl.offsetHeight;
    nextStepEl.style.animation = '';
    nextStepEl.classList.remove('slide-back-in');

    if (direction === 'back') {
      nextStepEl.classList.add('slide-back-in');
    }

    updateProgress();
    isAnimating = false;
  }, 280);
}

function updateProgress() {
  if (progressStep) {
    progressStep.textContent = `Step ${currentStep + 1} of ${totalSteps}`;
  }
  if (progressFill) {
    const pct = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100;
    progressFill.style.width = pct + '%';
  }

  if (window.innerWidth <= 768 && formCard) {
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ===== Validation =====

function validateStep(stepIndex) {
  const stepEl = steps[stepIndex];
  clearErrors(stepEl);
  let valid = true;
  let firstInvalid = null;

  // Validate all visible required fields in this step
  const visibleGroups = stepEl.querySelectorAll(
    '.form-group:not([style*="display: none"]):not([style*="display:none"])'
  );

  visibleGroups.forEach((group) => {
    const inputs = group.querySelectorAll(
      'input[required], textarea[required], select[required]'
    );

    inputs.forEach((input) => {
      if (input.type === 'checkbox') {
        if (!input.checked) {
          markError(input);
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      } else if (input.type === 'radio') {
        const name = input.name;
        const checked = stepEl.querySelector(`input[name="${name}"]:checked`);
        if (!checked) {
          const fieldset = input.closest('fieldset');
          if (fieldset) fieldset.classList.add('error');
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      } else if (!input.value.trim()) {
        input.classList.add('error');
        valid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    // Email format validation
    const emailInput = group.querySelector('input[type="email"]');
    if (emailInput && emailInput.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('error');
        valid = false;
        if (!firstInvalid) firstInvalid = emailInput;
      }
    }
  });

  if (!valid) {
    shakeCard();
    if (firstInvalid) firstInvalid.focus();
  }

  return valid;
}

function clearErrors(stepEl) {
  stepEl.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));
  stepEl.querySelectorAll('.error-check').forEach((el) => el.classList.remove('error-check'));
}

function markError(input) {
  if (input.type === 'checkbox') {
    const label = input.closest('.checkbox-label, .form-check');
    if (label) label.classList.add('error-check');
    else input.classList.add('error');
  } else {
    input.classList.add('error');
  }
}

function shakeCard() {
  if (!formCard) return;
  formCard.classList.remove('shake');
  formCard.offsetHeight;
  formCard.classList.add('shake');
  formCard.addEventListener('animationend', () => formCard.classList.remove('shake'), { once: true });
}

// ===== Conditional Fields =====

function initConditionalFields() {
  const conditionalGroups = form.querySelectorAll('[data-condition]');

  conditionalGroups.forEach((group) => {
    let condition;
    try {
      condition = JSON.parse(group.dataset.condition);
    } catch {
      return;
    }

    // condition is e.g. { fieldName: "value" } or { fieldName: ["val1", "val2"] }
    Object.keys(condition).forEach((fieldName) => {
      const sourceFields = form.querySelectorAll(`[name="${fieldName}"]`);
      sourceFields.forEach((sourceField) => {
        sourceField.addEventListener('change', () => evaluateCondition(group, condition));
        sourceField.addEventListener('input', () => evaluateCondition(group, condition));
      });
    });

    // Initial evaluation
    evaluateCondition(group, condition);
  });
}

function evaluateCondition(group, condition) {
  let allMet = true;

  Object.keys(condition).forEach((fieldName) => {
    const expected = condition[fieldName];
    const sourceFields = form.querySelectorAll(`[name="${fieldName}"]`);

    let currentValue = '';
    if (sourceFields.length === 1) {
      const field = sourceFields[0];
      currentValue = field.type === 'checkbox' ? (field.checked ? field.value : '') : field.value;
    } else if (sourceFields.length > 1) {
      const checked = form.querySelector(`[name="${fieldName}"]:checked`);
      currentValue = checked ? checked.value : '';
    }

    if (Array.isArray(expected)) {
      if (!expected.includes(currentValue)) allMet = false;
    } else {
      if (currentValue !== expected) allMet = false;
    }
  });

  group.style.display = allMet ? '' : 'none';
}

// ===== Phone Auto-Format =====

function initPhoneFormatters() {
  form.querySelectorAll('input[type="tel"]').forEach((phoneInput) => {
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 10) val = val.slice(0, 10);

      if (val.length >= 7) {
        val = '(' + val.slice(0, 3) + ') ' + val.slice(3, 6) + '-' + val.slice(6);
      } else if (val.length >= 4) {
        val = '(' + val.slice(0, 3) + ') ' + val.slice(3);
      } else if (val.length >= 1) {
        val = '(' + val;
      }

      e.target.value = val;
    });
  });
}

// ===== Error Clear on Input =====

function initErrorClear() {
  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('error')) {
      e.target.classList.remove('error');
    }
  });

  form.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const label = e.target.closest('.checkbox-label, .form-check');
      if (label && label.classList.contains('error-check')) {
        label.classList.remove('error-check');
      }
    }
    if (e.target.classList.contains('error')) {
      e.target.classList.remove('error');
    }
    const fieldset = e.target.closest('fieldset.error');
    if (fieldset) fieldset.classList.remove('error');
  });
}

// ===== Form Submission =====

async function handleSubmit(e) {
  e.preventDefault();

  if (!validateStep(currentStep)) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : '';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting\u2026';
  }

  // Gather field data from all inputs
  const formData = new FormData(form);
  const fields = [];
  const seen = new Set();

  formData.forEach((value, key) => {
    if (seen.has(key)) {
      // Multi-value (checkboxes) — append to existing entry
      const existing = fields.find((f) => f.fieldKey === key);
      if (existing) {
        if (!Array.isArray(existing.value)) {
          existing.value = [existing.value];
        }
        existing.value.push(value);
      }
    } else {
      seen.add(key);
      fields.push({ fieldKey: key, value });
    }
  });

  // Stringify array values (checkbox groups)
  fields.forEach((f) => {
    if (Array.isArray(f.value)) {
      f.value = f.value.join(', ');
    }
  });

  // Get form slug and submit URL from data attributes set by form-card.ejs
  const formSlug = form.dataset.formSlug || 'patient-intake';
  const submitUrl = form.dataset.submitUrl || `/api/public/forms/${formSlug}/submit`;

  const payload = {
    formSlug,
    source: referrerSource || undefined,
    productId: referrerProduct || undefined,
    fields,
  };

  try {
    const response = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Server returned ${response.status}`);
    }

    const result = await response.json();
    const submissionId = result.data?.id || '';

    // Redirect based on whether form requires payment
    if (form.dataset.requiresPayment === 'true' || result.data?.paymentStatus) {
      window.location.href = `/pages/payment.html?submission=${encodeURIComponent(submissionId)}`;
    } else {
      window.location.href = '/pages/thank-you.html';
    }
  } catch (err) {
    console.error('Form submission failed:', err);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }

    // Show inline error message
    let errorEl = form.querySelector('.form-submit-error');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'form-submit-error';
      submitBtn.parentNode.insertBefore(errorEl, submitBtn);
    }
    errorEl.textContent = 'Something went wrong. Please try again.';
  }
}

// ===== Boot =====
init();
