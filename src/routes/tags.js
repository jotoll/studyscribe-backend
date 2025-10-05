const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/tags - Obtener todas las etiquetas del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error obteniendo etiquetas:', error);
      return res.status(500).json({ 
        error: 'Error al obtener etiquetas',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: {
        tags: data || []
      }
    });

  } catch (error) {
    console.error('Error obteniendo etiquetas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/tags/:id - Obtener etiqueta específica
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

// POST /api/tags - Crear nueva etiqueta
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

// PUT /api/tags/:id - Actualizar etiqueta
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, color } = req.body;

    // Verificar que la etiqueta existe y pertenece al usuario
    const { data: existing, error: checkError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ 
        error: 'Etiqueta no encontrada' 
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron campos para actualizar' 
      });
    }

    // Si se cambia el nombre, verificar que no exista otra etiqueta con el mismo nombre
    if (name) {
      const { data: nameConflict } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name.trim())
        .neq('id', id)
        .single();

      if (nameConflict) {
        return res.status(400).json({ 
          error: 'Ya existe una etiqueta con ese nombre' 
        });
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando etiqueta:', error);
      return res.status(500).json({ 
        error: 'Error al actualizar la etiqueta',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data,
      message: 'Etiqueta actualizada correctamente'
    });

  } catch (error) {
    console.error('Error actualizando etiqueta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /api/tags/:id - Eliminar etiqueta
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la etiqueta existe y pertenece al usuario
    const { data: existing, error: checkError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ 
        error: 'Etiqueta no encontrada' 
      });
    }

    // Eliminar todas las relaciones de esta etiqueta con transcripciones
    const { error: relationError } = await supabase
      .from('transcription_tags')
      .delete()
      .eq('tag_id', id);

    if (relationError) {
      console.error('Error eliminando relaciones de etiqueta:', relationError);
      return res.status(500).json({ 
        error: 'Error al eliminar las relaciones de la etiqueta',
        details: relationError.message 
      });
    }

    // Eliminar la etiqueta
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error eliminando etiqueta:', error);
      return res.status(500).json({ 
        error: 'Error al eliminar la etiqueta',
        details: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Etiqueta eliminada correctamente'
    });

  } catch (error) {
    console.error('Error eliminando etiqueta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/tags/:tagId/transcriptions/:transcriptionId - Añadir etiqueta a transcripción
router.post('/:tagId/transcriptions/:transcriptionId', authenticateToken, async (req, res) => {
  try {
    const { tagId, transcriptionId } = req.params;
    const userId = req.user.id;

    // Verificar que la transcripción existe y pertenece al usuario
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('id')
      .eq('id', transcriptionId)
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
      .eq('transcription_id', transcriptionId)
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
        transcription_id: transcriptionId,
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

// DELETE /api/tags/:tagId/transcriptions/:transcriptionId - Quitar etiqueta de transcripción
router.delete('/:tagId/transcriptions/:transcriptionId', authenticateToken, async (req, res) => {
  try {
    const { tagId, transcriptionId } = req.params;
    const userId = req.user.id;

    // Verificar que la transcripción existe y pertenece al usuario
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('id')
      .eq('id', transcriptionId)
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
      .eq('transcription_id', transcriptionId)
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

// GET /api/tags/stats - Obtener estadísticas de etiquetas
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener conteo de transcripciones por etiqueta
    const { data: tagCounts } = await supabase
      .from('transcription_tags')
      .select(`
        tag_id,
        tags!inner (
          name,
          color
        )
      `)
      .eq('tags.user_id', userId);

    // Agrupar conteos por etiqueta
    const tagCountMap = {};
    if (tagCounts) {
      tagCounts.forEach(item => {
        const tagId = item.tag_id;
        if (!tagCountMap[tagId]) {
          tagCountMap[tagId] = {
            tag_id: tagId,
            tag_name: item.tags?.name || 'Desconocida',
            tag_color: item.tags?.color || '#666666',
            count: 0
          };
        }
        tagCountMap[tagId].count++;
      });
    }

    const tagCountsArray = Object.values(tagCountMap);

    res.json({
      success: true,
      data: {
        tag_counts: tagCountsArray
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de etiquetas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/tags/:id/transcriptions - Obtener transcripciones con una etiqueta específica
router.get('/:id/transcriptions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
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

    // Verificar que la etiqueta existe y pertenece al usuario
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (tagError || !tag) {
      return res.status(404).json({ 
        error: 'Etiqueta no encontrada' 
      });
    }

    // Construir consulta base
    let query = supabase
      .from('transcription_tags')
      .select(`
        transcriptions (*)
      `, { count: 'exact' })
      .eq('tag_id', id)
      .eq('transcriptions.user_id', userId);

    // Aplicar filtros
    if (search) {
      query = query.ilike('transcriptions.title', `%${search}%`);
    }

    if (subject && subject !== 'all') {
      query = query.eq('transcriptions.subject', subject);
    }

    if (favorite === 'true') {
      query = query.eq('transcriptions.is_favorite', true);
    }

    // Aplicar ordenamiento
    if (sortBy) {
      query = query.order(`transcriptions.${sortBy}`, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('transcriptions.created_at', { ascending: false });
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error obteniendo transcripciones de etiqueta:', error);
      return res.status(500).json({ 
        error: 'Error al obtener transcripciones de la etiqueta',
        details: error.message 
      });
    }

    // Extraer las transcripciones de los resultados
    const transcriptions = data?.map(item => item.transcriptions) || [];

    res.json({
      success: true,
      data: {
        transcriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil((count || 0) / limit),
          totalItems: count || 0,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo transcripciones de etiqueta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
