'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle, XCircle, Clock, AlertCircle, FileText, ChevronDown, User } from 'lucide-react';

type TeamMember = {
  id: number;
  full_name: string;
  job_title: string;
  email: string;
  is_active: boolean;
  performance_score: number;
};

type Task = {
  id: number;
  title: string;
  status: string;
  review_status: string;
  users: { full_name: string }; // الفني الذي قام بالمهمة
  due_date: string;
  completed_at: string;
};

export default function ManagerDashboard() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ best: '', worst: '', totalCompleted: 0 });

  // افترضنا أن المستخدم الحالي هو المشرف (نأخذ الـ ID من الجلسة في الواقع)
  // هنا سنجلب أول مستخدم بصلاحية manager للتجربة، أو يمكنك وضع الـ ID الخاص بحساب المشرف عندك
  const getCurrentManagerId = async () => {
    // في الوضع الحقيقي: const { data: { user } } = await supabase.auth.getUser();
    // هنا مؤقتاً سنجلب أول مدير من القاعدة
    const { data } = await supabase.from('users').select('id').eq('role', 'manager').limit(1).single();
    return data?.id;
  };

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  const fetchSupervisorData = async () => {
    setLoading(true);
    const managerId = await getCurrentManagerId();
    if (!managerId) return;

    // 1. جلب أعضاء الفريق (الذين يتبعون هذا المشرف)
    const { data: teamData } = await supabase
      .from('users')
      .select('*')
      .eq('supervisor_id', managerId)
      .order('performance_score', { ascending: false }); // ترتيب بالأفضلية

    if (teamData) {
      setTeam(teamData);
      
      // حساب الأفضل والأسوأ بناءً على البيانات الحقيقية
      if (teamData.length > 0) {
        setStats({
            best: teamData[0].full_name, // الأول في الترتيب
            worst: teamData[teamData.length - 1].full_name, // الأخير
            totalCompleted: 0 // سنحسبه لاحقاً
        });
      }
    }

    // 2. جلب المهام التي تحتاج مراجعة (الخاصة بفريقه)
    // نجلب المهام التي حالتها Completed لكن المراجعة Pending Review
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*, users!inner(supervisor_id, full_name)') // !inner لفلترة المهام بناء على مشرف المستخدم
      .eq('users.supervisor_id', managerId)
      .eq('status', 'Completed')
      .eq('review_status', 'Pending Review');

    if (tasksData) setPendingReviews(tasksData);

    setLoading(false);
  };

  // دالة اعتماد المهمة
  const approveTask = async (taskId: number, workerId: number) => {
    // 1. تحديث حالة المهمة
    await supabase.from('tasks').update({ review_status: 'Approved' }).eq('id', taskId);
    
    // 2. تحديث نقاط الفني (زيادة الأداء) - منطق بسيط: زيادة 5 نقاط
    // في النظام المتكامل تكون معادلة أدق
    /* ملاحظة: معادلة الأداء الموجودة في قاعدة البيانات (SQL) التي كتبناها سابقاً
       ستقوم بتحديث النسبة تلقائياً بناءً على عدد المهام المنجزة، لذا لا داعي لتحديثها يدوياً هنا
       إلا إذا أردنا إضافة "نقاط إضافية". سنكتفي بتحديث حالة المهمة لتعمل المعادلة التلقائية.
    */

    fetchSupervisorData(); // تحديث الواجهة
    alert('تم اعتماد المهمة بنجاح ✅');
  };

  // دالة رفض المهمة
  const rejectTask = async (taskId: number) => {
    const feedback = prompt("سبب الرفض (سيظهر للفني):");
    if (!feedback) return;

    await supabase.from('tasks').update({ 
        status: 'In Progress', // إعادة المهمة للعمل
        review_status: 'Rejected',
        feedback: feedback 
    }).eq('id', taskId);

    fetchSupervisorData();
    alert('تم رفض المهمة وإعادتها للفني للتصحيح ↩️');
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">جاري تحميل بيانات الفريق...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8" dir="rtl">
      
      {/* الترويسة */}
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">لوحة المشرف الميداني</h1>
            <p className="text-slate-500 text-sm">إدارة الفرقة الفنية ومراجعة الإنجاز اليومي</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center min-w-[120px]">
                <div className="text-xs text-slate-400 mb-1">الأعلى إنجازاً 🏆</div>
                <div className="font-bold text-green-600 text-sm">{stats.best || '-'}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center min-w-[120px]">
                <div className="text-xs text-slate-400 mb-1">بحاجة لتحسين ⚠️</div>
                <div className="font-bold text-red-500 text-sm">{stats.worst || '-'}</div>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* العمود الأيمن: طلبات الاعتماد (Pending Approvals) */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <Clock className="text-amber-500" /> مهام تنتظر الاعتماد ({pendingReviews.length})
            </h2>

            {pendingReviews.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-100" />
                    لا توجد مهام معلقة، جميع الأعمال تم مراجعتها!
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingReviews.map(task => (
                        <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800">{task.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <User size={14} /> قام بها: <span className="font-bold text-blue-600">{task.users?.full_name}</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    تاريخ الرفع: {new Date(task.completed_at || Date.now()).toLocaleDateString('en-US')}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => rejectTask(task.id)}
                                    className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition"
                                >
                                    رفض ✕
                                </button>
                                <button 
                                    onClick={() => approveTask(task.id, 0)} // user id ليس ضرورياً هنا لأن الـ SQL سيحسب الأداء
                                    className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition"
                                >
                                    اعتماد ✓
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* العمود الأيسر: قائمة الفريق (Team Performance) */}
        <div className="space-y-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <Users className="text-blue-600" /> فريقي ({team.length})
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {team.map((member, index) => (
                    <div key={member.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-slate-800">{member.full_name}</div>
                                    <div className="text-xs text-slate-500">{member.job_title}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-blue-600 text-sm">{member.performance_score}%</div>
                                <div className="text-[10px] text-slate-400">أداء</div>
                            </div>
                        </div>
                        {/* شريط الأداء */}
                        <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${member.performance_score >= 90 ? 'bg-green-500' : member.performance_score >= 70 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                style={{ width: `${member.performance_score}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                
                {team.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        لم يتم ربط أي موظف بهذا المشرف بعد.
                        <br/>
                        (يتم الربط عن طريق السوبر أدمن)
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}