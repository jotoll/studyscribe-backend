const jwt = require('jsonwebtoken');

// JWT Secret - debería estar en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'dicttr_secret_key_2024';

// Middleware simplificado para desarrollo - evita problemas con Supabase
const authenticateToken = async (req, res, next) => {
  try {
    console.log('[Auth] Using simplified auth for development');
    
    // Usar ID fijo para desarrollo local - evita consultas a Supabase
    const userId = 'f1bd3a53-8faf-4aa5-928c-048c3e056342';
    
    // Create a mock user for local development
    req.user = {
      id: userId,
      email: 'torresllonch@gmail.com',
      name: 'Local Development User',
      subscription_status: 'free'
    };

    return next();
  } catch (error) {
    console.error('[Auth] Error in simplified auth middleware:', error);
    // En caso de error, usar valores de fallback
    req.user = {
      id: 'f1bd3a53-8faf-4aa5-928c-048c3e056342',
      email: 'torresllonch@gmail.com',
      name: 'Local Development User',
      subscription_status: 'free'
    };
    return next();
  }
};

// Middleware opcional para autenticación (no bloquea si no hay token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Silenciar errores de token en autenticación opcional
      console.warn('Token opcional inválido:', error.message);
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
