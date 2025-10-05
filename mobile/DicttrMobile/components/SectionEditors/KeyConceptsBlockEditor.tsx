import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface KeyConceptsBlockEditorProps {
  section: any;
  index: number;
  editMode: 'full' | 'single';
  updateField: (path: (string | number)[], value: any) => void;
  removeSection: (index: number) => void;
  setInsertPosition: (position: number | null) => void;
  setShowAddMenu: (show: boolean) => void;
  styles: any;
}

const KeyConceptsBlockEditor: React.FC<KeyConceptsBlockEditorProps> = ({
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
        <Text style={styles.sectionType}>🔑 Conceptos Clave</Text>
        <View style={styles.sectionActions}>
          <TouchableOpacity
            style={styles.insertButton}
            onPress={() => { setInsertPosition(index); setShowAddMenu(true); }}
          >
            <Ionicons name="add" size={16} color="#3ba3a4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeSection(index)}>
            <Ionicons name="trash" size={20} color="#e27667" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Conceptos:</Text>
      {(section.concepts || []).map((concept: string, conceptIndex: number) => (
        <View key={`concept-editor-${conceptIndex}`} style={styles.listItemEditor}>
          <TextInput
            style={[styles.input, styles.listItemInput]}
            value={concept}
            onChangeText={(text) => {
              const newConcepts = [...section.concepts];
              newConcepts[conceptIndex] = text;

              // En modo single edit, usar path relativo ['concepts']
              // En modo full edit, usar path completo ['sections', index, 'concepts']
              if (editMode === 'single') {
                updateField(['concepts'], newConcepts);
              } else {
                updateField(['sections', index, 'concepts'], newConcepts);
              }
            }}
            placeholder={`Concepto clave ${conceptIndex + 1}`}
          />
          <TouchableOpacity
            onPress={() => {
              const newConcepts = [...section.concepts];
              newConcepts.splice(conceptIndex, 1);

              // En modo single edit, usar path relativo ['concepts']
              // En modo full edit, usar path completo ['sections', index, 'concepts']
              if (editMode === 'single') {
                updateField(['concepts'], newConcepts);
              } else {
                updateField(['sections', index, 'concepts'], newConcepts);
              }
            }}
            style={styles.removeItemButton}
          >
            <Ionicons name="close-circle" size={20} color="#e27667" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={() => {
          const newConcepts = [...(section.concepts || []), ''];

          // En modo single edit, usar path relativo ['concepts']
          // En modo full edit, usar path completo ['sections', index, 'concepts']
          if (editMode === 'single') {
            updateField(['concepts'], newConcepts);
          } else {
            updateField(['sections', index, 'concepts'], newConcepts);
          }
        }}
        style={styles.addButton}
      >
        <Ionicons name="add" size={16} color="#3ba3a4" />
        <Text style={styles.addButtonText}>Añadir concepto</Text>
      </TouchableOpacity>
    </View>
  );
};

export default KeyConceptsBlockEditor;