
function updateLandingHeroImage() {
  const heroImage = document.getElementById('hero-image');
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    heroImage.src = 'icons/hero_dark.png';
  } else {
    heroImage.src = 'icons/hero.png';
  }
}

function updateRegisterHeroImage() {
  const heroImage = document.getElementById('hero-image');
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    heroImage.src = 'icons/r_hero_dark.png';
  } else {
    heroImage.src = 'icons/r_hero_light.png';
  }
}


// Initial update
updateLandingHeroImage();

// Correct way to listen for changes (using addEventListener)
const colorSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
colorSchemeMediaQuery.addEventListener('change', updateLandingHeroImage);