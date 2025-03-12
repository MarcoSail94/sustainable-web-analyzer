/**
 * utils/animations.js - Modulo per animazioni caricate in modo lazy
 */

/**
 * Inizializza le animazioni e il lazy loading
 */
export function initAnimations() {
  // Seleziona tutti gli elementi con classi di animazione
  const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-slide-up, .animate-slide-right');

  // Configura l'Intersection Observer per avviare le animazioni quando gli elementi entrano nel viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Attiva l'animazione
        entry.target.classList.add('active');
        // Smetti di osservare l'elemento dopo che è stato animato
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null, // viewport
    threshold: 0.1, // 10% dell'elemento visibile
    rootMargin: '0px'
  });

  // Osserva ogni elemento animato
  animatedElements.forEach(element => {
    observer.observe(element);
  });

  // Configura anche il lazy loading delle immagini
  lazyLoadImages();
}

/**
 * Implementa il lazy loading delle immagini
 */
function lazyLoadImages() {
  // Seleziona tutte le immagini con attributo data-src
  const lazyImages = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback per browser che non supportano IntersectionObserver
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// Esporta le funzioni
export { lazyLoadImages };