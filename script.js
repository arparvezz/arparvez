const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navItems = navLinks ? Array.from(navLinks.querySelectorAll('a')) : [];
const sections = navItems
  .map((item) => document.querySelector(item.getAttribute('href')))
  .filter(Boolean);

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navItems.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) {
      return;
    }

    event.preventDefault();
    const offset = 20;
    const position = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top: position,
      behavior: 'smooth',
    });
  });
});

const setActiveNav = () => {
  if (!sections.length) {
    return;
  }

  const scrollPosition = window.scrollY + 120;
  let activeIndex = 0;

  sections.forEach((section, index) => {
    if (scrollPosition >= section.offsetTop) {
      activeIndex = index;
    }
  });

  navItems.forEach((item, index) => {
    item.classList.toggle('active', index === activeIndex);
  });
};

window.addEventListener('scroll', setActiveNav);
window.addEventListener('load', setActiveNav);
