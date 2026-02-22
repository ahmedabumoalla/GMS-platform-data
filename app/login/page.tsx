'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Lock, UserCircle, ArrowRight, Loader2, Globe, 
  ChevronLeft, ChevronRight, ShieldCheck, AlertCircle 
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ identifier: '', password: '' });

  const isRTL = lang === 'ar';
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let loginEmail = formData.identifier.trim();

      if (!loginEmail.includes('@')) {
        const res = await fetch('/api/auth/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: loginEmail }),
        });
        
        const json = await res.json();
        
        if (res.ok && json.email) {
           loginEmail = json.email;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: formData.password,
      });

      if (authError) throw authError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      // Corrected Routing Logic
      if (profile?.role === 'technician') {
        router.push('/dashboard/technician');
      } else {
        router.push('/dashboard');
      }

    } catch (err: any) {
      console.error('Login Error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError("Invalid credentials, please check your input.");
      } else {
        setError("System error, please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans ${isRTL ? 'dir-rtl' : 'dir-ltr'}`}>
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex relative z-10 flex-col md:flex-row min-h-[600px]">
        
        {/* Right Side (Form) */}
        <div className="w-full md:w-7/12 p-10 md:p-12 bg-white flex flex-col justify-center">
          
          <div className="flex justify-between items-center mb-10">
            <button onClick={() => router.push('/')} className="text-sm text-slate-500 hover:text-slate-800 font-medium transition flex items-center gap-1">
              {isRTL ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
              {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
            <button onClick={toggleLang} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 hover:bg-slate-200 transition">
              <Globe size={14} className="inline mx-1"/> {isRTL ? 'English' : 'عربي'}
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-3xl font-black text-slate-900 mb-2">{isRTL ? 'تسجيل الدخول' : 'Sign In'}</h3>
            <p className="text-slate-500 text-sm">
                {isRTL ? 'أدخل بياناتك للوصول إلى لوحة التحكم' : 'Enter your credentials to access the dashboard'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{isRTL ? 'المعرف (إيميل / جوال / يوزر)' : 'Identifier'}</label>
              <div className="relative group">
                <UserCircle className="absolute top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition ltr:left-4 rtl:right-4" />
                <input 
                  required 
                  type="text" 
                  value={formData.identifier}
                  onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                  className={`w-full py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition font-bold text-black placeholder:font-normal placeholder:text-slate-400 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                  placeholder={isRTL ? "name@company.com / 05xxxxxxxx" : "Email, Phone, or Username"} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{isRTL ? 'كلمة المرور' : 'Password'}</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-bold">{isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</a>
              </div>
              <div className="relative group">
                <Lock className="absolute top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition ltr:left-4 rtl:right-4" />
                <input 
                  required 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition font-bold text-black placeholder:font-normal placeholder:text-slate-400 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <span>{isRTL ? 'دخول آمن' : 'Secure Login'}</span>
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* --- Left Side (Logo and Welcome) --- */}
        <div className="w-full md:w-5/12 bg-slate-900 relative flex flex-col justify-between p-10 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
            <div className="mb-8 p-4 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 shadow-2xl">
                <img src="/logo.png" alt="GMS Logo" className="w-32 h-auto object-contain drop-shadow-md" />
            </div>

            <h2 className="text-3xl font-black mb-4 leading-tight">
              {isRTL ? 'مرحباً بك مجدداً' : 'Welcome Back'}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs mx-auto opacity-90">
              {isRTL 
                ? 'منصة GMS المتكاملة لإدارة الموارد والعمليات. نتمنى لك يوم عمل مثمر.' 
                : 'GMS Integrated Platform for Resource and Operations Management. Have a productive day.'}
            </p>
          </div>

          <div className="relative z-10 text-xs text-slate-500 flex items-center justify-center gap-2 mt-auto">
            <ShieldCheck size={14} className="text-emerald-500"/>
            <span>{isRTL ? 'بوابة دخول آمنة ومراقبة' : 'Secure & Monitored Gateway'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}