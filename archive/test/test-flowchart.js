require('dotenv').config();
const TranscriptionService = require('./src/services/transcriptionService');

async function testFlowchart() {
  console.log('🧪 Probando generación de flujograma...');
  
  try {
    // Texto de ejemplo (contenido mejorado por DeepSeek)
    const enhancedText = `El proceso de fotosíntesis comienza cuando la planta absorbe luz solar a través de los cloroplastos. 
    Esta energía luminosa se convierte en energía química mediante reacciones dependientes de la luz. 
    Luego, en el ciclo de Calvin, se utiliza esta energía para fijar dióxido de carbono y producir glucosa. 
    El proceso finaliza con la producción de oxígeno como subproducto.`;
    
    const result = await TranscriptionService.generateFlowchart(enhancedText, 'ciencias');
    
    console.log('✅ Flujograma generado exitosamente!');
    console.log('📋 Código Mermaid:');
    console.log(result.mermaid_code);
    console.log('\n📝 Contenido completo:');
    console.log(result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFlowchart();