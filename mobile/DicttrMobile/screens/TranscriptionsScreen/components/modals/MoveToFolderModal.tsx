import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Folder } from '../../types';

interface MoveToFolderModalProps {
  visible: boolean;
  onClose: () => void;
  folders: Folder[];
  selectedFolder: string | null;
  movingTranscription: boolean;
  onMoveToFolder: (transcriptionId: string, folderId: string | null) => void;
  selectedTranscriptionId: string | null;
}

const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  visible,
  onClose,
  folders,
  selectedFolder,
  movingTranscription,
  onMoveToFolder,
  selectedTranscriptionId
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Mover a Carpeta</Text>
          <Text style={styles.modalSubtitle}>Selecciona la carpeta destino</Text>

          <ScrollView style={styles.folderList} contentContainerStyle={styles.folderListContent}>
            <TouchableOpacity
              style={[styles.folderItem, !selectedFolder && styles.folderItemSelected]}
              onPress={() => selectedTranscriptionId && onMoveToFolder(selectedTranscriptionId, null)}
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
                onPress={() => selectedTranscriptionId && onMoveToFolder(selectedTranscriptionId, folder.id)}
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
            onPress={onClose}
            disabled={movingTranscription}
          >
            <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
          </TouchableOpacity>
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
    width: 340,
    maxHeight: 500,
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
  folderList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  folderListContent: {
    paddingBottom: 8,
  },
  folderItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  folderItemSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  folderItemText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  folderItemTextSelected: {
    color: '#2196f3',
    fontWeight: '500' as '500',
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: '#666',
  },
};

export default MoveToFolderModal;