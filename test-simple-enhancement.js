// Test the enhancement using the same import pattern as transcriptionService
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { deepseek, DEEPSEEK_MODELS } = require('./config/deepseek.js');

async function testSimpleEnhancement() {
  console.log('🧪 Testing simple enhancement...');
  
  const sampleText = "Hoy vamos a estudiar la fotosíntesis. La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química.";
  
  try {
    console.log('📋 Sample text length:', sampleText.length, 'characters');
    
    const response = await deepseek.chat([
      {
        role: "system",
        content: `Eres StudyScribe AI, un asistente educativo especializado en mejorar transcripciones de clases universitarias. 

Devuelve el contenido en formato JSON estructurado con el siguiente schema:
{
  "title": "Título principal del contenido",
  "sections": [
    {
      "type": "heading",
      "level": 2,
      "content": "Texto del encabezado"
    },
    {
      "type": "paragraph", 
      "content": "Contenido del párrafo"
    }
  ]
}

Solo devuelve JSON válido, sin texto adicional.`
      },
      {
        role: "user",
        content: `Mejora esta transcripción de clase:\n\n${sampleText}`
      }
    ], DEEPSEEK_MODELS.CHAT);
    
    console.log('✅ Enhancement successful!');
    console.log('📋 Response:', JSON.stringify(response, null, 2));
    
    // Try to parse the JSON
    try {
      const enhancedData = JSON.parse(response.choices[0].message.content);
      console.log('✅ Parsed JSON:', JSON.stringify(enhancedData, null, 2));
    } catch (parseError) {
      console.log('⚠️ Could not parse as JSON, raw content:', response.choices[0].message.content);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Enhancement failed:');
    console.error('📋 Error:', error.message);
    console.error('🔗 Stack:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testSimpleEnhancement()
    .then(success => {
      if (success) {
        console.log('\n🎉 Simple enhancement test PASSED');
        process.exit(0);
      } else {
        console.log('\n❌ Simple enhancement test FAILED');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unhandled error:', error);
      process.exit(1);
    });
}