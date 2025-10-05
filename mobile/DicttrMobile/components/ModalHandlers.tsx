import { Alert } from 'react-native';
import { transcriptionManagementAPI } from '../services/api';

export interface ModalHandlersProps {
  enhancedText: any;
  setEnhancedText: (text: any) => void;
  currentTranscriptionId: string | null;
}

export const handleDeleteElement = (path: string, { enhancedText, setEnhancedText }: ModalHandlersProps) => {
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

export const handleUpdateElement = async (path: string, element: any, { enhancedText, setEnhancedText, currentTranscriptionId }: ModalHandlersProps) => {
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
  console.log('🔍 Path parts:', pathParts, 'Element:', element);

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

  // Guardar los cambios en la base de datos si hay un ID de transcripción actual
  if (currentTranscriptionId) {
    try {
      console.log('💾 Guardando cambios en la base de datos para transcripción:', currentTranscriptionId);

      // Preparar los campos a actualizar
      const updates: any = {};

      // Si se actualizó el título, incluirlo en los updates
      if (pathParts[0] === 'title' && updatedData.title) {
        updates.title = updatedData.title;
      }

      // Si se actualizó el resumen, incluirlo en los updates (puede estar en title path también)
      if (updatedData.summary) {
        updates.summary = updatedData.summary;
      }

      // Siempre guardar el enhanced_text completo como JSON string
      const enhancedTextString = JSON.stringify(updatedData);
      updates.enhanced_text = enhancedTextString;

      console.log('📤 Enviando actualizaciones a la base de datos:', updates);

      // Actualizar la transcripción en la base de datos
      const response = await transcriptionManagementAPI.updateTranscription(
        currentTranscriptionId,
        updates
      );

      if (response.success) {
        console.log('✅ Cambios guardados exitosamente en la base de datos');
      } else {
        console.error('❌ Error al guardar en la base de datos:', response.message);
        Alert.alert('⚠️ Advertencia', 'Los cambios se guardaron localmente pero hubo un error al guardar en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error al guardar en la base de datos:', error);
      Alert.alert('⚠️ Advertencia', 'Los cambios se guardaron localmente pero hubo un error al guardar en la base de datos');
    }
  } else {
    console.log('ℹ️ No hay ID de transcripción actual, solo guardando cambios localmente');
  }

  // Mostrar mensaje diferente según si es contenido generado por IA o edición manual
  if (element && element.generated_content) {
    Alert.alert('✅ Actualizado', 'Contenido generado con IA aplicado correctamente');
  } else {
    Alert.alert('✅ Guardado', 'Cambios guardados correctamente');
  }
};

export const handleAddElement = (typeOrBlock: string | any, position: number | undefined, { enhancedText, setEnhancedText }: ModalHandlersProps) => {
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

  return updatedData;
};