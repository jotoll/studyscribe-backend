import { Alert } from 'react-native';
import { transcriptionAPI } from '../services/api';

export interface StudyMaterialGeneratorProps {
  enhancedText: any;
  setStudyMaterial: (material: string) => void;
  setMermaidCode: (code: string) => void;
  setLoading: (loading: boolean) => void;
  subject?: string | null;
}

export const generateStudyMaterial = async ({
  enhancedText,
  setStudyMaterial,
  setMermaidCode,
  setLoading,
  subject
}: StudyMaterialGeneratorProps, type: 'summary' | 'flashcards' | 'concepts' | 'quiz' | 'flowchart') => {
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
      const response = await transcriptionAPI.generateFlowchart(textContent, subject || undefined);
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
