#!/usr/bin/env node
/**
 * Script to generate macOS .icns icon from SVG
 * Usage: node scripts/generate-icons.js
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

// Icon sizes needed for macOS .icns
const SIZES = [16, 32, 64, 128, 256, 512, 1024];

async function generateIcons() {
  console.log('🎨 Generating app icons...\n');

  // Create iconset directory
  if (!fs.existsSync(ICONSET_DIR)) {
    fs.mkdirSync(ICONSET_DIR, { recursive: true });
  }

  // Read SVG file
  const svgBuffer = fs.readFileSync(SVG_PATH);

  // Generate PNG files at various sizes
  for (const size of SIZES) {
    const filename1x = `icon_${size}x${size}.png`;
    const filename2x = `icon_${size/2}x${size/2}@2x.png`;

    // Generate 1x size
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONSET_DIR, filename1x));
    console.log(`  ✓ Generated ${filename1x}`);

    // Generate @2x size (for retina) - skip for 16px
    if (size >= 32) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(ICONSET_DIR, filename2x));
      console.log(`  ✓ Generated ${filename2x}`);
    }
  }

  // Also generate standard icon.png for electron-builder
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(BUILD_DIR, 'icon.png'));
  console.log(`  ✓ Generated icon.png (1024x1024)`);

  // Generate 512x512 PNG as well
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(BUILD_DIR, 'icon@2x.png'));

  console.log('\n📦 Creating .icns file...');

  // Use iconutil to create .icns from iconset
  try {
    execSync(`iconutil -c icns "${ICONSET_DIR}" -o "${path.join(BUILD_DIR, 'icon.icns')}"`, {
      stdio: 'inherit'
    });
    console.log('  ✓ Generated icon.icns\n');
  } catch (err) {
    console.error('  ✗ Failed to generate .icns file:', err.message);
    console.log('  ℹ You may need to manually create the .icns file on macOS\n');
  }

  // Cleanup iconset directory (optional - keep for debugging)
  // fs.rmSync(ICONSET_DIR, { recursive: true, force: true });

  console.log('✅ Icon generation complete!');
}

generateIcons().catch(console.error);
