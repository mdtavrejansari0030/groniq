import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Groniq Digital Solutions",
  description: "Digital growth systems, performance marketing, SEO, conversion-focused websites.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WZFQDDBR');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={`${inter.className} bg-[#050505] text-white min-h-screen flex flex-col antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WZFQDDBR"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <header className="w-full z-50 py-4 bg-[#050505]/80 backdrop-blur-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <span className="text-white font-black tracking-tighter text-xl">
              GRONIQ<span className="text-[#39FF14]">.</span>
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
