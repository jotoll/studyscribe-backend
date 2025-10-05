import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface Recording {
  sound: Audio.Sound;
  uri: string;
}

interface AudioRecorderProps {
  onRecordingProcessed: (uri: string, duration: number) => Promise<void>;
  loading?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingProcessed, loading = false }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos permisos de audio para grabar las clases');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

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
      const recordingOptions: Audio.RecordingOptions = {
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
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Iniciar temporizador de duración
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording && interval) {
          clearInterval(interval);
        }
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      if (uri) {
        const { sound } = await Audio.Sound.createAsync({ uri });
        setRecordings(prev => [...prev, { sound, uri }]);

        // Procesar la grabación
        await onRecordingProcessed(uri, recordingDuration);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.recordingSection}>
      <Text style={styles.timer}>{formatDuration(recordingDuration)}</Text>
      <View style={styles.centerContainer}>
        <Text style={[
          styles.statusText,
          loading ? styles.processingStatus : (isRecording ? styles.recordingStatus : styles.readyStatus)
        ]}>
          {loading ? '🤖 Procesando con IA...' : (isRecording ? '🔴 Grabando...' : 'Listo para grabar')}
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        {/* Botón de grabación principal */}
        <TouchableOpacity
          style={[
            styles.recordBtn,
            isRecording && styles.recordingBtn,
            loading && styles.processingBtn
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={24}
              color="white"
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  recordingSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
    zIndex: 1000,
  },
  timer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28677d',
    minWidth: 50,
    fontVariant: ['tabular-nums'],
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordingStatus: {
    color: '#e27667',
    fontWeight: '600',
  },
  processingStatus: {
    color: '#97447a',
    fontWeight: '600',
  },
  readyStatus: {
    color: '#3ba3a4',
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recordBtn: {
    backgroundColor: '#e27667',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c53030',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  recordingBtn: {
    backgroundColor: '#3ba3a4',
    transform: [{ scale: 1.05 }],
  },
  processingBtn: {
    backgroundColor: '#97447a',
    transform: [{ scale: 0.95 }],
  },
});

export default AudioRecorder;