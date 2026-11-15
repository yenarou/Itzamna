const closeAll = (except?: HTMLElement) => {
    document.querySelectorAll<HTMLElement>('.custom-dd[data-open="true"], .planet-dd[data-open="true"]').forEach((d) => {
        if (d !== except) {
            d.dataset.open = 'false';
            const t = d.querySelector<HTMLElement>('[aria-haspopup="listbox"]');
            const m = d.querySelector<HTMLElement>('[role="listbox"]');
            if (t) t.setAttribute('aria-expanded', 'false');
            if (m) m.setAttribute('hidden', '');
        }
    });
};

document.querySelectorAll<HTMLElement>('.custom-dd[data-dd-for]').forEach((dd) => {
    const forId = dd.dataset.ddFor;
    if (!forId) return;
    const selectEl = document.getElementById(forId) as HTMLSelectElement | null;
    const triggerEl = dd.querySelector<HTMLButtonElement>('.custom-dd-trigger');
    const labelEl = dd.querySelector<HTMLElement>('.custom-dd-label');
    const menuEl = dd.querySelector<HTMLElement>('.custom-dd-menu');
    if (!selectEl || !triggerEl || !labelEl || !menuEl) return;
    const select = selectEl;
    const trigger = triggerEl;
    const label = labelEl;
    const menu = menuEl;

    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('.custom-dd-option'));

    function syncFromSelect() {
        const opt = select.options[select.selectedIndex] || select.options[0];
        label.textContent = opt ? (opt.textContent || 'Seleccionar…') : 'Seleccionar…';
        options.forEach((b) => b.setAttribute('aria-selected', b.dataset.value === (select.value ?? '') ? 'true' : 'false'));
    }
    function setOpen(open: boolean) {
        if (open) closeAll(dd);
        dd.dataset.open = open ? 'true' : 'false';
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) menu.removeAttribute('hidden');
        else menu.setAttribute('hidden', '');
    }

    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        setOpen(dd.dataset.open !== 'true');
    });
    options.forEach((btn) =>
        btn.addEventListener('click', () => {
            const val = btn.dataset.value ?? '';
            select.value = val;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            syncFromSelect();
            setOpen(false);
            trigger.focus();
        }),
    );
    select.addEventListener('change', syncFromSelect);
    document.addEventListener('click', (e) => {
        if (!dd.contains(e.target as Node)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });
    syncFromSelect();
});
