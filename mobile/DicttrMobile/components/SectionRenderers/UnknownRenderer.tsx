import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JSONRendererStyles as styles } from '../JSONRendererStyles';

interface UnknownRendererProps {
  section: any;
  index: number;
  onEdit: (path: string, element: any) => void;
  onDelete: (path: string, element: any) => void;
  onAdd: (type: string | any, position?: number) => void;
  openAIModal: (section: any, index: number) => void;
  setInsertPosition: (position: number | null) => void;
  setShowAddMenu: (show: boolean) => void;
}

const UnknownRenderer: React.FC<UnknownRendererProps> = ({
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
          style={styles.deleteButton}
          onPress={() => onDelete(`sections.${index}`, section)}
        >
          <Ionicons name="trash" size={16} color="#e27667" />
        </TouchableOpacity>
      </View>
      <View style={[styles.unknownContainer, styles.editableContainer]}>
        <Text style={styles.unknownText}>
          {JSON.stringify(section, null, 2)}
        </Text>
      </View>
    </View>
  );
};

export default UnknownRenderer;