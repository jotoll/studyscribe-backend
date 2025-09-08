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

module.exports = router;
