const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Endpoint para diagnosticar qué versión del middleware está corriendo
router.get('/deploy-diagnostic', (req, res) => {
  try {
    const authMiddlewarePath = path.join(__dirname, '../middleware/auth.js');
    
    if (!fs.existsSync(authMiddlewarePath)) {
      return res.json({
        success: false,
        error: 'Middleware file not found',
        path: authMiddlewarePath
      });
    }

    const content = fs.readFileSync(authMiddlewarePath, 'utf8');
    
    const diagnostic = {
      success: true,
      timestamp: new Date().toISOString(),
      commit: process.env.SOURCE_COMMIT || 'unknown',
      version: 'deploy-diagnostic-v1',
      middleware: {
        fileExists: true,
        usesSimplifiedAuth: content.includes('f1bd3a53-8faf-4aa5-928c-048c3e056342'),
        usesRealAuth: content.includes('No token provided, returning 401'),
        hasTokenValidation: content.includes('jwt.verify'),
        contentPreview: content.substring(0, 500) + '...'
      }
    };

    console.log('🔍 Deploy Diagnostic:', diagnostic);
    res.json(diagnostic);
  } catch (error) {
    console.error('❌ Deploy Diagnostic Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
