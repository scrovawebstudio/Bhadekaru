import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Super Admin Authentication Endpoint
// Validates credentials against server-side environment variables (.env)
app.post('/api/admin/login', (req, res) => {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required' });
  }

  const cleanIdentifier = String(identifier).trim().toLowerCase();
  const cleanPhone = cleanIdentifier.replace(/[^0-9]/g, '');

  const envAdminPhone = (process.env.SUPER_ADMIN_PHONE || '8149862034').trim();
  const envAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'scrovawebstudio@gmail.com').trim().toLowerCase();
  const envAdminPassword = (process.env.SUPER_ADMIN_PASSWORD || '814986').trim();

  // Check matching password
  const isPasswordValid = String(password).trim() === envAdminPassword;

  // Match either phone number, email, or default admin email
  const isPhoneMatch =
    cleanPhone.endsWith(envAdminPhone) ||
    cleanPhone === envAdminPhone ||
    cleanIdentifier === envAdminPhone;

  const isEmailMatch =
    cleanIdentifier === envAdminEmail ||
    cleanIdentifier === 'admin@bhadekaru.app';

  if ((isPhoneMatch || isEmailMatch) && isPasswordValid) {
    // Generate secure admin session payload
    return res.json({
      success: true,
      message: 'Super Admin authenticated successfully',
      user: {
        userId: 'usr-super-admin',
        email: envAdminEmail,
        phone: envAdminPhone,
        fullName: 'Super Admin',
        role: 'super_admin',
        organizationId: 'org-platform-admin',
        organizationName: 'Bhadekaru SaaS Platform Governance',
        loginTime: new Date().toISOString(),
      },
    });
  }

  return res.status(401).json({
    error: 'Invalid credentials. Please verify your Super Admin phone/email and password.',
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bhadekaru SaaS server running on port ${PORT}`);
  });
}

startServer();
