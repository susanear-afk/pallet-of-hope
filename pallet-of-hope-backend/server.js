// ================================
// PALLET OF HOPE — SERVER
// ================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const multer     = require('multer');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ---- CLOUDINARY CONFIG ----
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your-')
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️  Cloudinary configured — documents will be stored in the cloud');
} else {
  console.log('📁 Cloudinary not configured — documents stored locally');
}

const app  = express();
const PORT = process.env.PORT || 3000;

// ---- PATHS ----
const DATA_FILE    = path.join(__dirname, 'data', 'applications.json');
const UPLOADS_DIR  = path.join(__dirname, 'uploads');
const FRONTEND_DIR = path.join(__dirname, '..', 'pallet-of-hope');

// Ensure directories and data file exist (critical for cloud hosting like Render)
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Created data/ directory');
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Created uploads/ directory');
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  console.log('📄 Created applications.json');
}

// ---- MIDDLEWARE ----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend from parent folder
app.use(express.static(FRONTEND_DIR));

// ---- ADMIN AUTH MIDDLEWARE ----
// Simple token-based auth for admin routes
function adminAuth(req, res, next) {
  // Allow login page and auth endpoint through without token
  if (req.path === '/login.html' || req.path === '/login' || req.path === '/') {
    return next();
  }
  // Check session token in cookie or header
  const token = req.cookies && req.cookies.admin_token;
  const validToken = process.env.ADMIN_TOKEN;
  if (!validToken) {
    console.warn('⚠️  ADMIN_TOKEN not set in environment variables!');
    return next(); // fail open if not configured yet
  }
  if (token === validToken) {
    return next();
  }
  // Not authenticated — redirect to login
  res.redirect('/admin/login.html');
}

// Parse cookies
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  req.cookies = {};
  cookieHeader.split(';').forEach(part => {
    const [key, ...val] = part.trim().split('=');
    if (key) req.cookies[key.trim()] = decodeURIComponent(val.join('=').trim());
  });
  next();
});

// POST /admin/auth — handle login form submission
app.post('/admin/auth', (req, res) => {
  const { password } = req.body;
  const validPassword = process.env.ADMIN_PASSWORD || 'givingpallet2025';
  const adminToken    = process.env.ADMIN_TOKEN    || 'tgp-admin-token-2025';
  if (password === validPassword) {
    // Set secure cookie valid for 8 hours
    res.setHeader('Set-Cookie', `admin_token=${adminToken}; Path=/; HttpOnly; Max-Age=28800; SameSite=Strict`);
    res.redirect('/admin/index.html');
  } else {
    res.redirect('/admin/login.html?error=1');
  }
});

// POST /admin/logout
app.post('/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'admin_token=; Path=/; HttpOnly; Max-Age=0');
  res.redirect('/admin/login.html');
});

// Serve uploads (protected)
app.use('/uploads', adminAuth, express.static(UPLOADS_DIR));
// Serve admin panel with auth protection
app.use('/admin', adminAuth, express.static(path.join(__dirname, 'admin')));

// Also protect all /api/ routes (except public apply endpoint)
app.use('/api/applications', (req, res, next) => {
  const token = req.cookies && req.cookies.admin_token;
  const validToken = process.env.ADMIN_TOKEN;
  if (!validToken) return next();
  if (token === validToken) return next();
  res.status(401).json({ success: false, error: 'Unauthorized' });
});
app.use('/api/stats', (req, res, next) => {
  const token = req.cookies && req.cookies.admin_token;
  const validToken = process.env.ADMIN_TOKEN;
  if (!validToken) return next();
  if (token === validToken) return next();
  res.status(401).json({ success: false, error: 'Unauthorized' });
});

// ---- FILE UPLOAD CONFIG ----
const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
                   'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX'), false);
};

// Use Cloudinary storage if configured, otherwise fall back to local disk
let storage;
if (cloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:         `the-giving-pallet/${req.appId || 'temp'}`,
      public_id:      Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'),
      resource_type:  'auto',
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    }),
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOADS_DIR, req.appId || 'temp');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, Date.now() + '_' + safe);
    }
  });
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 } // 10MB per file, max 5 files
});

// Middleware to attach appId before multer runs
app.use((req, res, next) => {
  req.appId = 'TGP-' + new Date().getFullYear() + '-' + uuidv4().split('-')[0].toUpperCase();
  next();
});

// ---- EMAIL SETUP ----
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

async function sendConfirmationEmail(app) {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-')) {
    console.log('📧 Email not configured — skipping confirmation email.');
    return;
  }

  const applicantMail = {
    from: process.env.EMAIL_FROM,
    to:   app.contact.email,
    subject: `✅ Application Received — The Giving Pallet Foundation (${app.id})`,
    html: confirmationEmailHtml(app),
  };

  const adminMail = {
    from:    process.env.EMAIL_FROM,
    to:      process.env.ADMIN_EMAIL,
    subject: `🆕 New Application: ${app.contact.firstName} ${app.contact.lastName} (${app.id})`,
    html:    adminEmailHtml(app),
  };

  try {
    await transporter.sendMail(applicantMail);
    console.log(`📧 Confirmation sent to ${app.contact.email}`);
    await transporter.sendMail(adminMail);
    console.log(`📧 Admin notification sent to ${process.env.ADMIN_EMAIL}`);
  } catch (err) {
    console.error('📧 Email error (non-fatal):', err.message);
  }
}

// ---- ROUTES ----

// POST /api/apply — submit application
app.post('/api/apply', (req, res, next) => {
  // Attach appId to req so multer can use it for the upload folder
  next();
}, upload.array('documents', 5), async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || [];

    // Parse benefits array (comes as comma string or array)
    let benefits = body.benefits || [];
    if (typeof benefits === 'string') benefits = benefits.split(',');

    const application = {
      id:          req.appId,
      status:      'pending',        // pending | approved | waitlisted | declined
      submittedAt: new Date().toISOString(),
      reviewedAt:  null,
      reviewNotes: '',
      contact: {
        firstName: body.firstName || '',
        lastName:  body.lastName  || '',
        email:     body.email     || '',
        phone:     body.phone     || '',
        city:      body.city      || '',
        zip:       body.zip       || '',
      },
      family: {
        type:             body.familyType       || '',
        numChildren:      body.numChildren      || '',
        childrenAges:     body.childrenAges     || '',
        diagnosisType:    body.diagnosisType    || '',
        employmentStatus: body.employmentStatus || '',
        monthlyIncome:    body.monthlyIncome    || '',
        benefits,
      },
      story: {
        dailyLife:           body.dailyLife           || '',
        employmentBarriers:  body.employmentBarriers  || '',
        resellerWhy:         body.resellerWhy         || '',
        palletMeaning:       body.palletMeaning       || '',
        resellerExperience:  body.resellerExperience  || '',
      },
      declaration: {
        selfDeclare:     body.selfDeclare === 'true' || body.selfDeclare === true,
        selfDeclareText: body.selfDeclareText || '',
      },
      documents: files.map(f => ({
        originalName: f.originalname,
        savedName:    f.filename || f.public_id || '',
        path:         f.path || '',
        url:          f.path && f.path.startsWith('http') ? f.path : (f.secure_url || f.url || ''),
        cloudinaryId: f.public_id || '',
        size:         f.size || 0,
        mimetype:     f.mimetype,
        storage:      cloudinaryConfigured ? 'cloudinary' : 'local',
      })),
      consent: {
        accurate: body.consentAccurate === 'true',
        privacy:  body.consentPrivacy  === 'true',
        story:    body.consentContact  === 'true',
      }
    };

    // Save to JSON file
    const applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    applications.push(application);
    fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2));

    console.log(`✅ Application saved: ${application.id} — ${application.contact.firstName} ${application.contact.lastName}`);

    // Send emails
    await sendConfirmationEmail(application);

    res.json({ success: true, id: application.id });

  } catch (err) {
    console.error('❌ Application error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/applications — list all (admin)
app.get('/api/applications', (req, res) => {
  try {
    const applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    // Return summary list (not full story text for performance)
    const list = applications.map(a => ({
      id:          a.id,
      status:      a.status,
      submittedAt: a.submittedAt,
      name:        `${a.contact.firstName} ${a.contact.lastName}`,
      email:       a.contact.email,
      city:        a.contact.city,
      familyType:  a.family.type,
      numDocs:     a.documents.length,
    }));
    res.json({ success: true, total: list.length, applications: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/applications/:id — single application
app.get('/api/applications/:id', (req, res) => {
  try {
    const applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const app = applications.find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/applications/:id/status — update status
app.patch('/api/applications/:id/status', (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const valid = ['pending', 'approved', 'waitlisted', 'declined'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const idx = applications.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });

    applications[idx].status      = status;
    applications[idx].reviewedAt  = new Date().toISOString();
    applications[idx].reviewNotes = reviewNotes || '';

    fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2));
    console.log(`📋 Application ${req.params.id} → ${status}`);
    res.json({ success: true, application: applications[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/stats — dashboard stats
app.get('/api/stats', (req, res) => {
  try {
    const applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const stats = {
      total:       applications.length,
      pending:     applications.filter(a => a.status === 'pending').length,
      approved:    applications.filter(a => a.status === 'approved').length,
      waitlisted:  applications.filter(a => a.status === 'waitlisted').length,
      declined:    applications.filter(a => a.status === 'declined').length,
      thisMonth:   applications.filter(a => {
        const d = new Date(a.submittedAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- EMAIL TEMPLATES ----

function confirmationEmailHtml(app) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; background: #FDF8F3; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #1C1008; padding: 40px 40px 30px; text-align: center; }
    .header h1 { color: #E8621A; font-size: 1.6rem; margin: 0 0 4px; }
    .header p { color: rgba(255,255,255,0.6); margin: 0; font-size: 0.9rem; }
    .body { padding: 40px; }
    .body h2 { color: #1C1008; font-size: 1.4rem; margin-bottom: 16px; }
    .body p { color: #5A4A3A; line-height: 1.7; margin-bottom: 16px; }
    .id-box { background: #FFF0E8; border: 1px solid #E8DDD5; border-radius: 8px; padding: 16px 20px; margin: 24px 0; text-align: center; }
    .id-box strong { font-size: 1.1rem; color: #E8621A; }
    .steps { background: #FDF8F3; border-radius: 8px; padding: 24px; margin: 24px 0; }
    .steps h3 { color: #1C1008; margin-bottom: 12px; font-size: 1rem; }
    .steps ol { color: #5A4A3A; padding-left: 20px; line-height: 2; }
    .footer { background: #1C1008; padding: 24px 40px; text-align: center; }
    .footer p { color: rgba(255,255,255,0.4); font-size: 0.8rem; margin: 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🧡 The Giving Pallet Foundation</h1>
      <p>Empowering families, one pallet at a time.</p>
    </div>
    <div class="body">
      <h2>Dear ${app.contact.firstName},</h2>
      <p>Thank you so much for taking the time to share your story with us. We received your application and want you to know it has been read with care.</p>
      <p>Your courage in sharing your situation is exactly what The Giving Pallet is here for. Every application is reviewed by a real person — not a computer — and we treat every story with the respect it deserves.</p>
      <div class="id-box">
        <p style="margin:0 0 8px;font-size:0.85rem;color:#7A6558;">Your Application ID</p>
        <strong>${app.id}</strong>
        <p style="margin:8px 0 0;font-size:0.8rem;color:#7A6558;">Keep this for your records</p>
      </div>
      <div class="steps">
        <h3>What happens next:</h3>
        <ol>
          <li>Our team reviews your application (5–7 business days)</li>
          <li>We may reach out with follow-up questions</li>
          <li>You'll receive an email with our decision</li>
          <li>Approved families are contacted to arrange their pallet</li>
        </ol>
      </div>
      <p>If you have any questions, you can reply to this email at any time. We're here for you.</p>
      <p>With hope and gratitude,<br/><strong>The Giving Pallet Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} The Giving Pallet Foundation · 501(c)(3) Nonprofit · All information kept confidential</p>
    </div>
  </div>
</body>
</html>`;
}

function adminEmailHtml(app) {
  const benefits = Array.isArray(app.family.benefits) ? app.family.benefits.join(', ') : app.family.benefits;
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .wrap { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: #E8621A; padding: 24px 32px; }
    .header h1 { color: white; margin: 0; font-size: 1.2rem; }
    .body { padding: 32px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; color: #E8621A; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 0; font-size: 0.9rem; vertical-align: top; }
    td:first-child { color: #888; width: 180px; }
    .story-box { background: #FDF8F3; border-left: 3px solid #E8621A; padding: 12px 16px; margin: 10px 0; font-size: 0.9rem; color: #3D2B1A; line-height: 1.6; }
    .status-badge { display: inline-block; background: #FFF0E8; color: #E8621A; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; }
    .admin-link { display: inline-block; background: #1C1008; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🆕 New Application Received — ${app.id}</h1>
    </div>
    <div class="body">
      <div class="section">
        <h2>Contact</h2>
        <table>
          <tr><td>Name</td><td><strong>${app.contact.firstName} ${app.contact.lastName}</strong></td></tr>
          <tr><td>Email</td><td>${app.contact.email}</td></tr>
          <tr><td>Phone</td><td>${app.contact.phone}</td></tr>
          <tr><td>Location</td><td>${app.contact.city} ${app.contact.zip}</td></tr>
          <tr><td>Submitted</td><td>${new Date(app.submittedAt).toLocaleString()}</td></tr>
          <tr><td>Status</td><td><span class="status-badge">${app.status}</span></td></tr>
        </table>
      </div>
      <div class="section">
        <h2>Family</h2>
        <table>
          <tr><td>Type</td><td>${app.family.type}</td></tr>
          <tr><td>Children</td><td>${app.family.numChildren} (Ages: ${app.family.childrenAges})</td></tr>
          <tr><td>Diagnosis</td><td>${app.family.diagnosisType || 'Not provided'}</td></tr>
          <tr><td>Employment</td><td>${app.family.employmentStatus}</td></tr>
          <tr><td>Monthly Income</td><td>$${app.family.monthlyIncome}</td></tr>
          <tr><td>Benefits</td><td>${benefits || 'None'}</td></tr>
        </table>
      </div>
      <div class="section">
        <h2>Personal Statement</h2>
        <p style="font-size:0.8rem;color:#888;">Daily Life:</p>
        <div class="story-box">${app.story.dailyLife}</div>
        <p style="font-size:0.8rem;color:#888;">Employment Barriers:</p>
        <div class="story-box">${app.story.employmentBarriers}</div>
        <p style="font-size:0.8rem;color:#888;">Why Reselling:</p>
        <div class="story-box">${app.story.resellerWhy}</div>
        <p style="font-size:0.8rem;color:#888;">What a Pallet Would Mean:</p>
        <div class="story-box">${app.story.palletMeaning}</div>
      </div>
      <div class="section">
        <h2>Documents</h2>
        ${app.documents.length > 0
          ? app.documents.map(d => `<p>📄 ${d.originalName} (${(d.size/1024).toFixed(0)} KB)</p>`).join('')
          : '<p>No files uploaded</p>'}
        ${app.declaration.selfDeclare ? `<p>✍️ Self-declaration included</p><div class="story-box">${app.declaration.selfDeclareText}</div>` : ''}
      </div>
      <a href="${process.env.BASE_URL || 'http://localhost:3000'}/admin/index.html" class="admin-link">
        Open Admin Dashboard →
      </a>
    </div>
  </div>
</body>
</html>`;
}

// ---- START ----
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🧡 The Giving Pallet — Server Ready   ║
  ╠══════════════════════════════════════╣
  ║  Frontend:  http://localhost:${PORT}     ║
  ║  Admin:     http://localhost:${PORT}/admin ║
  ║  API:       http://localhost:${PORT}/api  ║
  ╚══════════════════════════════════════╝
  `);
});
