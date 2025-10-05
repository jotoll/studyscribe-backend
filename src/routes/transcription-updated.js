// Archivo que muestra las modificaciones necesarias en src/routes/transcription.js
// para soportar configuración de idiomas

// En el endpoint POST /api/transcription/upload-file, modificar la línea 66:
// const { subject = null, format } = req.body;
// Por:
const { subject = null, format, language = 'es', translation_language = 'es' } = req.body;

// Luego, en la línea 69, modificar la llamada a transcribeAudio:
// const transcription = await transcriptionService.transcribeAudio(req.file.path);
// Por:
const transcription = await transcriptionService.transcribeAudio(req.file.path, language);

// Y en la línea 72-75, modificar la llamada a enhanceTranscription:
// const enhanced = await transcriptionService.enhanceTranscription(
//   transcription.text, 
//   subject
// );
// Por:
const enhanced = await transcriptionService.enhanceTranscription(
  transcription.text, 
  subject,
  translation_language
);

// Finalmente, al guardar en la base de datos (línea 88-92), incluir los idiomas:
// saveResult = await transcriptionService.saveTranscriptionToDB(
//   enhanced,
//   userId,
//   fileInfo
// );
// Por:
saveResult = await transcriptionService.saveTranscriptionToDB(
  enhanced,
  userId,
  fileInfo,
  {
    language,           // Usar la columna existente 'language' para el idioma de transcripción
    translation_language  // Usar la nueva columna 'translation_language' para el idioma de traducción
  }
);