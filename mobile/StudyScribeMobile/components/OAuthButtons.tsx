import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authAPI } from '../services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

interface OAuthButtonsProps {
  onLoginSuccess?: (token: string, user: any) => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onLoginSuccess }) => {
  const handleOAuthLogin = async (provider: string) => {
    try {
      // Obtener URL de OAuth del backend
      const response = await authAPI.getOAuthUrl(provider, 'http://192.168.1.140:3001/api/auth/oauth/callback');
      
      if (response.success && response.data.url) {
        // Abrir el navegador para el login de OAuth
        const result = await WebBrowser.openBrowserAsync(response.data.url);
        
        if (result.type === 'dismiss') {
          // El backend redirigirá al frontend con el token
          // Aquí deberías manejar la redirección en tu AppNavigator o similar
          Alert.alert('Éxito', 'Autenticación completada');
        }
      } else {
        Alert.alert('Error', 'No se pudo obtener la URL de autenticación');
      }
    } catch (error) {
      console.error(`Error en OAuth con ${provider}:`, error);
      Alert.alert('Error', `No se pudo completar el login con ${provider}`);
    }
  };

  const handleGoogleLogin = () => handleOAuthLogin('google');
  const handleGitHubLogin = () => handleOAuthLogin('github');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>O inicia sesión con:</Text>
      
      <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleLogin}>
        <Text style={[styles.buttonText, styles.googleButtonText]}>Continuar con Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.githubButton]} onPress={handleGitHubLogin}>
        <Text style={[styles.buttonText, styles.githubButtonText]}>Continuar con GitHub</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#4285F4',
  },
  githubButton: {
    backgroundColor: '#24292e',
    borderColor: '#24292e',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonText: {
    color: '#4285F4',
  },
  githubButtonText: {
    color: '#fff',
  },
});

export default OAuthButtons;
