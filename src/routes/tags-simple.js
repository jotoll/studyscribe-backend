const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/tags - Obtener todas las etiquetas del usuario (igual que carpetas)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('[TAGS API] GET /api/tags endpoint hit');
    const userId = req.user.id;
    console.log('[TAGS API] Getting tags for user:', userId);

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('[TAGS API] Error obteniendo etiquetas:', error);
      return res.status(500).json({ 
        error: 'Error al obtener etiquetas',
        details: error.message 
      });
    }

    console.log('[TAGS API] Tags retrieved successfully:', data?.length || 0, 'tags');
    
    res.json({
      success: true,
      data: {
        tags: data || []
      }
    });

  } catch (error) {
    console.error('[TAGS API] Error obteniendo etiquetas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/tags/:id - Obtener etiqueta específica (igual que carpetas)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Etiqueta no encontrada' 
        });
      }
      console.error('Error obteniendo etiqueta:', error);
      return res.status(500).json({ 
        error: 'Error al obtener la etiqueta',
        details: error.message 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        error: 'Etiqueta no encontrada' 
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error obteniendo etiqueta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/tags - Crear nueva etiqueta (igual que carpetas)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color = '#666666' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'El nombre de la etiqueta es requerido' 
      });
    }

    // Verificar si ya existe una etiqueta con el mismo nombre para este usuario
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name.trim())
      .single();

    if (existingTag) {
      return res.status(400).json({ 
        error: 'Ya existe una etiqueta con ese nombre' 
      });
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name: name.trim(),
        color
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando etiqueta:', error);
      return res.status(500).json({ 
        error: 'Error al crear la etiqueta',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data,
      message: 'Etiqueta creada correctamente'
    });

  } catch (error) {
    console.error('Error creando etiqueta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
