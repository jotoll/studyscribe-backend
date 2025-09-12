const { deepseek, DEEPSEEK_MODELS } = require('./config/deepseek.js');

async function testDeepSeekAPI() {
  console.log('🧪 Testing DeepSeek API configuration...');
  
  // Test 1: Basic API call
  try {
    console.log('\n📋 Test 1: Basic chat completion');
    const response = await deepseek.chat([
      {
        role: "system",
        content: "Eres un asistente útil que responde en español."
      },
      {
        role: "user", 
        content: "Hola, ¿puedes confirmar que la API está funcionando? Responde con 'API funcionando correctamente'"
      }
    ], DEEPSEEK_MODELS.CHAT);
    
    console.log('✅ API Response:', JSON.stringify(response, null, 2));
    
    if (response.choices && response.choices[0] && response.choices[0].message) {
      console.log('📝 Content:', response.choices[0].message.content);
    } else {
      console.log('❌ Unexpected response structure');
    }
    
  } catch (error) {
    console.error('❌ Error in Test 1:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }

  // Test 2: Enhancement-style prompt (similar to transcription service)
  try {
    console.log('\n📋 Test 2: Enhancement-style prompt');
    
    const sampleText = "Hoy vamos a estudiar la fotosíntesis. La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química.";
    
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
    
    console.log('✅ Enhancement Response:', JSON.stringify(response, null, 2));
    
    // Try to parse the JSON response
    try {
      let enhancedData;
      const rawContent = response.choices[0].message.content;
      
      // Check for code blocks
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        enhancedData = JSON.parse(jsonMatch[1].trim());
      } else {
        enhancedData = JSON.parse(rawContent);
      }
      
      console.log('✅ Parsed JSON:', JSON.stringify(enhancedData, null, 2));
      
    } catch (parseError) {
      console.log('⚠️ Could not parse as JSON, raw content:', response.choices[0].message.content);
    }
    
  } catch (error) {
    console.error('❌ Error in Test 2:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }

  // Test 3: Error handling
  try {
    console.log('\n📋 Test 3: Error handling (invalid API key)');
    
    // Temporarily remove API key to test error handling
    const originalKey = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = 'invalid-key';
    
    try {
      await deepseek.chat([{ role: "user", content: "Test" }], DEEPSEEK_MODELS.CHAT);
      console.log('❌ Expected error but got success');
    } catch (error) {
      console.log('✅ Correctly caught error:', error.message);
    } finally {
      // Restore original key
      process.env.DEEPSEEK_API_KEY = originalKey;
    }
    
  } catch (error) {
    console.error('❌ Error in Test 3:', error.message);
  }

  console.log('\n🎉 All DeepSeek API tests completed');
  return true;
}

// Run the test
if (require.main === module) {
  testDeepSeekAPI()
    .then(success => {
      if (success) {
        console.log('\n✅ DeepSeek API test PASSED');
        process.exit(0);
      } else {
        console.log('\n❌ DeepSeek API test FAILED');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unhandled error in test:', error);
      process.exit(1);
    });
}

module.exports = { testDeepSeekAPI };