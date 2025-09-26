const express = require('express');
const router = express.Router();

// GET /api/debug-test - Ruta de debug simple sin middleware
router.get('/', async (req, res) => {
  try {
    console.log('[DEBUG TEST] GET /api/debug-test endpoint hit');
    
    res.json({
      success: true,
      message: 'Debug test route working',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBUG TEST] Error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/debug-test - Ruta POST de debug simple sin middleware
router.post('/', async (req, res) => {
  try {
    console.log('[DEBUG TEST] POST /api/debug-test endpoint hit');
    
    res.json({
      success: true,
      message: 'Debug test POST route working',
      timestamp: new Date().toISOString(),
      body: req.body
    });

  } catch (error) {
    console.error('[DEBUG TEST] Error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
