import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Menu, 
  X, 
  Target, 
  TrendingUp, 
  Layers, 
  BarChart3, 
  CheckCircle2, 
  Mail, 
  Linkedin, 
  Instagram, 
  ArrowRight, 
  ArrowUpRight,
  Plus,
  MessageSquare,
  Cpu,
  ShieldCheck
} from 'lucide-react';

// Custom SVG Logo component based on the provided image
const Logo = ({ className = "w-8 h-8", color = "#39FF14" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M70 20C85 20 95 35 95 50C95 65 85 80 70 80H60V65H70C78 65 83 58 83 50C83 42 78 35 70 35H45L40 20H70Z" fill={color} />
    <path d="M30 80C15 80 5 65 5 50C5 35 15 20 30 20H40V35H30C22 35 17 42 17 50C17 58 22 65 30 65H55L60 80H30Z" fill="white" />
  </svg>
);

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
    }, 15);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#39FF14]/50 to-transparent animate-scan" />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center relative"
      >
        <div className="relative mb-12">
          <Logo className="w-24 h-24 relative z-10" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[#39FF14]/20 rounded-full blur-2xl z-0"
          />
        </div>

        <div className="w-64 space-y-4">
          <div className="flex justify-between items-end">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-[0.3em]">System.Init</span>
               <span className="text-white text-xs font-bold tracking-widest mt-1">Booting Growth Engine...</span>
             </div>
             <span className="text-[#39FF14] font-black text-xl tabular-nums">{progress}%</span>
          </div>
          
          <div className="h-[2px] w-full bg-[#1F1F1F] rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-[#39FF14]"
              style={{ width: `${progress}%` }}
            />
            <motion.div 
              animate={{ left: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 w-20 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </div>

          <div className="flex justify-center gap-6 mt-8 opacity-40">
             <Cpu size={14} className="text-[#39FF14] animate-pulse" />
             <BarChart3 size={14} className="text-white animate-pulse" style={{ animationDelay: '0.2s' }} />
             <Target size={14} className="text-[#39FF14] animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-10 left-10 hidden md:block text-[#1F1F1F] font-mono text-[10px]">
           GRONIQ_v2.0_CORE_LOADED<br />
           MSME_REGISTERED_IDENTIFIED<br />
           CONNECTION_SECURED
      </div>
    </motion.div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = ['Home', 'Services', 'Process', 'About', 'Contact'];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-[#1F1F1F] py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer">
          <Logo className="w-8 h-8 group-hover:rotate-[360deg] transition-transform duration-700" />
          <span className="text-xl font-bold tracking-tighter text-white uppercase">Groniq</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-bold uppercase tracking-widest text-[#B5B5B5] hover:text-[#39FF14] transition-colors">{item}</a>
          ))}
          <button className="px-6 py-2.5 bg-[#39FF14] text-black text-sm font-black rounded-full hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all duration-300">
            Book Free Audit
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed inset-0 bg-[#0E0E0E] z-40 p-10 flex flex-col gap-8 md:hidden">
            <div className="flex justify-between items-center mb-10">
              <Logo className="w-10 h-10" />
              <button onClick={() => setIsOpen(false)}><X size={32} className="text-white" /></button>
            </div>
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsOpen(false)} className="text-4xl font-bold text-white hover:text-[#39FF14] transition-colors">{item}</a>
            ))}
            <button className="mt-auto w-full py-5 bg-[#39FF14] text-black font-black rounded-2xl text-xl">Book Consultation</button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => (
  <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
    <div className="absolute inset-0 z-0">
      <div className="absolute top-[15%] right-[5%] w-[500px] h-[500px] bg-[#39FF14]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[5%] left-[5%] w-[400px] h-[400px] bg-[#39FF14]/10 rounded-full blur-[120px]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#39FF14 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />
    </div>

    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true }} 
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#121212] border border-[#1F1F1F] rounded-full">
            <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-[0.2em]">Next-Gen Growth Agency</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#121212] border border-[#1F1F1F] rounded-full">
            <ShieldCheck size={12} className="text-[#39FF14]" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">MSME Registered</span>
          </div>
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.95] mb-8 tracking-tighter">
          Performance <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-[#6CFF61]">Marketing.</span>
        </h1>
        <p className="text-lg md:text-xl text-[#B5B5B5] mb-10 max-w-xl leading-relaxed font-medium">
          Helping businesses scale through precision Google Ads, Meta growth systems, and high-conversion branding strategy.
        </p>
        <div className="flex flex-col sm:flex-row gap-5">
          <button className="px-10 py-5 bg-[#39FF14] text-black font-black rounded-full flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] transition-all">
            Book Free Audit <ArrowUpRight size={22} />
          </button>
          <button className="px-10 py-5 bg-transparent border border-[#1F1F1F] text-white font-bold rounded-full hover:bg-white/5 transition-all">
            Explore Services
          </button>
        </div>
      </motion.div>

      <div className="hidden lg:block relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          whileInView={{ opacity: 1, scale: 1 }} 
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="p-10 rounded-[40px] border border-white/5 bg-[#0E0E0E]/40 backdrop-blur-md"
        >
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-[#1F1F1F] rounded-full" />
                <div className="h-2 w-20 bg-[#1F1F1F]/50 rounded-full" />
              </div>
              <div className="w-12 h-12 bg-[#39FF14]/10 rounded-2xl flex items-center justify-center">
                <Target className="text-[#39FF14]" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 h-48 items-end">
              {[40, 70, 55, 90].map((h, i) => (
                <motion.div 
                  key={i} 
                  initial={{ height: 0 }} 
                  animate={{ height: `${h}%` }} 
                  transition={{ delay: i * 0.2 + 1, duration: 1.5, ease: "easeOut" }}
                  className="bg-gradient-to-t from-[#39FF14] to-[#6CFF61] rounded-t-xl opacity-80"
                />
              ))}
            </div>
            <div className="flex gap-4">
              <div className="flex-1 p-4 bg-[#121212] border border-[#1F1F1F] rounded-2xl">
                <p className="text-[10px] text-[#B5B5B5] uppercase font-bold mb-1">Conversion Rate</p>
                <p className="text-2xl font-black text-[#39FF14]">+24%</p>
              </div>
              <div className="flex-1 p-4 bg-[#121212] border border-[#1F1F1F] rounded-2xl">
                <p className="text-[10px] text-[#B5B5B5] uppercase font-bold mb-1">ROAS Average</p>
                <p className="text-2xl font-black text-white">4.8x</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const Services = () => {
  const services = [
    { title: "Google Ads", icon: <Target className="text-[#39FF14]" size={32} />, desc: "Search, YouTube, and Performance Max strategies focused on high-intent leads.", tags: ["SEM", "PMax", "Search"] },
    { title: "Meta Ads", icon: <TrendingUp className="text-[#39FF14]" size={32} />, desc: "Facebook and Instagram systems designed for awareness and scalable ROAS.", tags: ["Paid Social", "UGC", "Growth"] },
    { title: "Branding Strategy", icon: <Layers className="text-[#39FF14]" size={32} />, desc: "Creative positioning and content systems to build trust and authority.", tags: ["Creative", "Identity", "SMM"] },
    { title: "Analytics", icon: <BarChart3 className="text-[#39FF14]" size={32} />, desc: "GA4 and GTM setup to ensure every decision is backed by accurate data.", tags: ["GA4", "GTM", "Tracking"] }
  ];

  return (
    <section id="services" className="py-32 bg-[#0E0E0E]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 max-w-2xl">
           <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">Strategic Growth <br /><span className="text-[#39FF14]">Specialization.</span></h2>
           <p className="text-[#B5B5B5] text-lg font-medium">We don't just "run ads." We build holistic digital ecosystems that capture and convert.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="p-10 bg-[#121212] border border-[#1F1F1F] rounded-[32px] group hover:border-[#39FF14]/40 transition-all duration-500">
              <div className="mb-8 p-5 bg-[#050505] w-fit rounded-2xl group-hover:scale-110 group-hover:bg-[#39FF14] group-hover:text-black transition-all duration-500">{s.icon}</div>
              <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{s.title}</h3>
              <p className="text-[#B5B5B5] text-sm leading-relaxed mb-8 font-medium">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.tags.map(tag => <span key={tag} className="text-[10px] px-3 py-1 bg-[#050505] text-[#B5B5B5] rounded-full border border-[#1F1F1F] font-bold uppercase tracking-wider">{tag}</span>)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Process = () => {
  const steps = [
    { title: "Audit & Research", desc: "Diving deep into your current data and competitor landscape." },
    { title: "Strategy Planning", desc: "Building a custom roadmap based on your specific growth goals." },
    { title: "Campaign Setup", desc: "Technical implementation of high-performance ad structures." },
    { title: "Creative Direction", desc: "Visual storytelling designed to stop the scroll and convert." },
    { title: "Optimization", desc: "Continuous testing of keywords, audiences, and creatives." },
    { title: "Reporting", desc: "Transparent, data-driven reporting that shows the real impact." }
  ];

  return (
    <section id="process" className="py-32 bg-[#050505] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-24 text-center">How <span className="text-[#39FF14]">Groniq</span> Works.</h2>
        <div className="relative">
           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#1F1F1F] hidden lg:block -translate-y-1/2" />
           <div className="grid lg:grid-cols-6 gap-8 relative z-10">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center group">
                   <div className="w-16 h-16 bg-[#121212] border-2 border-[#1F1F1F] rounded-full flex items-center justify-center text-white font-black mb-8 group-hover:border-[#39FF14] group-hover:bg-[#39FF14] group-hover:text-black transition-all duration-300">
                      0{idx + 1}
                   </div>
                   <h4 className="text-lg font-bold text-white mb-3">{step.title}</h4>
                   <p className="text-xs text-[#B5B5B5] leading-relaxed px-4">{step.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
};

const About = () => (
  <section id="about" className="py-32 bg-[#0E0E0E]">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
      <div className="relative h-[450px] md:h-[550px] group">
        <div className="absolute inset-0 bg-[#121212] rounded-[40px] border border-[#1F1F1F] overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-tr from-[#39FF14]/10 to-transparent opacity-50" />
           <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
              <motion.span 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 10, repeat: Infinity }}
                className="text-[120px] md:text-[160px] font-black text-white/5 tracking-tighter leading-none select-none"
              >
                GRONIQ
              </motion.span>
              <div className="absolute bottom-12 left-12 right-12">
                 <h3 className="text-3xl font-black text-white mb-4 uppercase">Founder Driven.</h3>
                 <p className="text-[#B5B5B5] text-lg font-medium leading-relaxed">
                   Marketing that bridges the gap between creative visual branding and hard analytical data. We focus on practical execution.
                 </p>
              </div>
           </div>
        </div>
      </div>
      <div>
         <h2 className="text-4xl md:text-6xl font-black text-white mb-10 leading-tight">Trust Built on <br /><span className="text-[#39FF14]">Performance.</span></h2>
         <div className="space-y-10">
            {[
              { t: "Transparent Execution", d: "Clear communication, no agency fluff. We explain exactly where your budget goes." },
              { t: "Data-First Decision Making", d: "We don't guess. Every campaign iteration is based on actual tracking data." },
              { t: "Human-First Approach", d: "We treat your business with the care of a partner, not just another account." }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="mt-1 flex-shrink-0 w-10 h-10 bg-[#39FF14]/10 rounded-xl flex items-center justify-center text-[#39FF14] group-hover:bg-[#39FF14] group-hover:text-black transition-all">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2 tracking-tight">{item.t}</h4>
                  <p className="text-[#B5B5B5] leading-relaxed">{item.d}</p>
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  </section>
);

const Pricing = () => {
  const plans = [
    { service: "Google Ads", setup: "₹9,000", monthly: "₹6,000+", note: "Depends on scale & budget" },
    { service: "Meta Ads", setup: "₹9,000", monthly: "₹6,000+", note: "Depends on scale & creative" },
    { service: "Social Media", setup: "Starting", monthly: "₹4,000+", note: "Management & Growth" },
    { service: "Analytics", setup: "One-time", monthly: "₹5,000+", note: "GA4, GTM & Tracking" }
  ];

  return (
    <section className="py-32 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-20 text-center uppercase tracking-tight">Premium <span className="text-[#39FF14]">Pricing.</span></h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, idx) => (
            <div key={idx} className="p-10 bg-[#121212] border border-[#1F1F1F] rounded-[32px] hover:border-[#39FF14]/30 transition-all flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest mb-6">Service Plan</span>
              <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">{p.service}</h3>
              <div className="mb-8">
                <p className="text-4xl font-black text-white">{p.monthly}</p>
                <p className="text-xs text-[#B5B5B5] mt-2 italic">{p.note}</p>
              </div>
              <div className="w-full h-[1px] bg-[#1F1F1F] mb-8" />
              <div className="space-y-3 mb-10 w-full text-left">
                <div className="flex justify-between text-xs text-[#B5B5B5] font-bold uppercase tracking-widest">
                  <span>Setup Fee:</span>
                  <span className="text-white">{p.setup}</span>
                </div>
              </div>
              <button className="w-full py-4 bg-transparent border border-[#1F1F1F] text-white font-bold rounded-xl hover:bg-[#39FF14] hover:text-black transition-all">Select Plan</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Industries = () => {
  const tags = ["Dentist Clinics", "Skin Clinics", "Petcare", "Local Businesses", "Boutique & Couture", "Ecommerce Brands", "App Developers"];
  return (
    <section className="py-24 bg-[#0E0E0E]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h3 className="text-sm font-black text-[#B5B5B5] uppercase tracking-[0.3em] mb-12">Growth sectors we focus on</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {tags.map((tag) => (
            <span key={tag} className="px-8 py-4 bg-[#121212] border border-[#1F1F1F] rounded-full text-white font-bold hover:border-[#39FF14] transition-all cursor-default text-xs uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const [open, setOpen] = useState(0);
  const faqs = [
    { q: "How long does marketing take to show results?", a: "Typically, Google and Meta ads show initial traction within 14-21 days of data accumulation. Real scaling and ROI stability usually happen in months 2 and 3." },
    { q: "Do you work with small businesses?", a: "Yes, we specialize in high-intent local services like dental clinics, boutiques, and niche service providers looking to build a professional digital footprint." },
    { q: "Can you manage both ads and branding?", a: "Absolutely. We believe strong performance marketing requires consistent, high-quality creative visuals to build the trust necessary for conversion." },
    { q: "Do you provide analytics reporting?", a: "Every plan includes a monthly performance dashboard. We track everything from clicks to lead value so you know your ROI." }
  ];

  return (
    <section className="py-32 bg-[#050505]">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-16 text-center tracking-tight">Common <span className="text-[#39FF14]">Queries.</span></h2>
        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div key={idx} className="border border-[#1F1F1F] rounded-3xl overflow-hidden bg-[#121212] transition-all">
              <button onClick={() => setOpen(open === idx ? -1 : idx)} className="w-full p-8 flex justify-between items-center text-left hover:bg-white/5 transition-colors">
                <span className="font-black text-white pr-4 text-lg">{f.q}</span>
                <div className={`transition-transform duration-300 ${open === idx ? 'rotate-180' : ''}`}>
                   <Plus className={open === idx ? 'text-[#39FF14]' : 'text-white'} />
                </div>
              </button>
              <AnimatePresence>
                {open === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8 text-[#B5B5B5] leading-relaxed">
                    {f.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = () => (
  <section id="contact" className="py-32 relative bg-[#0E0E0E]">
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <div className="grid lg:grid-cols-2 gap-24">
        <div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-10 leading-tight tracking-tighter uppercase">Ready to <br /><span className="text-[#39FF14]">Scale?</span></h2>
          <p className="text-[#B5B5B5] text-xl mb-12 font-medium leading-relaxed">Stop guessing your marketing budget. Book a free consultation and campaign audit with Shams today.</p>
          <div className="space-y-10">
             <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-[#121212] border border-[#1F1F1F] rounded-2xl flex items-center justify-center text-[#39FF14] group-hover:bg-[#39FF14] group-hover:text-black transition-all"><Mail size={24} /></div>
                <div><p className="text-[10px] text-[#B5B5B5] uppercase font-black tracking-widest">Email Address</p><p className="text-white text-lg font-bold">growth@groniqdigital.com</p></div>
             </div>
             <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-[#121212] border border-[#1F1F1F] rounded-2xl flex items-center justify-center text-[#39FF14] group-hover:bg-[#39FF14] group-hover:text-black transition-all"><Linkedin size={24} /></div>
                <div><p className="text-[10px] text-[#B5B5B5] uppercase font-black tracking-widest">LinkedIn Profile</p><p className="text-white text-lg font-bold">@groniq-digital-solutions</p></div>
             </div>
          </div>
        </div>

        <div className="p-10 md:p-14 bg-[#121212] border border-[#1F1F1F] rounded-[48px] shadow-2xl relative">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#39FF14]/10 rounded-full blur-2xl" />
          <form className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-[#B5B5B5] uppercase tracking-widest px-1">Name</label>
                 <input type="text" className="w-full bg-[#050505] border border-[#1F1F1F] rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#39FF14] transition-all" placeholder="Shams Tabrez" />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-[#B5B5B5] uppercase tracking-widest px-1">Business</label>
                 <input type="text" className="w-full bg-[#050505] border border-[#1F1F1F] rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#39FF14] transition-all" placeholder="Company Name" />
              </div>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-[#B5B5B5] uppercase tracking-widest px-1">Email</label>
               <input type="email" className="w-full bg-[#050505] border border-[#1F1F1F] rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#39FF14] transition-all" placeholder="shams@groniq.com" />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-[#B5B5B5] uppercase tracking-widest px-1">Message</label>
               <textarea rows="4" className="w-full bg-[#050505] border border-[#1F1F1F] rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#39FF14] transition-all resize-none" placeholder="What are your growth goals?"></textarea>
            </div>
            <button type="button" className="w-full py-5 bg-[#39FF14] text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg">
              Send Message <ArrowRight size={22} />
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
);

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="bg-[#050505] min-h-screen text-white font-['Inter',sans-serif] selection:bg-[#39FF14] selection:text-black">
      <AnimatePresence mode="wait">
        {loading && <SplashScreen key="splash" onFinish={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <Navbar />
          <main>
            <Hero />
            <Industries />
            <Services />
            <Pricing />
            <About />
            <Process />
            <FAQ />
            <Contact />
          </main>

          <footer className="bg-[#050505] border-t border-[#1F1F1F] pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid md:grid-cols-4 gap-16 mb-24">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-3 mb-8">
                    <Logo className="w-10 h-10" />
                    <span className="text-3xl font-black tracking-tighter text-white uppercase">Groniq</span>
                  </div>
                  <p className="text-[#B5B5B5] max-w-sm mb-10 text-lg font-medium leading-relaxed">Next-generation performance marketing and growth strategy for modern brands.</p>
                  <div className="flex gap-4">
                    <a href="https://instagram.com/groniq_digiital_solutions" target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#121212] border border-[#1F1F1F] rounded-xl flex items-center justify-center text-[#B5B5B5] hover:text-[#39FF14] transition-all"><Instagram size={24} /></a>
                    <a href="https://linkedin.com/groniq-digital-solutions" target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#121212] border border-[#1F1F1F] rounded-xl flex items-center justify-center text-[#B5B5B5] hover:text-[#39FF14] transition-all"><Linkedin size={24} /></a>
                    <a href="mailto:growth@groniqdigital.com" className="w-12 h-12 bg-[#121212] border border-[#1F1F1F] rounded-xl flex items-center justify-center text-[#B5B5B5] hover:text-[#39FF14] transition-all"><MessageSquare size={24} /></a>
                  </div>
                </div>
                <div>
                  <h5 className="text-white font-black mb-8 uppercase tracking-widest text-xs">Explore</h5>
                  <ul className="space-y-4 font-medium text-[#B5B5B5] uppercase text-[10px] tracking-widest">
                    <li><a href="#services" className="hover:text-[#39FF14] transition-colors">Expertise</a></li>
                    <li><a href="#process" className="hover:text-[#39FF14] transition-colors">How We Work</a></li>
                    <li><a href="#contact" className="hover:text-[#39FF14] transition-colors">Book Audit</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-black mb-8 uppercase tracking-widest text-xs">Legal & Compliance</h5>
                  <ul className="space-y-4 font-medium text-[#B5B5B5] uppercase text-[10px] tracking-widest">
                    <li className="flex items-center gap-2 text-[#39FF14] font-black"><ShieldCheck size={12} /> MSME Registered</li>
                    <li><a href="#" className="hover:text-[#39FF14] transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-[#39FF14] transition-colors">Terms of Use</a></li>
                  </ul>
                </div>
              </div>
              <div className="pt-12 border-t border-[#1F1F1F] text-center text-xs text-[#B5B5B5] font-black tracking-[0.3em] uppercase">
                <p>© 2024 GRONIQ DIGITAL SOLUTIONS. ALL RIGHTS RESERVED.</p>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        html { scroll-behavior: smooth; }
        ::selection { background: #39FF14; color: #000; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1F1F1F; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #39FF14; }
      `}</style>
    </div>
  );
}
