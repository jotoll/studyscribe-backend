import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pastelColors } from '../../types';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  newFolderName: string;
  onFolderNameChange: (name: string) => void;
  selectedIcon: string;
  onIconSelect: (icon: string) => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  creatingFolder: boolean;
  deletingFolder: boolean;
  updatingFolder: boolean;
  onCreateFolder: () => void;
  onDeleteFolder: (folderId: string) => void;
  onUpdateFolder: (folderId: string, newName: string) => void;
  folders: any[];
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  visible,
  onClose,
  newFolderName,
  onFolderNameChange,
  selectedIcon,
  onIconSelect,
  selectedColor,
  onColorSelect,
  creatingFolder,
  deletingFolder,
  updatingFolder,
  onCreateFolder,
  onDeleteFolder,
  onUpdateFolder,
  folders
}) => {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editedFolderName, setEditedFolderName] = useState<string>('');

  const handleEditFolder = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditedFolderName(currentName);
  };

  const handleSaveFolderName = (folderId: string) => {
    if (!editedFolderName.trim()) {
      Alert.alert('Error', 'El nombre de la carpeta no puede estar vacío');
      return;
    }

    const newName = editedFolderName.trim();

    // Verificar si ya existe una carpeta con el mismo nombre (excluyendo la carpeta actual)
    const existingFolder = folders.find(folder =>
      folder.id !== folderId && folder.name.toLowerCase() === newName.toLowerCase()
    );

    if (existingFolder) {
      Alert.alert('Error', `Ya existe una carpeta con el nombre "${newName}"`);
      return;
    }

    onUpdateFolder(folderId, newName);
    setEditingFolderId(null);
    setEditedFolderName('');
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
    setEditedFolderName('');
  };
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'El nombre de la carpeta no puede estar vacío');
      return;
    }

    const folderName = newFolderName.trim();

    // Verificar si ya existe una carpeta con el mismo nombre
    const existingFolder = folders.find(folder =>
      folder.name.toLowerCase() === folderName.toLowerCase()
    );

    if (existingFolder) {
      Alert.alert('Error', `Ya existe una carpeta con el nombre "${folderName}"`);
      return;
    }

    onCreateFolder();
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    Alert.alert(
      'Eliminar Carpeta',
      `¿Estás seguro de que quieres eliminar la carpeta "${folderName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDeleteFolder(folderId)
        }
      ]
    );
  };

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
            <Text style={styles.largeModalTitle}>Nueva Carpeta</Text>
            <TouchableOpacity onPress={onClose} style={styles.largeCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.largeModalContent} contentContainerStyle={styles.largeModalContentContainer}>
            {/* Sección de creación de carpeta (ARRIBA) */}
            <Text style={styles.largeModalSubtitle}>Ingresa el nombre de la nueva carpeta</Text>

            <TextInput
              style={styles.largeModalInput}
              placeholder="Nombre de la carpeta"
              value={newFolderName}
              onChangeText={onFolderNameChange}
              maxLength={50}
              placeholderTextColor="#999"
              autoFocus={true}
            />

            {/* Selector de iconos */}
            <Text style={styles.largeIconSelectorTitle}>Seleccionar icono:</Text>
            <View style={styles.largeIconSelector}>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'folder' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('folder')}
              >
                <Ionicons name="folder" size={24} color={selectedIcon === 'folder' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'book' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('book')}
              >
                <Ionicons name="book" size={24} color={selectedIcon === 'book' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'school' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('school')}
              >
                <Ionicons name="school" size={24} color={selectedIcon === 'school' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'document' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('document')}
              >
                <Ionicons name="document" size={24} color={selectedIcon === 'document' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
            </View>
            <View style={styles.largeIconSelector}>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'briefcase' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('briefcase')}
              >
                <Ionicons name="briefcase" size={24} color={selectedIcon === 'briefcase' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'calendar' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('calendar')}
              >
                <Ionicons name="calendar" size={24} color={selectedIcon === 'calendar' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'star' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('star')}
              >
                <Ionicons name="star" size={24} color={selectedIcon === 'star' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'heart' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('heart')}
              >
                <Ionicons name="heart" size={24} color={selectedIcon === 'heart' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
            </View>
            <View style={styles.largeIconSelector}>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'musical-notes' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('musical-notes')}
              >
                <Ionicons name="musical-notes" size={24} color={selectedIcon === 'musical-notes' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'language' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('language')}
              >
                <Ionicons name="language" size={24} color={selectedIcon === 'language' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'calculator' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('calculator')}
              >
                <Ionicons name="calculator" size={24} color={selectedIcon === 'calculator' ? '#3ba3a4' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.largeIconOption, selectedIcon === 'flask' && styles.largeIconOptionSelected]}
                onPress={() => onIconSelect('flask')}
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
                  onPress={() => onColorSelect(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={20} color="#333" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Sección de carpetas existentes (ABAJO) */}
            {folders.length > 0 && (
              <View style={styles.existingFoldersSection}>
                <Text style={styles.sectionTitle}>Carpetas existentes</Text>
                {folders.map((folder) => (
                  <View key={folder.id} style={styles.folderItem}>
                    <View style={styles.folderInfo}>
                      <Ionicons
                        name={folder.icon as any || "folder"}
                        size={20}
                        color={folder.color}
                        style={styles.folderIcon}
                      />
                      
                      {editingFolderId === folder.id ? (
                        <View style={styles.folderEditContainer}>
                          <TextInput
                            style={styles.folderNameInput}
                            value={editedFolderName}
                            onChangeText={setEditedFolderName}
                            autoFocus
                            maxLength={50}
                            placeholderTextColor="#999"
                            onBlur={() => handleSaveFolderName(folder.id)}
                            onSubmitEditing={() => handleSaveFolderName(folder.id)}
                          />
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSaveFolderName(folder.id)}
                            disabled={updatingFolder}
                          >
                            {updatingFolder ? (
                              <ActivityIndicator size="small" color="#3ba3a4" />
                            ) : (
                              <Ionicons name="checkmark" size={16} color="#3ba3a4" />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancelEdit}
                          >
                            <Ionicons name="close" size={14} color="#666" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.folderNameContainer}
                          onPress={() => handleEditFolder(folder.id, folder.name)}
                        >
                          <Text style={styles.folderName}>{folder.name}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {editingFolderId !== folder.id && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteFolder(folder.id, folder.name)}
                        disabled={deletingFolder}
                      >
                        {deletingFolder ? (
                          <ActivityIndicator size="small" color="#666" />
                        ) : (
                          <Ionicons name="trash-outline" size={18} color="#666" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
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
  largeModalContainer: {
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
  } as any,
  largeModalHeader: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  largeModalTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
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
  existingFoldersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: '#333',
    marginBottom: 12,
  },
  folderItem: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
  },
  folderInfo: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    flex: 1,
  },
  folderIcon: {
    marginRight: 8,
  },
  folderName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500' as '500',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  largeModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as 'center',
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
    fontSize: 14,
    fontWeight: '500' as '500',
    color: '#666',
    marginBottom: 10,
  },
  largeIconSelector: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  largeIconOption: {
    padding: 12,
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
    fontSize: 14,
    fontWeight: '500' as '500',
    color: '#666',
    marginBottom: 10,
  },
  largeColorSelector: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    flexWrap: 'wrap' as 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  largeColorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
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
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    gap: 12,
  },
  largeModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
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
    fontWeight: '600' as '600',
    color: '#666',
  },
  largeModalButtonTextCreate: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: 'white',
  },
  folderEditContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    flex: 1,
    gap: 8,
  },
  folderNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'white',
  },
  folderNameContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  saveButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#3ba3a4',
  },
  cancelButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
};

export default CreateFolderModal;
