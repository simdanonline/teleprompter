import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');
const svgBuffer = readFileSync(join(assetsDir, 'logo.svg'));

async function generate() {
  // Main icon (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(join(assetsDir, 'icon.png'));
  console.log('Generated icon.png (1024x1024)');

  // Adaptive icon for Android (1024x1024, same as main)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(join(assetsDir, 'adaptive-icon.png'));
  console.log('Generated adaptive-icon.png (1024x1024)');

  // Favicon (48x48)
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(join(assetsDir, 'favicon.png'));
  console.log('Generated favicon.png (48x48)');

  // Splash icon (200x200)
  await sharp(svgBuffer)
    .resize(200, 200)
    .png()
    .toFile(join(assetsDir, 'splash-icon.png'));
  console.log('Generated splash-icon.png (200x200)');

  console.log('\nAll icons generated successfully!');
}

generate().catch(console.error);
