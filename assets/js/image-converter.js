// Image converter for creating WebP fallbacks
// This would be used in a build process

const imageFiles = [
  'APGI-Experiments-1.png',
  'APGI-Experiments-2.png',
  'APGI-Software-System.png',
  'App-Appendix.png',
  'App-Explorer.png'
];

// Generate picture elements with WebP fallbacks
function generatePictureElement(src, alt, className = '') {
  const webpSrc = src.replace(/\.(png|jpg|jpeg)$/, '.webp');
  const baseName = src.split('/').pop().split('.')[0];

  return `
<picture class="${className}">
    <source srcset="${webpSrc}" type="image/webp">
    <source srcset="${src}" type="image/${src.endsWith('.png') ? 'png' : 'jpeg'}">
    <img src="${src}" alt="${alt}" loading="lazy">
</picture>`;
}

// Export for use in HTML updates
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generatePictureElement, imageFiles };
}
