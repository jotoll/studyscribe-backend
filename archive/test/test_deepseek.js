const { deepseekFormatV2 } = require('./src/services/deepseek-structurer.js');

const testTranscription = `
#Prueba de funcionamiento del sistema Json 
##Objetivo de la Prueba 
Verificar el correcto funcionamiento del sistema JSON para la generacion de contenido estructura. 
##Elementos a evaluar 
-Generación de listas (numeradas y con viñetas) 
-Creación de títulos y subtitulos (H1, H2, H3, etc) 
-Formato de parrafos 
-implementación de todos los elementos vistos anteriormen
`;

const meta = {
  curso: 'Desarrollo Software',
  asignatura: 'Formatos JSON', 
  idioma: 'es'
};

console.log('Transcripción de prueba:');
console.log(testTranscription);
console.log('\n--- RESULTADO ESPERADO ---\n');

// Resultado que debería generar Deep Seek con el nuevo prompt
const expectedResult = {
  doc_id: 'test_001',
  meta: meta,
  blocks: [
    { 
      id: 'blk_1', 
      type: 'h1', 
      text: 'Prueba de funcionamiento del sistema Json', 
      items: [], 
      time: { start: null, end: null }, 
      confidence: null, 
      speaker: null, 
      tags: [] 
    },
    { 
      id: 'blk_2', 
      type: 'h2', 
      text: 'Objetivo de la Prueba', 
      items: [], 
      time: { start: null, end: null }, 
      confidence: null, 
      speaker: null, 
      tags: [] 
    },
    { 
      id: 'blk_3', 
      type: 'paragraph', 
      text: 'Verificar el correcto funcionamiento del sistema JSON para la generación de contenido estructurado.', 
      items: [], 
      time: { start: null, end: null }, 
      confidence: null, 
      speaker: null, 
      tags: [] 
    },
    { 
      id: 'blk_4', 
      type: 'h2', 
      text: 'Elementos a evaluar', 
      items: [], 
      time: { start: null, end: null }, 
      confidence: null, 
      speaker: null, 
      tags: [] 
    },
    { 
      id: 'blk_5', 
      type: 'bulleted_list', 
      text: '', 
      items: [
        'Generación de listas (numeradas y con viñetas)',
        'Creación de títulos y subtítulos (H1, H2, H3, etc)',
        'Formato de párrafos', 
        'Implementación de todos los elementos vistos anteriormente'
      ], 
      time: { start: null, end: null }, 
      confidence: null, 
      speaker: null, 
      tags: [] 
    }
  ],
  version: 2
};

console.log(JSON.stringify(expectedResult, null, 2));
console.log('\n--- PROMPT OPTIMIZADO ---\n');

// Mostrar cómo queda el prompt optimizado
const { preprocessTextForLists } = require('./src/services/deepseek-structurer.js');
const processedText = preprocessTextForLists(testTranscription.slice(0, 12000));

console.log('Texto preprocesado para listas:');
console.log(processedText);