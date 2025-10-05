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
import { transcriptionManagementAPI } from '../services/api';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsModalProps {
  visible: boolean;
  onClose: () => void;
  onTagSelect?: (tag: Tag) => void;
  onTagsChange?: (tagIds: string[]) => void;
  currentTags?: Tag[];
}

const TagsModal: React.FC<TagsModalProps> = ({
  visible,
  onClose,
  onTagSelect,
  onTagsChange,
  currentTags = []
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTagColor, setSelectedTagColor] = useState('#666666');
  const [creatingTag, setCreatingTag] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await transcriptionManagementAPI.getTags();
      if (response.success && response.data) {
        setTags(response.data.tags);
      } else {
        Alert.alert('Error', 'No se pudieron cargar las etiquetas');
      }
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar las etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('Error', 'El nombre de la etiqueta es requerido');
      return;
    }

    setCreatingTag(true);
    try {
      const response = await transcriptionManagementAPI.createTag({
        name: newTagName.trim(),
        color: selectedTagColor
      });

      if (response.success && response.data) {
        setTags(prev => [...prev, response.data]);
        setNewTagName('');
        setSelectedTagColor('#666666'); // Resetear a color por defecto
        Alert.alert('Éxito', 'Etiqueta creada correctamente');
      } else {
        Alert.alert('Error', 'No se pudo crear la etiqueta');
      }
    } catch (error: any) {
      console.error('Error creating tag:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la etiqueta');
    } finally {
      setCreatingTag(false);
    }
  };

  const deleteTag = async (tagId: string, tagName: string) => {
    Alert.alert(
      'Eliminar Etiqueta',
      `¿Estás seguro de que quieres eliminar la etiqueta "${tagName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingTagId(tagId);
            try {
              const response = await transcriptionManagementAPI.deleteTag(tagId);
              if (response.success) {
                setTags(prev => prev.filter(tag => tag.id !== tagId));
                Alert.alert('Éxito', 'Etiqueta eliminada correctamente');
              } else {
                Alert.alert('Error', 'No se pudo eliminar la etiqueta');
              }
            } catch (error: any) {
              console.error('Error deleting tag:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar la etiqueta');
            } finally {
              setDeletingTagId(null);
            }
          }
        }
      ]
    );
  };

  // Inicializar las etiquetas seleccionadas cuando cambian las currentTags
  useEffect(() => {
    if (currentTags) {
      setSelectedTagIds(currentTags.map(tag => tag.id));
    }
  }, [currentTags]);

  // Manejar la selección de etiquetas
  const handleTagSelect = (tag: Tag) => {
    if (onTagsChange) {
      // Modo de selección múltiple - solo actualizar el estado local
      const newSelectedTagIds = selectedTagIds.includes(tag.id)
        ? selectedTagIds.filter(id => id !== tag.id)
        : [...selectedTagIds, tag.id];
      
      setSelectedTagIds(newSelectedTagIds);
      // NO llamar a onTagsChange aquí, solo cuando se presione Guardar
    } else if (onTagSelect) {
      // Modo de selección individual (compatibilidad hacia atrás)
      onTagSelect(tag);
    }
  };

  // Manejar el guardado cuando se usa onTagsChange
  const handleSaveTags = () => {
    if (onTagsChange) {
      onTagsChange(selectedTagIds);
    }
    onClose();
  };

  useEffect(() => {
    if (visible) {
      fetchTags();
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
            <Text style={styles.largeModalTitle}>Gestión de Etiquetas</Text>
            <TouchableOpacity onPress={onClose} style={styles.largeCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.largeModalContent} contentContainerStyle={styles.largeModalContentContainer}>
            {/* Sección de creación de etiqueta */}
            <Text style={styles.largeModalSubtitle}>Ingresa el nombre de la nueva etiqueta</Text>

            <TextInput
              style={styles.largeModalInput}
              placeholder="Nombre de la etiqueta"
              value={newTagName}
              onChangeText={setNewTagName}
              maxLength={50}
              placeholderTextColor="#999"
              autoFocus={true}
            />

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
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Botón para crear etiqueta - arriba del título de selección */}
            <TouchableOpacity
              style={[styles.createTagButton, !newTagName.trim() && styles.createTagButtonDisabled]}
              onPress={createTag}
              disabled={creatingTag || !newTagName.trim()}
            >
              {creatingTag ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createTagButtonText}>Crear Etiqueta</Text>
              )}
            </TouchableOpacity>

            {/* Lista de etiquetas existentes */}
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Seleccionar etiquetas</Text>
              
              {loading ? (
                <Text style={styles.loadingText}>Cargando etiquetas...</Text>
              ) : tags.length === 0 ? (
                <Text style={styles.emptyText}>No hay etiquetas creadas</Text>
              ) : (
                tags.map(tag => (
                  <View key={tag.id} style={styles.tagItemContainer}>
                    <TouchableOpacity
                      style={[
                        styles.tagItem,
                        selectedTagIds.includes(tag.id) && styles.selectedTag
                      ]}
                      onPress={() => handleTagSelect(tag)}
                    >
                      <View
                        style={[
                          styles.tagColor,
                          { backgroundColor: tag.color }
                        ]}
                      />
                      <Text style={styles.tagName}>{tag.name}</Text>
                      {selectedTagIds.includes(tag.id) && (
                        <Ionicons name="checkmark" size={16} color="#3ba3a4" />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteTag(tag.id, tag.name)}
                      disabled={deletingTagId === tag.id}
                    >
                      {deletingTagId === tag.id ? (
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
              disabled={creatingTag}
            >
              <Text style={styles.largeModalButtonTextCancel}>Cancelar</Text>
            </TouchableOpacity>

            {/* Botón para guardar selección - solo visible cuando se usa onTagsChange */}
            {onTagsChange && (
              <TouchableOpacity
                style={[styles.largeModalButton, styles.largeModalButtonCreate]}
                onPress={handleSaveTags}
              >
                <Text style={styles.largeModalButtonTextCreate}>Guardar</Text>
              </TouchableOpacity>
            )}
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
  createTagButton: {
    backgroundColor: '#3ba3a4',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createTagButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  createTagButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
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
  tagsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tagItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  selectedTag: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  tagColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  tagName: {
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default TagsModal;
