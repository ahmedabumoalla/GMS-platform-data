'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // States للبيانات
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. طلب اتصال بالسيرفر (API Call)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'فشل تسجيل الدخول، تأكد من البيانات');
      }

      // 2. التوجيه الذكي بناءً على الصلاحية القادمة من قاعدة البيانات
      // ملاحظة: تأكدنا أن الحروف صغيرة لتطابق قاعدة البيانات
      const role = data.user.role; 

      switch (role) {
        case 'super_admin':
          router.push('/admin');
          break;
        case 'manager':
          router.push('/manager');
          break;
        case 'admin':
          // يمكنك توجيه الأدمن لصفحة خاصة أو نفس لوحة السوبر أدمن بصلاحيات أقل
          router.push('/admin'); 
          break;
        case 'employee':
          router.push('/employee');
          break;
        default:
          // في حال كان الدور غير معروف، يوجه للصفحة الرئيسية
          router.push('/'); 
      }

    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-900 z-0"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 z-0"></div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex relative z-10 flex-col md:flex-row">
        
        {/* Left Side: Brand & Welcome */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-900 to-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-[50px] opacity-30"></div>
          
          <div>
            <div className="text-2xl font-black tracking-tighter mb-2">
              GMS<span className="text-blue-400">Platform</span>
            </div>
            <p className="text-blue-200 text-sm">Enterprise Resource Planning</p>
          </div>

          <div className="my-12">
            <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-blue-200 leading-relaxed">
              Access your dashboard to manage fleets, monitor cable testing projects, and track workforce performance in real-time.
            </p>
          </div>

          <div className="text-xs text-blue-400">
            © 2026 GMS Platform. Secure Access.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-12 bg-white">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-slate-800">Employee Login</h3>
            <p className="text-slate-500 mt-2">Please enter your credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@gms-platform.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  required 
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  required 
                />
              </div>
              <div className="flex justify-end">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Forgot Password?</a>
              </div>
            </div>

            {/* Error Message Display Area */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg animate-pulse">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 transition">
              ← Back to Homepage
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}