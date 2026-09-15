require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const instrumentRoutes = require('./routes/instrumentRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files & generated PDFs
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/applications', inspectionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Legal Metrology Verification System API',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Serve frontend static build if present (e.g. in production on Render)
const fs = require('fs');
const possibleDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(__dirname, '../../dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'dist'),
];

let resolvedDistPath = possibleDistPaths.find(p => fs.existsSync(path.join(p, 'index.html')));

if (resolvedDistPath) {
  console.log(`[Static Serving] Serving frontend UI from: ${resolvedDistPath}`);
  app.use(express.static(resolvedDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(resolvedDistPath, 'index.html'));
  });
} else {
  console.warn('[Static Serving] Frontend dist not found. Ensure "npm run build" was run.');
  // Friendly root route fallback if frontend is not yet built
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Legal Metrology Verification System</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #0f172a; color: white;">
          <h1 style="color: #f59e0b;">🏛️ National Legal Metrology Verification System API</h1>
          <p style="color: #94a3b8;">Backend is live and connected to MongoDB Atlas.</p>
          <div style="margin: 20px auto; max-width: 500px; padding: 20px; background: #1e293b; border-radius: 12px; text-align: left;">
            <p><strong>Status:</strong> <span style="color: #10b981;">Online</span></p>
            <p><strong>Health Endpoint:</strong> <a href="/api/health" style="color: #38bdf8;">/api/health</a></p>
            <p><strong>Verify Sample Token:</strong> <a href="/api/verify/4f8a92e10bc78d234a5b6c7d8e9f0123" style="color: #38bdf8;">/api/verify/4f8a92e10bc78d234a5b6c7d8e9f0123</a></p>
          </div>
          <p style="color: #64748b; font-size: 13px;">To load the React UI, ensure Render's Build Command is: <code>npm run install:all && npm run build</code></p>
        </body>
      </html>
    `);
  });
}

// 404 Handler for API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
