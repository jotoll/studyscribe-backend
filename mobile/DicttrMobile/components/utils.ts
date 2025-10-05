export const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

import { Platform, StatusBar as RNStatusBar } from 'react-native';

export const hideNavigationBar = () => {
  if (Platform.OS === 'android') {
    try {
      // Ocultar barra de navegación en Android
      RNStatusBar.setHidden(true, 'slide');

      // Forzar modo immersive (puede no funcionar en todos los dispositivos)
      // Esta es una aproximación ya que Expo limita el acceso a APIs nativas
      setTimeout(() => {
        RNStatusBar.setHidden(false, 'slide');
        setTimeout(() => RNStatusBar.setHidden(true, 'slide'), 100);
      }, 500);
    } catch (error) {
      console.log('No se pudo ocultar la barra de navegación:', error);
    }
  }
};