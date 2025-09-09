require('dotenv').config();
const { groqVerboseTranscribe, validateTranscription } = require('./src/services/groq-verbose');
const { deepseekFormatV2 } = require('./src/services/deepseek-structurer');
const { alignBlocksWithSegments } = require('./src/services/align-blocks');
const fs = require('fs');

async function debugFullFlow() {
  console.log('🐛 Debug: Flujo completo desde audio hasta resultado final...\n');

  try {
    // 1) STT con Groq
    console.log('🔊 Paso 1: Transcripción Groq...');
    const sttResult = await groqVerboseTranscribe('test_audio.wav', {
      model: "whisper-large-v3-turbo",
      language: "es"
    });

    const validatedStt = validateTranscription(sttResult);
    console.log('✅ Transcripción completada. Segmentos:', validatedStt.segments.length);
    console.log('Texto transcrito:', validatedStt.text.substring(0, 100) + '...');

    // 2) DeepSeek
    console.log('\n🧠 Paso 2: Estructuración DeepSeek...');
    const meta = {
      curso: 'Algoritmos y Estructuras de Datos',
      asignatura: 'Informática',
      idioma: 'es'
    };
    const doc_id = 'debug_doc_' + Date.now();

    const structured = await deepseekFormatV2(validatedStt.text, meta, doc_id);
    console.log('✅ DeepSeek completado. Bloques:', structured.blocks.length);
    
    // Debug detallado de bloques
    structured.blocks.forEach((block, index) => {
      console.log(`\n📦 Bloque ${index + 1}:`);
      console.log('  - id:', block.id);
      console.log('  - type:', block.type);
      console.log('  - has text:', !!block.text);
      console.log('  - has items:', !!block.items);
      console.log('  - items type:', Array.isArray(block.items) ? 'array' : typeof block.items);
      console.log('  - text value:', block.text ? block.text.substring(0, 50) + '...' : 'null');
      console.log('  - items value:', block.items);
    });

    // 3) Alineación
    console.log('\n⏱️ Paso 3: Alineación de bloques...');
    console.log('Bloques a alinear:', JSON.stringify(structured.blocks, null, 2));
    console.log('Segmentos disponibles:', validatedStt.segments.length);
    
    const blocksWithTiming = alignBlocksWithSegments(
      structured.blocks,
      validatedStt.segments
    );

    console.log('✅ Alineación completada. Resultado final:');
    console.log(JSON.stringify(blocksWithTiming, null, 2));

  } catch (error) {
    console.error('❌ Error en debug completo:', error);
    console.error('Stack:', error.stack);
    
    // Debug adicional del error
    if (error.message.includes('join')) {
      console.log('\n🔍 Debug adicional - Probable problema con items:');
      console.log('El error sugiere que block.items es undefined al intentar hacer .join()');
    }
  }
}

if (require.main === module) {
  debugFullFlow();
}

module.exports = { debugFullFlow };
