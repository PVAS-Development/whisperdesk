export const TIMESTAMP_REGEX = /^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/;

export function isVttTimestamp(line: string): boolean {
  return TIMESTAMP_REGEX.test(line.trim());
}

export function parseVttContent(content: string): Array<{ timestamp: string; text: string }> {
  const lines = content.split('\n').filter((line) => line.trim());
  const blocks: Array<{ timestamp: string; text: string }> = [];
  let currentTimestamp = '';
  let currentText = '';

  for (const line of lines) {
    if (line.startsWith('WEBVTT')) continue;

    if (isVttTimestamp(line)) {
      if (currentText.trim()) {
        blocks.push({ timestamp: currentTimestamp, text: currentText.trim() });
      }
      currentTimestamp = line.trim();
      currentText = '';
    } else if (line.trim()) {
      currentText += (currentText ? ' ' : '') + line.trim();
    }
  }

  if (currentText.trim()) {
    blocks.push({ timestamp: currentTimestamp, text: currentText.trim() });
  }

  return blocks;
}
