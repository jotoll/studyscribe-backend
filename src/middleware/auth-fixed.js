const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// JWT Secret - debería estar en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'dicttr_secret_key_2024';

// Cache for the real user ID to avoid querying Supabase on every request
let realUserId = null;
let userIdPromise = null;

// Function to get the real user ID from Supabase - CORREGIDA
async function getRealUserId() {
  // Si ya tenemos el ID en caché, devolverlo
  if (realUserId) return realUserId;
  
  // Si ya hay una promesa en curso, esperarla
  if (userIdPromise) return await userIdPromise;

  // Crear una nueva promesa para la consulta
  userIdPromise = (async () => {
    try {
      if (!supabase) {
        console.warn('Supabase not configured, using fallback UUID');
        return '123e4567-e89b-12d3-a456-426614174000';
      }

      // Query Supabase for the real user torresllonch@gmail.com
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'torresllonch@gmail.com')
        .single();

      if (error || !data) {
        console.warn('Error fetching real user ID from Supabase:', error?.message || 'User not found');
        console.warn('Using fallback UUID for development');
        return '123e4567-e89b-12d3-a456-426614174000';
      }

      realUserId = data.id;
      console.log('[Auth] Using real user ID from Supabase:', realUserId);
      return realUserId;
    } catch (error) {
      console.warn('Exception fetching user ID:', error.message);
      return '123e4567-e89b-12d3-a456-426614174000';
    } finally {
      // Limpiar la promesa para futuras llamadas
      userIdPromise = null;
    }
  })();

  return await userIdPromise;
}

// Middleware para autenticar tokens JWT - CORREGIDO
const authenticateToken = async (req, res, next) => {
  try {
    console.log('[Auth] Authentication completely disabled for development');

    // Get the real user ID from Supabase or use fallback
    const userId = await getRealUserId();

    // Create a mock user for local development with the actual user ID
    req.user = {
      id: userId,
      email: 'torresllonch@gmail.com',
      name: 'Local Development User',
      subscription_status: 'free'
    };

    return next();
  } catch (error) {
    console.error('[Auth] Error in authentication middleware:', error);
    // En caso de error, usar el ID de fallback para no bloquear el desarrollo
    req.user = {
      id: '123e4567-e89b-12d3-a456-426614174000',
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
