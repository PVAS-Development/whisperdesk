import { describe, expect, it } from 'vitest';
import { parseTranscriptSegments, timestampToSeconds } from '../transcriptSegments';

describe('transcriptSegments', () => {
  it('converts timestamps to seconds', () => {
    expect(timestampToSeconds('00:00:12.500')).toBe(12.5);
    expect(timestampToSeconds('01:02:03.250')).toBe(3723.25);
  });

  it('parses valid VTT with multiple cues', () => {
    const segments = parseTranscriptSegments(`WEBVTT

00:00:01.000 --> 00:00:03.500
Hello there

00:00:04.000 --> 00:00:05.000
General Kenobi`);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({
      index: 0,
      startSec: 1,
      endSec: 3.5,
      timestamp: '00:00:01.000 --> 00:00:03.500',
      text: 'Hello there',
    });
    expect(segments[1]?.text).toBe('General Kenobi');
  });

  it('joins multi-line cue text', () => {
    const segments = parseTranscriptSegments(`WEBVTT

00:00:01.000 --> 00:00:04.000
First line
second line`);

    expect(segments[0]?.text).toBe('First line second line');
  });

  it('returns no segments for empty or invalid transcript text', () => {
    expect(parseTranscriptSegments('')).toEqual([]);
    expect(parseTranscriptSegments('Plain transcript without timestamps')).toEqual([]);
  });
});
