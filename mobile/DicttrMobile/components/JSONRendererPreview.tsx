import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { JSONRendererStyles as styles } from './JSONRendererStyles';

interface JSONRendererPreviewProps {
  data: any;
}

const JSONRendererPreview: React.FC<JSONRendererPreviewProps> = ({ data }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);

  if (!data) {
    return <Text style={styles.empty}>No hay datos para mostrar</Text>;
  }

  // Si los datos vienen como string JSON dentro de raw_content, parsearlos
  let parsedData = data;
  if (typeof data === 'object' && data.raw_content) {
    try {
      // Extraer el JSON del string que puede contener markdown
      const jsonMatch = data.raw_content.match(/```json\n([\s\S]*?)\n```/) || data.raw_content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // Si no hay markdown, intentar parsear directamente
        parsedData = JSON.parse(data.raw_content);
      }
    } catch (error) {
      console.error('Error parsing JSON from raw_content:', error);
      // Mantener los datos originales si hay error al parsear
      parsedData = data;
    }
  }

  // Normalizar la estructura de datos para ser compatible con ambos formatos
  // Si viene en formato 'blocks' (de Deepseek), convertirlo a formato 'sections'
  if (parsedData.blocks && !parsedData.sections) {
    parsedData = {
      ...parsedData,
      sections: parsedData.blocks.map((block: any) => {
        // Mapear tipos de blocks a tipos de sections
        let type = block.type;
        let level = 2;
        
        switch (block.type) {
          case 'h1':
            type = 'heading';
            level = 1;
            break;
          case 'h2':
            type = 'heading';
            level = 2;
            break;
          case 'h3':
            type = 'heading';
            level = 3;
            break;
          case 'bulleted_list':
            type = 'list';
            break;
          case 'numbered_list':
            type = 'list';
            break;
          case 'paragraph':
          case 'summary_block':
          case 'concept_block':
          case 'key_concepts_block':
          case 'example':
          case 'important_note':
          case 'quote':
          case 'code':
          case 'formula':
            type = block.type;
            break;
          // Mantener otros tipos como están
        }
        
        return {
          type,
          content: block.text || block.content,
          // Preservar campos específicos para diferentes tipos de bloques
          ...(type === 'concept_block' && {
            term: block.term,
            definition: block.definition,
            examples: block.examples
          }),
          ...(type === 'summary_block' && {
            content: block.content
          }),
          ...(type === 'key_concepts_block' && {
            concepts: block.concepts
          }),
          ...(type === 'heading' && { level }),
          ...(type === 'list' && { 
            style: block.type === 'numbered_list' ? 'numbered' : 'bulleted',
            items: block.items || [block.text]
          })
        };
      })
    };
  }

  const renderSection = (section: any, index: number) => {
    const sectionKey = `section-${index}-${section.type}-${section.content?.substring(0, 20) || 'empty'}`;
    
    switch (section.type) {
      case 'heading':
        return (
          <View key={sectionKey} style={styles.sectionContainer}>
            <Text style={[
              styles.heading, 
              { 
                fontSize: section.level === 1 ? 24 : section.level === 2 ? 20 : 18,
                textAlign: section.level === 1 ? 'center' : 'left',
                marginTop: index === 0 ? 0 : 20,
                marginBottom: 10
              }
            ]}>
              {section.content}
            </Text>
          </View>
        );

      case 'paragraph':
        return (
          <View key={sectionKey} style={styles.sectionContainer}>
            <Text style={[styles.paragraph, { marginBottom: 15 }]}>{section.content}</Text>
          </View>
        );

      case 'list':
        return (
          <View key={sectionKey} style={styles.sectionContainer}>
            {section.items?.map((item: string, itemIndex: number) => (
              <View key={`item-${itemIndex}`} style={styles.listItem}>
                <Text style={styles.listText}>• {item}</Text>
              </View>
            ))}
          </View>
        );

      case 'concept_block':
        return (
          <View key={sectionKey} style={[styles.conceptContainer, { marginBottom: 20 }]}>
            <Text style={styles.conceptTerm}>{section.term}</Text>
            {section.definition && (
              <Text style={styles.conceptDefinition}>{section.definition}</Text>
            )}
            {section.examples && section.examples.length > 0 && (
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Ejemplos:</Text>
                {section.examples.map((example: string, exampleIndex: number) => (
                  <Text key={`example-${exampleIndex}`} style={styles.example}>• {example}</Text>
                ))}
              </View>
            )}
          </View>
        );

      case 'summary_block':
        return (
          <View key={sectionKey} style={[styles.summaryContainer, { marginBottom: 20 }]}>
            <Text style={styles.sectionTitle}>📋 Resumen</Text>
            <Text style={styles.summaryText}>{section.content}</Text>
          </View>
        );

      case 'key_concepts_block':
        return (
          <View key={sectionKey} style={[styles.keyConceptsContainer, { marginBottom: 20 }]}>
            <Text style={styles.sectionTitle}>🔑 Conceptos Clave</Text>
            <View style={styles.conceptsList}>
              {section.concepts?.map((concept: string, conceptIndex: number) => (
                <View key={`concept-${conceptIndex}`} style={styles.conceptPill}>
                  <Text style={styles.conceptPillText}>{concept}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'summary':
        return (
          <View key={sectionKey} style={[styles.summaryContainer, { marginBottom: 20 }]}>
            <Text style={styles.sectionTitle}>📋 Resumen</Text>
            <Text style={styles.summaryText}>{section.content}</Text>
          </View>
        );

      case 'example':
        return (
          <View key={sectionKey} style={[styles.exampleContainer, { marginBottom: 20 }]}>
            <Text style={styles.exampleTitle}>📝 Ejemplo</Text>
            <Text style={styles.exampleText}>{section.content}</Text>
          </View>
        );

      case 'important_note':
        return (
          <View key={sectionKey} style={[styles.noteContainer, { marginBottom: 20 }]}>
            <Text style={styles.noteTitle}>💡 Nota Importante</Text>
            <Text style={styles.noteText}>{section.content}</Text>
          </View>
        );

      case 'quote':
        return (
          <View key={sectionKey} style={[styles.quoteContainer, { marginBottom: 20 }]}>
            <Text style={styles.quoteText}>"{section.content}"</Text>
          </View>
        );

      case 'code':
        return (
          <View key={sectionKey} style={[styles.codeContainer, { marginBottom: 20 }]}>
            <Text style={styles.codeText}>{section.content}</Text>
          </View>
        );

      case 'formula':
        return (
          <View key={sectionKey} style={[styles.formulaContainer, { marginBottom: 20 }]}>
            <Text style={styles.formulaTitle}>🧮 Fórmula Matemática</Text>
            <Text style={styles.formulaText}>{section.content}</Text>
            {section.description && (
              <Text style={styles.formulaDescription}>{section.description}</Text>
            )}
          </View>
        );

      default:
        return (
          <View key={sectionKey} style={styles.sectionContainer}>
            <Text style={styles.unknownText}>
              {JSON.stringify(section, null, 2)}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
      {/* Título principal si está disponible */}
      {(parsedData.title || parsedData.summary) && (
        <View style={styles.mainTitleContainer}>
          <Text style={styles.mainTitle}>
            {parsedData.title || 'Resumen de la Clase'}
          </Text>
          {parsedData.summary && (
            <Text style={styles.mainSummary}>{parsedData.summary}</Text>
          )}
        </View>
      )}

      {/* Todas las secciones en un array unificado */}
      {parsedData.sections && parsedData.sections.map((section: any, index: number) => (
        <View key={`section-${index}-${section.type}-${section.content?.substring(0, 20) || 'empty'}`}>
          {renderSection(section, index)}
        </View>
      ))}

      {/* Fallback para datos crudos */}
      {!parsedData.sections && (
        <View style={styles.rawContainer}>
          <Text style={styles.rawTitle}>Datos en formato crudo:</Text>
          <Text style={styles.rawText}>{JSON.stringify(parsedData, null, 2)}</Text>
        </View>
      )}

      </ScrollView>
    </View>
  );
};

export default JSONRendererPreview;
