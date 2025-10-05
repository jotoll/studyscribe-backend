import { useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { processRecording } from './RecordingProcessor';

export interface RecordingManagerProps {
  setLoading: (loading: boolean) => void;
  setTranscriptionText: (text: string) => void;
  setEnhancedText: (text: any) => void;
  setCurrentTranscriptionId?: (id: string | null) => void;
  setSelectedTags?: (tags: any[]) => void;
  setSelectedFolder?: (folder: any) => void;
  setCurrentSubject?: (subject: string) => void;
}

export interface UseRecordingManagerReturn {
  recording: Audio.Recording | null;
  isRecording: boolean;
  recordings: any[];
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  handleProcessRecording: (audioUri: string) => Promise<void>;
}

export const useRecordingManager = ({
  setLoading,
  setTranscriptionText,
  setEnhancedText,
  setCurrentTranscriptionId,
  setSelectedTags,
  setSelectedFolder,
  setCurrentSubject
}: RecordingManagerProps): UseRecordingManagerReturn => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos permisos de audio para grabar las clases');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const startRecording = async () => {
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

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

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

        await handleProcessRecording(uri);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const handleProcessRecording = async (audioUri: string) => {
    await processRecording(audioUri, {
      setLoading,
      setTranscriptionText,
      setEnhancedText,
      setCurrentTranscriptionId,
      setSelectedTags,
      setSelectedFolder,
      setCurrentSubject
    });
  };

  return {
    recording,
    isRecording,
    recordings,
    recordingDuration,
    startRecording,
    stopRecording,
    handleProcessRecording
  };
};
