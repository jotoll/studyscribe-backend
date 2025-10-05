import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  HeadingEditor,
  ParagraphEditor,
  ListEditor,
  ConceptBlockEditor,
  SummaryBlockEditor,
  KeyConceptsBlockEditor
} from './SectionEditors';

interface JSONEditorProps {
  initialData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  selectedPath?: string;
  selectedElement?: any;
}

const JSONEditor: React.FC<JSONEditorProps> = ({ initialData, onSave, onCancel, selectedPath, selectedElement }) => {
  const [editedData, setEditedData] = useState<any>(() => {
    // Crear una copia profunda de los datos iniciales para evitar mutaciones
    return initialData ? JSON.parse(JSON.stringify(initialData)) : {};
  });
  const [activeSection, setActiveSection] = useState<string>('title');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [editMode, setEditMode] = useState<'full' | 'single'>('full');

  // Contador de renders para debugging
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('🔄 JSONEditor render count:', renderCount.current);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    console.log('JSONEditor - selectedPath:', selectedPath, 'selectedElement:', selectedElement);

    if (selectedPath && selectedElement) {
      console.log('Elemento seleccionado para edición:', selectedPath, selectedElement);
      console.log('Tipo de selectedElement:', typeof selectedElement, 'Estructura:', selectedElement);
      setEditMode('single');

      if (selectedPath.startsWith('sections.')) {
        const sectionIndex = parseInt(selectedPath.split('.')[1]);
        console.log('Section index encontrado:', sectionIndex);
        setActiveSection(`sections.${sectionIndex}`);

        scrollTimeout = setTimeout(() => {
          try {
            if (scrollViewRef.current) {
              const estimatedPosition = sectionIndex * 300;
              console.log('Haciendo scroll a posición:', estimatedPosition);
              scrollViewRef.current.scrollTo({ y: estimatedPosition, animated: true });
            }
          } catch (error) {
            console.error('Error al hacer scroll:', error);
          }
        }, 300);
      } else {
        console.log('Path no es una sección, activando:', selectedPath);
        setActiveSection(selectedPath);
      }
    } else {
      console.log('No hay elemento seleccionado, modo completo');
      setEditMode('full');
    }

    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [selectedPath, selectedElement]);

  const updateField = (path: (string | number)[], value: any) => {
    console.log('📝 updateField llamado con path:', path, 'valor:', value);
    console.log('📝 Modo de edición:', editMode, 'selectedPath:', selectedPath);

    setEditedData((prev: any) => {
      if (editMode === 'single' && selectedPath && selectedPath.startsWith('sections.')) {
        // En modo single edit, estamos editando una sección específica
        // editedData es solo la sección individual, no el documento completo
        console.log('📋 Modo single edit - sección individual');

        // Crear copia de la sección actual
        const updatedSection = { ...prev };

        // Actualizar el campo específico dentro de la sección usando el path proporcionado
        let current = updatedSection;
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (!current[key]) {
            current[key] = typeof key === 'number' ? [] : {};
          }
          current = current[key];
          if (current === undefined || current === null) {
            console.error('Cannot access property of undefined at path:', path.slice(0, i + 1));
            return prev;
          }
        }

        const lastKey = path[path.length - 1];
        current[lastKey] = value;

        console.log('✅ Sección actualizada:', JSON.stringify(updatedSection, null, 2));
        return updatedSection;
      }

      // Modo full edit - actualizar toda la estructura
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key]) {
          current[key] = typeof key === 'number' ? [] : {};
        }
        current = current[key];
        if (current === undefined || current === null) {
          console.error('Cannot access property of undefined at path:', path.slice(0, i + 1));
          return prev;
        }
      }

      const lastKey = path[path.length - 1];
      current[lastKey] = value;
      return newData;
    });
  };

  const handleSave = () => {
    onSave(editedData);
  };

  const addSection = (type: string, position: number | null = null) => {
    const newSection = {
      type,
      content: '',
      ...(type === 'heading' && { level: 2 }),
      ...(type === 'list' && { style: 'bulleted', items: [''] }),
      ...(type === 'concept_block' && { term: '', definition: '', examples: [''] }),
      ...(type === 'summary_block' && { content: '' }),
      ...(type === 'key_concepts_block' && { concepts: [''] })
    };

    setEditedData((prev: any) => {
      const sections = prev.sections || [];
      let newSections;

      if (position !== null && position >= 0 && position <= sections.length) {
        newSections = [
          ...sections.slice(0, position),
          newSection,
          ...sections.slice(position)
        ];
      } else {
        newSections = [...sections, newSection];
      }

      return { ...prev, sections: newSections };
    });

    setInsertPosition(null);
  };

  const removeSection = (index: number) => {
    setEditedData((prev: any) => ({
      ...prev,
      sections: prev.sections.filter((_: any, i: number) => i !== index)
    }));
  };

  const addListItem = (sectionIndex: number) => {
    console.log('➕ Añadiendo item de lista a sección:', sectionIndex);
    console.log('📋 Modo de edición actual:', editMode);

    setEditedData((prev: any) => {
      // Determinar si estamos en modo single edit con sección individual
      // o modo full edit con documento completo
      if (prev.type) {
        // editedData es una sección individual (modo single edit)
        console.log('📋 Modo single edit - sección individual');
        const updatedSection = { ...prev };
        if (!updatedSection.items) {
          updatedSection.items = [''];
        } else {
          updatedSection.items.push('');
        }
        return updatedSection;
      } else {
        // editedData es el documento completo (modo full edit)
        console.log('📋 Modo full edit - documento completo');
        const newSections = [...prev.sections];
        if (newSections[sectionIndex]) {
          if (!newSections[sectionIndex].items) {
            newSections[sectionIndex].items = [''];
          } else {
            newSections[sectionIndex].items.push('');
          }
        }
        return { ...prev, sections: newSections };
      }
    });
  };

  const removeListItem = (sectionIndex: number, itemIndex: number) => {
    console.log('🗑️ Eliminando item de lista:', sectionIndex, itemIndex);
    console.log('📋 Modo de edición actual:', editMode);

    setEditedData((prev: any) => {
      // Determinar si estamos en modo single edit con sección individual
      // o modo full edit con documento completo
      if (prev.type) {
        // editedData es una sección individual (modo single edit)
        console.log('📋 Modo single edit - sección individual');
        const updatedSection = { ...prev };
        if (updatedSection.items) {
          updatedSection.items = updatedSection.items.filter((_: any, i: number) => i !== itemIndex);
        }
        return updatedSection;
      } else {
        // editedData es el documento completo (modo full edit)
        console.log('📋 Modo full edit - documento completo');
        const newSections = [...prev.sections];
        if (newSections[sectionIndex].items) {
          newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_: any, i: number) => i !== itemIndex);
        }
        return { ...prev, sections: newSections };
      }
    });
  };

  const addExample = (sectionIndex: number) => {
    console.log('🔄 Añadiendo ejemplo a sección:', sectionIndex);
    console.log('📋 Modo de edición actual:', editMode);
    console.log('📋 selectedPath:', selectedPath);
    console.log('📋 editedData tiene type?', !!editedData.type);

    setEditedData((prev: any) => {
      // Determinar si estamos en modo single edit con sección individual
      // o modo full edit con documento completo
      if (prev.type) {
        // editedData es una sección individual (modo single edit)
        console.log('📋 Modo single edit - sección individual');
        console.log('📋 Sección antes:', JSON.stringify(prev));

        const updatedSection = { ...prev };
        if (!updatedSection.examples) {
          updatedSection.examples = [''];
        } else {
          updatedSection.examples = [...updatedSection.examples, ''];
        }

        console.log('📋 Sección después:', JSON.stringify(updatedSection));
        return updatedSection;
      } else {
        // editedData es el documento completo (modo full edit)
        console.log('📋 Modo full edit - documento completo');
        const newSections = [...prev.sections];
        console.log('📋 Secciones antes:', JSON.stringify(newSections[sectionIndex]));

        // Asegurarse de que la sección existe
        if (!newSections[sectionIndex]) {
          console.error('❌ Sección no existe en índice:', sectionIndex);
          return prev;
        }

        // Crear copia profunda de la sección
        const updatedSection = { ...newSections[sectionIndex] };

        if (!updatedSection.examples) {
          updatedSection.examples = [''];
        } else {
          updatedSection.examples = [...updatedSection.examples, ''];
        }

        newSections[sectionIndex] = updatedSection;

        console.log('📋 Secciones después:', JSON.stringify(newSections[sectionIndex]));
        return { ...prev, sections: newSections };
      }
    });
  };

  const removeExample = (sectionIndex: number, exampleIndex: number) => {
    console.log('🗑️ Eliminando ejemplo:', sectionIndex, exampleIndex);
    console.log('📋 Modo de edición actual:', editMode);

    setEditedData((prev: any) => {
      // Determinar si estamos en modo single edit con sección individual
      // o modo full edit con documento completo
      if (prev.type) {
        // editedData es una sección individual (modo single edit)
        console.log('📋 Modo single edit - sección individual');
        const updatedSection = { ...prev };
        if (updatedSection.examples) {
          updatedSection.examples = updatedSection.examples.filter((_: any, i: number) => i !== exampleIndex);
        }
        return updatedSection;
      } else {
        // editedData es el documento completo (modo full edit)
        console.log('📋 Modo full edit - documento completo');
        const newSections = [...prev.sections];
        if (newSections[sectionIndex].examples) {
          newSections[sectionIndex].examples = newSections[sectionIndex].examples.filter((_: any, i: number) => i !== exampleIndex);
        }
        return { ...prev, sections: newSections };
      }
    });
  };

  const addKeyConcept = () => {
    setEditedData((prev: any) => ({
      ...prev,
      key_concepts: [...(prev.key_concepts || []), '']
    }));
  };

  const removeKeyConcept = (index: number) => {
    setEditedData((prev: any) => ({
      ...prev,
      key_concepts: prev.key_concepts.filter((_: any, i: number) => i !== index)
    }));
  };

  const renderSectionEditor = (section: any, index: number) => {
    const editorProps = {
      section,
      index,
      editMode,
      updateField,
      removeSection,
      addListItem,
      removeListItem,
      addExample,
      removeExample,
      setInsertPosition,
      setShowAddMenu,
      styles
    };

    switch (section.type) {
      case 'heading':
        return <HeadingEditor {...editorProps} />;
      case 'paragraph':
        return <ParagraphEditor {...editorProps} />;
      case 'list':
        return <ListEditor {...editorProps} />;
      case 'concept_block':
        return <ConceptBlockEditor {...editorProps} />;
      case 'summary_block':
        return <SummaryBlockEditor {...editorProps} />;
      case 'key_concepts_block':
        return <KeyConceptsBlockEditor {...editorProps} />;
      default:
        return null;
    }
  };

  const renderSingleSectionEditor = () => {
    if (!selectedPath) return null;

    if (selectedPath.startsWith('sections.')) {
      const sectionIndex = parseInt(selectedPath.split('.')[1]);
      console.log('📋 renderSingleSectionEditor - sectionIndex:', sectionIndex);
      console.log('📋 editedData structure:', JSON.stringify(editedData, null, 2));

      // Determinar si editedData es la sección individual o el documento completo
      const section = editedData.type ? editedData : editedData.sections?.[sectionIndex];
      console.log('📋 Sección a renderizar:', JSON.stringify(section, null, 2));

      if (!section) return null;

      return (
        <View style={styles.singleEditContainer}>
          {renderSectionEditor(section, sectionIndex)}
        </View>
      );
    }

    // Handle non-section paths like 'title', 'summary', etc.
    console.log('📋 renderSingleSectionEditor - non-section path:', selectedPath);
    console.log('📋 editedData structure:', JSON.stringify(editedData, null, 2));

    // For non-section paths, render the appropriate editor
    return (
      <View style={styles.singleEditContainer}>
        <ScrollView style={styles.scrollView}>
          {selectedPath === 'title' && (
            <View style={styles.sectionEditor}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionType}>📝 Título Principal</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedData.title || ''}
                onChangeText={(text) => updateField(['title'], text)}
                placeholder="Título del documento"
                multiline
                numberOfLines={2}
              />
            </View>
          )}

          {selectedPath === 'summary' && (
            <View style={styles.sectionEditor}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionType}>📋 Resumen</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedData.summary || ''}
                onChangeText={(text) => updateField(['summary'], text)}
                placeholder="Resumen del contenido"
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {editMode === 'single' ? (
        <>
          <ScrollView ref={scrollViewRef} style={styles.scrollView}>
            {renderSingleSectionEditor()}
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave}>
              <Ionicons name="save" size={16} color="white" />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <ScrollView ref={scrollViewRef} style={styles.scrollView}>
            <View style={styles.sectionEditor}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionType}>📝 Título Principal</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedData.title || ''}
                onChangeText={(text) => updateField(['title'], text)}
                placeholder="Título del documento"
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.sectionEditor}>
              <Text style={styles.sectionTitle}>📑 Secciones de Contenido</Text>
              {(editedData.sections || []).map((section: any, index: number) => (
                <View key={`section-${index}`}>
                  {renderSectionEditor(section, index)}
                </View>
              ))}
            </View>

            <View style={styles.sectionEditor}>
              <Text style={styles.sectionTitle}>🎯 Conceptos Clave</Text>
              {(editedData.key_concepts || []).map((concept: string, index: number) => (
                <View key={`concept-editor-${index}`} style={styles.listItemEditor}>
                  <TextInput
                    style={[styles.input, styles.listItemInput]}
                    value={concept}
                    onChangeText={(text) => {
                      const newConcepts = [...(editedData.key_concepts || [])];
                      newConcepts[index] = text;
                      updateField(['key_concepts'], newConcepts);
                    }}
                    placeholder={`Concepto clave ${index + 1}`}
                  />
                  <TouchableOpacity onPress={() => removeKeyConcept(index)} style={styles.removeItemButton}>
                    <Ionicons name="close-circle" size={20} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={addKeyConcept} style={styles.addButton}>
                <Ionicons name="add" size={16} color="#3ba3a4" />
                <Text style={styles.addButtonText}>Añadir concepto clave</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionEditor}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionType}>📋 Resumen</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedData.summary || ''}
                onChangeText={(text) => updateField(['summary'], text)}
                placeholder="Resumen del contenido"
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave}>
              <Ionicons name="save" size={16} color="white" />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollView: { flex: 1, padding: 8 },
  sectionEditor: { backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insertButton: { padding: 6, borderRadius: 6, backgroundColor: '#f0f2f5' },
  sectionType: { fontSize: 16, fontWeight: '600', color: '#28677d' },
  label: { fontSize: 12, fontWeight: '500', color: '#333', marginBottom: 4, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, fontSize: 14, color: '#333', backgroundColor: 'white', minHeight: 40, lineHeight: 18 },
  textArea: { minHeight: 60, textAlignVertical: 'top', lineHeight: 18 },
  levelSelector: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  levelButton: { padding: 6, borderRadius: 4, backgroundColor: '#f0f2f5', minWidth: 40, alignItems: 'center' },
  activeLevelButton: { backgroundColor: '#3ba3a4' },
  levelButtonText: { color: '#666', fontWeight: '500' },
  listTypeSelector: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  listTypeButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, borderRadius: 4, backgroundColor: '#f0f2f5', flex: 1, justifyContent: 'center' },
  activeListTypeButton: { backgroundColor: '#3ba3a4' },
  listTypeButtonText: { color: '#666', fontSize: 14 },
  activeListTypeButtonText: { color: 'white' },
  listItemEditor: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  listItemInput: { flex: 1, minHeight: 36, lineHeight: 16 },
  removeItemButton: { padding: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#f0f8ff', borderRadius: 6, marginTop: 6 },
  addButtonText: { color: '#3ba3a4', fontWeight: '500' },
  actionButtons: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee', gap: 12 },
  actionButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  cancelButton: { backgroundColor: '#f0f2f5' },
  saveButton: { backgroundColor: '#3ba3a4' },
  cancelButtonText: { color: '#666', fontWeight: '600' },
  saveButtonText: { color: 'white', fontWeight: '600' },
  singleEditContainer: { padding: 12 }
});

export default JSONEditor;