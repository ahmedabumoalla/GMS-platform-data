'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Wallet, Briefcase, Activity, CheckCircle, 
  Clock, AlertTriangle, TrendingUp, MapPin, Calendar, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

// --- Types ---
type UserRole = 'super_admin' | 'project_manager' | 'financial_advisor' | 'technician';

type DashboardStats = {
  totalProjects: number;
  activeTasks: number;
  teamMembers: number;
  pendingRequests: number;
  revenue: number;
  myTasks?: number;      // خاص للموظف
  myAttendance?: string; // خاص للموظف
  nextDeadline?: string; // خاص للموظف
};

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>('super_admin'); // 👈 غيّر هذا يدوياً للتجربة ('technician' أو 'financial_advisor')
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // محاكاة جلب البيانات حسب الدور
    setTimeout(() => {
      setStats({
        totalProjects: 12,
        activeTasks: 45,
        teamMembers: 28,
        pendingRequests: 3,
        revenue: 1500000,
        myTasks: 5,
        myAttendance: '07:55 ص',
        nextDeadline: 'الخميس، 2 مساءً'
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-400 animate-pulse">جاري تحميل لوحة التحكم...</div>;

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* 1. ترويسة ترحيبية */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            صباح الخير، <span className="text-blue-600">أحمد!</span> ☀️
          </h1>
          <p className="text-slate-500 mt-2">
            {role === 'technician' 
              ? "لديك 5 مهام معلقة اليوم. استمر في العمل الرائع!" 
              : "إليك نظرة عامة على أداء شركتك لهذا اليوم."}
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-left bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">تاريخ اليوم</div>
          <div className="font-bold text-slate-800 text-lg">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* 2. شبكة الإحصائيات (ديناميكية حسب الدور) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* === العرض: المدراء والمشرفين === */}
        {['super_admin', 'project_manager'].includes(role) && (
          <>
            <StatCard title="إجمالي المشاريع" value={stats?.totalProjects} icon={Briefcase} color="blue" trend="+2 جديد" />
            <StatCard title="القوى العاملة النشطة" value={stats?.teamMembers} icon={Users} color="purple" />
            <StatCard title="إجمالي الإيرادات" value="1.5 مليون ر.س" icon={Wallet} color="emerald" trend="+12%" />
            <StatCard title="تنبيهات النظام" value={stats?.pendingRequests} icon={AlertTriangle} color="amber" />
          </>
        )}

        {/* === العرض: المستشار المالي === */}
        {role === 'financial_advisor' && (
          <>
            <StatCard title="النقد الوارد" value="2.1 مليون ر.س" icon={TrendingUp} color="emerald" />
            <StatCard title="النقد الصادر" value="600 ألف ر.س" icon={Wallet} color="red" />
            <StatCard title="فواتير معلقة" value="12" icon={AlertTriangle} color="amber" />
            <StatCard title="صافي الربح" value="1.5 مليون ر.س" icon={Activity} color="blue" />
          </>
        )}

        {/* === العرض: الفني / الموظف === */}
        {role === 'technician' && (
          <>
            <StatCard title="مهامي" value={stats?.myTasks} icon={CheckCircle} color="blue" />
            <StatCard title="وقت الحضور" value={stats?.myAttendance} icon={Clock} color="green" />
            <StatCard title="الأداء" value="94%" icon={Activity} color="purple" />
            <StatCard title="الموعد النهائي" value={stats?.nextDeadline} icon={Calendar} color="red" />
          </>
        )}
      </div>

      {/* 3. محتوى لوحة التحكم الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* العمود الأيمن (المحتوى) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* معاينة الخريطة (للمدراء فقط) */}
          {['super_admin', 'project_manager'].includes(role) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <MapPin className="text-blue-500" size={20}/> التتبع الميداني المباشر
                </h3>
                <Link href="/dashboard/map" className="flex items-center gap-1 text-sm text-blue-600 font-bold hover:gap-2 transition-all">
                  الخريطة الكاملة <ArrowLeft size={16}/>
                </Link>
              </div>
              
              {/* عنصر مرئي للخريطة (وهمي) */}
              <div className="h-64 bg-slate-100 rounded-2xl border border-slate-100 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/46.6753,24.7136,11,0/800x400?access_token=YOUR_TOKEN')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full text-slate-500 text-sm font-bold shadow-sm">
                    معاينة الخريطة التفاعلية
                 </div>
              </div>
            </div>
          )}

          {/* قائمة المهام (مختلفة للجميع) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Briefcase className="text-purple-500" size={20}/> 
                {role === 'technician' ? 'المهام الموكلة إلي' : 'آخر تحديثات المشاريع'}
              </h3>
              <Link href="/dashboard/tasks" className="flex items-center gap-1 text-sm text-purple-600 font-bold hover:gap-2 transition-all">
                عرض الكل <ArrowLeft size={16}/>
              </Link>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${item === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {item === 1 ? <CheckCircle size={20}/> : <Clock size={20}/>}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm mb-0.5">صيانة المولد - المنطقة {item}</div>
                      <div className="text-xs text-slate-400 font-medium">مسندة إلى: {role === 'technician' ? 'أنت' : 'سعيد القحطاني'}</div>
                    </div>
                  </div>
                  <div className="text-left">
                     <span className={`text-xs font-bold px-3 py-1 rounded-lg ${item === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                       {item === 1 ? 'مكتمل' : 'قيد التنفيذ'}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* العمود الأيسر (إجراءات سريعة وتنبيهات) */}
        <div className="space-y-8">
          
          {/* إجراءات سريعة (للمدراء فقط) */}
          {['super_admin', 'project_manager'].includes(role) && (
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl shadow-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
              
              <h3 className="font-bold text-lg mb-6 relative z-10">إجراءات سريعة</h3>
              <div className="space-y-3 relative z-10">
                <QuickActionButton href="/dashboard/contracts" icon={Briefcase} label="عقد جديد" />
                <QuickActionButton href="/dashboard/users" icon={Users} label="إضافة موظف" />
                <QuickActionButton href="/dashboard/finance" icon={Wallet} label="تسجيل معاملة" />
              </div>
            </div>
          )}

          {/* لوحة الإشعارات */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20}/> إشعارات النظام
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-800 leading-relaxed">
                <strong>تنبيه إداري:</strong> تم جدولة التدقيق المالي الشهري ليوم الأحد القادم. يرجى التأكد من صحة جميع السجلات.
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800 leading-relaxed">
                <strong>تحديث:</strong> تمت إضافة ميزات جديدة لوحدة التتبع على الخريطة. تحقق منها الآن!
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// --- مكونات مساعدة ---

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3.5 rounded-2xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">{trend}</span>}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-900">{value}</h4>
      </div>
    </div>
  );
}

function QuickActionButton({ href, icon: Icon, label }: any) {
  return (
    <Link href={href} className="w-full py-3.5 px-5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition flex items-center justify-between group backdrop-blur-sm border border-white/5">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-slate-300 group-hover:text-white transition"/>
        <span>{label}</span>
      </div>
      <ArrowLeft size={16} className="text-slate-500 group-hover:text-white translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100"/>
    </Link>
  );
}