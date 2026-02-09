'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Zap, Users, 
  LayoutDashboard, Phone, HardHat, ChevronRight, ChevronLeft,
  Globe, Activity, CheckCircle2, Factory, Server, Sun, Moon
} from 'lucide-react';

export default function Home() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isDark, setIsDark] = useState(false); // حالة الثيم (false = فاتح، true = داكن)

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const toggleTheme = () => setIsDark(prev => !prev); // دالة التبديل
  
  const isRTL = lang === 'ar';
  
  // Dynamic Icons based on direction
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;
  const DirectionalChevron = isRTL ? ChevronLeft : ChevronRight;

  const t = {
    ar: {
      nav: {
        services: 'الخدمات والحلول',
        tech: 'التقنية والابتكار',
        about: 'عن الشركة',
        projects: 'المشاريع',
        login: 'بوابة الموظفين',
        contact: 'اتصل بنا'
      },
      hero: {
        badge: 'شريك استراتيجي للمشاريع الحكومية',
        title1: 'هندسة',
        title2: 'المستقبل الصناعي',
        desc: 'نقدم حلولاً متكاملة للبنية التحتية الكهربائية، إدارة القوى العاملة، والتشغيل الميداني الذكي. دقة، كفاءة، وموثوقية تعتمد عليها كبرى القطاعات.',
        cta1: 'اكتشف خدماتنا',
        cta2: 'بدء شراكة',
        liveOps: 'عمليات مباشرة',
        efficiency: 'الكفاءة'
      },
      services: {
        title: 'منظومة الخدمات المتكاملة',
        sub: 'نحول التحديات الصناعية المعقدة إلى عمليات سلسة ومضبوطة بأعلى المعايير.',
        viewAll: 'عرض جميع الخدمات',
        s1_title: 'فحص الجهد العالي والكابلات',
        s1_desc: 'اختبارات دقيقة، كشف أعطال، وصيانة وقائية للبنية التحتية الكهربائية لضمان استمرارية الطاقة دون انقطاع.',
        s2_title: 'حلول القوى العاملة الماهرة',
        s2_desc: 'توريد وإدارة كوادر هندسية وفنية مؤهلة ومعتمدة لتنفيذ المشاريع وفق الجداول الزمنية المحددة بصرامة.',
        s3_title: 'إدارة المشاريع الصناعية',
        s3_desc: 'منظومة إدارة رقمية متكاملة تضمن الامتثال، السلامة، والجودة من التخطيط وحتى التسليم النهائي.',
        features: {
          vlf: 'اختبار VLF',
          pd: 'تفريغ جزئي',
          certified: 'مهندسين معتمدين',
          emergency: 'فرق طوارئ 24/7',
          reports: 'تقارير لحظية',
          risk: 'إدارة المخاطر'
        }
      },
      tech: {
        tag: 'التحول الرقمي',
        title: 'البيانات تقود القرار الميداني',
        desc: 'نستخدم أحدث تقنيات الـ ERP والذكاء الاصطناعي لمراقبة الأداء لحظياً. لا مكان للتخمين؛ كل قرار مبني على بيانات دقيقة ومباشرة من الموقع.',
        stat1: 'تتبع الأصول',
        stat2: 'حوادث تأخير',
        network: 'حالة الشبكة',
        stable: 'مستقرة'
      },
      trust: {
        title: 'شركاء النجاح والثقة'
      },
      cta: {
        title: 'التميز التشغيلي يبدأ من هنا',
        desc: 'دعنا نناقش كيف يمكن لخبراتنا وتقنياتنا أن ترفع كفاءة مشروعك القادم إلى مستويات قياسية. فريقنا الهندسي جاهز للبدء.',
        btn1: 'جدولة اجتماع',
        btn2: 'تصفح ملف الشركة'
      },
      footer: {
        desc: 'الذكاء الصناعي والعمليات.',
        rights: '© 2026 منصة GMS. جميع الحقوق محفوظة.',
        links: ['لينكد إن', 'تويتر', 'اتصل بنا']
      }
    },
    en: {
      nav: {
        services: 'Services & Solutions',
        tech: 'Tech & Innovation',
        about: 'About Us',
        projects: 'Projects',
        login: 'Employee Portal',
        contact: 'Contact Us'
      },
      hero: {
        badge: 'Strategic Partner for Government Projects',
        title1: 'Engineering the',
        title2: 'Industrial Future',
        desc: 'Integrated solutions for electrical infrastructure, workforce management, and smart field operations. Precision, efficiency, and reliability for major sectors.',
        cta1: 'Discover Services',
        cta2: 'Start Partnership',
        liveOps: 'Live Operations',
        efficiency: 'Efficiency'
      },
      services: {
        title: 'Integrated Service Ecosystem',
        sub: 'Transforming complex industrial challenges into seamless, strictly controlled operations.',
        viewAll: 'View All Services',
        s1_title: 'High Voltage & Cable Testing',
        s1_desc: 'Precise testing, fault detection, and preventive maintenance for electrical infrastructure to ensure uninterrupted power.',
        s2_title: 'Skilled Workforce Solutions',
        s2_desc: 'Supplying and managing qualified engineering and technical staff to execute projects within strict timelines.',
        s3_title: 'Industrial Project Management',
        s3_desc: 'A complete digital management system ensuring compliance, safety, and quality from planning to final delivery.',
        features: {
          vlf: 'VLF Testing',
          pd: 'Partial Discharge',
          certified: 'Certified Engineers',
          emergency: '24/7 Emergency Teams',
          reports: 'Real-time Reports',
          risk: 'Risk Management'
        }
      },
      tech: {
        tag: 'Digital Transformation',
        title: 'Data-Driven Field Decisions',
        desc: 'We utilize cutting-edge ERP and AI technologies to monitor performance in real-time. No guesswork; every decision is based on accurate, direct site data.',
        stat1: 'Asset Tracking',
        stat2: 'Delay Incidents',
        network: 'Network Status',
        stable: 'Stable'
      },
      trust: {
        title: 'Trusted Partners'
      },
      cta: {
        title: 'Operational Excellence Starts Here',
        desc: 'Let’s discuss how our expertise and technology can elevate your next project’s efficiency to standard-setting levels. Our engineering team is ready.',
        btn1: 'Schedule Meeting',
        btn2: 'View Company Profile'
      },
      footer: {
        desc: 'Industrial Intelligence & Operations.',
        rights: '© 2026 GMS Platform. All rights reserved.',
        links: ['LinkedIn', 'Twitter', 'Contact']
      }
    }
  };

  const content = t[lang];

  return (
    <div 
      className={`min-h-screen font-sans transition-colors duration-300 selection:bg-blue-600 selection:text-white overflow-x-hidden ${isRTL ? 'dir-rtl' : 'dir-ltr'} ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`} 
      dir={isRTL ? 'rtl' : 'ltr'}
    >

      {/* --- Navbar --- */}
      <nav className={`fixed w-full z-50 backdrop-blur-md border-b transition-colors duration-300 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-slate-100 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 group cursor-pointer">
            <img 
              src="/logo.png" 
              alt="GMS Logo" 
              className="h-10 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
            <div className="hidden sm:flex flex-col">
                <span className={`text-lg font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>GMS Platform</span>
                <span className={`text-[9px] font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Industrial Solutions</span>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className={`hidden lg:flex items-center gap-8 text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <Link href="#services" className="hover:text-blue-500 transition-colors">{content.nav.services}</Link>
            <Link href="#technology" className="hover:text-blue-500 transition-colors">{content.nav.tech}</Link>
            <Link href="#about" className="hover:text-blue-500 transition-colors">{content.nav.about}</Link>
            <Link href="#projects" className="hover:text-blue-500 transition-colors">{content.nav.projects}</Link>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Language Toggle */}
            <button 
              onClick={toggleLang} 
              className={`flex items-center gap-2 font-bold transition px-3 py-2 rounded-lg border text-sm ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800 border-transparent hover:border-slate-700' : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50 border-transparent hover:border-slate-200'}`}
            >
               <Globe size={16} /> {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            <Link 
              href="/login" 
              className={`hidden md:flex items-center gap-2 font-bold transition px-4 py-2 rounded-lg ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{content.nav.login}</span>
            </Link>
            
            <Link 
              href="#contact" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center gap-2 group"
            >
              <span className="hidden sm:inline">{content.nav.contact}</span> 
              <span className="sm:hidden"><Phone size={16}/></span>
              <DirectionalChevron className="hidden sm:block w-4 h-4 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className={`relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950' : 'bg-gradient-to-b from-slate-50 via-white to-white'}`}>
        
        {/* Background Blobs (Adjusted opacity for themes) */}
        <div className={`absolute top-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] ${isRTL ? '-left-20' : '-right-20'} ${isDark ? 'opacity-10 bg-blue-600/20' : 'opacity-100'}`}></div>
        <div className={`absolute bottom-0 w-[500px] h-[500px] bg-cyan-100/40 rounded-full blur-[100px] ${isRTL ? '-right-20' : '-left-20'} ${isDark ? 'opacity-10 bg-cyan-500/10' : 'opacity-100'}`}></div>

        {/* Dark Mode Specific Background Image Overlay */}
        {isDark && <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20"></div>}

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <div className="text-center lg:text-start">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider mb-8 shadow-sm ${isDark ? 'bg-slate-900/50 border-slate-700 text-blue-400 backdrop-blur-sm' : 'bg-white border-slate-200 text-blue-600'}`}>
              <ShieldCheck className="w-4 h-4" /> {content.hero.badge}
            </div>

            <h1 className={`text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[1.1] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {content.hero.title1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                {content.hero.title2}
              </span>
            </h1>

            <p className={`text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {content.hero.desc}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="#services" className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl ${isDark ? 'bg-white text-slate-950 hover:bg-blue-50' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'}`}>
                {content.hero.cta1} <DirectionalArrow className="w-5 h-5" />
              </Link>
              <Link href="#contact" className={`w-full sm:w-auto px-8 py-4 border rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${isDark ? 'bg-slate-900/50 text-white border-slate-700 hover:border-blue-500 hover:bg-blue-900/20' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Activity className="w-5 h-5" /> {content.hero.cta2}
              </Link>
            </div>
          </div>

          {/* Visual Element (Right Side) */}
          <div className="relative mt-10 lg:mt-0">
             <div className={`relative rounded-3xl overflow-hidden border shadow-2xl group p-2 ${isDark ? 'border-slate-800 shadow-blue-900/20 bg-transparent' : 'border-slate-100 shadow-slate-200 bg-white'}`}>
                <div className={`absolute inset-0 z-10 ${isDark ? 'bg-gradient-to-t from-slate-950 via-transparent to-transparent' : ''}`}></div>
                <img 
                    src="/industrial-ops.jpg" 
                    alt="Industrial Operations" 
                    className={`w-full h-[400px] md:h-[500px] lg:h-[600px] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700 ${isDark ? 'opacity-80' : ''}`}
                />
                
                {/* Floating Card */}
                <div className={`absolute bottom-8 z-20 backdrop-blur-md p-6 rounded-2xl border shadow-xl w-64 ${isRTL ? 'right-8' : 'left-8'} ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/90 border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{content.hero.liveOps}</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-400'}>{content.hero.efficiency}</span>
                            <span className={isDark ? 'text-white' : 'text-slate-900'}>98.4%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <div className="h-full bg-blue-600 w-[98%]"></div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- Services Section --- */}
      <section id="services" className={`py-24 relative transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 text-center md:text-start">
            <div>
                <h2 className={`text-3xl md:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.services.title}</h2>
                <p className={`text-lg max-w-lg mx-auto md:mx-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{content.services.sub}</p>
            </div>
            <Link href="/services" className={`font-bold flex items-center justify-center gap-2 transition-colors px-5 py-3 rounded-xl border shadow-sm ${isDark ? 'text-blue-400 hover:text-white border-slate-700 hover:bg-slate-800 bg-transparent' : 'text-blue-600 hover:text-blue-800 bg-white border-slate-200'}`}>
                {content.services.viewAll} <DirectionalArrow className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className={`group p-8 rounded-3xl border transition-all duration-300 hover:shadow-xl ${isDark ? 'bg-slate-950 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-blue-900/5'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDark ? 'bg-slate-900 border border-slate-800 text-blue-500 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                <Zap className="w-7 h-7" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.services.s1_title}</h3>
              <p className={`leading-relaxed mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {content.services.s1_desc}
              </p>
              <ul className={`space-y-2 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <li className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}><CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-blue-500' : 'text-green-500'}`}/> {content.services.features.vlf}</li>
                <li className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}><CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-blue-500' : 'text-green-500'}`}/> {content.services.features.pd}</li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className={`group p-8 rounded-3xl border transition-all duration-300 hover:shadow-xl ${isDark ? 'bg-slate-950 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-blue-900/5'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDark ? 'bg-slate-900 border border-slate-800 text-blue-500 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                <Users className="w-7 h-7" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.services.s2_title}</h3>
              <p className={`leading-relaxed mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {content.services.s2_desc}
              </p>
              <ul className={`space-y-2 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <li className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}><CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-blue-500' : 'text-green-500'}`}/> {content.services.features.certified}</li>
                <li className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}><CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-blue-500' : 'text-green-500'}`}/> {content.services.features.emergency}</li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className={`group p-8 rounded-3xl border transition-all duration-300 hover:shadow-xl ${isDark ? 'bg-slate-950 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-blue-900/5'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDark ? 'bg-slate-900 border border-slate-800 text-blue-500 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                <HardHat className="w-7 h-7" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.services.s3_title}</h3>
              <p className={`leading-relaxed mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {content.services.s3_desc}
              </p>
              <ul className={`space-y-2 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <li className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}><CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-blue-500' : 'text-green-500'}`}/> {content.services.features.reports}</li>
                <li className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}><CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-blue-500' : 'text-green-500'}`}/> {content.services.features.risk}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Technology & Data Section --- */}
      <section className={`py-24 relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        {isDark && <div className="absolute inset-0 bg-[url('/tech-bg.jpg')] bg-cover bg-fixed opacity-5"></div>}
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2 text-center lg:text-start">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase mb-6 ${isDark ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        <Server className="w-4 h-4"/> {content.tech.tag}
                    </div>
                    <h2 className={`text-3xl md:text-5xl font-black mb-6 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {content.tech.title}
                    </h2>
                    <p className={`text-lg mb-8 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {content.tech.desc}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-blue-600'}`}>100%</div>
                            <div className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{content.tech.stat1}</div>
                        </div>
                        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>0</div>
                            <div className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{content.tech.stat2}</div>
                        </div>
                    </div>
                </div>
                
                <div className="lg:w-1/2 w-full">
                    <div className={`relative border rounded-2xl p-2 shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 shadow-blue-900/20' : 'bg-white border-slate-200 shadow-slate-200'}`}>
                        <div className={`absolute -top-10 w-40 h-40 bg-blue-600 rounded-full blur-[60px] ${isDark ? 'opacity-30' : 'opacity-70'} ${isRTL ? '-right-10' : '-left-10'}`}></div>
                        <img 
                            src="/dashboard-preview.jpg" 
                            alt="Dashboard" 
                            className={`rounded-xl w-full h-auto shadow-sm ${isDark ? 'opacity-90' : ''}`}
                        />
                        {/* Floating Cards */}
                        <div className={`absolute top-10 backdrop-blur border p-4 rounded-xl shadow-lg w-40 animate-bounce-slow ${isRTL ? 'left-6' : 'right-6'} ${isDark ? 'bg-slate-800/90 border-slate-600' : 'bg-white/95 border-slate-100'}`}>
                            <div className="text-xs text-slate-400 mb-1">{content.tech.network}</div>
                            <div className="text-green-400 font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> {content.tech.stable}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- Partners / Trust --- */}
      <section className={`py-20 border-t ${isDark ? 'border-slate-900 bg-slate-950' : 'border-slate-100 bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
            <p className={`font-bold text-xs uppercase tracking-widest mb-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{content.trust.title}</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <div className={`text-xl md:text-2xl font-black flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}><Factory className="w-6 h-6 md:w-8 md:h-8"/> INDUSTRIAL</div>
                <div className={`text-xl md:text-2xl font-black flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}><Globe className="w-6 h-6 md:w-8 md:h-8"/> GLOBAL CORP</div>
                <div className={`text-xl md:text-2xl font-black flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}><Zap className="w-6 h-6 md:w-8 md:h-8"/> ENERGY CO</div>
                <div className={`text-xl md:text-2xl font-black flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}><ShieldCheck className="w-6 h-6 md:w-8 md:h-8"/> GOV SECURE</div>
            </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section id="contact" className="py-24 bg-blue-900 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? 'from-blue-900/50 to-transparent' : 'from-blue-900 to-slate-900 opacity-90'}`}></div>
        {isDark && <div className="absolute inset-0 bg-slate-950/80"></div>}
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">{content.cta.title}</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            {content.cta.desc}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="px-10 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2">
              {content.cta.btn1} <DirectionalChevron className="w-5 h-5"/>
            </Link>
            <Link href="/services" className="px-10 py-4 bg-transparent border border-blue-400/50 text-white rounded-xl font-bold text-lg hover:bg-blue-800/50 transition-all">
              {content.cta.btn2}
            </Link>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className={`py-12 border-t ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-start">
          <div>
            <div className={`text-xl font-black flex items-center justify-center md:justify-start gap-2 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <img 
                src="/logo.png" 
                alt="GMS Logo" 
                className="w-8 h-8 object-contain" 
              />
              GMS Platform
            </div>
            <p className="text-slate-500 text-sm">{content.footer.desc}</p>
          </div>
          
          <div className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {content.footer.rights}
          </div>
          
          <div className="flex gap-6 text-sm font-bold">
            {content.footer.links.map((link, i) => (
                <a key={i} href="#" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-600'} transition-colors`}>{link}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}