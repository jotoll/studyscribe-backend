const express = require('express');
const router = express.Router();

// Endpoint simple de prueba
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Simple debug endpoint working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
