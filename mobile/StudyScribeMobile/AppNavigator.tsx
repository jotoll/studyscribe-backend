import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import MainScreen from './MainScreen';
import BlockEditorScreen from './screens/BlockEditorScreen';
import TranscriptionsScreen from './screens/TranscriptionsScreen';

export type RootStackParamList = {
  Main: undefined;
  BlockEditor: { initialContent?: string | any[] };
  Transcriptions: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A00E0',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={MainScreen}
          options={{ 
            title: 'StudyScribe',
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
            presentation: 'modal'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
