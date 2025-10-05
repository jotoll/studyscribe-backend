import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface MermaidViewProps {
  mermaidCode: string;
  height?: number;
  style?: any;
}

const MermaidView: React.FC<MermaidViewProps> = ({ 
  mermaidCode, 
  height = 300, 
  style 
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  // HTML template para renderizar Mermaid
  const mermaidHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .mermaid {
      font-family: 'Arial', sans-serif;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 100%;
      overflow: auto;
    }
    .error {
      color: #d32f2f;
      padding: 20px;
      text-align: center;
      font-family: 'Arial', sans-serif;
    }
  </style>
</head>
<body>
  <div class="mermaid">
    ${mermaidCode}
  </div>
  <script>
    try {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Arial, sans-serif',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        }
      });
      
      // Forzar re-render si es necesario
      setTimeout(() => {
        mermaid.init(undefined, '.mermaid');
      }, 100);
      
      // Notificar a React Native cuando se complete la carga
      window.addEventListener('load', () => {
        window.ReactNativeWebView.postMessage('mermaid_loaded');
      });
      
    } catch (error) {
      document.body.innerHTML = '<div class="error">Error al renderizar diagrama: ' + error.message + '</div>';
      window.ReactNativeWebView.postMessage('mermaid_error');
    }
  </script>
</body>
</html>
  `;

  useEffect(() => {
    if (webViewRef.current && mermaidCode) {
      setIsLoading(true);
      // Reiniciar el WebView para forzar re-render
      webViewRef.current.reload();
    }
  }, [mermaidCode]);

  const handleWebViewMessage = (event: any) => {
    const message = event.nativeEvent.data;
    if (message === 'mermaid_loaded' || message === 'mermaid_error') {
      setIsLoading(false);
    }
  };

  if (!mermaidCode) {
    return (
      <View style={[styles.container, style, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No hay código Mermaid para mostrar</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style, { height }]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: mermaidHtml }}
        style={[styles.webview, { opacity: isLoading ? 0 : 1 }]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onMessage={handleWebViewMessage}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        scalesPageToFit={true}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 10,
  },
  placeholder: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MermaidView;
