const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const transcriptionService = require('./src/services/transcriptionService.js');

async function testCompleteEnhancementPipeline() {
  console.log('🧪 Testing complete enhancement pipeline...');
  
  // Test with a sample transcription text
  const sampleTranscription = `
Hoy vamos a estudiar la fotosíntesis. 
La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química. 
Este proceso ocurre en los cloroplastos y tiene dos fases principales: 
1. La fase luminosa donde se captura la energía solar
2. La fase oscura o ciclo de Calvin donde se fija el dióxido de carbono

Los factores que afectan la fotosíntesis son:
- Intensidad lumínica
- Concentración de CO2
- Temperatura
- Disponibilidad de agua

La ecuación general de la fotosíntesis es:
6CO2 + 6H2O + luz → C6H12O6 + 6O2
  `;

  console.log('📋 Sample transcription length:', sampleTranscription.length, 'characters');
  console.log('📝 Sample content (first 300 chars):', sampleTranscription.substring(0, 300) + '...');

  try {
    console.log('\n🚀 Starting enhancement process...');
    
    const enhancedResult = await transcriptionService.enhanceTranscription(sampleTranscription, 'ciencias');
    
    console.log('✅ Enhancement completed successfully!');
    console.log('📊 Result structure:', {
      hasEnhancedText: !!enhancedResult.enhanced_text,
      hasTitle: !!enhancedResult.enhanced_text?.title,
      hasSections: Array.isArray(enhancedResult.enhanced_text?.sections),
      sectionCount: enhancedResult.enhanced_text?.sections?.length || 0,
      wasChunked: enhancedResult.was_chunked,
      subject: enhancedResult.subject
    });
    
    console.log('📋 Enhanced title:', enhancedResult.enhanced_text?.title || 'No title');
    
    if (enhancedResult.enhanced_text?.sections) {
      console.log('\n📄 Enhanced sections:');
      enhancedResult.enhanced_text.sections.forEach((section, index) => {
        console.log(`  ${index + 1}. [${section.type}] ${section.content?.substring(0, 100) || JSON.stringify(section).substring(0, 100)}...`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Enhancement pipeline failed:');
    console.error('📋 Error:', error.message);
    console.error('🔗 Stack:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testCompleteEnhancementPipeline()
    .then(success => {
      if (success) {
        console.log('\n🎉 Enhancement pipeline test PASSED');
        process.exit(0);
      } else {
        console.log('\n❌ Enhancement pipeline test FAILED');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unhandled error in pipeline test:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteEnhancementPipeline };