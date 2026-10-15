(() => {
    window.dataLayer = window.dataLayer || [];

    // Ensure Google Tag Manager is loaded (global tag for new & existing pages)
    if (!document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) {
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;if(f&&f.parentNode){f.parentNode.insertBefore(j,f);}
        else{document.head.appendChild(j);}
        })(window,document,'script','dataLayer','GTM-WZFQDDBR');
    }

    window.groniqTrack = (eventName, parameters = {}) => {
        window.dataLayer.push({ event: eventName, ...parameters });
    };

    document.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const link = target?.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        if (/^https?:\/\/wa\.me\//i.test(href)) {
            window.groniqTrack('contact_action', { method: 'whatsapp' });
        } else if (/^mailto:/i.test(href)) {
            window.groniqTrack('contact_action', { method: 'email' });
        }

        if (link.id === 'mobile-project-trigger') {
            window.groniqTrack('start_project_open', { method: 'project_sheet' });
        }
    });
})();
