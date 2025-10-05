import React, { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '../../../../services/api';

interface ManageTagsModalProps {
  visible: boolean;
  onClose: () => void;
  transcriptionId: string | null;
  transcriptionTitle: string;
  availableTags: Tag[];
  currentTags: Tag[];
  onTagsUpdate: (transcriptionId: string, tagIds: string[]) => void;
}

const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  visible,
  onClose,
  transcriptionId,
  transcriptionTitle,
  availableTags,
  currentTags,
  onTagsUpdate
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [updatingTags, setUpdatingTags] = useState(false);

  useEffect(() => {
    if (visible && currentTags) {
      setSelectedTags(currentTags.map(tag => tag.id));
    }
  }, [visible, currentTags]);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSaveTags = async () => {
    if (!transcriptionId) return;

    setUpdatingTags(true);
    try {
      await onTagsUpdate(transcriptionId, selectedTags);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron actualizar las etiquetas');
    } finally {
      setUpdatingTags(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.centeredContainer}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Gestionar Etiquetas</Text>
              <Text style={styles.modalSubtitle}>{transcriptionTitle}</Text>

              <ScrollView style={styles.tagsList} contentContainerStyle={styles.tagsListContent}>
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagItem,
                      { backgroundColor: tag.color + '20' },
                      selectedTags.includes(tag.id) && styles.tagItemSelected
                    ]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
                    <Text style={[
                      styles.tagText,
                      selectedTags.includes(tag.id) && styles.tagTextSelected
                    ]}>
                      {tag.name}
                    </Text>
                    {selectedTags.includes(tag.id) && (
                      <Ionicons name="checkmark" size={20} color="#3ba3a4" />
                    )}
                  </TouchableOpacity>
                ))}

                {availableTags.length === 0 && (
                  <View style={styles.emptyTags}>
                    <Ionicons name="pricetag-outline" size={48} color="#e0e0e0" />
                    <Text style={styles.emptyTagsText}>No hay etiquetas disponibles</Text>
                    <Text style={styles.emptyTagsSubtext}>Crea etiquetas para organizar tus transcripciones</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={onClose}
                  disabled={updatingTags}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleSaveTags}
                  disabled={updatingTags}
                >
                  {updatingTags ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonTextSave}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
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
    zIndex: 1000,
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    padding: 16,
  },
  modalContainer: {
    width: 320,
    maxHeight: 450,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: '#333',
    textAlign: 'center' as 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center' as 'center',
    marginBottom: 16,
  },
  tagsList: {
    maxHeight: 280,
    marginBottom: 16,
  },
  tagsListContent: {
    paddingBottom: 6,
  },
  tagItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tagItemSelected: {
    borderColor: '#3ba3a4',
    backgroundColor: '#e3f2fd',
  },
  tagColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  tagTextSelected: {
    color: '#3ba3a4',
    fontWeight: '500' as '500',
  },
  emptyTags: {
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    padding: 32,
  },
  emptyTagsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyTagsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center' as 'center',
  },
  modalFooter: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonSave: {
    backgroundColor: '#3ba3a4',
  },
  modalButtonTextCancel: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#666',
  },
  modalButtonTextSave: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: 'white',
  },
};

export default ManageTagsModal;