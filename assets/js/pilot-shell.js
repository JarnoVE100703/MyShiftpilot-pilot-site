(function () {
  'use strict';

  const progress = document.getElementById('scroll-progress');
  if (progress) {
    const updateProgress = () => {
      const root = document.documentElement;
      const range = Math.max(1, root.scrollHeight - root.clientHeight);
      const position = window.scrollY || root.scrollTop || document.body.scrollTop || 0;
      progress.style.width = `${Math.min(100, (position / range) * 100)}%`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  const revealTargets = document.querySelectorAll('.reveal');
  if (revealTargets.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach((element) => observer.observe(element));
  }

  document.querySelectorAll('body.pilot-page .benefit, body.pilot-page .process-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--pilot-glow-x', `${event.clientX - bounds.left}px`);
      card.style.setProperty('--pilot-glow-y', `${event.clientY - bounds.top}px`);
    });
  });

  const menuButton = document.getElementById('menu-btn');
  const panel = document.getElementById('nav-panel');
  const menuText = menuButton && menuButton.querySelector('.menu-txt');
  if (!menuButton || !panel || !menuText) return;

  function setMenu(open, returnFocus) {
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Sluit menu' : 'Open menu');
    menuText.textContent = open ? 'Sluit' : 'Menu';
    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', (event) => {
    if (!panel.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
})();
