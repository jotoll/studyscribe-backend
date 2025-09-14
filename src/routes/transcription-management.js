const express = require('express');
const router = express.Router();
const { supabase, searchTranscriptions, countTranscriptions, getTranscriptionFilters } = require('../config/supabase');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  // Aquí deberías verificar el token JWT con tu servicio de autenticación
  // Por ahora, asumimos que el token es válido para desarrollo
  next();
};

// GET /api/transcriptions - Obtener todas las transcripciones con filtros y paginación
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      is_favorite,
      language,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const result = await searchTranscriptions({
      search,
      status,
      is_favorite: is_favorite !== undefined ? is_favorite === 'true' : undefined,
      language,
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order
    });

    res.json(result);
  } catch (error) {
    console.error('Error in transcription management:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/transcriptions/filters - Obtener opciones de filtro disponibles
router.get('/filters', authenticateToken, async (req, res) => {
  try {
    const filters = await getTranscriptionFilters();
    res.json(filters);
  } catch (error) {
    console.error('Error in filters endpoint:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/transcriptions/:id - Obtener una transcripción específica
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Transcripción no encontrada' });
      }
      console.error('Error fetching transcription:', error);
      return res.status(500).json({ error: 'Error al obtener la transcripción' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in get transcription:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/transcriptions/:id - Actualizar una transcripción
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validar campos permitidos para actualización
    const allowedFields = ['title', 'is_favorite', 'status', 'tags'];
    const filteredUpdates = {};
    
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos válidos para actualizar' });
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('transcriptions')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transcription:', error);
      return res.status(500).json({ error: 'Error al actualizar la transcripción' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in update transcription:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/transcriptions/:id - Eliminar una transcripción
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transcription:', error);
      return res.status(500).json({ error: 'Error al eliminar la transcripción' });
    }

    res.json({ message: 'Transcripción eliminada correctamente' });
  } catch (error) {
    console.error('Error in delete transcription:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/transcriptions/stats/overview - Estadísticas generales
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { data: totalData, error: totalError } = await supabase
      .from('transcriptions')
      .select('id', { count: 'exact' });

    const { data: favoriteData, error: favoriteError } = await supabase
      .from('transcriptions')
      .select('id', { count: 'exact' })
      .eq('is_favorite', true);

    const { data: statusData, error: statusError } = await supabase
      .from('transcriptions')
      .select('status, id')
      .not('status', 'is', null);

    if (totalError || favoriteError || statusError) {
      console.error('Error fetching stats:', totalError || favoriteError || statusError);
      return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }

    const statusCounts = {};
    statusData.forEach(item => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });

    res.json({
      total: totalData.length,
      favorites: favoriteData.length,
      by_status: statusCounts
    });
  } catch (error) {
    console.error('Error in stats endpoint:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;