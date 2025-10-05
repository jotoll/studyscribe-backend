import { groqVerboseTranscribe, validateTranscription } from './groq-verbose';
import { deepseekFormatV2, preprocessTextForLists } from './deepseek-structurer';
import { alignBlocksWithSegments } from './align-blocks';
import { DocBlocksV2, DocMeta } from '../types/docblocks-v2';

export async function audioToDocV2(params: {
  filepath: string;
  meta: { curso: string; asignatura: string; idioma?: string };
  doc_id: string;
  glosarioPrompt?: string;
}): Promise<DocBlocksV2> {
  const { filepath, meta, doc_id, glosarioPrompt } = params;

  try {
    console.log('🔊 Iniciando transcripción Groq verbose...');
    
    // 1) STT con tiempos usando Groq Whisper
    const sttResult = await groqVerboseTranscribe(filepath, {
      model: "whisper-large-v3-turbo",
      language: "es",
      prompt: glosarioPrompt,
    });

    const validatedStt = validateTranscription(sttResult);
    console.log(`✅ Transcripción completada. Segmentos: ${validatedStt.segments.length}`);

    // 2) Pre-procesamiento para mejorar detección de listas
    const preprocessedText = preprocessTextForLists(validatedStt.text);

    // 3) Estructuración con DeepSeek
    console.log('🧠 Estructurando con DeepSeek...');
    const structured = await deepseekFormatV2(preprocessedText, {
      ...meta,
      idioma: meta.idioma || 'es'
    });

    console.log(`✅ Estructura completada. Bloques: ${structured.blocks.length}`);

    // 4) Alineación de bloques con segmentos para tiempos y confianza
    console.log('⏱️ Alineando bloques con segmentos...');
    const blocksWithTiming = alignBlocksWithSegments(
      structured.blocks,
      validatedStt.segments
    );

    // 5) Aplicar diarización (placeholder para futuro)
    const finalBlocks = blocksWithTiming.map(block => ({
      ...block,
      speaker: block.speaker ?? null
    }));

    // 6) Estadísticas y validación
    const stats = {
      totalBlocks: finalBlocks.length,
      withTiming: finalBlocks.filter(b => b.time).length,
      withLowConfidence: finalBlocks.filter(b => b.confidence && b.confidence < 0.6).length,
      needsReview: finalBlocks.filter(b => b.tags?.includes('revisar_timing')).length
    };

    console.log('📊 Estadísticas:', stats);

    return {
      doc_id,
      meta: {
        curso: meta.curso,
        asignatura: meta.asignatura,
        idioma: meta.idioma || 'es'
      },
      blocks: finalBlocks,
      version: 2
    };

  } catch (error) {
    console.error('❌ Error en audioToDocV2:', error);
    
    // Fallback: estructura mínima con error
    return {
      doc_id,
      meta: {
        curso: meta.curso,
        asignatura: meta.asignatura,
        idioma: meta.idioma || 'es'
      },
      blocks: [
        {
          id: 'error',
          type: 'h1',
          text: 'Error en procesamiento',
          tags: ['error']
        },
        {
          id: 'error-details',
          type: 'paragraph',
          text: error instanceof Error ? error.message : 'Error desconocido',
          tags: ['error']
        }
      ],
      version: 2
    };
  }
}

// Función para guardar el resultado
export async function saveDocBlocksV2(doc: DocBlocksV2): Promise<void> {
  // Aquí implementarías la lógica de guardado en tu base de datos
  console.log('💾 Guardando documento:', doc.doc_id);
  
  // Ejemplo: guardar en sistema de archivos temporalmente
  const fs = require('fs').promises;
  const filename = `./data/${doc.doc_id}.json`;
  
  await fs.mkdir('./data', { recursive: true });
  await fs.writeFile(filename, JSON.stringify(doc, null, 2));
  
  console.log(`✅ Documento guardado: ${filename}`);
}

// Función para cargar un documento existente
export async function loadDocBlocksV2(doc_id: string): Promise<DocBlocksV2 | null> {
  try {
    const fs = require('fs').promises;
    const filename = `./data/${doc_id}.json`;
    
    const data = await fs.readFile(filename, 'utf-8');
    return JSON.parse(data) as DocBlocksV2;
  } catch {
    return null;
  }
}

// Utilidad para generar IDs de documento
export function generateDocId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}