export type BlockType =
  | "h1" | "h2" | "h3"
  | "paragraph"
  | "bulleted_list" | "numbered_list"
  | "quote" | "code";

export interface BaseBlock {
  id: string;
  type: BlockType;
  /** tiempo en segundos desde inicio del audio */
  time?: { start: number; end: number };
  /** 0..1 (heurístico). Si no hay dato, omitir. */
  confidence?: number;
  /** "docente", "alumno", "desconocido"... solo si tenemos diarización */
  speaker?: string | null;
  /** tags libres: ["revisar","definición","ejemplo"] */
  tags?: string[];
}

export interface TextBlock extends BaseBlock {
  type: Exclude<BlockType, "bulleted_list" | "numbered_list">;
  text: string;
}

export interface ListBlock extends BaseBlock {
  type: "bulleted_list" | "numbered_list";
  items: string[];
}

export type DocBlock = TextBlock | ListBlock;

export interface DocMeta {
  curso: string;
  asignatura: string;
  idioma: string;
}

export interface DocBlocksV2 {
  doc_id: string;
  meta: DocMeta;
  blocks: DocBlock[];
  version: 2;
}

// Tipos para la respuesta de Groq Whisper verbose_json
export interface GroqVerboseTranscription {
  text: string;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    avg_logprob?: number;
    no_speech_prob?: number;
    temperature?: number;
    compression_ratio?: number;
    tokens?: number[];
  }>;
}

// Interfaz para diarización (placeholder futuro)
export interface DiarizationSegment {
  start: number;
  end: number;
  speaker: string;
  confidence?: number;
}

export interface DiarizationResult {
  segments: DiarizationSegment[];
  speakers: string[];
}