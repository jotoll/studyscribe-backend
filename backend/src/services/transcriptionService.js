const { deepseek, DEEPSEEK_MODELS } = require('../../config/deepseek');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const Groq = require('groq-sdk');

class TranscriptionService {
  // Transcripción con Groq Whisper API con manejo de límites
  async transcribeAudio(audioFile) {
    try {
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });

      // Verificar tamaño del archivo (límite: 100MB)
      const stats = fs.statSync(audioFile);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      if (fileSizeMB > 100) {
        throw new Error(`Archivo demasiado grande (${fileSizeMB.toFixed(2)}MB). Límite: 100MB`);
      }

      // Crear el stream del archivo
      const audioStream = fs.createReadStream(audioFile);
      
      // Transcribir con Groq Whisper con timeout y reintentos
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Intento ${attempt}/3 de transcripción con Groq`);
          
          const transcription = await Promise.race([
            groq.audio.transcriptions.create({
              file: audioStream,
              model: "whisper-large-v3-turbo",
              language: "es",
              response_format: "verbose_json",
              temperature: 0.0
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout en transcripción (máximo 3 minutos)')), 3 * 60 * 1000)
            )
          ]);

          return {
            text: transcription.text,
            duration: transcription.duration || this.estimateDuration(audioFile),
            confidence: 0.95,
            isSimulated: false,
            segments: transcription.segments || [],
            language: transcription.language || "es",
            file_size: fileSizeMB
          };
          
        } catch (error) {
          lastError = error;
          console.warn(`❌ Intento ${attempt} fallido:`, error.message);
          
          // Recrear el stream para el próximo intento
          audioStream.destroy();
          audioStream = fs.createReadStream(audioFile);
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Backoff exponencial
          }
        }
      }
      
      // Si todos los intentos fallan
      throw new Error(`Todos los intentos de transcripción fallaron: ${lastError.message}`);

    } catch (error) {
      console.warn('Error final con Groq API:', error.message);
      
      // Fallback a transcripción simulada solo para errores de API, no para límites
      if (error.message.includes('demasiado grande') || error.message.includes('Timeout') || error.message.includes('todos los intentos')) {
        throw error; // Propagar errores de límites
      }
      
      return {
        text: "Hoy vamos a estudiar la fotosíntesis. La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química. Este proceso ocurre en los cloroplastos y tiene dos fases principales: la fase luminosa y la fase oscura o ciclo de Calvin.",
        duration: 120,
        confidence: 0.95,
        isSimulated: true
      };
    }
  }

  // Mejorar transcripción con DeepSeek con manejo de textos largos
  async enhanceTranscription(rawText, subject = 'general') {
    try {
      const systemPrompt = this.getSystemPrompt(subject);
      
      // Verificar longitud del texto (límite: ~100,000 caracteres ≈ 25K tokens)
      if (rawText.length > 100000) {
        console.log('📏 Texto demasiado largo, aplicando chunking:', rawText.length, 'caracteres');
        
        // Dividir texto en chunks manejables (~20K caracteres cada uno)
        const chunks = this.splitTextIntoChunks(rawText, 20000);
        console.log('📦 Texto dividido en', chunks.length, 'chunks');
        
        const enhancedChunks = [];
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`🔄 Procesando chunk ${i + 1}/${chunks.length}`);
          
          const response = await deepseek.chat.completions.create({
            model: DEEPSEEK_MODELS.CHAT,
            messages: [
              {
                role: "system",
                content: systemPrompt + "\n\nEstás procesando una parte de un texto más largo. Mejora esta sección manteniendo coherencia."
              },
              {
                role: "user",
                content: `Mejora esta sección de la transcripción (parte ${i + 1}/${chunks.length}):\n\n${chunks[i]}`
              }
            ],
            temperature: 0.3,
            max_tokens: 2000
          });
          
          enhancedChunks.push(response.choices[0].message.content);
          
          // Pequeña pausa entre requests para evitar rate limits
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Combinar chunks mejorados (asumiendo que cada chunk es un objeto JSON)
        const combinedData = {
          title: "Transcripción Mejorada",
          sections: [],
          key_concepts: [],
          summary: ""
        };
        
        for (const chunk of enhancedChunks) {
          try {
            const chunkData = JSON.parse(chunk);
            // Combinar lógicamente los datos de cada chunk
            if (chunkData.sections) combinedData.sections.push(...chunkData.sections);
            if (chunkData.key_concepts) combinedData.key_concepts.push(...chunkData.key_concepts);
            if (chunkData.summary) combinedData.summary += chunkData.summary + "\n\n";
          } catch (error) {
            console.warn('Error parsing chunk JSON:', error.message);
            combinedData.sections.push({
              type: "paragraph",
              content: chunk
            });
          }
        }
        
        return {
          enhanced_text: combinedData,
          original_text: rawText,
          subject: subject,
          processed_at: new Date().toISOString(),
          was_chunked: true,
          chunk_count: chunks.length
        };
      } else {
        // Texto de tamaño normal
        const response = await deepseek.chat.completions.create({
          model: DEEPSEEK_MODELS.CHAT,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: `Mejora esta transcripción de clase:\n\n${rawText}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });

        // Parsear la respuesta JSON de DeepSeek
        let enhancedData;
        try {
          enhancedData = JSON.parse(response.choices[0].message.content);
        } catch (error) {
          console.warn('Error parsing JSON from DeepSeek, using raw content:', error.message);
          enhancedData = { raw_content: response.choices[0].message.content };
        }
        
        return {
          enhanced_text: enhancedData,
          original_text: rawText,
          subject: subject,
          processed_at: new Date().toISOString(),
          was_chunked: false
        };
      }
    } catch (error) {
      throw new Error(`Error mejorando transcripción: ${error.message}`);
    }
  }

  // Generar material de estudio
  async generateStudyMaterial(enhancedText, materialType = 'summary') {
    try {
      const prompt = this.getStudyPrompt(materialType);
      
      const response = await deepseek.chat.completions.create({
        model: DEEPSEEK_MODELS.REASONER,
        messages: [
          {
            role: "system", 
            content: prompt
          },
          {
            role: "user",
            content: enhancedText
          }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      return {
        type: materialType,
        content: response.choices[0].message.content,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error generando material de estudio: ${error.message}`);
    }
  }

  // Prompts especializados por materia
  getSystemPrompt(subject) {
    const basePrompt = `Eres StudyScribe AI, un asistente educativo especializado en mejorar transcripciones de clases universitarias. 

Tu objetivo es:
1. Estructurar el contenido de forma clara y didáctica
2. Corregir errores de transcripción y eliminar muletillas
3. Identificar conceptos clave y añadir definiciones breves
4. Organizar la información en secciones lógicas
5. Mantener un lenguaje académico pero accesible
6. Crear bloques editables para cada elemento importante

IMPORTANTE: Devuelve el contenido en formato JSON estructurado con el siguiente schema:

{
  "title": "Título principal del contenido",
  "sections": [
    {
      "type": "heading",
      "level": 1|2|3,
      "content": "Texto del encabezado"
    },
    {
      "type": "paragraph", 
      "content": "Contenido del párrafo"
    },
    {
      "type": "list",
      "style": "bulleted|numbered",
      "items": ["Item 1", "Item 2", "Item 3"]
    },
    {
      "type": "concept_block",
      "term": "Término del concepto",
      "definition": "Definición detallada",
      "examples": ["Ejemplo 1", "Ejemplo 2"]
    },
    {
      "type": "summary_block",
      "content": "Resumen completo del tema"
    },
    {
      "type": "key_concepts_block",
      "concepts": ["Concepto 1", "Concepto 2", "Concepto 3"]
    }
  ]
}

Reglas:
- Usa "concept_block" para conceptos individuales con definiciones
- Usa "summary_block" para resúmenes generales
- Usa "key_concepts_block" para listas de conceptos clave
- Todos los bloques deben ser editables individualmente
- Organiza el contenido de forma lógica y pedagógica
- Incluye tantos bloques como necesites para cubrir el tema completamente
- Solo devuelve JSON válido, sin texto adicional`;

    const subjectPrompts = {
      medicina: basePrompt + "\n\nEnfócate en terminología médica, procesos fisiológicos y casos clínicos.",
      ingenieria: basePrompt + "\n\nPrioriza fórmulas, procesos técnicos y aplicaciones prácticas.",
      derecho: basePrompt + "\n\nDestaca conceptos legales, jurisprudencia y casos de estudio.",
      ciencias: basePrompt + "\n\nExplica fenómenos científicos, teorías y metodologías experimentales.",
      general: basePrompt
    };

    return subjectPrompts[subject] || subjectPrompts.general;
  }

  // Prompts para diferentes tipos de material de estudio
  getStudyPrompt(materialType) {
    const prompts = {
      summary: "Genera un resumen estructurado con los puntos clave organizados en secciones. Máximo 300 palabras.",
      flashcards: "Crea 5-8 flashcards en formato JSON con 'question' y 'answer'. Enfócate en conceptos clave.",
      concepts: "Identifica y explica los 3-5 conceptos más importantes del texto. Para cada concepto incluye: definición, importancia y ejemplos.",
      quiz: "Crea 5 preguntas de opción múltiple basadas en el contenido. Formato JSON con pregunta, opciones (a,b,c,d) y respuesta correcta.",
      flowchart: "Genera un flujograma en sintaxis Mermaid que represente el proceso o sistema descrito. Usa formato claro con nodos rectangulares para procesos, rombos para decisiones, y flechas para flujo. Incluye solo el código Mermaid sin explicaciones."
    };

    return prompts[materialType] || prompts.summary;
  }

  // Generar flujograma específicamente
  async generateFlowchart(text, subject = 'general') {
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
      
      console.log('🔍 Generando flujograma para:', subject);
      console.log('📝 Texto de entrada:', text.substring(0, 100) + '...');
      
      const response = await deepseek.chat.completions.create({
        model: DEEPSEEK_MODELS.CHAT,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Crea un flujograma Mermaid para este contenido sobre ${subject}:\n\n${text}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      console.log('✅ Respuesta de DeepSeek recibida');
      
      // Extraer solo el código Mermaid (puede venir entre ```mermaid ```)
      let mermaidCode = response.choices[0].message.content || '';
      console.log('📋 Contenido crudo:', mermaidCode.substring(0, 100) + '...');
      
      const mermaidMatch = mermaidCode.match(/```mermaid\s*([\s\S]*?)\s*```/);
      if (mermaidMatch && mermaidMatch[1]) {
        mermaidCode = mermaidMatch[1].trim();
        console.log('🎯 Código Mermaid extraído:', mermaidCode.substring(0, 100) + '...');
      } else {
        // Si no está en formato de código, usar el texto completo
        mermaidCode = mermaidCode.trim();
        console.log('ℹ️  Usando contenido completo como Mermaid:', mermaidCode.substring(0, 100) + '...');
      }

      const result = {
        type: 'flowchart',
        mermaid_code: mermaidCode,
        content: response.choices[0].message.content,
        generated_at: new Date().toISOString()
      };

      console.log('📊 Resultado final:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('❌ Error generando flujograma:', error.message);
      throw new Error(`Error generando flujograma: ${error.message}`);
    }
  }

  // Expandir texto con IA (para editor de bloques)
  async expandText(text, subject = 'general') {
    try {
      const systemPrompt = `Eres StudyScribe AI, un asistente educativo especializado en ampliar y enriquecer contenido académico.

Tu objetivo es:
1. Ampliar el texto proporcionado con información relevante y educativa
2. Añadir ejemplos, explicaciones y contexto adicional
3. Mantener coherencia con el tema y estilo original
4. Organizar el contenido de forma estructurada y didáctica
5. Usar lenguaje académico pero accesible

Formato de salida en Markdown con estructura clara.`;

      const subjectPrompts = {
        medicina: systemPrompt + "\n\nEnfócate en terminología médica, procesos fisiológicos y casos clínicos relevantes.",
        ingenieria: systemPrompt + "\n\nPrioriza aplicaciones prácticas, fórmulas relevantes y ejemplos técnicos.",
        derecho: systemPrompt + "\n\nDestaca conceptos legales, jurisprudencia relevante y casos de estudio.",
        ciencias: systemPrompt + "\n\nExplica fenómenos científicos, teorías relacionadas y metodologías.",
        general: systemPrompt
      };

      const finalPrompt = subjectPrompts[subject] || subjectPrompts.general;

      const response = await deepseek.chat.completions.create({
        model: DEEPSEEK_MODELS.CHAT,
        messages: [
          {
            role: "system",
            content: finalPrompt
          },
          {
            role: "user",
            content: `Amplía y enriquece este contenido sobre ${subject}:\n\n${text}`
          }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      return {
        expanded_text: response.choices[0].message.content,
        original_text: text,
        subject: subject,
        processed_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error expandiendo texto: ${error.message}`);
    }
  }

  // Estimar duración del archivo de audio
  estimateDuration(audioFile) {
    try {
      const stats = fs.statSync(audioFile);
      // Estimación aproximada: 1MB ≈ 1 minuto de audio
      return Math.round(stats.size / (1024 * 1024));
    } catch {
      return 120;
    }
  }

  // Dividir texto en chunks para procesamiento de textos largos
  splitTextIntoChunks(text, maxChunkSize = 20000) {
    const chunks = [];
    let currentChunk = '';
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Parsear texto mejorado a bloques estructurados (h1, h2, párrafos, listas)
  parseTextToBlocks(text) {
    const blocks = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let blockId = 1;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detectar encabezados
      if (trimmedLine.match(/^#{1,3}\s+.+$/)) {
        const level = trimmedLine.match(/^#{1,3}/)[0].length;
        const textContent = trimmedLine.replace(/^#{1,3}\s+/, '');
        
        blocks.push({
          id: `block_${blockId++}`,
          type: `h${level}`,
          text: textContent,
          tags: ['heading']
        });
      
      // Detectar listas
      } else if (trimmedLine.match(/^[-•*]\s/)) {
        blocks.push({
          id: `block_${blockId++}`,
          type: 'bulleted_list',
          items: [trimmedLine.replace(/^[-•*]\s/, '')],
          tags: ['list']
        });
      
      } else if (trimmedLine.match(/^\d+\.\s/)) {
        blocks.push({
          id: `block_${blockId++}`,
          type: 'numbered_list',
          items: [trimmedLine.replace(/^\d+\.\s/, '')],
          tags: ['list']
        });
      
      // Párrafos normales
      } else {
        blocks.push({
          id: `block_${blockId++}`,
          type: 'paragraph',
          text: trimmedLine,
          tags: []
        });
      }
    }
    
    return blocks;
  }

  // Convertir JSON estructurado a bloques para compatibilidad
  jsonToBlocks(jsonData) {
    const blocks = [];
    let blockId = 1;

    // Añadir título principal
    if (jsonData.title) {
      blocks.push({
        id: `block_${blockId++}`,
        type: 'h1',
        text: jsonData.title,
        tags: ['heading', 'title']
      });
    }

    // Procesar secciones
    if (jsonData.sections && Array.isArray(jsonData.sections)) {
      for (const section of jsonData.sections) {
        switch (section.type) {
          case 'heading':
            blocks.push({
              id: `block_${blockId++}`,
              type: `h${section.level || 2}`,
              text: section.content,
              tags: ['heading']
            });
            break;
          
          case 'paragraph':
            blocks.push({
              id: `block_${blockId++}`,
              type: 'paragraph',
              text: section.content,
              tags: []
            });
            break;
          
          case 'list':
            blocks.push({
              id: `block_${blockId++}`,
              type: section.style === 'numbered' ? 'numbered_list' : 'bulleted_list',
              items: section.items || [],
              tags: ['list']
            });
            break;
          
          case 'concept_block':
            blocks.push({
              id: `block_${blockId++}`,
              type: 'concept_block',
              term: section.term || '',
              definition: section.definition || '',
              examples: section.examples || [],
              tags: ['concept', 'editable']
            });
            break;
          
          case 'summary_block':
            blocks.push({
              id: `block_${blockId++}`,
              type: 'summary_block',
              content: section.content || '',
              tags: ['summary', 'editable']
            });
            break;
          
          case 'key_concepts_block':
            blocks.push({
              id: `block_${blockId++}`,
              type: 'key_concepts_block',
              concepts: section.concepts || [],
              tags: ['key_concepts', 'editable']
            });
            break;
        }
      }
    }

    return blocks;
  }

  // Convertir segments de transcripción a formato DocBlocksV2
  convertToDocBlocksV2(segments, language = 'es') {
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
        speaker: null, // Por defecto, sin diarización
        tags: [],
        text: segment.text.trim()
      };

      // Detectar si es un encabezado (basado en contenido)
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
}

module.exports = new TranscriptionService();
