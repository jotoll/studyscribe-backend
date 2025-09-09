const { deepseek, DEEPSEEK_MODELS } = require('./config/deepseek');

async function testFlowchart() {
  console.log('🧪 Probando generación de flujograma...');
  
  try {
    const systemPrompt = `Eres un experto en crear flujogramas educativos. 
      
Genera un flujograma en sintaxis Mermaid para representar visualmente el proceso descrito. 

Reglas:
- Usa graph TD para diagramas de flujo
- Nodos rectangulares [proceso] para acciones
- Rombos {decisión} para puntos de elección
- Flechas --> para conectar elementos
- Mantén el diseño limpio y educativo
- Incluye solo el código Mermaid, sin explicaciones

Ejemplo:
\`\`\`mermaid
graph TD
  A[Inicio] --> B[Proceso 1]
  B --> C{Decisión}
  C -->|Sí| D[Resultado 1]
  C -->|No| E[Resultado 2]
\`\`\``;

    const enhancedText = `El proceso de fotosíntesis comienza cuando la planta absorbe luz solar a través de los cloroplastos. 
    Esta energía luminosa se convierte en energía química mediante reacciones dependientes de la luz. 
    Luego, en el ciclo de Calvin, se utiliza esta energía para fijar dióxido de carbono y producir glucosa. 
    El proceso finaliza con la producción de oxígeno como subproducto.`;

    console.log('📤 Enviando solicitud a DeepSeek...');
    
    const response = await deepseek.chat({
      model: DEEPSEEK_MODELS.CHAT,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Crea un flujograma Mermaid para este contenido sobre ciencias:\n\n${enhancedText}`
        }
      ],
      temperature: 0.2,
      maxTokens: 1000
    });

    console.log('✅ Respuesta recibida:');
    console.log('Tipo:', typeof response);
    console.log('Contenido:', response);
    console.log('Texto:', response.text);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFlowchart();