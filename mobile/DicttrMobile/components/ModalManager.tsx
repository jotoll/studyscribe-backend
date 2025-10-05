import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JSONRendererPreview from './JSONRendererPreview';

interface ModalManagerProps {
  showTranscriptionModal: boolean;
  closeFullScreenTranscription: () => void;
  transcriptionText: string;
  showOriginalTranscriptionModal: boolean;
  setShowOriginalTranscriptionModal: (show: boolean) => void;
  showEnhancedPreviewModal: boolean;
  setShowEnhancedPreviewModal: (show: boolean) => void;
  enhancedText: any;
  handleExportToPDF: () => void;
}

const ModalManager: React.FC<ModalManagerProps> = ({
  showTranscriptionModal,
  closeFullScreenTranscription,
  transcriptionText,
  showOriginalTranscriptionModal,
  setShowOriginalTranscriptionModal,
  showEnhancedPreviewModal,
  setShowEnhancedPreviewModal,
  enhancedText,
  handleExportToPDF
}) => {
  return (
    <>
      {/* Modal para Transcripción Completa */}
      <Modal
        visible={showTranscriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeFullScreenTranscription}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.transcriptionModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Transcripción Completa</Text>
              <TouchableOpacity onPress={closeFullScreenTranscription} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <ScrollView
                style={styles.transcriptionScrollView}
                contentContainerStyle={styles.transcriptionContent}
              >
                <Text style={styles.transcriptionModalText}>{transcriptionText}</Text>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Transcripción Original Flotante */}
      <Modal
        visible={showOriginalTranscriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOriginalTranscriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.transcriptionModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Transcripción Original</Text>
              <TouchableOpacity
                onPress={() => setShowOriginalTranscriptionModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <ScrollView
                style={styles.transcriptionScrollView}
                contentContainerStyle={styles.transcriptionContent}
              >
                <Text style={styles.transcriptionModalText}>{transcriptionText}</Text>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Vista Previa de Transcripción Mejorada */}
      <Modal
        visible={showEnhancedPreviewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEnhancedPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalContainer}>
            <View style={styles.previewModalHeader}>
              <View style={styles.previewModalTitleRow}>
                <Text style={styles.previewModalTitle}>Vista Previa</Text>
                <TouchableOpacity
                  onPress={handleExportToPDF}
                  style={styles.exportButton}
                >
                  <Ionicons name="download" size={20} color="#4A00E0" />
                  <Text style={styles.exportButtonText}>PDF</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setShowEnhancedPreviewModal(false)}
                style={styles.previewCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.previewModalContent}>
              <ScrollView
                style={styles.previewScrollView}
                contentContainerStyle={styles.previewContent}
              >
                <JSONRendererPreview data={enhancedText} />
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptionModalContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  transcriptionScrollView: {
    flex: 1,
  },
  transcriptionContent: {
    padding: 16,
  },
  transcriptionModalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  previewModalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
  previewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  previewModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  previewModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A00E0',
  },
  exportButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#4A00E0',
  },
  previewCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  previewModalContent: {
    flex: 1,
    padding: 0,
    margin: 8,
  },
  previewScrollView: {
    flex: 1,
  },
  previewContent: {
    padding: 8,
    margin: 0,
  },
});

export default ModalManager;