const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/folders - Obtener todas las carpetas del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo carpetas:', error);
      return res.status(500).json({ 
        error: 'Error al obtener carpetas',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: {
        folders: data || []
      }
    });

  } catch (error) {
    console.error('Error obteniendo carpetas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/folders/:id - Obtener carpeta específica
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Carpeta no encontrada' 
        });
      }
      console.error('Error obteniendo carpeta:', error);
      return res.status(500).json({ 
        error: 'Error al obtener la carpeta',
        details: error.message 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        error: 'Carpeta no encontrada' 
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error obteniendo carpeta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/folders - Crear nueva carpeta
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color = '#666666', icon = 'folder', parent_id, position = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'El nombre de la carpeta es requerido' 
      });
    }

    // Verificar si ya existe una carpeta con el mismo nombre para este usuario
    const { data: existingFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name.trim())
      .single();

    if (existingFolder) {
      return res.status(400).json({ 
        error: 'Ya existe una carpeta con ese nombre' 
      });
    }

    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name: name.trim(),
        color,
        icon,
        parent_id,
        position,
        is_system: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando carpeta:', error);
      return res.status(500).json({ 
        error: 'Error al crear la carpeta',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data,
      message: 'Carpeta creada correctamente'
    });

  } catch (error) {
    console.error('Error creando carpeta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /api/folders/:id - Actualizar carpeta
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, color, icon, parent_id, position } = req.body;

    // Verificar que la carpeta existe y pertenece al usuario
    const { data: existing, error: checkError } = await supabase
      .from('folders')
      .select('id, is_system')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ 
        error: 'Carpeta no encontrada' 
      });
    }

    // No permitir modificar carpetas del sistema
    if (existing.is_system) {
      return res.status(400).json({ 
        error: 'No se pueden modificar carpetas del sistema' 
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (parent_id !== undefined) updates.parent_id = parent_id;
    if (position !== undefined) updates.position = position;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron campos para actualizar' 
      });
    }

    // Si se cambia el nombre, verificar que no exista otra carpeta con el mismo nombre
    if (name) {
      const { data: nameConflict } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name.trim())
        .neq('id', id)
        .single();

      if (nameConflict) {
        return res.status(400).json({ 
          error: 'Ya existe una carpeta con ese nombre' 
        });
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando carpeta:', error);
      return res.status(500).json({ 
        error: 'Error al actualizar la carpeta',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data,
      message: 'Carpeta actualizada correctamente'
    });

  } catch (error) {
    console.error('Error actualizando carpeta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /api/folders/:id - Eliminar carpeta
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la carpeta existe y pertenece al usuario
    const { data: existing, error: checkError } = await supabase
      .from('folders')
      .select('id, is_system')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ 
        error: 'Carpeta no encontrada' 
      });
    }

    // No permitir eliminar carpetas del sistema
    if (existing.is_system) {
      return res.status(400).json({ 
        error: 'No se pueden eliminar carpetas del sistema' 
      });
    }

    // Verificar si la carpeta tiene transcripciones
    const { count: transcriptionCount } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact' })
      .eq('folder_id', id)
      .eq('user_id', userId);

    if (transcriptionCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la carpeta porque contiene transcripciones. Mueve las transcripciones primero.' 
      });
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error eliminando carpeta:', error);
      return res.status(500).json({ 
        error: 'Error al eliminar la carpeta',
        details: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Carpeta eliminada correctamente'
    });

  } catch (error) {
    console.error('Error eliminando carpeta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/folders/:folderId/transcriptions/:transcriptionId/move - Mover transcripción a carpeta
router.post('/:folderId/transcriptions/:transcriptionId/move', authenticateToken, async (req, res) => {
  try {
    const { folderId, transcriptionId } = req.params;
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

    // Si folderId es "null", significa quitar de la carpeta
    let folder_id = null;
    if (folderId !== 'null') {
      // Verificar que la carpeta existe y pertenece al usuario
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id')
        .eq('id', folderId)
        .eq('user_id', userId)
        .single();

      if (folderError || !folder) {
        return res.status(404).json({ 
          error: 'Carpeta no encontrada' 
        });
      }
      folder_id = folderId;
    }

    const { error } = await supabase
      .from('transcriptions')
      .update({ 
        folder_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error moviendo transcripción:', error);
      return res.status(500).json({ 
        error: 'Error al mover la transcripción',
        details: error.message 
      });
    }

    res.json({
      success: true,
      message: folder_id ? 'Transcripción movida a carpeta correctamente' : 'Transcripción quitada de carpeta correctamente'
    });

  } catch (error) {
    console.error('Error moviendo transcripción:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/folders/stats - Obtener estadísticas de carpetas
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener conteo total de transcripciones
    const { count: totalCount } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Obtener conteo de transcripciones sin carpeta
    const { count: withoutFolderCount } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('folder_id', null);

    // Obtener conteo por carpeta
    const { data: folderCounts } = await supabase
      .from('transcriptions')
      .select('folder_id, folders(name)')
      .eq('user_id', userId)
      .not('folder_id', 'is', null)
      .select(`
        folder_id,
        folders (
          name
        )
      `);

    // Agrupar conteos por carpeta
    const folderCountMap = {};
    if (folderCounts) {
      folderCounts.forEach(item => {
        const folderId = item.folder_id;
        if (!folderCountMap[folderId]) {
          folderCountMap[folderId] = {
            folder_id: folderId,
            folder_name: item.folders?.name || 'Desconocida',
            count: 0
          };
        }
        folderCountMap[folderId].count++;
      });
    }

    const folderCountsArray = Object.values(folderCountMap);

    res.json({
      success: true,
      data: {
        total: totalCount || 0,
        with_folder: (totalCount || 0) - (withoutFolderCount || 0),
        without_folder: withoutFolderCount || 0,
        folder_counts: folderCountsArray
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de carpetas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/folders/:id/transcriptions - Obtener transcripciones de una carpeta específica
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

    // Verificar que la carpeta existe y pertenece al usuario
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (folderError || !folder) {
      return res.status(404).json({ 
        error: 'Carpeta no encontrada' 
      });
    }

    // Construir consulta base
    let query = supabase
      .from('transcriptions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('folder_id', id);

    // Aplicar filtros
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }

    if (favorite === 'true') {
      query = query.eq('is_favorite', true);
    }

    // Aplicar ordenamiento
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error obteniendo transcripciones de carpeta:', error);
      return res.status(500).json({ 
        error: 'Error al obtener transcripciones de la carpeta',
        details: error.message 
      });
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
    console.error('Error obteniendo transcripciones de carpeta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
