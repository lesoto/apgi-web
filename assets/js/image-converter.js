// Image converter for APGI Website
// This would be used in a build process

const imageFiles = [
  'APGI-Experiments-1.png',
  'APGI-Experiments-2.png',
  'APGI-Software-System.png',
  'App-Appendix.png',
  'App-Explorer.png'
];

// Generate simple img elements
function generateImageElement(src, alt, className = '') {
  return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy">`;
}

// Export for use in HTML updates
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateImageElement, imageFiles };
}
