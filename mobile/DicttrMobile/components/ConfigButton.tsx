import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfigButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const ConfigButton: React.FC<ConfigButtonProps> = ({
  onPress,
  size = 50,
  color = 'white',
  backgroundColor = '#3ba3a4',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="settings" size={size * 0.5} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
});

export default ConfigButton;