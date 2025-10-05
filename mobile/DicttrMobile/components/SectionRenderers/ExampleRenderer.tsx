import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JSONRendererStyles as styles } from '../JSONRendererStyles';

interface ExampleRendererProps {
  section: any;
  index: number;
  onEdit: (path: string, element: any) => void;
  onDelete: (path: string, element: any) => void;
  onAdd: (type: string | any, position?: number) => void;
  openAIModal: (section: any, index: number) => void;
  setInsertPosition: (position: number | null) => void;
  setShowAddMenu: (show: boolean) => void;
}

const ExampleRenderer: React.FC<ExampleRendererProps> = ({
  section,
  index,
  onEdit,
  onDelete,
  onAdd,
  openAIModal,
  setInsertPosition,
  setShowAddMenu
}) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setInsertPosition(index);
              setShowAddMenu(true);
            }}
          >
            <Ionicons name="add" size={16} color="#3ba3a4" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: 'rgba(59, 163, 164, 0.2)' }]}
            onPress={() => openAIModal(section, index)}
          >
            <Ionicons name="sparkles" size={16} color="#3ba3a4" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(`sections.${index}`, section)}
        >
          <Ionicons name="trash" size={16} color="#e27667" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.exampleContainer, styles.editableContainer]}
        onPress={() => onEdit(`sections.${index}`, section)}
      >
        <Text style={styles.exampleTitle}>📝 Ejemplo</Text>
        <Text style={styles.exampleText}>{section.content}</Text>
        {section.title && (
          <Text style={[styles.exampleText, {fontWeight: 'bold', marginTop: 8}]}>
            {section.title}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ExampleRenderer;