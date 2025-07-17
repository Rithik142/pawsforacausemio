window.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const burger = document.querySelector('.hamburger');
  const menu   = document.querySelector('nav .nav-list');
  burger.addEventListener('click', () => {
    menu.classList.toggle('show');
  });

  // Scroll-reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  document.querySelectorAll(
    '.hero-text, .hero-image, .pups h2, .card'
  ).forEach(el => observer.observe(el));
});
