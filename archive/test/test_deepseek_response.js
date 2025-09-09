// Test para simular diferentes respuestas de Deep Seek

function testDeepSeekResponseParsing() {
  console.log('🧪 Probando parsing de respuestas Deep Seek\n');

  // Caso 1: Respuesta JSON perfecta (lo ideal)
  const perfectResponse = `{
    "doc_id": "test_001",
    "meta": {
      "curso": "Matemáticas",
      "asignatura": "Álgebra",
      "idioma": "es"
    },
    "blocks": [
      {
        "id": "blk_1",
        "type": "h1",
        "text": "Título principal",
        "items": [],
        "time": { "start": null, "end": null },
        "confidence": null,
        "speaker": null,
        "tags": []
      }
    ],
    "version": 2
  }`;

  // Caso 2: Deep Seek devuelve JSON dentro de markdown
  const markdownResponse = `Aquí está tu JSON:
\`\`\`json
${perfectResponse}
\`\`\`
¿Necesitas algo más?`;

  // Caso 3: Deep Seek devuelve texto con JSON al final
  const textWithJsonResponse = `He procesado tu transcripción. El resultado en formato DocBlocks v2 es:
${perfectResponse}
Espero que te sea útil.`;

  // Función de parsing (simplificada)
  function parseDeepSeekResponse(content) {
    let jsonContent = content;
    
    if (content.includes('```json')) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1].trim();
        console.log('✅ Extraído JSON de bloque markdown');
      }
    } else if (content.includes('{') && content.includes('}')) {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonContent = content.substring(jsonStart, jsonEnd);
        console.log('✅ Extraído JSON de texto');
      }
    }

    try {
      const result = JSON.parse(jsonContent);
      console.log('✅ JSON parseado correctamente');
      return result;
    } catch (error) {
      console.log('❌ Error parsing JSON:', error.message);
      return null;
    }
  }

  // Probar los casos
  console.log('1. Respuesta JSON perfecta:');
  const result1 = parseDeepSeekResponse(perfectResponse);
  console.log('Doc ID:', result1?.doc_id);
  console.log('Bloques:', result1?.blocks?.length);
  console.log('');

  console.log('2. Respuesta con markdown:');
  const result2 = parseDeepSeekResponse(markdownResponse);
  console.log('Doc ID:', result2?.doc_id);
  console.log('Bloques:', result2?.blocks?.length);
  console.log('');

  console.log('3. Respuesta con texto y JSON:');
  const result3 = parseDeepSeekResponse(textWithJsonResponse);
  console.log('Doc ID:', result3?.doc_id);
  console.log('Bloques:', result3?.blocks?.length);
}

testDeepSeekResponseParsing();