import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, transcriptionManagementAPI } from '../services/api';

interface Transcription {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  processing_status?: string;
}

interface TranscriptionFilters {
  subjects: string[];
  favoriteCount: number;
}

const TranscriptionsScreen = () => {
  const { user } = useAuth();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [filters, setFilters] = useState<TranscriptionFilters>({ subjects: [], favoriteCount: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadTranscriptions = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      }

      const response = await transcriptionManagementAPI.getTranscriptions({
        page,
        limit: 20,
        search: searchQuery,
        subject: selectedSubject === 'all' ? '' : selectedSubject,
        favorite: showFavorites ? 'true' : ''
      });
      
      if (response.success) {
        if (page === 1 || isRefresh) {
          setTranscriptions(response.data.transcriptions || []);
        } else {
          setTranscriptions(prev => [...prev, ...(response.data.transcriptions || [])]);
        }
        
        setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
        setCurrentPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      console.error('Error loading transcriptions:', error);
      Alert.alert('Error', 'No se pudieron cargar las transcripciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFilters = async () => {
    try {
      const response = await transcriptionManagementAPI.getFilters();
      if (response.success) {
        setFilters(response.data);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTranscriptions(1, true);
    loadFilters();
  };

  useEffect(() => {
    if (user) {
      loadTranscriptions();
      loadFilters();
    }
  }, [user]);

  // Recargar transcripciones cuando cambian los filtros o búsqueda
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        loadTranscriptions(1, true);
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, selectedSubject, showFavorites]);

  // El filtrado ahora se hace en el backend
  const filteredTranscriptions = transcriptions;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const toggleFavorite = async (transcriptionId: string, isFavorite: boolean) => {
    try {
      await transcriptionManagementAPI.toggleFavorite(transcriptionId, isFavorite);
      setTranscriptions(prev => prev.map(t => 
        t.id === transcriptionId ? { ...t, is_favorite: !isFavorite } : t
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteTranscription = async (transcriptionId: string) => {
    Alert.alert(
      'Eliminar transcripción',
      '¿Estás seguro de que quieres eliminar esta transcripción? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await transcriptionManagementAPI.deleteTranscription(transcriptionId);
              setTranscriptions(prev => prev.filter(t => t.id !== transcriptionId));
              Alert.alert('Éxito', 'Transcripción eliminada correctamente');
            } catch (error) {
              console.error('Error deleting transcription:', error);
              Alert.alert('Error', 'No se pudo eliminar la transcripción');
            }
          },
        },
      ]
    );
  };

  const renderTranscriptionItem = ({ item }: { item: Transcription }) => (
    <View style={styles.transcriptionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.is_favorite && (
            <Ionicons name="star" size={16} color="#FFD700" style={styles.favoriteIcon} />
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            onPress={() => toggleFavorite(item.id, item.is_favorite || false)}
            style={styles.actionButton}
          >
            <Ionicons 
              name={item.is_favorite ? "star" : "star-outline"} 
              size={20} 
              color={item.is_favorite ? "#FFD700" : "#666"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => deleteTranscription(item.id)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.subjectBadge}>
          <Text style={styles.subjectText}>{item.subject || 'General'}</Text>
        </View>
        
        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      
      {item.processing_status && item.processing_status !== 'completed' && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.processing_status === 'processing' ? 'Procesando...' : item.processing_status}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A00E0" />
          <Text style={styles.loadingText}>Cargando transcripciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header elegante */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mis Transcripciones</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTranscriptions.length} {filteredTranscriptions.length === 1 ? 'transcripción' : 'transcripciones'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="time-outline" size={20} color="#4A00E0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar minimalista */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transcripciones..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros elegantes */}
      <View style={styles.filtersSection}>
        <Text style={styles.filtersTitle}>Filtrar por:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, selectedSubject === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedSubject('all')}
          >
            <Text style={[styles.filterText, selectedSubject === 'all' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, showFavorites && styles.filterButtonActive]}
            onPress={() => setShowFavorites(!showFavorites)}
          >
            <Ionicons 
              name={showFavorites ? "star" : "star-outline"} 
              size={16} 
              color={showFavorites ? "white" : "#666"} 
            />
            <Text style={[styles.filterText, showFavorites && styles.filterTextActive]}>
              Favoritas ({filters?.favoriteCount || 0})
            </Text>
          </TouchableOpacity>

          {filters?.subjects?.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[styles.filterButton, selectedSubject === subject && styles.filterButtonActive]}
              onPress={() => setSelectedSubject(subject === selectedSubject ? 'all' : subject)}
            >
              <Text style={[styles.filterText, selectedSubject === subject && styles.filterTextActive]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Transcripciones */}
      <FlatList
        data={filteredTranscriptions}
        renderItem={renderTranscriptionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color="#e0e0e0" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedSubject !== 'all' || showFavorites
                ? 'No se encontraron transcripciones'
                : 'No tienes transcripciones guardadas'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedSubject !== 'all' || showFavorites
                ? 'Intenta con otros filtros de búsqueda'
                : 'Graba tu primera clase para comenzar'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    marginLeft: 16,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  clearButton: {
    padding: 4,
  },
  filtersSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  filtersContainer: {
    backgroundColor: 'white',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#4A00E0',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  transcriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f2f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  favoriteIcon: {
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectBadge: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A00E0',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A00E0',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    marginTop: 8,
    backgroundColor: '#fff8e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  statusText: {
    fontSize: 11,
    color: '#fa8c16',
    fontWeight: '500',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default TranscriptionsScreen;
