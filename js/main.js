// ENVO website — light interactions

document.addEventListener('DOMContentLoaded', () => {
    // Sticky header shadow on scroll
    const header = document.querySelector('.site-header');
    const onScroll = () => {
        if (window.scrollY > 4) header.style.boxShadow = '0 2px 16px rgba(15,23,42,.06)';
        else header.style.boxShadow = 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile nav toggle (with backdrop overlay)
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (navToggle && mainNav) {
        const backdrop = document.createElement('div');
        backdrop.className = 'nav-backdrop';
        document.body.appendChild(backdrop);

        const closeNav = () => {
            mainNav.classList.remove('is-open');
            navToggle.classList.remove('is-open');
            backdrop.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };
        navToggle.addEventListener('click', () => {
            const open = mainNav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open', open);
            backdrop.classList.toggle('is-open', open);
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.body.style.overflow = open ? 'hidden' : '';
        });
        backdrop.addEventListener('click', closeNav);
        mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    }

    // Back-to-top floating button (auto-injected on every page)
    const backTop = document.createElement('button');
    backTop.className = 'back-to-top';
    backTop.setAttribute('aria-label', 'Back to top');
    backTop.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(backTop);
    const onScrollBackTop = () => {
        backTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScrollBackTop, { passive: true });
    onScrollBackTop();
    backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Animated counter for stat numbers (Hero + Featured Project)
    const animateCounter = (el) => {
        const target = el.textContent.trim();
        const match = target.match(/^(\d+)(.*)$/);
        if (!match) return;
        const num = parseInt(match[1], 10);
        const suffix = match[2];
        const duration = 1200;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(num * eased) + suffix;
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    animateCounter(e.target);
                    counterObserver.unobserve(e.target);
                }
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.hero-stats strong, .fp-metrics strong').forEach((el) => counterObserver.observe(el));
    }

    // Reveal-on-scroll for cards and section heads
    const revealEls = document.querySelectorAll('.category-card, .industry-card, .why-item, .resource-card, .featured-project, .section-head');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
        revealEls.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
    }

    // Newsletter stub
    const form = document.querySelector('.newsletter');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input[type="email"]');
            if (input.value) {
                input.value = '';
                input.placeholder = 'Thanks — we\'ll be in touch!';
                setTimeout(() => { input.placeholder = 'Enter your email address'; }, 3000);
            }
        });
    }
});
