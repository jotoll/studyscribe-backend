// Tipos compartidos entre frontend web y mobile
export * from './doc-blocks';

// Interfaces comunes
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Configuración común
export const API_BASE_URL = 'http://localhost:3001/api';
export const SUPPORTED_SUBJECTS = ['general', 'medicina', 'ingenieria', 'derecho', 'ciencias'] as const;