import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { authAPI } from '../services/api';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

interface OAuthButtonsProps {
  onLoginSuccess?: (token: string, user: any) => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log('[OAuth] Iniciando login con Google...');
      
      // Obtener URL de OAuth del backend para Google
      // Usar URL de producción para el callback
      const response = await authAPI.getOAuthUrl('google', 'https://studyscribe.zingyzong.com/api/auth/oauth/callback');
      
      console.log('[OAuth] Respuesta del backend:', response);
      
      if (response.success && response.data.url) {
        console.log('[OAuth] Abriendo navegador con URL:', response.data.url);
        
        // Abrir el navegador para el login de Google OAuth
        const result = await WebBrowser.openBrowserAsync(response.data.url);
        
        console.log('[OAuth] Resultado del navegador:', result);
        
        if (result.type === 'dismiss') {
          // El backend redirigirá al frontend con el token
          // Esperar un momento y verificar si el usuario fue autenticado
          setTimeout(async () => {
            try {
              // Intentar obtener el perfil del usuario para verificar si está autenticado
              const profileResponse = await authAPI.getProfile();
              
              if (profileResponse.success && profileResponse.data?.user) {
                console.log('[OAuth] Usuario autenticado exitosamente');
                Alert.alert('Éxito', 'Autenticación con Google completada');
                
                // Actualizar el contexto de autenticación
                if (onLoginSuccess) {
                  onLoginSuccess('', profileResponse.data.user);
                }
              } else {
                console.log('[OAuth] No se pudo verificar la autenticación');
                Alert.alert('Error', 'No se pudo completar la autenticación');
              }
            } catch (error) {
              console.error('[OAuth] Error verificando autenticación:', error);
              Alert.alert('Error', 'No se pudo verificar la autenticación');
            } finally {
              setLoading(false);
            }
          }, 2000);
        } else {
          setLoading(false);
        }
      } else {
        console.error('[OAuth] Error en respuesta del backend:', response);
        Alert.alert(
          'Error de Autenticación',
          'El servicio de autenticación con Google no está disponible temporalmente. Por favor, usa el email y contraseña para iniciar sesión.',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    } catch (error: any) {
      console.error('[OAuth] Error en OAuth con Google:', error);
      
      // Verificar si es un error de servidor
      if (error.message?.includes('Internal server error')) {
        Alert.alert(
          'Servicio No Disponible',
          'El servicio de autenticación con Google está en mantenimiento. Por favor, usa el email y contraseña para iniciar sesión.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error.message || 'No se pudo completar el login con Google');
      }
      
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>O inicia sesión con:</Text>
      
      <TouchableOpacity
        style={[styles.button, styles.googleButton, loading && styles.buttonDisabled]}
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Continuar con Google</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    fontWeight: '400',
  },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    borderColor: '#cccccc',
  },
  googleButton: {
    borderColor: '#3ba3a4',
    backgroundColor: '#3ba3a4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default OAuthButtons;
