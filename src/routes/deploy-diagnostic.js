const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Diagnóstico del deploy
router.get('/diagnostic', (req, res) => {
  try {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      status: 'OK',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001,
      baseUrl: process.env.BASE_URL || 'http://localhost:3001',
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_KEY || !!process.env.SUPABASE_ANON_KEY,
      deepseekKey: !!process.env.DEEPSEEK_API_KEY,
      groqKey: !!process.env.GROQ_API_KEY,
      jwtSecret: !!process.env.JWT_SECRET,
      routes: {
        auth: true,
        transcription: true,
        debug: true,
        simple: true
      },
      fileStructure: {
        appJs: fs.existsSync(path.join(__dirname, '../app.js')),
        authRoutes: fs.existsSync(path.join(__dirname, 'auth.js')),
        configSupabase: fs.existsSync(path.join(__dirname, '../config/supabase.js')),
        packageJson: fs.existsSync(path.join(__dirname, '../../package.json'))
      },
      dependencies: {
        bcrypt: true, // Asumiendo que está instalado
        express: true,
        supabase: true
      }
    };

    res.json(diagnostic);
  } catch (error) {
    res.status(500).json({ 
      error: 'Diagnostic failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint simple
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Deploy diagnostic test endpoint working',
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
});

// Test endpoint POST
router.post('/test', (req, res) => {
  res.json({ 
    message: 'Deploy diagnostic test endpoint working',
    timestamp: new Date().toISOString(),
    method: 'POST',
    receivedBody: req.body
  });
});

// Health check extendido
router.get('/health-extended', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform
  };
  res.json(health);
});

module.exports = router;
