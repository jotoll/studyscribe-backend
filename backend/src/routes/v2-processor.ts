import express from 'express';
import multer from 'multer';
import path from 'path';
import { audioToDocV2, saveDocBlocksV2, generateDocId, loadDocBlocksV2 } from '../services/audio-to-doc-v2';

const router = express.Router();

// Configuración de multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Más permisivo: aceptar por extensión también
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave',
      'audio/m4a', 'audio/x-m4a', 'video/mp4',
      'audio/mp4', 'audio/aac', 'audio/x-aac',
      'audio/x-m4a', 'audio/mp4a-latm',
      'application/octet-stream' // Para archivos con MIME genérico
    ];
    
    const allowedExtensions = /\.(mp3|wav|m4a|mp4|aac|mpeg|webm)$/i;
    
    console.log(`📁 Archivo recibido: ${file.originalname}, MIME type: ${file.mimetype}`);
    
    // Aceptar si el MIME type está permitido O si la extensión es válida
    const isValidMime = allowedTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.test(file.originalname);
    
    if (isValidMime || isValidExtension) {
      console.log(`✅ Archivo aceptado: ${file.originalname}`);
      cb(null, true);
    } else {
      console.warn(`❌ Tipo rechazado: MIME=${file.mimetype}, archivo=${file.originalname}`);
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Endpoint principal de procesamiento V2
router.post('/process-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se proporcionó archivo de audio' 
      });
    }

    const { curso, asignatura, idioma = 'es', glosario } = req.body;
    
    if (!curso || !asignatura) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren curso y asignatura'
      });
    }

    console.log(`🎯 Procesando audio: ${req.file.originalname}`);
    
    const doc_id = generateDocId();
    
    const result = await audioToDocV2({
      filepath: req.file.path,
      meta: { curso, asignatura, idioma },
      doc_id,
      glosarioPrompt: glosario
    });

    // Guardar el resultado
    await saveDocBlocksV2(result);

    res.json({
      success: true,
      data: {
        doc_id: result.doc_id,
        blocks_count: result.blocks.length,
        meta: result.meta,
        version: result.version
      }
    });

  } catch (error) {
    console.error('Error en procesamiento:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// Endpoint para obtener documento procesado
router.get('/document/:doc_id', async (req, res) => {
  try {
    const { doc_id } = req.params;
    
    // Aquí cargarías de tu base de datos real
    const doc = await loadDocBlocksV2(doc_id);
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Documento no encontrado'
      });
    }

    res.json({
      success: true,
      data: doc
    });

  } catch (error) {
    console.error('Error obteniendo documento:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint para actualizar documento
router.put('/document/:doc_id', async (req, res) => {
  try {
    const { doc_id } = req.params;
    const { blocks } = req.body;
    
    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren bloques válidos'
      });
    }

    // Cargar documento existente
    const existingDoc = await loadDocBlocksV2(doc_id);
    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        error: 'Documento no encontrado'
      });
    }

    // Actualizar bloques
    const updatedDoc = {
      ...existingDoc,
      blocks: blocks
    };

    // Guardar documento actualizado
    await saveDocBlocksV2(updatedDoc);

    res.json({
      success: true,
      message: 'Documento actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando documento:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// Endpoint de debug para tipos MIME
router.post('/debug-mime', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: 'No se proporcionó archivo' 
    });
  }
  
  res.json({
    success: true,
    data: {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename
    }
  });
});

// Endpoint de salud
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'V2 Processor está funcionando',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;
