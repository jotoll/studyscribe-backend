import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { transcriptionManagementAPI } from '../services/api';

interface TranscriptionDetail {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  enhanced_text?: any;
  original_text?: string;
  processing_status?: string;
}

type RootStackParamList = {
  TranscriptionDetail: { transcriptionId: string };
};

type TranscriptionDetailRouteProp = RouteProp<RootStackParamList, 'TranscriptionDetail'>;

const TranscriptionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<TranscriptionDetailRouteProp>();
  const { user } = useAuth();

  const [transcription, setTranscription] = useState<TranscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { transcriptionId } = route.params;

  const loadTranscription = async () => {
    try {
      setLoading(true);
      const response = await transcriptionManagementAPI.getTranscription(transcriptionId);

      if (response.success && response.data) {
        // Convertir los datos de la API al tipo TranscriptionDetail
        const apiData = response.data as any;
        const transcriptionDetail: TranscriptionDetail = {
          id: apiData.id || '',
          title: apiData.title || 'Sin título',
          subject: apiData.subject || '',
          created_at: apiData.created_at || new Date().toISOString(),
          updated_at: apiData.updated_at || new Date().toISOString(),
          is_favorite: apiData.is_favorite || false,
          enhanced_text: apiData.enhanced_text,
          original_text: apiData.original_text,
          processing_status: apiData.processing_status
        };
        setTranscription(transcriptionDetail);
      } else {
        Alert.alert('Error', 'No se pudo cargar la transcripción');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading transcription:', error);
      Alert.alert('Error', 'No se pudo cargar la transcripción');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!transcription) return;

    try {
      // Update UI optimistically first
      setTranscription(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);

      // Then make the API call
      const response = await transcriptionManagementAPI.toggleFavorite(
        transcription.id,
        transcription.is_favorite || false
      );

      if (!response.success) {
        // If API call fails, revert the optimistic update
        setTranscription(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
        Alert.alert('Error', 'No se pudo actualizar el favorito');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      setTranscription(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
      Alert.alert('Error', 'No se pudo actualizar el favorito');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (user) {
      loadTranscription();
    }
  }, [user, transcriptionId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A00E0" />
          <Text style={styles.loadingText}>Cargando transcripción...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transcription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={60} color="#e0e0e0" />
          <Text style={styles.errorText}>Transcripción no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#4A00E0" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{transcription.title}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(transcription.created_at)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggleFavorite}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={transcription.is_favorite ? "star" : "star-outline"}
            size={24}
            color={transcription.is_favorite ? "#FFD700" : "#666"}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Subject Badge */}
        <View style={styles.subjectBadge}>
          <Text style={styles.subjectText}>{transcription.subject || ''}</Text>
        </View>

        {/* Enhanced Text Content */}
        {transcription.enhanced_text && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Transcripción Mejorada</Text>
            <View style={styles.textContainer}>
              <Text style={styles.contentText}>
                {typeof transcription.enhanced_text === 'object'
                  ? JSON.stringify(transcription.enhanced_text, null, 2)
                  : transcription.enhanced_text
                }
              </Text>
            </View>
          </View>
        )}

        {/* Original Text */}
        {transcription.original_text && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎵 Transcripción Original</Text>
            <View style={styles.textContainer}>
              <Text style={styles.contentText}>{transcription.original_text}</Text>
            </View>
          </View>
        )}

        {/* Status */}
        {transcription.processing_status && transcription.processing_status !== 'completed' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {transcription.processing_status === 'processing'
                ? '⏳ Procesando...'
                : transcription.processing_status
              }
            </Text>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataTitle}>📋 Información</Text>
          <View style={styles.metadataRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metadataText}>
              Creada: {formatDate(transcription.created_at)}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Ionicons name="refresh-outline" size={16} color="#666" />
            <Text style={styles.metadataText}>
              Actualizada: {formatDate(transcription.updated_at)}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Ionicons name="bookmark-outline" size={16} color="#666" />
            <Text style={styles.metadataText}>
              Estado: {transcription.is_favorite ? 'Favorita' : 'Normal'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subjectBadge: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A00E0',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A00E0',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#fff8e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#fa8c16',
    fontWeight: '500',
  },
  metadataSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default TranscriptionDetailScreen;
