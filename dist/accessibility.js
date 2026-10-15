(() => {
    const controls = 'input:not([type="hidden"]), select, textarea';
    let generatedLabelId = 0;
    let activeDialog = null;
    let returnFocus = null;

    function labelControls(root) {
        root.querySelectorAll(controls).forEach((control) => {
            if (control.labels?.length || control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) return;

            let container = control.parentElement;
            for (let depth = 0; container && depth < 6; depth += 1, container = container.parentElement) {
                if (container.querySelectorAll(controls).length !== 1) continue;

                const label = container.querySelector('label');
                if (label) {
                    if (!control.id) control.id = `accessible-field-${++generatedLabelId}`;
                    label.htmlFor = control.id;
                    return;
                }

                const heading = container.querySelector('h2, h3, h4, legend');
                if (heading) {
                    if (!heading.id) heading.id = `accessible-heading-${++generatedLabelId}`;
                    control.setAttribute('aria-labelledby', heading.id);
                    return;
                }
            }

            const fallback = control.getAttribute('placeholder') || control.getAttribute('name');
            if (fallback) control.setAttribute('aria-label', fallback);
        });
    }

    function visibleDialogs() {
        return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
            .filter((dialog) => dialog.getClientRects().length > 0 && getComputedStyle(dialog).visibility !== 'hidden');
    }

    function syncDialogFocus() {
        const dialogs = visibleDialogs();
        const nextDialog = dialogs[dialogs.length - 1] || null;
        if (nextDialog === activeDialog) return;

        if (nextDialog) {
            returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            activeDialog = nextDialog;
            const focusTarget = nextDialog.querySelector('[autofocus], input:not([type="hidden"]):not([disabled]), button:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled])');
            (focusTarget || nextDialog).focus({ preventScroll: true });
        } else {
            activeDialog = null;
            if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
            returnFocus = null;
        }
    }

    window.groniqDialogOpened = (dialog) => {
        if (!dialog) return;
        if (!activeDialog) {
            returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }
        activeDialog = dialog;
        const focusTarget = dialog.querySelector('[autofocus], input:not([type="hidden"]):not([disabled]), button:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled])');
        requestAnimationFrame(() => {
            if (activeDialog === dialog) (focusTarget || dialog).focus({ preventScroll: true });
        });
    };

    window.groniqDialogClosed = (dialog) => {
        activeDialog = null;
        const target = returnFocus;
        returnFocus = null;
        requestAnimationFrame(() => {
            if (target?.isConnected) target.focus({ preventScroll: true });
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        const inquiryDialog = document.getElementById('modal-overlay');
        if (inquiryDialog) {
            inquiryDialog.setAttribute('role', 'dialog');
            inquiryDialog.setAttribute('aria-modal', 'true');
            inquiryDialog.setAttribute('aria-labelledby', 'modal-title');
            inquiryDialog.setAttribute('aria-describedby', 'modal-subtitle');
            inquiryDialog.setAttribute('tabindex', '-1');
        }

        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.setAttribute('role', 'status');
            formStatus.setAttribute('aria-live', 'polite');
            formStatus.setAttribute('aria-atomic', 'true');
        }

        labelControls(document);
        const observer = new MutationObserver((records) => {
            records.forEach((record) => record.addedNodes.forEach((node) => {
                if (node instanceof Element) labelControls(node.matches(controls) ? node.parentElement : node);
            }));
            syncDialogFocus();
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-hidden'] });
        syncDialogFocus();
        initServicesNav();
    });

    // Accessible Services Submenu Controller (Desktop & Mobile)
    function initServicesNav() {
        // 1. Desktop Dropdown
        document.querySelectorAll('.services-dropdown-container').forEach((container) => {
            const toggle = container.querySelector('.services-menu-toggle');
            const menu = container.querySelector('.services-dropdown-panel');
            if (!toggle || !menu) return;

            function openMenu() {
                menu.classList.remove('hidden');
                toggle.setAttribute('aria-expanded', 'true');
                const icon = toggle.querySelector('.toggle-icon');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }

            function closeMenu() {
                menu.classList.add('hidden');
                toggle.setAttribute('aria-expanded', 'false');
                const icon = toggle.querySelector('.toggle-icon');
                if (icon) icon.style.transform = 'rotate(0deg)';
            }

            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = toggle.getAttribute('aria-expanded') === 'true';
                if (isOpen) closeMenu();
                else openMenu();
            });

            // Hover progressive enhancement on desktop (fine pointers only)
            let hoverTimeout;
            container.addEventListener('mouseenter', () => {
                if (window.matchMedia('(hover: hover)').matches) {
                    clearTimeout(hoverTimeout);
                    openMenu();
                }
            });
            container.addEventListener('mouseleave', () => {
                if (window.matchMedia('(hover: hover)').matches) {
                    hoverTimeout = setTimeout(closeMenu, 180);
                }
            });

            // Keyboard navigation & Escape
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeMenu();
                    toggle.focus();
                }
            });
        });

        // 2. Mobile Submenu Accordion
        document.querySelectorAll('.mobile-services-toggle').forEach((toggle) => {
            const targetId = toggle.getAttribute('aria-controls') || 'mobile-services-submenu';
            const submenu = document.getElementById(targetId);
            if (!submenu) return;

            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = toggle.getAttribute('aria-expanded') === 'true';
                if (isOpen) {
                    submenu.classList.add('hidden');
                    toggle.setAttribute('aria-expanded', 'false');
                    const svg = toggle.querySelector('svg');
                    if (svg) svg.style.transform = 'rotate(0deg)';
                } else {
                    submenu.classList.remove('hidden');
                    toggle.setAttribute('aria-expanded', 'true');
                    const svg = toggle.querySelector('svg');
                    if (svg) svg.style.transform = 'rotate(180deg)';
                }
            });
        });

        // Global outside click handler to close open desktop dropdowns
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.services-dropdown-container').forEach((container) => {
                if (!container.contains(e.target)) {
                    const toggle = container.querySelector('.services-menu-toggle');
                    const menu = container.querySelector('.services-dropdown-panel');
                    if (toggle && menu && !menu.classList.contains('hidden')) {
                        menu.classList.add('hidden');
                        toggle.setAttribute('aria-expanded', 'false');
                        const icon = toggle.querySelector('.toggle-icon');
                        if (icon) icon.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });
    }

    document.addEventListener('keydown', (event) => {
        if (!activeDialog) return;

        if (event.key === 'Escape') {
            const closeButton = activeDialog.querySelector('button[aria-label*="Close"], button[id^="close-"], button[id$="-close"]');
            if (closeButton) {
                event.preventDefault();
                closeButton.click();
            }
            return;
        }

        if (event.key !== 'Tab') return;
        const focusable = [...activeDialog.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
            .filter((element) => element.getClientRects().length > 0);
        if (!focusable.length) {
            event.preventDefault();
            activeDialog.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
})();
