#!/usr/bin/env npx tsx
/**
 * Script to generate macOS .icns icon from SVG
 * Usage: npx tsx scripts/generate-icons.ts
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, '../build');
const ICONSET_DIR = path.join(BUILD_DIR, 'icon.iconset');
const SVG_PATH = path.join(BUILD_DIR, 'icon.svg');

const SIZES = [16, 32, 64, 128, 256, 512, 1024] as const;

async function generateIcons(): Promise<void> {
  console.log('🎨 Generating app icons...\n');

  if (!fs.existsSync(ICONSET_DIR)) {
    fs.mkdirSync(ICONSET_DIR, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  for (const size of SIZES) {
    const filename1x = `icon_${size}x${size}.png`;
    const filename2x = `icon_${size / 2}x${size / 2}@2x.png`;

    await sharp(svgBuffer).resize(size, size).png().toFile(path.join(ICONSET_DIR, filename1x));
    console.log(`  ✓ Generated ${filename1x}`);

    if (size >= 32) {
      await sharp(svgBuffer).resize(size, size).png().toFile(path.join(ICONSET_DIR, filename2x));
      console.log(`  ✓ Generated ${filename2x}`);
    }
  }

  await sharp(svgBuffer).resize(1024, 1024).png().toFile(path.join(BUILD_DIR, 'icon.png'));
  console.log(`  ✓ Generated icon.png (1024x1024)`);

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(BUILD_DIR, 'icon@2x.png'));
  console.log('  ✓ Generated icon@2x.png (512x512)');

  console.log('\n📦 Creating .icns file...');

  try {
    execSync(`iconutil -c icns "${ICONSET_DIR}" -o "${path.join(BUILD_DIR, 'icon.icns')}"`, {
      stdio: 'inherit',
    });
    console.log('  ✓ Generated icon.icns\n');
  } catch (err) {
    const error = err as Error;
    console.error('  ✗ Failed to generate .icns file:', error.message);
    console.log('  ℹ You may need to manually create the .icns file on macOS\n');
  }

  console.log('✅ Icon generation complete!');
}

generateIcons().catch(console.error);
