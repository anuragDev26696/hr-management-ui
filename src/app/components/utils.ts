export function generateInitialSVG(letter: string, size = 100): string {
    const angle = Math.floor(Math.random() * 360);
    const color1 = getRandomColor();
    const color2 = getRandomColor();
  
    // 👇 Make the gradient ID unique (safe for list rendering)
    const uniqueId = `grad-${Math.random().toString(36).substring(2, 10)}`;
  
    const textColor = getTextColorBasedOnBg(color1);
  
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="${uniqueId}" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(${angle})">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${uniqueId})"/>
      <text x="50%" y="55%" font-size="${size / 2}" font-family="Arial, sans-serif" fill="${textColor}" dominant-baseline="middle" text-anchor="middle">
        ${letter.toUpperCase()}
      </text>
    </svg>`;
  
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
// Get appropriate text color (white/black) based on background color brightness
function getTextColorBasedOnBg(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#fff';
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 125 ? '#000' : '#fff';
}
  
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
}
  