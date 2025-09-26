const express = require('express');
const { supabase, searchTranscriptions, countTranscriptions, getTranscriptionFilters, getTranscriptionDates } = require('../config/supabase');
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
      tags = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Convertir tags de string a array si está presente
    const tagIds = tags ? tags.split(',') : [];

    const { data, error } = await searchTranscriptions({
      userId,
      search,
      subject,
      favorite,
      tags: tagIds,
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
      favorite,
      tags: tagIds
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

    const result = await getTranscriptionFilters(userId);

    if (result.error) {
      console.error('Error obteniendo filtros:', result.error);
      return res.status(500).json({
        error: 'Error al obtener filtros',
        details: result.error.message
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/transcriptions/dates - Obtener fechas con transcripciones
router.get('/dates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { dates, error } = await getTranscriptionDates(userId);

    if (error) {
      console.error('Error obteniendo fechas:', error);
      return res.status(500).json({
        error: 'Error al obtener fechas con transcripciones',
        details: error.message
      });
    }

    res.json({
      success: true,
      data: {
        dates: dates || []
      }
    });

  } catch (error) {
    console.error('Error obteniendo fechas:', error);
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
    const subjectCounts = await getTranscriptionFilters(userId);

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

// GET /api/transcriptions/:id/tags - Obtener etiquetas de una transcripción
router.get('/:id/tags', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la transcripción existe y pertenece al usuario
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (transcriptionError || !transcription) {
      return res.status(404).json({ 
        error: 'Transcripción no encontrada' 
      });
    }

    // Obtener las etiquetas de esta transcripción
    const { data, error } = await supabase
      .from('transcription_tags')
      .select(`
        tags (
          id,
          name,
          color,
          created_at,
          updated_at
        )
      `)
      .eq('transcription_id', id)
      .order('name', { foreignTable: 'tags', ascending: true });

    if (error) {
      console.error('Error obteniendo etiquetas de transcripción:', error);
      return res.status(500).json({ 
        error: 'Error al obtener las etiquetas de la transcripción',
        details: error.message 
      });
    }

    // Extraer las etiquetas de los resultados
    const tags = data?.map(item => item.tags).filter(tag => tag !== null) || [];

    res.json({
      success: true,
      data: {
        tags
      }
    });

  } catch (error) {
    console.error('Error obteniendo etiquetas de transcripción:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/transcriptions/:id/tags/:tagId - Asignar etiqueta a transcripción
router.post('/:id/tags/:tagId', authenticateToken, async (req, res) => {
  try {
    const { id, tagId } = req.params;
    const userId = req.user.id;

    // Verificar que la transcripción existe y pertenece al usuario
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (transcriptionError || !transcription) {
      return res.status(404).json({ 
        error: 'Transcripción no encontrada' 
      });
    }

    // Verificar que la etiqueta existe y pertenece al usuario
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();

    if (tagError || !tag) {
      return res.status(404).json({ 
        error: 'Etiqueta no encontrada' 
      });
    }

    // Verificar si ya existe la relación
    const { data: existingRelation } = await supabase
      .from('transcription_tags')
      .select('id')
      .eq('transcription_id', id)
      .eq('tag_id', tagId)
      .single();

    if (existingRelation) {
      return res.status(400).json({ 
        error: 'La etiqueta ya está asignada a esta transcripción' 
      });
    }

    // Crear la relación
    const { data, error } = await supabase
      .from('transcription_tags')
      .insert({
        transcription_id: id,
        tag_id: tagId
      })
      .select()
      .single();

    if (error) {
      console.error('Error añadiendo etiqueta a transcripción:', error);
      return res.status(500).json({ 
        error: 'Error al añadir la etiqueta a la transcripción',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data,
      message: 'Etiqueta añadida correctamente'
    });

  } catch (error) {
    console.error('Error añadiendo etiqueta a transcripción:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /api/transcriptions/:id/tags/:tagId - Quitar etiqueta de transcripción
router.delete('/:id/tags/:tagId', authenticateToken, async (req, res) => {
  try {
    const { id, tagId } = req.params;
    const userId = req.user.id;

    // Verificar que la transcripción existe y pertenece al usuario
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (transcriptionError || !transcription) {
      return res.status(404).json({ 
        error: 'Transcripción no encontrada' 
      });
    }

    // Verificar que la etiqueta existe y pertenece al usuario
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();

    if (tagError || !tag) {
      return res.status(404).json({ 
        error: 'Etiqueta no encontrada' 
      });
    }

    // Eliminar la relación
    const { error } = await supabase
      .from('transcription_tags')
      .delete()
      .eq('transcription_id', id)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error quitando etiqueta de transcripción:', error);
      return res.status(500).json({ 
        error: 'Error al quitar la etiqueta de la transcripción',
        details: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Etiqueta quitada correctamente'
    });

  } catch (error) {
    console.error('Error quitando etiqueta de transcripción:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
