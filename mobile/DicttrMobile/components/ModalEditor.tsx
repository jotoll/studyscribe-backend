import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JSONEditor from './JSONEditor';
import AIBlockEditor from './AIBlockEditor';
import { isJSONStructure, parseRawContent } from '../utils/contentUtils';

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
  const [currentBlocks, setCurrentBlocks] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (visible) {
      console.log('=== MODAL EDITOR DEBUG ===');
      console.log('Modal abierto con parámetros:');
      console.log('selectedPath:', selectedPath);
      console.log('selectedElement:', typeof selectedElement, JSON.stringify(selectedElement));
      console.log('initialContent tipo:', typeof initialContent);
      console.log('initialContent estructura:', initialContent);
      console.log('isJSONStructure result:', isJSONStructure(initialContent));
      console.log('=== FIN DEBUG ===');

      if (!isJSONStructure(initialContent)) {
        setCurrentBlocks(Array.isArray(initialContent) ? initialContent : []);
      }
    }
  }, [visible, selectedPath, selectedElement, initialContent]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editor de Contenido</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {(isJSONStructure(initialContent) || selectedElement) ? (
              <JSONEditor
                initialData={selectedElement || parseRawContent(initialContent) || initialContent}
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
                    setCurrentBlocks(blocks);
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
                      onSave(currentBlocks);
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
    width: Dimensions.get('window').width * 0.95,
    maxWidth: 500,
    height: Dimensions.get('window').height * 0.85,
    backgroundColor: 'white',
    borderRadius: 12,
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