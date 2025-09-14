export interface DocBlocksV2 {
  doc_id: string;
  meta: {
    curso: string;
    asignatura: string;
    idioma: string;
  };
  blocks: Array<{
    id: string;
    type: string;
    text?: string;
    items?: string[];
    concepts?: string[];
    time?: { start: number; end: number };
    confidence?: number;
    speaker?: string | null;
    tags?: string[];
    // Custom block types
    term?: string;
    definition?: string;
    examples?: string[];
    content?: string;
  }>;
  version: number;
}
