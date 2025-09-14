import fetch from 'node-fetch';
import { DocMeta } from '../types/docblocks-v2';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface DeepSeekStructuredResponse {
  blocks: Array<{
    id: string;
    type: string;
    text?: string;
    items?: string[];
  }>;
}

export async function deepseekFormatV2(
  transcriptionText: string,
  meta: DocMeta
): Promise<DeepSeekStructuredResponse> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY no está configurada');
  }

  const prompt = `Eres un asistente que reestructura la transcripción en bloques editables.

Objetivo:
- Devolver JSON **DocBlocks v2** con títulos (h1,h2), párrafos y listas.
- NO añadas contenido que no esté en la transcripción.
- NO crees ni inventes tiempos (time) ni oradores (speaker). Esos campos los añade luego la app.
- Devuelve SOLO JSON válido; nada de texto adicional.

Esquema:
{
  "blocks": [
    { "id": "unique_id", "type": "h1|h2|h3|paragraph|bulleted_list|numbered_list|quote|code", "text": "si no es lista" }
    // para listas: { "id": "...", "type": "bulleted_list|numbered_list", "items": ["..."] }
  ]
}

Reglas:
- Corrige ortografía/puntuación sin inventar ideas.
- Segmenta en bloques cortos (1–3 frases).
- Usa h1 para el título global; h2/h3 para secciones lógicas.
- Convierte enumeraciones a listas.
- Genera IDs únicos para cada bloque.

Contexto:
- Curso: ${meta.curso}
- Asignatura: ${meta.asignatura}
- Idioma: ${meta.idioma}

Transcripción:
${transcriptionText.slice(0, 12000)} // Limitar tamaño por token limit`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en estructuración de contenidos educativos. Devuelve ÚNICAMENTE JSON válido sin comentarios.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from DeepSeek');
    }

    const result = JSON.parse(content) as DeepSeekStructuredResponse;
    
    // Validar y limpiar la respuesta
    return {
      blocks: result.blocks.map(block => ({
        ...block,
        id: block.id || generateBlockId(),
        text: block.text ? cleanText(block.text) : undefined,
        items: block.items ? block.items.map(cleanText) : undefined
      }))
    };
  } catch (error) {
    console.error('Error en DeepSeek structuring:', error);
    
    // Fallback: crear estructura básica si falla la API
    return createFallbackStructure(transcriptionText);
  }
}

function generateBlockId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function cleanText(text: string): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function createFallbackStructure(text: string): DeepSeekStructuredResponse {
  // División simple en párrafos como fallback
  const paragraphs = text.split(/\n\s*\n+/).filter(p => p.trim().length > 0);
  
  return {
    blocks: [
      {
        id: generateBlockId(),
        type: 'h1',
        text: 'Transcripción'
      },
      ...paragraphs.map((paragraph, index) => ({
        id: generateBlockId(),
        type: 'paragraph',
        text: paragraph.trim()
      }))
    ]
  };
}

// Pre-procesamiento para mejorar detección de listas
export function preprocessTextForLists(text: string): string {
  return text
    // Normalizar enumeraciones numéricas
    .replace(/(\d+)[\.\)]\s+/g, '$1) ')
    // Normalizar viñetas
    .replace(/[•\-\*]\s+/g, '• ')
    // Separar listas evidentes
    .replace(/(\n)(\d+\)|•)/g, '$1$2');
}