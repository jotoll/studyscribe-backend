import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ListEditorProps {
  section: any;
  index: number;
  editMode: 'full' | 'single';
  updateField: (path: (string | number)[], value: any) => void;
  removeSection: (index: number) => void;
  addListItem: (sectionIndex: number) => void;
  removeListItem: (sectionIndex: number, itemIndex: number) => void;
  setInsertPosition: (position: number | null) => void;
  setShowAddMenu: (show: boolean) => void;
  styles: any;
}

const ListEditor: React.FC<ListEditorProps> = ({
  section,
  index,
  editMode,
  updateField,
  removeSection,
  addListItem,
  removeListItem,
  setInsertPosition,
  setShowAddMenu,
  styles
}) => {
  return (
    <View style={styles.sectionEditor}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionType}>📋 Lista</Text>
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

      <Text style={styles.label}>Tipo de lista:</Text>
      <View style={styles.listTypeSelector}>
        <TouchableOpacity
          style={[styles.listTypeButton, section.style === 'bulleted' && styles.activeListTypeButton]}
          onPress={() => {
            // En modo single edit, usar path relativo ['style']
            // En modo full edit, usar path completo ['sections', index, 'style']
            if (editMode === 'single') {
              updateField(['style'], 'bulleted');
            } else {
              updateField(['sections', index, 'style'], 'bulleted');
            }
          }}
        >
          <Ionicons name="remove" size={16} color={section.style === 'bulleted' ? 'white' : '#666'} />
          <Text style={[styles.listTypeButtonText, section.style === 'bulleted' && styles.activeListTypeButtonText]}>Viñetas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.listTypeButton, section.style === 'numbered' && styles.activeListTypeButton]}
          onPress={() => {
            // En modo single edit, usar path relativo ['style']
            // En modo full edit, usar path completo ['sections', index, 'style']
            if (editMode === 'single') {
              updateField(['style'], 'numbered');
            } else {
              updateField(['sections', index, 'style'], 'numbered');
            }
          }}
        >
          <Ionicons name="ellipse" size={16} color={section.style === 'numbered' ? 'white' : '#666'} />
          <Text style={[styles.listTypeButtonText, section.style === 'numbered' && styles.activeListTypeButtonText]}>Numerada</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Elementos:</Text>
      {(section.items || []).map((item: string, itemIndex: number) => (
        <View key={`item-editor-${itemIndex}`} style={styles.listItemEditor}>
          <TextInput
            style={[styles.input, styles.listItemInput]}
            value={item}
            onChangeText={(text) => {
              const newItems = [...(section.items || [])];
              newItems[itemIndex] = text;

              // En modo single edit, usar path relativo ['items']
              // En modo full edit, usar path completo ['sections', index, 'items']
              if (editMode === 'single') {
                updateField(['items'], newItems);
              } else {
                updateField(['sections', index, 'items'], newItems);
              }
            }}
            placeholder={`Elemento ${itemIndex + 1}`}
          />
          <TouchableOpacity
            onPress={() => removeListItem(index, itemIndex)}
            style={styles.removeItemButton}
          >
            <Ionicons name="close-circle" size={20} color="#e27667" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={() => addListItem(index)}
        style={styles.addButton}
      >
        <Ionicons name="add" size={16} color="#3ba3a4" />
        <Text style={styles.addButtonText}>Añadir elemento</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ListEditor;