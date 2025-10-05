import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { transcriptionManagementAPI } from '../../../services/api';
import { Tag, TranscriptionTags } from '../types';

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [updatingTag, setUpdatingTag] = useState(false);
  const [deletingTag, setDeletingTag] = useState(false);
  const [managingTags, setManagingTags] = useState(false);
  const [transcriptionTags, setTranscriptionTags] = useState<TranscriptionTags>({});

  const loadTags = useCallback(async () => {
    try {
      setTagsLoading(true);
      console.log('[TAGS] Loading tags...');
      const response = await transcriptionManagementAPI.getTags();
      console.log('[TAGS] Response:', response);
      if (response.success && response.data.tags) {
        console.log('[TAGS] Tags loaded successfully:', response.data.tags.length, 'tags');
        setTags(response.data.tags);
      } else {
        console.log('[TAGS] Response not successful or no tags data');
      }
    } catch (error: any) {
      console.error('[TAGS] Error loading tags:', error);
      console.log('[TAGS] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      Alert.alert('Error', 'No se pudieron cargar las etiquetas');
    } finally {
      setTagsLoading(false);
    }
  }, []);

  const createTag = useCallback(async (tagData: { name: string; color: string }) => {
    if (!tagData.name.trim()) {
      Alert.alert('Error', 'El nombre de la etiqueta no puede estar vacío');
      return false;
    }

    setCreatingTag(true);
    try {
      const response = await transcriptionManagementAPI.createTag({
        name: tagData.name.trim(),
        color: tagData.color
      });

      if (response.success) {
        await loadTags();
        return true;
      } else {
        Alert.alert('Error', 'No se pudo crear la etiqueta');
        return false;
      }
    } catch (error: any) {
      console.error('Error creating tag:', error);
      // Mostrar el mensaje específico del backend si está disponible
      const errorMessage = error.response?.data?.error || 'No se pudo crear la etiqueta';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setCreatingTag(false);
    }
  }, [loadTags]);

  const deleteTag = useCallback(async (tagId: string) => {
    setDeletingTag(true);
    try {
      const response = await transcriptionManagementAPI.deleteTag(tagId);

      if (response.success) {
        Alert.alert('Éxito', 'Etiqueta eliminada correctamente');
        await loadTags();
        
        // Limpiar la etiqueta eliminada del estado transcriptionTags
        setTranscriptionTags(prev => {
          const updatedTags = { ...prev };
          Object.keys(updatedTags).forEach(transcriptionId => {
            if (updatedTags[transcriptionId]) {
              updatedTags[transcriptionId] = updatedTags[transcriptionId].filter(tag => tag.id !== tagId);
            }
          });
          return updatedTags;
        });
        
        return true;
      } else {
        Alert.alert('Error', response.message || 'No se pudo eliminar la etiqueta');
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting tag:', error);
      Alert.alert('Error', 'No se pudo eliminar la etiqueta');
      return false;
    } finally {
      setDeletingTag(false);
    }
  }, [loadTags]);

  const updateTag = useCallback(async (tagId: string, tagData: { name: string; color: string }) => {
    if (!tagData.name.trim()) {
      Alert.alert('Error', 'El nombre de la etiqueta no puede estar vacío');
      return false;
    }

    setUpdatingTag(true);
    try {
      const response = await transcriptionManagementAPI.updateTag(tagId, {
        name: tagData.name.trim(),
        color: tagData.color
      });

      if (response.success) {
        Alert.alert('Éxito', 'Etiqueta actualizada correctamente');
        await loadTags();
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar la etiqueta');
        return false;
      }
    } catch (error: any) {
      console.error('Error updating tag:', error);
      // Mostrar el mensaje específico del backend si está disponible
      const errorMessage = error.response?.data?.error || 'No se pudo actualizar la etiqueta';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setUpdatingTag(false);
    }
  }, [loadTags]);

  const loadTranscriptionTags = useCallback(async (transcriptionId: string) => {
    try {
      const response = await transcriptionManagementAPI.getTranscriptionTags(transcriptionId);
      if (response.success && response.data.tags) {
        setTranscriptionTags(prev => ({
          ...prev,
          [transcriptionId]: response.data.tags
        }));
      }
    } catch (error) {
      console.error('Error loading transcription tags:', error);
    }
  }, []);

  const assignTagToTranscription = useCallback(async (transcriptionId: string, tagId: string) => {
    setManagingTags(true);
    try {
      const response = await transcriptionManagementAPI.assignTagToTranscription(transcriptionId, tagId);

      if (response.success) {
        await loadTranscriptionTags(transcriptionId);
        return true;
      } else {
        Alert.alert('Error', 'No se pudo asignar la etiqueta');
        return false;
      }
    } catch (error) {
      console.error('Error assigning tag:', error);
      Alert.alert('Error', 'No se pudo asignar la etiqueta');
      return false;
    } finally {
      setManagingTags(false);
    }
  }, [loadTranscriptionTags]);

  const removeTagFromTranscription = useCallback(async (transcriptionId: string, tagId: string) => {
    setManagingTags(true);
    try {
      const response = await transcriptionManagementAPI.removeTagFromTranscription(transcriptionId, tagId);

      if (response.success) {
        await loadTranscriptionTags(transcriptionId);
        return true;
      } else {
        Alert.alert('Error', 'No se pudo quitar la etiqueta');
        return false;
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      Alert.alert('Error', 'No se pudo quitar la etiqueta');
      return false;
    } finally {
      setManagingTags(false);
    }
  }, [loadTranscriptionTags]);

  return {
    tags,
    tagsLoading,
    creatingTag,
    updatingTag,
    deletingTag,
    managingTags,
    transcriptionTags,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    loadTranscriptionTags,
    assignTagToTranscription,
    removeTagFromTranscription,
    setTranscriptionTags
  };
};
