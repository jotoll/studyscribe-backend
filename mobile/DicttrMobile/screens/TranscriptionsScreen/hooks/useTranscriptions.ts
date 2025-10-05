import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { transcriptionManagementAPI, folderAPI, Folder } from '../../../services/api';
import { Transcription, TranscriptionFilters, Tag, TranscriptionTags } from '../types';

export const useTranscriptions = () => {
  const { user } = useAuth();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  const loadTranscriptions = useCallback(async (page = 1, isRefresh = false, filters: any = {}) => {
    try {
      if (page === 1 && !filters?.searchQuery && !filters?.selectedSubject &&
          !filters?.showFavorites && !filters?.selectedFolder && filters?.selectedTags?.length === 0) {
        setLoading(true);
      } else if (page === 1) {
        setIsSearching(true);
      }

      let response;

      if (filters?.selectedFolder) {
        response = await folderAPI.getFolderTranscriptions(filters.selectedFolder, {
          page,
          limit: 20,
          search: filters?.searchQuery || '',
          subject: filters?.selectedSubject === 'all' ? '' : filters?.selectedSubject || '',
          favorite: filters?.showFavorites ? 'true' : '',
        });
      } else {
        response = await transcriptionManagementAPI.getTranscriptions({
          page,
          limit: 20,
          search: filters?.searchQuery || '',
          subject: filters?.selectedSubject === 'all' ? '' : filters?.selectedSubject || '',
          favorite: filters?.showFavorites ? 'true' : '',
        });
      }

      if (response.success) {
        if (page === 1 || isRefresh) {
          setTranscriptions(response.data.transcriptions || []);
        } else {
          setTranscriptions(prev => [...prev, ...(response.data.transcriptions || [])]);
        }

        setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
        setCurrentPage(response.data.pagination.currentPage);
      }

      return response.data.transcriptions || [];
    } catch (error: any) {
      console.error('Error loading transcriptions:', error);

      if (error.response?.status === 404 && filters?.selectedFolder) {
        console.log('Carpeta no encontrada, reseteando selección...');
        return [];
      }

      Alert.alert('Error', 'No se pudieron cargar las transcripciones');
      return [];
    } finally {
      setLoading(false);
      setIsSearching(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback((filters: any) => {
    setRefreshing(true);
    loadTranscriptions(1, true, filters);
  }, [loadTranscriptions]);

  const toggleFavorite = useCallback(async (transcriptionId: string, isFavorite: boolean) => {
    try {
      setTranscriptions(prev => prev.map(t =>
        t.id === transcriptionId ? { ...t, is_favorite: !isFavorite } : t
      ));

      const response = await transcriptionManagementAPI.toggleFavorite(transcriptionId, isFavorite);

      if (!response.success) {
        setTranscriptions(prev => prev.map(t =>
          t.id === transcriptionId ? { ...t, is_favorite: isFavorite } : t
        ));
        Alert.alert('Error', 'No se pudo actualizar el favorito');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setTranscriptions(prev => prev.map(t =>
        t.id === transcriptionId ? { ...t, is_favorite: isFavorite } : t
      ));
      Alert.alert('Error', 'No se pudo actualizar el favorito');
    }
  }, []);

  const deleteTranscription = useCallback(async (transcriptionId: string) => {
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
  }, []);

  return {
    transcriptions,
    loading,
    refreshing,
    isSearching,
    currentPage,
    hasMore,
    loadTranscriptions,
    onRefresh,
    toggleFavorite,
    deleteTranscription,
    setTranscriptions,
    searchTimeout,
    setSearchTimeout
  };
};