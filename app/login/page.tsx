'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, Mail, ArrowRight, Loader2, Globe, 
  ChevronLeft, ChevronRight, ShieldCheck, AlertCircle 
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // --- State Management ---
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // --- Dictionary ---
  const t = {
    ar: {
      brandSub: 'منصة تخطيط الموارد المؤسسية',
      welcomeTitle: 'مرحباً بك مجدداً',
      welcomeDesc: 'بوابة الوصول الآمن لإدارة المشاريع، العمليات الميدانية، والموارد البشرية.',
      signInTitle: 'تسجيل الدخول',
      signInDesc: 'أدخل بيانات الاعتماد للوصول إلى لوحة التحكم',
      emailLabel: 'البريد الإلكتروني الرسمي',
      emailPlace: 'name@gms-sa.com',
      passLabel: 'كلمة المرور',
      passPlace: '••••••••',
      forgot: 'نسيت كلمة المرور؟',
      submit: 'تسجيل الدخول',
      processing: 'جاري التحقق...',
      backHome: 'العودة للرئيسية',
      copyright: '© 2026 GMS Platform. جميع الحقوق محفوظة.',
      secure: 'بوابة دخول آمنة ومراقبة',
      errorEmpty: 'يرجى تعبئة جميع الحقول المطلوبة.',
      errorInvalid: 'بيانات الاعتماد غير صحيحة. حاول مرة أخرى.',
      support: 'الدعم الفني'
    },
    en: {
      brandSub: 'Enterprise Resource Planning',
      welcomeTitle: 'Welcome Back',
      welcomeDesc: 'Secure gateway for project management, field operations, and HR resources.',
      signInTitle: 'Sign In',
      signInDesc: 'Enter your credentials to access the dashboard',
      emailLabel: 'Official Email Address',
      emailPlace: 'name@gms-sa.com',
      passLabel: 'Password',
      passPlace: '••••••••',
      forgot: 'Forgot password?',
      submit: 'Sign In',
      processing: 'Verifying...',
      backHome: 'Back to Home',
      copyright: '© 2026 GMS Platform. All rights reserved.',
      secure: 'Secure & Monitored Gateway',
      errorEmpty: 'Please fill in all required fields.',
      errorInvalid: 'Invalid credentials. Please try again.',
      support: 'Technical Support'
    }
  };

  const content = t[lang];
  const isRTL = lang === 'ar';

  // --- Handlers ---
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Basic Validation
    if (!formData.email || !formData.password) {
      setError(content.errorEmpty);
      setLoading(false);
      return;
    }

    // 2. Simulated API Call (Real Authentication Logic Placeholder)
    try {
      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1500));

      // محاكاة التحقق (يمكنك استبدال هذا بربط API حقيقي)
      // For Demo: Accept any email containing '@' and password length > 4
      if (formData.email.includes('@') && formData.password.length > 4) {
        
        // ✅ التوجيه الذكي: دائماً إلى الداشبورد
        // النظام الداخلي (Middleware) هو المسؤول عن توجيه المستخدم 
        // للصفحة المناسبة بناءً على دوره (Manager/Engineer/Admin)
        router.push('/dashboard'); 
        
      } else {
        throw new Error('Invalid Credentials');
      }
    } catch (err) {
      setError(content.errorInvalid);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Container */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex relative z-10 flex-col md:flex-row min-h-[600px]">
        
        {/* --- Left Side (Brand Panel) --- */}
        <div className="w-full md:w-5/12 bg-slate-900 relative flex flex-col justify-between p-10 text-white overflow-hidden">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          {/* Logo Area */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/50">G</div>
              <span className="text-2xl font-black tracking-tight">GMS Platform</span>
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{content.brandSub}</p>
          </div>

          {/* Welcome Message */}
          <div className="relative z-10 my-12">
            <h2 className="text-3xl font-bold mb-4 leading-tight">{content.welcomeTitle}</h2>
            <p className="text-slate-300 leading-relaxed text-sm opacity-90">
              {content.welcomeDesc}
            </p>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500"/>
            <span>{content.secure}</span>
          </div>
        </div>

        {/* --- Right Side (Form Panel) --- */}
        <div className="w-full md:w-7/12 p-10 md:p-12 bg-white flex flex-col">
          
          {/* Top Controls (Back & Lang) */}
          <div className="flex justify-between items-center mb-10">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition font-medium group"
            >
              {isRTL ? <ChevronRight size={16} className="group-hover:-mr-1 transition-all"/> : <ChevronLeft size={16} className="group-hover:-ml-1 transition-all"/>}
              {content.backHome}
            </button>

            <button 
              onClick={toggleLang} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition border border-slate-200"
            >
              <Globe size={14}/> {isRTL ? 'English' : 'عربي'}
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{content.signInTitle}</h3>
            <p className="text-slate-500 text-sm">{content.signInDesc}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{content.emailLabel}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition rtl:right-4 rtl:left-auto" />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder={content.emailPlace}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition rtl:pr-12 rtl:pl-4 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{content.passLabel}</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">{content.forgot}</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition rtl:right-4 rtl:left-auto" />
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={content.passPlace}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition rtl:pr-12 rtl:pl-4 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>{content.processing}</span>
                  </>
                ) : (
                  <>
                    <span>{content.submit}</span>
                    <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Form Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>{content.copyright}</span>
            <a href="#" className="hover:text-slate-600 transition">{content.support}</a>
          </div>

        </div>
      </div>
    </div>
  );
}