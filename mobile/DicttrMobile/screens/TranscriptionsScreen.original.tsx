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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, transcriptionManagementAPI, folderAPI, Folder } from '../services/api';

interface Transcription {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  processing_status?: string;
  folder_id?: string;
}

interface TranscriptionFilters {
  subjects: string[];
  favoriteCount: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

const TranscriptionsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [filters, setFilters] = useState<TranscriptionFilters>({ subjects: [], favoriteCount: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCalendar, setShowCalendar] = useState(false);
  const [datesWithTranscriptions, setDatesWithTranscriptions] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isCalendarFilterActive, setIsCalendarFilterActive] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagsFilter, setShowTagsFilter] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState('#666666');
  const [creatingTag, setCreatingTag] = useState(false);
  const [transcriptionTags, setTranscriptionTags] = useState<{[key: string]: Tag[]}>({});
  const [showTagAssignment, setShowTagAssignment] = useState(false);
  const [selectedTranscriptionForTags, setSelectedTranscriptionForTags] = useState<string | null>(null);
  const [managingTags, setManagingTags] = useState(false);

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#f0f2f5'); // Color pastel por defecto
  const [creatingFolder, setCreatingFolder] = useState(false);
  
  // Colores pastel para el selector
  const pastelColors = [
    '#f0f2f5', // Gris azulado claro (default)
    '#ffd6e7', // Rosa pastel
    '#d4f1f9', // Azul pastel
    '#e2f0cb', // Verde pastel
    '#ffe4c2', // Naranja pastel
    '#e6d7f7', // Lila pastel
  ];
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null);
  const [movingTranscription, setMovingTranscription] = useState(false);
  const [longPressFolderId, setLongPressFolderId] = useState<string | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [folderMenuPosition, setFolderMenuPosition] = useState({ x: 0, y: 0 });
  const [deletingFolder, setDeletingFolder] = useState(false);

  // Estados para el menú de eliminar etiquetas
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [longPressTagId, setLongPressTagId] = useState<string | null>(null);
  const [tagMenuPosition, setTagMenuPosition] = useState({ x: 0, y: 0 });
  const [deletingTag, setDeletingTag] = useState(false);
  
  // Estados para el menú flotante de acciones de transcripción
  const [showTranscriptionMenu, setShowTranscriptionMenu] = useState(false);
  const [selectedTranscriptionForMenu, setSelectedTranscriptionForMenu] = useState<Transcription | null>(null);
  const [transcriptionMenuPosition, setTranscriptionMenuPosition] = useState({ x: 0, y: 0 });

  const loadTranscriptions = async (page = 1, isRefresh = false) => {
    try {
      // Solo mostrar loading completo en carga inicial o refresh, no en búsquedas
      if (page === 1 && !searchQuery && !selectedSubject && !showFavorites && !selectedFolder && selectedTags.length === 0) {
        setLoading(true);
      } else if (page === 1) {
        // Para búsquedas, solo mostrar indicador sutil
        setIsSearching(true);
      }

      let response;
      
      // Si hay una carpeta seleccionada, usar la API específica de carpetas
      if (selectedFolder) {
        response = await folderAPI.getFolderTranscriptions(selectedFolder, {
          page,
          limit: 20,
          search: searchQuery,
          subject: selectedSubject === 'all' ? '' : selectedSubject,
          favorite: showFavorites ? 'true' : '',
          // tags: selectedTags.length > 0 ? selectedTags.join(',') : ''
        });
      } else {
        // Si no hay carpeta seleccionada, usar la API normal
        response = await transcriptionManagementAPI.getTranscriptions({
          page,
          limit: 20,
          search: searchQuery,
          subject: selectedSubject === 'all' ? '' : selectedSubject,
          favorite: showFavorites ? 'true' : '',
          // tags: selectedTags.length > 0 ? selectedTags.join(',') : ''
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
      
      // Devolver las transcripciones cargadas para poder usarlas en el filtrado
      return response.data.transcriptions || [];
    } catch (error: any) {
      console.error('Error loading transcriptions:', error);
      
      // Si el error es 404 y hay una carpeta seleccionada, probablemente la carpeta fue eliminada
      if (error.response?.status === 404 && selectedFolder) {
        console.log('Carpeta no encontrada (probablemente eliminada), reseteando selección...');
        setSelectedFolder(null);
        // Recargar todas las transcripciones
        return await loadTranscriptions(1, true);
      }
      
      Alert.alert('Error', 'No se pudieron cargar las transcripciones');
      return [];
    } finally {
      setLoading(false);
      setIsSearching(false);
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

  const loadTranscriptionDates = async () => {
    try {
      console.log('Loading transcription dates...');
      const response = await transcriptionManagementAPI.getTranscriptionDates();
      console.log('Transcription dates response:', response);
      if (response.success && response.data && response.data.dates) {
        console.log('Setting dates with transcriptions:', response.data.dates);
        console.log('Number of dates:', response.data.dates.length);
        setDatesWithTranscriptions(response.data.dates);
      } else {
        console.log('No success in transcription dates response or no dates');
        setDatesWithTranscriptions([]);
      }
    } catch (error) {
      console.error('Error loading transcription dates:', error);
      setDatesWithTranscriptions([]);
    }
  };

  const loadFolders = async () => {
    try {
      setFoldersLoading(true);
      const response = await folderAPI.getFolders();
      if (response.success && response.data.folders) {
        setFolders(response.data.folders);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
    } finally {
      setFoldersLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      setTagsLoading(true);
      console.log('[TAGS] Loading tags...');
      const response = await transcriptionManagementAPI.getTags();
      console.log('[TAGS] Response:', response);
      if (response.success && response.data.tags) {
        console.log('[TAGS] Tags loaded successfully:', response.data.tags.length, 'tags');
        setTags(response.data.tags);
      } else {
        console.log('[TAGS] Response not successful or no tags data');
      }
    } catch (error: any) {
      console.error('[TAGS] Error loading tags:', error);
      console.log('[TAGS] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      Alert.alert('Error', 'No se pudieron cargar las etiquetas');
    } finally {
      setTagsLoading(false);
    }
  };

  const loadTranscriptionTags = async (transcriptionId: string) => {
    try {
      const response = await transcriptionManagementAPI.getTranscriptionTags(transcriptionId);
      if (response.success && response.data.tags) {
        setTranscriptionTags(prev => ({
          ...prev,
          [transcriptionId]: response.data.tags
        }));
      }
    } catch (error) {
      console.error('Error loading transcription tags:', error);
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    // Actualizar el estado inmediatamente para feedback visual
    setSelectedFolder(folderId);
    // Forzar un re-render inmediato
    setForceUpdate(prev => prev + 1);
    // El useEffect se encargará de recargar las transcripciones automáticamente
  };

  const handleTagSelect = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
    setShowTagsFilter(false);
  };

  const createNewFolder = async () => {
    console.log('📁 Botón "Nueva Carpeta" pulsado');
    setShowNewFolderModal(true);
    setNewFolderName('');
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('Error', 'El nombre de la etiqueta no puede estar vacío');
      return;
    }

    setCreatingTag(true);
    try {
      const response = await transcriptionManagementAPI.createTag({
        name: newTagName.trim(),
        color: selectedTagColor
      });

      if (response.success) {
        // No cerrar el modal, solo resetear el formulario para crear otra etiqueta
        setNewTagName('');
        setSelectedTagColor('#666666'); // Resetear a color por defecto
        loadTags(); // Recargar lista de etiquetas
      } else {
        Alert.alert('Error', 'No se pudo crear la etiqueta');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('Error', 'No se pudo crear la etiqueta');
    } finally {
      setCreatingTag(false);
    }
  };

  const assignTagToTranscription = async (transcriptionId: string, tagId: string) => {
    setManagingTags(true);
    try {
      const response = await transcriptionManagementAPI.assignTagToTranscription(transcriptionId, tagId);
      
      if (response.success) {
        // Recargar las etiquetas de esta transcripción
        await loadTranscriptionTags(transcriptionId);
      } else {
        Alert.alert('Error', 'No se pudo asignar la etiqueta');
      }
    } catch (error) {
      console.error('Error assigning tag:', error);
      Alert.alert('Error', 'No se pudo asignar la etiqueta');
    } finally {
      setManagingTags(false);
    }
  };

  const removeTagFromTranscription = async (transcriptionId: string, tagId: string) => {
    setManagingTags(true);
    try {
      const response = await transcriptionManagementAPI.removeTagFromTranscription(transcriptionId, tagId);
      
      if (response.success) {
        // Recargar las etiquetas de esta transcripción
        await loadTranscriptionTags(transcriptionId);
      } else {
        Alert.alert('Error', 'No se pudo quitar la etiqueta');
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      Alert.alert('Error', 'No se pudo quitar la etiqueta');
    } finally {
      setManagingTags(false);
    }
  };

  const handleManageTags = (transcriptionId: string) => {
    setSelectedTranscriptionForTags(transcriptionId);
    setShowTagAssignment(true);
    // Cargar las etiquetas de esta transcripción si no están cargadas
    if (!transcriptionTags[transcriptionId]) {
      loadTranscriptionTags(transcriptionId);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'El nombre de la carpeta no puede estar vacío');
      return;
    }

    setCreatingFolder(true);
    try {
      const response = await folderAPI.createFolder({
        name: newFolderName.trim(),
        color: selectedColor,
        icon: selectedIcon
      });

      if (response.success) {
        console.log('✅ Carpeta creada exitosamente:', response.data);
        // No cerrar el modal, solo resetear el formulario para crear otra carpeta
        setNewFolderName('');
        setSelectedIcon('folder'); // Resetear a icono por defecto
        setSelectedColor('#f0f2f5'); // Resetear a color por defecto
        loadFolders(); // Recargar lista de carpetas
      } else {
        console.error('❌ Error en respuesta API:', response);
        Alert.alert('Error', 'No se pudo crear la carpeta');
      }
    } catch (error) {
      console.error('❌ Error creating folder:', error);
      Alert.alert('Error', 'No se pudo crear la carpeta');
    } finally {
      setCreatingFolder(false);
    }
  };

  const moveTranscriptionToFolder = async (transcriptionId: string, folderId: string | null) => {
    setMovingTranscription(true);
    try {
      const response = await folderAPI.moveTranscriptionToFolder(transcriptionId, folderId);
      
      if (response.success) {
        Alert.alert('Éxito', response.message || 'Transcripción movida correctamente');
        // Recargar las transcripciones para reflejar el cambio
        loadTranscriptions(1, true);
      } else {
        Alert.alert('Error', response.message || 'No se pudo mover la transcripción');
      }
    } catch (error) {
      console.error('❌ Error moving transcription:', error);
      Alert.alert('Error', 'No se pudo mover la transcripción');
    } finally {
      setMovingTranscription(false);
      setShowMoveToFolderModal(false);
      setSelectedTranscriptionId(null);
    }
  };

  const handleMoveToFolder = (transcriptionId: string) => {
    setSelectedTranscriptionId(transcriptionId);
    setShowMoveToFolderModal(true);
  };

  const handleFolderLongPress = (folderId: string, event: any) => {
    // Obtener posición del toque para mostrar el menú en el lugar correcto
    const { pageX, pageY } = event.nativeEvent;
    setLongPressFolderId(folderId);
    setFolderMenuPosition({ x: pageX, y: pageY });
    
    // Mostrar el menú después de 0.5 segundos
    setTimeout(() => {
      // Usar una referencia directa al folderId para evitar problemas de closure
      setShowFolderMenu(true);
    }, 500);
  };

  const handleFolderPressOut = (folderId: string) => {
    // Solo cancelar el long press si el usuario levanta el dedo antes de que aparezca el menú
    if (!showFolderMenu) {
      setLongPressFolderId(null);
    }
  };

  const deleteFolder = async (folderId: string) => {
    setDeletingFolder(true);
    try {
      const response = await folderAPI.deleteFolder(folderId);
      
      if (response.success) {
        Alert.alert('Éxito', 'Carpeta eliminada correctamente');
        // Recargar la lista de carpetas
        loadFolders();
        // Si la carpeta eliminada estaba seleccionada, volver a "Todas"
        if (selectedFolder === folderId) {
          setSelectedFolder(null);
          loadTranscriptions(1, true);
        }
      } else {
        Alert.alert('Error', response.message || 'No se pudo eliminar la carpeta');
      }
    } catch (error) {
      console.error('❌ Error deleting folder:', error);
      Alert.alert('Error', 'No se pudo eliminar la carpeta');
    } finally {
      setDeletingFolder(false);
      setShowFolderMenu(false);
      setLongPressFolderId(null);
    }
  };

  const confirmDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    Alert.alert(
      'Eliminar carpeta',
      `¿Estás seguro de que quieres eliminar la carpeta "${folder?.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteFolder(folderId),
        },
      ]
    );
  };

  const handleTagLongPress = (tagId: string, event: any) => {
    // Obtener posición del toque para mostrar el menú en el lugar correcto
    const { pageX, pageY } = event.nativeEvent;
    setLongPressTagId(tagId);
    setTagMenuPosition({ x: pageX, y: pageY });

    // Mostrar el menú después de 0.5 segundos
    setTimeout(() => {
      // Usar una referencia directa al tagId para evitar problemas de closure
      setShowTagMenu(true);
    }, 500);
  };

  const handleTagPressOut = (tagId: string) => {
    // Solo cancelar el long press si el usuario levanta el dedo antes de que aparezca el menú
    if (!showTagMenu) {
      setLongPressTagId(null);
    }
  };

  const deleteTag = async (tagId: string) => {
    setDeletingTag(true);
    try {
      const response = await transcriptionManagementAPI.deleteTag(tagId);

      if (response.success) {
        Alert.alert('Éxito', 'Etiqueta eliminada correctamente');
        // Recargar la lista de etiquetas
        loadTags();
        // Si la etiqueta eliminada estaba seleccionada, quitarla del filtro
        if (selectedTags.includes(tagId)) {
          setSelectedTags(prev => prev.filter(id => id !== tagId));
        }
      } else {
        Alert.alert('Error', response.message || 'No se pudo eliminar la etiqueta');
      }
    } catch (error) {
      console.error('❌ Error deleting tag:', error);
      Alert.alert('Error', 'No se pudo eliminar la etiqueta');
    } finally {
      setDeletingTag(false);
      setShowTagMenu(false);
      setLongPressTagId(null);
    }
  };

  const confirmDeleteTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    Alert.alert(
      'Eliminar etiqueta',
      `¿Estás seguro de que quieres eliminar la etiqueta "${tag?.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteTag(tagId),
        },
      ]
    );
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  useEffect(() => {
    if (user) {
      loadTranscriptions();
      loadFilters();
      loadTranscriptionDates();
      loadFolders();
      loadTags();
    }
  }, [user]);

  // Cargar etiquetas para todas las transcripciones cuando se actualiza la lista
  useEffect(() => {
    if (transcriptions.length > 0) {
      transcriptions.forEach(transcription => {
        if (!transcriptionTags[transcription.id]) {
          loadTranscriptionTags(transcription.id);
        }
      });
    }
  }, [transcriptions]);

  // Recargar transcripciones cuando cambian los filtros, búsqueda, carpeta seleccionada o etiquetas
  useEffect(() => {
    if (user) {
      // Limpiar timeout anterior si existe
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Crear nuevo timeout para búsqueda con debouncing
      const timeoutId = setTimeout(() => {
        loadTranscriptions(1, true);
      }, 500); // Debounce de 500ms

      setSearchTimeout(timeoutId);

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [searchQuery, selectedSubject, showFavorites, sortOrder, selectedFolder, selectedTags]);

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} ${timeStr}`;
  };

  const openTranscriptionInEditor = async (transcriptionId: string) => {
    try {
      setLoading(true);
      const response = await transcriptionManagementAPI.getTranscription(transcriptionId);

      if (response.success && response.data) {
        // Navegar a MainScreen con los datos de la transcripción
        navigation.navigate('Main', {
          transcriptionId: transcriptionId
        } as any);
      } else {
        Alert.alert('Error', 'No se pudo cargar la transcripción para editar');
      }
    } catch (error) {
      console.error('Error opening transcription in editor:', error);
      Alert.alert('Error', 'No se pudo abrir la transcripción para editar');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (transcriptionId: string, isFavorite: boolean) => {
    try {
      // Update UI optimistically first
      setTranscriptions(prev => prev.map(t =>
        t.id === transcriptionId ? { ...t, is_favorite: !isFavorite } : t
      ));

      // Then make the API call
      const response = await transcriptionManagementAPI.toggleFavorite(transcriptionId, isFavorite);

      if (!response.success) {
        // If API call fails, revert the optimistic update
        setTranscriptions(prev => prev.map(t =>
          t.id === transcriptionId ? { ...t, is_favorite: isFavorite } : t
        ));
        Alert.alert('Error', 'No se pudo actualizar el favorito');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      setTranscriptions(prev => prev.map(t =>
        t.id === transcriptionId ? { ...t, is_favorite: isFavorite } : t
      ));
      Alert.alert('Error', 'No se pudo actualizar el favorito');
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

  const renderTranscriptionItem = ({ item }: { item: Transcription }) => {
    // Obtener información de la carpeta si existe
    const folderInfo = item.folder_id ? folders.find(f => f.id === item.folder_id) : null;
    
    return (
      <TouchableOpacity
        style={styles.transcriptionCard}
        onPress={() => {
          // Navigate to block editor with transcription content
          openTranscriptionInEditor(item.id);
        }}
        onLongPress={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          setSelectedTranscriptionForMenu(item);
          setTranscriptionMenuPosition({ x: pageX, y: pageY });
          
          // Mostrar el menú después de 0.5 segundos
          setTimeout(() => {
            setShowTranscriptionMenu(true);
          }, 500);
        }}
        onPressOut={() => {
          // Solo cancelar el long press si el usuario levanta el dedo antes de que aparezca el menú
          if (!showTranscriptionMenu) {
            setSelectedTranscriptionForMenu(null);
          }
        }}
        delayLongPress={500}
      >
        {/* Fecha y carpeta en la parte superior */}
        <View style={styles.topInfoContainer}>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={12} color="#666" />
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
          
          {folderInfo && (
            <View style={[styles.folderInfoContainer, { backgroundColor: folderInfo.color || '#f0f2f5' }]}>
              <Ionicons name={folderInfo.icon as any || "folder"} size={12} color="#666" />
              <Text style={styles.folderInfoText} numberOfLines={1}>
                {folderInfo.name}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            {item.is_favorite && (
              <Ionicons 
                name="star" 
                size={16} 
                color="#FFD700" 
                style={styles.favoriteIcon}
              />
            )}
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          {item.subject && item.subject !== 'general' && (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{item.subject}</Text>
            </View>
          )}
        </View>

        {/* Mostrar etiquetas de la transcripción con wrap automático */}
        {transcriptionTags[item.id] && transcriptionTags[item.id].length > 0 && (
          <View style={styles.tagsContainer}>
            <View style={styles.tagsContent}>
              {transcriptionTags[item.id].map((tag) => (
                <View 
                  key={tag.id} 
                  style={[styles.tagBadge, { backgroundColor: tag.color + '20' }]}
                >
                  <Text style={[styles.tagText, { color: tag.color }]} numberOfLines={1}>
                    #{tag.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {item.processing_status && item.processing_status !== 'completed' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.processing_status === 'processing' ? 'Procesando...' : item.processing_status}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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


      {/* Línea 1: Filtros de Carpetas */}
      <View style={styles.filterRow}>
        <View style={styles.filterHeader}>
          <TouchableOpacity
            style={styles.filterIconContainer}
            onPress={createNewFolder}
          >
            <Ionicons name="folder-outline" size={18} color="#97447a" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterContent}
          >
            {/* Filtros de carpetas */}
            <TouchableOpacity
              style={[styles.filterButton, selectedFolder === null && styles.filterButtonActive]}
              onPress={() => handleFolderSelect(null)}
            >
              <Ionicons name="folder-outline" size={14} color={selectedFolder === null ? "#333" : "#666"} />
              <Text style={[styles.filterText, selectedFolder === null && styles.filterTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>

            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={[
                  styles.filterButton,
                  { backgroundColor: folder.color + '20' },
                  selectedFolder === folder.id && styles.filterButtonActive
                ]}
                onPress={() => handleFolderSelect(folder.id)}
                onLongPress={(event) => handleFolderLongPress(folder.id, event)}
                onPressOut={() => handleFolderPressOut(folder.id)}
                delayLongPress={500}
                delayPressIn={0}
              >
                <Ionicons
                  name={folder.icon as any || "folder"}
                  size={14}
                  color={selectedFolder === folder.id ? "#333" : "#666"}
                />
                <Text style={[styles.filterText, selectedFolder === folder.id && styles.filterTextActive]}>
                  {folder.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Línea 2: Filtros de Etiquetas */}
      <View style={styles.filterRow}>
        <View style={styles.filterHeader}>
          <TouchableOpacity
            style={styles.filterIconContainer}
            onPress={() => setShowTagManager(true)}
          >
            <Ionicons name="pricetag-outline" size={18} color="#28677d" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterContent}
          >
            {/* Filtros de etiquetas */}
            <TouchableOpacity
              style={[styles.filterButton, selectedTags.length === 0 && styles.filterButtonActive]}
              onPress={clearTagFilters}
            >
              <Ionicons name="pricetag-outline" size={14} color={selectedTags.length === 0 ? "#333" : "#666"} />
              <Text style={[styles.filterText, selectedTags.length === 0 && styles.filterTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>

            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.filterButton,
                  { backgroundColor: tag.color + '20' },
                  selectedTags.includes(tag.id) && styles.filterButtonActive
                ]}
                onPress={() => handleTagSelect(tag.id)}
                onLongPress={(event) => handleTagLongPress(tag.id, event)}
                onPressOut={() => handleTagPressOut(tag.id)}
                delayLongPress={500}
                delayPressIn={0}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={selectedTags.includes(tag.id) ? "#333" : "#666"}
                />
                <Text style={[
                  styles.filterText,
                  selectedTags.includes(tag.id) && styles.filterTextActive
                ]}>
                  #{tag.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Línea 3: Filtros Generales */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContent}
        >
          {/* Botón de filtros generales */}
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setSelectedSubject('all')}
          >
            <Ionicons name="filter" size={18} color="#666" />
          </TouchableOpacity>

          {/* Filtros adicionales */}
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
              size={14}
              color={showFavorites ? "#333" : "#666"}
            />
            <Text style={[styles.filterText, showFavorites && styles.filterTextActive]}>
              Favoritas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, isCalendarFilterActive && styles.filterButtonActive]}
            onPress={() => {
              setShowDatePicker(!showDatePicker);
              // Si se desactiva el calendario, recargar todas las transcripciones
              if (showDatePicker) {
                loadTranscriptions(1, true);
                setIsCalendarFilterActive(false);
              }
            }}
          >
            <Ionicons
              name={isCalendarFilterActive ? "calendar" : "calendar-outline"}
              size={14}
              color={isCalendarFilterActive ? "#333" : "#666"}
            />
            <Text style={[styles.filterText, isCalendarFilterActive && styles.filterTextActive]}>
              Calendario
            </Text>
          </TouchableOpacity>

          {filters?.subjects?.filter(subject => subject !== 'general').map((subject) => (
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


      {/* Calendario visual tipo Booking (menú flotante) */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Seleccionar días</Text>
            
            {/* Header del calendario con navegación */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                style={styles.calendarNavButton}
                onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              >
                <Ionicons name="chevron-back" size={20} color="#4A00E0" />
              </TouchableOpacity>
              
              <Text style={styles.calendarMonthText}>
                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity 
                style={styles.calendarNavButton}
                onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              >
                <Ionicons name="chevron-forward" size={20} color="#4A00E0" />
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View style={styles.weekDaysContainer}>
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            {/* Grid del calendario */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: 42 }, (_, index) => {
                const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const startingDayOfWeek = firstDayOfMonth.getDay();
                const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
                
                const dayNumber = index - adjustedStartingDay + 1;
                const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                
                const dateString = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
                const hasTranscription = datesWithTranscriptions.includes(dateString);
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.calendarDay,
                      hasTranscription && styles.calendarDayWithTranscription,
                      selectedDays.includes(dateString) && styles.calendarDaySelected
                    ]}
                    onPress={() => {
                      if (dayNumber > 0 && dayNumber <= daysInMonth) {
                        setSelectedDays(prev => 
                          prev.includes(dateString) 
                            ? prev.filter(d => d !== dateString)
                            : [...prev, dateString]
                        );
                      }
                    }}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      hasTranscription && styles.calendarDayTextWithTranscription,
                      selectedDays.includes(dateString) && styles.calendarDayTextSelected,
                      (dayNumber <= 0 || dayNumber > daysInMonth) && styles.calendarDayTextEmpty
                    ]}>
                      {dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Leyenda */}
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, styles.legendColorTranscription]} />
                <Text style={styles.legendText}>Días con transcripciones</Text>
              </View>
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity 
                style={[styles.datePickerButton, styles.datePickerButtonCancel]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.datePickerButton, styles.datePickerButtonApply]}
                onPress={() => {
                  // Filtrar transcripciones por los días seleccionados
                  if (selectedDays.length > 0) {
                    console.log('Días seleccionados:', selectedDays);
                    
                    // Primero recargar todas las transcripciones para tener datos frescos
                    loadTranscriptions(1, true).then((freshTranscriptions) => {
                      // Luego filtrar las transcripciones cargadas (usando los datos frescos)
                      const filtered = freshTranscriptions.filter(transcription => {
                        // Convertir la fecha de la transcripción a formato YYYY-MM-DD
                        const transcriptionDate = new Date(transcription.created_at);
                        const formattedDate = transcriptionDate.toISOString().split('T')[0];
                        console.log('Comparando:', formattedDate, 'con días seleccionados:', selectedDays);
                        
                        const isMatch = selectedDays.includes(formattedDate);
                        console.log('¿Coincide?', isMatch);
                        
                        return isMatch;
                      });
                      
                      console.log('Transcripciones filtradas:', filtered.length);
                      setTranscriptions(filtered);
                      setForceUpdate(prev => prev + 1);
                      setIsCalendarFilterActive(true); // Activar el indicador del botón
                    });
                  } else {
                    // Si no hay días seleccionados, recargar todas las transcripciones
                    console.log('Recargando todas las transcripciones');
                    loadTranscriptions(1, true);
                    setIsCalendarFilterActive(false); // Desactivar el indicador del botón
                  }
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.datePickerButtonTextApply}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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

      {/* Modal para crear nueva carpeta - Ajustado para mayor tamaño */}
      {showNewFolderModal && (
        <Modal
          visible={showNewFolderModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNewFolderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.largeModalContainer}>
              <View style={styles.largeModalHeader}>
                <Text style={styles.largeModalTitle}>Nueva Carpeta</Text>
                <TouchableOpacity onPress={() => setShowNewFolderModal(false)} style={styles.largeCloseButton}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.largeModalContent}>
                <Text style={styles.largeModalSubtitle}>Ingresa el nombre de la nueva carpeta</Text>

                <TextInput
                  style={styles.largeModalInput}
                  placeholder="Nombre de la carpeta"
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  maxLength={50}
                  placeholderTextColor="#999"
                  autoFocus={true}
                />

                {/* Selector de iconos */}
                <Text style={styles.largeIconSelectorTitle}>Seleccionar icono:</Text>
                <View style={styles.largeIconSelector}>
                  <TouchableOpacity
                    style={[styles.largeIconOption, selectedIcon === 'folder' && styles.largeIconOptionSelected]}
                    onPress={() => setSelectedIcon('folder')}
                  >
                    <Ionicons name="folder" size={32} color={selectedIcon === 'folder' ? '#3ba3a4' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.largeIconOption, selectedIcon === 'book' && styles.largeIconOptionSelected]}
                    onPress={() => setSelectedIcon('book')}
                  >
                    <Ionicons name="book" size={32} color={selectedIcon === 'book' ? '#3ba3a4' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.largeIconOption, selectedIcon === 'school' && styles.largeIconOptionSelected]}
                    onPress={() => setSelectedIcon('school')}
                  >
                    <Ionicons name="school" size={32} color={selectedIcon === 'school' ? '#3ba3a4' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.largeIconOption, selectedIcon === 'document' && styles.largeIconOptionSelected]}
                    onPress={() => setSelectedIcon('document')}
                  >
                    <Ionicons name="document" size={32} color={selectedIcon === 'document' ? '#3ba3a4' : '#666'} />
                  </TouchableOpacity>
                </View>

                {/* Selector de colores */}
                <Text style={styles.largeColorSelectorTitle}>Seleccionar color:</Text>
                <View style={styles.largeColorSelector}>
                  {pastelColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.largeColorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.largeColorOptionSelected
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={20} color="#333" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.largeModalFooter}>
                <TouchableOpacity
                  style={[styles.largeModalButton, styles.largeModalButtonCancel]}
                  onPress={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                  }}
                  disabled={creatingFolder}
                >
                  <Text style={styles.largeModalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.largeModalButton, styles.largeModalButtonCreate, !newFolderName.trim() && styles.largeModalButtonDisabled]}
                  onPress={handleCreateFolder}
                  disabled={creatingFolder || !newFolderName.trim()}
                >
                  {creatingFolder ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.largeModalButtonTextCreate}>Crear</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal para mover transcripción a carpeta */}
      {showMoveToFolderModal && selectedTranscriptionId && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Mover a Carpeta</Text>
            <Text style={styles.modalSubtitle}>Selecciona la carpeta destino</Text>
            
            <ScrollView style={styles.folderList} contentContainerStyle={styles.folderListContent}>
              <TouchableOpacity
                style={[styles.folderItem, !selectedFolder && styles.folderItemSelected]}
                onPress={() => moveTranscriptionToFolder(selectedTranscriptionId, null)}
                disabled={movingTranscription}
              >
                <Ionicons name="folder-outline" size={20} color="#666" />
                <Text style={[styles.folderItemText, !selectedFolder && styles.folderItemTextSelected]}>
                  Todas las transcripciones
                </Text>
              </TouchableOpacity>
              
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[styles.folderItem, selectedFolder === folder.id && styles.folderItemSelected]}
                  onPress={() => moveTranscriptionToFolder(selectedTranscriptionId, folder.id)}
                  disabled={movingTranscription}
                >
                  <Ionicons name={folder.icon as any || "folder"} size={20} color="#666" />
                  <Text style={[styles.folderItemText, selectedFolder === folder.id && styles.folderItemTextSelected]}>
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => {
                setShowMoveToFolderModal(false);
                setSelectedTranscriptionId(null);
              }}
              disabled={movingTranscription}
            >
              <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal centrado para eliminar carpeta */}
      {showFolderMenu && longPressFolderId && (
        <View style={styles.modalOverlay}>
          <View style={styles.folderDeleteModal}>
            <Text style={styles.folderDeleteTitle}>Eliminar carpeta</Text>
            <Text style={styles.folderDeleteMessage}>
              ¿Estás seguro de que quieres eliminar esta carpeta?
            </Text>
            <View style={styles.folderDeleteActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowFolderMenu(false)}
                disabled={deletingFolder}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={() => confirmDeleteFolder(longPressFolderId)}
                disabled={deletingFolder}
              >
                {deletingFolder ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal centrado para eliminar etiqueta */}
      {showTagMenu && longPressTagId && (
        <View style={styles.modalOverlay}>
          <View style={styles.folderDeleteModal}>
            <Text style={styles.folderDeleteTitle}>Eliminar etiqueta</Text>
            <Text style={styles.folderDeleteMessage}>
              ¿Estás seguro de que quieres eliminar esta etiqueta?
            </Text>
            <View style={styles.folderDeleteActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowTagMenu(false)}
                disabled={deletingTag}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={() => confirmDeleteTag(longPressTagId)}
                disabled={deletingTag}
              >
                {deletingTag ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal para gestionar etiquetas de transcripción */}
      {showTagAssignment && selectedTranscriptionForTags && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Gestionar Etiquetas</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona las etiquetas para esta transcripción
            </Text>

            <ScrollView style={styles.tagList} contentContainerStyle={styles.tagListContent}>
              {tagsLoading ? (
                <ActivityIndicator size="small" color="#4A00E0" />
              ) : (
                tags.map((tag) => {
                  const currentTags = transcriptionTags[selectedTranscriptionForTags] || [];
                  const isAssigned = currentTags.some(t => t.id === tag.id);
                  
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagItem,
                        isAssigned && styles.tagItemSelected,
                        { borderLeftColor: tag.color }
                      ]}
                      onPress={() => {
                        if (isAssigned) {
                          removeTagFromTranscription(selectedTranscriptionForTags, tag.id);
                        } else {
                          assignTagToTranscription(selectedTranscriptionForTags, tag.id);
                        }
                      }}
                      disabled={managingTags}
                    >
                      <View style={[styles.tagColorIndicator, { backgroundColor: tag.color }]} />
                      <Text style={[styles.tagItemText, isAssigned && styles.tagItemTextSelected]}>
                        {tag.name}
                      </Text>
                      <Ionicons 
                        name={isAssigned ? "checkmark-circle" : "add-circle-outline"} 
                        size={20} 
                        color={isAssigned ? tag.color : "#666"} 
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowTagAssignment(false);
                  setSelectedTranscriptionForTags(null);
                }}
                disabled={managingTags}
              >
                <Text style={styles.modalButtonTextCancel}>Cerrar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={() => setShowTagManager(true)}
                disabled={managingTags}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.modalButtonTextCreate}>Nueva Etiqueta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal para crear nueva etiqueta - Ajustado para mayor tamaño */}
      {showTagManager && (
        <Modal
          visible={showTagManager}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowTagManager(false);
            setNewTagName('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.largeModalContainer}>
              <View style={styles.largeModalHeader}>
                <Text style={styles.largeModalTitle}>🏷️ Gestión de Etiquetas</Text>
                <TouchableOpacity onPress={() => {
                  setShowTagManager(false);
                  setNewTagName('');
                }} style={styles.largeCloseButton}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.largeModalContent}>
                {/* Crear nueva etiqueta */}
                <View style={styles.largeCreateSection}>
                  <Text style={styles.largeSectionTitle}>Crear nueva etiqueta</Text>
                  <View style={styles.largeCreateInputRow}>
                    <TextInput
                      style={styles.largeTagInput}
                      placeholder="Nombre de la etiqueta"
                      value={newTagName}
                      onChangeText={setNewTagName}
                      maxLength={50}
                    />
                    <TouchableOpacity
                      style={styles.largeCreateButton}
                      onPress={createNewTag}
                      disabled={creatingTag || !newTagName.trim()}
                    >
                      {creatingTag ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Ionicons name="add" size={24} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Selector de colores */}
                  <Text style={styles.largeColorSelectorTitle}>Seleccionar color:</Text>
                  <View style={styles.largeColorSelector}>
                    {['#666666', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9A826', '#6C5CE7', '#00B894'].map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.largeColorOption,
                          { backgroundColor: color },
                          selectedTagColor === color && styles.largeColorOptionSelected
                        ]}
                        onPress={() => setSelectedTagColor(color)}
                      >
                        {selectedTagColor === color && (
                          <Ionicons name="checkmark" size={20} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Lista de etiquetas existentes */}
                <View style={styles.largeTagsSection}>
                  <Text style={styles.largeSectionTitle}>Etiquetas existentes</Text>
                  <ScrollView style={styles.largeTagsList}>
                    {tagsLoading ? (
                      <Text style={styles.largeLoadingText}>Cargando etiquetas...</Text>
                    ) : tags.length === 0 ? (
                      <Text style={styles.largeEmptyText}>No hay etiquetas creadas</Text>
                    ) : (
                      tags.map(tag => (
                        <TouchableOpacity
                          key={tag.id}
                          style={[
                            styles.largeTagItem,
                            selectedTags.includes(tag.id) && styles.largeSelectedTag
                          ]}
                          onPress={() => handleTagSelect(tag.id)}
                        >
                          <View
                            style={[
                              styles.largeTagColor,
                              { backgroundColor: tag.color }
                            ]}
                          />
                          <Text style={styles.largeTagName}>{tag.name}</Text>
                          {selectedTags.includes(tag.id) && (
                            <Ionicons name="checkmark" size={20} color="#3ba3a4" />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.largeModalFooter}>
                <TouchableOpacity style={styles.largeCancelButton} onPress={() => {
                  setShowTagManager(false);
                  setNewTagName('');
                }}>
                  <Text style={styles.largeCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.largeSaveButton} onPress={() => {
                  setShowTagManager(false);
                  setNewTagName('');
                }}>
                  <Text style={styles.largeSaveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Menú flotante para acciones de transcripción */}
      {showTranscriptionMenu && selectedTranscriptionForMenu && (
        <View style={styles.transcriptionMenuOverlay}>
          <View style={styles.transcriptionMenuContainer}>
            <Text style={styles.transcriptionMenuTitle}>Acciones</Text>
            
            <TouchableOpacity 
              style={styles.transcriptionMenuItem}
              onPress={() => {
                toggleFavorite(selectedTranscriptionForMenu.id, selectedTranscriptionForMenu.is_favorite || false);
                setShowTranscriptionMenu(false);
              }}
            >
              <Ionicons 
                name={selectedTranscriptionForMenu.is_favorite ? "star" : "star-outline"} 
                size={24} 
                color={selectedTranscriptionForMenu.is_favorite ? "#FFD700" : "#666"} 
              />
              <Text style={styles.transcriptionMenuItemText}>
                {selectedTranscriptionForMenu.is_favorite ? "Quitar favorito" : "Añadir a favoritos"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.transcriptionMenuItem}
              onPress={() => {
                handleManageTags(selectedTranscriptionForMenu.id);
                setShowTranscriptionMenu(false);
              }}
            >
              <Ionicons name="pricetag-outline" size={24} color="#666" />
              <Text style={styles.transcriptionMenuItemText}>Gestionar etiquetas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.transcriptionMenuItem}
              onPress={() => {
                handleMoveToFolder(selectedTranscriptionForMenu.id);
                setShowTranscriptionMenu(false);
              }}
            >
              <Ionicons name="folder-outline" size={24} color="#666" />
              <Text style={styles.transcriptionMenuItemText}>Mover a carpeta</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.transcriptionMenuItem, styles.transcriptionMenuItemDelete]}
              onPress={() => {
                deleteTranscription(selectedTranscriptionForMenu.id);
                setShowTranscriptionMenu(false);
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#dc3545" />
              <Text style={[styles.transcriptionMenuItemText, styles.transcriptionMenuItemTextDelete]}>
                Eliminar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.transcriptionMenuItem, styles.transcriptionMenuItemCancel]}
              onPress={() => setShowTranscriptionMenu(false)}
            >
              <Ionicons name="close-circle" size={24} color="#666" />
              <Text style={styles.transcriptionMenuItemText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerLeft: {
    marginRight: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
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
    margin: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
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
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  // Estilos para los filtros en 3 líneas separadas
  filterRow: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  filterScrollView: {
    backgroundColor: 'white',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    marginRight: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f2f5',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#333',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  transcriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f2f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
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
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
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
  // Estilos del calendario
  calendarSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  calendarContainer: {
    backgroundColor: 'white',
  },
  calendarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateBadge: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A00E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDatesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  // Estilos del selector de fechas tipo Booking
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateInputsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  dateInput: {
    gap: 8,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dateInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButtonCancel: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  datePickerButtonApply: {
    backgroundColor: '#4A00E0',
  },
  datePickerButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  datePickerButtonTextApply: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Estilos del calendario visual
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  calendarDayWithTranscription: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  calendarDaySelected: {
    backgroundColor: '#666',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextWithTranscription: {
    color: '#666',
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  calendarDayTextEmpty: {
    color: '#ccc',
  },
  calendarLegend: {
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendColorTranscription: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  newFolderButton: {
    borderWidth: 1,
    borderColor: '#4A00E0',
    backgroundColor: 'transparent',
  },
  newTagButton: {
    borderWidth: 1,
    borderColor: '#28677d',
    backgroundColor: 'transparent',
  },
  debugButton: {
    borderWidth: 2,
    borderColor: 'red',
  },
  // Estilos del modal para crear carpetas
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    height: '70%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonCreate: {
    backgroundColor: '#3ba3a4',
  },
  modalButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  modalButtonTextCancel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextCreate: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  // Estilos para el modal de selección de carpetas
  folderList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  folderListContent: {
    gap: 8,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
    gap: 12,
  },
  folderItemSelected: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  folderItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  folderItemTextSelected: {
    fontWeight: '600',
    color: '#4A00E0',
  },
  // Estilos para el menú flotante de eliminar carpeta
  folderMenuOverlay: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  folderMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    minWidth: 150,
  },
  folderMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  folderMenuText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // Estilos para el selector de iconos
  iconSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  iconSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  iconOption: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  iconOptionSelected: {
    borderColor: '#3ba3a4',
    backgroundColor: '#f0f9ff',
  },
  // Estilos para el selector de colores
  colorSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: 4,
    marginBottom: 20,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#3ba3a4',
  },
  // Estilos para el modal de eliminar carpeta centrado
  folderDeleteModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  folderDeleteTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  folderDeleteMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  folderDeleteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButtonDelete: {
    backgroundColor: '#e27667',
  },
  modalButtonTextDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Estilos para etiquetas
  tagsContainer: {
    marginTop: 4,
  },
  tagsContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 4,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Estilos para el modal de etiquetas
  tagList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  tagListContent: {
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
    gap: 12,
    borderLeftWidth: 4,
  },
  tagItemSelected: {
    backgroundColor: '#e0e0e0',
  },
  tagColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  tagItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  tagItemTextSelected: {
    fontWeight: '600',
  },
  
  // Nuevos estilos para la información superior
  topInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  folderInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  folderInfoText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },

  // Estilos para el menú flotante de transcripción
  transcriptionMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  transcriptionMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  transcriptionMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  transcriptionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f2f5',
  },
  transcriptionMenuItemDelete: {
    backgroundColor: '#ffe6e6',
  },
  transcriptionMenuItemCancel: {
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#3ba3a4',
  },
  transcriptionMenuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  transcriptionMenuItemTextDelete: {
    color: '#dc3545',
    fontWeight: '500',
  },

  // Estilos para el sistema de filtros
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#3ba3a4',
  },


  // Estilos para modales grandes
  largeModalContainer: {
    width: '95%',
    height: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  largeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  largeModalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  largeCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
  largeModalContent: {
    flex: 1,
    padding: 24,
  },
  largeModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  largeModalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 24,
  },
  largeIconSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  largeIconSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  largeIconOption: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  largeIconOptionSelected: {
    borderColor: '#3ba3a4',
    backgroundColor: '#f0f9ff',
  },
  largeColorSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  largeColorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  largeColorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  largeColorOptionSelected: {
    borderColor: '#3ba3a4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  largeModalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  largeModalButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeModalButtonCancel: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  largeModalButtonCreate: {
    backgroundColor: '#3ba3a4',
  },
  largeModalButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  largeModalButtonTextCancel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  largeModalButtonTextCreate: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },

  // Estilos específicos para etiquetas grandes
  largeCreateSection: {
    marginBottom: 32,
  },
  largeSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  largeCreateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  largeTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
  },
  largeCreateButton: {
    backgroundColor: '#3ba3a4',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  largeTagsSection: {
    flex: 1,
  },
  largeTagsList: {
    flex: 1,
  },
  largeTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  largeSelectedTag: {
    borderColor: '#3ba3a4',
    backgroundColor: '#f0f9ff',
  },
  largeTagColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  largeTagName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  largeLoadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  largeEmptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
    fontStyle: 'italic',
  },
  largeCancelButton: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  largeCancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  largeSaveButton: {
    flex: 1,
    backgroundColor: '#3ba3a4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  largeSaveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});

export default TranscriptionsScreen;
