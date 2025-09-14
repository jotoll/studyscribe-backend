const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Middleware de autenticación simple
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

    const offset = (page - 1) * limit;

    let query = supabase
      .from('transcriptions')
      .select('*', { count: 'exact' });

    // Búsqueda de texto completo
    if (search) {
      query = query.textSearch('search_vector', search, {
        type: 'websearch',
        config: 'spanish'
      });
    }

    // Filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (is_favorite !== undefined) {
      query = query.eq('is_favorite', is_favorite === 'true');
    }

    if (language) {
      query = query.eq('language', language);
    }

    // Ordenamiento
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching transcriptions:', error);
      return res.status(500).json({ error: 'Error al obtener las transcripciones' });
    }

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in transcription management:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/transcriptions/filters - Obtener opciones de filtro disponibles
router.get('/filters', authenticateToken, async (req, res) => {
  try {
    const { data: statusData, error: statusError } = await supabase
      .from('transcriptions')
      .select('status')
      .not('status', 'is', null);

    const { data: languageData, error: languageError } = await supabase
      .from('transcriptions')
      .select('language')
      .not('language', 'is', null);

    if (statusError || languageError) {
      console.error('Error fetching filters:', statusError || languageError);
      return res.status(500).json({ error: 'Error al obtener los filtros' });
    }

    const statusOptions = [...new Set(statusData.map(item => item.status))];
    const languageOptions = [...new Set(languageData.map(item => item.language))];

    res.json({
      status: statusOptions,
      language: languageOptions
    });
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