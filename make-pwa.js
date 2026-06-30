const fs = require('fs');

const generateIcon = (size, filename) => {
  // A simple blue circle SVG converted to PNG is harder in pure Node without canvas.
  // Instead, I'll just write a basic SVG and we can use the SVG as the icon in the manifest?
  // Wait, most OS prefer PNG. I can just provide a base64 string for a generic PNG or
  // since this is just an icon, I'll use a tiny transparent 1x1 png if I can't generate it,
  // but better to write a small SVG file and convert it, or just use SVG directly.
  // Many modern browsers support SVG icons in manifest.
};

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb" rx="100"/>
  <path d="M256 120 L380 380 L132 380 Z" fill="#ffffff"/>
</svg>`;

fs.writeFileSync('./public/icon.svg', svgContent);

const manifestContent = {
  name: "Antrian Pasien Antriva",
  short_name: "Antriva",
  description: "Aplikasi Pendaftaran Antrian Pasien",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#2563eb",
  icons: [
    {
      src: "/icon.svg",
      sizes: "192x192 512x512",
      type: "image/svg+xml",
      purpose: "any maskable"
    }
  ]
};

fs.writeFileSync('./public/manifest.json', JSON.stringify(manifestContent, null, 2));

const swContent = `
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
self.addEventListener('fetch', (event) => {
  // Pass through fetch
});
`;
fs.writeFileSync('./public/sw.js', swContent);

console.log('PWA files generated successfully!');
