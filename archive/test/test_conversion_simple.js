// Test the conversion function logic directly
function convertToDocBlocksV2(segments, language = 'es') {
  const blocks = [];
  let blockId = 1;

  for (const segment of segments) {
    const block = {
      id: `block_${blockId++}`,
      type: 'paragraph',
      time: {
        start: Math.round(segment.start),
        end: Math.round(segment.end)
      },
      confidence: segment.confidence || 0.8,
      speaker: null,
      tags: [],
      text: segment.text.trim()
    };

    // Detectar si es un encabezado
    if (segment.text.match(/^#\s+|^##\s+|^###\s+|^[A-ZÁÉÍÓÚÑ\s]{10,}:$/)) {
      if (segment.text.match(/^#\s+/)) {
        block.type = 'h1';
        block.text = segment.text.replace(/^#\s+/, '');
      } else if (segment.text.match(/^##\s+/)) {
        block.type = 'h2';
        block.text = segment.text.replace(/^##\s+/, '');
      } else if (segment.text.match(/^###\s+/)) {
        block.type = 'h3';
        block.text = segment.text.replace(/^###\s+/, '');
      } else if (segment.text.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}:$/)) {
        block.type = 'h2';
      }
    }

    // Detectar si es una lista
    if (segment.text.match(/^[-•*]\s/)) {
      block.type = 'bulleted_list';
      block.items = [segment.text.replace(/^[-•*]\s/, '')];
      delete block.text;
    } else if (segment.text.match(/^\d+\.\s/)) {
      block.type = 'numbered_list';
      block.items = [segment.text.replace(/^\d+\.\s/, '')];
      delete block.text;
    }

    blocks.push(block);
  }

  return {
    doc_id: `doc_${Date.now()}`,
    meta: {
      curso: 'general',
      asignatura: 'transcripción',
      idioma: language
    },
    blocks: blocks,
    version: 2
  };
}

// Test data
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
const result = convertToDocBlocksV2(testSegments, 'es');
console.log('✅ Conversion result:', JSON.stringify(result, null, 2));