import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { transcriptionManagementAPI, folderAPI } from '../../services/api';
import DicttrLogo from '../../components/DicttrLogo';

// Importar hooks personalizados
import { useTranscriptions } from './hooks/useTranscriptions';
import { useFilters } from './hooks/useFilters';
import { useFolders } from './hooks/useFolders';
import { useTags } from './hooks/useTags';

// Importar componentes
import SearchBar from './components/SearchBar';
import FolderFilter from './components/FolderFilter';
import TagFilter from './components/TagFilter';
import GeneralFilter from './components/GeneralFilter';
import TranscriptionCard from './components/TranscriptionCard';
import CreateFolderModal from './components/modals/CreateFolderModal';
import MoveToFolderModal from './components/modals/MoveToFolderModal';
import TranscriptionMenuModal from './components/modals/TranscriptionMenuModal';
import TagsModal from '../../components/TagsModal';
import TagManagerModal from './components/modals/TagManagerModal';
import CalendarModal from './components/CalendarModal';

// Importar tipos
import { Transcription } from './types';

const TranscriptionsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCalendarFilterActive, setIsCalendarFilterActive] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Estados de modales
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#f0f2f5');

  // Estados de menús
  const [showTranscriptionMenu, setShowTranscriptionMenu] = useState(false);
  const [selectedTranscriptionForMenu, setSelectedTranscriptionForMenu] = useState<Transcription | null>(null);
  const [transcriptionMenuPosition, setTranscriptionMenuPosition] = useState({ x: 0, y: 0 });

  // Estados para mover a carpeta
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [movingTranscription, setMovingTranscription] = useState(false);
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null);

  // Estados para gestión de etiquetas
  const [showManageTagsModal, setShowManageTagsModal] = useState(false);
  const [updatingTags, setUpdatingTags] = useState(false);
  const [showTagManagerModal, setShowTagManagerModal] = useState(false);

  // Usar hooks personalizados
  const {
    transcriptions,
    loading,
    refreshing,
    isSearching,
    loadTranscriptions,
    onRefresh,
    toggleFavorite,
    deleteTranscription,
    setTranscriptions,
    searchTimeout,
    setSearchTimeout
  } = useTranscriptions();

  const {
    filters,
    datesWithTranscriptions,
    loadFilters,
    loadTranscriptionDates
  } = useFilters();

  const {
    folders,
    foldersLoading,
    creatingFolder,
    deletingFolder,
    updatingFolder,
    loadFolders,
    createFolder,
    deleteFolder,
    updateFolder
  } = useFolders();

  const {
    tags,
    tagsLoading,
    creatingTag,
    updatingTag,
    deletingTag,
    transcriptionTags,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    loadTranscriptionTags
  } = useTags();

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadTranscriptions(1, false, getCurrentFilters());
      loadFilters();
      loadTranscriptionDates();
      loadFolders();
      loadTags();
    }
  }, [user]);

  // Cargar etiquetas para transcripciones
  useEffect(() => {
    if (transcriptions.length > 0) {
      transcriptions.forEach(transcription => {
        if (!transcriptionTags[transcription.id]) {
          loadTranscriptionTags(transcription.id);
        }
      });
    }
  }, [transcriptions]);

  // Recargar transcripciones cuando cambian los filtros
  useEffect(() => {
    if (user) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeoutId = setTimeout(() => {
        if (isCalendarFilterActive && selectedDays.length > 0) {
          // Si hay filtro de calendario activo, aplicar el filtro localmente
          loadTranscriptions(1, true, getCurrentFilters()).then(freshTranscriptions => {
            const filtered = freshTranscriptions.filter(transcription => {
              const transcriptionDate = new Date(transcription.created_at);
              const formattedDate = transcriptionDate.toISOString().split('T')[0];
              return selectedDays.includes(formattedDate);
            });
            setTranscriptions(filtered);
          });
        } else {
          // Si no hay filtro de calendario, cargar normalmente
          loadTranscriptions(1, true, getCurrentFilters());
        }
      }, 500);

      setSearchTimeout(timeoutId);

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [searchQuery, selectedSubject, showFavorites, sortOrder, selectedFolder, selectedTags, isCalendarFilterActive, selectedDays]);

  const getCurrentFilters = () => ({
    searchQuery,
    selectedSubject,
    showFavorites,
    selectedFolder,
    selectedTags
  });

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
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
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'El nombre de la carpeta no puede estar vacío');
      return;
    }

    const success = await createFolder({
      name: newFolderName.trim(),
      color: selectedColor,
      icon: selectedIcon
    });

    if (success) {
      setNewFolderName('');
      setSelectedIcon('folder');
      setSelectedColor('#f0f2f5');
      setShowNewFolderModal(false);
    }
  };

  const openTranscriptionInEditor = async (transcriptionId: string) => {
    try {
      const response = await transcriptionManagementAPI.getTranscription(transcriptionId);

      if (response.success && response.data) {
        // Usar navigate para ir a la pantalla principal con la transcripción
        navigation.navigate('Main', { transcriptionId });
      } else {
        Alert.alert('Error', 'No se pudo cargar la transcripción para editar');
      }
    } catch (error) {
      console.error('Error opening transcription in editor:', error);
      Alert.alert('Error', 'No se pudo abrir la transcripción para editar');
    }
  };

  const handleTranscriptionLongPress = (transcription: Transcription, event: any) => {
    setSelectedTranscriptionForMenu(transcription);

    setTimeout(() => {
      setShowTranscriptionMenu(true);
    }, 500);
  };

  const handleTranscriptionPressOut = () => {
    if (!showTranscriptionMenu) {
      setSelectedTranscriptionForMenu(null);
    }
  };

  // Función para actualizar el nombre de una carpeta
  const handleUpdateFolder = async (folderId: string, newName: string) => {
    const success = await updateFolder(folderId, newName);
    if (success) {
      // Recargar las transcripciones para reflejar el cambio en los filtros
      loadTranscriptions(1, true, getCurrentFilters());
    }
  };

  // Funciones para el menú de transcripción
  const handleMoveToFolder = () => {
    if (selectedTranscriptionForMenu) {
      setSelectedTranscriptionId(selectedTranscriptionForMenu.id);
      setShowMoveToFolderModal(true);
      setShowTranscriptionMenu(false);
    }
  };

  const handleAssignTags = () => {
    if (selectedTranscriptionForMenu) {
      setSelectedTranscriptionId(selectedTranscriptionForMenu.id);
      setShowManageTagsModal(true);
      setShowTranscriptionMenu(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (selectedTranscriptionForMenu) {
      await toggleFavorite(selectedTranscriptionForMenu.id, !!selectedTranscriptionForMenu.is_favorite);
      setShowTranscriptionMenu(false);
    }
  };

  const handleDeleteTranscription = () => {
    if (selectedTranscriptionForMenu) {
      // Solo llamar a deleteTranscription del hook, que ya tiene su propia confirmación
      deleteTranscription(selectedTranscriptionForMenu.id);
      setShowTranscriptionMenu(false);
    }
  };

  const handleMoveToFolderAction = async (transcriptionId: string, folderId: string | null) => {
    setMovingTranscription(true);
    try {
      const response = await folderAPI.moveTranscriptionToFolder(transcriptionId, folderId);
      if (response.success) {
        // Recargar las transcripciones para reflejar el cambio
        loadTranscriptions(1, true, getCurrentFilters());
        setShowMoveToFolderModal(false);
        setSelectedTranscriptionId(null);
      } else {
        Alert.alert('Error', 'No se pudo mover la transcripción');
      }
    } catch (error) {
      console.error('Error moving transcription to folder:', error);
      Alert.alert('Error', 'No se pudo mover la transcripción');
    } finally {
      setMovingTranscription(false);
    }
  };

  // Función para manejar cambios de carpeta desde el menú
  const handleFolderChange = async (folder: any | null) => {
    if (selectedTranscriptionForMenu) {
      try {
        await folderAPI.moveTranscriptionToFolder(selectedTranscriptionForMenu.id, folder?.id || null);
        
        // Actualizar la transcripción específica en el estado local para reflejar el cambio inmediatamente
        setTranscriptions(prev => prev.map(transcription => 
          transcription.id === selectedTranscriptionForMenu.id
            ? { ...transcription, folder_id: folder?.id || null }
            : transcription
        ));
        
        // Recargar las transcripciones para asegurar que los datos estén sincronizados
        loadTranscriptions(1, true, getCurrentFilters());
        
        // Recargar las etiquetas de la transcripción actualizada
        await loadTranscriptionTags(selectedTranscriptionForMenu.id);
      } catch (error) {
        console.error('Error updating folder from menu:', error);
      }
    }
  };

  const handleTagsUpdate = async (transcriptionId: string, tagIds: string[]) => {
    setUpdatingTags(true);
    try {
      // Primero, eliminar todas las etiquetas actuales
      const currentTagIds = transcriptionTags[transcriptionId]?.map(tag => tag.id) || [];

      // Eliminar etiquetas que ya no están seleccionadas
      for (const tagId of currentTagIds) {
        if (!tagIds.includes(tagId)) {
          await transcriptionManagementAPI.removeTagFromTranscription(transcriptionId, tagId);
        }
      }

      // Agregar nuevas etiquetas
      for (const tagId of tagIds) {
        if (!currentTagIds.includes(tagId)) {
          await transcriptionManagementAPI.assignTagToTranscription(transcriptionId, tagId);
        }
      }

      // Recargar las etiquetas de la transcripción
      await loadTranscriptionTags(transcriptionId);

      setShowManageTagsModal(false);
      setSelectedTranscriptionId(null);
    } catch (error) {
      console.error('Error updating transcription tags:', error);
      Alert.alert('Error', 'No se pudieron actualizar las etiquetas');
    } finally {
      setUpdatingTags(false);
    }
  };

  // Funciones para el calendario
  const handleDaySelect = (dateString: string) => {
    setSelectedDays(prev =>
      prev.includes(dateString)
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString]
    );
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  const handleApplyCalendarFilter = async () => {
    // Filtrar transcripciones por los días seleccionados
    if (selectedDays.length > 0) {
      console.log('Días seleccionados:', selectedDays);

      // Primero recargar todas las transcripciones para tener datos frescos
      const freshTranscriptions = await loadTranscriptions(1, true, getCurrentFilters());

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

      // Actualizar el estado de las transcripciones con el resultado filtrado
      setTranscriptions(filtered);
      setIsCalendarFilterActive(true);
    } else {
      // Si no hay días seleccionados, recargar todas las transcripciones
      console.log('Recargando todas las transcripciones');
      loadTranscriptions(1, true, getCurrentFilters());
      setIsCalendarFilterActive(false);
    }
    setShowDatePicker(false);
  };

  const handleClearCalendarFilter = () => {
    setSelectedDays([]);
    setIsCalendarFilterActive(false);
    loadTranscriptions(1, true, getCurrentFilters());
  };

  const renderTranscriptionItem = ({ item }: { item: Transcription }) => (
    <TranscriptionCard
      transcription={item}
      folders={folders}
      transcriptionTags={transcriptionTags}
      onPress={openTranscriptionInEditor}
      onLongPress={handleTranscriptionLongPress}
      onPressOut={handleTranscriptionPressOut}
    />
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
      {/* Header con flecha y logo */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#3ba3a4" />
        </TouchableOpacity>
        
        <DicttrLogo width={70} height={35} />
      </View>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Filtros de Carpetas */}
      <FolderFilter
        folders={folders}
        selectedFolder={selectedFolder}
        onFolderSelect={handleFolderSelect}
        onFolderLongPress={() => {}} // TODO: Implementar
        onFolderPressOut={() => {}} // TODO: Implementar
        onCreateNewFolder={() => setShowNewFolderModal(true)}
      />

      {/* Filtros de Etiquetas */}
      <TagFilter
        tags={tags}
        selectedTags={selectedTags}
        onTagSelect={handleTagSelect}
        onTagLongPress={() => {}} // TODO: Implementar
        onTagPressOut={() => {}} // TODO: Implementar
        onClearTagFilters={clearTagFilters}
        onOpenTagManager={() => setShowTagManagerModal(true)}
      />

      {/* Filtros Generales */}
      <GeneralFilter
        filters={filters}
        selectedSubject={selectedSubject}
        showFavorites={showFavorites}
        isCalendarFilterActive={isCalendarFilterActive}
        showDatePicker={showDatePicker}
        onSubjectSelect={setSelectedSubject}
        onToggleFavorites={() => setShowFavorites(!showFavorites)}
        onToggleCalendar={() => {
          if (isCalendarFilterActive) {
            handleClearCalendarFilter();
          } else {
            setShowDatePicker(!showDatePicker);
          }
        }}
        onToggleSortOrder={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
        sortOrder={sortOrder}
      />

      {/* Lista de Transcripciones */}
      <FlatList
        data={transcriptions}
        renderItem={renderTranscriptionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => onRefresh(getCurrentFilters())}
          />
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

      {/* Modal para crear nueva carpeta */}
      <CreateFolderModal
        visible={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        newFolderName={newFolderName}
        onFolderNameChange={setNewFolderName}
        selectedIcon={selectedIcon}
        onIconSelect={setSelectedIcon}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
        creatingFolder={creatingFolder}
        deletingFolder={deletingFolder}
        updatingFolder={updatingFolder}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={deleteFolder}
        onUpdateFolder={handleUpdateFolder}
        folders={folders}
      />

      {/* Modal del menú de transcripción */}
      <TranscriptionMenuModal
        visible={showTranscriptionMenu}
        onClose={() => setShowTranscriptionMenu(false)}
        transcription={selectedTranscriptionForMenu}
        onMoveToFolder={handleMoveToFolder}
        onAssignTags={handleAssignTags}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteTranscription}
        onFolderChange={handleFolderChange}
      />

      {/* Modal para mover a carpeta */}
      <MoveToFolderModal
        visible={showMoveToFolderModal}
        onClose={() => {
          setShowMoveToFolderModal(false);
          setSelectedTranscriptionId(null);
        }}
        folders={folders}
        selectedFolder={selectedTranscriptionForMenu?.folder_id || null}
        movingTranscription={movingTranscription}
        onMoveToFolder={handleMoveToFolderAction}
        selectedTranscriptionId={selectedTranscriptionId}
      />

      {/* Modal para gestionar etiquetas (TagsModal completo) */}
      <TagsModal
        visible={showManageTagsModal}
        onClose={() => {
          setShowManageTagsModal(false);
          setSelectedTranscriptionId(null);
        }}
        onTagsChange={async (selectedTagIds: string[]) => {
          if (selectedTranscriptionId) {
            await handleTagsUpdate(selectedTranscriptionId, selectedTagIds);
          }
        }}
        currentTags={selectedTranscriptionId ? transcriptionTags[selectedTranscriptionId] || [] : []}
      />

      {/* Modal para gestión de etiquetas (crear/eliminar) */}
      <TagManagerModal
        visible={showTagManagerModal}
        onClose={() => setShowTagManagerModal(false)}
        tags={tags}
        tagsLoading={tagsLoading}
        creatingTag={creatingTag}
        updatingTag={updatingTag}
        deletingTag={deletingTag}
        onLoadTags={loadTags}
        onCreateTag={createTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
      />

      {/* Modal del calendario */}
      <CalendarModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        datesWithTranscriptions={datesWithTranscriptions}
        selectedDays={selectedDays}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onDaySelect={handleDaySelect}
        onApplyFilter={handleApplyCalendarFilter}
        isCalendarFilterActive={isCalendarFilterActive}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 5,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
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
