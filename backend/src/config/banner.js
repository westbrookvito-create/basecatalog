// Full-width photo banner shown at the top of the main (Главное) screen.
// Set `image` to a real photo URL (or data URI) when you have one, and
// `active: true`. Set `active: false` to hide the banner entirely.
// Placeholder below demonstrates the layout until a real photo is added.
function placeholderBanner() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='600'>
    <rect width='100%' height='100%' fill='#ece7df'/>
    <text x='50%' y='50%' font-family='Georgia, serif' font-size='40' fill='#00000030'
      text-anchor='middle' dominant-baseline='middle' letter-spacing='6'>NEW ARRIVALS</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const BANNER = {
  active: true,
  image: placeholderBanner(),
};
