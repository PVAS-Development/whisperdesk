export interface TranscriptSegment {
  id: string;
  index: number;
  startSec: number;
  endSec: number;
  timestamp: string;
  text: string;
}

const TIMESTAMP_PATTERN =
  /^(?<start>\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(?<end>\d{2}:\d{2}:\d{2}\.\d{3})/;

export function timestampToSeconds(timestamp: string): number {
  const [hours = '0', minutes = '0', seconds = '0'] = timestamp.split(':');
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  const parsedSeconds = Number(seconds);

  if (![parsedHours, parsedMinutes, parsedSeconds].every(Number.isFinite)) {
    return 0;
  }

  return parsedHours * 3600 + parsedMinutes * 60 + parsedSeconds;
}

export function parseTranscriptSegments(transcript: string): TranscriptSegment[] {
  if (!transcript.trim()) {
    return [];
  }

  const lines = transcript.split(/\r?\n/);
  const segments: TranscriptSegment[] = [];
  let currentTimestamp = '';
  let currentStartSec = 0;
  let currentEndSec = 0;
  let currentText: string[] = [];

  const flushSegment = (): void => {
    const text = currentText.join(' ').replace(/\s+/g, ' ').trim();
    if (!currentTimestamp || !text) {
      currentText = [];
      return;
    }

    const index = segments.length;
    segments.push({
      id: `segment-${index}-${currentStartSec.toFixed(3)}`,
      index,
      startSec: currentStartSec,
      endSec: currentEndSec,
      timestamp: currentTimestamp,
      text,
    });
    currentText = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === 'WEBVTT' || /^NOTE\b/.test(line)) {
      continue;
    }

    const match = line.match(TIMESTAMP_PATTERN);
    if (match?.groups) {
      flushSegment();
      currentTimestamp = line;
      currentStartSec = timestampToSeconds(match.groups.start ?? '00:00:00.000');
      currentEndSec = timestampToSeconds(match.groups.end ?? '00:00:00.000');
      continue;
    }

    if (currentTimestamp) {
      currentText.push(line);
    }
  }

  flushSegment();
  return segments;
}
