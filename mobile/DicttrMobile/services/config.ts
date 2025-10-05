// Configuración dinámica para la API
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detectar si estamos en modo túnel de Expo
const isExpoGo = Constants.appOwnership === 'expo';
// Nota: Constants.manifest ha sido reemplazado por Constants.expoConfig en versiones más recientes
const isTunnel = false; // Simplificado temporalmente para evitar errores

// Obtener la URL base dinámicamente
export const getApiBaseUrl = (): string => {
  // SIEMPRE USAR PRODUCCIÓN - Para evitar la selección de development server
  const PRODUCTION_API_URL = 'https://studyscribe.zingyzong.com/api';

  console.log('[Config] DEBUG_MODE:', DEBUG_MODE);
  console.log('[Config] isExpoGo:', isExpoGo);
  console.log('[Config] Platform.OS:', Platform.OS);
  console.log('[Config] __DEV__:', __DEV__);

  // FORZAR USO DE PRODUCCIÓN EN TODOS LOS CASOS
  // Para evitar la selección de development server
  console.log('[Config] Usando backend de producción:', PRODUCTION_API_URL);
  return PRODUCTION_API_URL;
};

// Configuración de depuración - Siempre usar producción
export const DEBUG_MODE = false;
export const LOG_NETWORK_REQUESTS = true;

// Función para depurar errores de red
export const debugNetworkError = (error: any, context: string) => {
  if (LOG_NETWORK_REQUESTS) {
    console.log(`[Network Debug - ${context}]`);
    console.log('Error:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('URL:', error.config?.url);
    console.log('Method:', error.config?.method);
  }
};
