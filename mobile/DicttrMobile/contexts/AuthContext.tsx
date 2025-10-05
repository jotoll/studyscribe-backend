import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  subscription_status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      // FORZAR LOGOUT TEMPORAL - COMENTAR ESTA LÍNEA PARA VOLVER A LA NORMALIDAD
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authUser');
      
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('authUser');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Set token in API service for future requests
        authAPI.setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        
        // Store auth data
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('authUser', JSON.stringify(userData));
        
        // Update state
        setToken(authToken);
        setUser(userData);
        
        // Set token in API service
        authAPI.setToken(authToken);
        
        Alert.alert('¡Éxito!', 'Sesión iniciada correctamente');
      } else {
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.register(name, email, password);
      
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        
        // Store auth data
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('authUser', JSON.stringify(userData));
        
        // Update state
        setToken(authToken);
        setUser(userData);
        
        // Set token in API service
        authAPI.setToken(authToken);
        
        Alert.alert('¡Éxito!', 'Cuenta creada correctamente');
      } else {
        throw new Error(response.message || 'Error al crear la cuenta');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.message || 'Error al crear la cuenta');
    }
  };

  const logout = async () => {
    try {
      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authUser');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      // Clear token from API service
      authAPI.setToken(null);
      
      Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      AsyncStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
