import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag, tagColors } from '../../types';

interface TagManagerModalProps {
  visible: boolean;
  onClose: () => void;
  tags: Tag[];
  tagsLoading: boolean;
  creatingTag: boolean;
  updatingTag: boolean;
  deletingTag: boolean;
  onLoadTags: () => void;
  onCreateTag: (tagData: { name: string; color: string }) => Promise<boolean>;
  onUpdateTag: (tagId: string, tagData: { name: string; color: string }) => Promise<boolean>;
  onDeleteTag: (tagId: string) => Promise<boolean>;
}

const TagManagerModal: React.FC<TagManagerModalProps> = ({
  visible,
  onClose,
  tags,
  tagsLoading,
  creatingTag,
  updatingTag,
  deletingTag,
  onLoadTags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(tagColors[0]);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [updatingTagId, setUpdatingTagId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      onLoadTags();
      setNewTagName('');
      setSelectedColor(tagColors[0]);
    }
  }, [visible]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('Error', 'El nombre de la etiqueta no puede estar vacío');
      return;
    }

    const tagName = newTagName.trim();

    // Verificar si ya existe una etiqueta con el mismo nombre
    const existingTag = tags.find(tag =>
      tag.name.toLowerCase() === tagName.toLowerCase()
    );

    if (existingTag) {
      Alert.alert('Error', `Ya existe una etiqueta con el nombre "${tagName}"`);
      return;
    }

    const success = await onCreateTag({
      name: tagName,
      color: selectedColor
    });

    if (success) {
      setNewTagName('');
      setSelectedColor(tagColors[0]);
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    setDeletingTagId(tagId);

    Alert.alert(
      'Eliminar Etiqueta',
      `¿Estás seguro de que quieres eliminar la etiqueta "${tagName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setDeletingTagId(null) },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await onDeleteTag(tagId);
            setDeletingTagId(null);
          }
        }
      ]
    );
  };

  const handleStartEditing = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };

  const handleCancelEditing = () => {
    setEditingTagId(null);
    setEditingTagName('');
  };

  const handleSaveTag = async (tag: Tag) => {
    if (!editingTagName.trim()) {
      Alert.alert('Error', 'El nombre de la etiqueta no puede estar vacío');
      return;
    }

    const newName = editingTagName.trim();

    // Verificar si ya existe otra etiqueta con el mismo nombre
    const existingTag = tags.find(t => 
      t.id !== tag.id && t.name.toLowerCase() === newName.toLowerCase()
    );

    if (existingTag) {
      Alert.alert('Error', `Ya existe una etiqueta con el nombre "${newName}"`);
      return;
    }

    setUpdatingTagId(tag.id);

    const success = await onUpdateTag(tag.id, {
      name: newName,
      color: tag.color
    });

    if (success) {
      setEditingTagId(null);
      setEditingTagName('');
    }

    setUpdatingTagId(null);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gestión de Etiquetas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Crear nueva etiqueta */}
            <View style={styles.createSection}>
              <Text style={styles.sectionTitle}>Crear Nueva Etiqueta</Text>

              <TextInput
                style={styles.tagInput}
                placeholder="Nombre de la etiqueta"
                value={newTagName}
                onChangeText={setNewTagName}
                maxLength={30}
                placeholderTextColor="#999"
              />

              <Text style={styles.colorTitle}>Seleccionar color:</Text>
              <View style={styles.colorSelector}>
                {tagColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color="#333" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.createButton, !newTagName.trim() && styles.createButtonDisabled]}
                onPress={handleCreateTag}
                disabled={creatingTag || !newTagName.trim()}
              >
                {creatingTag ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Crear Etiqueta</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Lista de etiquetas existentes */}
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Etiquetas Existentes</Text>

              {tagsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3ba3a4" />
                  <Text style={styles.loadingText}>Cargando etiquetas...</Text>
                </View>
              ) : tags.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="pricetag-outline" size={48} color="#e0e0e0" />
                  <Text style={styles.emptyText}>No hay etiquetas creadas</Text>
                  <Text style={styles.emptySubtext}>Crea tu primera etiqueta para comenzar</Text>
                </View>
              ) : (
                <View style={styles.tagsList}>
                  {tags.map((tag) => (
                    <View key={tag.id} style={styles.tagItem}>
                      <View style={styles.tagInfo}>
                        <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
                        
                        {editingTagId === tag.id ? (
                          <View style={styles.editContainer}>
                            <TextInput
                              style={styles.editInput}
                              value={editingTagName}
                              onChangeText={setEditingTagName}
                              maxLength={30}
                              autoFocus
                              placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                              style={styles.saveButton}
                              onPress={() => handleSaveTag(tag)}
                              disabled={updatingTagId === tag.id}
                            >
                              {updatingTagId === tag.id ? (
                                <ActivityIndicator size="small" color="#3ba3a4" />
                              ) : (
                                <Ionicons name="checkmark" size={18} color="#3ba3a4" />
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={handleCancelEditing}
                            >
                              <Ionicons name="close" size={18} color="#666" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.tagNameContainer}
                            onPress={() => handleStartEditing(tag)}
                          >
                            <Text style={styles.tagName}>{tag.name}</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.actionsContainer}>
                        {editingTagId !== tag.id && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteTag(tag.id, tag.name)}
                            disabled={deletingTag && deletingTagId === tag.id}
                          >
                            {deletingTag && deletingTagId === tag.id ? (
                              <ActivityIndicator size="small" color="#ff6b6b" />
                            ) : (
                              <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={onClose}
              disabled={creatingTag || deletingTag}
            >
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    position: 'absolute' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '85%' as any,
    height: '75%' as any,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden' as 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: '#333',
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
  },
  createSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  tagsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: '#333',
    marginBottom: 12,
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  colorTitle: {
    fontSize: 14,
    fontWeight: '500' as '500',
    color: '#666',
    marginBottom: 10,
  },
  colorSelector: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    flexWrap: 'wrap' as 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#3ba3a4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  createButton: {
    backgroundColor: '#3ba3a4',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: 'white',
  },
  loadingContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    padding: 16,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center' as 'center',
  },
  tagsList: {
    gap: 6,
  },
  tagItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'space-between' as 'space-between',
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tagInfo: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 10,
    flex: 1,
  },
  tagColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  tagName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500' as '500',
  },
  tagNameContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  editContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    flex: 1,
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3ba3a4',
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  saveButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#3ba3a4',
  },
  cancelButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionsContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 6,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  closeModalButton: {
    backgroundColor: '#f0f2f5',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#666',
  },
};

export default TagManagerModal;
