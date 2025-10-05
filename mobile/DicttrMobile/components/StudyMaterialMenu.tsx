import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StudyMaterialMenuProps {
  visible: boolean;
  onClose: () => void;
  onGenerateMaterial: (type: 'summary' | 'flashcards' | 'concepts' | 'quiz' | 'flowchart') => void;
  onOpenBlockEditor: () => void;
  onNavigateToTranscriptions: () => void;
  loading: boolean;
}

const StudyMaterialMenu: React.FC<StudyMaterialMenuProps> = ({
  visible,
  onClose,
  onGenerateMaterial,
  onOpenBlockEditor,
  onNavigateToTranscriptions,
  loading
}) => {
  if (!visible) return null;

  const menuItems = [
    {
      key: 'summary',
      icon: 'document-text',
      label: 'Resumen',
      onPress: () => onGenerateMaterial('summary')
    },
    {
      key: 'flashcards',
      icon: 'albums',
      label: 'Flashcards',
      onPress: () => onGenerateMaterial('flashcards')
    },
    {
      key: 'concepts',
      icon: 'bulb',
      label: 'Conceptos',
      onPress: () => onGenerateMaterial('concepts')
    },
    {
      key: 'quiz',
      icon: 'help-circle',
      label: 'Quiz',
      onPress: () => onGenerateMaterial('quiz')
    },
    {
      key: 'flowchart',
      icon: 'git-branch',
      label: 'Flujograma',
      onPress: () => onGenerateMaterial('flowchart')
    },
    {
      key: 'editor',
      icon: 'document',
      label: 'Editor IA',
      onPress: onOpenBlockEditor
    },
    {
      key: 'transcriptions',
      icon: 'list',
      label: 'Mis Transcripciones',
      onPress: onNavigateToTranscriptions
    }
  ];

  return (
    <View style={styles.materialMenu}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.materialMenuItem}
          onPress={() => {
            item.onPress();
            onClose();
          }}
          disabled={loading}
        >
          <Ionicons name={item.icon as any} size={20} color="#4A00E0" />
          <Text style={styles.materialMenuItemText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = {
  materialMenu: {
    position: 'absolute' as const,
    bottom: 90,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  materialMenuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#f8f9fa',
  },
  materialMenuItemText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#333',
  },
};

export default StudyMaterialMenu;