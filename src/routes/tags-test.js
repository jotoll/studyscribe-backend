const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET /api/tags - Ruta de prueba CON autenticación
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('[TAGS TEST] GET /api/tags endpoint hit');
    console.log('[TAGS TEST] User authenticated:', req.user);
    
    res.json({
      success: true,
      data: {
        tags: [
          { id: '1', name: 'Test Tag 1', color: '#FF0000' },
          { id: '2', name: 'Test Tag 2', color: '#00FF00' }
        ]
      }
    });

  } catch (error) {
    console.error('[TAGS TEST] Error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/tags-test/no-auth - Ruta de prueba SIN autenticación
router.get('/no-auth', async (req, res) => {
  try {
    console.log('[TAGS TEST] GET /api/tags-test/no-auth endpoint hit');
    
    res.json({
      success: true,
      message: 'Tags test route without authentication working',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TAGS TEST] Error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
