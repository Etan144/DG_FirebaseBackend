// User icon SVG as a reusable function
export function getUserIcon(size = 36) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="18" fill="url(#usericon-gradient)"/>
    <defs>
      <linearGradient id="usericon-gradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stop-color="#1bd4f2"/>
        <stop offset="1" stop-color="#5cf0c7"/>
      </linearGradient>
    </defs>
    <circle cx="18" cy="14" r="6" fill="#03101a"/>
    <ellipse cx="18" cy="25" rx="9" ry="5" fill="#03101a"/>
  </svg>`;
}
