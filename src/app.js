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
const transcriptionManagementRoutes = require('./routes/transcription-management');
console.log('Loading transcription management routes...');
const authRoutes = require('./routes/auth');
console.log('Loading auth routes...');
const folderRoutes = require('./routes/folders');
console.log('Loading folder routes...');
const tagRoutes = require('./routes/tags');
console.log('Loading tag routes...');

app.get('/', (req, res) => {
  res.json({ message: 'Dicttr API v1.0' });
});

// Health check (mantener compatibilidad con Coolify)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Health check con prefijo /api
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes - Agregar prefijo /api para compatibilidad con la app móvil
app.use('/api/tags', tagRoutes);
console.log('Mounted tag routes at /api/tags');
app.use('/api/folders', folderRoutes);
console.log('Mounted folder routes at /api/folders');
app.use('/api/transcription', transcriptionRoutes);
console.log('Mounted transcription routes at /api/transcription');
app.use('/api/transcriptions', transcriptionManagementRoutes);
console.log('Mounted transcription management routes at /api/transcriptions');
app.use('/api/auth', authRoutes);
console.log('Mounted auth routes at /api/auth');

// Static file serving for exports
app.use('/api/exports', express.static(path.join(__dirname, '..', 'exports')));
console.log('Mounted static exports directory at /api/exports');

module.exports = app;
