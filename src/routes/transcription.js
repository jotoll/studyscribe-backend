const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const transcriptionService = require('../services/transcriptionService');
const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

console.log('🔄 Loading transcription routes with debug...');

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(mp3|wav|m4a|mp4|mpeg|webm|aac)$/i;
    const allowedMimeTypes = [
      'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave',
      'audio/m4a', 'audio/x-m4a', 'video/mp4',
      'audio/mp4', 'audio/aac', 'audio/x-aac',
      'audio/x-m4a', 'audio/mp4a-latm',
      'application/octet-stream'
    ];
    
    console.log(`📁 Archivo: ${file.originalname}, MIME: ${file.mimetype}`);
    
    const isValidExtension = allowedExtensions.test(file.originalname);
    const isValidMime = allowedMimeTypes.includes(file.mimetype);
    
    if (isValidExtension || isValidMime) {
      console.log(`✅ Archivo aceptado: ${file.originalname}`);
      cb(null, true);
    } else {
      console.warn(`❌ Archivo rechazado: ${file.originalname}, MIME: ${file.mimetype}`);
      cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos de audio.'));
    }
  }
});

// POST /api/transcription/upload-file - Subir y transcribir audio (renombrado para evitar conflictos)
router.post('/upload-file', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    console.log('📥 Upload endpoint reached');
    console.log('📁 File:', req.file ? req.file.originalname : 'none');
    console.log('📋 Body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo de audio' });
    }

    // Extraer parámetros del body, incluyendo los idiomas
    const { 
      subject = null, 
      format, 
      language = 'es', 
      translation_language = 'es',
      transcriptionLanguage = language,  // Nuevo parámetro desde móvil
      translationLanguage = translation_language  // Nuevo parámetro desde móvil
    } = req.body;
    
    // Usar los nuevos parámetros si están disponibles, si no usar los antiguos
    const finalTranscriptionLanguage = transcriptionLanguage || language;
    const finalTranslationLanguage = translationLanguage || translation_language;
    
    console.log('🌍 Idiomas configurados:');
    console.log(`   - Transcripción: ${finalTranscriptionLanguage}`);
    console.log(`   - Traducción: ${finalTranslationLanguage}`);

    // 1. Transcribir audio con el idioma especificado
    const transcription = await transcriptionService.transcribeAudio(req.file.path, finalTranscriptionLanguage);
    
    // 2. Mejorar transcripción con DeepSeek, especificando el idioma de traducción
    const enhanced = await transcriptionService.enhanceTranscription(
      transcription.text, 
      subject,
      finalTranslationLanguage
    );

    // 3. Guardar transcripción en Supabase
    // For development/testing, create a mock user ID with valid UUID format
    const userId = req.user ? req.user.id : '123e4567-e89b-12d3-a456-426614174000';
    const fileInfo = {
      url: req.file.filename,
      duration: transcription.duration,
      size: req.file.size
    };
    
    let saveResult;
    try {
      saveResult = await transcriptionService.saveTranscriptionToDB(
        enhanced,
        userId,
        fileInfo,
        {
          language: finalTranscriptionLanguage,           // Usar la columna existente 'language' para el idioma de transcripción
          translation_language: finalTranslationLanguage  // Usar la nueva columna 'translation_language' para el idioma de traducción
        }
      );
      
      console.log('✅ Transcripción guardada en Supabase con ID:', saveResult.id);
      
      // Si se procesó con chunking, trackear uso adicional
      if (enhanced.was_chunked) {
        await transcriptionService.trackUserUsage(userId, {
          transcription_count: enhanced.chunk_count || 1,
          audio_minutes: Math.ceil(transcription.duration / 60)
        });
      } else {
        await transcriptionService.trackUserUsage(userId, {
          transcription_count: 1,
          audio_minutes: Math.ceil(transcription.duration / 60)
        });
      }
      
    } catch (saveError) {
      console.error('❌ ERROR CRÍTICO guardando en Supabase:', saveError.message);
      console.error('📋 Stack trace:', saveError.stack);
      console.error('🔍 Detalles del error:', saveError);
      
      // Ahora sí fallar la petición para que el usuario sepa que no se guardó
      throw new Error(`Error guardando transcripción en la base de datos: ${saveError.message}`);
    }

    // Debug: verificar parámetros
    console.log('🔍 Body params:', req.body);
    console.log('🔍 Format requested:', format);
    
    // Convertir JSON mejorado a bloques estructurados
    let enhancedBlocks;
    if (typeof enhanced.enhanced_text === 'object' && enhanced.enhanced_text !== null) {
      // Es JSON estructurado
      enhancedBlocks = transcriptionService.jsonToBlocks(enhanced.enhanced_text);
    } else {
      // Es texto plano (fallback)
      enhancedBlocks = transcriptionService.parseTextToBlocks(enhanced.enhanced_text);
    }
    
    // Obtener el subject actualizado de la transcripción guardada
    let updatedSubject = subject;
    try {
      // Consultar la transcripción recién guardada para obtener el subject actualizado
      const { supabase } = require('../config/supabase.js');
      if (supabase) {
        const { data: savedTranscription, error } = await supabase
          .from('transcriptions')
          .select('subject')
          .eq('id', saveResult.id)
          .single();
        
        if (!error && savedTranscription) {
          updatedSubject = savedTranscription.subject;
          console.log('✅ Subject actualizado obtenido de la base de datos:', updatedSubject);
        } else {
          console.warn('⚠️ No se pudo obtener el subject actualizado de la base de datos:', error?.message);
        }
      }
    } catch (dbError) {
      console.warn('⚠️ Error obteniendo subject actualizado:', dbError.message);
    }

    // Devolver formato JSON con bloques estructurados
    const responseData = {
      success: true,
      data: {
        id: saveResult.id, // Incluir el ID de la transcripción recién creada
        file_info: {
          filename: req.file.filename,
          original_name: req.file.originalname,
          size: req.file.size,
          duration: transcription.duration
        },
        transcription: {
          id: saveResult.id, // También incluir en el objeto transcription
          original: transcription.text,
          enhanced: enhanced.enhanced_text,
          confidence: transcription.confidence
        },
        blocks: enhancedBlocks,
        subject: updatedSubject, // Usar el subject actualizado
        processed_at: enhanced.processed_at,
        language: language, // Incluir idioma de transcripción
        translation_language: translation_language // Incluir idioma de traducción
      }
    };
    
    // Si se solicita formato v2, incluir también los doc blocks
    if (format === 'v2') {
      console.log('📋 Format v2 requested');
      const docBlocks = transcriptionService.convertToDocBlocksV2(
        transcription.segments || [],
        transcription.language
      );
      responseData.data.doc_blocks = docBlocks;
    }
    
    // Log response size for debugging
    const responseJson = JSON.stringify(responseData);
    console.log(`📊 Response size: ${responseJson.length} characters (~${Math.round(responseJson.length / 1024)}KB)`);
    
    // Set timeout and handle potential network errors
    res.setTimeout(120000, () => {
      console.warn('⚠️ Response timeout after 120 seconds');
    });
    
    try {
      res.json(responseData);
      console.log('✅ Response sent successfully');
    } catch (sendError) {
      console.error('❌ Error sending response:', sendError);
      // Try to send a simpler error response
      res.status(500).json({
        error: 'Error sending response',
        details: 'Network error occurred while sending response'
      });
    }

  } catch (error) {
    console.error('Error en transcripción:', error);
    res.status(500).json({ 
      error: 'Error procesando el archivo de audio',
      details: error.message 
    });
  }
});

// POST /api/transcription/enhance - Mejorar texto existente
router.post('/enhance', async (req, res) => {
  try {
    const { text, subject = null, translation_language = 'es' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Se requiere el texto a mejorar' });
    }

    const enhanced = await transcriptionService.enhanceTranscription(text, subject, translation_language);

    res.json({
      success: true,
      data: enhanced
    });

  } catch (error) {
    console.error('Error mejorando texto:', error);
    res.status(500).json({ 
      error: 'Error mejorando el texto',
      details: error.message 
    });
  }
});

// POST /api/transcription/generate-material - Generar material de estudio
router.post('/generate-material', async (req, res) => {
  try {
    const { text, type = 'summary', language = 'es' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Se requiere el texto base' });
    }

    const validTypes = ['summary', 'flashcards', 'concepts', 'quiz'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Tipo de material inválido. Tipos válidos: ${validTypes.join(', ')}` 
      });
    }

    const material = await transcriptionService.generateStudyMaterial(text, type, language);

    res.json({
      success: true,
      data: material
    });

  } catch (error) {
    console.error('Error generando material:', error);
    res.status(500).json({ 
      error: 'Error generando material de estudio',
      details: error.message 
    });
  }
});

// POST /api/transcription/flowchart - Generar flujograma (endpoint separado)
router.post('/flowchart', async (req, res) => {
  try {
    const { enhanced_text, subject } = req.body;

    if (!enhanced_text) {
      return res.status(400).json({ error: 'Se requiere el texto mejorado' });
    }

    const flowchart = await transcriptionService.generateFlowchart(enhanced_text, subject);

    res.json({
      success: true,
      data: flowchart
    });

  } catch (error) {
    console.error('Error generando flujograma:', error);
    res.status(500).json({ 
      error: 'Error generando flujograma',
      details: error.message 
    });
  }
});

// POST /api/transcription/expand - Expandir texto con IA (para editor de bloques)
router.post('/expand', async (req, res) => {
  try {
    const { text, subject = null } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Se requiere el texto a expandir' });
    }

    const expanded = await transcriptionService.expandText(text, subject);

    res.json({
      success: true,
      data: expanded
    });

  } catch (error) {
    console.error('Error expandiendo texto:', error);
    res.status(500).json({ 
      error: 'Error expandiendo el texto con IA',
      details: error.message 
    });
  }
});

// POST /api/transcription/export-pdf - Exportar contenido a PDF
router.post('/export-pdf', async (req, res) => {
  try {
    console.log('📄 PDF export request received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    let content = req.body.content;

    if (!content) {
      console.error('❌ Error: No content provided for PDF export');
      return res.status(400).json({ error: 'Se requiere contenido para generar el PDF' });
    }

    if (typeof content !== 'string') {
      console.error('❌ Error: Content is not a string:', typeof content, content);
      // Try to convert object to string
      if (typeof content === 'object' && content !== null) {
        console.log('🔄 Converting object content to string');
        content = JSON.stringify(content, null, 2);
      } else {
        return res.status(400).json({ error: 'El contenido debe ser una cadena de texto' });
      }
    }

    if (content.trim().length === 0) {
      console.error('❌ Error: Content is empty or whitespace only');
      return res.status(400).json({ error: 'El contenido no puede estar vacío' });
    }

    // Determinar si el contenido es HTML o texto plano
    let processedContent = content;
    
    // Si parece ser texto plano (sin etiquetas HTML), convertirlo a HTML
    if (!content.includes('<') && !content.includes('>')) {
      // Primero, buscar y procesar key_concepts_block que puedan estar en múltiples líneas
      const keyConceptsRegex = /\{\s*"type":\s*"key_concepts_block",\s*"concepts":\s*\[[\s\S]*?\]\s*\}/gs;
      let keyConceptsMatch;
      let lastIndex = 0;
      let processedSections = [];
      
      // Buscar todos los key_concepts_block en el contenido
      while ((keyConceptsMatch = keyConceptsRegex.exec(content)) !== null) {
        // Procesar el texto antes del match
        const textBeforeMatch = content.substring(lastIndex, keyConceptsMatch.index);
        processedSections.push(processTextContent(textBeforeMatch));
        
        // Procesar el key_concepts_block
        try {
          const jsonData = JSON.parse(keyConceptsMatch[0]);
          if (jsonData.type === "key_concepts_block" && Array.isArray(jsonData.concepts)) {
            const conceptsHtml = `<div class="key-concepts"><div class="key-concepts-title">Conceptos Clave</div><div class="concepts-grid">${jsonData.concepts.map(concept => `<div class="concept-pill">${concept}</div>`).join('')}</div></div>`;
            processedSections.push(conceptsHtml);
          }
        } catch (e) {
          console.error('Error parsing key_concepts_block JSON:', e);
        }
        
        lastIndex = keyConceptsMatch.index + keyConceptsMatch[0].length;
      }
      
      // Procesar el texto restante después del último match
      const remainingText = content.substring(lastIndex);
      processedSections.push(processTextContent(remainingText));
      
      processedContent = processedSections.join('');
    }

    // Función para procesar el contenido de texto normal - optimizada para evitar saltos de línea excesivos
    function processTextContent(textContent) {
      let inConceptBlock = false;
      let inExamples = false;
      let inSummaryBlock = false;
      let inKeyConcepts = false;
      
      const lines = textContent.split('\n');
      const processedLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        
        // Eliminar líneas de sección numerada
        if (trimmedLine.startsWith('--- SECCIÓN')) {
          continue;
        }
        
        // Saltar líneas con JSON o bloques de código
        if (trimmedLine.startsWith('{') || trimmedLine.startsWith('}') || trimmedLine.includes('"type"')) {
          continue;
        }
        
        // Procesar títulos con niveles
        if (trimmedLine.startsWith('TÍTULO (Nivel 1):')) {
          processedLines.push(`<h1 class="title-level-1">${trimmedLine.replace('TÍTULO (Nivel 1):', '').trim()}</h1>`);
          continue;
        }
        if (trimmedLine.startsWith('TÍTULO (Nivel 2):')) {
          processedLines.push(`<h2 class="title-level-2">${trimmedLine.replace('TÍTULO (Nivel 2):', '').trim()}</h2>`);
          continue;
        }
        if (trimmedLine.startsWith('TÍTULO (Nivel 3):')) {
          processedLines.push(`<h3 class="title-level-3">${trimmedLine.replace('TÍTULO (Nivel 3):', '').trim()}</h3>`);
          continue;
        }
        
        // Procesar título principal
        if (trimmedLine.startsWith('TÍTULO:')) {
          processedLines.push(`<h1 class="main-title">${trimmedLine.replace('TÍTULO:', '').trim()}</h1>`);
          continue;
        }
        
        // Procesar conceptos clave
        if (trimmedLine.startsWith('🔑 CONCEPTOS CLAVE:')) {
          inKeyConcepts = true;
          processedLines.push('<div class="key-concepts"><div class="key-concepts-title">Conceptos Clave</div><div class="concepts-grid">');
          continue;
        }
        
        if (trimmedLine.startsWith('• ') && inKeyConcepts) {
          processedLines.push(`<div class="concept-pill">${trimmedLine.substring(2).trim()}</div>`);
          continue;
        }
        
        // Procesar conceptos
        if (trimmedLine.startsWith('CONCEPTO:')) {
          inConceptBlock = true;
          processedLines.push(`<div class="concept-block"><div class="concept-term">${trimmedLine.replace('CONCEPTO:', '').trim()}</div>`);
          continue;
        }
        
        if (trimmedLine.startsWith('DEFINICIÓN:')) {
          processedLines.push(`<div class="concept-definition">${trimmedLine.replace('DEFINICIÓN:', '').trim()}</div>`);
          continue;
        }
        
        if (trimmedLine.startsWith('EJEMPLOS:')) {
          inExamples = true;
          processedLines.push('<div class="examples-list"><div class="examples-title">Ejemplos:</div><ul>');
          continue;
        }
        
        if (trimmedLine.startsWith('📋 RESUMEN:')) {
          inSummaryBlock = true;
          processedLines.push('<div class="summary-block"><div class="summary-title">Resumen</div><div class="summary-content">');
          // Add the summary content after the title
          const summaryContent = trimmedLine.replace('📋 RESUMEN:', '').trim();
          if (summaryContent) {
            processedLines.push(summaryContent);
          }
          continue;
        }
        
        // Handle summary content lines - optimized like concept blocks
        if (inSummaryBlock && trimmedLine !== '' && !trimmedLine.startsWith('📋 RESUMEN:')) {
          // Add content directly without extra spaces that cause line breaks
          processedLines.push(trimmedLine);
          continue;
        }
        
        // Procesar items de lista
        if ((trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) && inExamples) {
          processedLines.push(`<li class="example-item">${trimmedLine.substring(2).trim()}</li>`);
          continue;
        }
        if ((trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) && !inExamples && !inKeyConcepts) {
          processedLines.push(`<li>${trimmedLine.substring(2).trim()}</li>`);
          continue;
        }
        
        // Cerrar bloques cuando encuentre líneas vacías
        if (trimmedLine === '' && inConceptBlock) {
          inConceptBlock = false;
          inExamples = false;
          processedLines.push('</div></div>');
          continue;
        }
        
        if (trimmedLine === '' && inExamples) {
          inExamples = false;
          processedLines.push('</ul></div>');
          continue;
        }
        
        if (trimmedLine === '' && inSummaryBlock) {
          inSummaryBlock = false;
          processedLines.push('</div></div></div>'); // Close summary-content, summary-block
          continue;
        }
        
        if (trimmedLine === '' && inKeyConcepts) {
          inKeyConcepts = false;
          processedLines.push('</div></div>');
          continue;
        }
        
        // Procesar texto normal - líneas que no son bloques especiales
        if (trimmedLine !== '') {
          // Solo procesar si no estamos dentro de un bloque especial
          if (!inConceptBlock && !inExamples && !inSummaryBlock && !inKeyConcepts) {
            // Si es la primera línea o la anterior terminó con tag de cierre, empezar nuevo párrafo
            if (processedLines.length === 0 || 
                processedLines[processedLines.length - 1].endsWith('</div>') ||
                processedLines[processedLines.length - 1].endsWith('</h1>') ||
                processedLines[processedLines.length - 1].endsWith('</h2>') ||
                processedLines[processedLines.length - 1].endsWith('</h3>') ||
                processedLines[processedLines.length - 1].endsWith('</p>') ||
                processedLines[processedLines.length - 1].endsWith('</li>') ||
                processedLines[processedLines.length - 1].endsWith('</ul>')) {
              processedLines.push(`<p class="section-content">${trimmedLine}`);
            } else {
              // Agregar a párrafo existente con espacio
              const lastIndex = processedLines.length - 1;
              if (processedLines[lastIndex].startsWith('<p class="section-content">')) {
                processedLines[lastIndex] += ' ' + trimmedLine;
              } else {
                processedLines.push(`<p class="section-content">${trimmedLine}`);
              }
            }
          }
        }
      }
      
      // Cerrar cualquier bloque que haya quedado abierto
      if (inConceptBlock) processedLines.push('</div></div>');
      if (inExamples) processedLines.push('</ul></div>');
      if (inSummaryBlock) processedLines.push('</div></div></div>'); // Close summary-content, summary-block
      if (inKeyConcepts) processedLines.push('</div></div>');
      
      // Cerrar cualquier párrafo abierto
      if (processedLines.length > 0 && 
          processedLines[processedLines.length - 1].startsWith('<p class="section-content">') &&
          !processedLines[processedLines.length - 1].endsWith('</p>')) {
        processedLines[processedLines.length - 1] += '</p>';
      }
      
      return processedLines.join('');
    }

    // Crear HTML mejorado para el PDF con diseño limpio y profesional
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Dicttr - Transcripción Mejorada</title>
        <style>
          /* Variables de colores para consistencia con la app */
          :root {
            --primary-color: #4A00E0;
            --primary-light: rgba(74, 0, 224, 0.1);
            --text-dark: #1a1a1a;
            --text-gray: #333;
            --text-light: #666;
            --bg-white: #ffffff;
            --bg-light: #fafafa;
            --border-light: #f0f0f0;
            --concept-bg: rgba(74, 0, 224, 0.03);
            --concept-border: rgba(74, 0, 224, 0.1);
            --key-concepts-bg: rgba(255, 193, 7, 0.03);
            --key-concepts-border: rgba(255, 193, 7, 0.1);
            --summary-bg: rgba(108, 117, 125, 0.03);
            --summary-border: rgba(108, 117, 125, 0.1);
            --example-bg: rgba(0, 128, 255, 0.03);
            --example-border: rgba(0, 128, 255, 0.1);
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: var(--text-gray);
            padding: 0;
            margin: 0;
            background: var(--bg-white);
            min-height: 100vh;
          }
          
          .container {
            max-width: 900px;
            margin: 10px auto;
            background: var(--bg-white);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            overflow: hidden;
          }
          
          .content {
            padding: 30px;
          }
          
          /* Prevención de saltos de página dentro de bloques */
          .concept-block, .key-concepts, .summary-block, .examples-list,
          .concept-container, .example-container, .note-container,
          .quote-container, .code-container, .formula-container {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Prevenir saltos después de títulos */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
          }
          
          /* Prevenir saltos dentro de párrafos */
          p {
            page-break-inside: avoid !important;
            orphans: 3; /* Mínimo 3 líneas al final de página */
            widows: 3;  /* Mínimo 3 líneas al inicio de página */
          }
          
          /* Control de viudas y huérfanas para todo el documento */
          body {
            orphans: 3;
            widows: 3;
          }
          
          /* Optimizaciones específicas para impresión */
          @media print {
            .container {
              margin: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            
            .content {
              padding: 20px !important;
            }
            
            /* Reducir márgenes en impresión */
            h1, h2, h3, h4, h5, h6 {
              margin-top: 15px !important;
              margin-bottom: 10px !important;
            }
            
            .concept-block, .key-concepts, .summary-block {
              margin: 6px 0 !important;
              padding: 6px !important;
            }
          }
          
          /* Estilos para títulos de diferentes niveles */
          .main-title {
            font-size: 28px;
            font-weight: 900;
            color: var(--text-dark);
            margin: 0 0 30px 0;
            text-align: center;
            letter-spacing: -0.4px;
            border-bottom: 3px solid var(--primary-color);
            padding-bottom: 10px;
          }
          
          .title-level-1 {
            font-size: 24px;
            font-weight: 800;
            color: var(--text-dark);
            margin: 40px 0 20px 0;
            letter-spacing: -0.3px;
            border-left: 4px solid var(--primary-color);
            padding-left: 15px;
          }
          
          .title-level-2 {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-dark);
            margin: 30px 0 15px 0;
            letter-spacing: -0.2px;
            border-left: 4px solid var(--primary-color);
            padding-left: 15px;
          }
          
          .title-level-3 {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-dark);
            margin: 25px 0 12px 0;
            letter-spacing: -0.2px;
          }
          
          .section-content {
            font-size: 14px;
            line-height: 1.7;
            color: var(--text-gray);
            margin: 0 0 15px 0;
            letter-spacing: -0.1px;
          }
          
          /* Bloques de concepto - espaciado optimizado */
          .concept-block {
            background: rgba(74, 0, 224, 0.03);
            border-radius: 8px;
            padding: 6px;
            margin: 6px 0;
            border: 1px solid rgba(74, 0, 224, 0.1);
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .concept-term {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 2px 0;
            letter-spacing: -0.2px;
            line-height: 1.2;
          }
          
          .concept-definition {
            font-size: 14px;
            line-height: 1.3;
            color: #333;
            margin: 0 0 4px 0;
            letter-spacing: -0.1px;
          }
          
          /* Lista de ejemplos - espaciado optimizado */
          .examples-list {
            background: var(--example-bg);
            padding: 8px;
            border-radius: 6px;
            margin: 8px 0;
            border: 1px solid var(--example-border);
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .examples-title {
            font-weight: 600;
            color: #0066cc;
            margin: 0 0 6px 0;
            font-size: 12px;
          }
          
          .example-item {
            padding: 4px 0;
            color: var(--text-gray);
            position: relative;
            padding-left: 16px;
            font-size: 11px;
            line-height: 14px;
          }
          
          .example-item:before {
            content: "•";
            color: #0066cc;
            font-weight: bold;
            position: absolute;
            left: 0;
          }
          
          /* Conceptos clave */
          .key-concepts {
            background: rgba(255, 193, 7, 0.03);
            padding: 12px;
            border-radius: 12px;
            margin: 12px 0;
            border: 1px solid rgba(255, 193, 7, 0.1);
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .key-concepts-title {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 12px 0;
            letter-spacing: -0.2px;
          }
          
          .concepts-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .concept-pill {
            background: rgba(74, 0, 224, 0.9);
            color: white;
            padding: 6px 12px;
            border-radius: 16px;
            font-weight: 500;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
          
          /* Bloques de resumen - espaciado optimizado */
          .summary-block {
            background: rgba(108, 117, 125, 0.03);
            padding: 8px;
            border-radius: 8px;
            margin: 8px 0;
            border: 1px solid rgba(108, 117, 125, 0.1);
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .summary-title {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 6px 0;
            letter-spacing: -0.2px;
          }
          
          .summary-content {
            font-size: 14px;
            line-height: 1.4;
            color: #333;
            letter-spacing: -0.1px;
          }
          
          /* Listas */
          ul {
            margin: 12px 0;
            padding-left: 20px;
          }
          
          li {
            font-size: 14px;
            line-height: 1.6;
            color: var(--text-gray);
            margin-bottom: 6px;
            letter-spacing: -0.1px;
          }
          
          li:before {
            content: "•";
            color: var(--primary-color);
            font-weight: bold;
            margin-right: 8px;
          }
          
          /* Separadores */
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
            margin: 30px 0;
            border: none;
          }
          
          /* Mejoras de espaciado y márgenes */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
          }
          
          p {
            margin: 0 0 15px 0;
            page-break-inside: avoid;
          }
          
          /* Ajustes para impresión */
          @media print {
            .container {
              box-shadow: none;
              margin: 0;
              border-radius: 0;
            }
            
            .content {
              padding: 20px;
            }
            
            body {
              background: white;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            ${processedContent}
          </div>
        </div>
      </body>
      </html>
    `;

    // Opciones para el PDF con configuración específica para Chromium en Alpine
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      // Configuración específica para Puppeteer/Chromium en entornos headless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    };

    // Generar PDF con manejo de errores mejorado y timeout
    let pdfBuffer;
    try {
      console.log('🔄 Iniciando generación de PDF con timeout de 30 segundos...');
      
      // Agregar timeout para evitar que la aplicación se cuelgue
      const pdfGenerationPromise = htmlPdf.generatePdf({ content: htmlContent }, options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La generación de PDF tardó más de 30 segundos')), 30000)
      );
      
      pdfBuffer = await Promise.race([pdfGenerationPromise, timeoutPromise]);
      console.log('✅ PDF generado exitosamente');
      
    } catch (pdfError) {
      console.error('❌ Error específico en generación de PDF:', pdfError.message);
      console.error('📋 Stack trace del error PDF:', pdfError.stack);
      
      // Información adicional para debugging
      console.log('🔍 Información del sistema para debugging:');
      console.log('Node.js version:', process.version);
      console.log('Platform:', process.platform);
      console.log('Arch:', process.arch);
      console.log('PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
      console.log('PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:', process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD);
      
      // Intentar con configuración alternativa si falla
      try {
        console.log('🔄 Intentando con configuración alternativa mínima...');
        const fallbackOptions = {
          format: 'A4',
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
          printBackground: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless', '--disable-gpu']
        };
        
        const fallbackPromise = htmlPdf.generatePdf({ content: htmlContent }, fallbackOptions);
        const fallbackTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout en configuración alternativa')), 15000)
        );
        
        pdfBuffer = await Promise.race([fallbackPromise, fallbackTimeout]);
        console.log('✅ PDF generado con configuración alternativa');
        
      } catch (fallbackError) {
        console.error('❌ Error también en configuración alternativa:', fallbackError.message);
        
        // Si todo falla, devolver error específico con sugerencias
        const errorMessage = fallbackError.message.includes('Timeout') 
          ? 'La generación de PDF está tardando demasiado. El servidor puede no tener suficientes recursos.'
          : `Error de Chromium: ${fallbackError.message}`;
          
        throw new Error(`No se pudo generar el PDF: ${errorMessage}`);
      }
    }

    // Crear nombre único para el archivo
    const filename = `dicttr_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'exports', filename);

    // Asegurar que existe el directorio exports con permisos
    const exportsDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      console.log('📁 Creando directorio exports...');
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Verificar permisos del directorio
    try {
      const stats = fs.statSync(exportsDir);
      console.log(`📁 Permisos del directorio exports: ${stats.mode.toString(8)}`);
    } catch (error) {
      console.error('❌ Error verificando permisos del directorio:', error.message);
    }

    // Guardar archivo con verificación
    try {
      console.log(`💾 Guardando PDF en: ${filePath}`);
      fs.writeFileSync(filePath, pdfBuffer);
      
      // Verificar que el archivo se guardó correctamente
      if (fs.existsSync(filePath)) {
        const fileStats = fs.statSync(filePath);
        console.log(`✅ PDF guardado exitosamente. Tamaño: ${fileStats.size} bytes`);
      } else {
        console.error('❌ Error: El archivo PDF no se creó después de writeFileSync');
        throw new Error('No se pudo guardar el archivo PDF en el servidor');
      }
    } catch (writeError) {
      console.error('❌ Error guardando archivo PDF:', writeError.message);
      console.error('📋 Stack trace del error de escritura:', writeError.stack);
      throw new Error(`Error al guardar el PDF: ${writeError.message}`);
    }

    // Devolver URLs para descargar - usar IP de red local para acceso móvil
    const baseUrl = process.env.BASE_URL || 'http://192.168.1.140:3001';
    const pdfUrl = `${baseUrl}/api/exports/${filename}`;
    const downloadUrl = `${baseUrl}/api/transcription/download-pdf/${filename}`;
    
    console.log(`📄 PDF URL generada: ${pdfUrl}`);
    console.log(`📥 Download URL: ${downloadUrl}`);

    res.json({
      success: true,
      data: {
        pdf_url: pdfUrl,           // URL estática para ver/descargar
        download_url: downloadUrl, // URL directa para descarga forzada
        filename: filename,
        message: 'PDF generado correctamente'
      }
    });

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ 
      error: 'Error generando el PDF',
      details: error.message 
    });
  }
});

// POST /api/transcription/test-upload - Endpoint de prueba sin autenticación para upload
router.post('/test-upload', upload.single('audio'), async (req, res) => {
  try {
    console.log('🧪 Endpoint de prueba de upload sin autenticación');
    console.log('📁 File:', req.file ? req.file.originalname : 'none');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo de audio' });
    }

    // For development/testing, create a mock user ID
    const userId = 'local-dev-user-id';
    
    res.json({
      success: true,
      message: 'Upload de prueba exitoso',
      data: {
        filename: req.file.filename,
        original_name: req.file.originalname,
        size: req.file.size,
        userId: userId
      }
    });

  } catch (error) {
    console.error('❌ ERROR en test-upload:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error en test upload',
      message: error.message
    });
  }
});

// POST /api/transcription/test-save - Endpoint de prueba sin autenticación para guardar en Supabase
router.post('/test-save', async (req, res) => {
  try {
    console.log('🧪 Endpoint de prueba de guardado en Supabase');
    
    // Datos de prueba
    const testData = {
      enhanced_text: {
        title: "Transcripción de prueba",
        sections: [
          {
            type: "heading",
            level: 1,
            content: "Título de prueba"
          },
          {
            type: "paragraph",
            content: "Este es un párrafo de prueba para verificar el guardado en Supabase."
          }
        ]
      },
      original_text: "Texto original de prueba",
      subject: "matematicas",
      processed_at: new Date().toISOString()
    };

    // No pasar información de archivo ya que no queremos almacenar datos de audio
    // Usar un UUID de prueba válido
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    console.log('📝 Intentando guardar en Supabase...');
    const saveResult = await transcriptionService.saveTranscriptionToDB(
      testData,
      testUserId,
      null  // No pasar fileInfo
    );
    
    console.log('✅ Guardado exitoso:', saveResult);
    
    res.json({
      success: true,
      message: 'Transcripción guardada correctamente en Supabase',
      data: saveResult
    });

  } catch (error) {
    console.error('❌ ERROR en test-save:', error.message);
    console.error('📋 Stack trace:', error.stack);
    console.error('🔍 Detalles completos:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error guardando en Supabase',
      message: error.message,
      details: error
    });
  }
});

// POST /api/transcription/generate-block - Generar contenido para bloque específico con IA
router.post('/generate-block', async (req, res) => {
  try {
    console.log('🎯 Endpoint /generate-block llamado');
    console.log('📦 Body recibido:', {
      block_type: req.body.block_type,
      user_prompt_length: req.body.user_prompt?.length,
      context_text_length: req.body.context_text?.length,
      subject: req.body.subject
    });
    
    const { block_type, user_prompt, context_text, subject = null } = req.body;

    if (!block_type || !user_prompt || !context_text) {
      console.error('❌ Faltan parámetros requeridos');
      return res.status(400).json({ 
        error: 'Se requieren: block_type, user_prompt y context_text' 
      });
    }

    const validBlockTypes = [
      'heading', 'paragraph', 'list', 'concept_block', 
      'summary_block', 'key_concepts_block'
    ];
    
    if (!validBlockTypes.includes(block_type)) {
      console.error('❌ Tipo de bloque inválido:', block_type);
      return res.status(400).json({ 
        error: `Tipo de bloque inválido. Tipos válidos: ${validBlockTypes.join(', ')}` 
      });
    }

    console.log('🔄 Llamando a generateBlock service...');
    const generatedBlock = await transcriptionService.generateBlock(
      block_type,
      user_prompt,
      context_text,
      subject
    );

    res.json({
      success: true,
      data: generatedBlock
    });

  } catch (error) {
    console.error('Error generando bloque con IA:', error);
    res.status(500).json({ 
      error: 'Error generando el bloque con IA',
      details: error.message 
    });
  }
});

// GET /api/transcription/download-pdf/:filename - Descargar PDF directamente
router.get('/download-pdf/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename || !filename.endsWith('.pdf')) {
      return res.status(400).json({ error: 'Nombre de archivo PDF inválido' });
    }
    
    const filePath = path.join(__dirname, '..', '..', 'exports', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo PDF no encontrado' });
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    
    // Enviar archivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error descargando PDF:', error);
    res.status(500).json({ 
      error: 'Error descargando el PDF',
      details: error.message 
    });
  }
});

module.exports = router;
