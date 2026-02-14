import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export function saveTempAudio(buffer: Buffer): string {
  const tempPath = path.join(app.getPath('temp'), `whisperdesk_htt_${crypto.randomUUID()}.webm`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

export function cleanupTempAudio(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Failed to cleanup temp audio:', err);
  }
}
