import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import OAuthButtons from '../components/OAuthButtons';
import { useNavigation } from '@react-navigation/native';
import DicttrLogo from '../components/DicttrLogo';
import PasswordInput from '../components/PasswordInput';
import CustomInput from '../components/CustomInput';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // Navigation is handled automatically by the AuthContext state change
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <DicttrLogo />
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            label="Email"
          />

          <PasswordInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            label="Contraseña"
            error={error}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerText}>
              ¿No tienes una cuenta? Regístrate
            </Text>
          </TouchableOpacity>
        </View>

        <OAuthButtons />
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Para desarrollo con Expo Go:
          </Text>
          <Text style={styles.infoBullet}>• Email: test@example.com</Text>
          <Text style={styles.infoBullet}>• Password: password123</Text>
          <Text style={styles.infoBullet}>• Google Sign-In solo funciona con Development Build</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#333333',
  },
  button: {
    backgroundColor: '#3ba3a4',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerText: {
    textAlign: 'center',
    color: '#3ba3a4',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoBullet: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666',
    marginLeft: 8,
  },
});

export default LoginScreen;
