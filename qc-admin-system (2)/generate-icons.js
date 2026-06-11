import fs from 'fs';

// A 1x1 transparent PNG, we can just use a simple base64 encoded png for now, or just make a small script
function createPNG(size) {
  // We'll just write a basic SVG and convert it? No, PWA supports SVG icons potentially, or we need PNG.
  // Actually, passing an SVG to PWA manifest is allowed in modern browsers:
  // type: "image/svg+xml"
}

fs.writeFileSync('public/pwa-192x192.svg', `
<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#2563eb"/>
  <text x="96" y="105" font-family="sans-serif" font-size="64" fill="#ffffff" text-anchor="middle">QC</text>
</svg>
`);

fs.writeFileSync('public/pwa-512x512.svg', `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb"/>
  <text x="256" y="280" font-family="sans-serif" font-size="170" fill="#ffffff" text-anchor="middle">QC</text>
</svg>
`);
