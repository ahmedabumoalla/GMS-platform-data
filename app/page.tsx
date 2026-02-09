'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Zap, Users, 
  LayoutDashboard, Phone, HardHat, ChevronRight, ChevronLeft,
  Globe, Activity, CheckCircle2, Factory, Server, Sun, Moon,
  Cpu, BarChart3, Lock, Briefcase, MapPin, ChevronDown
} from 'lucide-react';

// --- مكونات مساعدة ---

const SpotlightCard = ({ children, className = "", isDark }: any) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => setOpacity(1);
  const handleBlur = () => setOpacity(0);
  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-3xl border transition-colors duration-300 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'} ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'}, transparent 40%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
};

const FadeIn = ({ children, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default function Home() {
  const [lang, setLang] = useState<'ar' | 'en' | 'ur'>('ar');
  const [isDark, setIsDark] = useState(false); 
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false); // حالة قائمة اللغة

  const toggleTheme = () => setIsDark(prev => !prev);
  
  const isRTL = lang === 'ar' || lang === 'ur';
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight; 

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) setIsDark(true);
    else setIsDark(false);

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const content = {
    ar: {
      nav: { 
        services: 'الخدمات', 
        projects: 'المشاريع', 
        tech: 'التقنية', 
        about: 'من نحن',
        portal: 'بوابة الموظفين',
        currentLang: 'العربية'
      },
      hero: {
        badge: 'رؤية 2030 | شريك استراتيجي',
        title1: 'هندسة المستقبل',
        title2: 'والذكاء الصناعي',
        desc: 'منصة GMS للحلول الصناعية المتكاملة. نجمع بين الخبرة البشرية والتحليلات الرقمية لإدارة البنية التحتية والمشاريع الكبرى.',
        cta1: 'اكتشف خدماتنا',
        cta2: 'تواصل معنا',
        liveOps: 'عمليات مباشرة',
        efficiency: 'الكفاءة'
      },
      stats: [
        { val: '+100', label: 'مشروع حكومي' },
        { val: '99.9%', label: 'دقة تشغيلية' },
        { val: '24/7', label: 'دعم هندسي' },
        { val: 'ISO', label: 'معايير عالمية' },
      ],
      services: {
        title: 'حلول تتجاوز التوقعات',
        items: [
          { title: 'فحص الجهد العالي', desc: 'تشخيص دقيق للكابلات والمحطات باستخدام أحدث تقنيات VLF و PD.', icon: Zap },
          { title: 'إدارة القوى العاملة', desc: 'فرق هندسية وفنية مدربة على أعلى مستوى وجاهزة للانتشار الفوري.', icon: Users },
          { title: 'المشاريع الذكية', desc: 'لوحات تحكم رقمية تمنحك رؤية شاملة وسيطرة كاملة على سير العمل.', icon: LayoutDashboard },
        ]
      },
      projects: {
        title: 'أعمالنا ومشاريعنا',
        subtitle: 'فخورون بتنفيذ مشاريع استراتيجية تخدم البنية التحتية',
        items: [
          { name: 'محطة نيوم الرئيسية', cat: 'طاقة وبنية تحتية', loc: 'نيوم', status: 'مكتمل' },
          { name: 'صيانة الشبكة الوطنية', cat: 'عقود تشغيل', loc: 'الرياض', status: 'جاري' },
          { name: 'مشروع البحر الأحمر', cat: 'تمديدات كابلات', loc: 'البحر الأحمر', status: 'قيد التنفيذ' },
          { name: 'المدينة الصناعية', cat: 'أنظمة تحكم', loc: 'الجبيل', status: 'جديد' },
        ]
      },
      tech: {
        tag: 'نواة التكنولوجيا',
        title: 'البيانات تقود القرار الميداني',
        items: [
          { icon: Server, label: 'ERP سحابي', sub: 'آمن وقابل للتوسع' },
          { icon: Lock, label: 'أمن سيبراني', sub: 'معايير عسكرية' },
          { icon: Activity, label: 'مراقبة لحظية', sub: 'تتبع مباشر' },
          { icon: BarChart3, label: 'تحليلات', sub: 'مدعومة بالذكاء الاصطناعي' },
        ]
      },
      footer: {
        rights: '© 2026 منصة GMS. جميع الحقوق محفوظة.',
        links: { privacy: 'الخصوصية', terms: 'الشروط', contact: 'اتصل بنا' }
      }
    },
    en: {
      nav: { 
        services: 'Services', 
        projects: 'Projects', 
        tech: 'Technology', 
        about: 'About',
        portal: 'Employee Portal',
        currentLang: 'English'
      },
      hero: {
        badge: 'Vision 2030 | Strategic Partner',
        title1: 'Engineering Future',
        title2: '& Industrial AI',
        desc: 'GMS Platform for integrated industrial solutions. We combine human expertise with digital analytics to manage infrastructure and major projects.',
        cta1: 'Explore Services',
        cta2: 'Contact Us',
        liveOps: 'Live Operations',
        efficiency: 'Efficiency'
      },
      stats: [
        { val: '+100', label: 'Gov Projects' },
        { val: '99.9%', label: 'Operational Accuracy' },
        { val: '24/7', label: 'Eng. Support' },
        { val: 'ISO', label: 'Global Standards' },
      ],
      services: {
        title: 'Solutions Beyond Expectations',
        items: [
          { title: 'High Voltage Testing', desc: 'Precise diagnostics using cutting-edge VLF & PD technologies.', icon: Zap },
          { title: 'Workforce Management', desc: 'Elite engineering teams ready for immediate deployment.', icon: Users },
          { title: 'Smart Projects', desc: 'Digital dashboards giving you total visibility and control.', icon: LayoutDashboard },
        ]
      },
      projects: {
        title: 'Our Projects & Portfolio',
        subtitle: 'Proudly executing strategic infrastructure projects',
        items: [
          { name: 'NEOM Main Substation', cat: 'Energy & Infra', loc: 'NEOM', status: 'Completed' },
          { name: 'National Grid Maint.', cat: 'O&M Contracts', loc: 'Riyadh', status: 'Ongoing' },
          { name: 'Red Sea Project', cat: 'Cable Laying', loc: 'Red Sea', status: 'In Progress' },
          { name: 'Industrial City', cat: 'Control Systems', loc: 'Jubail', status: 'New' },
        ]
      },
      tech: {
        tag: 'Technology Core',
        title: 'Data-Driven Field Decisions',
        items: [
          { icon: Server, label: 'Cloud ERP', sub: 'Secure & Scalable' },
          { icon: Lock, label: 'Cyber Security', sub: 'Military Grade' },
          { icon: Activity, label: 'Real-time', sub: 'Monitoring' },
          { icon: BarChart3, label: 'Analytics', sub: 'AI Powered' },
        ]
      },
      footer: {
        rights: '© 2026 GMS Platform. All rights reserved.',
        links: { privacy: 'Privacy', terms: 'Terms', contact: 'Contact' }
      }
    },
    ur: {
      nav: { 
        services: 'خدمات', 
        projects: 'منصوبے', 
        tech: 'ٹیکنالوجی', 
        about: 'ہمارے بارے میں',
        portal: 'ملازم پورٹل',
        currentLang: 'اردو'
      },
      hero: {
        badge: 'ویژن 2030 | اسٹریٹجک پارٹنر',
        title1: 'مستقبل کی انجینئرنگ',
        title2: 'اور صنعتی ذہانت',
        desc: 'GMS پلیٹ فارم مربوط صنعتی حل کے لیے۔ ہم انسانی مہارت کو ڈیجیٹل تجزیات کے ساتھ ملا کر بنیادی ڈھانچے اور بڑے منصوبوں کا انتظام کرتے ہیں۔',
        cta1: 'خدمات دیکھیں',
        cta2: 'ہم سے رابطہ کریں',
        liveOps: 'براہ راست آپریشنز',
        efficiency: 'کارکردگی'
      },
      stats: [
        { val: '+100', label: 'حکومتی پروجیکٹس' },
        { val: '99.9%', label: 'آپریشنل درستگی' },
        { val: '24/7', label: 'انجینئرنگ سپورٹ' },
        { val: 'ISO', label: 'عالمی معیارات' },
      ],
      services: {
        title: 'توقعات سے بڑھ کر حل',
        items: [
          { title: 'ہائی وولٹیج ٹیسٹنگ', desc: 'جدید ترین VLF اور PD ٹیکنالوجیز کا استعمال کرتے ہوئے درست تشخیص۔', icon: Zap },
          { title: 'ورک فورس مینجمنٹ', desc: 'فوری تعیناتی کے لیے تیار اعلیٰ تربیت یافتہ انجینئرنگ ٹیمیں۔', icon: Users },
          { title: 'اسمارٹ پروجیکٹس', desc: 'ڈیجیٹل ڈیش بورڈز آپ کو کام کے بہاؤ پر مکمل کنٹرول فراہم کرتے ہیں۔', icon: LayoutDashboard },
        ]
      },
      projects: {
        title: 'ہمارے پروجیکٹس',
        subtitle: 'اسٹریٹجک انفراسٹرکچر منصوبوں پر عمل درآمد پر فخر ہے',
        items: [
          { name: 'نیوم مین سب اسٹیشن', cat: 'توانائی', loc: 'نیوم', status: 'مکمل' },
          { name: 'نیشنل گرڈ کی دیکھ بھال', cat: 'دیکھ بھال', loc: 'ریاض', status: 'جاری' },
          { name: 'ریڈ سی پروجیکٹ', cat: 'کیبلز', loc: 'ریڈ سی', status: 'جاری ہے' },
          { name: 'انڈسٹریل سٹی', cat: 'سسٹمز', loc: 'جبیل', status: 'نیا' },
        ]
      },
      tech: {
        tag: 'ٹیکنالوجی کور',
        title: 'ڈیٹا پر مبنی فیصلے',
        items: [
          { icon: Server, label: 'کلاؤڈ ERP', sub: 'محفوظ' },
          { icon: Lock, label: 'سائبر سیکیورٹی', sub: 'فوجی معیار' },
          { icon: Activity, label: 'ریئل ٹائم', sub: 'نگرانی' },
          { icon: BarChart3, label: 'تجزیات', sub: 'AI پاورڈ' },
        ]
      },
      footer: {
        rights: '© 2026 GMS پلیٹ فارم۔ جملہ حقوق محفوظ ہیں۔',
        links: { privacy: 'رازداری', terms: 'شرائط', contact: 'رابطہ کریں' }
      }
    }
  }[lang];

  if (!mounted) return <div className="min-h-screen bg-slate-900"></div>;

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500 selection:text-white transition-colors duration-500 overflow-x-hidden ${isRTL ? 'dir-rtl' : 'dir-ltr'} ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* --- Navbar --- */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'h-20 bg-opacity-90 backdrop-blur-xl border-b' : 'h-28 bg-transparent border-transparent'} ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          
          {/* 1. الشعار واسم الشركة */}
          <Link href="/" className="flex items-center gap-4 group">
            <img src="/logo.png" alt="GMS" className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xl" />
            <div className={`flex flex-col ${scrolled ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-all duration-300`}>
              <span className={`font-black tracking-tighter leading-none text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>GMS</span>
              <span className={`text-[10px] font-bold tracking-widest uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Platform</span>
            </div>
          </Link>

          {/* 2. روابط الأقسام (تمت استعادتها) */}
          <div className="hidden lg:flex items-center gap-8 font-bold text-sm">
            <Link href="#services" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{content.nav.services}</Link>
            <Link href="#projects" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{content.nav.projects}</Link>
            <Link href="#tech" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{content.nav.tech}</Link>
            <Link href="#about" className={`hover:text-blue-500 transition ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{content.nav.about}</Link>
          </div>

          {/* 3. الأدوات (لغة، ثيم، دخول) */}
          <div className="flex items-center gap-3">
            
            {/* زر الثيم */}
            <button onClick={toggleTheme} className={`p-3 rounded-full transition-all duration-300 ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* 4. قائمة اللغة المنسدلة */}
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Globe className="w-3 h-3"/> {content.nav.currentLang} <ChevronDown className="w-3 h-3"/>
              </button>
              
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full mt-2 w-32 rounded-xl shadow-xl border overflow-hidden p-1 z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${isRTL ? 'left-0' : 'right-0'}`}
                  >
                    {['ar', 'en', 'ur'].map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLang(l as any); setIsLangOpen(false); }}
                        className={`w-full text-start px-4 py-2 rounded-lg text-sm font-bold transition-colors ${lang === l ? 'bg-blue-600 text-white' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {l === 'ar' ? 'العربية' : l === 'en' ? 'English' : 'اردو'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/login" className={`hidden md:flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 shadow-lg ${isDark ? 'bg-white text-slate-900 hover:bg-blue-50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              <LayoutDashboard size={18} /> <span className="hidden lg:inline">{content.nav.portal}</span>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* --- Hero Section --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-30' : 'opacity-10'}`}>
           <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center scale-105 animate-slow-zoom"></div>
           <div className={`absolute inset-0 bg-gradient-to-b ${isDark ? 'from-slate-950 via-slate-950/80 to-slate-950' : 'from-white via-white/80 to-white'}`}></div>
        </div>

        {/* Watermark Logo */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] opacity-[0.04] pointer-events-none z-0 ${isDark ? 'invert-0' : 'invert'}`}>
            <img src="/logo.png" alt="Watermark" className="w-full h-full object-contain" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-start">
            <FadeIn>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 backdrop-blur-md ${isDark ? 'bg-slate-900/50 border-slate-700 text-blue-400' : 'bg-white/80 border-slate-200 text-blue-700'}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wider">{content.hero.badge}</span>
              </div>
            </FadeIn>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[1.1] ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {content.hero.title1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 animate-gradient-x">
                {content.hero.title2}
              </span>
            </motion.h1>

            <FadeIn delay={0.4}>
              <p className={`text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {content.hero.desc}
              </p>
            </FadeIn>

            <FadeIn delay={0.6}>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="#services" className={`group w-full sm:w-auto px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-105 ${isDark ? 'bg-white text-slate-950 hover:bg-blue-50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                  {content.hero.cta1} <DirectionalArrow className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
                </Link>
                <Link href="#contact" className={`group w-full sm:w-auto px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-md border ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
                  <Phone className="w-5 h-5" /> {content.hero.cta2}
                </Link>
              </div>
            </FadeIn>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative hidden lg:block perspective-1000"
          >
             <div className={`relative rounded-[2.5rem] overflow-hidden border p-3 shadow-2xl transition-all duration-500 hover:rotate-1 hover:scale-[1.02] ${isDark ? 'border-slate-800 bg-slate-900/50 shadow-blue-900/20' : 'border-slate-100 bg-white shadow-slate-200'}`}>
                <div className="relative rounded-[2rem] overflow-hidden h-[500px] w-full">
                  <img src="/industrial-ops.jpg" alt="Operations" className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-slate-950/90' : 'from-white/90'} via-transparent to-transparent`}></div>
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className={`absolute bottom-8 left-8 right-8 p-6 rounded-2xl border backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/50'}`}
                  >
                    <div className="flex justify-between items-end">
                      <div>
                        <p className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>System Status</p>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.hero.liveOps}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>99.8%</p>
                        <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{content.hero.efficiency}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* --- Projects Section --- */}
      <section id="projects" className={`py-32 relative overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-20">
              <span className={`text-xs font-bold uppercase tracking-widest mb-4 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Portfolio</span>
              <h2 className={`text-3xl md:text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {content.projects.title}
              </h2>
              <p className={`mt-4 text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{content.projects.subtitle}</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.projects.items.map((proj, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className={`group relative h-96 rounded-3xl overflow-hidden border cursor-pointer transition-all duration-500 hover:shadow-2xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110`} style={{ backgroundImage: "url('/industrial-ops.jpg')" }}></div>
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-slate-950 via-slate-900/50 to-transparent' : 'from-slate-900/90 via-slate-900/40 to-transparent'}`}></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded bg-blue-600 text-white`}>{proj.cat}</span>
                      <span className={`text-[10px] font-bold text-slate-300 flex items-center gap-1`}><MapPin size={10}/> {proj.loc}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 leading-tight">{proj.name}</h3>
                    <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                       <div className="flex justify-between items-center text-slate-300 text-xs font-bold pt-3 border-t border-white/20 mt-3">
                          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400"/> {proj.status}</span>
                          <ArrowLeft className={`w-4 h-4 text-white ${isRTL ? '' : 'rotate-180'}`}/>
                       </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- Services Section --- */}
      <section id="services" className={`py-32 relative ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <h2 className={`text-3xl md:text-5xl font-black text-center mb-20 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {content.services.title}
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {content.services.items.map((item, i) => (
              <FadeIn key={i} delay={i * 0.2}>
                <SpotlightCard isDark={isDark} className="h-full">
                  <div className="p-8 h-full flex flex-col relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-colors ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <item.icon size={32} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.title}
                    </h3>
                    <p className={`text-lg leading-relaxed mb-8 flex-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.desc}
                    </p>
                    <div className={`w-full h-1 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="h-full w-1/3 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                </SpotlightCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className={`py-12 border-t ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="GMS" className="h-8 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
            <span className={`font-bold text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{content.footer.rights}</span>
          </div>
          <div className={`flex gap-6 text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <Link href="#" className="hover:text-blue-500 transition-colors">{content.footer.links.privacy}</Link>
            <Link href="#" className="hover:text-blue-500 transition-colors">{content.footer.links.contact}</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}