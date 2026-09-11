/**
 * Splits document text into overlapping semantic chunks safely without infinite loops.
 */
export function chunkText(
  fullText: string,
  chunkSize = 800,
  chunkOverlap = 150
): string[] {
  const chunks: string[] = [];
  if (!fullText || fullText.trim().length === 0) return chunks;

  const normalized = fullText.replace(/\r\n/g, "\n").replace(/\t/g, " ");
  let start = 0;

  while (start < normalized.length) {
    let end = start + chunkSize;
    if (end >= normalized.length) {
      const finalChunk = normalized.substring(start).trim();
      if (finalChunk.length > 0) chunks.push(finalChunk);
      break;
    }

    // Try to break at a clean sentence or newline boundary near the end
    const searchStart = Math.max(start + Math.floor(chunkSize * 0.7), end - 100);
    const nextNewline = normalized.indexOf("\n", searchStart);
    const nextPeriod = normalized.indexOf(". ", searchStart);

    if (nextNewline !== -1 && nextNewline <= end + 50) {
      end = nextNewline + 1;
    } else if (nextPeriod !== -1 && nextPeriod <= end + 50) {
      end = nextPeriod + 2;
    }

    const chunkContent = normalized.substring(start, end).trim();
    if (chunkContent.length > 0) {
      chunks.push(chunkContent);
    }

    // Strictly ensure start advances to prevent any possible infinite loop
    const nextStart = end - chunkOverlap;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}
