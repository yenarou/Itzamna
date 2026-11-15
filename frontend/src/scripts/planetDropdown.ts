const closeCustom = () => {
    document.querySelectorAll<HTMLElement>('.custom-dd[data-open="true"]').forEach((d) => {
        d.dataset.open = 'false';
        const t = d.querySelector<HTMLElement>('[aria-haspopup="listbox"]');
        const m = d.querySelector<HTMLElement>('[role="listbox"]');
        if (t) t.setAttribute('aria-expanded', 'false');
        if (m) m.setAttribute('hidden', '');
    });
};

(() => {
    const selectEl = document.getElementById('planet-select') as HTMLSelectElement | null;
    const ddEl = document.getElementById('planet-dd') as HTMLElement | null;
    const triggerEl = document.getElementById('planet-dd-trigger') as HTMLButtonElement | null;
    const labelEl = document.getElementById('planet-dd-label') as HTMLElement | null;
    const menuEl = document.getElementById('planet-dd-menu') as HTMLElement | null;
    if (!selectEl || !ddEl || !triggerEl || !labelEl || !menuEl) return;
    const select = selectEl;
    const dd = ddEl;
    const trigger = triggerEl;
    const label = labelEl;
    const menu = menuEl;

    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('.planet-dd-option'));
    function syncFromSelect() {
        const opt = select.options[select.selectedIndex] || select.options[0];
        label.textContent = opt ? (opt.textContent || 'Elegir planeta…') : 'Elegir planeta…';
        options.forEach((b) => b.setAttribute('aria-selected', b.dataset.value === select.value ? 'true' : 'false'));
    }
    function setOpen(open: boolean) {
        if (open) closeCustom();
        dd.dataset.open = open ? 'true' : 'false';
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) menu.removeAttribute('hidden'); else menu.setAttribute('hidden', '');
    }
    trigger.addEventListener('click', (e) => { e.preventDefault(); setOpen(dd.dataset.open !== 'true'); });
    options.forEach((btn) => btn.addEventListener('click', () => {
        const val = btn.dataset.value || '';
        select.value = val;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncFromSelect();
        setOpen(false);
        trigger.focus();
    }));
    select.addEventListener('change', syncFromSelect);
    document.addEventListener('click', (e) => { if (!dd.contains(e.target as Node)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    syncFromSelect();
})();
