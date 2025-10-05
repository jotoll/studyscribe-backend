import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConceptBlockEditorProps {
  section: any;
  index: number;
  editMode: 'full' | 'single';
  updateField: (path: (string | number)[], value: any) => void;
  removeSection: (index: number) => void;
  addExample: (sectionIndex: number) => void;
  removeExample: (sectionIndex: number, exampleIndex: number) => void;
  setInsertPosition: (position: number | null) => void;
  setShowAddMenu: (show: boolean) => void;
  styles: any;
}

const ConceptBlockEditor: React.FC<ConceptBlockEditorProps> = ({
  section,
  index,
  editMode,
  updateField,
  removeSection,
  addExample,
  removeExample,
  setInsertPosition,
  setShowAddMenu,
  styles
}) => {
  return (
    <View style={styles.sectionEditor}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionType}>🎯 Concepto</Text>
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

      <Text style={styles.label}>Término:</Text>
      <TextInput
        style={styles.input}
        value={section.term || ''}
        onChangeText={(text) => {
          // En modo single edit, usar path relativo ['term']
          // En modo full edit, usar path completo ['sections', index, 'term']
          if (editMode === 'single') {
            updateField(['term'], text);
          } else {
            updateField(['sections', index, 'term'], text);
          }
        }}
        placeholder="Nombre del concepto"
      />

      <Text style={styles.label}>Definición:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={section.definition || ''}
        onChangeText={(text) => {
          // En modo single edit, usar path relativo ['definition']
          // En modo full edit, usar path completo ['sections', index, 'definition']
          if (editMode === 'single') {
            updateField(['definition'], text);
          } else {
            updateField(['sections', index, 'definition'], text);
          }
        }}
        placeholder="Definición del concepto"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Ejemplos:</Text>
      {(section.examples || []).map((example: string, exampleIndex: number) => (
        <View key={`example-editor-${exampleIndex}`} style={styles.listItemEditor}>
          <TextInput
            style={[styles.input, styles.listItemInput]}
            value={example || ''}
            onChangeText={(text) => {
              const newExamples = [...(section.examples || [])];
              newExamples[exampleIndex] = text;

              // En modo single edit, usar path relativo ['examples']
              // En modo full edit, usar path completo ['sections', index, 'examples']
              if (editMode === 'single') {
                updateField(['examples'], newExamples);
              } else {
                updateField(['sections', index, 'examples'], newExamples);
              }
            }}
            placeholder={`Ejemplo ${exampleIndex + 1}`}
          />
          <TouchableOpacity
            onPress={() => removeExample(index, exampleIndex)}
            style={styles.removeItemButton}
          >
            <Ionicons name="close-circle" size={20} color="#e27667" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={() => addExample(index)}
        style={styles.addButton}
      >
        <Ionicons name="add" size={16} color="#3ba3a4" />
        <Text style={styles.addButtonText}>Añadir ejemplo</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConceptBlockEditor;