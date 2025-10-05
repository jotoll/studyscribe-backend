import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { transcriptionManagementAPI, folderAPI } from './services/api';
import MermaidView from './components/MermaidView';
import JSONRenderer from './components/JSONRenderer';
import JSONRendererPreview from './components/JSONRendererPreview';
import ModalEditor from './components/ModalEditor';
import AudioRecorder from './components/AudioRecorder';
import TranscriptionView from './components/TranscriptionView';
import Header from './components/Header';
import ModalManager from './components/ModalManager';
import StudyMaterialMenu from './components/StudyMaterialMenu';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './contexts/AuthContext';
import { generateStudyMaterial } from './components/StudyMaterialGenerator';
import { handleDeleteElement, handleUpdateElement, handleAddElement } from './components/ModalHandlers';
import { formatDuration, getCurrentTime, hideNavigationBar } from './components/utils';
import { useRecordingManager } from './components/RecordingManager';
import { usePDFExportManager } from './components/PDFExportManager';
import { useNavigationManager } from './components/NavigationManager';

function MainScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<any>();

  // Estados principales
  const [transcriptionText, setTranscriptionText] = useState('');
  const [enhancedText, setEnhancedText] = useState<any>(null);
  const [studyMaterial, setStudyMaterial] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOriginalTranscription, setShowOriginalTranscription] = useState(false);
  const [showEnhancedTranscription, setShowEnhancedTranscription] = useState(true);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [showOriginalTranscriptionModal, setShowOriginalTranscriptionModal] = useState(false);
  const [showEnhancedPreviewModal, setShowEnhancedPreviewModal] = useState(false);
  const [showMaterialMenu, setShowMaterialMenu] = useState(false);
  const [showModalEditor, setShowModalEditor] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editingElement, setEditingElement] = useState<any>(null);
  const [editingPath, setEditingPath] = useState<string>('');
  const [currentTranscriptionId, setCurrentTranscriptionId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [currentSubject, setCurrentSubject] = useState<string>('');

  // Hook personalizados para funcionalidades modulares
  const { navigateToTranscriptions } = useNavigationManager({
    setTranscriptionText,
    setEnhancedText,
    setLoading,
    setCurrentTranscriptionId,
    setSelectedTags,
    setSelectedFolder,
    setCurrentSubject
  });

  const {
    recording,
    isRecording,
    recordings,
    recordingDuration,
    startRecording,
    stopRecording,
    handleProcessRecording
  } = useRecordingManager({
    setLoading,
    setTranscriptionText,
    setEnhancedText,
    setCurrentTranscriptionId,
    setSelectedTags,
    setSelectedFolder,
    setCurrentSubject
  });

  const { handleExportToPDF } = usePDFExportManager({ setLoading });

  useEffect(() => {
    hideNavigationBar();
  }, []);

  // Verificar parámetros de navegación al montar
  useEffect(() => {
    const checkNavigationParams = async () => {
      try {
        const params = navigation.getState()?.routes?.[navigation.getState().index]?.params;
        console.log('MainScreen - Parámetros de navegación:', params);

        if (params?.transcriptionId && !currentTranscriptionId) {
          console.log('MainScreen - Estableciendo transcriptionId desde parámetros:', params.transcriptionId);
          setCurrentTranscriptionId(params.transcriptionId);
        }
      } catch (error) {
        console.error('Error verificando parámetros de navegación:', error);
      }
    };

    checkNavigationParams();
  }, [navigation, currentTranscriptionId]);









  // Navegar al editor de bloques con IA
  const openBlockEditor = () => {
    if (!enhancedText || Object.keys(enhancedText).length === 0) {
      Alert.alert('Error', 'Primero debes tener una transcripción mejorada');
      return;
    }
  };


  const formatDuration = (seconds: number) => {
    return formatDuration(seconds);
  };

  const openFullScreenTranscription = () => {
    setShowTranscriptionModal(true);
  };

  const closeFullScreenTranscription = () => {
    setShowTranscriptionModal(false);
  };

  const getCurrentTime = () => {
    return getCurrentTime();
  };

  const handleDeleteElement = (path: string, element: any) => {
    handleDeleteElement(path, { enhancedText, setEnhancedText, currentTranscriptionId });
  };

  const handleUpdateElementWrapper = async (path: string, element: any) => {
    await handleUpdateElement(path, element, { enhancedText, setEnhancedText, currentTranscriptionId });
  };

  const handleAddElementWrapper = (typeOrBlock: string | any, position?: number) => {
    handleAddElement(typeOrBlock, position, { enhancedText, setEnhancedText, currentTranscriptionId });
  };

  const openModalEditor = (content: any, path: string = '', element: any = null) => {
    console.log('openModalEditor llamado con content:', typeof content, JSON.stringify(content));
    console.log('openModalEditor llamado con path:', path);
    console.log('openModalEditor llamado con element:', typeof element, JSON.stringify(element));
    setEditingContent(content);
    setEditingElement(element);
    setEditingPath(path);
    setShowModalEditor(true);
  };

  const closeModalEditor = () => {
    setShowModalEditor(false);
    setEditingContent(null);
    setEditingElement(null);
    setEditingPath('');
  };

  const handleTagsChange = async (tags: any[], transcriptionIdOverride?: string) => {
    console.log('handleTagsChange llamado con tags:', tags);
    console.log('currentTranscriptionId:', currentTranscriptionId);
    console.log('transcriptionIdOverride:', transcriptionIdOverride);

    setSelectedTags(tags);

    // Usar el override si está disponible, si no usar currentTranscriptionId
    const targetTranscriptionId = transcriptionIdOverride || currentTranscriptionId;

    // Si hay una transcripción actual, actualizar las etiquetas en la base de datos
    if (targetTranscriptionId) {
      try {
        console.log('Actualizando etiquetas para transcripción:', targetTranscriptionId);

        // Obtener etiquetas actuales de la transcripción
        const currentTagsResponse = await transcriptionManagementAPI.getTranscriptionTags(targetTranscriptionId);
        const currentTags = currentTagsResponse.success ? currentTagsResponse.data?.tags || [] : [];
        console.log('Etiquetas actuales en BD:', currentTags);

        // Obtener todas las etiquetas disponibles para verificar existencia
        const allTagsResponse = await transcriptionManagementAPI.getTags();
        const availableTags = allTagsResponse.success ? allTagsResponse.data?.tags || [] : [];
        console.log('Etiquetas disponibles en BD:', availableTags.map((t: any) => t.id));

        // Filtrar etiquetas que realmente existen en la base de datos
        const validTags = tags.filter(tag => 
          availableTags.some((availableTag: any) => availableTag.id === tag.id)
        );

        console.log('Etiquetas válidas después de filtrar:', validTags);

        // Encontrar etiquetas a añadir y eliminar
        const tagsToAdd = validTags.filter(tag => !currentTags.some((t: any) => t.id === tag.id));
        const tagsToRemove = currentTags.filter((tag: any) => !validTags.some(t => t.id === tag.id));

        console.log('Etiquetas a añadir (válidas):', tagsToAdd);
        console.log('Etiquetas a eliminar:', tagsToRemove);

        // Añadir nuevas etiquetas (solo las que existen)
        for (const tag of tagsToAdd) {
          console.log('Añadiendo etiqueta válida:', tag.id);
          try {
            await transcriptionManagementAPI.assignTagToTranscription(targetTranscriptionId, tag.id);
            console.log('Etiqueta añadida exitosamente:', tag.id);
          } catch (error) {
            console.error('Error añadiendo etiqueta:', tag.id, error);
            // Continuar con las siguientes etiquetas aunque falle una
          }
        }

        // Eliminar etiquetas removidas
        for (const tag of tagsToRemove) {
          console.log('Eliminando etiqueta:', tag.id);
          try {
            await transcriptionManagementAPI.removeTagFromTranscription(targetTranscriptionId, tag.id);
            console.log('Etiqueta eliminada exitosamente:', tag.id);
          } catch (error) {
            console.error('Error eliminando etiqueta:', tag.id, error);
            // Continuar con las siguientes etiquetas aunque falle una
          }
        }

        console.log('Proceso de actualización de etiquetas completado');
      } catch (error) {
        console.error('Error actualizando etiquetas:', error);
      }
    } else {
      console.log('No hay transcriptionId disponible, no se pueden guardar las etiquetas');
    }
  };

  const handleFolderChange = async (folder: any | null, transcriptionIdOverride?: string) => {
    console.log('handleFolderChange llamado con folder:', folder);
    console.log('currentTranscriptionId:', currentTranscriptionId);
    console.log('transcriptionIdOverride:', transcriptionIdOverride);

    setSelectedFolder(folder);

    // Usar el override si está disponible, si no usar currentTranscriptionId
    const targetTranscriptionId = transcriptionIdOverride || currentTranscriptionId;

    // Si hay una transcripción actual, actualizar la carpeta en la base de datos
    if (targetTranscriptionId) {
      try {
        console.log('Actualizando carpeta para transcripción:', targetTranscriptionId);
        await folderAPI.moveTranscriptionToFolder(targetTranscriptionId, folder?.id || null);
        console.log('Carpeta actualizada exitosamente');
      } catch (error) {
        console.error('Error actualizando carpeta:', error);
      }
    } else {
      console.log('No hay transcriptionId disponible, no se puede guardar la carpeta');
    }
  };

  const handleSubjectChange = async (subject: string, transcriptionIdOverride?: string) => {
    console.log('handleSubjectChange llamado con subject:', subject);
    console.log('currentTranscriptionId:', currentTranscriptionId);
    console.log('transcriptionIdOverride:', transcriptionIdOverride);

    setCurrentSubject(subject);

    // Usar el override si está disponible, si no usar currentTranscriptionId
    const targetTranscriptionId = transcriptionIdOverride || currentTranscriptionId;

    // Si hay una transcripción actual, actualizar el asunto en la base de datos
    if (targetTranscriptionId) {
      try {
        console.log('Actualizando asunto para transcripción:', targetTranscriptionId);
        await transcriptionManagementAPI.updateTranscription(targetTranscriptionId, { subject });
        console.log('Asunto actualizado exitosamente');
      } catch (error) {
        console.error('Error actualizando asunto:', error);
      }
    } else {
      console.log('No hay transcriptionId disponible, no se puede guardar el asunto');
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header elegante */}
        <Header
          enhancedText={enhancedText}
          navigateToTranscriptions={navigateToTranscriptions}
          logout={logout}
          currentTranscriptionId={currentTranscriptionId}
          selectedTags={selectedTags}
          selectedFolder={selectedFolder}
          currentSubject={currentSubject}
          onTagsChange={handleTagsChange}
          onFolderChange={handleFolderChange}
          onSubjectChange={handleSubjectChange}
        />

        {/* Contenido principal */}
        <View style={styles.content}>


          {/* Transcripción Mejorada - Ventana Minimizable */}
          <TranscriptionView
            enhancedText={enhancedText}
            transcriptionText={transcriptionText}
            showEnhancedTranscription={showEnhancedTranscription}
            setShowEnhancedTranscription={setShowEnhancedTranscription}
            setShowOriginalTranscriptionModal={setShowOriginalTranscriptionModal}
            setShowEnhancedPreviewModal={setShowEnhancedPreviewModal}
            loading={loading}
            onEdit={(path, element) => {
              console.log('Editando elemento:', path, element);
              console.log('Elemento a editar estructura:', JSON.stringify(element, null, 2));

              // Determinar el contenido a editar basado en el tipo de elemento
              let contentToEdit = element;

              // Para el título principal (objeto con title/summary)
              if (element.title !== undefined && path === 'title') {
                contentToEdit = element.title;
              }
              // Para elementos que son strings simples
              else if (typeof element === 'string') {
                contentToEdit = element;
              }
              // Para todas las secciones, mantener el objeto completo para que el editor
              // pueda acceder a todas las propiedades (type, content, term, definition, etc.)

              console.log('Abriendo modal editor con contenido:', contentToEdit);
              console.log('Tipo de contenido:', typeof contentToEdit);
              openModalEditor(contentToEdit, path, element);
            }}
            onDelete={handleDeleteElement}
            onAdd={handleAddElementWrapper}
            openModalEditor={openModalEditor}
          />

          {/* Botones de Material de Estudio - ELIMINADOS DE LA PANTALLA PRINCIPAL */}
          {/* Estos botones se moverán a un menú desplegable en la parte inferior */}

          {/* Material de Estudio Generado */}
          {studyMaterial ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {studyMaterial.includes('FLUJOGRAMA') ? '📊 Flujograma Generado' : 'Material de Estudio:'}
              </Text>
              <View style={
                studyMaterial.includes('FLUJOGRAMA') 
                  ? styles.flowchartContainer 
                  : styles.materialContainer
              }>
                <Text style={
                  studyMaterial.includes('FLUJOGRAMA')
                    ? styles.flowchartText
                    : styles.materialText
                }>
                  {studyMaterial}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Visualización del Diagrama Mermaid */}
          {mermaidCode ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Visualización del Diagrama:</Text>
              <MermaidView 
                mermaidCode={mermaidCode} 
                height={400}
                style={styles.mermaidView}
              />
              <Text style={styles.mermaidHelp}>
                💡 Diagrama generado automáticamente a partir de tu contenido
              </Text>
            </View>
          ) : null}



        </View>
      </ScrollView>

      {/* Barra de grabación fija en la parte inferior */}
      <AudioRecorder
        onRecordingProcessed={handleProcessRecording}
        loading={loading}
      />

      {/* Menú desplegable de material de estudio */}
      <StudyMaterialMenu
        visible={showMaterialMenu}
        onClose={() => setShowMaterialMenu(false)}
        onGenerateMaterial={(type) => generateStudyMaterial({ enhancedText, setStudyMaterial, setMermaidCode, setLoading }, type)}
        onOpenBlockEditor={openBlockEditor}
        onNavigateToTranscriptions={() => navigation.navigate('Transcriptions')}
        loading={loading}
      />


      {/* Modal para Transcripción Completa */}
      <ModalManager
        showTranscriptionModal={showTranscriptionModal}
        closeFullScreenTranscription={closeFullScreenTranscription}
        transcriptionText={transcriptionText}
        showOriginalTranscriptionModal={showOriginalTranscriptionModal}
        setShowOriginalTranscriptionModal={setShowOriginalTranscriptionModal}
        showEnhancedPreviewModal={showEnhancedPreviewModal}
        setShowEnhancedPreviewModal={setShowEnhancedPreviewModal}
        enhancedText={enhancedText}
        handleExportToPDF={() => handleExportToPDF(enhancedText)}
      />

      {/* Modal Editor para editar bloques */}
      <ModalEditor
        visible={showModalEditor}
        onClose={closeModalEditor}
        initialContent={editingContent}
        onSave={(data) => {
          console.log('Guardando datos del modal:', data);
          // Aquí necesito implementar la lógica para guardar los cambios
          // en el bloque específico que se está editando
          if (editingElement) {
            // Para nuevos bloques, el path se maneja automáticamente en handleUpdateElement
            // Para bloques existentes, usar el path que se pasó al abrir el modal
            handleUpdateElement(editingPath, data, { enhancedText, setEnhancedText, currentTranscriptionId });
          }
          closeModalEditor();
        }}
        selectedElement={editingElement}
        selectedPath={editingPath}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Espacio para la barra de grabación
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  recordingTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  transcriptionsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#3ba3a4',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagSelectorButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#28677d',
  },
  folderSelectorButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#97447a',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#e27667',
  },
  recordingName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#28677d',
    flex: 1,
  },
  recordingTimeBadge: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recordingTimeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  meetingInfo: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 12,
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#3ba3a4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28677d',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recordingStatus: {
    color: '#3ba3a4',
  },
  readyStatus: {
    color: '#666',
  },
  // Estilos para ventanas minimizables
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
    color: '#3ba3a4',
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
  flowchartContainer: {
    backgroundColor: '#e6f7ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1890ff',
    borderStyle: 'dashed',
  },
  materialContainer: {
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  flowchartText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
    color: '#0050b3',
  },
  materialText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  mermaidView: {
    marginTop: 10,
  },
  mermaidHelp: {
    marginTop: 10,
    fontSize: 12,
    color: '#8c8c8c',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  recordingSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  materialMenuBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3ba3a4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  materialMenuBtnActive: {
    backgroundColor: '#8E2DE2',
  },
  recordBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff5e62',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recordingBtn: {
    backgroundColor: '#3ba3a4',
  },
  materialMenu: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  materialMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#f8f9fa',
  },
  materialMenuItemText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
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
    borderColor: '#3ba3a4',
  },
  exportButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#3ba3a4',
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
    margin: 0,
  },
  previewScrollView: {
    flex: 1,
  },
  previewContent: {
    padding: 0,
    margin: 0,
  },
});

export default MainScreen;
