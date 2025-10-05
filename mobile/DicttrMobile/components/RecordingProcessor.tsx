import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { transcriptionAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecordingProcessorProps {
  setLoading: (loading: boolean) => void;
  setTranscriptionText: (text: string) => void;
  setEnhancedText: (text: any) => void;
  setCurrentTranscriptionId?: (id: string | null) => void;
  setSelectedTags?: (tags: any[]) => void;
  setSelectedFolder?: (folder: any) => void;
  setCurrentSubject?: (subject: string) => void;
}

// Función para obtener la configuración de idiomas
const getLanguageConfig = async () => {
  try {
    const transcriptionLanguage = await AsyncStorage.getItem('transcriptionLanguage') || 'es';
    const translationLanguage = await AsyncStorage.getItem('translationLanguage') || 'es';
    
    return {
      transcriptionLanguage,
      translationLanguage
    };
  } catch (error) {
    console.error('Error obteniendo configuración de idiomas:', error);
    return {
      transcriptionLanguage: 'es',
      translationLanguage: 'es'
    };
  }
};

export const requestPermissions = async () => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos permisos de audio para grabar las clases');
    }
  } catch (error) {
    console.error('Error requesting permissions:', error);
  }
};

export const startRecording = async (setRecording: any, setIsRecording: any, setRecordingDuration: any) => {
  try {
    const { status } = await Audio.getPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'No hay permisos de audio');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Configuración específica para M4A mono a 16kHz (formato compatible con Whisper)
    const recordingOptions = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 32000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.MIN,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 32000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/mp4',
        bitsPerSecond: 32000,
      },
    };

    const { recording } = await Audio.Recording.createAsync(recordingOptions);

    setRecording(recording);
    setIsRecording(true);
    setRecordingDuration(0);

    // Timer para mostrar duración
    const interval = setInterval(() => {
      setRecordingDuration((prev: number) => prev + 1);
    }, 1000);

    recording.setOnRecordingStatusUpdate((status) => {
      if (!status.isRecording && interval) {
        clearInterval(interval);
      }
    });

  } catch (error) {
    console.error('Error starting recording:', error);
    Alert.alert('Error', 'No se pudo iniciar la grabación');
  }
};

export const stopRecording = async (recording: any, setIsRecording: any, setRecording: any, setRecordingDuration: any, setRecordings: any) => {
  if (!recording) return;

  try {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    if (uri) {
      const { sound } = await Audio.Sound.createAsync({ uri });
      setRecordings((prev: any[]) => [...prev, { sound, uri }]);
    }

    setRecording(null);
    setRecordingDuration(0);
  } catch (error) {
    console.error('Error stopping recording:', error);
    Alert.alert('Error', 'No se pudo detener la grabación');
  }
};

export const processRecording = async (audioUri: string, { setLoading, setTranscriptionText, setEnhancedText, setCurrentTranscriptionId, setSelectedTags, setSelectedFolder, setCurrentSubject }: RecordingProcessorProps) => {
  setLoading(true);
  try {
    // Obtener configuración de idiomas
    const { transcriptionLanguage, translationLanguage } = await getLanguageConfig();
    console.log(`Idioma de transcripción: ${transcriptionLanguage}, Idioma de traducción: ${translationLanguage}`);
    
    // Enviar audio al backend para transcripción real con configuración de idiomas
    console.log('Enviando audio para transcripción...');
    const response = await transcriptionAPI.uploadAudio(audioUri, 'Nueva grabación', {
      transcriptionLanguage,
      translationLanguage
    });
    console.log('Respuesta completa de la API:', JSON.stringify(response, null, 2));

    if (response.success && response.data.transcription) {
      const transcriptionData = response.data.transcription;

      setTranscriptionText(transcriptionData.original || '');

      // Verificar si la transcripción tiene ID
      console.log('Datos de transcripción recibidos:', transcriptionData);
      console.log('Respuesta completa de la API (data):', response.data);

      // Establecer el ID de la transcripción recién creada
      // El ID puede venir en response.data.id o en transcriptionData.id
      const transcriptionId = response.data.id || transcriptionData.id;

      if (setCurrentTranscriptionId && transcriptionId) {
        console.log('Estableciendo currentTranscriptionId para nueva transcripción:', transcriptionId);
        setCurrentTranscriptionId(transcriptionId);
      } else {
        console.log('No se pudo encontrar el ID de la transcripción en la respuesta');
        console.log('response.data.id:', response.data.id);
        console.log('transcriptionData.id:', transcriptionData.id);
      }

      // Limpiar etiquetas y carpeta antes de establecer la nueva transcripción
      if (setSelectedTags) {
        setSelectedTags([]);
      }
      if (setSelectedFolder) {
        setSelectedFolder(null);
      }
      
      // Inicializar el asunto con el valor devuelto por el backend o un valor vacío
      if (setCurrentSubject) {
        const subjectFromBackend = response.data.subject || '';
        console.log('Asunto recibido del backend:', subjectFromBackend);
        console.log('Respuesta completa para debugging:', JSON.stringify(response.data, null, 2));
        setCurrentSubject(subjectFromBackend);
      }

      setEnhancedText(transcriptionData.enhanced || null);
      Alert.alert('¡Éxito!', 'Grabación procesada y mejorada con IA');
    } else {
      Alert.alert('Error', 'No se pudo transcribir el audio');
    }
  } catch (error) {
    console.error('Error processing recording:', error);
    Alert.alert('Error', 'No se pudo procesar la grabación. Verifica tu conexión.');
  } finally {
    setLoading(false);
  }
};
