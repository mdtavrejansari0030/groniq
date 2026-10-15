module.exports = {
    content: [
        './index.html',
        './tools/index.html',
        './tools/utm-builder/index.html',
        './tools/utm-builder/utm-builder.js',
        './tools/utm-builder/utm-presets.js',
        './tools/utm-builder/utm-storage.js',
        './build-utm-builder.js',
        './learn/index.html',
        './learn/utm-tracking/index.html',
        './tools/business-competitor-research/**/*.{html,js}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    green: '#39FF14',
                    greenHover: '#32e012',
                    greenDim: 'rgba(57, 255, 20, 0.12)',
                    greenGlow: 'rgba(57, 255, 20, 0.25)',
                    dark: '#050505',
                    card: '#0D0D0D',
                    cardHover: '#131313',
                    surface: '#111111',
                    border: '#1E1E1E',
                    borderHover: '#2A2A2A',
                    muted: '#9E9E9E',
                    mutedLight: '#C4C4C4',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
        },
    },
};