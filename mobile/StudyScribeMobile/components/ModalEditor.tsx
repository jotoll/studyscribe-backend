import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JSONEditor from './JSONEditor';
import AIBlockEditor from './AIBlockEditor';

interface ModalEditorProps {
  visible: boolean;
  onClose: () => void;
  initialContent: any;
  onSave: (data: any) => void;
  selectedPath?: string;
  selectedElement?: any;
}

const ModalEditor: React.FC<ModalEditorProps> = ({
  visible,
  onClose,
  initialContent,
  onSave,
  selectedPath,
  selectedElement
}) => {
  
  // Debug: Verificar los parámetros recibidos
  React.useEffect(() => {
    if (visible) {
      console.log('=== MODAL EDITOR DEBUG ===');
      console.log('Modal abierto con parámetros:');
      console.log('selectedPath:', selectedPath);
      console.log('selectedElement:', selectedElement);
      console.log('initialContent tipo:', typeof initialContent);
      console.log('initialContent estructura:', initialContent);
      console.log('isJSONStructure result:', isJSONStructure(initialContent));
      console.log('=== FIN DEBUG ===');
    }
  }, [visible, selectedPath, selectedElement, initialContent]);
  
  const isJSONStructure = (content: any): boolean => {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return false;
    }
    
    // Verificar si tiene estructura de documento JSON esperada
    const hasDocumentStructure = 
      content.title !== undefined || 
      content.sections !== undefined || 
      content.key_concepts !== undefined || 
      content.summary !== undefined ||
      content.blocks !== undefined;
    
    // También considerar si tiene raw_content que podría contener JSON
    const hasRawContent = content.raw_content && typeof content.raw_content === 'string';
    
    console.log('isJSONStructure check - hasDocumentStructure:', hasDocumentStructure, 'hasRawContent:', hasRawContent);
    
    return hasDocumentStructure || hasRawContent;
  };

  const parseRawContent = (content: any): any => {
    if (!content || typeof content !== 'object') return content;
    
    // Si tiene raw_content, extraer y parsear el JSON
    if (content.raw_content && typeof content.raw_content === 'string') {
      try {
        // Extraer el JSON del string que puede contener markdown
        const jsonMatch = content.raw_content.match(/```json\n([\s\S]*?)\n```/) || content.raw_content.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          console.log('Parsing JSON from raw_content:', jsonString.substring(0, 100) + '...');
          return JSON.parse(jsonString);
        } else {
          // Si no hay markdown, intentar parsear directamente
          console.log('Parsing raw_content directly');
          return JSON.parse(content.raw_content);
        }
      } catch (error) {
        console.error('Error parsing JSON from raw_content:', error);
        // En caso de error, mantener el contenido original
        return content;
      }
    }
    
    return content;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editor de Contenido</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.modalContent}>
            {isJSONStructure(initialContent) ? (
              <JSONEditor 
                initialData={parseRawContent(initialContent)}
                onSave={(data) => {
                  onSave(data);
                  onClose();
                }}
                onCancel={onClose}
                selectedPath={selectedPath}
                selectedElement={selectedElement}
              />
            ) : (
              <View style={styles.nonJsonContainer}>
                <AIBlockEditor 
                  initialContent={initialContent}
                  onContentChange={(blocks) => {
                    // Para contenido no JSON, manejamos diferente
                    console.log('Blocks changed:', blocks);
                  }}
                />
                <View style={styles.nonJsonActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => {
                      // Para contenido no JSON, necesitamos una forma de obtener el contenido actual
                      // Por ahora, simplemente cerramos el modal
                      onClose();
                    }}
                  >
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
    height: Dimensions.get('window').height * 0.8,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  nonJsonContainer: {
    flex: 1,
  },
  nonJsonActions: {
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
});

export default ModalEditor;
