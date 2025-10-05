import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from './MainScreen';
import BlockEditorScreen from './screens/BlockEditorScreen';
import TranscriptionsScreen from './screens/TranscriptionsScreen';

export type RootStackParamList = {
  Main: { transcriptionId?: string };
  BlockEditor: { initialContent?: string | any[] };
  Transcriptions: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f2f5',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainScreen}
        options={{ 
          title: 'Dicttr',
          headerShown: false
        }}
      />
      {/* <Stack.Screen 
        name="BlockEditor" 
        component={BlockEditorScreen}
        options={{ 
          title: 'Editor con IA',
          presentation: 'modal'
        }}
      /> */}
      <Stack.Screen 
        name="Transcriptions" 
        component={TranscriptionsScreen}
        options={{ 
          title: 'Mis Transcripciones',
          presentation: 'modal',
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
