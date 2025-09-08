import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { GroqVerboseTranscription } from '../types/docblocks-v2';

const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export async function groqVerboseTranscribe(
  filepath: string,
  {
    model = "whisper-large-v3-turbo",
    language = "es",
    prompt,
  }: { model?: string; language?: string; prompt?: string } = {}
): Promise<GroqVerboseTranscription> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no está configurada');
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(filepath));
  form.append("model", model);
  form.append("language", language);
  if (prompt) form.append("prompt", prompt);
  form.append("response_format", "verbose_json");

  const res = await fetch(GROQ_STT_URL, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      ...form.getHeaders()
    },
    body: form,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq STT ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<GroqVerboseTranscription>;
}

// Función helper para validar y limpiar la transcripción
export function validateTranscription(transcription: GroqVerboseTranscription): GroqVerboseTranscription {
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