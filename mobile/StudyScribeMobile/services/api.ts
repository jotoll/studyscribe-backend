import axios from 'axios';
import { getApiBaseUrl, debugNetworkError } from './config';

// Usar la URL base dinámica
const API_BASE_URL = getApiBaseUrl();

// Auth API interface
export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      subscription_status: string;
    };
  };
}

export interface ProfileResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      subscription_status: string;
      created_at: string;
    };
  };
}

export interface UsageResponse {
  success: boolean;
  data?: {
    transcription_count: number;
    audio_minutes: number;
    limits: {
      transcriptions: number;
      audio_minutes: number;
    };
  };
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increased from 30s to 120s for complete transcription + enhancement processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = authAPI.getToken();
    // Skip authentication for local development - don't send token for local backend
    if (token && !(API_BASE_URL.includes('localhost') || API_BASE_URL.includes('192.168'))) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Depurar errores de red
    debugNetworkError(error, 'API Response');
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      authAPI.setToken(null);
      // You might want to redirect to login here
      
      // Extract specific error message from backend if available
      const backendError = error.response?.data?.error;
      if (backendError) {
        error.message = backendError;
      }
    }
    
    // Extract backend error message for all error responses
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }
    
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  _token: null as string | null,

  setToken(token: string | null) {
    this._token = token;
  },

  getToken() {
    return this._token;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Error al iniciar sesión'
      );
    }
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', { full_name: name, email, password });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Error al crear la cuenta'
      );
    }
  },

  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener perfil'
      );
    }
  },

  async updateProfile(updates: any): Promise<ProfileResponse> {
    try {
      const response = await api.put('/auth/profile', updates);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al actualizar perfil'
      );
    }
  },

  async getUsage(): Promise<UsageResponse> {
    try {
      const response = await api.get('/auth/usage');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener uso'
      );
    }
  },

  // OAuth functions
  async getOAuthUrl(provider: string = 'google', redirectTo: string): Promise<{ success: boolean; data: { url: string } }> {
    try {
      const response = await api.get(`/auth/oauth/${provider}/url`, {
        params: { redirectTo }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Error al obtener URL de OAuth'
      );
    }
  },

  async getGenericOAuthUrl(provider: string = 'google', redirectTo: string): Promise<{ success: boolean; data: { url: string } }> {
    try {
      const response = await api.get('/auth/oauth/url', {
        params: { provider, redirectTo }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Error al obtener URL de OAuth'
      );
    }
  }
};

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
      enhanced: any; // Ahora es un objeto JSON estructurado
      confidence: number;
    };
    enhanced_text?: string;
    original_text?: string;
    expanded_text?: string;
    subject: string;
    processed_at: string;
  };
}

export interface PDFExportResponse {
  success: boolean;
  data?: {
    pdf_url?: string;
    download_url?: string;
    filename?: string;
    message?: string;
  };
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
    type: string;
    mermaid_code: string;
    content: string;
    generated_at: string;
  };
}

export interface GenerateBlockResponse {
  success: boolean;
  data: {
    block_type: string;
    generated_content: any;
    user_prompt: string;
    generated_at: string;
  };
}

export interface TranscriptionListResponse {
  success: boolean;
  data: {
    transcriptions: Transcription[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface TranscriptionFiltersResponse {
  success: boolean;
  data: {
    subjects: string[];
    favoriteCount: number;
  };
}

export interface TranscriptionStatsResponse {
  success: boolean;
  data: {
    total: number;
    favorites: number;
    subjects: string[];
  };
}

export interface Transcription {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  processing_status?: string;
}


export const transcriptionAPI = {
  // Mejorar texto existente
  enhanceText: async (text: string, subject: string = 'general'): Promise<TranscriptionResponse> => {
    const response = await api.post('/transcription/enhance', { text, subject });
    return response.data;
  },

  // Subir y transcribir archivo de audio
  uploadAudio: async (audioUri: string, subject: string = 'general'): Promise<TranscriptionResponse> => {
    const formData = new FormData();
    
    // Crear objeto file para React Native
    const audioFile = {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any;
    
    formData.append('audio', audioFile);
    formData.append('subject', subject);

    const response = await api.post('/transcription/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Generar material de estudio
  generateMaterial: async (text: string, type: 'summary' | 'flashcards' | 'concepts' | 'quiz'): Promise<StudyMaterialResponse> => {
    const response = await api.post('/transcription/generate-material', { text, type });
    return response.data;
  },

  // Generar flujograma
  generateFlowchart: async (text: string, subject: string = 'general'): Promise<FlowchartResponse> => {
    const response = await api.post('/transcription/flowchart', { enhanced_text: text, subject });
    return response.data;
  },

  // Expandir texto con IA
  expandText: async (text: string, subject: string = 'general'): Promise<TranscriptionResponse> => {
    const response = await api.post('/transcription/expand', { text, subject });
    return response.data;
  },

  // Exportar a PDF
  exportToPDF: async (content: string): Promise<PDFExportResponse> => {
    try {
      const response = await api.post('/transcription/export-pdf', { content });
      return response.data;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      return { success: false, data: { message: 'Error al generar PDF' } };
    }
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

export const transcriptionManagementAPI = {
  // Obtener lista de transcripciones con filtros
  getTranscriptions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    subject?: string;
    favorite?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<TranscriptionListResponse> => {
    const response = await api.get('/transcriptions', { params });
    return response.data;
  },

  // Obtener filtros disponibles
  getFilters: async (): Promise<TranscriptionFiltersResponse> => {
    const response = await api.get('/transcriptions/filters');
    return response.data;
  },

  // Obtener estadísticas
  getStats: async (): Promise<TranscriptionStatsResponse> => {
    const response = await api.get('/transcriptions/stats');
    return response.data;
  },

  // Obtener transcripción específica
  getTranscription: async (id: string): Promise<TranscriptionListResponse> => {
    const response = await api.get(`/transcriptions/${id}`);
    return response.data;
  },

  // Actualizar transcripción
  updateTranscription: async (id: string, updates: {
    title?: string;
    subject?: string;
    is_favorite?: boolean;
    enhanced_text?: string;
  }): Promise<TranscriptionListResponse> => {
    const response = await api.put(`/transcriptions/${id}`, updates);
    return response.data;
  },

  // Eliminar transcripción
  deleteTranscription: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/transcriptions/${id}`);
    return response.data;
  },

  // Alternar favorito
  toggleFavorite: async (id: string, isFavorite: boolean): Promise<TranscriptionListResponse> => {
    return transcriptionManagementAPI.updateTranscription(id, { is_favorite: !isFavorite });
  }
};

export default api;
