#!/usr/bin/env node
/**
 * Generate macOS tray template icons for WhisperDesk.
 * Template images must be black with alpha channel - macOS handles light/dark mode automatically.
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, '..', 'build');

// Simple microphone + sound wave SVG in black (template image)
const svgIcon = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Microphone body -->
  <rect x="12" y="4" width="8" height="14" rx="4" fill="black"/>
  <!-- Microphone stand arc -->
  <path d="M9 16a7 7 0 0 0 14 0" stroke="black" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Microphone stand -->
  <line x1="16" y1="23" x2="16" y2="27" stroke="black" stroke-width="2" stroke-linecap="round"/>
  <!-- Base -->
  <line x1="12" y1="27" x2="20" y2="27" stroke="black" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

async function generate() {
  // 16x16 (1x)
  await sharp(Buffer.from(svgIcon))
    .resize(16, 16)
    .png()
    .toFile(path.join(buildDir, 'tray-iconTemplate.png'));

  // 32x32 (2x Retina)
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(path.join(buildDir, 'tray-iconTemplate@2x.png'));

  console.log('Tray icons generated in build/');
}

generate().catch(console.error);
