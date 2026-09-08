import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

// 1. Standard SVG content
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="60%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />
  <path d="M 128 190 L 256 95 L 384 190" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />
  <text x="256" y="355" font-family="sans-serif" font-size="220" font-weight="900" fill="#ffffff" text-anchor="middle">भा</text>
  <circle cx="256" cy="410" r="14" fill="#7dd3fc" />
</svg>`;

// 2. Maskable SVG: full bleed solid/gradient background, content strictly inside 80% circle (safe-zone padding)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="60%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
  </defs>
  <!-- Full bleed background without border radius so android can mask into circle or squircle -->
  <rect width="512" height="512" fill="url(#bgGradM)" />
  <g transform="translate(51, 51) scale(0.8)">
    <path d="M 128 190 L 256 95 L 384 190" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" />
    <text x="256" y="355" font-family="sans-serif" font-size="220" font-weight="900" fill="#ffffff" text-anchor="middle">भा</text>
    <circle cx="256" cy="410" r="16" fill="#7dd3fc" />
  </g>
</svg>`;

// 3. Apple Touch Icon SVG: 180x180 square with no transparency or sharp corners (iOS adds corner rounding)
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="bgGradA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="60%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
  </defs>
  <rect width="180" height="180" fill="url(#bgGradA)" />
  <path d="M 45 68 L 90 34 L 135 68" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />
  <text x="90" y="125" font-family="sans-serif" font-size="78" font-weight="900" fill="#ffffff" text-anchor="middle">भा</text>
  <circle cx="90" cy="146" r="5" fill="#7dd3fc" />
</svg>`;

async function generate() {
  console.log('Generating PWA icons with Sharp...');

  // 192x192
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  
  // Also save icon-192.png for backwards compat
  fs.copyFileSync(path.join(publicDir, 'pwa-192x192.png'), path.join(publicDir, 'icon-192.png'));

  // 512x512
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // Also save icon-512.png for backwards compat
  fs.copyFileSync(path.join(publicDir, 'pwa-512x512.png'), path.join(publicDir, 'icon-512.png'));

  // 512x512 maskable (with safe zone)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // Apple Touch Icon 180x180
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Favicon 64x64
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('Successfully generated all PWA icons!');
}

generate().catch(console.error);
