const heroImage = document.getElementById('hero-image');

function updateHeroImage() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    heroImage.src = 'icons/hero_dark.png';
  } else {
    heroImage.src = 'icons/hero.png';
  }
}

// Initial update
updateHeroImage();

// Correct way to listen for changes (using addEventListener)
const colorSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
colorSchemeMediaQuery.addEventListener('change', updateHeroImage);