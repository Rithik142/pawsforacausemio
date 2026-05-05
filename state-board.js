// State Board interactivity: filter pills + scroll reveal stagger
(function () {
  const pills = document.querySelectorAll('.sb-pill');
  const states = document.querySelectorAll('.sb-state');

  if (pills.length && states.length) {
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const filter = pill.dataset.filter;
        pills.forEach(p => {
          p.classList.toggle('is-active', p === pill);
          p.setAttribute('aria-selected', p === pill ? 'true' : 'false');
        });

        states.forEach((state, i) => {
          const match = filter === 'all' || state.dataset.state === filter;
          if (match) {
            state.classList.remove('is-hidden');
            state.style.animation = 'none';
            // re-trigger entrance
            void state.offsetWidth;
            state.style.animation = `pf-rise .7s cubic-bezier(.2,.8,.2,1) ${0.05 + i * 0.06}s forwards`;
            state.style.opacity = '0';
          } else {
            state.classList.add('is-hidden');
          }
        });
      });
    });
  }

  // Subtle parallax on hero glow
  const heroBg = document.querySelector('.sb-hero__bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroBg.style.transform = `translate3d(0, ${y * 0.15}px, 0)`;
    }, { passive: true });
  }

  // Tilt on chapter cards
  document.querySelectorAll('.sb-chapter').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-5px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();
