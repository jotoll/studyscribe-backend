import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeadingEditorProps {
  section: any;
  index: number;
  editMode: 'full' | 'single';
  updateField: (path: (string | number)[], value: any) => void;
  removeSection: (index: number) => void;
  setInsertPosition: (position: number | null) => void;
  setShowAddMenu: (show: boolean) => void;
  styles: any;
}

const HeadingEditor: React.FC<HeadingEditorProps> = ({
  section,
  index,
  editMode,
  updateField,
  removeSection,
  setInsertPosition,
  setShowAddMenu,
  styles
}) => {
  return (
    <View style={styles.sectionEditor}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionType}>📝 Encabezado</Text>
        <View style={styles.sectionActions}>
          {editMode === 'full' && (
            <TouchableOpacity
              style={styles.insertButton}
              onPress={() => { setInsertPosition(index); setShowAddMenu(true); }}
            >
              <Ionicons name="add" size={16} color="#3ba3a4" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => removeSection(index)}>
            <Ionicons name="trash" size={20} color="#e27667" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Nivel:</Text>
      <View style={styles.levelSelector}>
        {[1, 2, 3].map(level => (
          <TouchableOpacity
            key={level.toString()}
            style={[styles.levelButton, section.level === level && styles.activeLevelButton]}
            onPress={() => {
              // En modo single edit, usar path relativo ['level']
              // En modo full edit, usar path completo ['sections', index, 'level']
              if (editMode === 'single') {
                updateField(['level'], level);
              } else {
                updateField(['sections', index, 'level'], level);
              }
            }}
          >
            <Text style={styles.levelButtonText}>H{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Contenido:</Text>
      <TextInput
        style={styles.input}
        value={section.content || ''}
        onChangeText={(text) => {
          // En modo single edit, usar path relativo ['content']
          // En modo full edit, usar path completo ['sections', index, 'content']
          if (editMode === 'single') {
            updateField(['content'], text);
          } else {
            updateField(['sections', index, 'content'], text);
          }
        }}
        placeholder="Título del encabezado"
        multiline
      />
    </View>
  );
};

export default HeadingEditor;