import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

const SVGTest = () => {
  return (
    <View style={{ padding: 20 }}>
      <Text>SVG Test Component:</Text>
      <Svg width="120" height="120" viewBox="0 0 1259.9 400">
        <G>
          <Path
            d="M381.2,196.8c18.7,1.9,39.9-19.3,38-38,1.9-18.7-19.3-39.9-38-38-18.7-1.9-39.9,19.3-38,38-1.9,18.7,19.3,39.9,38,38Z"
            fill="#007AFF"
          />
        </G>
      </Svg>
    </View>
  );
};

export default SVGTest;