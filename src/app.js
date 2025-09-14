const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Permitir todas las conexiones
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
const transcriptionRoutes = require('./routes/transcription');
console.log('Loading transcription routes...');
const authRoutes = require('./routes/auth');
console.log('Loading auth routes...');
const debugRoutes = require('./routes/debug-routes');
console.log('Loading debug routes...');
const simpleDebugRoutes = require('./routes/simple-debug');
console.log('Loading simple debug routes...');
const deployDiagnosticRoutes = require('./routes/deploy-diagnostic');
console.log('Loading deploy diagnostic routes...');

app.get('/', (req, res) => {
  res.json({ message: 'StudyScribe API v1.0' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes - Probando sin prefijo /api para diagnosticar Coolify
app.use('/transcription', transcriptionRoutes);
console.log('Mounted transcription routes at /transcription');
app.use('/auth', authRoutes);
console.log('Mounted auth routes at /auth');
app.use('/debug', debugRoutes);
console.log('Mounted debug routes at /debug');
app.use('/simple', simpleDebugRoutes);
console.log('Mounted simple debug routes at /simple');
app.use('/diagnostic', deployDiagnosticRoutes);
console.log('Mounted deploy diagnostic routes at /diagnostic');

// Static file serving for exports
app.use('/exports', express.static(path.join(__dirname, '..', 'exports')));
console.log('Mounted static exports directory at /exports');

module.exports = app;
