import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { folderAPI, Folder } from '../../../services/api';

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [updatingFolder, setUpdatingFolder] = useState(false);

  const loadFolders = useCallback(async () => {
    try {
      setFoldersLoading(true);
      const response = await folderAPI.getFolders();
      if (response.success && response.data.folders) {
        setFolders(response.data.folders);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (folderData: { name: string; color: string; icon: string }) => {
    setCreatingFolder(true);
    try {
      const response = await folderAPI.createFolder(folderData);

      if (response.success && response.data) {
        console.log('✅ Carpeta creada exitosamente:', response.data);
        // Actualizar el estado inmediatamente con la nueva carpeta
        setFolders(prev => [...prev, response.data]);
        return true;
      } else {
        // Mostrar un mensaje genérico si no hay mensaje específico
        Alert.alert('Error', 'No se pudo crear la carpeta');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error creating folder:', error);
      // Mostrar el mensaje específico del backend si está disponible
      const errorMessage = error.response?.data?.error || 'No se pudo crear la carpeta';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setCreatingFolder(false);
    }
  }, []);

  const deleteFolder = useCallback(async (folderId: string) => {
    setDeletingFolder(true);
    try {
      const response = await folderAPI.deleteFolder(folderId);

      if (response.success) {
        Alert.alert('Éxito', 'Carpeta eliminada correctamente');
        await loadFolders();
        return true;
      } else {
        // Manejar específicamente el error de carpeta no vacía en la respuesta
        if (response.message?.includes('contiene transcripciones')) {
          Alert.alert(
            'No se puede eliminar la carpeta',
            'No se puede eliminar la carpeta porque contiene transcripciones. Mueve las transcripciones a otra carpeta primero.'
          );
        } else {
          Alert.alert('Error', response.message || 'No se pudo eliminar la carpeta');
        }
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error deleting folder:', error);
      // Manejar específicamente el error de carpeta no vacía en la excepción
      if (error.response?.status === 400 && 
          error.response?.data?.error?.includes('contiene transcripciones')) {
        Alert.alert(
          'No se puede eliminar la carpeta',
          'No se puede eliminar la carpeta porque contiene transcripciones. Mueve las transcripciones a otra carpeta primero.'
        );
      } else {
        Alert.alert('Error', error.message || 'No se pudo eliminar la carpeta');
      }
      return false;
    } finally {
      setDeletingFolder(false);
    }
  }, [loadFolders]);

  const updateFolder = useCallback(async (folderId: string, newName: string) => {
    setUpdatingFolder(true);
    try {
      const response = await folderAPI.updateFolder(folderId, { name: newName });

      if (response.success) {
        console.log('✅ Carpeta actualizada exitosamente:', response.data);
        await loadFolders();
        return true;
      } else {
        // Usar un mensaje genérico si no hay mensaje específico
        Alert.alert('Error', 'No se pudo actualizar la carpeta');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error updating folder:', error);
      // Mostrar el mensaje específico del backend si está disponible
      const errorMessage = error.response?.data?.error || 'No se pudo actualizar la carpeta';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setUpdatingFolder(false);
    }
  }, [loadFolders]);

  const moveTranscriptionToFolder = useCallback(async (transcriptionId: string, folderId: string | null) => {
    try {
      const response = await folderAPI.moveTranscriptionToFolder(transcriptionId, folderId);

      if (response.success) {
        Alert.alert('Éxito', response.message || 'Transcripción movida correctamente');
        return true;
      } else {
        Alert.alert('Error', response.message || 'No se pudo mover la transcripción');
        return false;
      }
    } catch (error) {
      console.error('❌ Error moving transcription:', error);
      Alert.alert('Error', 'No se pudo mover la transcripción');
      return false;
    }
  }, []);

  return {
    folders,
    foldersLoading,
    creatingFolder,
    deletingFolder,
    updatingFolder,
    loadFolders,
    createFolder,
    deleteFolder,
    updateFolder,
    moveTranscriptionToFolder
  };
};
