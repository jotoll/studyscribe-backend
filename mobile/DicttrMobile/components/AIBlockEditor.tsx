import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { transcriptionAPI } from '../services/api';

// Simple ID generator
const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Types
interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'code';
  content: string | string[];
}

interface AIBlockEditorProps {
  initialContent?: Block[];
  onContentChange?: (blocks: Block[]) => void;
  onAdd?: (type: Block['type'], position?: number | null) => void;
}

// Función para convertir JSON estructurado a bloques
const jsonToBlocks = (jsonData: any): Block[] => {
  if (!jsonData || typeof jsonData !== 'object') return [];
  
  const blocks: Block[] = [];
  
  // Añadir título principal
  if (jsonData.title) {
    blocks.push({
      id: generateId(),
      type: 'heading',
      content: jsonData.title
    });
  }

  // Procesar secciones
  if (jsonData.sections && Array.isArray(jsonData.sections)) {
    jsonData.sections.forEach((section: any) => {
      switch (section.type) {
        case 'heading':
          blocks.push({
            id: generateId(),
            type: 'heading',
            content: section.content || ''
          });
          break;
        
        case 'paragraph':
          blocks.push({
            id: generateId(),
            type: 'paragraph',
            content: section.content || ''
          });
          break;
        
        case 'list':
          blocks.push({
            id: generateId(),
            type: 'list',
            content: section.items || []
          });
          break;
        
        case 'concept':
          blocks.push({
            id: generateId(),
            type: 'paragraph',
            content: `**${section.term || ''}**: ${section.definition || ''}`
          });
          break;
      }
    });
  }

  // Añadir conceptos clave
  if (jsonData.key_concepts && Array.isArray(jsonData.key_concepts)) {
    blocks.push({
      id: generateId(),
      type: 'heading',
      content: 'Conceptos Clave'
    });
    
    blocks.push({
      id: generateId(),
      type: 'list',
      content: jsonData.key_concepts
    });
  }

  // Añadir resumen
  if (jsonData.summary) {
    blocks.push({
      id: generateId(),
      type: 'heading',
      content: 'Resumen'
    });
    
    blocks.push({
      id: generateId(),
      type: 'paragraph',
      content: jsonData.summary
    });
  }

  return blocks;
};

// Función para dividir texto en párrafos y crear bloques
const textToBlocks = (text: string): Block[] => {
  if (!text) return [];
  
  // Dividir por saltos de línea dobles (párrafos) y filtrar vacíos
  const paragraphs = text.split(/\n\s*\n+/).filter(p => p.trim().length > 0);
  
  const blocks: Block[] = [];
  
  // Añadir título principal
  blocks.push({
    id: generateId(),
    type: 'heading',
    content: 'Transcripción Mejorada'
  });
  
  // Procesar cada párrafo
  paragraphs.forEach((paragraph, index) => {
    const trimmedParagraph = paragraph.trim();
    const lines = trimmedParagraph.split('\n').filter(line => line.trim().length > 0);
    
    // Detectar si es una lista (líneas que empiezan con •, -, *, o números)
    const isList = lines.length > 1 && lines.every(line => 
      /^[•\-\*\d]+\.?\s/.test(line.trim()) || /^\s*[•\-\*]/.test(line)
    );
    
    if (isList) {
      // Es una lista
      const listItems = lines.map(line => 
        line.replace(/^[•\-\*\d]+\.?\s*/, '').trim()
      ).filter(item => item.length > 0);
      
      if (listItems.length > 0) {
        blocks.push({
          id: generateId(),
          type: 'list',
          content: listItems
        });
      }
    } else if (lines.length === 1) {
      // Párrafo simple de una línea
      blocks.push({
        id: generateId(),
        type: 'paragraph',
        content: lines[0].trim()
      });
    } else {
      // Párrafo multi-línea
      blocks.push({
        id: generateId(),
        type: 'paragraph',
        content: trimmedParagraph
      });
    }
  });
  
  return blocks;
};

// Initial content
const starterBlocks: Block[] = [
  {
    id: generateId(),
    type: 'heading',
    content: 'Transcripción Mejorada',
  },
  {
    id: generateId(),
    type: 'paragraph',
    content: 'Selecciona cualquier bloque para editarlo individualmente.',
  },
  {
    id: generateId(),
    type: 'paragraph',
    content: 'Usa el botón ✨ en cada bloque para mejorarlo con IA de forma quirúrgica.',
  },
];

const AIBlockEditor: React.FC<AIBlockEditorProps> = ({ 
  initialContent = starterBlocks, 
  onContentChange,
  onAdd 
}) => {
  // Procesar initialContent según su tipo
  let processedInitialContent: Block[];
  
  if (typeof initialContent === 'string') {
    // Es texto plano
    processedInitialContent = textToBlocks(initialContent);
  } else if (Array.isArray(initialContent)) {
    // Ya es an array de bloques
    processedInitialContent = initialContent;
  } else if (typeof initialContent === 'object' && initialContent !== null) {
    // Es JSON estructurado
    processedInitialContent = jsonToBlocks(initialContent);
  } else {
    // Valor por defecto
    processedInitialContent = starterBlocks;
  }
    
  const [blocks, setBlocks] = useState<Block[]>(processedInitialContent);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [expandingBlockId, setExpandingBlockId] = useState<string | null>(null);

  const handleBlockChange = (blockId: string, newContent: string | string[]) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, content: newContent } : block
    );
    setBlocks(updatedBlocks);
    onContentChange?.(updatedBlocks);
  };

  const handleExpandWithAI = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    setExpandingBlockId(blockId);
    
    try {
      const currentContent = typeof block.content === 'string' 
        ? block.content 
        : block.content.join('\n');
      
      // Mejorar solo este bloque específico con IA
      const response = await transcriptionAPI.enhanceText(currentContent, 'general');
      
      if (response.success && response.data.enhanced_text) {
        // Reemplazar solo el contenido de este bloque con la versión mejorada
        handleBlockChange(blockId, response.data.enhanced_text);
        Alert.alert('✅ Éxito', 'Bloque mejorado con IA');
      } else {
        Alert.alert('Error', 'No se pudo mejorar el bloque con IA');
      }
    } catch (error) {
      console.error('Error improving with AI:', error);
      Alert.alert('Error', 'No se pudo mejorar el contenido con IA');
    } finally {
      setExpandingBlockId(null);
    }
  };

  const addBlock = (type: Block['type'] = 'paragraph', position: number | null = null) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: type === 'list' ? ['Nuevo elemento'] : 'Escribe aquí...'
    };
    
    let newBlocks;
    if (position !== null && position >= 0 && position <= blocks.length) {
      // Insertar en posición específica
      newBlocks = [
        ...blocks.slice(0, position),
        newBlock,
        ...blocks.slice(position)
      ];
    } else {
      // Añadir al final (comportamiento por defecto)
      newBlocks = [...blocks, newBlock];
    }
    
    setBlocks(newBlocks);
    onContentChange?.(newBlocks);
    onAdd?.(type, position);
    
    // Entrar automáticamente en modo edición para el nuevo bloque
    // Usar setTimeout para asegurar que el componente se haya renderizado antes de enfocar
    setTimeout(() => {
      setEditingBlockId(newBlock.id);
    }, 50);
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length <= 1) {
      Alert.alert('Error', 'No puedes eliminar el último bloque');
      return;
    }
    
    const newBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(newBlocks);
    onContentChange?.(newBlocks);
  };

  const renderBlock = (block: Block) => {
    const isEditing = editingBlockId === block.id;
    const isExpanding = expandingBlockId === block.id;

    // Función para obtener el estilo de texto apropiado
    const getTextStyle = () => {
      if (block.type === 'heading') {
        return [styles.blockContent, styles.heading];
      } else if (block.type === 'quote') {
        return [styles.blockContent, styles.quote];
      } else if (block.type === 'code') {
        return [styles.blockContent, styles.code];
      } else {
        return styles.blockContent;
      }
    };
    
    const textStyle = getTextStyle();

    if (isEditing) {
      if (block.type === 'list') {
        return (
          <View style={styles.listContainer}>
            {(block.content as string[]).map((item, index) => (
              <View key={`list-item-${index}`} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <TextInput
                  style={[styles.input, styles.listInput]}
                  value={item}
                  onChangeText={(text) => {
                    const newItems = [...(block.content as string[])];
                    newItems[index] = text;
                    handleBlockChange(block.id, newItems);
                  }}
                  multiline
                  autoFocus={index === 0}
                  placeholder="Escribe un elemento..."
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.addListItemButton}
              onPress={() => {
                const newItems = [...(block.content as string[]), 'Nuevo elemento'];
                handleBlockChange(block.id, newItems);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#3ba3a4" />
              <Text style={styles.addListItemText}>Añadir elemento</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <TextInput
          style={[styles.input, textStyle]}
          value={block.content as string}
          onChangeText={(text) => handleBlockChange(block.id, text)}
          multiline
          autoFocus
          placeholder="Escribe aquí..."
        />
      );
    }

    if (block.type === 'list') {
      return (
        <View style={styles.listContainer}>
          {(block.content as string[]).map((item, index) => (
            <View key={`list-display-${index}`} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={textStyle}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <TouchableOpacity 
        onPress={() => setEditingBlockId(block.id)}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{block.content}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {blocks.map((block, index) => {
          const isEditing = editingBlockId === block.id;
          const isExpanding = expandingBlockId === block.id;
          
          return (
            <View key={block.id}>
              {/* Botón de inserción antes del bloque (excepto el primero) */}
              <TouchableOpacity
                style={styles.insertButton}
                onPress={() => addBlock('paragraph', index)}
              >
                <Ionicons name="add" size={16} color="#3ba3a4" />
              </TouchableOpacity>
              
              <View style={[styles.block, isEditing && styles.editingBlockContainer]}>
                <View style={styles.blockHeader}>
                  <Text style={styles.blockType}>{block.type}</Text>
                  <View style={styles.toolbar}>
                    <TouchableOpacity
                      onPress={() => setEditingBlockId(isEditing ? null : block.id)}
                      style={[styles.toolbarButton, isEditing && styles.activeToolbarButton]}
                    >
                      <Ionicons 
                        name={isEditing ? "lock-closed" : "create"} 
                        size={16} 
                        color={isEditing ? "#3ba3a4" : "#666"}
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleExpandWithAI(block.id)}
                      disabled={isExpanding}
                      style={[styles.toolbarButton, isExpanding && styles.disabledToolbarButton]}
                    >
                      <Ionicons 
                        name={isExpanding ? "refresh" : "sparkles"} 
                        size={16} 
                        color={isExpanding ? "#999" : "#3ba3a4"}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => deleteBlock(block.id)}
                      style={styles.toolbarButton}
                    >
                      <Ionicons name="trash" size={16} color="#e27667" />
                    </TouchableOpacity>
                  </View>
                </View>

                {renderBlock(block)}

                {isExpanding && (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="sparkles" size={14} color="#3ba3a4" />
                    <Text style={styles.loadingText}>Ampliando con IA...</Text>
                  </View>
                )}

                {isEditing && (
                  <View style={styles.editingHint}>
                    <Text style={styles.editingHintText}>
                      {block.type === 'list' ? 'Edita cada elemento y pulsa fuera para guardar' : 'Edita el texto y pulsa fuera para guardar'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        
        {/* Botón de inserción al final */}
        <TouchableOpacity
          style={styles.insertButton}
          onPress={() => addBlock('paragraph', blocks.length)}
        >
          <Ionicons name="add" size={16} color="#3ba3a4" />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.addButtons}>
        <TouchableOpacity style={styles.addButton} onPress={() => addBlock('paragraph')}>
          <Ionicons name="document-text" size={16} color="white" />
          <Text style={styles.addButtonText}>Párrafo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addButton} onPress={() => addBlock('heading')}>
          <Ionicons name="text" size={16} color="white" />
          <Text style={styles.addButtonText}>Título</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addButton} onPress={() => addBlock('list')}>
          <Ionicons name="list" size={16} color="white" />
          <Text style={styles.addButtonText}>Lista</Text>
        </TouchableOpacity>
      </View>
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
  block: {
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
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  blockType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  blockContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    color: '#666',
    marginTop: 4,
  },
  listInput: {
    flex: 1,
  },
  quote: {
    fontStyle: 'italic',
    borderLeftWidth: 4,
    borderLeftColor: '#3ba3a4',
    paddingLeft: 12,
    color: '#555',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f2f5',
    padding: 12,
    borderRadius: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  editingBlock: {
    borderColor: '#3ba3a4',
    borderWidth: 1,
  },
  editingBlockContainer: {
    borderColor: '#3ba3a4',
    borderWidth: 2,
    backgroundColor: '#f8f5ff',
  },
  activeToolbarButton: {
    backgroundColor: '#e6e0ff',
  },
  disabledToolbarButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
  },
  loadingText: {
    fontSize: 14,
    color: '#3ba3a4',
  },
  editingHint: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 6,
  },
  editingHintText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  addListItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
  },
  addListItemText: {
    fontSize: 14,
    color: '#3ba3a4',
  },
  addButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3ba3a4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  insertButton: {
    alignItems: 'center',
    padding: 8,
    marginVertical: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    alignSelf: 'center',
  },
});

export default AIBlockEditor;
