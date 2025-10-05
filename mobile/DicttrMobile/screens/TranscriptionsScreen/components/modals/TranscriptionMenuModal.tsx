import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transcription } from '../../types';
import FoldersModal from '../../../../components/FoldersModal';
import { folderAPI } from '../../../../services/api';

interface TranscriptionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  transcription: Transcription | null;
  onMoveToFolder: () => void;
  onAssignTags: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onFolderChange?: (folder: any | null) => void;
}

const TranscriptionMenuModal: React.FC<TranscriptionMenuModalProps> = ({
  visible,
  onClose,
  transcription,
  onMoveToFolder,
  onAssignTags,
  onToggleFavorite,
  onDelete,
  onFolderChange
}) => {
  const [showFoldersModal, setShowFoldersModal] = useState(false);

  if (!transcription) return null;

  const handleFolderSelect = async (folder: any | null) => {
    try {
      // Actualizar la carpeta en la base de datos
      await folderAPI.moveTranscriptionToFolder(transcription.id, folder?.id || null);
      
      // Llamar al callback si está disponible
      onFolderChange?.(folder);
      
      // Cerrar el modal de carpetas
      setShowFoldersModal(false);
      
      // Mostrar mensaje de éxito
      // Alert.alert('Éxito', `Transcripción movida a ${folder ? folder.name : 'Sin carpeta'}`);
    } catch (error) {
      console.error('Error moviendo transcripción a carpeta:', error);
      // Alert.alert('Error', 'No se pudo mover la transcripción a la carpeta');
    }
  };

  return (
    <>
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
              <View
                style={styles.largeMenuContainer}
              >
                <Text style={styles.modalTitle}>Opciones de Transcripción</Text>
                <Text style={styles.modalSubtitle}>{transcription.title}</Text>

                <TouchableOpacity
                  style={styles.largeMenuItem}
                  onPress={() => setShowFoldersModal(true)}
                >
                  <Ionicons name="folder-outline" size={24} color="#666" />
                  <Text style={styles.largeMenuItemText}>Mover a carpeta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.largeMenuItem}
                  onPress={onAssignTags}
                >
                  <Ionicons name="pricetag-outline" size={24} color="#666" />
                  <Text style={styles.largeMenuItemText}>Gestionar etiquetas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.largeMenuItem}
                  onPress={onToggleFavorite}
                >
                  <Ionicons
                    name={transcription.is_favorite ? "star" : "star-outline"}
                    size={24}
                    color={transcription.is_favorite ? "#FFD700" : "#666"}
                  />
                  <Text style={styles.largeMenuItemText}>
                    {transcription.is_favorite ? "Quitar favorito" : "Marcar favorito"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.largeMenuItem, styles.largeMenuItemDanger]}
                  onPress={onDelete}
                >
                  <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
                  <Text style={[styles.largeMenuItemText, styles.largeMenuItemTextDanger]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal de selección de carpetas */}
      <FoldersModal
        visible={showFoldersModal}
        onClose={() => setShowFoldersModal(false)}
        onFolderSelect={handleFolderSelect}
        currentFolder={transcription.folder_id ? {
          id: transcription.folder_id,
          name: 'Carpeta actual', // Esto se actualizará cuando se cargue la carpeta
          color: '#f0f2f5',
          icon: 'folder'
        } : null}
      />
    </>
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
    padding: 20,
  },
  largeMenuContainer: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as '600',
    color: '#333',
    textAlign: 'center' as 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as 'center',
    marginBottom: 20,
  },
  largeMenuItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  largeMenuItemDanger: {
    borderBottomWidth: 0,
  },
  largeMenuItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  largeMenuItemTextDanger: {
    color: '#ff6b6b',
  },
};

export default TranscriptionMenuModal;
