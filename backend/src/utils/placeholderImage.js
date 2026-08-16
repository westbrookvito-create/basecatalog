// Neutral-tone SVG monogram, used as a stand-in product photo until a real
// one is uploaded — avoids depending on an external image host.
const TONES = ['#e7e2da', '#ded6c8', '#e3e3e0', '#d9d2c6', '#e6ddd1', '#dfe0e2'];

export function monogramPlaceholder(letter, bg = TONES[Math.floor(Math.random() * TONES.length)]) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='1200'>
    <rect width='100%' height='100%' fill='${bg}'/>
    <text x='50%' y='53%' font-family='Georgia, serif' font-size='120' fill='#00000022'
      text-anchor='middle' dominant-baseline='middle'>${letter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
