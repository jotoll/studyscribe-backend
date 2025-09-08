function alignBlocksWithSegments(blocks, segments) {
  if (segments.length === 0) {
    return blocks.map(block => ({
      ...block,
      speaker: null,
      tags: block.text && block.text.length > 200 ? ['revisar_timing'] : []
    }));
  }

  // Texto total y tabla de offsets por segmento
  const segTexts = segments.map(s => s.text);
  const fullText = segTexts.join("");
  
  const segOffsets = [];
  let cursor = 0;
  
  for (const text of segTexts) {
    const startChar = cursor;
    cursor += text.length;
    segOffsets.push({ startChar, endChar: cursor });
  }

  function spanToTime(startChar, endChar) {
    // Encuentra primer segmento que interseca el span
    const firstIdx = segOffsets.findIndex(o => o.endChar > startChar);
    if (firstIdx === -1) return { time: undefined, confidence: undefined };

    // Encuentra último segmento que interseca el span
    let lastIdx = firstIdx;
    for (let i = firstIdx; i < segOffsets.length; i++) {
      if (segOffsets[i].startChar >= endChar) {
        lastIdx = Math.max(firstIdx, i - 1);
        break;
      }
      lastIdx = i;
    }

    const start = segments[Math.max(0, firstIdx)].start;
    const end = segments[Math.min(segments.length - 1, lastIdx)].end;
    const confidence = avgConfidence(segments.slice(firstIdx, lastIdx + 1));
    
    return { 
      time: { start, end },
      confidence: confidence && confidence > 0.1 ? confidence : undefined
    };
  }

  function avgConfidence(segs) {
    const vals = [];
    
    for (const seg of segs) {
      if (typeof seg.avg_logprob === 'number') {
        // Mapa lineal de [-1.2, -0.1] → [0, 1]
        const normalized = Math.max(-1.2, Math.min(-0.1, seg.avg_logprob));
        const confidence = (normalized + 1.2) / 1.1;
        vals.push(Math.max(0, Math.min(1, confidence)));
      } else if (typeof seg.no_speech_prob === 'number') {
        // Invertimos no_speech_prob
        vals.push(1 - Math.max(0, Math.min(1, seg.no_speech_prob)));
      }
    }

    if (vals.length === 0) return undefined;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3));
  }

  // Para cada bloque, calculamos texto plano y buscamos en fullText
  return blocks.map(block => {
    const flatText = block.items !== undefined && Array.isArray(block.items)
      ? block.items.join("\n")
      : block.text;

    if (!flatText || flatText.length === 0) {
      return {
        ...block,
        speaker: null,
        tags: ['revisar_timing']
      };
    }

    // Búsqueda tolerante
    const tryFind = (text) => {
      const index = fullText.indexOf(text);
      if (index >= 0) return [index, index + text.length];
      return [-1, -1];
    };

    let [from, to] = tryFind(flatText);
    
    // Fallback: búsqueda parcial si no encontramos match exacto
    if (from < 0 && flatText.length > 20) {
      const head = flatText.slice(0, 40);
      const tail = flatText.slice(-40);
      const headIndex = fullText.indexOf(head);
      const tailIndex = fullText.lastIndexOf(tail);
      
      if (headIndex >= 0 && tailIndex > headIndex) {
        from = headIndex;
        to = tailIndex + tail.length;
      }
    }

    const tags = [...(block.tags || [])];
    let time;
    let confidence;

    if (from >= 0 && to > from) {
      const timing = spanToTime(from, to);
      time = timing.time;
      confidence = timing.confidence;
      
      if (!time || (confidence && confidence < 0.6)) {
        tags.push('revisar_timing');
      }
    } else {
      tags.push('revisar_timing');
    }

    return {
      ...block,
      time,
      confidence,
      speaker: null,
      tags: tags.length > 0 ? tags : undefined
    };
  });
}

// Función para aplicar diarización a los bloques (placeholder futuro)
function applyDiarizationToBlocks(blocks, diarization) {
  // Implementación futura cuando tengamos diarización
  return blocks;
}

module.exports = {
  alignBlocksWithSegments,
  applyDiarizationToBlocks
};
