const express = require('express');
const { supabase, searchTranscriptions, countTranscriptions, getTranscriptionFilters } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/transcriptions - Obtener todas las transcripciones del usuario con filtros y búsqueda
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      subject = '', 
      favorite = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    const { data, error } = await searchTranscriptions({
      userId,
      search,
      subject,
      favorite,
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      offset
    });

    if (error) {
      console.error('Error buscando transcripciones:', error);
      return res.status(500).json({ 
        error: 'Error al buscar transcripciones',
        details: error.message 
      });
    }

    // Obtener conteo total para paginación
    const { count, error: countError } = await countTranscriptions({
      userId,
      search,
      subject,
      favorite
    });

    if (countError) {
      console.error('Error contando transcripciones:', countError);
    }

    res.json({
      success: true,
      data: {
        transcriptions: data || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil((count || 0) / limit),
          totalItems: count || 0,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error en gestión de transcripciones:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/transcriptions/filters - Obtener filtros disponibles
router.get('/filters', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await getTranscriptionFilters(userId);

    if (error) {
      console.error('Error obteniendo filtros:', error);
      return res.status(500).json({ 
        error: 'Error al obtener filtros',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/transcriptions/stats - Obtener estadísticas del usuario
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener conteo total
    const { count: totalCount } = await countTranscriptions({ userId });
    
    // Obtener conteo de favoritos
    const { count: favoriteCount } = await countTranscriptions({ 
      userId, 
      favorite: 'true' 
    });

    // Obtener conteo por materias
    const { data: subjectCounts } = await getTranscriptionFilters(userId);

    res.json({
      success: true,
      data: {
        total: totalCount || 0,
        favorites: favoriteCount || 0,
        subjects: subjectCounts?.subjects || []
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/transcriptions/:id - Obtener transcripción específica
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Transcripción no encontrada' 
        });
      }
      console.error('Error obteniendo transcripción:', error);
      return res.status(500).json({ 
        error: 'Error al obtener la transcripción',
        details: error.message 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        error: 'Transcripción no encontrada' 
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error obteniendo transcripción:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /api/transcriptions/:id - Actualizar transcripción
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, subject, is_favorite, enhanced_text } = req.body;

    // Verificar que la transcripción existe y pertenece al usuario
    const { data: existing, error: checkError } = await supabase
      .from('transcriptions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ 
        error: 'Transcripción no encontrada' 
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (subject !== undefined) updates.subject = subject;
    if (is_favorite !== undefined) updates.is_favorite = is_favorite;
    if (enhanced_text !== undefined) updates.enhanced_text = enhanced_text;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron campos para actualizar' 
      });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('transcriptions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error actualizando transcripción:', error);
      return res.status(500).json({ 
        error: 'Error al actualizar la transcripción',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Transcripción actualizada correctamente'
    });

  } catch (error) {
    console.error('Error actualizando transcripción:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /api/transcriptions/:id - Eliminar transcripción
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la transcripción existe y pertenece al usuario
    const { data: existing, error: checkError } = await supabase
      .from('transcriptions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ 
        error: 'Transcripción no encontrada' 
      });
    }

    const { error } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error eliminando transcripción:', error);
      return res.status(500).json({ 
        error: 'Error al eliminar la transcripción',
        details: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Transcripción eliminada correctamente'
    });

  } catch (error) {
    console.error('Error eliminando transcripción:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
