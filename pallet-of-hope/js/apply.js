// ===========================
// PALLET OF HOPE — APPLY.JS
// ===========================

let currentStep = 1;
const totalSteps = 5;
let uploadedFiles = [];

// ---- STEP NAVIGATION ----

function nextStep(from) {
  if (!validateStep(from)) return;
  goToStep(from + 1);
}

function prevStep(from) {
  goToStep(from - 1);
}

function goToStep(step) {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  // Show target
  document.getElementById('step' + step).classList.add('active');
  // Update progress
  updateProgress(step);
  currentStep = step;
  // Scroll to top of form
  document.getElementById('formWrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Populate review on step 5
  if (step === 5) populateReview();
}

function updateProgress(step) {
  document.querySelectorAll('.progress-step').forEach((el, i) => {
    const num = i + 1;
    el.classList.remove('active', 'completed');
    if (num === step) el.classList.add('active');
    if (num < step) el.classList.add('completed');
  });
  document.querySelectorAll('.progress-line').forEach((el, i) => {
    el.classList.remove('completed');
    if (i + 1 < step) el.classList.add('completed');
  });
}

// ---- VALIDATION ----

function validateStep(step) {
  let valid = true;

  if (step === 1) {
    const fields = ['firstName', 'lastName', 'email', 'phone', 'zip', 'city'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
    // Email format
    const email = document.getElementById('email');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add('error');
      valid = false;
    }
  }

  if (step === 2) {
    const fields = ['familyType', 'numChildren', 'childrenAges', 'employmentStatus', 'monthlyIncome'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
  }

  if (step === 3) {
    const fields = ['dailyLife', 'employmentBarriers', 'resellerWhy', 'palletMeaning'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim() || el.value.trim().length < 30) {
        el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
  }

  if (step === 4) {
    const selfDeclare = document.getElementById('selfDeclare').checked;
    const hasFiles = uploadedFiles.length > 0;

    if (!hasFiles && !selfDeclare) {
      alert('Please upload at least one document or complete the self-declaration to continue.');
      valid = false;
    }
    if (selfDeclare) {
      const text = document.getElementById('selfDeclareText').value.trim();
      if (text.length < 20) {
        document.getElementById('selfDeclareText').classList.add('error');
        valid = false;
      }
    }
  }

  if (!valid && step < 4) {
    const firstError = document.querySelector('.form-step.active .error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showError('Please fill in all required fields before continuing.');
  }

  return valid;
}

function showError(msg) {
  const existing = document.getElementById('errorMsg');
  if (existing) existing.remove();
  const err = document.createElement('div');
  err.id = 'errorMsg';
  err.style.cssText = 'background:#FFF5F5;border:1px solid #FC8181;color:#C53030;padding:12px 18px;border-radius:10px;font-size:0.9rem;margin-bottom:16px;';
  err.textContent = msg;
  const activeStep = document.querySelector('.form-step.active');
  activeStep.insertBefore(err, activeStep.querySelector('.form-nav'));
  setTimeout(() => err.remove(), 4000);
}

// ---- FILE UPLOAD ----

function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name} is too large. Max size is 10MB.`);
      return;
    }
    if (!uploadedFiles.find(f => f.name === file.name)) {
      uploadedFiles.push(file);
    }
  });
  renderFileList();
}

function renderFileList() {
  const container = document.getElementById('fileList');
  container.innerHTML = '';
  uploadedFiles.forEach((file, i) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const icon = ['pdf'].includes(ext) ? '📄' : ['jpg','jpeg','png'].includes(ext) ? '🖼️' : '📋';
    const size = file.size < 1024 * 1024
      ? (file.size / 1024).toFixed(0) + ' KB'
      : (file.size / 1024 / 1024).toFixed(1) + ' MB';
    container.innerHTML += `
      <div class="file-item">
        <span class="file-icon">${icon}</span>
        <span class="file-name">${file.name}</span>
        <span class="file-size">${size}</span>
        <button class="file-remove" onclick="removeFile(${i})" title="Remove">✕</button>
      </div>
    `;
  });
}

function removeFile(index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
}

// Drag and drop
const uploadArea = document.getElementById('uploadArea');
if (uploadArea) {
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (!uploadedFiles.find(f => f.name === file.name)) {
        uploadedFiles.push(file);
      }
    });
    renderFileList();
  });
}

// ---- SELF DECLARE TOGGLE ----

function toggleSelfDeclare() {
  const checked = document.getElementById('selfDeclare').checked;
  document.getElementById('selfDeclareBox').style.display = checked ? 'block' : 'none';
}

// ---- CHARACTER COUNTERS ----

const counters = [
  { id: 'dailyLife', countId: 'count1' },
  { id: 'employmentBarriers', countId: 'count2' },
  { id: 'resellerWhy', countId: 'count3' },
  { id: 'palletMeaning', countId: 'count4' },
];

counters.forEach(({ id, countId }) => {
  const el = document.getElementById(id);
  const counter = document.getElementById(countId);
  if (!el || !counter) return;
  el.addEventListener('input', () => {
    const len = el.value.length;
    counter.textContent = `${len} / 1000`;
    if (len > 950) counter.style.color = '#E53E3E';
    else counter.style.color = '';
    if (len > 1000) el.value = el.value.slice(0, 1000);
  });
});

// Remove error on input
document.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
  el.addEventListener('change', () => el.classList.remove('error'));
});

// ---- REVIEW ----

function val(id) {
  const el = document.getElementById(id);
  return el ? (el.value || '—') : '—';
}

function populateReview() {
  const benefits = Array.from(document.querySelectorAll('input[name="benefits"]:checked'))
    .map(c => c.parentElement.textContent.trim()).join(', ') || 'None selected';

  const fileNames = uploadedFiles.map(f => f.name).join(', ') || 'None uploaded';

  const selfDeclare = document.getElementById('selfDeclare').checked;

  document.getElementById('reviewContent').innerHTML = `
    <div class="review-block">
      <h4>Contact Information</h4>
      <p><strong>Name:</strong> ${val('firstName')} ${val('lastName')}</p>
      <p><strong>Email:</strong> ${val('email')}</p>
      <p><strong>Phone:</strong> ${val('phone')}</p>
      <p><strong>Location:</strong> ${val('city')} ${val('zip')}</p>
    </div>
    <div class="review-divider"></div>
    <div class="review-block">
      <h4>Family Information</h4>
      <p><strong>Applying as:</strong> ${val('familyType').replace(/-/g,' ')}</p>
      <p><strong>Number of children:</strong> ${val('numChildren')}</p>
      <p><strong>Children's ages:</strong> ${val('childrenAges')}</p>
      <p><strong>Diagnosis/needs:</strong> ${val('diagnosisType') || 'Not provided'}</p>
      <p><strong>Employment status:</strong> ${val('employmentStatus').replace(/-/g,' ')}</p>
      <p><strong>Monthly income:</strong> $${val('monthlyIncome')}</p>
      <p><strong>Benefits received:</strong> ${benefits}</p>
    </div>
    <div class="review-divider"></div>
    <div class="review-block">
      <h4>Personal Statement</h4>
      <p><strong>Daily life:</strong> ${val('dailyLife').slice(0,200)}${val('dailyLife').length > 200 ? '...' : ''}</p>
      <p style="margin-top:10px"><strong>Employment barriers:</strong> ${val('employmentBarriers').slice(0,200)}${val('employmentBarriers').length > 200 ? '...' : ''}</p>
      <p style="margin-top:10px"><strong>Why reselling:</strong> ${val('resellerWhy').slice(0,200)}${val('resellerWhy').length > 200 ? '...' : ''}</p>
    </div>
    <div class="review-divider"></div>
    <div class="review-block">
      <h4>Documentation</h4>
      <p><strong>Uploaded files:</strong> ${fileNames}</p>
      ${selfDeclare ? '<p><strong>Self-declaration:</strong> Included</p>' : ''}
    </div>
  `;
}

// ---- SUBMIT ----

async function submitApplication() {
  const consent1 = document.getElementById('consentAccurate').checked;
  const consent2 = document.getElementById('consentPrivacy').checked;
  if (!consent1 || !consent2) {
    showError('Please agree to both required consent statements before submitting.');
    return;
  }

  const submitBtn = document.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting… please wait';

  try {
    const formData = new FormData();
    // Contact
    formData.append('firstName',  val('firstName'));
    formData.append('lastName',   val('lastName'));
    formData.append('email',      val('email'));
    formData.append('phone',      val('phone'));
    formData.append('city',       val('city'));
    formData.append('zip',        val('zip'));
    // Family
    formData.append('familyType',       val('familyType'));
    formData.append('numChildren',      val('numChildren'));
    formData.append('childrenAges',     val('childrenAges'));
    formData.append('diagnosisType',    val('diagnosisType'));
    formData.append('employmentStatus', val('employmentStatus'));
    formData.append('monthlyIncome',    val('monthlyIncome'));
    const benefits = Array.from(document.querySelectorAll('input[name="benefits"]:checked')).map(c => c.value);
    formData.append('benefits', benefits.join(','));
    // Story
    formData.append('dailyLife',          val('dailyLife'));
    formData.append('employmentBarriers', val('employmentBarriers'));
    formData.append('resellerWhy',        val('resellerWhy'));
    formData.append('palletMeaning',      val('palletMeaning'));
    formData.append('resellerExperience', val('resellerExperience'));
    // Declaration
    formData.append('selfDeclare',     document.getElementById('selfDeclare').checked);
    formData.append('selfDeclareText', val('selfDeclareText'));
    // Consent
    formData.append('consentAccurate', consent1);
    formData.append('consentPrivacy',  consent2);
    formData.append('consentContact',  document.getElementById('consentContact').checked);
    // Files
    uploadedFiles.forEach(file => formData.append('documents', file));

    const res  = await fetch('/api/apply', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Submission failed');

    document.getElementById('applicationForm').style.display = 'none';
    document.querySelector('.progress-bar-wrap').style.display = 'none';
    const successState = document.getElementById('successState');
    successState.style.display = 'block';
    document.getElementById('applicationId').textContent = 'Application ID: ' + data.id;
    successState.style.animation = 'fadeUp 0.6s ease both';
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit My Application 🧡';
    showError('There was a problem submitting: ' + err.message + '. Please try again or contact us directly.');
  }
}      <div class="review-block">
        <h4>Personal Statement</h4>
        <p style="font-size:0.78rem;color:#7A6558;font-weight:600;margin-bottom:2px">Daily Life & Family Situation:</p>
        <p>${val('dailyLife').slice(0,200)}${val('dailyLife').length > 200 ? '...' : ''}</p>
        <p style="font-size:0.78rem;color:#7A6558;font-weight:600;margin-top:10px;margin-bottom:2px">Employment Barriers:</p>
        <p>${val('employmentBarriers').slice(0,200)}${val('employmentBarriers').length > 200 ? '...' : ''}</p>
        <p style="font-size:0.78rem;color:#7A6558;font-weight:600;margin-top:10px;margin-bottom:2px">Why They Want to Resell:</p>
        <p>${val('resellerWhy').slice(0,200)}${val('resellerWhy').length > 200 ? '...' : ''}</p>
        <p style="font-size:0.78rem;color:#7A6558;font-weight:600;margin-top:10px;margin-bottom:2px">What a Pallet Would Mean:</p>
        <p>${val('palletMeaning').slice(0,200)}${val('palletMeaning').length > 200 ? '...' : ''}</p>
      </div>===================
// PALLET OF HOPE — APPLY.JS
// ===========================

let currentStep = 1;
const totalSteps = 5;
let uploadedFiles = [];

// ---- STEP NAVIGATION ----

function nextStep(from) {
  if (!validateStep(from)) return;
  goToStep(from + 1);
}

function prevStep(from) {
  goToStep(from - 1);
}

function goToStep(step) {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  // Show target
  document.getElementById('step' + step).classList.add('active');
  // Update progress
  updateProgress(step);
  currentStep = step;
  // Scroll to top of form
  document.getElementById('formWrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Populate review on step 5
  if (step === 5) populateReview();
}

function updateProgress(step) {
  document.querySelectorAll('.progress-step').forEach((el, i) => {
    const num = i + 1;
    el.classList.remove('active', 'completed');
    if (num === step) el.classList.add('active');
    if (num < step) el.classList.add('completed');
  });
  document.querySelectorAll('.progress-line').forEach((el, i) => {
    el.classList.remove('completed');
    if (i + 1 < step) el.classList.add('completed');
  });
}

// ---- VALIDATION ----

function validateStep(step) {
  let valid = true;

  if (step === 1) {
    const fields = ['firstName', 'lastName', 'email', 'phone', 'zip', 'city'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
    // Email format
    const email = document.getElementById('email');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add('error');
      valid = false;
    }
  }

  if (step === 2) {
    const fields = ['familyType', 'numChildren', 'childrenAges', 'employmentStatus', 'monthlyIncome'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
  }

  if (step === 3) {
    const fields = ['dailyLife', 'employmentBarriers', 'resellerWhy', 'palletMeaning'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim() || el.value.trim().length < 30) {
        el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
  }

  if (step === 4) {
    const selfDeclare = document.getElementById('selfDeclare').checked;
    const hasFiles = uploadedFiles.length > 0;

    if (!hasFiles && !selfDeclare) {
      alert('Please upload at least one document or complete the self-declaration to continue.');
      valid = false;
    }
    if (selfDeclare) {
      const text = document.getElementById('selfDeclareText').value.trim();
      if (text.length < 20) {
        document.getElementById('selfDeclareText').classList.add('error');
        valid = false;
      }
    }
  }

  if (!valid && step < 4) {
    const firstError = document.querySelector('.form-step.active .error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showError('Please fill in all required fields before continuing.');
  }

  return valid;
}

function showError(msg) {
  const existing = document.getElementById('errorMsg');
  if (existing) existing.remove();
  const err = document.createElement('div');
  err.id = 'errorMsg';
  err.style.cssText = 'background:#FFF5F5;border:1px solid #FC8181;color:#C53030;padding:12px 18px;border-radius:10px;font-size:0.9rem;margin-bottom:16px;';
  err.textContent = msg;
  const activeStep = document.querySelector('.form-step.active');
  activeStep.insertBefore(err, activeStep.querySelector('.form-nav'));
  setTimeout(() => err.remove(), 4000);
}

// ---- FILE UPLOAD ----

function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name} is too large. Max size is 10MB.`);
      return;
    }
    if (!uploadedFiles.find(f => f.name === file.name)) {
      uploadedFiles.push(file);
    }
  });
  renderFileList();
}

function renderFileList() {
  const container = document.getElementById('fileList');
  container.innerHTML = '';
  uploadedFiles.forEach((file, i) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const icon = ['pdf'].includes(ext) ? '📄' : ['jpg','jpeg','png'].includes(ext) ? '🖼️' : '📋';
    const size = file.size < 1024 * 1024
      ? (file.size / 1024).toFixed(0) + ' KB'
      : (file.size / 1024 / 1024).toFixed(1) + ' MB';
    container.innerHTML += `
      <div class="file-item">
        <span class="file-icon">${icon}</span>
        <span class="file-name">${file.name}</span>
        <span class="file-size">${size}</span>
        <button class="file-remove" onclick="removeFile(${i})" title="Remove">✕</button>
      </div>
    `;
  });
}

function removeFile(index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
}

// Drag and drop
const uploadArea = document.getElementById('uploadArea');
if (uploadArea) {
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (!uploadedFiles.find(f => f.name === file.name)) {
        uploadedFiles.push(file);
      }
    });
    renderFileList();
  });
}

// ---- SELF DECLARE TOGGLE ----

function toggleSelfDeclare() {
  const checked = document.getElementById('selfDeclare').checked;
  document.getElementById('selfDeclareBox').style.display = checked ? 'block' : 'none';
}

// ---- CHARACTER COUNTERS ----

const counters = [
  { id: 'dailyLife', countId: 'count1' },
  { id: 'employmentBarriers', countId: 'count2' },
  { id: 'resellerWhy', countId: 'count3' },
  { id: 'palletMeaning', countId: 'count4' },
];

counters.forEach(({ id, countId }) => {
  const el = document.getElementById(id);
  const counter = document.getElementById(countId);
  if (!el || !counter) return;
  el.addEventListener('input', () => {
    const len = el.value.length;
    counter.textContent = `${len} / 1000`;
    if (len > 950) counter.style.color = '#E53E3E';
    else counter.style.color = '';
    if (len > 1000) el.value = el.value.slice(0, 1000);
  });
});

// Remove error on input
document.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
  el.addEventListener('change', () => el.classList.remove('error'));
});

// ---- REVIEW ----

function val(id) {
  const el = document.getElementById(id);
  return el ? (el.value || '—') : '—';
}

function populateReview() {
  const benefits = Array.from(document.querySelectorAll('input[name="benefits"]:checked'))
    .map(c => c.parentElement.textContent.trim()).join(', ') || 'None selected';

  const fileNames = uploadedFiles.map(f => f.name).join(', ') || 'None uploaded';

  const selfDeclare = document.getElementById('selfDeclare').checked;

  document.getElementById('reviewContent').innerHTML = `
    <div class="review-block">
      <h4>Contact Information</h4>
      <p><strong>Name:</strong> ${val('firstName')} ${val('lastName')}</p>
      <p><strong>Email:</strong> ${val('email')}</p>
      <p><strong>Phone:</strong> ${val('phone')}</p>
      <p><strong>Location:</strong> ${val('city')} ${val('zip')}</p>
    </div>
    <div class="review-divider"></div>
    <div class="review-block">
      <h4>Family Information</h4>
      <p><strong>Applying as:</strong> ${val('familyType').replace(/-/g,' ')}</p>
      <p><strong>Number of children:</strong> ${val('numChildren')}</p>
      <p><strong>Children's ages:</strong> ${val('childrenAges')}</p>
      <p><strong>Diagnosis/needs:</strong> ${val('diagnosisType') || 'Not provided'}</p>
      <p><strong>Employment status:</strong> ${val('employmentStatus').replace(/-/g,' ')}</p>
      <p><strong>Monthly income:</strong> $${val('monthlyIncome')}</p>
      <p><strong>Benefits received:</strong> ${benefits}</p>
    </div>
    <div class="review-divider"></div>
    <div class="review-block">
      <h4>Personal Statement</h4>
      <p><strong>Daily life:</strong> ${val('dailyLife').slice(0,200)}${val('dailyLife').length > 200 ? '...' : ''}</p>
      <p style="margin-top:10px"><strong>Employment barriers:</strong> ${val('employmentBarriers').slice(0,200)}${val('employmentBarriers').length > 200 ? '...' : ''}</p>
      <p style="margin-top:10px"><strong>Why reselling:</strong> ${val('resellerWhy').slice(0,200)}${val('resellerWhy').length > 200 ? '...' : ''}</p>
    </div>
    <div class="review-divider"></div>
    <div class="review-block">
      <h4>Documentation</h4>
      <p><strong>Uploaded files:</strong> ${fileNames}</p>
      ${selfDeclare ? '<p><strong>Self-declaration:</strong> Included</p>' : ''}
    </div>
  `;
}

// ---- SUBMIT ----

async function submitApplication() {
  const consent1 = document.getElementById('consentAccurate').checked;
  const consent2 = document.getElementById('consentPrivacy').checked;
  if (!consent1 || !consent2) {
    showError('Please agree to both required consent statements before submitting.');
    return;
  }

  const submitBtn = document.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting… please wait';

  try {
    const formData = new FormData();
    // Contact
    formData.append('firstName',  val('firstName'));
    formData.append('lastName',   val('lastName'));
    formData.append('email',      val('email'));
    formData.append('phone',      val('phone'));
    formData.append('city',       val('city'));
    formData.append('zip',        val('zip'));
    // Family
    formData.append('familyType',       val('familyType'));
    formData.append('numChildren',      val('numChildren'));
    formData.append('childrenAges',     val('childrenAges'));
    formData.append('diagnosisType',    val('diagnosisType'));
    formData.append('employmentStatus', val('employmentStatus'));
    formData.append('monthlyIncome',    val('monthlyIncome'));
    const benefits = Array.from(document.querySelectorAll('input[name="benefits"]:checked')).map(c => c.value);
    formData.append('benefits', benefits.join(','));
    // Story
    formData.append('dailyLife',          val('dailyLife'));
    formData.append('employmentBarriers', val('employmentBarriers'));
    formData.append('resellerWhy',        val('resellerWhy'));
    formData.append('palletMeaning',      val('palletMeaning'));
    formData.append('resellerExperience', val('resellerExperience'));
    // Declaration
    formData.append('selfDeclare',     document.getElementById('selfDeclare').checked);
    formData.append('selfDeclareText', val('selfDeclareText'));
    // Consent
    formData.append('consentAccurate', consent1);
    formData.append('consentPrivacy',  consent2);
    formData.append('consentContact',  document.getElementById('consentContact').checked);
    // Files
    uploadedFiles.forEach(file => formData.append('documents', file));

    const res  = await fetch('/api/apply', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Submission failed');

    document.getElementById('applicationForm').style.display = 'none';
    document.querySelector('.progress-bar-wrap').style.display = 'none';
    const successState = document.getElementById('successState');
    successState.style.display = 'block';
    document.getElementById('applicationId').textContent = 'Application ID: ' + data.id;
    successState.style.animation = 'fadeUp 0.6s ease both';
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit My Application 🧡';
    showError('There was a problem submitting: ' + err.message + '. Please try again or contact us directly.');
  }
}
