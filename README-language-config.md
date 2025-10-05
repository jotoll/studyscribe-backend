# Configuración de Idiomas en Dicttr Mobile

Este documento describe la implementación de la configuración de idiomas en la aplicación móvil Dicttr, que permite a los usuarios seleccionar idiomas para la transcripción y traducción de audio.

## Características

- **Selección de idioma de transcripción**: Permite elegir el idioma en el que Groq transcribirá el audio.
- **Selección de idioma de traducción**: Permite elegir el idioma al que DeepSeek traducirá el texto mejorado.
- **Interfaz de configuración intuitiva**: Menú flotante fácil de usar con botón de acceso rápido.
- **Persistencia de configuración**: Los idiomas seleccionados se guardan localmente usando AsyncStorage.
- **Integración con el backend**: La configuración se envía al backend durante el procesamiento de audio.

## Componentes

### 1. ConfigMenu.tsx
Componente principal que muestra el menú de configuración de idiomas.

**Características:**
- Lista de idiomas disponibles para transcripción y traducción.
- Selección visual con indicadores de idioma (banderas).
- Guardado automático de la configuración seleccionada.
- Diseño responsivo y accesible.

**Uso:**
```tsx
<ConfigMenu
  visible={showConfigMenu}
  onClose={() => setShowConfigMenu(false)}
/>
```

### 2. ConfigButton.tsx
Botón circular de acceso rápido a la configuración.

**Características:**
- Diseño flotante en la esquina superior derecha.
- Personalizable en tamaño y color.
- Animaciones sutiles al presionar.

**Uso:**
```tsx
<ConfigButton onPress={() => setShowConfigMenu(true)} />
```

### 3. useConfig Hook
Hook personalizado para acceder a la configuración de idiomas.

**Características:**
- Carga automática de la configuración guardada.
- Proporciona valores predeterminados si no hay configuración.

**Uso:**
```tsx
const config = useConfig();
console.log(config.transcriptionLanguage); // 'es' por defecto
console.log(config.translationLanguage); // 'es' por defecto
```

## Integración con el Backend

### API Service
El servicio `api.ts` ha sido modificado para aceptar opciones de idioma en el método `uploadAudio`:

```typescript
uploadAudio: async (
  audioUri: string, 
  subject: string = '', 
  options?: {
    transcriptionLanguage?: string;
    translationLanguage?: string;
  }
): Promise<TranscriptionResponse>
```

### RecordingProcessor
El procesador de grabaciones obtiene la configuración de idiomas y la envía al backend:

```typescript
const { transcriptionLanguage, translationLanguage } = await getLanguageConfig();
const response = await transcriptionAPI.uploadAudio(audioUri, 'Nueva grabación', {
  transcriptionLanguage,
  translationLanguage
});
```

## Idiomas Disponibles

### Idiomas de Transcripción (Groq)
- Español (es) 🇪🇸
- Inglés (en) 🇬🇧
- Francés (fr) 🇫🇷
- Alemán (de) 🇩🇪
- Italiano (it) 🇮🇹
- Portugués (pt) 🇵🇹
- Ruso (ru) 🇷🇺
- Japonés (ja) 🇯🇵
- Chino (zh) 🇨🇳
- Árabe (ar) 🇸🇦

### Idiomas de Traducción (DeepSeek)
- Español (es) 🇪🇸
- Inglés (en) 🇬🇧
- Francés (fr) 🇫🇷
- Alemán (de) 🇩🇪
- Italiano (it) 🇮🇹
- Portugués (pt) 🇵🇹
- Ruso (ru) 🇷🇺
- Japonés (ja) 🇯🇵
- Chino (zh) 🇨🇳
- Árabe (ar) 🇸🇦

## Flujo de Trabajo

1. El usuario presiona el botón de configuración (`ConfigButton`).
2. Se abre el menú de configuración (`ConfigMenu`).
3. El usuario selecciona los idiomas deseados.
4. La configuración se guarda en AsyncStorage.
5. Cuando el usuario graba audio, la configuración se envía al backend.
6. Groq transcribe el audio en el idioma de transcripción seleccionado.
7. DeepSeek traduce el texto mejorado al idioma de traducción seleccionado.

## Pruebas

Para probar la configuración de idiomas, puedes ejecutar el script de pruebas:

```bash
node test-language-config.js
```

Este script realizará las siguientes pruebas:
- Transcripción con diferentes idiomas.
- Traducción con diferentes idiomas.
- Combinaciones de idiomas de transcripción y traducción.

## Consideraciones Técnicas

### Almacenamiento Local
La configuración se almacena localmente usando AsyncStorage:
- `transcriptionLanguage`: Idioma para la transcripción (predeterminado: 'es').
- `translationLanguage`: Idioma para la traducción (predeterminado: 'es').

### Manejo de Errores
- Si no se puede cargar la configuración, se usan los valores predeterminados.
- Si hay un error al guardar, se muestra una alerta al usuario.
- Si el backend no soporta los idiomas seleccionados, se usará el idioma predeterminado.

### Rendimiento
- La configuración se carga una vez al iniciar la aplicación.
- Las actualizaciones de configuración son inmediatas y se guardan de forma asíncrona.

## Mejoras Futuras

- Detección automática del idioma hablado.
- Guardar configuraciones por usuario (cuando se implemente autenticación).
- Soporte para más idiomas.
- Personalización de la velocidad de habla en la transcripción.
- Modo offline con límite de idiomas compatibles.

## Problemas Conocidos

- En Android, algunos dispositivos pueden tener limitaciones en la detección de ciertos idiomas.
- La calidad de la transcripción puede variar según el acento del hablante.
- La traducción puede ser menos precisa para idiomas con menos recursos de entrenamiento.

## Contribución

Para añadir nuevos idiomas o mejorar la configuración:

1. Actualiza las listas de idiomas en `ConfigMenu.tsx`.
2. Asegúrate de que el backend soporte los nuevos idiomas.
3. Actualiza las pruebas en `test-language-config.js`.
4. Documenta los cambios en este README.