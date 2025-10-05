import { createClient } from '@supabase/supabase-js';

// Configura Supabase
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

// Versión temporal para desarrollo con Expo Go
// Google Sign-In no funciona con Expo Go, solo con Development Build

export async function signInWithGoogle() {
  throw new Error('Google Sign-In no está disponible en Expo Go. Usa un Development Build para probar Google Sign-In.');
}

export async function signOutFromGoogle() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
}

export async function isSignedIn() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user !== null;
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return false;
  }
}

// Función temporal para desarrollo - login con email/password
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data.user;
  } catch (error) {
    console.error('Error en login con email:', error);
    throw error;
  }
}

// Función temporal para desarrollo - registro con email/password
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data.user;
  } catch (error) {
    console.error('Error en registro con email:', error);
    throw error;
  }
}
