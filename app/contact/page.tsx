'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, Mail, MapPin, Send, Globe, LayoutDashboard, 
  ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, 
  CheckCircle2, Loader2, MessageSquare, Clock, ShieldCheck 
} from 'lucide-react';

export default function ContactPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const isRTL = lang === 'ar';
  const DirectionalChevron = isRTL ? ChevronLeft : ChevronRight;
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;

  const t = {
    ar: {
      nav: { home: 'الرئيسية', services: 'الخدمات', login: 'بوابة الموظفين' },
      header: {
        badge: 'دعم فني واستشارات 24/7',
        title: 'ابدأ محادثة مع خبرائنا',
        desc: 'سواء كان لديك مشروع ضخم أو استفسار تقني، فريقنا الهندسي جاهز لتقديم الحلول والاستشارات المباشرة.'
      },
      form: {
        title: 'أرسل استفسارك',
        name: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        subject: 'الموضوع / نوع المشروع',
        message: 'التفاصيل',
        btn: 'إرسال الرسالة',
        sending: 'جاري الإرسال...',
        success: 'تم استلام رسالتك بنجاح. سنتواصل معك قريباً.'
      },
      info: {
        title: 'بيانات التواصل',
        hq: 'المقر الرئيسي',
        hq_desc: 'طريق الملك فهد، العليا، الرياض، المملكة العربية السعودية',
        phone: 'الهاتف الموحد',
        phone_desc: '+966 11 000 0000',
        email: 'البريد الإلكتروني',
        email_desc: 'info@gms-platform.com',
        hours: 'ساعات العمل',
        hours_desc: 'الأحد - الخميس: 8:00 ص - 6:00 م'
      },
      footer: '© 2026 منصة GMS. جميع الحقوق محفوظة.'
    },
    en: {
      nav: { home: 'Home', services: 'Services', login: 'Employee Portal' },
      header: {
        badge: '24/7 Support & Consultation',
        title: 'Start a Conversation',
        desc: 'Whether you have a massive project or a technical inquiry, our engineering team is ready to provide direct solutions and consultation.'
      },
      form: {
        title: 'Send Your Inquiry',
        name: 'Full Name',
        email: 'Email Address',
        phone: 'Phone Number',
        subject: 'Subject / Project Type',
        message: 'Details',
        btn: 'Send Message',
        sending: 'Sending...',
        success: 'Message received successfully. We will contact you soon.'
      },
      info: {
        title: 'Contact Info',
        hq: 'Headquarters',
        hq_desc: 'King Fahd Rd, Olaya, Riyadh, Saudi Arabia',
        phone: 'Unified Phone',
        phone_desc: '+966 11 000 0000',
        email: 'Email Address',
        email_desc: 'info@gms-platform.com',
        hours: 'Working Hours',
        hours_desc: 'Sun - Thu: 8:00 AM - 6:00 PM'
      },
      footer: '© 2026 GMS Platform. All rights reserved.'
    }
  };

  const content = t[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // محاكاة إرسال البيانات
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div className={`min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-blue-500 selection:text-white ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* --- Navbar --- */}
      <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <span className="font-black text-white text-lg">G</span>
            </div>
            <span className="text-lg font-black text-white tracking-tight">GMS Platform</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="flex items-center gap-2 text-slate-300 hover:text-white font-bold transition px-3 py-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 text-sm">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <Link 
              href="/login" 
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" /> {content.nav.login}
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="pt-32 pb-20 relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>
        <div className={`absolute top-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] -z-10 ${isRTL ? 'right-0' : 'left-0'}`}></div>

        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-bold uppercase mb-6">
              <MessageSquare className="w-3 h-3" /> {content.header.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              {content.header.title}
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              {content.header.desc}
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Contact Info & Map (Left Side) */}
            <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
              
              {/* Info Cards */}
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">{content.info.title}</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0"><MapPin size={20}/></div>
                            <div>
                                <div className="text-sm font-bold text-white mb-1">{content.info.hq}</div>
                                <div className="text-sm text-slate-400 leading-relaxed">{content.info.hq_desc}</div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0"><Phone size={20}/></div>
                            <div>
                                <div className="text-sm font-bold text-white mb-1">{content.info.phone}</div>
                                <div className="text-sm text-slate-400 font-mono" dir="ltr">{content.info.phone_desc}</div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0"><Mail size={20}/></div>
                            <div>
                                <div className="text-sm font-bold text-white mb-1">{content.info.email}</div>
                                <div className="text-sm text-slate-400 font-mono">{content.info.email_desc}</div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0"><Clock size={20}/></div>
                            <div>
                                <div className="text-sm font-bold text-white mb-1">{content.info.hours}</div>
                                <div className="text-sm text-slate-400">{content.info.hours_desc}</div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-slate-800 rounded-3xl h-64 w-full relative overflow-hidden group border border-slate-700">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity"></div>
                <div className="absolute inset-0 bg-blue-900/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-white/20 transition flex items-center gap-2">
                        <MapPin size={16}/> {lang === 'ar' ? 'عرض الموقع على الخريطة' : 'View on Google Maps'}
                    </button>
                </div>
              </div>

            </div>

            {/* Contact Form (Right Side) */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                
                {sent ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40}/>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{lang === 'ar' ? 'تم الإرسال بنجاح' : 'Sent Successfully'}</h3>
                        <p className="text-slate-400 mb-8">{content.form.success}</p>
                        <button onClick={() => setSent(false)} className="text-blue-400 font-bold hover:text-blue-300 text-sm">
                            {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send another message'}
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                            {content.form.title}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{content.form.name}</label>
                                    <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{content.form.phone}</label>
                                    <input required type="tel" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition text-left" dir="ltr" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{content.form.email}</label>
                                <input required type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{content.form.subject}</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition cursor-pointer appearance-none">
                                    <option>{lang === 'ar' ? 'استفسار عام' : 'General Inquiry'}</option>
                                    <option>{lang === 'ar' ? 'طلب عرض سعر' : 'Request Quotation'}</option>
                                    <option>{lang === 'ar' ? 'دعم فني' : 'Technical Support'}</option>
                                    <option>{lang === 'ar' ? 'شراكة أعمال' : 'Business Partnership'}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{content.form.message}</label>
                                <textarea required rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition resize-none"></textarea>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> {content.form.btn}</>}
                            </button>
                        </form>
                    </>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-slate-950 py-10 border-t border-slate-900 text-center">
        <p className="text-slate-500 text-sm">{content.footer}</p>
      </footer>

    </div>
  );
}