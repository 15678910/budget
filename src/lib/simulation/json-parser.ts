// ─── Extract JSON from Gemini response (may be wrapped in ```json blocks) ───
export function extractJSON(text: string): string {
  // Try to extract from ```json ... ``` blocks
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return cleanJSON(jsonBlockMatch[1].trim());
  }
  // Try to extract from ``` ... ``` blocks
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return cleanJSON(codeBlockMatch[1].trim());
  }
  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return cleanJSON(jsonMatch[0].trim());
  }
  return cleanJSON(text.trim());
}

// ─── Clean common JSON issues from Gemini output ───
export function cleanJSON(json: string): string {
  let cleaned = json;
  // Remove BOM and zero-width characters
  cleaned = cleaned.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '');
  // Remove single-line comments (// ...)
  cleaned = cleaned.replace(/\/\/[^\n]*/g, '');
  // Remove multi-line comments (/* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  // Remove control characters except \n, \r, \t
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  // Fix unescaped newlines inside JSON strings
  cleaned = cleaned.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
  return cleaned;
}
