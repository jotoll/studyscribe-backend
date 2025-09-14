import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TranscriptionResponse {
  success: boolean;
  data: {
    file_info?: {
      filename: string;
      original_name: string;
      size: number;
      duration: number;
    };
    transcription?: {
      original: string;
      enhanced: string;
      confidence: number;
    };
    enhanced_text?: string;
    original_text?: string;
    subject: string;
    processed_at: string;
  };
}

export interface DocBlocksV2Response {
  success: boolean;
  data: {
    doc_id: string;
    blocks_count: number;
    meta: {
      curso: string;
      asignatura: string;
      idioma: string;
    };
    version: number;
  };
}

export interface DocBlocksV2 {
  doc_id: string;
  meta: {
    curso: string;
    asignatura: string;
    idioma: string;
  };
  blocks: Array<{
    id: string;
    type: string;
    text?: string;
    items?: string[];
    concepts?: string[];
    time?: { start: number; end: number };
    confidence?: number;
    speaker?: string | null;
    tags?: string[];
    // Custom block types
    term?: string;
    definition?: string;
    examples?: string[];
    content?: string;
  }>;
  version: number;
}

export interface StudyMaterialResponse {
  success: boolean;
  data: {
    type: string;
    content: string;
    generated_at: string;
  };
}

export interface FlowchartResponse {
  success: boolean;
  data: {
    flowchart: {
      type: string;
      mermaid_code: string;
      content: string;
      generated_at: string;
    };
    subject: string;
    generated_at: string;
  };
}

export interface GenerateBlockResponse {
  success: boolean;
  data: {
    block_type: string;
    generated_content: {
      type: string;
      level?: number;
      content?: string;
      items?: string[];
      term?: string;
      definition?: string;
      examples?: string[];
      concepts?: string[];
    };
    user_prompt: string;
    generated_at: string;
  };
}

export const transcriptionAPI = {
  // Mejorar texto existente
  enhanceText: async (text: string, subject: string = 'general'): Promise<TranscriptionResponse> => {
    const response = await api.post('/transcription/enhance', { text, subject });
    return response.data;
  },

  // Subir y transcribir archivo de audio
  uploadAudio: async (file: File, subject: string = 'general'): Promise<TranscriptionResponse> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('subject', subject);

    const response = await api.post('/transcription/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Procesar audio con estructura V2
  processAudioV2: async (file: File, curso: string, asignatura: string, idioma: string = 'es', glosario?: string): Promise<DocBlocksV2Response> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('curso', curso);
    formData.append('asignatura', asignatura);
    formData.append('idioma', idioma);
    if (glosario) {
      formData.append('glosario', glosario);
    }

    const response = await api.post('/v2/process-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Obtener documento V2
  getDocumentV2: async (doc_id: string): Promise<{ success: boolean; data: DocBlocksV2 }> => {
    const response = await api.get(`/v2/document/${doc_id}`);
    return response.data;
  },

  // Actualizar documento V2
  updateDocumentV2: async (doc_id: string, blocks: any[]): Promise<{ success: boolean }> => {
    const response = await api.put(`/v2/document/${doc_id}`, { blocks });
    return response.data;
  },

  // Generar material de estudio
  generateMaterial: async (text: string, type: 'summary' | 'flashcards' | 'concepts' | 'quiz'): Promise<StudyMaterialResponse> => {
    const response = await api.post('/transcription/generate-material', { text, type });
    return response.data;
  },

  // Generar flujograma
  generateFlowchart: async (enhancedText: string, subject: string = 'general'): Promise<FlowchartResponse> => {
    const response = await api.post('/transcription/flowchart', { enhanced_text: enhancedText, subject });
    return response.data;
  },

  // Generar bloque específico con IA
  generateBlock: async (
    blockType: string,
    userPrompt: string,
    contextText: string,
    subject: string = 'general'
  ): Promise<GenerateBlockResponse> => {
    const response = await api.post('/transcription/generate-block', {
      block_type: blockType,
      user_prompt: userPrompt,
      context_text: contextText,
      subject
    });
    return response.data;
  },
};

export default api;