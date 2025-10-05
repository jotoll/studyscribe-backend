const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Cargar variables de entorno - priorizar variables del sistema
const dotenv = require('dotenv');
const fs = require('fs');

// Verificar si existe el archivo .env y cargarlo solo si existe
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('📁 Loading .env file from:', envPath);
  dotenv.config({ path: envPath });
} else {
  console.log('⚠️  No .env file found, using system environment variables');
}

// Verificar variables críticas
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing required environment variables:', missingVars);
}

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
const deployDiagnosticRoutes = require('./routes/deploy-diagnostic');
console.log('Loading deploy diagnostic routes...');

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
app.use('/api', deployDiagnosticRoutes);
console.log('Mounted deploy diagnostic routes at /api');

// Static file serving for exports
app.use('/api/exports', express.static(path.join(__dirname, '..', 'exports')));
console.log('Mounted static exports directory at /api/exports');

module.exports = app;
