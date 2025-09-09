// Test del flujo completo para verificar que DeepSeek devuelve JSON correctamente
const fs = require('fs').promises;
const { audioToDocV2 } = require('./src/services/audio-to-doc-v2');

async function testFullFlow() {
  console.log('🧪 Probando flujo completo de audio a DocBlocksV2...\n');

  try {
    // Crear un archivo de audio de prueba simulado
    const testAudioPath = './test_audio.wav';
    
    // Verificar que el archivo existe
    try {
      await fs.access(testAudioPath);
      console.log('✅ Archivo de audio de prueba encontrado');
    } catch {
      console.log('⚠️  Archivo de audio de prueba no encontrado, usando transcripción simulada');
      
      // Simular el resultado de Groq para testing
      const simulatedGroqResult = {
        text: "Hoy vamos a estudiar álgebra lineal. Primero, matrices. Segundo, determinantes.",
        segments: [
          {
            text: "Hoy vamos a estudiar álgebra lineal.",
            start: 0,
            end: 4,
            confidence: 0.95
          },
          {
            text: "Primero, matrices.",
            start: 4,
            end: 6,
            confidence: 0.92
          },
          {
            text: "Segundo, determinantes.",
            start: 6,
            end: 8,
            confidence: 0.93
          }
        ]
      };

      // Mock de la función groqVerboseTranscribe para testing
      const { groqVerboseTranscribe } = require('./src/services/groq-verbose');
      const originalGroqTranscribe = groqVerboseTranscribe;
      
      require('./src/services/groq-verbose').groqVerboseTranscribe = async () => simulatedGroqResult;
    }

    // Ejecutar el flujo completo
    console.log('🚀 Ejecutando audioToDocV2...');
    const result = await audioToDocV2({
      filepath: './test_audio.wav',
      meta: {
        curso: 'Matemáticas',
        asignatura: 'Álgebra Lineal',
        idioma: 'es'
      },
      doc_id: 'test_full_flow_001'
    });

    console.log('\n🎉 Flujo completado exitosamente!');
    console.log('Doc ID:', result.doc_id);
    console.log('Número de bloques:', result.blocks.length);
    console.log('Versión:', result.version);
    
    console.log('\n📋 Bloques generados:');
    result.blocks.forEach((block, index) => {
      console.log(`${index + 1}. [${block.type}] ${block.text || block.items?.join(', ')}`);
    });

    console.log('\n🔍 Verificando estructura JSON:');
    console.log('Tiene doc_id:', !!result.doc_id);
    console.log('Tiene meta:', !!result.meta);
    console.log('Tiene blocks array:', Array.isArray(result.blocks));
    console.log('Versión correcta:', result.version === 2);
    
    // Verificar que los bloques tienen la estructura correcta
    const validBlocks = result.blocks.every(block => 
      block.id && block.type && (block.text !== undefined || block.items !== undefined)
    );
    console.log('Bloques válidos:', validBlocks);

    if (validBlocks && result.version === 2) {
      console.log('\n✅ ¡Todo correcto! DeepSeek está devolviendo JSON válido.');
    } else {
      console.log('\n❌ Hay problemas con la estructura devuelta.');
    }

  } catch (error) {
    console.error('❌ Error en el flujo completo:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar test
testFullFlow();
