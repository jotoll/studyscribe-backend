// Archivo que muestra las modificaciones necesarias en src/services/transcriptionService.js
// para soportar configuración de idiomas

// 1. Modificar el método transcribeAudio (línea 10) para aceptar el parámetro de idioma:
// Cambiar:
// async transcribeAudio(audioFile) {
// Por:
// async transcribeAudio(audioFile, language = 'es') {

// 2. Modificar la llamada a Groq (línea 47) para usar el idioma especificado:
// Cambiar:
// language: "es",
// Por:
// language: language, // Usar el idioma especificado

// 3. Modificar el método enhanceTranscription (línea 149) para aceptar el parámetro de idioma de traducción:
// Cambiar:
// async enhanceTranscription(rawText, subject = 'general') {
// Por:
// async enhanceTranscription(rawText, subject = 'general', translationLanguage = 'es') {

// 4. Modificar el systemPrompt (línea 167) para incluir el idioma de traducción:
// Cambiar:
// const systemPrompt = this.getSystemPrompt(subject);
// Por:
// const systemPrompt = this.getSystemPrompt(subject, translationLanguage);

// 5. Modificar el método getSystemPrompt (línea 728) para aceptar el idioma de traducción:
// Cambiar:
// getSystemPrompt(subject) {
// Por:
// getSystemPrompt(subject, translationLanguage = 'es') {

// 6. Añadir al systemPrompt la instrucción de idioma:
// Añadir después de "Tu objetivo es:":
// IMPORTANTE: Genera el contenido mejorado en el idioma "${translationLanguage}". Todo el contenido debe estar en este idioma.

// 7. Modificar el método saveTranscriptionToDB (línea 475) para aceptar los idiomas:
// Cambiar:
// async saveTranscriptionToDB(transcriptionData, userId, fileInfo = null) {
// Por:
// async saveTranscriptionToDB(transcriptionData, userId, fileInfo = null, languageOptions = {}) {

// 8. Modificar el registro de transcripción (línea 493) para incluir los idiomas:
// Cambiar:
// language: transcriptionData.language || 'es',
// Por:
// language: languageOptions.language || transcriptionData.language || 'es',
// translation_language: languageOptions.translation_language || 'es',