import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { transcriptionManagementAPI, folderAPI } from '../services/api';

export interface NavigationManagerProps {
  setTranscriptionText: (text: string) => void;
  setEnhancedText: (text: any) => void;
  setLoading: (loading: boolean) => void;
  setCurrentTranscriptionId: (id: string | null) => void;
  setSelectedTags?: (tags: any[]) => void;
  setSelectedFolder?: (folder: any) => void;
  setCurrentSubject?: (subject: string) => void;
}

export const useNavigationManager = ({
  setTranscriptionText,
  setEnhancedText,
  setLoading,
  setCurrentTranscriptionId,
  setSelectedTags,
  setSelectedFolder,
  setCurrentSubject
}: NavigationManagerProps) => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (navigation) {
      console.log('Navigation disponible');
    }

    // Verificar parรกmetros al montar el componente
    const checkInitialParams = async () => {
      console.log('Checking initial navigation params on mount');
      const params = navigation.getState()?.routes?.[navigation.getState().index]?.params;
      console.log('Initial navigation params:', params);

      if (params?.transcriptionId) {
        console.log('Found transcriptionId on mount:', params.transcriptionId);
        await loadTranscriptionFromId(params.transcriptionId);
      }
    };

    const loadTranscriptionFromId = async (transcriptionId: string) => {
      console.log('Cargando transcripciรณn desde ID:', transcriptionId);
      setCurrentTranscriptionId(transcriptionId);

      try {
        setLoading(true);
        const response = await transcriptionManagementAPI.getTranscription(transcriptionId);

        if (response.success && response.data) {
          const transcriptionData = response.data;
          console.log('Transcripciรณn cargada desde API:', transcriptionData);

          setTranscriptionText(transcriptionData.original_text || '');

          let enhancedData = transcriptionData.enhanced_text || null;
          if (typeof enhancedData === 'string') {
            try {
              enhancedData = JSON.parse(enhancedData);
              console.log('โ�� Enhanced text parseado correctamente desde JSON string');
            } catch (error) {
              console.error('Error parseando enhanced_text JSON:', error);
            }
          }
          setEnhancedText(enhancedData);

          // Cargar asunto de la transcripción
          if (setCurrentSubject && transcriptionData.subject) {
            setCurrentSubject(transcriptionData.subject);
            console.log('Asunto cargado:', transcriptionData.subject);
          } else if (setCurrentSubject) {
            setCurrentSubject('');
            console.log('No se encontró asunto para esta transcripción');
          }

          // Cargar etiquetas de la transcripción
          if (setSelectedTags) {
            try {
              const tagsResponse = await transcriptionManagementAPI.getTranscriptionTags(transcriptionId);
              if (tagsResponse.success && tagsResponse.data) {
                setSelectedTags(tagsResponse.data.tags || []);
                console.log('Etiquetas cargadas:', tagsResponse.data.tags);
              } else {
                setSelectedTags([]);
                console.log('No se encontraron etiquetas para esta transcripción');
              }
            } catch (error) {
              console.error('Error cargando etiquetas:', error);
              setSelectedTags([]);
            }
          }

          // Cargar carpeta de la transcripción
          if (setSelectedFolder && (transcriptionData as any).folder_id) {
            try {
              const folderResponse = await folderAPI.getFolder((transcriptionData as any).folder_id);
              if (folderResponse.success && folderResponse.data) {
                setSelectedFolder(folderResponse.data);
                console.log('Carpeta cargada:', folderResponse.data);
              } else {
                setSelectedFolder(null);
                console.log('No se encontró carpeta para esta transcripción');
              }
            } catch (error) {
              console.error('Error cargando carpeta:', error);
              setSelectedFolder(null);
            }
          } else if (setSelectedFolder) {
            setSelectedFolder(null);
          }
        } else {
          Alert.alert('Error', 'No se pudo cargar la transcripciรณn');
        }
      } catch (error) {
        console.error('Error loading transcription:', error);
        Alert.alert('Error', 'No se pudo cargar la transcripciรณn');
      } finally {
        setLoading(false);
      }
    };

    checkInitialParams();

    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('Navigation focus event triggered');
      const params = navigation.getState()?.routes?.[navigation.getState().index]?.params;
      console.log('Navigation params:', params);

      if (params?.transcriptionData) {
        const { transcriptionData } = params;
        console.log('Cargando transcripciรณn desde navegaciรณn (transcriptionData):', transcriptionData);
        setTranscriptionText(transcriptionData.original_text || '');

        let enhancedData = transcriptionData.enhanced_text || null;
        if (typeof enhancedData === 'string') {
          try {
            enhancedData = JSON.parse(enhancedData);
            console.log('โ�� Enhanced text parseado correctamente desde JSON string');
          } catch (error) {
            console.error('Error parseando enhanced_text JSON:', error);
          }
        }
        setEnhancedText(enhancedData);

        // Cargar etiquetas si estรกn incluidas en los datos
        if (setSelectedTags && transcriptionData.tags) {
          setSelectedTags(transcriptionData.tags);
        } else if (setSelectedTags && transcriptionData.id) {
          // Si no estรกn incluidas, cargarlas desde la API
          try {
            const tagsResponse = await transcriptionManagementAPI.getTranscriptionTags(transcriptionData.id);
            if (tagsResponse.success && tagsResponse.data) {
              setSelectedTags(tagsResponse.data.tags || []);
            } else {
              setSelectedTags([]);
            }
          } catch (error) {
            console.error('Error cargando etiquetas:', error);
            setSelectedTags([]);
          }
        }

        // Cargar carpeta si estรก incluida en los datos
        if (setSelectedFolder && transcriptionData.folder) {
          setSelectedFolder(transcriptionData.folder);
        } else if (setSelectedFolder && transcriptionData.folder_id) {
          // Si no estรก incluida, cargarla desde la API
          try {
            const folderResponse = await folderAPI.getFolder(transcriptionData.folder_id);
            if (folderResponse.success && folderResponse.data) {
              setSelectedFolder(folderResponse.data);
            } else {
              setSelectedFolder(null);
            }
          } catch (error) {
            console.error('Error cargando carpeta:', error);
            setSelectedFolder(null);
          }
        } else if (setSelectedFolder) {
          setSelectedFolder(null);
        }
      }

      else if (params?.transcriptionId) {
        const { transcriptionId } = params;
        console.log('Cargando transcripciรณn desde ID en focus event:', transcriptionId);
        await loadTranscriptionFromId(transcriptionId);
      } else {
        console.log('No se encontraron parรกmetros de transcripciรณn en la navegaciรณn');
      }
    });

    return unsubscribe;
  }, [navigation]);

  const navigateToTranscriptions = () => {
    console.log('Intentando navegar a Transcriptions');
    setTimeout(() => {
      if (navigation && navigation.navigate) {
        try {
          navigation.navigate('Transcriptions');
          console.log('Navegaciรณn exitosa');
        } catch (error) {
          console.error('Error al navegar:', error);
          Alert.alert('Error', 'No se puede acceder a las transcripciones en este momento');
        }
      } else {
        console.error('Navigation no disponible');
        Alert.alert('Error', 'La navegaciรณn no estรก disponible');
      }
    }, 1000);
  };

  return { navigateToTranscriptions };
};
