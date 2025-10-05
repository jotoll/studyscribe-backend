import React from 'react';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

const DicttrLogo = ({ width = 120, height = 120 }: { width?: number; height?: number }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 1259.9 400">
      <Defs>
        <LinearGradient id="gradient1" x1="144.9" y1="155.1" x2="1165.5" y2="170.9" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#28677d" />
          <Stop offset="0.3" stopColor="#3ba3a4" />
          <Stop offset="0.4" stopColor="#97447a" />
          <Stop offset="0.8" stopColor="#e27667" />
          <Stop offset="1" stopColor="#e98868" />
        </LinearGradient>
        <LinearGradient id="gradient2" x1="144.1" y1="203.5" x2="1164.8" y2="219.3" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#28677d" />
          <Stop offset="0.3" stopColor="#3ba3a4" />
          <Stop offset="0.4" stopColor="#97447a" />
          <Stop offset="0.8" stopColor="#e27667" />
          <Stop offset="1" stopColor="#e98868" />
        </LinearGradient>
        <LinearGradient id="gradient3" x1="142.9" y1="284.3" x2="1163.5" y2="300.1" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#28677d" />
          <Stop offset="0.3" stopColor="#3ba3a4" />
          <Stop offset="0.4" stopColor="#97447a" />
          <Stop offset="0.8" stopColor="#e27667" />
          <Stop offset="1" stopColor="#e98868" />
        </LinearGradient>
        <LinearGradient id="gradient4" x1="143.8" y1="228.6" x2="1164.4" y2="244.3" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#28677d" />
          <Stop offset="0.3" stopColor="#3ba3a4" />
          <Stop offset="0.4" stopColor="#97447a" />
          <Stop offset="0.8" stopColor="#e27667" />
          <Stop offset="1" stopColor="#e98868" />
        </LinearGradient>
        <LinearGradient id="gradient5" x1="144.3" y1="195.1" x2="1164.9" y2="210.8" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#28677d" />
          <Stop offset="0.3" stopColor="#3ba3a4" />
          <Stop offset="0.4" stopColor="#97447a" />
          <Stop offset="0.8" stopColor="#e27667" />
          <Stop offset="1" stopColor="#e98868" />
        </LinearGradient>
      </Defs>
      <G>
        <Path
          d="M381.2,196.8c18.7,1.9,39.9-19.3,38-38,1.9-18.7-19.3-39.9-38-38-18.7-1.9-39.9,19.3-38,38-1.9,18.7,19.3,39.9,38,38Z"
          fill="url(#gradient1)"
        />
        <Path
          d="M331.2,234.8V62h-76v65.3c-42.2-17.6-103.3.8-128.9,38.7-29.5,34.9-30.6,98.7-2.2,134.6,24.3,38.7,84.8,59,127.6,42.8,44.3-11.5,82-63,79.5-108.7ZM217.2,272.8c-18.7,1.9-39.9-19.3-38-38-1.9-18.7,19.3-39.9,38-38,18.7-1.9,39.9,19.3,38,38,1.9,18.7-19.3,39.9-38,38Z"
          fill="url(#gradient2)"
        />
        <Path
          d="M381.2,227.2h38v121.6h-76v-83.6c-1.9-18.7,19.3-39.9,38-38Z"
          fill="url(#gradient3)"
        />
        <Path
          d="M574.1,261.7l53.7,53.7c-22.3,22.7-53.9,33.8-80.6,33.4-26.6.7-58.6-11.4-80.6-33.4s-34.1-54-33.4-80.6c-.7-26.6,11.4-58.6,33.4-80.6s54-34.1,80.6-33.4c26.7-.4,58.3,10.7,80.6,33.4l-53.7,53.7c-9.6-10.5-28.5-14.3-41.4-8.2-13.4,4.9-24.1,20.8-23.5,35.1-.6,14.3,10,30.2,23.5,35.1,12.9,6,31.8,2.3,41.4-8.2Z"
          fill="url(#gradient4)"
        />
        <Path
          d="M1148.6,166.4c-21.9-30.2-59.9-46.3-91.2-45.6-12.2,0-25.2,2-38,6.5v-6.5h-76v114c.1,9.7-4.2,20.1-11.1,26.9-9.6,10.5-28.5,14.3-41.4,8.2-13.4-4.9-24.1-20.8-23.5-35.1v-38h38v-76h-38v-58.8h-76v172.8c.1,9.7-4.2,20.1-11.1,26.9-9.6,10.5-28.5,14.3-41.4,8.2-13.4-4.9-24.1-20.8-23.5-35.1v-38h38v-76h-38v-58.8h-76v172.8c-1.7,41.9,28.5,88.6,67.5,104.1,37.5,18.7,92.5,10.1,122.5-19.1,28.3,27,77.6,36.8,114,22.5v6.5h76v-114c-.8-15.1,11.4-32,26-36.1,14-5.5,34,.7,42.4,13.3l60.8-45.6Z"
          fill="url(#gradient5)"
        />
      </G>
    </Svg>
  );
};

export default DicttrLogo;