const root = document.getElementById('app-views');
if (root) {
    const views = Array.from(root.querySelectorAll<HTMLElement>('[data-app-view]'));
    const steps = Array.from(document.querySelectorAll<HTMLElement>('[data-content-step]')).sort(
        (a, b) => Number(a.dataset.contentStep) - Number(b.dataset.contentStep),
    );
    const stepLabel = document.getElementById('content-step-label');
    const toExploreBtn = document.getElementById('content-to-explore');
    let stepIndex = 0;

    function showView(name: string, opts?: { focusPicker?: boolean }) {
        root!.dataset.view = name;
        views.forEach((v) => {
            v.hidden = v.dataset.appView !== name;
        });
        if (name === 'content') {
            updateSteps();
            window.scrollTo({ top: 0, behavior: 'auto' });
        } else if (name === 'home') {
            window.scrollTo({ top: 0, behavior: 'auto' });
        } else if (name === 'explore') {
            window.scrollTo({ top: 0, behavior: 'auto' });
            if (opts?.focusPicker) {
                setTimeout(() => {
                    document.getElementById('planet-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    (document.getElementById('planet-dd-trigger') as HTMLElement | null)?.focus?.();
                }, 50);
            }
        }
    }
    function updateSteps() {
        steps.forEach((s, i) => {
            s.hidden = i !== stepIndex;
            s.classList.toggle('is-active-step', i === stepIndex);
        });
        if (stepLabel) stepLabel.textContent = `${stepIndex + 1} / ${steps.length}`;
        if (toExploreBtn) toExploreBtn.hidden = stepIndex < steps.length - 1;
        const prevs = document.querySelectorAll<HTMLButtonElement>('[data-content-prev]');
        const nexts = document.querySelectorAll<HTMLButtonElement>('[data-content-next]');
        prevs.forEach((b) => (b.disabled = stepIndex <= 0));
        nexts.forEach((b) => (b.hidden = stepIndex >= steps.length - 1));
        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    document.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        const viewBtn = t.closest<HTMLElement>('[data-show-view]');
        if (viewBtn) {
            e.preventDefault();
            showView(viewBtn.dataset.showView || 'home', { focusPicker: viewBtn.hasAttribute('data-focus-picker') });
            return;
        }
        if (t.closest('[data-content-next]')) {
            e.preventDefault();
            if (stepIndex < steps.length - 1) {
                stepIndex++;
                updateSteps();
            }
            return;
        }
        if (t.closest('[data-content-prev]')) {
            e.preventDefault();
            if (stepIndex > 0) {
                stepIndex--;
                updateSteps();
            }
            return;
        }
    });

    showView('home');
    updateSteps();
}
