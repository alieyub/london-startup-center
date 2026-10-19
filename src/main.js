import './fonts.css';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------------- Smooth scroll ---------------- */
let lenis;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    setMenu(false, { restoreFocus: false });
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
    if (target !== 0) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
});

/* ---------------- Small utilities ---------------- */
$('.js-year').textContent = new Date().getFullYear();

const clock = $('.js-clock');
const tick = () => {
  clock.textContent = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/London',
  }).format(new Date());
};
tick();
setInterval(tick, 1000);

/* member logos */
// intrinsic widths of the 92px-tall logo files, so tiles reserve space before load
const logoWidths = [246, 374, 490, 402, 320, 714, 395, 173, 546, 344, 191, 249, 531, 458, 521, 213, 1179];
const members = [
  'AI Tech Builders', 'Segmentify', 'Volt Lines', 'Madlen', 'Pardon', 'Champs', 'Boatsy', 'BREN', 'CompeteMind',
  'GridEye', 'Vinter', 'Antrim Partners', 'Akerio.ai', 'Inceptra AI', 'Metalchemy', 'CureCraft', 'Global Scale Ventures',
].map((name, i) => ({ name, src: `/logos/m${i + 1}.webp`, w: logoWidths[i] }));
const fillLogos = (el, list) => {
  const tiles = (hidden) => list.map(({ name, src, w }) =>
    `<li class="logo-tile"${hidden ? ' aria-hidden="true"' : ''}><img src="${src}" alt="${hidden ? '' : name}" width="${w}" height="92" loading="lazy" decoding="async" /></li>`).join('');
  // second copy keeps the marquee seamless; hidden from assistive tech
  el.innerHTML = tiles(false) + tiles(true);
};
fillLogos($('.js-logos-a'), members.slice(0, 9));
fillLogos($('.js-logos-b'), members.slice(9));

/* ---------------- Nav ---------------- */
const nav = $('.nav');
let lastY = 0;
const onScroll = (y) => {
  nav.classList.toggle('is-scrolled', y > 40);
  const menuOpen = document.body.classList.contains('menu-open');
  nav.classList.toggle('is-hidden', !menuOpen && y > 600 && y > lastY);
  lastY = y;
};
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

const burger = $('.nav__burger');
const menu = $('.menu');
function setMenu(open, { restoreFocus = true } = {}) {
  const wasOpen = document.body.classList.contains('menu-open');
  if (open === wasOpen) return;
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.setAttribute('aria-hidden', String(!open));
  if (open) {
    lenis?.stop();
    setTimeout(() => $('a', menu)?.focus(), 50);
  } else {
    lenis?.start();
    if (restoreFocus) burger.focus();
  }
}
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* progress bar */
gsap.to('.progress', {
  scaleX: 1, ease: 'none',
  scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
});

/* ---------------- Cursor ---------------- */
if (finePointer) {
  const cursor = $('.cursor');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const media = !!e.target.closest('.kinetic li');
    cursor.classList.toggle('is-media', media);
    cursor.classList.toggle('is-hover', !media && !!e.target.closest('a, button'));
  });
}

/* ---------------- Magnetic buttons ---------------- */
if (finePointer) {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------------- Spotlight + tilt ---------------- */
$$('[data-spot], [data-tilt]').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});
if (finePointer && !reduced) {
  $$('[data-tilt]').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 12); rx(-py * 12);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ---------------- Kinetic event list (floating image) ---------------- */
const float = $('.kinetic__float');
const floatImg = $('img', float);
if (finePointer) {
  const fx = gsap.quickTo(float, 'left', { duration: 0.5, ease: 'power3' });
  const fy = gsap.quickTo(float, 'top', { duration: 0.5, ease: 'power3' });
  $$('.kinetic li').forEach((li) => {
    li.addEventListener('pointerenter', () => { floatImg.src = li.dataset.img; float.classList.add('is-on'); });
    li.addEventListener('pointerleave', () => float.classList.remove('is-on'));
    li.addEventListener('pointermove', (e) => { fx(e.clientX + 180); fy(e.clientY); });
  });
}

/* hero logo 3D tilt with pointer */
if (finePointer && !reduced) {
  const inner = $('.hero__logo3d-inner');
  const rx = gsap.quickTo(inner, 'rotationX', { duration: 1.2, ease: 'power3' });
  const ry = gsap.quickTo(inner, 'rotationY', { duration: 1.2, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    ry((e.clientX / window.innerWidth - 0.5) * 30);
    rx(-(e.clientY / window.innerHeight - 0.5) * 24);
  });
}

/* ---------------- Line splitting for display headings ---------------- */
$$('.reveal-lines').forEach((el) => {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  // keep a real space between lines so the accessible name doesn't run words together
  el.innerHTML = parts.map((p) => `<span class="rl"><span>${p.trim()}</span></span>`).join(' ');
});

/* ---------------- Intro ---------------- */
if (!reduced) {
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__title .line > span', { yPercent: 110, duration: 1.2, stagger: 0.08 }, 0.05)
    .from('.hero__meta > *', { y: 20, opacity: 0, duration: 0.9, stagger: 0.06 }, 0.2)
    .from('.hero__lead, .hero__ctas > *', { y: 24, opacity: 0, duration: 1, stagger: 0.06 }, 0.35)
    .from('.hero__logo3d img', { opacity: 0, scale: 0.85, duration: 1.8 }, 0.2);
}

/* ---------------- Scroll animations ---------------- */
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // headings
  $$('.reveal-lines').forEach((el) => {
    gsap.from($$('.rl > span', el), {
      yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // generic fade-up groups
  const groups = [
    ['.pillars', '.pillar'],
    ['.benefits__grid', '.benefit'],
    ['.tiers', '.tier'],
    ['.services', '.service'],
    ['.kinetic', 'li'],
    ['.contact__grid', '.ccard'],
    ['.timeline', '.step'],
  ];
  groups.forEach(([wrap, item]) => {
    const w = $(wrap);
    if (!w) return;
    gsap.from($$(item, w), {
      y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: w, start: 'top 82%' },
    });
  });

  $$('.section .lead, .chips, .events__foot p').forEach((el) => {
    gsap.from(el.matches('.chips') ? el.children : el, {
      y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // parallax images
  $$('[data-parallax] img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  gsap.from('.about__photo', {
    clipPath: 'inset(20% 20% 20% 20% round 22px)', duration: 1.6, ease: 'expo.out',
    scrollTrigger: { trigger: '.about__photo', start: 'top 85%' },
  });

  // hero parallax out
  gsap.to('.hero__inner', {
    yPercent: -18, opacity: 0.2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__logo3d', {
    yPercent: -30, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // ticker skew with velocity
  const ticker = $('.ticker__track');
  ScrollTrigger.create({
    onUpdate: (s) => {
      const v = gsap.utils.clamp(-12, 12, s.getVelocity() / 200);
      gsap.to(ticker, { skewX: -v, duration: 0.4, overwrite: true });
    },
  });

  // programs timeline progress
  gsap.to('.timeline__line span', {
    scaleX: 1, scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 75%', end: 'bottom 60%', scrub: true },
  });

  // contact title
  gsap.from('.contact__title .line > span', {
    yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.contact', start: 'top 70%' },
  });

  // footer mega letters
  gsap.from('.footer__mega span', {
    yPercent: 60, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.footer', start: 'top 85%' },
  });
});

mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
  // membership cards scale as they stack
  const plans = $$('.plan');
  plans.forEach((plan, i) => {
    if (i === plans.length - 1) return;
    gsap.to(plan, {
      scale: 0.94 - (plans.length - 2 - i) * 0.02, filter: 'brightness(0.85)', ease: 'none',
      scrollTrigger: { trigger: plans[i + 1], start: 'top 85%', end: 'top 30%', scrub: true },
    });
  });
});

// horizontal club scroll — desktop + tablet
mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
  const track = $('.club__track');
  const distance = () => track.scrollWidth - window.innerWidth;
  const tween = gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: {
      trigger: '.club', start: 'top top', end: () => `+=${distance()}`,
      pin: '.club__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });
  $$('.club__card img').forEach((img) => {
    gsap.to(img, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
    });
  });
  gsap.from('.club__stat', {
    scale: 0.4, rotate: -30, ease: 'none',
    scrollTrigger: { trigger: '.club__stat', containerAnimation: tween, start: 'left right', end: 'center center', scrub: true },
  });
});

// mobile: club becomes a swipeable rail
mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
  const pin = $('.club__pin');
  pin.style.height = 'auto';
  pin.style.padding = '96px 0';
  pin.style.overflowX = 'auto';
  pin.style.scrollSnapType = 'x mandatory';
  pin.style.scrollPaddingInline = '16px';
  $('.club__track').style.width = 'max-content';
  $$('.club__track > *').forEach((c) => { c.style.scrollSnapAlign = 'start'; });
  $$('.club__card').forEach((c) => { c.style.height = '62vh'; });
  return () => { pin.removeAttribute('style'); $('.club__track').style.width = ''; };
});

/* active link */
$$('.nav__links a').forEach((link) => {
  const sec = $(link.getAttribute('href'));
  if (!sec) return;
  ScrollTrigger.create({
    trigger: sec, start: 'top 50%', end: 'bottom 50%',
    onToggle: (self) => link.classList.toggle('is-active', self.isActive),
  });
});

window.addEventListener('load', () => ScrollTrigger.refresh());
