const express = require('express');
const router = express.Router();

// Endpoint simple de prueba para diagnóstico móvil
router.get('/test-connection', (req, res) => {
  res.json({
    success: true,
    message: 'Conexión exitosa desde móvil',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
});

// Endpoint para testear FormData
router.post('/test-formdata', (req, res) => {
  console.log('Headers recibidos:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  
  res.json({
    success: true,
    message: 'FormData recibido correctamente',
    headers: req.headers,
    contentType: req.get('Content-Type')
  });
});

// Endpoint para testear upload simple
router.post('/simple-upload', (req, res) => {
  // Simular procesamiento de audio
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        transcription: {
          original: "Audio de prueba recibido",
          enhanced: "# Transcripción de Prueba\n\n## Éxito\n\nEl audio se recibió y procesó correctamente desde el dispositivo móvil.",
          confidence: 0.95
        },
        processed_at: new Date().toISOString()
      }
    });
  }, 1000);
});

// Endpoint para diagnóstico del sistema
router.get('/system-info', (req, res) => {
  const { execSync } = require('child_process');
  
  try {
    // Verificar si chromium está instalado
    const chromiumCheck = execSync('which chromium-browser || which chromium || echo "NOT_FOUND"', { encoding: 'utf8' }).trim();
    const chromiumVersion = chromiumCheck !== 'NOT_FOUND' 
      ? execSync('chromium-browser --version || chromium --version || echo "VERSION_UNKNOWN"', { encoding: 'utf8' }).trim()
      : 'NOT_INSTALLED';

    // Verificar archivos del sistema
    const filesCheck = {
      '/usr/bin/chromium-browser': execSync('ls -la /usr/bin/chromium-browser 2>/dev/null || echo "NOT_FOUND"', { encoding: 'utf8' }).trim(),
      '/usr/bin/chromium': execSync('ls -la /usr/bin/chromium 2>/dev/null || echo "NOT_FOUND"', { encoding: 'utf8' }).trim(),
      '/usr/lib/chromium': execSync('ls -la /usr/lib/chromium 2>/dev/null || echo "NOT_FOUND"', { encoding: 'utf8' }).trim()
    };

    res.json({
      success: true,
      system: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        chromium: {
          installed: chromiumCheck !== 'NOT_FOUND',
          path: chromiumCheck,
          version: chromiumVersion
        },
        files: filesCheck,
        environment: {
          PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD,
          PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH
        },
        timestamp: new Date().toISOString(),
        gitCommit: process.env.GIT_COMMIT || 'unknown'
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      system: {
        node: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
