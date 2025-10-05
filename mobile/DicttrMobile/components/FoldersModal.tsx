import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { folderAPI } from '../services/api';

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface FoldersModalProps {
  visible: boolean;
  onClose: () => void;
  onFolderSelect: (folder: Folder | null) => void;
  currentFolder?: Folder | null;
}

const FoldersModal: React.FC<FoldersModalProps> = ({
  visible,
  onClose,
  onFolderSelect,
  currentFolder = null
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#f0f2f5');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  // Colores pastel para el selector
  const pastelColors = [
    '#f0f2f5', // Gris azulado claro (default)
    '#ffd6e7', // Rosa pastel
    '#d4f1f9', // Azul pastel
    '#e2f0cb', // Verde pastel
    '#ffe4c2', // Naranja pastel
    '#e6d7f7', // Lila pastel
  ];

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await folderAPI.getFolders();
      if (response.success && response.data) {
        setFolders(response.data.folders);
      } else {
        Alert.alert('Error', 'No se pudieron cargar las carpetas');
      }
    } catch (error: any) {
      console.error('Error fetching folders:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar las carpetas');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'El nombre de la carpeta es requerido');
      return;
    }

    setCreatingFolder(true);
    try {
      const response = await folderAPI.createFolder({
        name: newFolderName.trim(),
        color: selectedColor,
        icon: selectedIcon
      });

      if (response.success && response.data) {
        setFolders(prev => [...prev, response.data]);
        setNewFolderName('');
        setSelectedIcon('folder'); // Resetear a icono por defecto
        setSelectedColor('#f0f2f5'); // Resetear a color por defecto
        Alert.alert('Éxito', 'Carpeta creada correctamente');
      } else {
        Alert.alert('Error', 'No se pudo crear la carpeta');
      }
    } catch (error: any) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la carpeta');
    } finally {
      setCreatingFolder(false);
    }
  };

  const deleteFolder = async (folderId: string, folderName: string) => {
    Alert.alert(
      'Eliminar Carpeta',
      `¿Estás seguro de que quieres eliminar la carpeta "${folderName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingFolderId(folderId);
            try {
              const response = await folderAPI.deleteFolder(folderId);
              if (response.success) {
                setFolders(prev => prev.filter(folder => folder.id !== folderId));
                Alert.alert('Éxito', 'Carpeta eliminada correctamente');
              } else {
                Alert.alert('Error', 'No se pudo eliminar la carpeta');
              }
            } catch (error: any) {
              console.error('Error deleting folder:', error);
              // Manejar específicamente el error de carpeta no vacía
              if (error.response?.status === 400 && 
                  error.response?.data?.error?.includes('contiene transcripciones')) {
                Alert.alert(
                  'Carpeta no vacía',
                  'No se puede eliminar la carpeta porque contiene transcripciones. Mueve las transcripciones a otra carpeta primero.'
                );
              } else {
                Alert.alert('Error', error.message || 'No se pudo eliminar la carpeta');
              }
            } finally {
              setDeletingFolderId(null);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (visible) {
      fetchFolders();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.largeModalContainer}>
          <View style={styles.largeModalHeader}>
            <Text style={styles.largeModalTitle}>Seleccionar Carpeta</Text>
            <TouchableOpacity onPress={onClose} style={styles.largeCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.largeModalContent} contentContainerStyle={styles.largeModalContentContainer}>
            {/* Sección de creación de carpeta */}
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
                <Ionicons name="folder" size={24} color={selectedIcon === 'folder' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'book' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('book')}
              >
                <Ionicons name="book" size={24} color={selectedIcon === 'book' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'school' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('school')}
              >
                <Ionicons name="school" size={24} color={selectedIcon === 'school' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'document' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('document')}
              >
                <Ionicons name="document" size={24} color={selectedIcon === 'document' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
            </View>
            <View style={styles.largeIconSelector}>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'briefcase' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('briefcase')}
              >
                <Ionicons name="briefcase" size={24} color={selectedIcon === 'briefcase' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'calendar' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('calendar')}
              >
                <Ionicons name="calendar" size={24} color={selectedIcon === 'calendar' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'star' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('star')}
              >
                <Ionicons name="star" size={24} color={selectedIcon === 'star' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'heart' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('heart')}
              >
                <Ionicons name="heart" size={24} color={selectedIcon === 'heart' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
            </View>
            <View style={styles.largeIconSelector}>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'musical-notes' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('musical-notes')}
              >
                <Ionicons name="musical-notes" size={24} color={selectedIcon === 'musical-notes' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'language' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('language')}
              >
                <Ionicons name="language" size={24} color={selectedIcon === 'language' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'calculator' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('calculator')}
              >
                <Ionicons name="calculator" size={24} color={selectedIcon === 'calculator' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'flask' && styles.largeIconOptionSelected]}
                onPress={() => setSelectedIcon('flask')}
              >
                <Ionicons name="flask" size={24} color={selectedIcon === 'flask' ? '#3ba3a4' : '#666'} />
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
                    <Ionicons name="checkmark" size={16} color="#333" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Lista de carpetas existentes */}
            <View style={styles.foldersSection}>
              <Text style={styles.sectionTitle}>Seleccionar carpeta</Text>
              {/* Opción "Sin carpeta" */}
              <TouchableOpacity
                style={[
                  styles.folderItem,
                  !currentFolder && styles.selectedFolder
                ]}
                onPress={() => onFolderSelect(null)}
              >
                <View style={[styles.folderIconContainer, { backgroundColor: '#f0f2f5' }]}>
                  <Ionicons name="folder-open-outline" size={16} color="#666" />
                </View>
                <Text style={styles.folderName}>Sin carpeta</Text>
                {!currentFolder && (
                  <Ionicons name="checkmark" size={16} color="#4A00E0" />
                )}
              </TouchableOpacity>

              {/* Separador entre "Sin carpeta" y las carpetas existentes */}
              <View style={styles.separator} />

              {loading ? (
                <Text style={styles.loadingText}>Cargando carpetas...</Text>
              ) : folders.length === 0 ? (
                <Text style={styles.emptyText}>No hay carpetas creadas</Text>
              ) : (
                folders.map(folder => (
                  <View key={folder.id} style={styles.folderItemContainer}>
                    <TouchableOpacity
                      style={[
                        styles.folderItem,
                        currentFolder?.id === folder.id && styles.selectedFolder
                      ]}
                      onPress={() => onFolderSelect(folder)}
                    >
                      <View
                        style={[
                          styles.folderIconContainer,
                          { backgroundColor: folder.color }
                        ]}
                      >
                        <Ionicons name={folder.icon as any} size={16} color="white" />
                      </View>
                      <Text style={styles.folderName}>{folder.name}</Text>
                      {currentFolder?.id === folder.id && (
                        <Ionicons name="checkmark" size={16} color="#4A00E0" />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteFolder(folder.id, folder.name)}
                      disabled={deletingFolderId === folder.id}
                    >
                      {deletingFolderId === folder.id ? (
                        <ActivityIndicator size="small" color="#666" />
                      ) : (
                        <Ionicons name="trash-outline" size={16} color="#666" />
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <View style={styles.largeModalFooter}>
            <TouchableOpacity
              style={[styles.largeModalButton, styles.largeModalButtonCancel]}
              onPress={onClose}
              disabled={creatingFolder}
            >
              <Text style={styles.largeModalButtonTextCancel}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.largeModalButton, styles.largeModalButtonCreate, !newFolderName.trim() && styles.largeModalButtonDisabled]}
              onPress={createFolder}
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
  );
};

const styles = StyleSheet.create({
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
  largeModalContainer: {
    width: '85%',
    height: '75%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  largeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  largeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  largeCloseButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  largeModalContent: {
    flex: 1,
  },
  largeModalContentContainer: {
    padding: 16,
  },
  largeModalSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  largeModalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  largeIconSelectorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  largeIconSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  largeIconOption: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  largeIconOptionSelected: {
    borderColor: '#3ba3a4',
    backgroundColor: '#f0f9ff',
  },
  largeColorSelectorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  largeColorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  largeColorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  largeColorOptionSelected: {
    borderColor: '#3ba3a4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  largeModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  largeModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  largeModalButtonTextCreate: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  foldersSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  folderItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  selectedFolder: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  folderIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderName: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginLeft: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
    marginHorizontal: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default FoldersModal;
