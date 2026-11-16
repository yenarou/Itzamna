export {};

const els = document.querySelectorAll('.reveal');
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.12 });
    els.forEach((el) => { if (!el.classList.contains('is-visible')) io.observe(el); });
} else {
    els.forEach((el) => el.classList.add('is-visible'));
}
