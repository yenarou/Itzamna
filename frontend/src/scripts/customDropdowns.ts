export {};

const closeAll = (except?: HTMLElement) => {
    document.querySelectorAll<HTMLElement>('.custom-dd[data-open="true"], .planet-dd[data-open="true"]').forEach((d) => {
        if (d !== except) {
            d.dataset.open = 'false';
            const t = d.querySelector<HTMLElement>('[aria-haspopup="listbox"]');
            const m = (d as any)._menuEl as HTMLElement | undefined || d.querySelector<HTMLElement>('[role="listbox"]');
            if (t) t.setAttribute('aria-expanded', 'false');
            if (m) {
                m.setAttribute('hidden', '');
                m.style.position = '';
                m.style.left = '';
                m.style.top = '';
                m.style.width = '';
                m.style.zIndex = '';
                // move back if portaled
                if ((m as any)._home && (m as any)._home.parentNode && m.parentNode !== (m as any)._home) {
                    const { _home, _next } = m as any;
                    if (_next && _next.parentNode === _home) _home.insertBefore(m, _next);
                    else _home.appendChild(m);
                }
            }
        }
    });
};

document.querySelectorAll<HTMLElement>('.custom-dd[data-dd-for]').forEach((dd) => {
    const forId = dd.dataset.ddFor;
    if (!forId) return;
    const selectEl = document.getElementById(forId) as HTMLSelectElement | null;
    const triggerEl = dd.querySelector<HTMLButtonElement>('.custom-dd-trigger');
    const labelEl = dd.querySelector<HTMLElement>('[data-dd-label]') || dd.querySelector<HTMLElement>('span');
    const menuEl = dd.querySelector<HTMLElement>('.custom-dd-menu');
    if (!selectEl || !triggerEl || !labelEl || !menuEl) return;
    const select = selectEl, trigger = triggerEl, label = labelEl, menu = menuEl;
    (dd as any)._menuEl = menu;
    (menu as any)._home = menu.parentElement;
    (menu as any)._next = menu.nextSibling;

    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('.custom-dd-option'));

    function syncFromSelect() {
        const opt = select.options[select.selectedIndex] || select.options[0];
        label.textContent = opt ? (opt.textContent || 'Select…') : 'Select…';
        options.forEach((b) => b.setAttribute('aria-selected', b.dataset.value === (select.value ?? '') ? 'true' : 'false'));
    }
    function placeMenu() {
        const r = trigger.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.left = `${Math.round(r.left)}px`;
        menu.style.top = `${Math.round(r.bottom + 6)}px`;
        menu.style.width = `${Math.round(r.width)}px`;
        menu.style.right = 'auto';
        menu.style.zIndex = '10000';
        menu.style.maxHeight = 'min(15rem, calc(100vh - 20px - ' + Math.round(r.bottom + 6) + 'px))';
    }
    function returnMenuHome() {
        const home = (menu as any)._home as HTMLElement | null;
        const next = (menu as any)._next as ChildNode | null;
        if (home && menu.parentElement !== home) {
            if (next && next.parentNode === home) home.insertBefore(menu, next);
            else home.appendChild(menu);
        }
    }
    function setOpen(open: boolean) {
        if (open) closeAll(dd);
        dd.dataset.open = open ? 'true' : 'false';
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
            if (menu.parentElement !== document.body) document.body.appendChild(menu);
            menu.removeAttribute('hidden');
            placeMenu();
        } else {
            menu.setAttribute('hidden', '');
            menu.style.position = '';
            menu.style.left = '';
            menu.style.top = '';
            menu.style.width = '';
            menu.style.right = '';
            menu.style.zIndex = '';
            menu.style.maxHeight = '';
            returnMenuHome();
        }
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
        const t = e.target as Node;
        if (!dd.contains(t) && !menu.contains(t)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => { if (dd.dataset.open === 'true') placeMenu(); });
    window.addEventListener('scroll', () => { if (dd.dataset.open === 'true') placeMenu(); }, true);
    syncFromSelect();
});
