import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Idiomas soportados para transcripción (Groq)
const TRANSCRIPTION_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'Inglés', flag: '🇬🇧' },
  { code: 'fr', name: 'Francés', flag: '🇫🇷' },
  { code: 'de', name: 'Alemán', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugués', flag: '🇵🇹' },
  { code: 'ru', name: 'Ruso', flag: '🇷🇺' },
  { code: 'ja', name: 'Japonés', flag: '🇯🇵' },
  { code: 'zh', name: 'Chino', flag: '🇨🇳' },
  { code: 'ar', name: 'Árabe', flag: '🇸🇦' },
];

// Idiomas soportados para traducción (DeepSeek)
const TRANSLATION_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'Inglés', flag: '🇬🇧' },
  { code: 'fr', name: 'Francés', flag: '🇫🇷' },
  { code: 'de', name: 'Alemán', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugués', flag: '🇵🇹' },
  { code: 'ru', name: 'Ruso', flag: '🇷🇺' },
  { code: 'ja', name: 'Japonés', flag: '🇯🇵' },
  { code: 'zh', name: 'Chino', flag: '🇨🇳' },
  { code: 'ar', name: 'Árabe', flag: '🇸🇦' },
];

interface ConfigMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const ConfigMenu: React.FC<ConfigMenuProps> = ({ visible, onClose }) => {
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('es');
  const [translationLanguage, setTranslationLanguage] = useState('es');

  // Cargar configuración guardada al montar el componente
  useEffect(() => {
    loadConfig();
  }, []);

  // Cargar configuración desde AsyncStorage
  const loadConfig = async () => {
    try {
      const savedTranscriptionLang = await AsyncStorage.getItem('transcriptionLanguage');
      const savedTranslationLang = await AsyncStorage.getItem('translationLanguage');

      if (savedTranscriptionLang) {
        setTranscriptionLanguage(savedTranscriptionLang);
      }
      if (savedTranslationLang) {
        setTranslationLanguage(savedTranslationLang);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  // Guardar configuración en AsyncStorage
  const saveConfig = async () => {
    try {
      await AsyncStorage.setItem('transcriptionLanguage', transcriptionLanguage);
      await AsyncStorage.setItem('translationLanguage', translationLanguage);
      
      Alert.alert(
        'Configuración guardada',
        `Idioma de transcripción: ${TRANSCRIPTION_LANGUAGES.find(l => l.code === transcriptionLanguage)?.name}\nIdioma de traducción: ${TRANSLATION_LANGUAGES.find(l => l.code === translationLanguage)?.name}`,
        [{ text: 'OK' }]
      );
      
      onClose();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  // Obtener nombre del idioma por código
  const getLanguageName = (code: string, languages: typeof TRANSCRIPTION_LANGUAGES) => {
    const language = languages.find(l => l.code === code);
    return language ? `${language.flag} ${language.name}` : code;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.menuContainer}>
          {/* Header del menú */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Configuración</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Contenido del menú */}
          <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
            {/* Sección de idioma de transcripción */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Idioma de Transcripción</Text>
              <Text style={styles.sectionDescription}>
                Idioma que Groq usará para transcribir el audio
              </Text>
              
              <View style={styles.currentSelection}>
                <Text style={styles.currentLabel}>Seleccionado:</Text>
                <Text style={styles.currentValue}>
                  {getLanguageName(transcriptionLanguage, TRANSCRIPTION_LANGUAGES)}
                </Text>
              </View>

              <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
                {TRANSCRIPTION_LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      transcriptionLanguage === language.code && styles.selectedOption
                    ]}
                    onPress={() => setTranscriptionLanguage(language.code)}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={styles.languageName}>{language.name}</Text>
                    {transcriptionLanguage === language.code && (
                      <Ionicons name="checkmark" size={20} color="#3ba3a4" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sección de idioma de traducción */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Idioma de Traducción</Text>
              <Text style={styles.sectionDescription}>
                Idioma al que DeepSeek traducirá el texto mejorado
              </Text>
              
              <View style={styles.currentSelection}>
                <Text style={styles.currentLabel}>Seleccionado:</Text>
                <Text style={styles.currentValue}>
                  {getLanguageName(translationLanguage, TRANSLATION_LANGUAGES)}
                </Text>
              </View>

              <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
                {TRANSLATION_LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      translationLanguage === language.code && styles.selectedOption
                    ]}
                    onPress={() => setTranslationLanguage(language.code)}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={styles.languageName}>{language.name}</Text>
                    {translationLanguage === language.code && (
                      <Ionicons name="checkmark" size={20} color="#3ba3a4" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Botón de guardar */}
          <View style={styles.menuFooter}>
            <TouchableOpacity style={styles.saveButton} onPress={saveConfig}>
              <Text style={styles.saveButtonText}>Guardar Configuración</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Hook para usar la configuración en otros componentes
export const useConfig = () => {
  const [config, setConfig] = useState({
    transcriptionLanguage: 'es',
    translationLanguage: 'es',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedTranscriptionLang = await AsyncStorage.getItem('transcriptionLanguage');
      const savedTranslationLang = await AsyncStorage.getItem('translationLanguage');

      setConfig({
        transcriptionLanguage: savedTranscriptionLang || 'es',
        translationLanguage: savedTranslationLang || 'es',
      });
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  return config;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  menuContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  currentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 8,
  },
  currentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3ba3a4',
  },
  languageList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  languageFlag: {
    fontSize: 18,
    marginRight: 12,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  menuFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  saveButton: {
    backgroundColor: '#3ba3a4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfigMenu;