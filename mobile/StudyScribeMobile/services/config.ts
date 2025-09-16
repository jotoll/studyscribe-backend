// Configuración dinámica para la API
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detectar si estamos en modo túnel de Expo
const isExpoGo = Constants.appOwnership === 'expo';
const isTunnel = Constants.manifest?.developer?.tool === 'expo-cli' && 
                 Constants.manifest?.developer?.projectRoot?.includes('tunnel');

// Obtener la URL base dinámicamente
export const getApiBaseUrl = (): string => {
  // PRODUCCIÓN: Usar el backend desplegado en tu servidor Hetzner con Coolify
  // URL proporcionada automáticamente por Coolify
  const PRODUCTION_API_URL = 'https://studyscribe.zingyzong.com/api';
  
  // DESARROLLO LOCAL: Usar IP local
  const DEVELOPMENT_API_URL = 'http://192.168.1.140:3001/api';
  
  // Detectar si estamos en producción o desarrollo
  if (!DEBUG_MODE) {
    // Producción - usar el backend en Coolify
    console.log('[Config] Usando backend de producción:', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }
  
  // Desarrollo local con Expo Go
  if (isExpoGo) {
    console.log('[Config] Usando IP local para desarrollo:', DEVELOPMENT_API_URL);
    return DEVELOPMENT_API_URL;
  }
  
  // Desarrollo web
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  }
  
  // Por defecto para desarrollo
  return DEVELOPMENT_API_URL;
};

// Configuración de depuración - Usar producción para probar nuevas rutas
export const DEBUG_MODE = true;
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
