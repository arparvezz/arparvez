// ============================================
// Loader
// ============================================
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('hidden');
    // Trigger hero animations after loader
    document.querySelectorAll('.hero .fade-up').forEach(el => {
      el.classList.add('visible');
    });
  }, 600);
});

// ============================================
// Navbar - Scroll behavior
// ============================================
const navbar = document.getElementById('navbar');
let lastScrollY = 0;
let ticking = false;

function updateNavbar() {
  const currentScrollY = window.scrollY;

  // Add/remove scrolled class
  if (currentScrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Hide/show on scroll direction
  if (currentScrollY > lastScrollY && currentScrollY > 200) {
    navbar.classList.add('hidden');
  } else {
    navbar.classList.remove('hidden');
  }

  lastScrollY = currentScrollY;
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateNavbar);
    ticking = true;
  }
});

// ============================================
// Mobile Navigation
// ============================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navLinks.classList.toggle('active');
  document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// Close mobile nav on outside click
document.addEventListener('click', (e) => {
  if (navLinks.classList.contains('active') &&
      !navLinks.contains(e.target) &&
      !navToggle.contains(e.target)) {
    navToggle.classList.remove('active');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ============================================
// Smooth scroll for anchor links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const navHeight = navbar.offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ============================================
// Scroll Reveal Animations
// ============================================
const observerOptions = {
  root: null,
  rootMargin: '0px 0px -80px 0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all fade-up elements except hero (hero is handled by loader)
document.querySelectorAll('.fade-up:not(.hero .fade-up)').forEach(el => {
  observer.observe(el);
});

// ============================================
// Active nav link on scroll
// ============================================
const sections = document.querySelectorAll('section[id]');

function highlightNav() {
  const scrollY = window.scrollY + 100;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
        link.classList.remove('active');
      });
      const activeLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  });
}

window.addEventListener('scroll', highlightNav);

// ============================================
// Rolling-digit counters (stats)
// ============================================
document.querySelectorAll('.odometer').forEach(el => {
  const target = String(el.dataset.to || el.textContent);
  el.setAttribute('aria-label', target);
  el.textContent = '';
  Array.from(target).forEach((d, i) => {
    const col = document.createElement('span');
    col.className = 'odo-col';
    col.setAttribute('aria-hidden', 'true');
    col.dataset.digit = d;
    col.style.transitionDelay = `${i * 120}ms`;
    for (let n = 0; n <= 9; n++) {
      const s = document.createElement('span');
      s.textContent = n;
      col.appendChild(s);
    }
    el.appendChild(col);
  });
});

const odoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.odo-col').forEach(col => {
      col.style.transform = `translateY(-${Number(col.dataset.digit)}em)`;
    });
    odoObserver.unobserve(entry.target);
  });
}, { threshold: 0.3 });
document.querySelectorAll('.odometer').forEach(el => odoObserver.observe(el));

// ============================================
// FAQ — keep one answer open at a time
// ============================================
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-item').forEach(other => {
      if (other !== item) other.open = false;
    });
  });
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============================================
// Experience tabs (keyboard accessible)
// ============================================
(() => {
  const tabs = Array.from(document.querySelectorAll('.jobs-tab'));
  const list = document.querySelector('.jobs-tabs');
  if (!tabs.length || !list) return;
  const activate = (i, focus = false) => {
    tabs.forEach((t, idx) => {
      const on = idx === i;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    const t = tabs[i];
    list.style.setProperty('--ty', t.offsetTop + 'px');
    list.style.setProperty('--tx', t.offsetLeft + 'px');
    list.style.setProperty('--tw', t.offsetWidth + 'px');
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(i));
    t.addEventListener('keydown', (e) => {
      const next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      activate((i + next + tabs.length) % tabs.length, true);
    });
  });
  const current = () => Math.max(0, tabs.findIndex(t => t.classList.contains('active')));
  window.addEventListener('resize', () => activate(current()));
  activate(0);
})();
