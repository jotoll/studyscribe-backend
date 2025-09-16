import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JSONEditorProps {
  initialData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  selectedPath?: string;
  selectedElement?: any;
}

const JSONEditor: React.FC<JSONEditorProps> = ({ initialData, onSave, onCancel, selectedPath, selectedElement }) => {
  const [editedData, setEditedData] = useState<any>(initialData || {});
  const [activeSection, setActiveSection] = useState<string>('title');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [editMode, setEditMode] = useState<'full' | 'single'>('full');

  useEffect(() => {
    console.log('JSONEditor - selectedPath:', selectedPath, 'selectedElement:', selectedElement);
    
    // Si hay un elemento seleccionado, enfocar solo en esa sección
    if (selectedPath && selectedElement) {
      console.log('Elemento seleccionado para edición:', selectedPath, selectedElement);
      console.log('Tipo de selectedElement:', typeof selectedElement, 'Estructura:', selectedElement);
      setEditMode('single');
      
      // Determinar qué sección activar basado en el path
      if (selectedPath.startsWith('sections.')) {
        const sectionIndex = parseInt(selectedPath.split('.')[1]);
        console.log('Section index encontrado:', sectionIndex);
        setActiveSection(`sections.${sectionIndex}`);
        
        // Scroll aproximado a la sección después de un pequeño delay
        setTimeout(() => {
          if (scrollViewRef.current) {
            // Estimación aproximada de la posición (100px por sección + 200px de offset)
            const estimatedPosition = sectionIndex * 300;
            console.log('Haciendo scroll a posición:', estimatedPosition);
            scrollViewRef.current.scrollTo({ y: estimatedPosition, animated: true });
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
  }, [selectedPath, selectedElement]);

  const updateField = (path: (string | number)[], value: any) => {
    setEditedData((prev: any) => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key]) {
          current[key] = typeof key === 'number' ? [] : {};
        }
        current = current[key];
      }
      
      const lastKey = path[path.length - 1];
      current[lastKey] = value;
      return newData;
    });
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
        // Insertar en posición específica
        newSections = [
          ...sections.slice(0, position),
          newSection,
          ...sections.slice(position)
        ];
      } else {
        // Añadir al final (comportamiento por defecto)
        newSections = [...sections, newSection];
      }

      return {
        ...prev,
        sections: newSections
      };
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
    setEditedData((prev: any) => {
      const newSections = [...prev.sections];
      if (newSections[sectionIndex].items) {
        newSections[sectionIndex].items.push('');
      }
      return { ...prev, sections: newSections };
    });
  };

  const removeListItem = (sectionIndex: number, itemIndex: number) => {
    setEditedData((prev: any) => {
      const newSections = [...prev.sections];
      if (newSections[sectionIndex].items) {
        newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_: any, i: number) => i !== itemIndex);
      }
      return { ...prev, sections: newSections };
    });
  };

  const addExample = (sectionIndex: number) => {
    setEditedData((prev: any) => {
      const newSections = [...prev.sections];
      if (newSections[sectionIndex].examples) {
        newSections[sectionIndex].examples.push('');
      }
      return { ...prev, sections: newSections };
    });
  };

  const removeExample = (sectionIndex: number, exampleIndex: number) => {
    setEditedData((prev: any) => {
      const newSections = [...prev.sections];
      if (newSections[sectionIndex].examples) {
        newSections[sectionIndex].examples = newSections[sectionIndex].examples.filter((_: any, i: number) => i !== exampleIndex);
      }
      return { ...prev, sections: newSections };
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

  const renderSingleSectionEditor = () => {
    if (!selectedPath) return null;
    
    if (selectedPath.startsWith('sections.')) {
      const sectionIndex = parseInt(selectedPath.split('.')[1]);
      const section = editedData.sections?.[sectionIndex];
      if (!section) return null;
      
      return (
        <View style={styles.singleEditContainer}>
          {renderSectionEditor(section, sectionIndex)}
        </View>
      );
    } else if (selectedPath === 'title' && editedData.title !== undefined) {
      return (
        <View style={styles.singleEditContainer}>
          <View style={styles.sectionEditor}>
            <Text style={styles.sectionTitle}>📖 Título Principal</Text>
            <TextInput
              style={styles.input}
              value={editedData.title || ''}
              onChangeText={(text) => updateField(['title'], text)}
              placeholder="Título del documento"
            />
          </View>
        </View>
      );
    } else if (selectedPath === 'summary' && editedData.summary !== undefined) {
      return (
        <View style={styles.singleEditContainer}>
          <View style={styles.sectionEditor}>
            <Text style={styles.sectionTitle}>📋 Resumen</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editedData.summary || ''}
              onChangeText={(text) => updateField(['summary'], text)}
              placeholder="Resumen del contenido"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      );
    } else if (selectedPath === 'key_concepts' && editedData.key_concepts !== undefined) {
      return (
        <View style={styles.singleEditContainer}>
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
                  placeholder="Concepto clave"
                />
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                const newConcepts = [...(editedData.key_concepts || []), ''];
                updateField(['key_concepts'], newConcepts);
              }}
            >
              <Ionicons name="add-circle" size={24} color="#4A00E0" />
              <Text style={styles.addButtonText}>Agregar concepto</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return null;
  };

  const renderSectionEditor = (section: any, index: number) => {
    switch (section.type) {
      case 'heading':
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
                    <Ionicons name="add" size={16} color="#4A00E0" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => removeSection(index)}>
                  <Ionicons name="trash" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.label}>Nivel:</Text>
            <View style={styles.levelSelector}>
              {[1, 2, 3].map(level => (
                <TouchableOpacity
                  key={level.toString()}
                  style={[styles.levelButton, section.level === level && styles.activeLevelButton]}
                  onPress={() => updateField(['sections', index, 'level'], level)}
                >
                  <Text style={styles.levelButtonText}>H{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Contenido:</Text>
            <TextInput
              style={styles.input}
              value={section.content || ''}
              onChangeText={(text) => updateField(['sections', index, 'content'], text)}
              placeholder="Título del encabezado"
              multiline
            />
          </View>
        );

      case 'paragraph':
        return (
          <View style={styles.sectionEditor}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionType}>📄 Párrafo</Text>
              <View style={styles.sectionActions}>
                {editMode === 'full' && (
                  <TouchableOpacity 
                    style={styles.insertButton}
                    onPress={() => { setInsertPosition(index); setShowAddMenu(true); }}
                  >
                    <Ionicons name="add" size={16} color="#4A00E0" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => removeSection(index)}>
                  <Ionicons name="trash" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Contenido:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={section.content || ''}
              onChangeText={(text) => updateField(['sections', index, 'content'], text)}
              placeholder="Escribe el contenido del párrafo"
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'list':
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
                    <Ionicons name="add" size={16} color="#4A00E0" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => removeSection(index)}>
                  <Ionicons name="trash" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Tipo de lista:</Text>
            <View style={styles.listTypeSelector}>
              <TouchableOpacity
                style={[styles.listTypeButton, section.style === 'bulleted' && styles.activeListTypeButton]}
                onPress={() => updateField(['sections', index, 'style'], 'bulleted')}
              >
                <Ionicons name="remove" size={16} color={section.style === 'bulleted' ? 'white' : '#666'} />
                <Text style={[styles.listTypeButtonText, section.style === 'bulleted' && styles.activeListTypeButtonText]}>Viñetas</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.listTypeButton, section.style === 'numbered' && styles.activeListTypeButton]}
                onPress={() => updateField(['sections', index, 'style'], 'numbered')}
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
                    const newItems = [...section.items];
                    newItems[itemIndex] = text;
                    updateField(['sections', index, 'items'], newItems);
                  }}
                  placeholder={`Elemento ${itemIndex + 1}`}
                />
                <TouchableOpacity 
                  onPress={() => removeListItem(index, itemIndex)}
                  style={styles.removeItemButton}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              onPress={() => addListItem(index)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={16} color="#4A00E0" />
              <Text style={styles.addButtonText}>Añadir elemento</Text>
            </TouchableOpacity>
          </View>
        );

      case 'concept_block':
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
                    <Ionicons name="add" size={16} color="#4A00E0" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => removeSection(index)}>
                  <Ionicons name="trash" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Término:</Text>
            <TextInput
              style={styles.input}
              value={section.term || ''}
              onChangeText={(text) => updateField(['sections', index, 'term'], text)}
              placeholder="Nombre del concepto"
            />

            <Text style={styles.label}>Definición:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={section.definition || ''}
              onChangeText={(text) => updateField(['sections', index, 'definition'], text)}
              placeholder="Definición del concepto"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Ejemplos:</Text>
            {(section.examples || []).map((example: string, exampleIndex: number) => (
              <View key={`example-editor-${exampleIndex}`} style={styles.listItemEditor}>
                <TextInput
                  style={[styles.input, styles.listItemInput]}
                  value={example}
                  onChangeText={(text) => {
                    const newExamples = [...section.examples];
                    newExamples[exampleIndex] = text;
                    updateField(['sections', index, 'examples'], newExamples);
                  }}
                  placeholder={`Ejemplo ${exampleIndex + 1}`}
                />
                <TouchableOpacity 
                  onPress={() => removeExample(index, exampleIndex)}
                  style={styles.removeItemButton}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              onPress={() => addExample(index)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={16} color="#4A00E0" />
              <Text style={styles.addButtonText}>Añadir ejemplo</Text>
            </TouchableOpacity>
          </View>
        );

      case 'summary_block':
        return (
          <View style={styles.sectionEditor}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionType}>📋 Resumen</Text>
              <View style={styles.sectionActions}>
                {editMode === 'full' && (
                  <TouchableOpacity 
                    style={styles.insertButton}
                    onPress={() => { setInsertPosition(index); setShowAddMenu(true); }}
                  >
                    <Ionicons name="add" size={16} color="#4A00E0" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => removeSection(index)}>
                  <Ionicons name="trash" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Contenido:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={section.content || ''}
              onChangeText={(text) => updateField(['sections', index, 'content'], text)}
              placeholder="Escribe el contenido del resumen"
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'key_concepts_block':
        return (
          <View style={styles.sectionEditor}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionType}>🔑 Conceptos Clave</Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity 
                  style={styles.insertButton}
                  onPress={() => { setInsertPosition(index); setShowAddMenu(true); }}
                >
                  <Ionicons name="add" size={16} color="#4A00E0" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeSection(index)}>
                  <Ionicons name="trash" size={20} color="#ff4757" />
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
                    updateField(['sections', index, 'concepts'], newConcepts);
                  }}
                  placeholder={`Concepto clave ${conceptIndex + 1}`}
                />
                <TouchableOpacity 
                  onPress={() => {
                    const newConcepts = [...section.concepts];
                    newConcepts.splice(conceptIndex, 1);
                    updateField(['sections', index, 'concepts'], newConcepts);
                  }}
                  style={styles.removeItemButton}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              onPress={() => {
                const newConcepts = [...(section.concepts || []), ''];
                updateField(['sections', index, 'concepts'], newConcepts);
              }}
              style={styles.addButton}
            >
              <Ionicons name="add" size={16} color="#4A00E0" />
              <Text style={styles.addButtonText}>Añadir concepto</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {editMode === 'single' ? (
        <>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
          >
            {renderSingleSectionEditor()}
          </ScrollView>
          

          {/* Botones de acción para modo single */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={() => onSave(editedData)}
            >
              <Ionicons name="save" size={16} color="white" />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          {/* Modal para añadir secciones */}
          <Modal
            visible={showAddMenu}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAddMenu(false)}
          >
            <Pressable 
              style={styles.modalOverlay}
              onPress={() => setShowAddMenu(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Seleccionar tipo de sección</Text>
                
                <Pressable 
                  style={styles.modalOption}
                  onPress={() => { addSection('heading', insertPosition); setShowAddMenu(false); }}
                >
                  <Ionicons name="text" size={20} color="#4A00E0" />
                  <Text style={styles.modalOptionText}>Encabezado</Text>
                </Pressable>
                
                <Pressable 
                  style={styles.modalOption}
                  onPress={() => { addSection('paragraph', insertPosition); setShowAddMenu(false); }}
                >
                  <Ionicons name="document-text" size={20} color="#4A00E0" />
                  <Text style={styles.modalOptionText}>Párrafo</Text>
                </Pressable>
                
                <Pressable 
                  style={styles.modalOption}
                  onPress={() => { addSection('list', insertPosition); setShowAddMenu(false); }}
                >
                  <Ionicons name="list" size={20} color="#4A00E0" />
                  <Text style={styles.modalOptionText}>Lista</Text>
                </Pressable>
                
                <Pressable 
                  style={styles.modalOption}
                  onPress={() => { addSection('concept_block', insertPosition); setShowAddMenu(false); }}
                >
                  <Ionicons name="bulb" size={20} color="#4A00E0" />
                  <Text style={styles.modalOptionText}>Concepto</Text>
                </Pressable>
                
                <Pressable 
                  style={styles.modalOption}
                  onPress={() => { addSection('summary_block', insertPosition); setShowAddMenu(false); }}
                >
                  <Ionicons name="document-text" size={20} color="#4A00E0" />
                  <Text style={styles.modalOptionText}>Resumen</Text>
                </Pressable>
                
                <Pressable 
                  style={styles.modalOption}
                  onPress={() => { addSection('key_concepts_block', insertPosition); setShowAddMenu(false); }}
                >
                  <Ionicons name="key" size={20} color="#4A00E0" />
                  <Text style={styles.modalOptionText}>Conceptos Clave</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.modalOption, styles.modalCancel]}
                  onPress={() => setShowAddMenu(false)}
                >
                  <Ionicons name="close" size={20} color="#666" />
                  <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancelar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        </>
      ) : (
        <>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
          >
          {/* Título principal */}
          <View style={styles.sectionEditor}>
            <Text style={styles.sectionTitle}>Título Principal</Text>
            <TextInput
              style={styles.input}
              value={editedData.title || ''}
              onChangeText={(text) => updateField(['title'], text)}
              placeholder="Título del documento"
            />
          </View>

          {/* Secciones */}
          <View style={styles.sectionEditor}>
            <Text style={styles.sectionTitle}>📑 Secciones de Contenido</Text>
            
            {(editedData.sections || []).map((section: any, index: number) => (
              <View key={`section-${index}`}>
                {renderSectionEditor(section, index)}
              </View>
            ))}

          </View>

          {/* Conceptos clave */}
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
                <TouchableOpacity 
                  onPress={() => removeKeyConcept(index)}
                  style={styles.removeItemButton}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              onPress={addKeyConcept}
              style={styles.addButton}
            >
              <Ionicons name="add" size={16} color="#4A00E0" />
              <Text style={styles.addButtonText}>Añadir concepto clave</Text>
            </TouchableOpacity>
          </View>

          {/* Resumen */}
          <View style={styles.sectionEditor}>
            <Text style={styles.sectionTitle}>📋 Resumen</Text>
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


        {/* Modal para añadir secciones */}
        <Modal
          visible={showAddMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddMenu(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowAddMenu(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar tipo de sección</Text>
              
              <Pressable 
                style={styles.modalOption}
                onPress={() => { addSection('heading', insertPosition); setShowAddMenu(false); }}
              >
                <Ionicons name="text" size={20} color="#4A00E0" />
                <Text style={styles.modalOptionText}>Encabezado</Text>
              </Pressable>
              
              <Pressable 
                style={styles.modalOption}
                onPress={() => { addSection('paragraph', insertPosition); setShowAddMenu(false); }}
              >
                <Ionicons name="document-text" size={20} color="#4A00E0" />
                <Text style={styles.modalOptionText}>Párrafo</Text>
              </Pressable>
              
              <Pressable 
                style={styles.modalOption}
                onPress={() => { addSection('list', insertPosition); setShowAddMenu(false); }}
              >
                <Ionicons name="list" size={20} color="#4A00E0" />
                <Text style={styles.modalOptionText}>Lista</Text>
              </Pressable>
              
                <Pressable 
                  style={styles.modalOption}
                  onPress={() => { addSection('concept_block', insertPosition); setShowAddMenu(false); }}
                >
                  <Ionicons name="bulb" size={20} color="#4A00E0" />
                  <Text style={styles.modalOptionText}>Concepto</Text>
                </Pressable>
              
              <Pressable 
                style={[styles.modalOption, styles.modalCancel]}
                onPress={() => setShowAddMenu(false)}
              >
                <Ionicons name="close" size={20} color="#666" />
                <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancelar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]}
            onPress={() => onSave(editedData)}
          >
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
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionEditor: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insertButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  sectionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A00E0',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  levelSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  levelButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    minWidth: 50,
    alignItems: 'center',
  },
  activeLevelButton: {
    backgroundColor: '#4A00E0',
  },
  levelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  listTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  listTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    flex: 1,
    justifyContent: 'center',
  },
  activeListTypeButton: {
    backgroundColor: '#4A00E0',
  },
  listTypeButtonText: {
    color: '#666',
    fontSize: 14,
  },
  activeListTypeButtonText: {
    color: 'white',
  },
  listItemEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  listItemInput: {
    flex: 1,
  },
  removeItemButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#4A00E0',
    fontWeight: '500',
  },
  addSectionButtons: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  sectionTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    minWidth: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f2f5',
  },
  saveButton: {
    backgroundColor: '#4A00E0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  addSectionButton: {
    backgroundColor: '#4A00E0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addSectionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A00E0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalCancel: {
    backgroundColor: '#f0f2f5',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCancelText: {
    color: '#666',
  },
  singleEditContainer: {
    padding: 16,
  },
  singleEditTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A00E0',
    marginBottom: 20,
    textAlign: 'center',
  },
  modeToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A00E0',
    padding: 12,
    gap: 8,
  },
  modeToggleText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default JSONEditor;
