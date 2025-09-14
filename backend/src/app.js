const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

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
const debugRoutes = require('./routes/debug-routes');
console.log('Loading debug routes...');
const simpleDebugRoutes = require('./routes/simple-debug');
console.log('Loading simple debug routes...');

app.get('/', (req, res) => {
  res.json({ message: 'StudyScribe API v1.0' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/transcription', transcriptionRoutes);
console.log('Mounted transcription routes at /api/transcription');
app.use('/api/debug', debugRoutes);
console.log('Mounted debug routes at /api/debug');
app.use('/api/simple', simpleDebugRoutes);
console.log('Mounted simple debug routes at /api/simple');

// Static file serving for exports
const path = require('path');
app.use('/exports', express.static(path.join(__dirname, '..', 'exports')));
console.log('Mounted static exports directory at /exports');

module.exports = app;
