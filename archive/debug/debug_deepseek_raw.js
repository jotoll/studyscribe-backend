// Debug script para ver la respuesta RAW de DeepSeek
const axios = require('axios');
require('dotenv').config({ path: '.env' });

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function testDeepSeekRaw() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY no configurada');
    return;
  }

  console.log('🧪 Probando respuesta RAW de DeepSeek...\n');

  const testPrompt = `TRANSFORMA esta transcripción a JSON DocBlocks v2. Formato EXACTO:

{
  "doc_id": "test_001",
  "meta": { "curso": "Matemáticas", "asignatura": "Álgebra", "idioma": "es" },
  "blocks": [
    {
      "id": "blk_1",
      "type": "h1",
      "text": "Título",
      "items": [],
      "time": { "start": null, "end": null },
      "confidence": null,
      "speaker": null,
      "tags": []
    }
  ],
  "version": 2
}

TRANSCRIPCIÓN: "Hoy vamos a estudiar álgebra lineal. Primero, matrices. Segundo, determinantes."`;

  try {
    const response = await axios.post(DEEPSEEK_API_URL, {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en estructuración de contenidos educativos. Devuelve ÚNICAMENTE JSON válido sin comentarios.'
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });

    console.log('✅ Respuesta recibida de DeepSeek');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    
    const data = response.data;
    console.log('\n📦 Respuesta completa:');
    console.log(JSON.stringify(data, null, 2));
    
    const content = data.choices[0]?.message?.content;
    console.log('\n📝 Contenido recibido:');
    console.log('=== INICIO CONTENIDO ===');
    console.log(content);
    console.log('=== FIN CONTENIDO ===');
    
    console.log('\n🔍 Análisis del contenido:');
    console.log('Tipo:', typeof content);
    console.log('Longitud:', content.length);
    console.log('Contiene ```json:', content.includes('```json'));
    console.log('Contiene {:', content.includes('{'));
    console.log('Contiene }:', content.includes('}'));
    console.log('Contiene markdown #:', content.includes('#'));
    
    // Intentar parsear
    try {
      let jsonContent = content;
      
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = jsonMatch[1].trim();
          console.log('\n✅ JSON extraído de bloque markdown');
        }
      } else if (content.includes('{') && content.includes('}')) {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          jsonContent = content.substring(jsonStart, jsonEnd);
          console.log('\n✅ JSON extraído de texto');
        }
      }
      
      const parsed = JSON.parse(jsonContent);
      console.log('\n🎉 JSON parseado correctamente:');
      console.log(JSON.stringify(parsed, null, 2));
      
    } catch (parseError) {
      console.log('\n❌ Error parsing JSON:', parseError.message);
      console.log('Contenido que falló:', jsonContent);
    }

  } catch (error) {
    console.error('❌ Error en la petición a DeepSeek:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Ejecutar test
testDeepSeekRaw();
