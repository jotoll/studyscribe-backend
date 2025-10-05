const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { stripe } = require('../config/stripe');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// JWT Secret - debería estar en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'dicttr_secret_key_2024';

// OAuth de Supabase
router.get('/oauth/url', (req, res) => {
  try {
    const { provider = 'google', redirectTo } = req.query;
    
    if (!redirectTo) {
      return res.status(400).json({ error: 'redirectTo parameter is required' });
    }

    const { data, error } = supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo
      }
    });

    if (error) {
      console.error('Error generating OAuth URL:', error);
      return res.status(500).json({ error: 'Error generating OAuth URL' });
    }

    res.json({ success: true, data: { url: data.url } });
  } catch (error) {
    console.error('Error in /oauth/url:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Callback de OAuth
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Intercambiar código por sesión
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return res.status(400).json({ error: 'Invalid authorization code' });
    }

    // Verificar si el usuario ya existe en nuestra base de datos
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    let user;
    if (!existingUser) {
      // Crear nuevo usuario si no existe
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email,
          subscription_status: 'free',
          created_at: new Date(),
          updated_at: new Date()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user from OAuth:', createError);
        return res.status(500).json({ error: 'Error creating user account' });
      }
      user = newUser;
    } else {
      user = existingUser;
    }

    // Generar nuestro propio token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        subscription_status: user.subscription_status 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirigir con el token (puedes ajustar esto según tu frontend)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener URL de OAuth para proveedor específico
router.get('/oauth/:provider/url', (req, res) => {
  try {
    const { provider } = req.params;
    const { redirectTo } = req.query;
    
    console.log(`[OAuth] Generating URL for provider: ${provider}`);
    console.log(`[OAuth] Redirect to: ${redirectTo}`);
    
    if (!redirectTo) {
      console.error('[OAuth] redirectTo parameter is required');
      return res.status(400).json({ error: 'redirectTo parameter is required' });
    }

    const validProviders = ['google', 'github', 'gitlab', 'azure', 'facebook'];
    if (!validProviders.includes(provider)) {
      console.error(`[OAuth] Invalid provider: ${provider}`);
      return res.status(400).json({ error: 'Invalid OAuth provider' });
    }

    console.log(`[OAuth] Calling Supabase signInWithOAuth for ${provider}`);
    const { data, error } = supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo
      }
    });

    if (error) {
      console.error('[OAuth] Error generating OAuth URL:', error);
      return res.status(500).json({ error: 'Error generating OAuth URL', details: error.message });
    }

    // Verificar que data y data.url existan
    if (!data || !data.url) {
      console.error('[OAuth] Invalid response from Supabase:', data);
      return res.status(500).json({
        error: 'Invalid response from authentication provider',
        details: 'No URL returned from Supabase'
      });
    }

    console.log(`[OAuth] URL generated successfully: ${data.url}`);
    res.json({ success: true, data: { url: data.url } });
  } catch (error) {
    console.error('[OAuth] Error in OAuth URL generation:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Endpoint de prueba para OAuth
router.get('/oauth/test', (req, res) => {
  try {
    console.log('[OAuth Test] Verificando configuración de Supabase...');
    
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    // Probar una operación simple con Supabase
    const { data, error } = supabase.auth.getSession();
    
    if (error) {
      console.error('[OAuth Test] Error de Supabase:', error);
      return res.status(500).json({
        error: 'Supabase connection error',
        details: error.message
      });
    }
    
    console.log('[OAuth Test] Conexión con Supabase exitosa');
    res.json({
      success: true,
      message: 'Supabase connection working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[OAuth Test] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Endpoints de autenticación básica
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario en la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error buscando usuario:', error);
      // Si no se encuentra el usuario (código PGRST116), devolver error 401
      if (error.code === 'PGRST116') {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Verificación de contraseña con bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña no coincide' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        subscription_status: user.subscription_status 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      data: { 
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          subscription_status: user.subscription_status
        }
      } 
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error verificando usuario existente:', checkError);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario con password_hash
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        full_name,
        password_hash: hashedPassword,
        subscription_status: 'free',
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creando usuario:', error);
      console.error('Supabase error details:', JSON.stringify(error, null, 2));
      return res.status(400).json({ error: 'Error creando usuario', details: error.message });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email,
        subscription_status: newUser.subscription_status 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      data: { 
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          subscription_status: newUser.subscription_status
        }
      } 
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware para verificar autenticación JWT
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.substring(7);
    
    // Verificar token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Obtener usuario de la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener perfil del usuario
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Error obteniendo perfil:', error);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: userProfile });
  } catch (error) {
    console.error('Error en /profile:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar perfil del usuario
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { full_name, avatar_url } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ full_name, avatar_url, updated_at: new Date() })
      .eq('id', req.user.id)
      .select();

    if (error) {
      console.error('Error actualizando perfil:', error);
      return res.status(400).json({ error: 'Error actualizando perfil' });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error en /profile PUT:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener uso actual del usuario
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const { data: monthlyUsage, error } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('date', monthStartStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error obteniendo uso:', error);
      return res.status(400).json({ error: 'Error obteniendo datos de uso' });
    }

    const totalUsage = monthlyUsage?.reduce((acc, day) => ({
      transcription_count: acc.transcription_count + (day.transcription_count || 0),
      audio_minutes: acc.audio_minutes + (day.audio_minutes || 0),
      ai_requests: acc.ai_requests + (day.ai_requests || 0)
    }), { transcription_count: 0, audio_minutes: 0, ai_requests: 0 }) || { transcription_count: 0, audio_minutes: 0, ai_requests: 0 };

    // Obtener límites según suscripción
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', req.user.id)
      .single();

    const subscriptionStatus = userData?.subscription_status || 'free';
    const limits = {
      free: { transcriptions: 5, audioMinutes: 30, aiRequests: 50 },
      active: { 
        transcriptions: Infinity, 
        audioMinutes: subscriptionStatus === 'pro' ? 300 : 1200,
        aiRequests: Infinity
      }
    };

    const userLimits = limits[subscriptionStatus] || limits.free;

    res.json({
      success: true,
      data: {
        usage: totalUsage,
        limits: userLimits,
        subscription: subscriptionStatus,
        remaining: {
          transcriptions: userLimits.transcriptions === Infinity ? Infinity : Math.max(0, userLimits.transcriptions - totalUsage.transcription_count),
          audio_minutes: userLimits.audioMinutes === Infinity ? Infinity : Math.max(0, userLimits.audioMinutes - totalUsage.audio_minutes),
          ai_requests: userLimits.aiRequests === Infinity ? Infinity : Math.max(0, userLimits.aiRequests - totalUsage.ai_requests)
        }
      }
    });
  } catch (error) {
    console.error('Error en /usage:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear sesión de checkout de Stripe
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!stripe) {
      return res.status(400).json({ error: 'Sistema de pagos no configurado' });
    }

    // Obtener o crear customer en Stripe
    let stripeCustomerId;
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (userData?.stripe_customer_id) {
      stripeCustomerId = userData.stripe_customer_id;
    } else {
      // Crear nuevo customer en Stripe
      const { data: userProfile } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', req.user.id)
        .single();

      const customer = await stripe.createCustomer(userProfile.email, userProfile.full_name);
      stripeCustomerId = customer.id;

      // Guardar customer ID en Supabase
      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', req.user.id);
    }

    // Crear sesión de checkout
    const session = await stripe.createCheckoutSession(
      stripeCustomerId,
      priceId,
      successUrl,
      cancelUrl
    );

    res.json({ success: true, data: { sessionId: session.id, url: session.url } });
  } catch (error) {
    console.error('Error creando checkout session:', error);
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
});

// Crear portal de cliente de Stripe
router.post('/create-portal-session', requireAuth, async (req, res) => {
  try {
    const { returnUrl } = req.body;

    if (!stripe) {
      return res.status(400).json({ error: 'Sistema de pagos no configurado' });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (!userData?.stripe_customer_id) {
      return res.status(400).json({ error: 'Usuario no tiene suscripción activa' });
    }

    const session = await stripe.createCustomerPortalSession(userData.stripe_customer_id, returnUrl);

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error('Error creando portal session:', error);
    res.status(500).json({ error: 'Error creando portal de gestión' });
  }
});

// Webhook de Stripe para procesar eventos
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!stripe) {
      return res.status(400).json({ error: 'Sistema de pagos no configurado' });
    }

    const event = stripe.verifyWebhookSignature(req.body, signature);
    
    // Procesar el evento
    await stripe.handleWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

module.exports = router;
