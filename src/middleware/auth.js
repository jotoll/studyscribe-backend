const jwt = require('jsonwebtoken');

// JWT Secret - debería estar en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'studyscribe_secret_key_2024';

// Middleware para autenticar tokens JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Skip authentication for local development
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Create a mock user for local development
    req.user = {
      id: 'local-dev-user-id',
      email: 'dev@localhost',
      name: 'Local Development User'
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      message: 'Debe proporcionar un token de autenticación'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'El token de acceso ha expirado, por favor inicie sesión nuevamente'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'El token de acceso es inválido'
      });
    }

    return res.status(403).json({ 
      error: 'Token no válido',
      message: 'No se pudo verificar el token de acceso'
    });
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
