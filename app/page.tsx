'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Zap, Users, 
  LayoutDashboard, Phone, HardHat, ChevronRight, ChevronLeft,
  Globe, Activity, CheckCircle2, Factory, Server
} from 'lucide-react';

export default function Home() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
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
    <div className={`min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-blue-500 selection:text-white overflow-x-hidden ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* --- Navbar (Glassmorphism) --- */}
      <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          
          <div className="flex items-center gap-3 group cursor-pointer">
            {/* ✅ تم استبدال الشعار بصورتك */}
            <img 
              src="/logo.png" 
              alt="GMS Logo" 
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tight leading-none">GMS Platform</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Industrial Solutions</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-sm font-bold text-slate-300">
            <Link href="#services" className="hover:text-blue-400 transition-colors">{content.nav.services}</Link>
            <Link href="#technology" className="hover:text-blue-400 transition-colors">{content.nav.tech}</Link>
            <Link href="#about" className="hover:text-blue-400 transition-colors">{content.nav.about}</Link>
            <Link href="#projects" className="hover:text-blue-400 transition-colors">{content.nav.projects}</Link>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="flex items-center gap-2 text-slate-300 hover:text-white font-bold transition px-3 py-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800">
               <Globe size={16} /> {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <Link 
              href="/login" 
              className="hidden md:flex items-center gap-2 text-slate-300 hover:text-white font-bold transition px-4 py-2 rounded-lg hover:bg-slate-900"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{content.nav.login}</span>
            </Link>
            <Link 
              href="#contact" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/50 hover:shadow-blue-500/30 flex items-center gap-2 group"
            >
              {content.nav.contact} <DirectionalChevron className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section (Cinematic) --- */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
        {/* ✅ تم استبدال صورة الخلفية بصورتك */}
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950"></div>
        
        {/* Light Beams */}
        <div className={`absolute top-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] animate-pulse ${isRTL ? 'left-1/4' : 'right-1/4'}`}></div>
        <div className={`absolute bottom-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] ${isRTL ? 'right-1/4' : 'left-1/4'}`}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4" /> {content.hero.badge}
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-8 leading-[1.1]">
              {content.hero.title1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-white">
                {content.hero.title2}
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-xl leading-relaxed mb-10 font-medium">
              {content.hero.desc}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="#services" className="w-full sm:w-auto px-10 py-4 bg-white text-slate-950 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                {content.hero.cta1} <DirectionalArrow className="w-5 h-5" />
              </Link>
              <Link href="#contact" className="w-full sm:w-auto px-10 py-4 bg-slate-900/50 text-white border border-slate-700 rounded-xl font-bold hover:border-blue-500 hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                <Activity className="w-5 h-5" /> {content.hero.cta2}
              </Link>
            </div>
          </div>

          {/* Visual Element (Right Side) - ✅ تم استبدال الصورة الجانبية بصورتك */}
          <div className="relative hidden lg:block">
             <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-blue-900/20 group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
                <img 
                    src="/industrial-ops.jpg" 
                    alt="Industrial Operations" 
                    className="w-full h-[600px] object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Live Data Overlay */}
                <div className={`absolute bottom-8 z-20 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 w-64 ${isRTL ? 'right-8' : 'left-8'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-300 uppercase">{content.hero.liveOps}</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-400">{content.hero.efficiency}</span>
                            <span className="text-white">98.4%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[98%]"></div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- Services Section (Systems) --- */}
      <section id="services" className="py-32 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
            <div>
                <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">{content.services.title}</h2>
                <p className="text-slate-400 text-lg max-w-lg">{content.services.sub}</p>
            </div>
            <Link href="/services" className="text-blue-400 hover:text-white font-bold flex items-center gap-2 transition-colors">
                {content.services.viewAll} <DirectionalArrow className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="group relative bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 border border-slate-800 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
                <Zap className="w-7 h-7 text-blue-500 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{content.services.s1_title}</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                {content.services.s1_desc}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {content.services.features.vlf}</li>
                <li className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {content.services.features.pd}</li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="group relative bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 border border-slate-800 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
                <Users className="w-7 h-7 text-blue-500 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{content.services.s2_title}</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                {content.services.s2_desc}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {content.services.features.certified}</li>
                <li className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {content.services.features.emergency}</li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="group relative bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 border border-slate-800 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
                <HardHat className="w-7 h-7 text-blue-500 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{content.services.s3_title}</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                {content.services.s3_desc}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {content.services.features.reports}</li>
                <li className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {content.services.features.risk}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Technology & Data Section --- */}
      <section className="py-32 bg-slate-950 relative overflow-hidden">
        {/* ✅ تم استبدال صورة الخلفية بصورتك */}
        <div className="absolute inset-0 bg-[url('/tech-bg.jpg')] bg-cover bg-fixed opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-bold uppercase mb-6">
                        <Server className="w-4 h-4"/> {content.tech.tag}
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight">
                        {content.tech.title}
                    </h2>
                    <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                        {content.tech.desc}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                            <div className="text-3xl font-black text-white mb-1">100%</div>
                            <div className="text-sm text-slate-500 font-bold">{content.tech.stat1}</div>
                        </div>
                        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                            <div className="text-3xl font-black text-white mb-1">0</div>
                            <div className="text-sm text-slate-500 font-bold">{content.tech.stat2}</div>
                        </div>
                    </div>
                </div>
                
                <div className="lg:w-1/2">
                    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-blue-900/20">
                        <div className={`absolute -top-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-30 ${isRTL ? '-right-10' : '-left-10'}`}></div>
                        {/* ✅ تم استبدال صورة الداشبورد بصورتك */}
                        <img 
                            src="/dashboard-preview.jpg" 
                            alt="Dashboard" 
                            className="rounded-xl w-full h-auto opacity-90"
                        />
                        {/* Floating Cards */}
                        <div className={`absolute top-10 bg-slate-800/90 backdrop-blur border border-slate-600 p-4 rounded-xl shadow-xl w-48 animate-bounce-slow ${isRTL ? 'left-10' : 'right-10'}`}>
                            <div className="text-xs text-slate-400 mb-1">{content.tech.network}</div>
                            <div className="text-green-400 font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> {content.tech.stable}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- Partners / Trust --- */}
      <section className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-10">{content.trust.title}</p>
            <div className="flex flex-wrap justify-center gap-12 lg:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="text-2xl font-black text-slate-400 flex items-center gap-2"><Factory className="w-8 h-8"/> INDUSTRIAL</div>
                <div className="text-2xl font-black text-slate-400 flex items-center gap-2"><Globe className="w-8 h-8"/> GLOBAL CORP</div>
                <div className="text-2xl font-black text-slate-400 flex items-center gap-2"><Zap className="w-8 h-8"/> ENERGY CO</div>
                <div className="text-2xl font-black text-slate-400 flex items-center gap-2"><ShieldCheck className="w-8 h-8"/> GOV SECURE</div>
            </div>
        </div>
      </section>

      {/* --- CTA Section (Executive) --- */}
      <section id="contact" className="py-32 bg-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-5xl font-black text-white mb-8 leading-tight">{content.cta.title}</h2>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            {content.cta.desc}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/contact" className="px-12 py-5 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2">
              {content.cta.btn1} <DirectionalChevron className="w-5 h-5"/>
            </Link>
            <Link href="/services" className="px-12 py-5 bg-transparent border border-blue-400 text-white rounded-xl font-bold text-lg hover:bg-blue-800 transition-all">
              {content.cta.btn2}
            </Link>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-slate-950 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="text-2xl font-black text-white flex items-center gap-2 mb-2">
              {/* ✅ تم استبدال الشعار بصورتك */}
              <img 
                src="/logo.png" 
                alt="GMS Logo" 
                className="w-10 h-10 object-contain" 
              />
              GMS Platform
            </div>
            <p className="text-slate-500 text-sm">{content.footer.desc}</p>
          </div>
          
          <div className="text-slate-500 text-sm">
            {content.footer.rights}
          </div>
          
          <div className="flex gap-8 text-sm font-bold">
            {content.footer.links.map((link, i) => (
                <a key={i} href="#" className="text-slate-400 hover:text-white transition">{link}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}