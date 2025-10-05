export const isJSONStructure = (content: any): boolean => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return false;
  }

  const hasDocumentStructure =
    content.title !== undefined ||
    content.sections !== undefined ||
    content.key_concepts !== undefined ||
    content.summary !== undefined ||
    content.blocks !== undefined;

  const hasRawContent = content.raw_content && typeof content.raw_content === 'string';
  const isSection = content.type !== undefined && (content.content !== undefined || content.term !== undefined);

  console.log('isJSONStructure check - hasDocumentStructure:', hasDocumentStructure, 'hasRawContent:', hasRawContent, 'isSection:', isSection);

  return hasDocumentStructure || hasRawContent || isSection;
};

export const parseRawContent = (content: any): any => {
  if (!content || typeof content !== 'object') return content;

  if (content.raw_content && typeof content.raw_content === 'string') {
    try {
      const jsonMatch = content.raw_content.match(/```json\n([\s\S]*?)\n```/) || content.raw_content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        console.log('Parsing JSON from raw_content:', jsonString.substring(0, 100) + '...');
        return JSON.parse(jsonString);
      } else {
        console.log('Parsing raw_content directly');
        return JSON.parse(content.raw_content);
      }
    } catch (error) {
      console.error('Error parsing JSON from raw_content:', error);
      return content;
    }
  }

  return content;
};