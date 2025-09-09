require('dotenv').config();
const { audioToDocV2 } = require('./src/services/audio-to-doc-v2');
const fs = require('fs');

async function debugAudioProcessing() {
  console.log('🔍 Debug: Procesamiento completo de audio...\n');

  try {
    const result = await audioToDocV2({
      filepath: 'test_audio.wav',
      meta: {
        curso: 'Algoritmos y Estructuras de Datos',
        asignatura: 'Informática', 
        idioma: 'es'
      },
      doc_id: 'debug_doc_' + Date.now()
    });

    console.log('✅ Resultado del procesamiento:');
    console.log(JSON.stringify(result, null, 2));

    // Verificar si es un error
    if (result.blocks && result.blocks[0] && result.blocks[0].id === 'error') {
      console.log('\n❌ Se detectó estructura de error:');
      console.log('Mensaje de error:', result.blocks[1]?.text);
    } else {
      console.log('\n🎉 Procesamiento exitoso!');
      console.log(`- Total de bloques: ${result.blocks.length}`);
      console.log(`- Tipos: ${[...new Set(result.blocks.map(b => b.type))].join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error en debug:', error);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  debugAudioProcessing();
}
