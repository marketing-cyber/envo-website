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

    // Free Layout Design — top promo bar (dismissible)
    const promoDismissed = localStorage.getItem('envo-promo-dismissed') === '1';
    if (!promoDismissed) {
        const bar = document.createElement('div');
        bar.className = 'promo-bar';
        bar.innerHTML = `
            <div class="container promo-inner">
                <span class="promo-text"><span class="promo-icon">✦</span> <strong>Free Layout Design</strong> — Send us your sign sketch &amp; sizes, we'll spec the LEDs and drivers for you.</span>
                <a href="${window.location.pathname.includes('/products/') ? '../free-layout-design.html' : 'free-layout-design.html'}" class="promo-cta">Try Free Tool →</a>
                <button class="promo-close" aria-label="Dismiss promotion">×</button>
            </div>
        `;
        document.body.insertBefore(bar, document.body.firstChild);
        document.body.classList.add('has-promo');
        bar.querySelector('.promo-close').addEventListener('click', () => {
            bar.remove();
            document.body.classList.remove('has-promo');
            localStorage.setItem('envo-promo-dismissed', '1');
        });
    }

    // Free Layout Design — floating help button (visible after scroll, hover-expand)
    const fld = document.createElement('a');
    fld.className = 'fld-fab';
    fld.href = window.location.pathname.includes('/products/') ? '../free-layout-design.html' : 'free-layout-design.html';
    fld.setAttribute('aria-label', 'Free Layout Design tool');
    fld.innerHTML = `
        <span class="fld-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg></span>
        <span class="fld-label">Free Layout Design</span>
    `;
    document.body.appendChild(fld);
    const onScrollFld = () => {
        fld.classList.toggle('is-visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScrollFld, { passive: true });
    onScrollFld();

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
