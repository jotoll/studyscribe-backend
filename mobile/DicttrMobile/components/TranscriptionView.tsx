import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JSONRenderer from './JSONRenderer';

interface TranscriptionViewProps {
  enhancedText: any;
  transcriptionText: string;
  showEnhancedTranscription: boolean;
  setShowEnhancedTranscription: (show: boolean) => void;
  setShowOriginalTranscriptionModal: (show: boolean) => void;
  setShowEnhancedPreviewModal: (show: boolean) => void;
  loading: boolean;
  onEdit: (path: string, element: any) => void;
  onDelete: (path: string, element: any) => void;
  onAdd: (type: string | any, position?: number) => void;
  openModalEditor: (content: any, path: string, element: any) => void;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  enhancedText,
  transcriptionText,
  showEnhancedTranscription,
  setShowEnhancedTranscription,
  setShowOriginalTranscriptionModal,
  setShowEnhancedPreviewModal,
  loading,
  onEdit,
  onDelete,
  onAdd,
  openModalEditor
}) => {
  if (!enhancedText || Object.keys(enhancedText).length === 0) {
    return null;
  }

  return (
    <View style={styles.compactSection}>
      <View style={styles.windowHeader}>
        <TouchableOpacity
          onPress={() => setShowOriginalTranscriptionModal(true)}
          style={styles.noteIconButton}
        >
          <Ionicons name="musical-notes" size={18} color="#3ba3a4" />
        </TouchableOpacity>
        <Text style={styles.windowTitle}>Transcripción Mejorada</Text>
        <View style={styles.windowActions}>
          <TouchableOpacity
            onPress={() => setShowEnhancedPreviewModal(true)}
            style={styles.editButton}
            disabled={loading}
          >
            <Ionicons name="eye" size={18} color="#3ba3a4" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowEnhancedTranscription(!showEnhancedTranscription)}
            style={styles.toggleButton}
          >
            <Ionicons
              name={showEnhancedTranscription ? "chevron-up" : "chevron-down"}
              size={20}
              color="#3ba3a4"
            />
          </TouchableOpacity>
        </View>
      </View>
      {showEnhancedTranscription && (
        <View style={styles.scrollContainerEnhanced}>
          <ScrollView
            style={styles.scrollViewCompact}
            contentContainerStyle={styles.scrollContentCompact}
            nestedScrollEnabled={true}
          >
            <JSONRenderer
              data={enhancedText}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              openModalEditor={openModalEditor}
            />
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  compactSection: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#3ba3a4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  windowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  windowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    marginRight: 8,
  },
  windowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28677d',
    flex: 1,
  },
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  toggleButton: {
    padding: 4,
  },
  scrollContainerEnhanced: {
    flex: 1,
    minHeight: 400,
    marginTop: 10,
  },
  scrollViewCompact: {
    flex: 1,
  },
  scrollContentCompact: {
    padding: 8,
  },
});

export default TranscriptionView;