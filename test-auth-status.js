// Script para verificar el estado de autenticación en la app móvil
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function checkAuthStatus() {
  try {
    console.log('🔍 Verificando estado de autenticación...');
    
    const storedToken = await AsyncStorage.getItem('authToken');
    const storedUser = await AsyncStorage.getItem('authUser');
    
    console.log('📱 Token almacenado:', storedToken ? '✅ Presente' : '❌ Ausente');
    console.log('👤 Usuario almacenado:', storedUser ? '✅ Presente' : '❌ Ausente');
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      console.log('📋 Datos del usuario:', user);
    }
    
    if (storedToken) {
      console.log('🔑 Token (primeros 20 caracteres):', storedToken.substring(0, 20) + '...');
    }
    
    console.log('\n💡 Problema identificado:');
    console.log('La aplicación está mostrando transcripciones de todos los usuarios porque:');
    console.log('1. No hay token de autenticación válido');
    console.log('2. El backend devuelve todas las transcripciones cuando no hay autenticación');
    console.log('3. La app debería redirigir al login si no está autenticada');
    
  } catch (error) {
    console.error('❌ Error verificando autenticación:', error);
  }
}

checkAuthStatus();
