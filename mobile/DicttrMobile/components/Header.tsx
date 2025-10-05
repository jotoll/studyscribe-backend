import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TagsModal from './TagsModal';
import FoldersModal from './FoldersModal';
import ConfigMenu from './ConfigMenu';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface HeaderProps {
  enhancedText: any;
  navigateToTranscriptions: () => void;
  logout: () => void;
  currentTranscriptionId?: string | null;
  selectedTags?: Tag[];
  selectedFolder?: Folder | null;
  currentSubject?: string;
  onTagsChange?: (tags: Tag[], transcriptionId?: string) => void;
  onFolderChange?: (folder: Folder | null, transcriptionId?: string) => void;
  onSubjectChange?: (subject: string, transcriptionId?: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  enhancedText,
  navigateToTranscriptions,
  logout,
  currentTranscriptionId,
  selectedTags = [],
  selectedFolder = null,
  currentSubject = '',
  onTagsChange,
  onFolderChange,
  onSubjectChange
}) => {
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showFoldersModal, setShowFoldersModal] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editedSubject, setEditedSubject] = useState(currentSubject);

  const handleTagSelect = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    const newTags = isSelected
      ? selectedTags.filter(t => t.id !== tag.id)
      : [...selectedTags, tag];

    onTagsChange?.(newTags, currentTranscriptionId || undefined);
  };

  const handleFolderSelect = (folder: Folder | null) => {
    onFolderChange?.(folder, currentTranscriptionId || undefined);
    setShowFoldersModal(false);
  };

  const handleSubjectEdit = () => {
    setIsEditingSubject(true);
    setEditedSubject(currentSubject);
  };

  const handleSubjectSave = () => {
    setIsEditingSubject(false);
    if (editedSubject !== currentSubject) {
      onSubjectChange?.(editedSubject, currentTranscriptionId || undefined);
    }
  };

  const handleSubjectCancel = () => {
    setIsEditingSubject(false);
    setEditedSubject(currentSubject);
  };

  // Determinar si la nota está vacía (sin transcripción mejorada)
  const isNoteEmpty = !enhancedText || Object.keys(enhancedText).length === 0;

  return (
    <View style={styles.header}>
      {/* Primera línea: Botón Mis Transcripciones y Título */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={navigateToTranscriptions}
          style={styles.transcriptionsButton}
        >
          <Ionicons name="list" size={20} color="#3ba3a4" />
        </TouchableOpacity>
        <Text
          style={styles.recordingName}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {enhancedText?.title || 'Nueva nota'}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setShowConfigMenu(true)} 
            style={styles.configButton}
          >
            <Ionicons name="settings-outline" size={20} color="#3ba3a4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#e27667" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mostrar asunto, etiquetas y carpetas solo si la nota NO está vacía */}
      {!isNoteEmpty && (
        <>
          {/* Segunda línea: Asunto */}
          <View style={styles.subjectRow}>
            <TouchableOpacity
              style={styles.subjectSelectorButton}
              onPress={isEditingSubject ? handleSubjectSave : handleSubjectEdit}
            >
              <Ionicons 
                name={isEditingSubject ? "checkmark" : "create-outline"} 
                size={16} 
                color="#3ba3a4" 
              />
            </TouchableOpacity>

            <View style={styles.subjectContainer}>
              {isEditingSubject ? (
                <View style={styles.subjectEditContainer}>
                  <TextInput
                    style={styles.subjectInput}
                    value={editedSubject}
                    onChangeText={setEditedSubject}
                    placeholder="Escribe el asunto..."
                    autoFocus
                    onBlur={handleSubjectSave}
                    onSubmitEditing={handleSubjectSave}
                  />
                  <TouchableOpacity onPress={handleSubjectCancel} style={styles.subjectCancelButton}>
                    <Ionicons name="close" size={14} color="#999" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={handleSubjectEdit} style={styles.subjectDisplay}>
                  <Text 
                    style={[
                      styles.subjectText,
                      currentSubject ? styles.subjectTextWithContent : styles.subjectTextPlaceholder
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {currentSubject || 'Sin asunto'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tercera línea: Etiquetas */}
          <View style={styles.tagsRow}>
            <TouchableOpacity
              style={styles.tagSelectorButton}
              onPress={() => setShowTagsModal(true)}
            >
              <Ionicons name="pricetag-outline" size={18} color="#28677d" />
            </TouchableOpacity>

            <View style={styles.tagsContainer}>
              {selectedTags && selectedTags.length > 0 ? (
                selectedTags.map(tag => (
                  <View key={tag.id} style={[styles.tagBadge, { backgroundColor: tag.color + '20' }]}>
                    <Ionicons name="pricetag-outline" size={12} color={tag.color} />
                    <Text style={[styles.tagText, { color: tag.color }]} numberOfLines={1}>
                      {tag.name}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.placeholderText}>Sin etiquetas</Text>
              )}
            </View>
          </View>

          {/* Cuarta línea: Carpetas */}
          <View style={styles.folderRow}>
            <TouchableOpacity
              style={styles.folderSelectorButton}
              onPress={() => setShowFoldersModal(true)}
            >
              <Ionicons name="folder-outline" size={18} color="#97447a" />
            </TouchableOpacity>

            <View style={styles.folderContainer}>
              {selectedFolder ? (
                <View style={[styles.folderItem, { backgroundColor: selectedFolder.color + '20' }]}>
                  <View style={[styles.folderIconContainer, { backgroundColor: selectedFolder.color }]}>
                    <Ionicons name={selectedFolder.icon as any} size={14} color="white" />
                  </View>
                  <Text style={styles.folderText}>{selectedFolder.name}</Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Sin carpeta</Text>
              )}
            </View>
          </View>
        </>
      )}

      {/* Modales */}
      <TagsModal
        visible={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        onTagSelect={handleTagSelect}
        currentTags={selectedTags}
      />

      <FoldersModal
        visible={showFoldersModal}
        onClose={() => setShowFoldersModal(false)}
        onFolderSelect={handleFolderSelect}
        currentFolder={selectedFolder}
      />

      {/* Modal de Configuración */}
      <ConfigMenu
        visible={showConfigMenu}
        onClose={() => setShowConfigMenu(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  transcriptionsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
  recordingName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectSelectorButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    marginRight: 8,
  },
  subjectContainer: {
    flex: 1,
  },
  subjectEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subjectInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 4,
  },
  subjectCancelButton: {
    padding: 4,
    marginLeft: 8,
  },
  subjectDisplay: {
    paddingVertical: 4,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  subjectTextWithContent: {
    color: '#3ba3a4',
  },
  subjectTextPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagSelectorButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flexShrink: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderSelectorButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    marginRight: 8,
  },
  folderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flexShrink: 1,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  folderIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
});

export default Header;
