import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Target, TrendingUp, Layers, BarChart3, CheckCircle2, 
  Mail, Linkedin, Instagram, ArrowRight, ArrowUpRight, Plus, 
  MessageSquare, Cpu, ShieldCheck 
} from 'lucide-react';

// --- LOGO COMPONENT ---
const Logo = ({ className = "w-8 h-8", color = "#39FF14" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M70 20C85 20 95 35 95 50C95 65 85 80 70 80H60V65H70C78 65 83 58 83 50C83 42 78 35 70 35H45L40 20H70Z" fill={color} />
    <path d="M30 80C15 80 5 65 5 50C5 35 15 20 30 20H40V35H30C22 35 17 42 17 50C17 58 22 65 30 65H55L60 80H30Z" fill="white" />
  </svg>
);

// --- INTRO / SPLASH SCREEN ---
const SplashScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 600);
          return 100;
        }
        return prev + 1;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <motion.div exit={{ opacity: 0, scale: 1.1 }} className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center">
      <Logo className="w-24 h-24 mb-12" />
      <div className="w-64 space-y-4 text-center">
        <span className="text-[#39FF14] font-black text-xl">{progress}%</span>
        <div className="h-[2px] w-full bg-[#1F1F1F] rounded-full overflow-hidden">
          <motion.div className="h-full bg-[#39FF14]" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-white text-[10px] tracking-widest uppercase opacity-50">Initializing Growth Systems...</p>
      </div>
    </motion.div>
  );
};

// --- NAVIGATION ---
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    window.addEventListener('scroll', () => setScrolled(window.scrollY > 50));
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all ${scrolled ? 'bg-[#050505]/90 backdrop-blur-md py-4 border-b border-[#1F1F1F]' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3"><Logo className="w-8 h-8" /><span className="text-xl font-bold tracking-tighter text-white uppercase">Groniq</span></div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-[#B5B5B5]">
          <a href="#home" className="hover:text-[#39FF14]">Home</a>
          <a href="#services" className="hover:text-[#39FF14]">Services</a>
          <a href="#about" className="hover:text-[#39FF14]">About</a>
          <button className="px-6 py-2 bg-[#39FF14] text-black rounded-full">Free Audit</button>
        </div>
      </div>
    </nav>
  );
};

// --- MAIN APP ---
export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-[#39FF14] selection:text-black">
      <AnimatePresence>{loading && <SplashScreen key="splash" onFinish={() => setLoading(false)} />}</AnimatePresence>
      
      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Navbar />
          
          {/* HERO SECTION */}
          <section id="home" className="pt-40 pb-20 px-6 max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="px-4 py-1.5 bg-[#121212] border border-[#1F1F1F] rounded-full text-[10px] font-black text-[#39FF14] uppercase">Performance Marketing</div>
              <div className="px-4 py-1.5 bg-[#121212] border border-[#1F1F1F] rounded-full text-[10px] font-black text-white uppercase flex items-center gap-2">
                <ShieldCheck size={12} className="text-[#39FF14]" /> MSME Registered
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-none">
              Scaling Brands <br /><span className="text-[#39FF14]">With Data.</span>
            </h1>
            <p className="text-[#B5B5B5] text-lg max-w-xl mb-10">
              Precise Google Ads, Meta growth systems, and high-conversion branding specifically for modern Indian businesses.
            </p>
            <button className="px-10 py-5 bg-[#39FF14] text-black font-black rounded-full flex items-center gap-2 hover:scale-105 transition-all">
              Book Consultation <ArrowUpRight size={20} />
            </button>
          </section>

          {/* CONTACT SECTION */}
          <section id="contact" className="py-20 px-6 bg-[#0E0E0E]">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">
              <div>
                <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter">Ready to <span className="text-[#39FF14]">Scale?</span></h2>
                <p className="text-[#B5B5B5] mb-10">Send a message and Shams Tabrez will get back to you personally.</p>
                <div className="space-y-4">
                  <p className="flex items-center gap-4 text-white font-bold"><Mail className="text-[#39FF14]" /> growth@groniqdigital.com</p>
                  <p className="flex items-center gap-4 text-white font-bold"><Linkedin className="text-[#39FF14]" /> @groniq-digital-solutions</p>
                </div>
              </div>

              {/* REPLACE THE ACTION URL BELOW WITH YOUR FORMSPREE LINK */}
              <form action="https://formspree.io/f/mqkopaak" method="POST" className="p-8 bg-[#121212] border border-[#1F1F1F] rounded-[32px] space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input name="name" type="text" placeholder="Shams Tabrez" required className="w-full bg-[#050505] border border-[#1F1F1F] p-4 rounded-xl focus:border-[#39FF14] outline-none transition-all" />
                  <input name="business" type="text" placeholder="Business Name" required className="w-full bg-[#050505] border border-[#1F1F1F] p-4 rounded-xl focus:border-[#39FF14] outline-none transition-all" />
                </div>
                <input name="email" type="email" placeholder="email@example.com" required className="w-full bg-[#050505] border border-[#1F1F1F] p-4 rounded-xl focus:border-[#39FF14] outline-none transition-all" />
                <textarea name="message" rows="4" placeholder="How can we help you grow?" required className="w-full bg-[#050505] border border-[#1F1F1F] p-4 rounded-xl focus:border-[#39FF14] outline-none transition-all resize-none"></textarea>
                <button type="submit" className="w-full py-5 bg-[#39FF14] text-black font-black rounded-xl hover:scale-[1.02] transition-all">Send Message</button>
              </form>
            </div>
          </section>

          <footer className="py-12 border-t border-[#1F1F1F] text-center text-[10px] text-[#B5B5B5] font-black tracking-widest uppercase">
            <p>© 2026 GRONIQ DIGITAL SOLUTIONS. MSME REGISTERED.</p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}