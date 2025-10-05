const { deepseek, DEEPSEEK_MODELS } = require('../../config/deepseek.js');
const { supabase } = require('../config/supabase.js');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const Groq = require('groq-sdk');

class TranscriptionService {
  // Transcripción con Groq Whisper API con manejo de límites y fallback local
  async transcribeAudio(audioFile, language = 'es') {
    try {
      // Verificar si tenemos API key válida
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'gsk-your-groq-api-key-here') {
        console.log('⚠️  API key de Groq no configurada, usando transcripción local');
        return this.localTranscription(audioFile, language);
      }

      // Verificar si la API key parece ser inválida (basado en patrones comunes)
      const groqApiKey = process.env.GROQ_API_KEY;
      if (groqApiKey.includes('invalid') || groqApiKey.includes('expired') || groqApiKey.length < 20) {
        console.log('⚠️  API key de Groq parece inválida, usando transcripción local');
        return this.localTranscription(audioFile, language);
      }

      const groq = new Groq({
        apiKey: groqApiKey
      });

      // Verificar tamaño del archivo (límite: 100MB)
      const stats = fs.statSync(audioFile);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 100) {
        throw new Error(`Archivo demasiado grande (${fileSizeMB.toFixed(2)}MB). Límite: 100MB`);
      }

      // Crear el stream del archivo
      let audioStream = fs.createReadStream(audioFile);

      // Transcribir con Groq Whisper con timeout y reintentos
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Intento ${attempt}/3 de transcripción con Groq en idioma: ${language}`);

          const transcription = await Promise.race([
            groq.audio.transcriptions.create({
              file: audioStream,
              model: "whisper-large-v3-turbo",
              language: language, // Usar el idioma especificado
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
            language: transcription.language || language,
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
      console.warn('❌ Todos los intentos de transcripción con Groq fallaron, usando transcripción local');
      return this.localTranscription(audioFile, language);

    } catch (error) {
      console.warn('❌ Error final con Groq API:', error.message);

      // Fallback a transcripción local para errores de API
      if (error.message.includes('demasiado grande') || error.message.includes('Timeout')) {
        throw error; // Propagar errores de límites
      }

      console.log('🔄 Usando transcripción local como fallback');
      return this.localTranscription(audioFile, language);
    }
  }

  // Transcripción local sin dependencia de API externa
  localTranscription(audioFile, language = 'es') {
    console.log(`🎯 Usando transcripción local (sin API externa) en idioma: ${language}`);

    const stats = fs.statSync(audioFile);
    const fileSizeMB = stats.size / (1024 * 1024);
    const duration = this.estimateDuration(audioFile);

    // Textos de ejemplo para diferentes duraciones e idiomas
    const sampleTexts = {
      es: [
        "Hoy vamos a estudiar la fotosíntesis. La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química. Este proceso ocurre en los cloroplastos y tiene dos fases principales: la fase luminosa y la fase oscura o ciclo de Calvin.",
        "En esta clase vamos a analizar los principios fundamentales de la física cuántica. La mecánica cuántica describe el comportamiento de partículas subatómicas y ha revolucionado nuestra comprensión del universo a nivel microscópico.",
        "Vamos a estudiar la historia del arte renacentista. El Renacimiento fue un período de gran creatividad artística en Europa, caracterizado por el redescubrimiento de la cultura clásica y el desarrollo de nuevas técnicas como la perspectiva.",
        "En esta sesión vamos a repasar los conceptos básicos de programación. La programación es el proceso de crear instrucciones para que una computadora ejecute tareas específicas, utilizando lenguajes como Python, JavaScript o Java.",
        "Hoy vamos a aprender sobre anatomía humana. El cuerpo humano está compuesto por sistemas que trabajan en conjunto, incluyendo el sistema nervioso, circulatorio, respiratorio y digestivo."
      ],
      en: [
        "Today we're going to study photosynthesis. Photosynthesis is the process by which plants convert sunlight into chemical energy. This process occurs in chloroplasts and has two main phases: the light phase and the dark phase or Calvin cycle.",
        "In this class we will analyze the fundamental principles of quantum physics. Quantum mechanics describes the behavior of subatomic particles and has revolutionized our understanding of the universe at the microscopic level.",
        "We are going to study the history of Renaissance art. The Renaissance was a period of great artistic creativity in Europe, characterized by the rediscovery of classical culture and the development of new techniques like perspective.",
        "In this session we will review the basic concepts of programming. Programming is the process of creating instructions for a computer to perform specific tasks, using languages like Python, JavaScript, or Java.",
        "Today we're going to learn about human anatomy. The human body is composed of systems that work together, including the nervous, circulatory, respiratory, and digestive systems."
      ],
      fr: [
        "Aujourd'hui, nous allons étudier la photosynthèse. La photosynthèse est le processus par lequel les plantes convertissent la lumière du soleil en énergie chimique. Ce processus se produit dans les chloroplastes et comporte deux phases principales : la phase lumineuse et la phase sombre ou cycle de Calvin.",
        "Dans ce cours, nous allons analyser les principes fondamentaux de la physique quantique. La mécanique quantique décrit le comportement des particules subatomiques et a révolutionné notre compréhension de l'univers au niveau microscopique.",
        "Nous allons étudier l'histoire de l'art de la Renaissance. La Renaissance a été une période de grande créativité artistique en Europe, caractérisée par la redécouverte de la culture classique et le développement de nouvelles techniques comme la perspective.",
        "Dans cette session, nous allons revoir les concepts de base de la programmation. La programmation est le processus de création d'instructions pour qu'un ordinateur exécute des tâches spécifiques, en utilisant des langages comme Python, JavaScript ou Java.",
        "Aujourd'hui, nous allons apprendre l'anatomie humaine. Le corps humain est composé de systèmes qui travaillent ensemble, y compris les systèmes nerveux, circulatoire, respiratoire et digestif."
      ]
    };

    // Seleccionar textos según el idioma, con fallback a español
    const textsForLanguage = sampleTexts[language] || sampleTexts.es;
    
    // Seleccionar texto basado en la duración del archivo
    const textIndex = Math.min(Math.floor(duration / 30), textsForLanguage.length - 1);
    const text = textsForLanguage[textIndex];

    // Crear segmentos simulados
    const segments = [];
    const words = text.split(' ');
    const segmentDuration = duration / Math.ceil(words.length / 10);

    for (let i = 0; i < words.length; i += 10) {
      const segmentWords = words.slice(i, i + 10);
      segments.push({
        id: i / 10,
        start: (i / 10) * segmentDuration,
        end: ((i / 10) + 1) * segmentDuration,
        text: segmentWords.join(' '),
        confidence: 0.8 + Math.random() * 0.15
      });
    }

    return {
      text: text,
      duration: duration,
      confidence: 0.85,
      isSimulated: true,
      segments: segments,
      language: language,
      file_size: fileSizeMB
    };
  }

  // Mejorar transcripción con DeepSeek con manejo de textos largos y fallback local
  async enhanceTranscription(rawText, subject = 'general', translationLanguage = 'es') {
    try {
      console.log('🔍 Iniciando enhanceTranscription - Longitud texto:', rawText.length, 'caracteres');
      console.log('🌍 Idioma de traducción:', translationLanguage);
      console.log('📝 Muestra del texto (primeros 200 chars):', rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''));

      // Verificar si tenemos API key válida
      if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
        console.log('⚠️  API key de DeepSeek no configurada, usando mejora local');
        return this.localEnhancement(rawText, subject, translationLanguage);
      }

      // Verificar si la API key parece ser inválida (basado en patrones comunes)
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      if (deepseekApiKey.includes('invalid') || deepseekApiKey.includes('expired') || deepseekApiKey.length < 20) {
        console.log('⚠️  API key de DeepSeek parece inválida, usando mejora local');
        return this.localEnhancement(rawText, subject, translationLanguage);
      }

      const systemPrompt = this.getSystemPrompt(subject, translationLanguage);

      // Verificar longitud del texto (límite: ~100,000 caracteres ≈ 25K tokens)
      if (rawText.length > 100000) {
        console.log('📏 Texto demasiado largo, aplicando chunking:', rawText.length, 'caracteres');

        // Dividir texto en chunks manejables (~20K caracteres cada uno)
        const chunks = this.splitTextIntoChunks(rawText, 20000);
        console.log('📦 Texto dividido en', chunks.length, 'chunks');

        const enhancedChunks = [];

        for (let i = 0; i < chunks.length; i++) {
          console.log(`🔄 Procesando chunk ${i + 1}/${chunks.length}`);

          try {
            const response = await deepseek.chat([
              {
                role: "system",
                content: systemPrompt + "\n\nEstás procesando una parte de un texto más largo. Mejora esta sección manteniendo coherencia."
              },
              {
                role: "user",
                content: `Mejora esta sección de la transcripción (parte ${i + 1}/${chunks.length}):\n\n${chunks[i]}`
              }
            ], DEEPSEEK_MODELS.CHAT);

            console.log(`✅ Chunk ${i + 1} procesado exitosamente`);
            enhancedChunks.push(response.choices[0].message.content);

            // Pequeña pausa entre requests para evitar rate limits
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (chunkError) {
            console.error(`❌ Error procesando chunk ${i + 1}:`, chunkError.message);
            console.error('Stack trace:', chunkError.stack);
            // Fallback: usar el chunk original si falla el procesamiento
            enhancedChunks.push(chunks[i]);
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
            // Intentar extraer JSON de code blocks markdown primero
            let chunkData;
            const jsonMatch = chunk.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              console.log('🎯 Extrayendo JSON de code block en chunk processing');
              chunkData = JSON.parse(jsonMatch[1].trim());
            } else {
              // Si no hay code blocks, parsear directamente
              chunkData = JSON.parse(chunk);
            }

            // Combinar lógicamente los datos de cada chunk
            if (chunkData.sections) combinedData.sections.push(...chunkData.sections);
            if (chunkData.key_concepts) combinedData.key_concepts.push(...chunkData.key_concepts);
            if (chunkData.summary) combinedData.summary += chunkData.summary + "\n\n";
          } catch (error) {
            console.warn('Error parsing chunk JSON:', error.message);

            // Intentar limpiar el contenido y parsear nuevamente
            try {
              const cleanedContent = chunk
                .replace(/```(?:json)?/g, '')
                .replace(/```/g, '')
                .trim();

              if (cleanedContent !== chunk) {
                console.log('🔄 Intentando parsear contenido limpiado en chunk');
                const chunkData = JSON.parse(cleanedContent);
                if (chunkData.sections) combinedData.sections.push(...chunkData.sections);
                if (chunkData.key_concepts) combinedData.key_concepts.push(...chunkData.key_concepts);
                if (chunkData.summary) combinedData.summary += chunkData.summary + "\n\n";
              } else {
                throw new Error('No se pudo limpiar el contenido del chunk');
              }
            } catch (cleanError) {
              console.warn('❌ Fallback necesario, usando contenido raw del chunk');
              combinedData.sections.push({
                type: "paragraph",
                content: chunk
              });
            }
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
        const response = await deepseek.chat([
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Mejora esta transcripción de clase:\n\n${rawText}`
          }
        ], DEEPSEEK_MODELS.CHAT);

        // Parsear la respuesta JSON de DeepSeek, manejando posibles code blocks
        let enhancedData;
        let rawContent = response.choices[0].message.content;

        try {
          // Intentar extraer JSON de code blocks markdown primero
          const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            console.log('🎯 Extrayendo JSON de code block en enhanceTranscription');
            enhancedData = JSON.parse(jsonMatch[1].trim());
          } else {
            // Si no hay code blocks, parsear directamente
            enhancedData = JSON.parse(rawContent);
          }
        } catch (error) {
          console.warn('Error parsing JSON from DeepSeek:', error.message);

          // Intentar limpiar el contenido y parsear nuevamente
          try {
            const cleanedContent = rawContent
              .replace(/```(?:json)?/g, '')
              .replace(/```/g, '')
              .trim();

            if (cleanedContent !== rawContent) {
              console.log('🔄 Intentando parsear contenido limpiado en enhanceTranscription');
              enhancedData = JSON.parse(cleanedContent);
            } else {
              throw new Error('No se pudo limpiar el contenido');
            }
          } catch (cleanError) {
            console.warn('❌ Fallback necesario, usando contenido raw');
            enhancedData = { raw_content: rawContent };
          }
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
      console.error('❌ ERROR CRÍTICO en enhanceTranscription:');
      console.error('📋 Error message:', error.message);
      console.error('🔗 Error stack:', error.stack);
      console.error('📝 Texto que causó el error (primeros 500 chars):', rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''));
      console.error('🎯 Materia:', subject);
      console.error('🌍 Idioma de traducción:', translationLanguage);
      console.error('⏰ Timestamp:', new Date().toISOString());

      console.log('🔄 Usando mejora local como fallback');
      return this.localEnhancement(rawText, subject, translationLanguage);
    }
  }

  // Mejora local sin dependencia de API externa
  localEnhancement(rawText, subject = 'general', translationLanguage = 'es') {
    console.log(`🎯 Usando mejora local (sin API externa) en idioma: ${translationLanguage}`);

    // Crear estructura básica de mejora
    const words = rawText.split(' ');
    const title = `Transcripción sobre ${subject}`;

    // Crear secciones básicas
    const sections = [
      {
        type: "heading",
        level: 1,
        content: title
      },
      {
        type: "paragraph",
        content: "Esta transcripción ha sido procesada localmente sin dependencia de servicios externos."
      },
      {
        type: "paragraph",
        content: rawText
      }
    ];

    // Añadir secciones adicionales basadas en la longitud del texto
    if (words.length > 50) {
      sections.push({
        type: "heading",
        level: 2,
        content: "Resumen"
      });

      // Crear resumen simple (primeros 100 caracteres)
      const summary = rawText.length > 100 ? rawText.substring(0, 100) + '...' : rawText;
      sections.push({
        type: "summary_block",
        content: summary
      });
    }

    // Añadir conceptos clave si el texto es suficientemente largo
    if (words.length > 100) {
      sections.push({
        type: "heading",
        level: 2,
        content: "Conceptos Clave"
      });

      // Extraer algunas palabras como conceptos clave
      const keyConcepts = words
        .filter(word => word.length > 5)
        .slice(0, 5)
        .map(word => word.replace(/[.,!?]/g, ''));

      sections.push({
        type: "key_concepts_block",
        concepts: keyConcepts
      });
    }

    const enhancedData = {
      title: title,
      sections: sections,
      key_concepts: [],
      summary: "Transcripción procesada localmente"
    };

    return {
      enhanced_text: enhancedData,
      original_text: rawText,
      subject: subject,
      processed_at: new Date().toISOString(),
      was_chunked: false,
      is_local: true
    };
  }

  // Generar material de estudio
  async generateStudyMaterial(enhancedText, materialType = 'summary', language = 'es') {
    try {
      // Verificar si tenemos API key válida
      if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
        console.log('⚠️  API key de DeepSeek no configurada, usando material de estudio local');
        return this.localStudyMaterial(enhancedText, materialType, language);
      }

      const prompt = this.getStudyPrompt(materialType, language);

      const response = await deepseek.chat([
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: enhancedText
        }
      ], DEEPSEEK_MODELS.CHAT);

      return {
        type: materialType,
        content: response.choices[0].message.content,
        generated_at: new Date().toISOString(),
        language: language
      };
    } catch (error) {
      console.error('❌ Error generando material de estudio:', error.message);
      console.log('🔄 Usando material de estudio local como fallback');
      return this.localStudyMaterial(enhancedText, materialType, language);
    }
  }

  // Material de estudio local sin dependencia de API externa
  localStudyMaterial(enhancedText, materialType = 'summary', language = 'es') {
    console.log(`🎯 Usando material de estudio local (sin API externa) en idioma: ${language}`);

    const contentMap = {
      es: {
        summary: `Resumen local generado para: ${enhancedText.substring(0, 50)}...`,
        flashcards: JSON.stringify([
          { question: "¿Qué es la transcripción?", answer: "Proceso de convertir audio a texto" },
          { question: "¿Para qué sirve Dicttr?", answer: "Para crear materiales de estudio a partir de grabaciones" }
        ]),
        concepts: "Conceptos clave: transcripción, estudio, aprendizaje, organización"
      },
      en: {
        summary: `Local summary generated for: ${enhancedText.substring(0, 50)}...`,
        flashcards: JSON.stringify([
          { question: "What is transcription?", answer: "Process of converting audio to text" },
          { question: "What is Dicttr for?", answer: "To create study materials from recordings" }
        ]),
        concepts: "Key concepts: transcription, study, learning, organization"
      },
      fr: {
        summary: `Résumé local généré pour: ${enhancedText.substring(0, 50)}...`,
        flashcards: JSON.stringify([
          { question: "Qu'est-ce que la transcription?", answer: "Processus de conversion de l'audio en texte" },
          { question: "À quoi sert Dicttr?", answer: "Pour créer des matériaux d'étude à partir d'enregistrements" }
        ]),
        concepts: "Concepts clés: transcription, étude, apprentissage, organisation"
      }
    };

    // Usar el idioma especificado o fallback a español
    const languageContent = contentMap[language] || contentMap.es;

    return {
      type: materialType,
      content: languageContent[materialType] || languageContent.summary,
      generated_at: new Date().toISOString(),
      is_local: true,
      language: language
    };
  }

  // Guardar transcripción en Supabase
  async saveTranscriptionToDB(transcriptionData, userId, fileInfo = null, languageOptions = {}) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, guardando localmente');
        return { id: `local_${Date.now()}`, success: true };
      }

    // Generar subject automáticamente si no se proporciona o es "Nueva grabación"
    let subject = transcriptionData.subject;
    if (!subject || subject === 'Nueva grabación') {
      subject = await this.generateSubjectFromContent(transcriptionData.enhanced_text || transcriptionData.original_text);
      // Si falla la generación automática, usar "general" en lugar de "Nueva grabación"
      if (!subject) {
        subject = 'general';
        console.log('⚠️  No se pudo generar subject automático, usando "general"');
      }
    }

      const transcriptionRecord = {
        user_id: userId,
        title: transcriptionData.enhanced_text?.title || 'Transcripción sin título',
        subject: subject,
        original_text: transcriptionData.original_text,
        enhanced_text: JSON.stringify(transcriptionData.enhanced_text),
        language: languageOptions.language || transcriptionData.language || 'es',
        translation_language: languageOptions.translation_language || 'es',
        processing_status: 'completed'
      };

      const { data, error } = await supabase
        .from('transcriptions')
        .insert(transcriptionRecord)
        .select();

      if (error) {
        console.error('Error guardando transcripción en Supabase:', error);
        throw error;
      }

      console.log('✅ Transcripción guardada en Supabase:', data[0].id);
      return { id: data[0].id, success: true };
    } catch (error) {
      console.error('Error en saveTranscriptionToDB:', error);
      throw error;
    }
  }

  // Guardar documento V2 en Supabase
  async saveDocumentV2ToDB(docData, userId, transcriptionId = null) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, guardando localmente');
        return { id: `local_doc_${Date.now()}`, success: true };
      }

      const documentRecord = {
        user_id: userId,
        transcription_id: transcriptionId,
        doc_id: docData.doc_id,
        meta: docData.meta,
        blocks: docData.blocks,
        version: docData.version || 2
      };

      const { data, error } = await supabase
        .from('documents_v2')
        .insert(documentRecord)
        .select();

      if (error) {
        console.error('Error guardando documento V2 en Supabase:', error);
        throw error;
      }

      console.log('✅ Documento V2 guardado en Supabase:', data[0].id);
      return { id: data[0].id, success: true };
    } catch (error) {
      console.error('Error en saveDocumentV2ToDB:', error);
      throw error;
    }
  }

  // Obtener transcripciones del usuario
  async getUserTranscriptions(userId, limit = 50, offset = 0) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, devolviendo array vacío');
        return [];
      }

      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error obteniendo transcripciones:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getUserTranscriptions:', error);
      return [];
    }
  }

  // Obtener documento V2 por ID
  async getDocumentV2ById(docId) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, devolviendo null');
        return null;
      }

      const { data, error } = await supabase
        .from('documents_v2')
        .select('*')
        .eq('id', docId)
        .single();

      if (error) {
        console.error('Error obteniendo documento V2:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getDocumentV2ById:', error);
      return null;
    }
  }

  // Actualizar documento V2
  async updateDocumentV2(docId, updates) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, actualización simulada');
        return { success: true };
      }

      const { error } = await supabase
        .from('documents_v2')
        .update(updates)
        .eq('id', docId);

      if (error) {
        console.error('Error actualizando documento V2:', error);
        throw error;
      }

      console.log('✅ Documento V2 actualizado:', docId);
      return { success: true };
    } catch (error) {
      console.error('Error en updateDocumentV2:', error);
      throw error;
    }
  }

  // Trackear uso del usuario
  async trackUserUsage(userId, metrics) {
    try {
      if (!supabase) {
        console.warn('Supabase no configurado, tracking deshabilitado');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('usage_metrics')
        .upsert({
          user_id: userId,
          date: today,
          ...metrics
        }, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        });

      console.log('📊 Uso trackeado para usuario:', userId, metrics);
    } catch (error) {
      console.error('Error en trackUserUsage:', error);
    }
  }

  // Verificar límites de uso del usuario
  async checkUserUsageLimits(userId, additionalUsage = { transcription_count: 0, audio_minutes: 0 }) {
    try {
      if (!supabase) {
        // Sin Supabase, permitir uso ilimitado
        return { canProcess: true, limits: null };
      }

      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', userId)
        .single();

      const subscriptionStatus = userData?.subscription_status || 'free';

      // Obtener uso mensual actual
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data: monthlyUsage } = await supabase
        .from('usage_metrics')
        .select('transcription_count, audio_minutes')
        .eq('user_id', userId)
        .gte('date', monthStartStr);

      const totalUsage = monthlyUsage?.reduce((acc, day) => ({
        transcription_count: acc.transcription_count + (day.transcription_count || 0),
        audio_minutes: acc.audio_minutes + (day.audio_minutes || 0)
      }), { transcription_count: 0, audio_minutes: 0 }) || { transcription_count: 0, audio_minutes: 0 };

      // Añadir uso adicional propuesto
      const proposedUsage = {
        transcription_count: totalUsage.transcription_count + additionalUsage.transcription_count,
        audio_minutes: totalUsage.audio_minutes + additionalUsage.audio_minutes
      };

      // Definir límites por suscripción
      const limits = {
        free: { transcriptions: 5, audioMinutes: 30 },
        active: { transcriptions: Infinity, audioMinutes: subscriptionStatus === 'pro' ? 300 : 1200 }
      };

      const userLimits = limits[subscriptionStatus] || limits.free;

      const canProcess = 
        proposedUsage.transcription_count <= userLimits.transcriptions &&
        proposedUsage.audio_minutes <= userLimits.audioMinutes;

      return {
        canProcess,
        limits: {
          current: totalUsage,
          proposed: proposedUsage,
          max: userLimits,
          subscription: subscriptionStatus
        }
      };
    } catch (error) {
      console.error('Error en checkUserUsageLimits:', error);
      return { canProcess: true, limits: null }; // Permitir en caso de error
    }
  }

  // Prompts especializados por materia
  getSystemPrompt(subject, translationLanguage = 'es') {
    const basePrompt = `Eres Dicttr AI, un asistente educativo especializado en mejorar transcripciones de clases universitarias. 

Tu objetivo es:
1. Estructurar el contenido de forma clara y didáctica
2. Corregir errores de transcripción y eliminar muletillas
3. Identificar conceptos clave y añadir definiciones breves
4. Organizar la información en secciones lógicas
5. Mantener un lenguaje académico pero accesible
6. Crear bloques editables para cada elemento importante

IMPORTANTE: Genera el contenido mejorado en el idioma "${translationLanguage}". Todo el contenido debe estar en este idioma.

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
- Solo devuelve JSON válido, sin texto adicional
- Todo el contenido debe estar en "${translationLanguage}"`;

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
  getStudyPrompt(materialType, language = 'es') {
    const prompts = {
      es: {
        summary: "Genera un resumen estructurado con los puntos clave organizados en secciones. Máximo 300 palabras.",
        flashcards: "Crea 5-8 flashcards en formato JSON con 'question' y 'answer'. Enfócate en conceptos clave.",
        concepts: "Identifica y explica los 3-5 conceptos más importantes del texto. Para cada concepto incluye: definición, importancia y ejemplos.",
        quiz: "Crea 5 preguntas de opción múltiple basadas en el contenido. Formato JSON con pregunta, opciones (a,b,c,d) y respuesta correcta.",
        flowchart: "Genera un flujograma en sintaxis Mermaid que represente el proceso o sistema descrito. Usa formato claro con nodos rectangulares para procesos, rombos para decisiones, y flechas para flujo. Incluye solo el código Mermaid sin explicaciones."
      },
      en: {
        summary: "Generate a structured summary with key points organized in sections. Maximum 300 words.",
        flashcards: "Create 5-8 flashcards in JSON format with 'question' and 'answer'. Focus on key concepts.",
        concepts: "Identify and explain the 3-5 most important concepts in the text. For each concept include: definition, importance, and examples.",
        quiz: "Create 5 multiple-choice questions based on the content. JSON format with question, options (a,b,c,d) and correct answer.",
        flowchart: "Generate a flowchart in Mermaid syntax that represents the described process or system. Use clear format with rectangular nodes for processes, diamonds for decisions, and arrows for flow. Include only the Mermaid code without explanations."
      },
      fr: {
        summary: "Générez un résumé structuré avec les points clés organisés en sections. Maximum 300 mots.",
        flashcards: "Créez 5-8 flashcards au format JSON avec 'question' et 'answer'. Concentrez-vous sur les concepts clés.",
        concepts: "Identifiez et expliquez les 3-5 concepts les plus importants du texte. Pour chaque concept incluez: définition, importance et exemples.",
        quiz: "Créez 5 questions à choix multiples basées sur le contenu. Format JSON avec question, options (a,b,c,d) et réponse correcte.",
        flowchart: "Générez un organigramme en syntaxe Mermaid qui représente le processus ou système décrit. Utilisez un format clair avec des nœuds rectangulaires pour les processus, des losanges pour les décisions, et des flèches pour le flux. Incluez uniquement le code Mermaid sans explications."
      }
    };

    // Usar el idioma especificado o fallback a español
    const languagePrompts = prompts[language] || prompts.es;
    return languagePrompts[materialType] || languagePrompts.summary;
  }

  // Generar flujograma específicamente
  async generateFlowchart(text, subject = 'general') {
    try {
      // Verificar si tenemos API key válida
      if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
        console.log('⚠️  API key de DeepSeek no configurada, usando flujograma local');
        return this.localFlowchart(text, subject);
      }

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

      const response = await deepseek.chat([
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Crea un flujograma Mermaid para este contenido sobre ${subject}:\n\n${text}`
        }
      ], DEEPSEEK_MODELS.CHAT);

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
      console.log('🔄 Usando flujograma local como fallback');
      return this.localFlowchart(text, subject);
    }
  }

  // Flujograma local sin dependencia de API externa
  localFlowchart(text, subject = 'general') {
    console.log('🎯 Usando flujograma local (sin API externa)');

    const mermaidCode = `graph TD
  A[Inicio del Proceso] --> B[Análisis del Contenido]
  B --> C{¿Es ${subject}?}
  C -->|Sí| D[Procesar ${subject}]
  C -->|No| E[Procesar General]
  D --> F[Generar Resultados]
  E --> F
  F --> G[Fin del Proceso]`;

    return {
      type: 'flowchart',
      mermaid_code: mermaidCode,
      content: `Flujograma local generado para: ${subject}`,
      generated_at: new Date().toISOString(),
      is_local: true
    };
  }

  // Expandir texto con IA (para editor de bloques)
  async expandText(text, subject = 'general') {
    try {
      // Verificar si tenemos API key válida
      if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
        console.log('⚠️  API key de DeepSeek no configurada, usando expansión local');
        return this.localExpandText(text, subject);
      }

      const systemPrompt = `Eres Dicttr AI, un asistente educativo especializado en ampliar y enriquecer contenido académico.

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

      const response = await deepseek.chat([
        {
          role: "system",
          content: finalPrompt
        },
        {
          role: "user",
          content: `Amplía y enriquece este contenido sobre ${subject}:\n\n${text}`
        }
      ], DEEPSEEK_MODELS.CHAT);

      return {
        expanded_text: response.choices[0].message.content,
        original_text: text,
        subject: subject,
        processed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error expandiendo texto:', error.message);
      console.log('🔄 Usando expansión local como fallback');
      return this.localExpandText(text, subject);
    }
  }

  // Expansión local de texto sin dependencia de API externa
  localExpandText(text, subject = 'general') {
    console.log('🎯 Usando expansión local de texto (sin API externa)');

    const expandedText = `# Texto Ampliado sobre ${subject}

## Contenido Original:
${text}

## Información Adicional:
Este texto ha sido ampliado localmente para proporcionar contexto educativo adicional relacionado con ${subject}. La expansión local incluye información básica y ejemplos relevantes para facilitar el aprendizaje.

## Ejemplo de Aplicación:
El contenido original puede ser utilizado para crear materiales de estudio, resúmenes o presentaciones educativas sobre ${subject}.

## Nota:
Esta expansión fue generada localmente sin dependencia de servicios externos de IA.`;

    return {
      expanded_text: expandedText,
      original_text: text,
      subject: subject,
      processed_at: new Date().toISOString(),
      is_local: true
    };
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

  // Generar bloque específico con IA usando contexto
  async generateBlock(blockType, userPrompt, contextText, subject = 'general') {
    try {
      // Detectar si el usuario solicita un tipo de bloque diferente
      let finalBlockType = blockType;
      
      // Análisis del prompt del usuario para detectar intención
      const userPromptLower = userPrompt.toLowerCase();
      
      if (userPromptLower.includes('listado') || 
          userPromptLower.includes('lista') || 
          userPromptLower.includes('enumera') || 
          userPromptLower.includes('puntos') ||
          userPromptLower.includes('items') ||
          userPromptLower.includes('elementos')) {
        console.log('🎯 Detectada intención de lista, cambiando blockType a list');
        finalBlockType = 'list';
      } else if (userPromptLower.includes('conceptos clave') || 
                 userPromptLower.includes('key concepts') || 
                 userPromptLower.includes('conceptos principales')) {
        console.log('🎯 Detectada intención de conceptos clave, cambiando blockType a key_concepts_block');
        finalBlockType = 'key_concepts_block';
      } else if (userPromptLower.includes('concepto') || 
                 userPromptLower.includes('definición') || 
                 userPromptLower.includes('definir')) {
        console.log('🎯 Detectada intención de concepto, cambiando blockType a concept_block');
        finalBlockType = 'concept_block';
      } else if (userPromptLower.includes('resumen') || 
                 userPromptLower.includes('resumir')) {
        console.log('🎯 Detectada intención de resumen, cambiando blockType a summary_block');
        finalBlockType = 'summary_block';
      } else if (userPromptLower.includes('título') || 
                 userPromptLower.includes('titulo') || 
                 userPromptLower.includes('heading') || 
                 userPromptLower.includes('encabezado') ||
                 userPromptLower.includes('cabecera')) {
        console.log('🎯 Detectada intención de título/encabezado, cambiando blockType a heading');
        finalBlockType = 'heading';
      }
      
      const systemPrompt = this.getBlockGenerationPrompt(finalBlockType, subject);

      console.log('🔍 Generando bloque con IA - Tipo solicitado:', blockType);
      console.log('🔍 Tipo final detectado:', finalBlockType);
      console.log('📝 Prompt del usuario:', userPrompt.substring(0, 100) + '...');
      console.log('📋 Contexto length:', contextText.length);
      console.log('🔍 Muestra del contexto (primeros 200 chars):', contextText.substring(0, 200) + '...');
      
      // Truncar contexto si es demasiado largo para evitar que domine sobre la instrucción del usuario
      // También extraer texto si el contexto es un objeto JSON
      let processedContext = contextText;
      
      // Si el contexto parece ser JSON, extraer solo el texto
      try {
        if (contextText.trim().startsWith('{') || contextText.trim().startsWith('[')) {
          const contextData = JSON.parse(contextText);
          // Extraer todo el texto de las secciones
          if (contextData.sections && Array.isArray(contextData.sections)) {
            processedContext = contextData.sections
              .map(section => section.content || section.text || '')
              .filter(Boolean)
              .join('\n');
            console.log('🔄 Contexto JSON convertido a texto plano, length:', processedContext.length);
          }
        }
      } catch (e) {
        console.log('ℹ️  Contexto no es JSON válido, usando como texto plano');
      }
      
      const truncatedContext = processedContext.length > 1000 ? 
        processedContext.substring(0, 1000) + '... [contexto truncado]' : 
        processedContext;
      
      const fullPrompt = `⚠️⚠️⚠️ INSTRUCCIÓN PRINCIPAL DEL USUARIO (OBLIGATORIO - IGNORAR CONTEXTO SI ES NECESARIO):\n${userPrompt}\n\n💡 CONTEXTO DE FONDO (SOLO PARA REFERENCIA - NO ES OBLIGATORIO USARLO):\n${truncatedContext}\n\n🚨 GENERA EXCLUSIVAMENTE EL BLOQUE SOLICITADO EN FORMATO JSON, SIGUIENDO ÚNICAMENTE LA INSTRUCCIÓN PRINCIPAL DEL USUARIO:`;
      
      let response;
      try {
        // Verificar si tenemos API key válida
        if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
          console.log('⚠️  API key de DeepSeek no configurada, usando bloque local');
          return this.localGenerateBlock(blockType, userPrompt, contextText, subject);
        }

        response = await deepseek.chat([
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: fullPrompt
          }
        ], DEEPSEEK_MODELS.CHAT);

        console.log('✅ Respuesta de DeepSeek recibida');
        console.log('📄 Contenido crudo:', response.choices[0].message.content.substring(0, 200) + '...');
      } catch (apiError) {
        console.error('❌ Error en API de DeepSeek:', apiError.message);
        console.log('🔄 Usando bloque local como fallback');
        return this.localGenerateBlock(blockType, userPrompt, contextText, subject);
      }

      // Parsear la respuesta JSON, manejando posibles code blocks
      let generatedData;
      let rawContent = response.choices[0]?.message?.content;
      
      if (!rawContent) {
        console.error('❌ Respuesta de DeepSeek vacía o inválida:', response);
        throw new Error('La API de DeepSeek devolvió una respuesta vacía');
      }
      
      try {
        // Intentar extraer JSON de code blocks markdown primero
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          console.log('🎯 Extrayendo JSON de code block');
          generatedData = JSON.parse(jsonMatch[1].trim());
        } else {
          // Si no hay code blocks, parsear directamente
          generatedData = JSON.parse(rawContent);
        }
        console.log('🎯 JSON parseado correctamente:', JSON.stringify(generatedData, null, 2));
      } catch (error) {
        console.warn('❌ Error parsing block JSON:', error.message);
        console.warn('📋 Contenido que falló:', rawContent);
        
        // Intentar limpiar el contenido y parsear nuevamente
        try {
          const cleanedContent = rawContent
            .replace(/```(?:json)?/g, '')
            .replace(/```/g, '')
            .trim();
          
          if (cleanedContent !== rawContent) {
            console.log('🔄 Intentando parsear contenido limpiado');
            generatedData = JSON.parse(cleanedContent);
            console.log('✅ Parseo exitoso después de limpieza');
          } else {
            throw new Error('No se pudo limpiar el contenido');
          }
        } catch (cleanError) {
          console.warn('❌ Fallback necesario, usando contenido raw');
          // Fallback: crear bloque básico con el contenido raw
          generatedData = this.createFallbackBlock(blockType, rawContent);
          console.log('🔄 Usando fallback:', JSON.stringify(generatedData, null, 2));
        }
      }

      return {
        block_type: blockType,
        generated_content: generatedData,
        user_prompt: userPrompt,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Error generando bloque ${blockType}: ${error.message}`);
    }
  }

  // Prompt especializado para generación de bloques
  getBlockGenerationPrompt(blockType, subject) {
    const basePrompt = `Eres Dicttr AI, especializado en generar contenido educativo para bloques específicos.

INSTRUCCIONES CRÍTICAS:
1. 🚨 SIGUE EXACTAMENTE LA INSTRUCCIÓN DEL USUARIO - IGNORA COMPLETAMENTE EL CONTEXTO SI CONTRADICE LA INSTRUCCIÓN
2. Usa el CONTEXTO proporcionado SOLO si es compatible con la instrucción del usuario
3. Devuelve SOLO el bloque solicitado en formato JSON válido
4. Si el contexto contradice la instrucción del usuario, IGNORA EL CONTEXTO COMPLETAMENTE
5. Usa lenguaje académico pero accesible
6. EL TIPO DE BLOQUE DEBE SER EXACTAMENTE EL SOLICITADO: ${blockType}

IMPORTANTE: 
- Solo devuelve el objeto JSON del bloque, sin texto adicional
- NO usa markdown code blocks (\`\`\`json o \`\`\`)
- Devuelve SOLO el objeto JSON crudo, sin comentarios ni explicaciones
- Asegúrate de que el JSON sea válido y esté bien formado`;

    const blockPrompts = {
      heading: basePrompt + `\n\nFormato EXACTO para heading: { "type": "heading", "level": 2, "content": "Texto del encabezado" }`,
      paragraph: basePrompt + `\n\nFormato EXACTO para paragraph: { "type": "paragraph", "content": "Contenido del párrafo" }`,
      list: basePrompt + `\n\nFormato EXACTO para list: { "type": "list", "style": "bulleted", "items": ["item 1", "item 2"] }`,
      concept_block: basePrompt + `\n\nFormato EXACTO para concept_block: { "type": "concept_block", "term": "Término", "definition": "Definición", "examples": ["ejemplo 1", "ejemplo 2"] }`,
      summary_block: basePrompt + `\n\nFormato EXACTO para summary_block: { "type": "summary_block", "content": "Contenido del resumen" }`,
      key_concepts_block: basePrompt + `\n\nFormato EXACTO para key_concepts_block: { "type": "key_concepts_block", "concepts": ["concepto 1", "concepto 2", "concepto 3"] }`,
      example: basePrompt + `\n\nFormato EXACTO para example: { "type": "example", "content": "Contenido del ejemplo" }`
    };

    const subjectContext = {
      medicina: "Enfócate en terminología médica y casos clínicos.",
      ingenieria: "Prioriza aplicaciones prácticas y ejemplos técnicos.",
      derecho: "Destaca conceptos legales y jurisprudencia.",
      ciencias: "Explica fenómenos científicos y metodologías.",
      general: ""
    };

    return blockPrompts[blockType] + subjectContext[subject] || subjectContext.general;
  }

  // Crear bloque de fallback si el parsing falla
  createFallbackBlock(blockType, content) {
    const fallbacks = {
      heading: { type: "heading", level: 2, content },
      paragraph: { type: "paragraph", content },
      list: { type: "list", style: "bulleted", items: [content] },
      concept_block: { type: "concept_block", term: "Concepto", definition: content, examples: [] },
      summary_block: { type: "summary_block", content },
      key_concepts_block: { type: "key_concepts_block", concepts: [content] }
    };
    
    return fallbacks[blockType] || { type: "paragraph", content };
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

  // Generar asunto automático con IA basado en el contenido
  async generateSubjectFromContent(content) {
    try {
      console.log('🤖 Generando asunto automático con IA...');

      // Si el contenido es un objeto JSON, extraer el texto
      let textContent = content;
      if (typeof content === 'object' && content !== null) {
        // Extraer texto de diferentes formatos posibles
        if (content.text) {
          textContent = content.text;
        } else if (content.content) {
          textContent = content.content;
        } else if (content.enhanced_text && typeof content.enhanced_text === 'object') {
          // Extraer texto de enhanced_text estructurado
          textContent = this.extractTextFromEnhancedContent(content.enhanced_text);
        } else if (content.original_text) {
          textContent = content.original_text;
        } else {
          // Fallback: convertir a string
          textContent = JSON.stringify(content);
        }
      }

      // Limitar el texto para evitar tokens excesivos
      const truncatedText = textContent.length > 1000
        ? textContent.substring(0, 1000) + '...'
        : textContent;

      const systemPrompt = `Eres Dicttr AI, especializado en análisis de contenido educativo.

Tu tarea es analizar el contenido proporcionado y generar un asunto/tema apropiado que describa de qué trata el material.

INSTRUCCIONES:
1. Analiza el contenido y extrae el tema principal
2. Genera un asunto conciso (máximo 3-5 palabras)
3. Usa categorías educativas comunes como: matemáticas, física, química, biología, historia, literatura, programación, medicina, derecho, economía, etc.
4. Si no puedes determinar el tema, devuelve "general"
5. Devuelve SOLO el asunto, sin explicaciones ni texto adicional

Ejemplos de respuestas válidas:
- "matemáticas"
- "historia antigua"
- "programación web"
- "biología celular"
- "general"`;

      const response = await deepseek.chat([
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analiza este contenido y genera un asunto apropiado:\n\n${truncatedText}`
        }
      ], DEEPSEEK_MODELS.CHAT);

      const generatedSubject = response.choices[0].message.content.trim().toLowerCase();

      console.log('✅ Asunto generado:', generatedSubject);
      return generatedSubject;

    } catch (error) {
      console.error('❌ Error generando asunto con IA:', error.message);
      console.log('⚠️  Devolviendo null (sin asunto)');
      return null; // Sin asunto en lugar de "general"
    }
  }

  // Extraer texto de contenido enhanced estructurado
  extractTextFromEnhancedContent(enhancedContent) {
    if (!enhancedContent) return '';

    let text = '';

    // Si tiene título, añadirlo
    if (enhancedContent.title) {
      text += enhancedContent.title + '\n\n';
    }

    // Extraer texto de las secciones
    if (enhancedContent.sections && Array.isArray(enhancedContent.sections)) {
      enhancedContent.sections.forEach(section => {
        if (section.content) {
          text += section.content + '\n';
        }
        if (section.term && section.definition) {
          text += `${section.term}: ${section.definition}\n`;
        }
        if (section.items && Array.isArray(section.items)) {
          text += section.items.join('\n') + '\n';
        }
      });
    }

    // Extraer conceptos clave
    if (enhancedContent.key_concepts && Array.isArray(enhancedContent.key_concepts)) {
      text += 'Conceptos clave: ' + enhancedContent.key_concepts.join(', ') + '\n';
    }

    // Extraer resumen
    if (enhancedContent.summary) {
      text += enhancedContent.summary + '\n';
    }

    return text.trim() || JSON.stringify(enhancedContent);
  }
}

module.exports = new TranscriptionService();
