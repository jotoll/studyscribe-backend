import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JSONRendererStyles as styles } from '../JSONRendererStyles';

interface SummaryBlockRendererProps {
  section: any;
  index: number;
  onEdit: (path: string, element: any) => void;
  onDelete: (path: string, element: any) => void;
  onAdd: (type: string | any, position?: number) => void;
  openAIModal: (section: any, index: number) => void;
  setInsertPosition: (position: number | null) => void;
  setShowAddMenu: (show: boolean) => void;
}

const SummaryBlockRenderer: React.FC<SummaryBlockRendererProps> = ({
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
        style={[styles.summaryContainer, styles.editableContainer]}
        onPress={() => onEdit(`sections.${index}`, section)}
      >
        <Text style={styles.sectionTitle}>📋 Resumen</Text>
        <Text style={styles.summaryText}>{section.content}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SummaryBlockRenderer;