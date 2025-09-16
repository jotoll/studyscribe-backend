import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AIBlockEditor from '../components/AIBlockEditor';
import JSONEditor from '../components/JSONEditor';

interface BlockEditorScreenProps {
  route?: {
    params?: {
      initialContent?: string | any[] | any;
      selectedPath?: string;
      selectedElement?: any;
    };
  };
  navigation?: any;
}

const BlockEditorScreen: React.FC<BlockEditorScreenProps> = ({ route, navigation }) => {
  const initialContent = route?.params?.initialContent;
  const [editedData, setEditedData] = useState<any>(initialContent);

  // Determinar si el contenido es JSON estructurado
  const isJSONStructure = (content: any): boolean => {
    return content && 
           typeof content === 'object' && 
           !Array.isArray(content) && 
           (content.title || content.sections || content.key_concepts || content.summary);
  };

  const handleSave = (data: any) => {
    setEditedData(data);
    Alert.alert('Guardado', 'Los cambios se han guardado correctamente');
    // Pasar los datos editados de vuelta a la pantalla anterior
    navigation?.navigate('Home', { editedContent: data });
    console.log('Datos guardados:', data);
  };

  const handleCancel = () => {
    Alert.alert('Cancelado', 'Los cambios no se han guardado');
    navigation?.goBack();
  };

  if (isJSONStructure(initialContent)) {
    return (
      <View style={styles.container}>
        <JSONEditor 
          initialData={initialContent}
          onSave={handleSave}
          onCancel={handleCancel}
          selectedPath={route?.params?.selectedPath}
          selectedElement={route?.params?.selectedElement}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AIBlockEditor 
        initialContent={initialContent}
        onContentChange={(blocks) => {
          // Aquí puedes guardar el contenido en tu estado global o base de datos
          console.log('Contenido actualizado:', blocks);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
});

export default BlockEditorScreen;
