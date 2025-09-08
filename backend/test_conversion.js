const transcriptionService = require('./src/services/transcriptionService');

// Test the conversion function with sample segments
const testSegments = [
  {
    id: 1,
    start: 0.0,
    end: 2.5,
    text: "Buenos días a todos. Hoy hablaremos sobre fotosíntesis.",
    confidence: 0.95
  },
  {
    id: 2,
    start: 2.5,
    end: 5.0,
    text: "La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía.",
    confidence: 0.92
  },
  {
    id: 3,
    start: 5.0,
    end: 7.5,
    text: "# Introducción a la fotosíntesis",
    confidence: 0.98
  },
  {
    id: 4,
    start: 7.5,
    end: 10.0,
    text: "- Clorofila: pigmento verde",
    confidence: 0.90
  },
  {
    id: 5,
    start: 10.0,
    end: 12.5,
    text: "- Dióxido de carbono: materia prima",
    confidence: 0.91
  }
];

console.log('🧪 Testing conversion function...');
const result = transcriptionService.convertToDocBlocksV2(testSegments, 'es');
console.log('✅ Conversion result:', JSON.stringify(result, null, 2));