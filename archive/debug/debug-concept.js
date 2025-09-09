// Script para debuggear la estructura de conceptos
import React from 'react';
import { View, Text } from 'react-native';

const DebugConcept = ({ data }) => {
  console.log('=== DEBUG CONCEPT DATA ===');
  console.log('Tipo de dato:', typeof data);
  
  if (data && typeof data === 'object') {
    console.log('Keys del objeto:', Object.keys(data));
    
    if (data.blocks) {
      console.log('Blocks encontrados:', data.blocks.length);
      const conceptBlocks = data.blocks.filter(block => block.type === 'concept');
      console.log('Concept blocks:', conceptBlocks.length);
      
      conceptBlocks.forEach((block, index) => {
        console.log(`\n--- Concept Block ${index + 1} ---`);
        console.log('Block keys:', Object.keys(block));
        console.log('Text:', block.text);
        console.log('Details:', block.details);
        console.log('Examples:', block.examples);
      });
    }
    
    if (data.sections) {
      console.log('Sections encontrados:', data.sections.length);
      const conceptSections = data.sections.filter(section => section.type === 'concept');
      console.log('Concept sections:', conceptSections.length);
      
      conceptSections.forEach((section, index) => {
        console.log(`\n--- Concept Section ${index + 1} ---`);
        console.log('Section keys:', Object.keys(section));
        console.log('Content:', section.content);
        console.log('Text:', section.text);
        console.log('Details:', section.details);
        console.log('Examples:', section.examples);
      });
    }
  }
  
  console.log('=== FIN DEBUG ===');

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Debug de Conceptos</Text>
      <Text>Revisa la consola para ver los detalles de la estructura de datos.</Text>
    </View>
  );
};

export default DebugConcept;
