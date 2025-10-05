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
  Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { transcriptionAPI } from './services/api';
import MermaidView from './components/MermaidView';
import ModalEditor from './components/ModalEditor';
import JSONRenderer from './components/JSONRenderer';
import JSONRendererPreview from './components/JSONRendererPreview';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import AuthNavigator from './AuthNavigator';
import ConfigButton from './components/ConfigButton';
import ConfigMenu from './components/ConfigMenu';
import { useConfig } from './components/ConfigMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Recording {
  sound: Audio.Sound;
  uri: string;
}

function MainScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const config = useConfig();
  
  // Estado para el menú de configuración
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  
  // Esperar a que el navigation esté disponible
  useEffect(() => {
    if (navigation) {
      console.log('Navigation disponible');

      // Agregar listener para cuando se regrese de la pantalla de transcripciones
      const unsubscribe = navigation.addListener('focus', () => {
        // Cuando se regresa a la pantalla principal, limpiar cualquier estado persistente
        // para asegurar que nuevas transcripciones no hereden etiquetas o carpetas
        console.log('Regresando a pantalla principal - limpiando estado persistente');
        setTranscriptionText('');
        setEnhancedText(null);
        setStudyMaterial('');
        setMermaidCode('');

        // También limpiar cualquier estado de grabación
        setRecording(null);
        setIsRecording(false);
        setRecordingDuration(0);
      });

      return unsubscribe;
    }
  }, [navigation]);

  // Crear una función de navegación segura con retraso
  const navigateToTranscriptions = () => {
    console.log('Intentando navegar a Transcriptions');
    // Usar setTimeout para dar tiempo a que el navigation esté completamente inicializado
    setTimeout(() => {
      if (navigation && navigation.navigate) {
        try {
          navigation.navigate('Transcriptions');
          console.log('Navegación exitosa');
        } catch (error) {
          console.error('Error al navegar:', error);
          Alert.alert('Error', 'No se puede acceder a las transcripciones en este momento');
        }
      } else {
        console.error('Navigation no disponible');
        Alert.alert('Error', 'La navegación no está disponible');
      }
    }, 1000); // Aumentar el tiempo de espera a 1000ms (1 segundo)
  };
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [enhancedText, setEnhancedText] = useState<any>(null);
  const [studyMaterial, setStudyMaterial] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showOriginalTranscription, setShowOriginalTranscription] = useState(false);
  const [showEnhancedTranscription, setShowEnhancedTranscription] = useState(true);
  const [showModalEditor, setShowModalEditor] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [showOriginalTranscriptionModal, setShowOriginalTranscriptionModal] = useState(false);
  const [showEnhancedPreviewModal, setShowEnhancedPreviewModal] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editingPath, setEditingPath] = useState<string>('');
  const [editingElement, setEditingElement] = useState<any>(null);
  const [showMaterialMenu, setShowMaterialMenu] = useState(false);

  useEffect(() => {
    requestPermissions();
    hideNavigationBar();
  }, []);

  const openModalEditor = (content: any, path: string = '', element: any = null) => {
    console.log('openModalEditor llamado con:', { path, element });
    setEditingContent(content);
    setEditingPath(path);
    setEditingElement(element);
    setShowModalEditor(true);
  };

  const closeModalEditor = () => {
    setShowModalEditor(false);
    setEditingContent(null);
    setEditingPath('');
    setEditingElement(null);
  };

  const handleSaveEditedContent = (data: any) => {
    setEnhancedText(data);
    Alert.alert('Guardado', 'Los cambios se han guardado correctamente');
    closeModalEditor();
  };

  const hideNavigationBar = () => {
    if (Platform.OS === 'android') {
      try {
        // Ocultar barra de navegación en Android
        RNStatusBar.setHidden(true, 'slide');
        
        // Forzar modo immersive (puede no funcionar en todos los dispositivos)
        // Esta es una aproximación ya que Expo limita el acceso a APIs nativas
        setTimeout(() => {
          RNStatusBar.setHidden(false, 'slide');
          setTimeout(() => RNStatusBar.setHidden(true, 'slide'), 100);
        }, 500);
      } catch (error) {
        console.log('No se pudo ocultar la barra de navegación:', error);
      }
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos permisos de audio para grabar las clases');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'No hay permisos de audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Configuración específica para M4A mono a 16kHz (formato compatible con Whisper)
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MIN,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/mp4',
          bitsPerSecond: 32000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(
        recordingOptions
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer para mostrar duración
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording && interval) {
          clearInterval(interval);
        }
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      if (uri) {
        const { sound } = await Audio.Sound.createAsync({ uri });
        setRecordings(prev => [...prev, { sound, uri }]);
        
        // Procesar automáticamente la grabación
        await processRecording(uri);
      }
      
      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const processRecording = async (audioUri: string) => {
    setLoading(true);
    try {
      // Obtener configuración de idiomas
      const transcriptionLanguage = await AsyncStorage.getItem('transcriptionLanguage') || 'es';
      const translationLanguage = await AsyncStorage.getItem('translationLanguage') || 'es';
      
      console.log(`Idioma de transcripción: ${transcriptionLanguage}, Idioma de traducción: ${translationLanguage}`);
      
      // Enviar audio al backend para transcripción real con configuración de idiomas
      const response = await transcriptionAPI.uploadAudio(audioUri, 'general', {
        transcriptionLanguage,
        translationLanguage
      });

      if (response.success && response.data.transcription) {
        setTranscriptionText(response.data.transcription.original || '');

        // Debug: Verificar qué contiene la transcripción mejorada
        console.log('=== NUEVA TRANSCRIPCIÓN PROCESADA ===');
        console.log('Transcripción original:', response.data.transcription.original?.substring(0, 100) + '...');
        console.log('Transcripción mejorada (estructura completa):', JSON.stringify(response.data.transcription.enhanced, null, 2));
        console.log('=== FIN DEBUG ===');

        // Limpiar cualquier campo de etiquetas o carpetas que pueda venir en la respuesta
        let cleanedEnhancedText = response.data.transcription.enhanced;
        if (cleanedEnhancedText && typeof cleanedEnhancedText === 'object') {
          // Eliminar campos relacionados con etiquetas y carpetas
          const fieldsToRemove = ['tags', 'tag_ids', 'folder_id', 'folder', 'is_favorite', 'favorite'];

          console.log('🔍 Buscando campos persistentes a eliminar...');
          fieldsToRemove.forEach(field => {
            if (cleanedEnhancedText[field] !== undefined) {
              console.log(`❌ Eliminando campo persistente: ${field} = ${cleanedEnhancedText[field]}`);
              delete cleanedEnhancedText[field];
            }
          });

          // También limpiar en secciones/bloques si existen
          if (cleanedEnhancedText.sections) {
            console.log('🔍 Limpiando secciones...');
            cleanedEnhancedText.sections = cleanedEnhancedText.sections.map((section: any, index: number) => {
              const cleanedSection = { ...section };
              fieldsToRemove.forEach(field => {
                if (cleanedSection[field] !== undefined) {
                  console.log(`❌ Eliminando campo de sección ${index}: ${field} = ${cleanedSection[field]}`);
                  delete cleanedSection[field];
                }
              });
              return cleanedSection;
            });
          }

          if (cleanedEnhancedText.blocks) {
            console.log('🔍 Limpiando bloques...');
            cleanedEnhancedText.blocks = cleanedEnhancedText.blocks.map((block: any, index: number) => {
              const cleanedBlock = { ...block };
              fieldsToRemove.forEach(field => {
                if (cleanedBlock[field] !== undefined) {
                  console.log(`❌ Eliminando campo de bloque ${index}: ${field} = ${cleanedBlock[field]}`);
                  delete cleanedBlock[field];
                }
              });
              return cleanedBlock;
            });
          }

          console.log('✅ Datos después de la limpieza:', JSON.stringify(cleanedEnhancedText, null, 2));
        }

        setEnhancedText(cleanedEnhancedText || null);

        // Limpiar cualquier estado persistente de transcripción anterior
        // Esto asegura que la nueva transcripción no herede etiquetas o carpetas
        // de transcripciones anteriores que puedan estar en la pantalla
        setStudyMaterial('');
        setMermaidCode('');

        Alert.alert('¡Éxito!', 'Grabación procesada y mejorada con IA');
      } else {
        Alert.alert('Error', 'No se pudo transcribir el audio');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      Alert.alert('Error', 'No se pudo procesar la grabación. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const generateStudyMaterial = async (type: 'summary' | 'flashcards' | 'concepts' | 'quiz' | 'flowchart') => {
    if (!enhancedText || Object.keys(enhancedText).length === 0) {
      Alert.alert('Error', 'Primero debes tener una transcripción mejorada');
      return;
    }
    
    // Convertir JSON a texto para enviar al backend
    let textContent = '';
    if (typeof enhancedText === 'object') {
      // Extraer el contenido textual del JSON
      if (enhancedText.summary) textContent += enhancedText.summary + '\n\n';
      if (enhancedText.sections) {
        enhancedText.sections.forEach((section: any) => {
          if (section.content) textContent += section.content + '\n\n';
          if (section.items) textContent += section.items.join('\n') + '\n\n';
        });
      }
      if (enhancedText.key_concepts) textContent += 'Conceptos clave: ' + enhancedText.key_concepts.join(', ') + '\n\n';
    } else {
      textContent = enhancedText;
    }

    setLoading(true);
    setStudyMaterial(''); // Limpiar material anterior
    setMermaidCode(''); // Limpiar código Mermaid anterior
    try {
      if (type === 'flowchart') {
        const response = await transcriptionAPI.generateFlowchart(textContent, 'general');
        const flowchartContent = response.data.mermaid_code || response.data.content;
        // Extraer solo el código Mermaid (sin el texto descriptivo)
        const cleanMermaidCode = flowchartContent.replace(/```mermaid\n?/g, '').replace(/```/g, '').trim();
        setMermaidCode(cleanMermaidCode);
        setStudyMaterial(`📊 FLUJOGRAMA GENERADO:\n\n${cleanMermaidCode}`);
        Alert.alert('✅ Éxito', 'Flujograma generado correctamente. Deslízate hacia abajo para verlo.');
      } else {
        const response = await transcriptionAPI.generateMaterial(textContent, type);
        setStudyMaterial(response.data.content);
      }
    } catch (error) {
      console.error('Error generating material:', error);
      Alert.alert('Error', 'No se pudo generar el material de estudio');
    } finally {
      setLoading(false);
    }
  };

  // Navegar al editor de bloques con IA
  const openBlockEditor = () => {
    if (!enhancedText || Object.keys(enhancedText).length === 0) {
      Alert.alert('Error', 'Primero debes tener una transcripción mejorada');
      return;
    }
    
    // Abrir editor modal en lugar de navegar
    openModalEditor(enhancedText);
  };


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openFullScreenTranscription = () => {
    setShowTranscriptionModal(true);
  };

  const closeFullScreenTranscription = () => {
    setShowTranscriptionModal(false);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleDeleteElement = (path: string, element: any) => {
    if (!enhancedText) return;
    
    // Crear una copia del objeto enhancedText
    let updatedData = { ...enhancedText };
    
    // Si los datos vienen como string JSON dentro de raw_content, parsearlos primero
    if (typeof enhancedText === 'object' && enhancedText.raw_content) {
      try {
        // Extraer el JSON del string que puede contener markdown
        const jsonMatch = enhancedText.raw_content.match(/```json\n([\s\S]*?)\n```/) || enhancedText.raw_content.match(/{[\s\S]*}/);
        if (jsonMatch) {
          updatedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // Si no hay markdown, intentar parsear directamente
          updatedData = JSON.parse(enhancedText.raw_content);
        }
      } catch (error) {
        console.error('Error parsing JSON from raw_content:', error);
        // Mantener los datos originales si hay error al parsear
        updatedData = enhancedText;
      }
    }
    
    // Parsear el path para determinar qué eliminar
    const pathParts = path.split('.');
    
    if (pathParts[0] === 'sections' && pathParts.length === 2) {
      // Eliminar sección específica
      const sectionIndex = parseInt(pathParts[1]);
      if (!isNaN(sectionIndex) && updatedData.sections && updatedData.sections.length > sectionIndex) {
        updatedData.sections = updatedData.sections.filter((_: any, index: number) => index !== sectionIndex);
      }
    }
    
    // Actualizar el estado con los datos modificados
    setEnhancedText(updatedData);
    Alert.alert('✅ Eliminado', 'Elemento eliminado correctamente');
  };

  const handleUpdateElement = (path: string, element: any) => {
    if (!enhancedText) return;
    
    console.log('🔄 Actualizando elemento en path:', path);
    console.log('📦 Elemento recibido:', JSON.stringify(element, null, 2));
    
    // Crear una copia del objeto enhancedText
    let updatedData = { ...enhancedText };
    
    // Si los datos vienen como string JSON dentro de raw_content, parsearlos primero
    if (typeof enhancedText === 'object' && enhancedText.raw_content) {
      try {
        // Extraer el JSON del string que puede contener markdown
        const jsonMatch = enhancedText.raw_content.match(/```json\n([\s\S]*?)\n```/) || enhancedText.raw_content.match(/{[\s\S]*}/);
        if (jsonMatch) {
          updatedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // Si no hay markdown, intentar parsear directamente
          updatedData = JSON.parse(enhancedText.raw_content);
        }
      } catch (error) {
        console.error('Error parsing JSON from raw_content:', error);
        // Mantener los datos originales si hay error al parsear
        updatedData = enhancedText;
      }
    }
    
    // Parsear el path para determinar qué actualizar
    const pathParts = path.split('.');
    
    if (pathParts[0] === 'sections' && pathParts.length === 2) {
      // Actualizar sección específica
      const sectionIndex = parseInt(pathParts[1]);
      if (!isNaN(sectionIndex) && updatedData.sections && updatedData.sections.length > sectionIndex) {
        // Si el elemento tiene generated_content, usar ese contenido
        if (element.generated_content) {
          console.log('🎯 Reemplazando sección con contenido generado por IA (formato antiguo)');
          console.log('📋 Contenido generado:', JSON.stringify(element.generated_content, null, 2));
          // Preservar el tipo de bloque original y fusionar con el contenido generado
          updatedData.sections[sectionIndex] = {
            ...updatedData.sections[sectionIndex], // Mantener estructura existente
            ...element.generated_content           // Añadir contenido generado
          };
        } else {
          console.log('🎯 Reemplazando sección completamente (formato nuevo)');
          console.log('📋 Nuevo bloque:', JSON.stringify(element, null, 2));
          // Actualizar con el elemento completo
          updatedData.sections[sectionIndex] = element;
        }
        
        console.log('✅ Sección actualizada:', JSON.stringify(updatedData.sections[sectionIndex], null, 2));
        console.log('📊 Estado completo después de actualizar:', JSON.stringify(updatedData, null, 2));
      }
    } else if (pathParts[0] === 'title') {
      // Actualizar título
      if (element.generated_content) {
        updatedData.title = element.generated_content.title || element.generated_content.content || '';
        if (element.generated_content.summary) {
          updatedData.summary = element.generated_content.summary;
        }
      } else {
        updatedData.title = element.title || '';
        if (element.summary) {
          updatedData.summary = element.summary;
        }
      }
    }
    
    // Actualizar el estado con los datos modificados
    setEnhancedText(updatedData);
    
    // Mostrar mensaje diferente según si es contenido generado por IA o edición manual
    if (element && element.generated_content) {
      Alert.alert('✅ Actualizado', 'Contenido generado con IA aplicado correctamente');
    } else {
      Alert.alert('✅ Guardado', 'Cambios guardados correctamente');
    }
  };

  const handleAddElement = (typeOrBlock: string | any, position?: number) => {
    if (!enhancedText) return;
    
    // Crear una copia del objeto enhancedText
    let updatedData = { ...enhancedText };
    
    // Si los datos vienen como string JSON dentro de raw_content, parsearlos primero
    if (typeof enhancedText === 'object' && enhancedText.raw_content) {
      try {
        // Extraer el JSON del string que puede contener markdown
        const jsonMatch = enhancedText.raw_content.match(/```json\n([\s\S]*?)\n```/) || enhancedText.raw_content.match(/{[\s\S]*}/);
        if (jsonMatch) {
          updatedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // Si no hay markdown, intentar parsear directamente
          updatedData = JSON.parse(enhancedText.raw_content);
        }
      } catch (error) {
        console.error('Error parsing JSON from raw_content:', error);
        // Mantener los datos originales si hay error al parsear
        updatedData = enhancedText;
      }
    }
    
    let newSection;
    
    // Determinar si se está pasando un tipo (string) o un bloque completo (objeto)
    if (typeof typeOrBlock === 'string') {
      // Es un tipo de bloque (string)
      newSection = {
        type: typeOrBlock,
        content: '',
        ...(typeOrBlock === 'heading' && { level: 2 }),
        ...(typeOrBlock === 'list' && { style: 'bulleted', items: [''] }),
        ...(typeOrBlock === 'concept' && { term: '', definition: '', examples: [''] })
      };
    } else {
      // Es un bloque completo (objeto)
      newSection = typeOrBlock;
    }
    
    // Añadir la nueva sección al array de secciones
    if (!updatedData.sections) {
      updatedData.sections = [];
    }
    
    // Insertar en la posición especificada o al final
    if (position !== undefined && position >= 0 && position <= updatedData.sections.length) {
      updatedData.sections.splice(position, 0, newSection);
    } else {
      updatedData.sections.push(newSection);
    }
    
    // Actualizar el estado con los datos modificados
    setEnhancedText(updatedData);
    
    if (typeof typeOrBlock === 'string') {
      Alert.alert('✅ Añadido', `Bloque de tipo ${typeOrBlock} añadido correctamente`);
    } else {
      Alert.alert('✅ Añadido', 'Nuevo bloque añadido correctamente');
    }
  };

  const handleExportToPDF = async () => {
    if (!enhancedText) {
      Alert.alert('Error', 'No hay contenido para exportar');
      return;
    }

    console.log('📄 EnhancedText content for PDF export:', JSON.stringify(enhancedText, null, 2));

    try {
      setLoading(true);
      
      // Convertir el contenido a texto plano para el PDF
      let pdfContent = '';
      
      // Procesar los datos para extraer el contenido textual
      let parsedData = enhancedText;
      
      // Si los datos vienen como string JSON dentro de raw_content, parsearlos primero
      if (typeof enhancedText === 'object' && enhancedText.raw_content) {
        try {
          // Extraer el JSON del string que puede contener markdown
          const jsonMatch = enhancedText.raw_content.match(/```json\n([\s\S]*?)\n```/) || enhancedText.raw_content.match(/{[\s\S]*}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            console.log('✅ JSON parsed successfully from raw_content');
          } else {
            // Si no hay markdown, intentar parsear directamente
            parsedData = JSON.parse(enhancedText.raw_content);
          }
        } catch (error) {
          console.error('Error parsing JSON from raw_content:', error);
          // Mantener los datos originales si hay error al parsear
          parsedData = enhancedText;
        }
      }
      
      if (typeof parsedData === 'object') {
        // Título principal
        if (parsedData.title) {
          pdfContent += `TÍTULO: ${parsedData.title}\n\n`;
        }
        
        // Resumen
        if (parsedData.summary) {
          pdfContent += `RESUMEN: ${parsedData.summary}\n\n`;
        }
        
        // Secciones
        if (parsedData.sections) {
          parsedData.sections.forEach((section: any, index: number) => {
            pdfContent += `\n--- SECCIÓN ${index + 1} ---\n`;
            
            switch (section.type) {
              case 'heading':
                pdfContent += `TÍTULO (Nivel ${section.level || 2}): ${section.content || ''}\n\n`;
                break;
              case 'paragraph':
                pdfContent += `${section.content || ''}\n\n`;
                break;
              case 'list':
                if (section.items) {
                  section.items.forEach((item: string, itemIndex: number) => {
                    pdfContent += `• ${item}\n`;
                  });
                  pdfContent += '\n';
                }
                break;
              case 'concept_block':
                pdfContent += `CONCEPTO: ${section.term || ''}\n`;
                if (section.definition) {
                  pdfContent += `DEFINICIÓN: ${section.definition}\n`;
                }
                if (section.examples && section.examples.length > 0) {
                  pdfContent += 'EJEMPLOS:\n';
                  section.examples.forEach((example: string) => {
                    pdfContent += `- ${example}\n`;
                  });
                }
                pdfContent += '\n';
                break;
              case 'summary_block':
                pdfContent += `📋 RESUMEN:\n${section.content || ''}\n\n`;
                break;
              case 'key_concepts_block':
                if (section.concepts && section.concepts.length > 0) {
                  pdfContent += '🔑 CONCEPTOS CLAVE:\n';
                  section.concepts.forEach((concept: string) => {
                    pdfContent += `• ${concept}\n`;
                  });
                  pdfContent += '\n';
                }
                break;
              default:
                pdfContent += `${section.content || JSON.stringify(section, null, 2)}\n\n`;
            }
          });
        }
        
        // Conceptos clave
        if (parsedData.key_concepts) {
          pdfContent += '🔑 CONCEPTOS CLAVE:\n';
          parsedData.key_concepts.forEach((concept: string) => {
            pdfContent += `• ${concept}\n`;
          });
          pdfContent += '\n';
        }
      } else {
        // Si es texto plano
        pdfContent = parsedData;
      }
      
      console.log('📄 PDF content to send:', pdfContent);
      
      // Enviar al backend para generar PDF
      const response = await transcriptionAPI.exportToPDF(pdfContent);
      
      if (response.success && response.data?.download_url) {
        Alert.alert('✅ Éxito', 'PDF generado correctamente');
        
        // Usar la URL de descarga directa para descargar el PDF
        const downloadUrl = response.data.download_url;
        console.log('📥 Download URL:', downloadUrl);
        
        // Intentar descargar el PDF directamente
        try {
          // Usar Linking para abrir la URL de descarga
          const { Linking } = require('react-native');
          const canOpen = await Linking.canOpenURL(downloadUrl);
          
          if (canOpen) {
            await Linking.openURL(downloadUrl);
            Alert.alert('✅ Descarga Iniciada', 'La descarga del PDF ha comenzado. El archivo se guardará en tu dispositivo.');
          } else {
            // Si no se puede abrir directamente, mostrar la URL para copiar
            Alert.alert('⚠️ Atención', 
              'PDF generado correctamente. Puedes descargarlo desde:\n\n' + 
              downloadUrl + 
              '\n\nCopia esta URL y ábrela en tu navegador.'
            );
          }
        } catch (downloadError) {
          console.error('Error downloading PDF:', downloadError);
          Alert.alert('⚠️ PDF Generado', 
            'PDF creado exitosamente. URL de descarga: ' + downloadUrl + 
            '\n\nPuedes copiar esta URL y abrirla en tu navegador para descargar el archivo.'
          );
        }
      } else if (response.success && response.data?.pdf_url) {
        // Fallback a la URL de visualización si no hay URL de descarga
        Alert.alert('✅ Éxito', 'PDF generado correctamente');
        const pdfUrl = response.data.pdf_url;
        console.log('📄 PDF URL (fallback):', pdfUrl);
        
        try {
          const { Linking } = require('react-native');
          const canOpen = await Linking.canOpenURL(pdfUrl);
          
          if (canOpen) {
            await Linking.openURL(pdfUrl);
            Alert.alert('✅ PDF Listo', 'El PDF se ha abierto en tu navegador. Puedes descargarlo desde allí.');
          } else {
            Alert.alert('⚠️ Atención', 
              'PDF generado correctamente. Puedes acceder a él en:\n\n' + 
              pdfUrl + 
              '\n\nDesde un navegador web.'
            );
          }
        } catch (openError) {
          console.error('Error opening PDF:', openError);
          Alert.alert('⚠️ PDF Generado', 
            'PDF creado exitosamente. URL: ' + pdfUrl + 
            '\n\nPuedes copiar esta URL y abrirla en tu navegador para descargar el archivo.'
          );
        }
      } else {
        Alert.alert('Error', 'No se pudo generar el PDF o no se recibió la URL de descarga');
      }
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header elegante */}
        <View style={styles.header}>
          <View style={styles.recordingTitle}>
            <Text style={styles.recordingName}>Clase Universitaria</Text>
            <View style={styles.recordingTimeBadge}>
              <Text style={styles.recordingTimeText}>{getCurrentTime()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={navigateToTranscriptions}
              style={styles.logoutButton}
            >
              <Ionicons name="list" size={24} color="#3ba3a4" />
            </TouchableOpacity>
            <Text style={styles.meetingInfo}>Dicttr + IA</Text>
            <TouchableOpacity onPress={() => {
              Alert.alert(
                'Cerrar sesión',
                '¿Estás seguro de que quieres cerrar sesión?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Cerrar sesión', style: 'destructive', onPress: logout }
                ]
              );
            }} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>


          {/* Transcripción Mejorada - Ventana Minimizable */}
          {enhancedText && Object.keys(enhancedText).length > 0 ? (
            <View style={styles.compactSection}>
              <View style={styles.windowHeader}>
                <TouchableOpacity 
                  onPress={() => setShowOriginalTranscriptionModal(true)}
                  style={styles.noteIconButton}
                >
                  <Ionicons name="musical-notes" size={18} color="#3ba3a4" />
                </TouchableOpacity>
                <Text style={styles.windowTitle}>Transcripción Mejorada (IA)</Text>
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
                      color="#666" 
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
                      onDelete={(path, element) => {
                        // Eliminar elemento directamente sin abrir modal
                        handleDeleteElement(path, element);
                      }}
                      onAdd={(type, position) => {
                        // Añadir nuevo bloque
                        handleAddElement(type, position);
                      }}
                    />
                  </ScrollView>
                </View>
              )}
            </View>
          ) : null}

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



          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3ba3a4" />
              <Text style={styles.loadingText}>Procesando con IA...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Barra de grabación fija en la parte inferior */}
      <View style={styles.recordingSection}>
        <Text style={styles.timer}>{formatDuration(recordingDuration)}</Text>
        <View style={styles.centerContainer}>
          <Text style={[
            styles.statusText,
            isRecording ? styles.recordingStatus : styles.readyStatus
          ]}>
            {isRecording ? '🔴 Grabando...' : 'Listo para grabar'}
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          {/* Botón para menú de material de estudio */}
          <TouchableOpacity
            style={[styles.materialMenuBtn, showMaterialMenu && styles.materialMenuBtnActive]}
            onPress={() => setShowMaterialMenu(!showMaterialMenu)}
            disabled={loading}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Botón de grabación principal */}
          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordingBtn]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={loading}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menú desplegable de material de estudio */}
      {showMaterialMenu && (
        <View style={styles.materialMenu}>
          <TouchableOpacity
            style={styles.materialMenuItem}
            onPress={() => {
              generateStudyMaterial('summary');
              setShowMaterialMenu(false);
            }}
            disabled={loading}
          >
            <Ionicons name="document-text" size={20} color="#3ba3a4" />
            <Text style={styles.materialMenuItemText}>Resumen</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.materialMenuItem}
            onPress={() => {
              generateStudyMaterial('flashcards');
              setShowMaterialMenu(false);
            }}
            disabled={loading}
          >
            <Ionicons name="albums" size={20} color="#3ba3a4" />
            <Text style={styles.materialMenuItemText}>Flashcards</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.materialMenuItem}
            onPress={() => {
              generateStudyMaterial('concepts');
              setShowMaterialMenu(false);
            }}
            disabled={loading}
          >
            <Ionicons name="bulb" size={20} color="#3ba3a4" />
            <Text style={styles.materialMenuItemText}>Conceptos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.materialMenuItem}
            onPress={() => {
              generateStudyMaterial('quiz');
              setShowMaterialMenu(false);
            }}
            disabled={loading}
          >
            <Ionicons name="help-circle" size={20} color="#3ba3a4" />
            <Text style={styles.materialMenuItemText}>Quiz</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.materialMenuItem}
            onPress={() => {
              generateStudyMaterial('flowchart');
              setShowMaterialMenu(false);
            }}
            disabled={loading}
          >
            <Ionicons name="git-branch" size={20} color="#3ba3a4" />
            <Text style={styles.materialMenuItemText}>Flujograma</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.materialMenuItem}
            onPress={() => {
              openBlockEditor();
              setShowMaterialMenu(false);
            }}
            disabled={loading}
          >
            <Ionicons name="document" size={20} color="#3ba3a4" />
            <Text style={styles.materialMenuItemText}>Editor IA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.materialMenuItem}
            onPress={() => {
              // Navegar a la pantalla de transcripciones
              navigation.navigate('Transcriptions');
              setShowMaterialMenu(false);
            }}
            disabled={loading}
          >
            <Ionicons name="list" size={20} color="#3ba3a4" />
            <Text style={styles.materialMenuItemText}>Mis Transcripciones</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Editor Flotante */}
      <ModalEditor
        visible={showModalEditor}
        onClose={closeModalEditor}
        initialContent={editingContent}
        onSave={handleSaveEditedContent}
        selectedPath={editingPath}
        selectedElement={editingElement}
      />

      {/* Modal para Transcripción Completa */}
      <Modal
        visible={showTranscriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeFullScreenTranscription}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.transcriptionModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Transcripción Completa</Text>
              <TouchableOpacity onPress={closeFullScreenTranscription} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Content */}
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
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Transcripción Original</Text>
              <TouchableOpacity 
                onPress={() => setShowOriginalTranscriptionModal(false)} 
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Content */}
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
            {/* Header con título y botones de acción */}
            <View style={styles.previewModalHeader}>
              <View style={styles.previewModalTitleRow}>
                <Text style={styles.previewModalTitle}>Vista Previa</Text>
                <TouchableOpacity 
                  onPress={handleExportToPDF}
                  style={styles.exportButton}
                >
                  <Ionicons name="download" size={20} color="#3ba3a4" />
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

            {/* Content */}
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

      {/* Botón de configuración circular */}
      <ConfigButton onPress={() => setShowConfigMenu(true)} />

      {/* Menú de configuración flotante */}
      <ConfigMenu
        visible={showConfigMenu}
        onClose={() => setShowConfigMenu(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Espacio para la barra de grabación
  },
  header: {
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  recordingTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  recordingName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  textContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  transcriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  enhancedContainer: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  enhancedText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  materialButton: {
    backgroundColor: '#3ba3a4',
    padding: 12,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  materialButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  materialContainer: {
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  materialText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  flowchartContainer: {
    backgroundColor: '#e6f7ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1890ff',
    borderStyle: 'dashed',
  },
  flowchartText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
    color: '#0050b3',
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
  savedRecordings: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recordingItemName: {
    fontWeight: '500',
    color: '#444',
  },
  recordingItemTime: {
    fontSize: 12,
    color: '#666',
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
  timer: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  // Estilos para ventanas minimizables
  compactSection: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  fullScreenButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  windowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleButton: {
    padding: 4,
  },
  scrollContainer: {
    height: 100,
    marginTop: 10,
  },
  scrollViewCompact: {
    flex: 1,
  },
  scrollContentCompact: {
    padding: 8,
  },
  scrollContainerEnhanced: {
    flex: 1,
    minHeight: 400,
    marginTop: 10,
  },
  minimalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  enhancedMinimalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  // Estilos para modal de transcripción completa
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
  // Estilos para el menú de material de estudio
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
  noteIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
    marginRight: 8,
  },
  previewContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  // Estilos para modal de vista previa sin header
  previewModalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
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
  // Estilos para header del modal de vista previa
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
});


export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <AuthNavigator />
      </ModalProvider>
    </AuthProvider>
  );
}
