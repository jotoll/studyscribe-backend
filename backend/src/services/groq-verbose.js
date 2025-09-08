const fs = require('fs');
const Groq = require('groq-sdk');

async function groqVerboseTranscribe(
  filepath,
  {
    model = "whisper-large-v3-turbo",
    language = "es",
    prompt,
  } = {}
) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no está configurada');
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  try {
    const audioStream = fs.createReadStream(filepath);
    
    const transcription = await groq.audio.transcriptions.create({
      file: audioStream,
      model: model,
      language: language,
      prompt: prompt,
      response_format: "verbose_json",
      temperature: 0.0
    });

    return transcription;
  } catch (error) {
    throw new Error(`Groq STT error: ${error.message}`);
  }
}

// Función helper para validar y limpiar la transcripción
function validateTranscription(transcription) {
  return {
    ...transcription,
    segments: transcription.segments.map(segment => ({
      ...segment,
      start: Math.max(0, segment.start),
      end: Math.max(segment.start + 0.1, segment.end),
      text: segment.text.trim()
    })).filter(segment => segment.text.length > 0)
  };
}

module.exports = {
  groqVerboseTranscribe,
  validateTranscription
};